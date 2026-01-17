'use client';

import { useEffect, useRef } from 'react';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to automatically authenticate with Telegram initData
 * when the app loads inside Telegram WebApp
 */
export function useAutoLogin() {
    const { webApp, isReady } = useTelegram();
    const { login, isAuthenticated, isLoading, error } = useAuth();
    const loginAttempted = useRef(false);

    useEffect(() => {
        // Only attempt login once, when Telegram is ready and user is not authenticated
        if (!isReady || isAuthenticated || isLoading || loginAttempted.current) {
            return;
        }

        const initData = webApp?.initData;

        if (initData) {
            loginAttempted.current = true;
            login(initData).catch((err) => {
                console.error('Auto-login failed:', err);
                // Reset flag to allow retry
                loginAttempted.current = false;
            });
        } else {
            // Development mode - no Telegram context
            console.log('No Telegram initData available - running in dev mode');
        }
    }, [isReady, webApp, isAuthenticated, isLoading, login]);

    return {
        isLoading,
        isAuthenticated,
        error,
    };
}
