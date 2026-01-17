'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Wallet, Trophy, Users, User } from 'lucide-react';
import { useTelegram } from '@/components/providers/TelegramProvider';

const navItems = [
    { href: '/', label: 'Tasks', icon: Home },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/leaderboard', label: 'Top', icon: Trophy },
    { href: '/referrals', label: 'Invite', icon: Users },
    { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
    const pathname = usePathname();
    const { hapticFeedback } = useTelegram();

    const handleClick = () => {
        hapticFeedback('light');
    };

    return (
        <nav className="bottom-nav z-50">
            <div className="flex items-center justify-around py-2 px-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleClick}
                            className="flex flex-col items-center gap-1 py-2 px-3 relative"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-indicator"
                                    className="absolute inset-0 gradient-primary rounded-xl opacity-15"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Icon
                                className={`w-5 h-5 transition-colors ${isActive ? 'text-accent' : 'text-muted'
                                    }`}
                            />
                            <span
                                className={`text-[10px] font-medium transition-colors ${isActive ? 'text-accent' : 'text-muted'
                                    }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
