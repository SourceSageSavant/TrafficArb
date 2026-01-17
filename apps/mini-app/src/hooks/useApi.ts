'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useFingerprint } from '@/hooks/useFingerprint';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Helper to make authenticated API requests
 */
async function apiRequest<T>(
    endpoint: string,
    token: string | null,
    fingerprint: string | null,
    options: RequestInit = {}
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (fingerprint) {
        headers['X-Device-Fingerprint'] = fingerprint;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// ============================================================================
// User Hooks
// ============================================================================

export function useUserProfile() {
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useQuery({
        queryKey: ['user', 'profile'],
        queryFn: () => apiRequest('/api/users/me', token, getFingerprintHeader()),
        enabled: !!token,
    });
}

export function useUserStats() {
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useQuery({
        queryKey: ['user', 'stats'],
        queryFn: () => apiRequest('/api/users/me/stats', token, getFingerprintHeader()),
        enabled: !!token,
    });
}

export function useClaimBonus() {
    const queryClient = useQueryClient();
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useMutation({
        mutationFn: async () => {
            return apiRequest('/api/users/me/daily-claim', token, getFingerprintHeader(), {
                method: 'POST',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
}

// ============================================================================
// Offers Hooks
// ============================================================================

interface OffersParams {
    category?: string;
    limit?: number;
    offset?: number;
}

export function useOffers(params: OffersParams = {}) {
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    const queryString = query.toString();
    const endpoint = `/api/offers${queryString ? `?${queryString}` : ''}`;

    return useQuery({
        queryKey: ['offers', params],
        queryFn: () => apiRequest(endpoint, token, getFingerprintHeader()),
        enabled: !!token,
    });
}

export function useOffer(offerId: string) {
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useQuery({
        queryKey: ['offer', offerId],
        queryFn: () => apiRequest(`/api/offers/${offerId}`, token, getFingerprintHeader()),
        enabled: !!token && !!offerId,
    });
}

// ============================================================================
// Tasks Hooks
// ============================================================================

export function useUserTasks() {
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useQuery({
        queryKey: ['tasks'],
        queryFn: () => apiRequest('/api/tasks', token, getFingerprintHeader()),
        enabled: !!token,
    });
}

export function useStartTask() {
    const queryClient = useQueryClient();
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useMutation({
        mutationFn: async (offerId: string) => {
            return apiRequest(`/api/tasks/${offerId}/start`, token, getFingerprintHeader(), {
                method: 'POST',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['offers'] });
        },
    });
}

// ============================================================================
// Wallet Hooks
// ============================================================================

export function useWalletBalance() {
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useQuery({
        queryKey: ['wallet', 'balance'],
        queryFn: () => apiRequest('/api/wallet/balance', token, getFingerprintHeader()),
        enabled: !!token,
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

export function useTransactions(limit = 20, offset = 0) {
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useQuery({
        queryKey: ['wallet', 'transactions', limit, offset],
        queryFn: () => apiRequest(`/api/wallet/transactions?limit=${limit}&offset=${offset}`, token, getFingerprintHeader()),
        enabled: !!token,
    });
}

export function useRequestWithdrawal() {
    const queryClient = useQueryClient();
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useMutation({
        mutationFn: async ({ amount, walletAddress }: { amount: string; walletAddress: string }) => {
            return apiRequest('/api/wallet/withdraw', token, getFingerprintHeader(), {
                method: 'POST',
                body: JSON.stringify({ amount, walletAddress }),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
}

// ============================================================================
// Referrals Hooks
// ============================================================================

export function useReferralStats() {
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useQuery({
        queryKey: ['referrals', 'stats'],
        queryFn: () => apiRequest('/api/referrals', token, getFingerprintHeader()),
        enabled: !!token,
    });
}

// ============================================================================
// Leaderboard Hooks
// ============================================================================

export function useLeaderboard(period: string = 'weekly', type: string = 'earnings') {
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useQuery({
        queryKey: ['leaderboard', period, type],
        queryFn: () => apiRequest(`/api/leaderboard?period=${period}&type=${type}`, token, getFingerprintHeader()),
        enabled: !!token,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// ============================================================================
// Achievements Hooks
// ============================================================================

export function useAchievements() {
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useQuery({
        queryKey: ['achievements'],
        queryFn: () => apiRequest('/api/achievements', token, getFingerprintHeader()),
        enabled: !!token,
    });
}

export function useCheckAchievements() {
    const queryClient = useQueryClient();
    const { token } = useAuth();
    const { getFingerprintHeader } = useFingerprint();

    return useMutation({
        mutationFn: async () => {
            return apiRequest('/api/achievements/check', token, getFingerprintHeader(), {
                method: 'POST',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['achievements'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
}

