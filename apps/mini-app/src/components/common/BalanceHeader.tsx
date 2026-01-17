'use client';

import { Wallet, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface BalanceHeaderProps {
    balance: string;
    pendingTasks?: number;
}

export function BalanceHeader({ balance, pendingTasks = 0 }: BalanceHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
        >
            <div>
                <p className="text-xs text-muted font-medium uppercase tracking-wider mb-1">Your Balance</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold stat-value">{balance}</span>
                    <span className="text-sm text-muted font-semibold">TON</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {pendingTasks > 0 && (
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-warning/10 rounded-xl border border-warning/20"
                    >
                        <Clock className="w-3.5 h-3.5 text-warning" />
                        <span className="text-xs font-semibold text-warning">
                            {pendingTasks} pending
                        </span>
                    </motion.div>
                )}

                <Link
                    href="/wallet"
                    className="flex items-center gap-2 px-4 py-2 gradient-primary rounded-xl shadow-lg glow-accent hover:opacity-90 transition-opacity"
                >
                    <Wallet className="w-4 h-4 text-white" />
                    <span className="text-sm font-semibold text-white">Wallet</span>
                </Link>
            </div>
        </motion.div>
    );
}
