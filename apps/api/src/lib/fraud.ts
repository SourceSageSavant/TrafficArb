import { createHmac } from 'crypto';
import type { Request } from 'express';
import { prisma } from '../index.js';
import { logger } from './logger.js';

/**
 * Device Fingerprint from client
 */
export interface DeviceFingerprint {
    userAgent: string;
    language: string;
    languages: string[];
    platform: string;
    screenWidth: number;
    screenHeight: number;
    timezone: string;
    timezoneOffset: number;
    hardwareConcurrency: number;
    deviceMemory: number | null;
    maxTouchPoints: number;
    canvasHash: string;
    webglVendor: string | null;
    webglRenderer: string | null;
    audioHash: string;
    fontsSample: string[];
    telegramWebApp: boolean;
    telegramPlatform: string | null;
    fingerprintHash: string;
}

/**
 * Fraud signals detected
 */
export interface FraudSignals {
    // Device signals
    isNewDevice: boolean;
    deviceCount: number;
    deviceSwitchRate: number; // devices per day

    // IP signals
    isVpnOrProxy: boolean;
    ipCountryMismatch: boolean;
    ipChangeRate: number; // IPs per day

    // Behavior signals
    taskCompletionRate: number; // tasks per minute
    unusuallyFastCompletion: boolean;
    suspiciousPattern: boolean;

    // Referral signals
    selfReferralSuspect: boolean;
    referralFarmingSuspect: boolean;

    // Risk assessment
    riskScore: number; // 0-100
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    flags: string[];
}

/**
 * Risk score thresholds
 */
const RISK_THRESHOLDS = {
    LOW: 30,
    MEDIUM: 50,
    HIGH: 70,
    CRITICAL: 90,
};

/**
 * Fraud detection weights
 */
const FRAUD_WEIGHTS = {
    newDevice: 5,
    multipleDevices: 10,
    highDeviceSwitchRate: 20,
    vpnDetected: 15,
    countryMismatch: 10,
    highIpChangeRate: 15,
    fastCompletion: 25,
    suspiciousPattern: 30,
    selfReferral: 40,
    referralFarming: 35,
};

/**
 * Analyze user for fraud signals
 */
export async function analyzeUserFraud(
    userId: string,
    fingerprint: DeviceFingerprint,
    ipAddress: string
): Promise<FraudSignals> {
    const signals: FraudSignals = {
        isNewDevice: false,
        deviceCount: 0,
        deviceSwitchRate: 0,
        isVpnOrProxy: false,
        ipCountryMismatch: false,
        ipChangeRate: 0,
        taskCompletionRate: 0,
        unusuallyFastCompletion: false,
        suspiciousPattern: false,
        selfReferralSuspect: false,
        referralFarmingSuspect: false,
        riskScore: 0,
        riskLevel: 'LOW',
        flags: [],
    };

    try {
        // Get user with history
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                referrer: true,
                referrals: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!user) {
            signals.riskScore = 100;
            signals.riskLevel = 'CRITICAL';
            signals.flags.push('USER_NOT_FOUND');
            return signals;
        }

        // Check device history
        const deviceHistory = await getDeviceHistory(userId);
        signals.isNewDevice = !deviceHistory.includes(fingerprint.fingerprintHash);
        signals.deviceCount = new Set(deviceHistory).size + (signals.isNewDevice ? 1 : 0);

        if (signals.deviceCount > 3) {
            signals.flags.push('MULTIPLE_DEVICES');
        }

        // Calculate device switch rate (last 24h)
        const recentDevices = await getRecentDeviceChanges(userId, 24);
        signals.deviceSwitchRate = recentDevices.length;

        if (signals.deviceSwitchRate > 3) {
            signals.flags.push('HIGH_DEVICE_SWITCH_RATE');
        }

        // Check VPN/Proxy (simplified - in production use IP intelligence API)
        signals.isVpnOrProxy = await checkVpnProxy(ipAddress);

        if (signals.isVpnOrProxy) {
            signals.flags.push('VPN_PROXY_DETECTED');
        }

        // Check IP change rate
        const ipHistory = await getIpHistory(userId, 24);
        signals.ipChangeRate = new Set(ipHistory).size;

        if (signals.ipChangeRate > 5) {
            signals.flags.push('HIGH_IP_CHANGE_RATE');
        }

        // Check task completion rate
        const recentTasks = await getRecentTaskCompletions(userId, 60); // last 60 mins
        signals.taskCompletionRate = recentTasks.length / 60; // per minute

        if (signals.taskCompletionRate > 0.5) { // More than 1 task every 2 minutes
            signals.unusuallyFastCompletion = true;
            signals.flags.push('UNUSUALLY_FAST_COMPLETION');
        }

        // Check for suspicious patterns
        signals.suspiciousPattern = await detectSuspiciousPatterns(userId);

        if (signals.suspiciousPattern) {
            signals.flags.push('SUSPICIOUS_PATTERN');
        }

        // Check self-referral
        if (user.referrer) {
            signals.selfReferralSuspect = await checkSelfReferral(userId, user.referrerId!, fingerprint, ipAddress);

            if (signals.selfReferralSuspect) {
                signals.flags.push('SELF_REFERRAL_SUSPECT');
            }
        }

        // Check referral farming
        if (user.referrals.length > 0) {
            signals.referralFarmingSuspect = await checkReferralFarming(userId, user.referrals);

            if (signals.referralFarmingSuspect) {
                signals.flags.push('REFERRAL_FARMING_SUSPECT');
            }
        }

        // Calculate risk score
        signals.riskScore = calculateRiskScore(signals);
        signals.riskLevel = getRiskLevel(signals.riskScore);

        // Store device fingerprint for future reference
        await storeDeviceFingerprint(userId, fingerprint, ipAddress);

        // Log high-risk activities
        if (signals.riskScore >= RISK_THRESHOLDS.HIGH) {
            logger.warn({
                userId,
                riskScore: signals.riskScore,
                flags: signals.flags,
            }, 'High fraud risk detected');

            // Store fraud alert
            await storeFraudAlert(userId, signals);
        }

        return signals;
    } catch (error) {
        logger.error({ error, userId }, 'Error analyzing fraud signals');
        return signals;
    }
}

/**
 * Calculate risk score based on signals
 */
function calculateRiskScore(signals: FraudSignals): number {
    let score = 0;

    if (signals.isNewDevice && signals.deviceCount > 1) {
        score += FRAUD_WEIGHTS.newDevice;
    }

    if (signals.deviceCount > 3) {
        score += FRAUD_WEIGHTS.multipleDevices;
    }

    if (signals.deviceSwitchRate > 3) {
        score += FRAUD_WEIGHTS.highDeviceSwitchRate;
    }

    if (signals.isVpnOrProxy) {
        score += FRAUD_WEIGHTS.vpnDetected;
    }

    if (signals.ipCountryMismatch) {
        score += FRAUD_WEIGHTS.countryMismatch;
    }

    if (signals.ipChangeRate > 5) {
        score += FRAUD_WEIGHTS.highIpChangeRate;
    }

    if (signals.unusuallyFastCompletion) {
        score += FRAUD_WEIGHTS.fastCompletion;
    }

    if (signals.suspiciousPattern) {
        score += FRAUD_WEIGHTS.suspiciousPattern;
    }

    if (signals.selfReferralSuspect) {
        score += FRAUD_WEIGHTS.selfReferral;
    }

    if (signals.referralFarmingSuspect) {
        score += FRAUD_WEIGHTS.referralFarming;
    }

    return Math.min(score, 100);
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): FraudSignals['riskLevel'] {
    if (score >= RISK_THRESHOLDS.CRITICAL) return 'CRITICAL';
    if (score >= RISK_THRESHOLDS.HIGH) return 'HIGH';
    if (score >= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM';
    return 'LOW';
}

/**
 * Get device history for user
 */
async function getDeviceHistory(userId: string): Promise<string[]> {
    // In production, query from a device_sessions table
    // For now, return empty array (will be populated over time)
    return [];
}

/**
 * Get recent device changes
 */
async function getRecentDeviceChanges(userId: string, hours: number): Promise<string[]> {
    return [];
}

/**
 * Get IP history
 */
async function getIpHistory(userId: string, hours: number): Promise<string[]> {
    return [];
}

/**
 * Get recent task completions
 */
async function getRecentTaskCompletions(userId: string, minutes: number): Promise<any[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const tasks = await prisma.task.findMany({
        where: {
            userId,
            status: 'COMPLETED',
            completedAt: { gte: since },
        },
    });

    return tasks;
}

/**
 * Check for VPN/Proxy (simplified)
 */
async function checkVpnProxy(ipAddress: string): Promise<boolean> {
    // In production, use an IP intelligence API like:
    // - IPQualityScore
    // - IP2Location
    // - MaxMind

    // For now, check basic patterns
    const vpnRanges = [
        '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.',
        '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
        '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
    ];

    for (const range of vpnRanges) {
        if (ipAddress.startsWith(range)) return true;
    }

    return false;
}

/**
 * Detect suspicious patterns
 */
async function detectSuspiciousPatterns(userId: string): Promise<boolean> {
    // Check for patterns like:
    // - All tasks completed in exact same duration
    // - Tasks completed at inhuman speeds
    // - Repetitive behavior patterns

    const recentTasks = await prisma.task.findMany({
        where: {
            userId,
            status: 'COMPLETED',
        },
        orderBy: { completedAt: 'desc' },
        take: 20,
    });

    if (recentTasks.length < 5) return false;

    // Check for tasks completed too quickly
    let fastCompletions = 0;
    for (const task of recentTasks) {
        if (task.completedAt && task.startedAt) {
            const duration = task.completedAt.getTime() - task.startedAt.getTime();
            if (duration < 5000) { // Less than 5 seconds
                fastCompletions++;
            }
        }
    }

    return fastCompletions > recentTasks.length * 0.5;
}

/**
 * Check for self-referral
 */
async function checkSelfReferral(
    userId: string,
    referrerId: string,
    fingerprint: DeviceFingerprint,
    ipAddress: string
): Promise<boolean> {
    // Check if user and referrer share same characteristics
    // This would compare stored fingerprints and IPs

    // For now, return false (needs device history to compare)
    return false;
}

/**
 * Check for referral farming
 */
async function checkReferralFarming(userId: string, referrals: any[]): Promise<boolean> {
    if (referrals.length < 3) return false;

    // Check patterns in referrals:
    // - All referrals joined within short time
    // - Similar device fingerprints
    // - Similar IP addresses

    const joinTimes = referrals.map(r => new Date(r.createdAt).getTime());
    const avgGap = joinTimes.reduce((sum, t, i) => {
        if (i === 0) return 0;
        return sum + (joinTimes[i - 1] - t);
    }, 0) / (joinTimes.length - 1);

    // If average gap is less than 1 minute, suspicious
    if (avgGap < 60000) return true;

    return false;
}

/**
 * Store device fingerprint
 */
async function storeDeviceFingerprint(
    userId: string,
    fingerprint: DeviceFingerprint,
    ipAddress: string
): Promise<void> {
    // In production, store to a device_sessions table
    // For now, log it
    logger.debug({
        userId,
        fingerprintHash: fingerprint.fingerprintHash,
        ip: ipAddress,
    }, 'Device fingerprint recorded');
}

/**
 * Store fraud alert
 */
async function storeFraudAlert(userId: string, signals: FraudSignals): Promise<void> {
    // In production, store to fraud_alerts table
    logger.warn({
        userId,
        riskScore: signals.riskScore,
        riskLevel: signals.riskLevel,
        flags: signals.flags,
    }, 'Fraud alert created');
}

/**
 * Get IP address from request
 */
export function getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
        return ips[0].trim();
    }
    return req.socket.remoteAddress || '0.0.0.0';
}

/**
 * Hash fingerprint for storage
 */
export function hashFingerprint(fingerprint: DeviceFingerprint): string {
    const data = JSON.stringify({
        canvas: fingerprint.canvasHash,
        webgl: `${fingerprint.webglVendor}-${fingerprint.webglRenderer}`,
        audio: fingerprint.audioHash,
        screen: `${fingerprint.screenWidth}x${fingerprint.screenHeight}`,
    });

    return createHmac('sha256', 'fingerprint-secret')
        .update(data)
        .digest('hex');
}
