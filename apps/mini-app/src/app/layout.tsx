import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

export const metadata: Metadata = {
    title: 'Traffic Arb - Earn Crypto',
    description: 'Complete tasks and earn TON cryptocurrency rewards',
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script src="https://telegram.org/js/telegram-web-app.js" />
            </head>
            <body className="min-h-screen bg-primary pb-20">
                <Providers>
                    <main className="safe-area-top">
                        {children}
                    </main>
                    <BottomNav />
                </Providers>
            </body>
        </html>
    );
}
