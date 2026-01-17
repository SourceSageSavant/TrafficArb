'use client';

import { useEffect, useState } from 'react';
import { collectFingerprint, storeFingerprint, getStoredFingerprint, type DeviceFingerprint } from '@/lib/fingerprint';

/**
 * Hook to collect and manage device fingerprint
 */
export function useFingerprint() {
    const [fingerprint, setFingerprint] = useState<DeviceFingerprint | null>(null);
    const [isCollecting, setIsCollecting] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const collect = async () => {
            try {
                // Check for stored fingerprint first
                const stored = getStoredFingerprint();
                if (stored) {
                    setFingerprint(stored);
                    setIsCollecting(false);
                    return;
                }

                // Collect new fingerprint
                const fp = await collectFingerprint();
                storeFingerprint(fp);
                setFingerprint(fp);
            } catch (err) {
                console.error('Fingerprint collection error:', err);
                setError(err as Error);
            } finally {
                setIsCollecting(false);
            }
        };

        collect();
    }, []);

    /**
     * Get fingerprint as base64 encoded string for API headers
     */
    const getFingerprintHeader = (): string | null => {
        if (!fingerprint) return null;
        try {
            return btoa(JSON.stringify(fingerprint));
        } catch {
            return null;
        }
    };

    /**
     * Force refresh fingerprint
     */
    const refreshFingerprint = async () => {
        setIsCollecting(true);
        try {
            const fp = await collectFingerprint();
            storeFingerprint(fp);
            setFingerprint(fp);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsCollecting(false);
        }
    };

    return {
        fingerprint,
        fingerprintHash: fingerprint?.fingerprintHash ?? null,
        isCollecting,
        error,
        getFingerprintHeader,
        refreshFingerprint,
    };
}
