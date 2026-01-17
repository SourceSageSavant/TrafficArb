'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { TelegramUser } from '@/types/shared';

interface TelegramContextValue {
    webApp: WebApp | null;
    user: TelegramUser | null;
    startParam: string | null;
    isReady: boolean;
    themeParams: ThemeParams | null;
    hapticFeedback: (type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    showAlert: (message: string) => void;
    showConfirm: (message: string) => Promise<boolean>;
    close: () => void;
    expand: () => void;
}

// Telegram WebApp types
interface WebApp {
    initData: string;
    initDataUnsafe: {
        user?: TelegramUser;
        start_param?: string;
        auth_date: number;
        hash: string;
    };
    themeParams: ThemeParams;
    isExpanded: boolean;
    ready: () => void;
    expand: () => void;
    close: () => void;
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
    HapticFeedback: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    };
    MainButton: {
        text: string;
        show: () => void;
        hide: () => void;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
        setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean }) => void;
    };
    BackButton: {
        show: () => void;
        hide: () => void;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
    };
}

interface ThemeParams {
    bg_color?: string;
    secondary_bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
}

declare global {
    interface Window {
        Telegram?: {
            WebApp: WebApp;
        };
    }
}

const TelegramContext = createContext<TelegramContextValue | null>(null);

export function TelegramProvider({ children }: { children: ReactNode }) {
    const [webApp, setWebApp] = useState<WebApp | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const tgWebApp = window.Telegram?.WebApp;

        if (tgWebApp) {
            setWebApp(tgWebApp);
            tgWebApp.ready();
            tgWebApp.expand();
            setIsReady(true);

            // Apply theme colors to CSS variables
            const themeParams = tgWebApp.themeParams;
            if (themeParams) {
                document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
                document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || '#f0f0f0');
                document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
                document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#999999');
                document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#2481cc');
                document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#2481cc');
                document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
            }
        } else {
            // Development fallback
            console.log('Telegram WebApp not available - running in development mode');
            setIsReady(true);
        }
    }, []);

    const value: TelegramContextValue = {
        webApp,
        user: webApp?.initDataUnsafe?.user || null,
        startParam: webApp?.initDataUnsafe?.start_param || null,
        isReady,
        themeParams: webApp?.themeParams || null,
        hapticFeedback: (type) => {
            webApp?.HapticFeedback?.impactOccurred(type);
        },
        showAlert: (message) => {
            if (webApp) {
                webApp.showAlert(message);
            } else {
                alert(message);
            }
        },
        showConfirm: (message) => {
            return new Promise((resolve) => {
                if (webApp) {
                    webApp.showConfirm(message, resolve);
                } else {
                    resolve(confirm(message));
                }
            });
        },
        close: () => webApp?.close(),
        expand: () => webApp?.expand(),
    };

    return (
        <TelegramContext.Provider value={value}>
            {children}
        </TelegramContext.Provider>
    );
}

export function useTelegram() {
    const context = useContext(TelegramContext);
    if (!context) {
        throw new Error('useTelegram must be used within a TelegramProvider');
    }
    return context;
}
