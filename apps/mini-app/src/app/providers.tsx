'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { type ReactNode, useState } from 'react';
import { TelegramProvider } from '@/components/providers/TelegramProvider';
import { AuthProvider } from '@/context/AuthContext';

const manifestUrl = process.env.NEXT_PUBLIC_TON_MANIFEST_URL ||
    'https://raw.githubusercontent.com/example/traffic-arb/main/tonconnect-manifest.json';

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <TonConnectUIProvider manifestUrl={manifestUrl}>
                <TelegramProvider>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </TelegramProvider>
            </TonConnectUIProvider>
        </QueryClientProvider>
    );
}

