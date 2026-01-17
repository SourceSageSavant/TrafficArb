import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
    title: 'Traffic Arb - Admin Dashboard',
    description: 'Manage your Traffic Arb platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen flex">
                <Sidebar />
                <div className="flex-1 flex flex-col ml-64">
                    <Header />
                    <main className="flex-1 p-6 overflow-auto">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
