'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet as WalletIcon,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    ExternalLink,
    Copy,
    Check,
    ChevronRight,
    Shield,
    Loader2
} from 'lucide-react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { useWalletBalance, useTransactions, useRequestWithdrawal } from '@/hooks/useApi';
import type { TransactionType } from '@/types/shared';

const transactionIcons: Record<TransactionType, typeof ArrowUpRight> = {
    TASK_REWARD: ArrowDownLeft,
    REFERRAL_BONUS: ArrowDownLeft,
    WITHDRAWAL: ArrowUpRight,
    DAILY_BONUS: ArrowDownLeft,
    STREAK_BONUS: ArrowDownLeft,
    LEVEL_BONUS: ArrowDownLeft,
    ADJUSTMENT: ArrowDownLeft,
};

const transactionColors: Record<TransactionType, { icon: string; bg: string }> = {
    TASK_REWARD: { icon: 'text-success', bg: 'bg-success/10' },
    REFERRAL_BONUS: { icon: 'text-accent', bg: 'bg-accent/10' },
    WITHDRAWAL: { icon: 'text-danger', bg: 'bg-danger/10' },
    DAILY_BONUS: { icon: 'text-warning', bg: 'bg-warning/10' },
    STREAK_BONUS: { icon: 'text-warning', bg: 'bg-warning/10' },
    LEVEL_BONUS: { icon: 'text-accent', bg: 'bg-accent/10' },
    ADJUSTMENT: { icon: 'text-muted', bg: 'bg-secondary' },
};

export default function WalletPage() {
    const { hapticFeedback, showAlert } = useTelegram();
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();
    const [copied, setCopied] = useState(false);

    // Fetch data from API
    const { data: balanceData, isLoading: balanceLoading } = useWalletBalance();
    const { data: transactionsData, isLoading: txLoading } = useTransactions(20, 0);
    const withdrawMutation = useRequestWithdrawal();

    // Calculate balances
    const balance = balanceData
        ? ((balanceData as any).balance / 1e9).toFixed(2)
        : '0.00';
    const pending = balanceData
        ? ((balanceData as any).pending / 1e9).toFixed(2)
        : '0.00';

    // Transform transactions
    const transactions = (transactionsData as any)?.transactions?.map((tx: any) => ({
        id: tx.id,
        type: tx.type as TransactionType,
        amount: tx.type === 'WITHDRAWAL'
            ? `-${(tx.amountNano / 1e9).toFixed(2)}`
            : `+${(tx.amountNano / 1e9).toFixed(2)}`,
        description: tx.description || tx.type.replace(/_/g, ' '),
        createdAt: tx.createdAt,
    })) || [];

    const handleConnect = () => {
        hapticFeedback('medium');
        tonConnectUI.openModal();
    };

    const handleDisconnect = () => {
        hapticFeedback('medium');
        tonConnectUI.disconnect();
    };

    const handleWithdraw = async () => {
        if (!wallet) {
            showAlert('Please connect your TON wallet first');
            return;
        }

        const minWithdraw = 3; // Minimum 3 TON
        if (parseFloat(balance) < minWithdraw) {
            showAlert(`Minimum withdrawal is ${minWithdraw} TON`);
            return;
        }

        hapticFeedback('medium');

        try {
            await withdrawMutation.mutateAsync({
                amount: balance,
                walletAddress: wallet.account.address,
            });
            showAlert('Withdrawal requested successfully!');
        } catch (err: any) {
            showAlert(err.message || 'Withdrawal failed');
        }
    };

    const handleCopyAddress = async () => {
        if (!wallet) return;
        try {
            await navigator.clipboard.writeText(wallet.account.address);
            setCopied(true);
            hapticFeedback('light');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="px-4 py-4 pb-24 min-h-screen bg-primary">
            {/* Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="gradient-primary rounded-2xl p-6 relative overflow-hidden glow-accent"
            >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />

                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-white/60" />
                        <p className="text-white/60 text-sm font-medium">Available Balance</p>
                    </div>

                    {balanceLoading ? (
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                            <span className="text-white/60">Loading...</span>
                        </div>
                    ) : (
                        <h1 className="text-5xl font-bold text-white">{balance} <span className="text-2xl text-white/70">TON</span></h1>
                    )}

                    {parseFloat(pending) > 0 && (
                        <div className="flex items-center gap-1.5 mt-3 text-white/50 text-sm">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{pending} TON pending verification</span>
                        </div>
                    )}

                    {/* Wallet Connection */}
                    <div className="mt-5">
                        {wallet ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopyAddress}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/15 rounded-xl text-sm text-white backdrop-blur-sm"
                                >
                                    <WalletIcon className="w-4 h-4" />
                                    <span className="font-mono">{formatAddress(wallet.account.address)}</span>
                                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    className="px-4 py-2 bg-white/10 rounded-xl text-sm text-white/60 hover:bg-white/15 transition-colors"
                                >
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleConnect}
                                className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-600 rounded-xl font-semibold text-sm shadow-lg hover:bg-white/90 transition-colors"
                            >
                                <WalletIcon className="w-4 h-4" />
                                Connect TON Wallet
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-5">
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleWithdraw}
                    disabled={!wallet || withdrawMutation.isPending}
                    className="card flex items-center justify-center gap-2 py-4 font-semibold disabled:opacity-50"
                >
                    {withdrawMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <ArrowUpRight className="w-5 h-5 text-accent" />
                    )}
                    <span>Withdraw</span>
                </motion.button>

                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        if (wallet) {
                            window.open(`https://tonviewer.com/${wallet.account.address}`, '_blank');
                        } else {
                            showAlert('Connect wallet to view explorer');
                        }
                    }}
                    className="card flex items-center justify-center gap-2 py-4 font-semibold"
                >
                    <ExternalLink className="w-5 h-5 text-accent" />
                    <span>Explorer</span>
                </motion.button>
            </div>

            {/* Transactions */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8"
            >
                <h2 className="font-bold text-lg mb-4">Recent Transactions</h2>

                {txLoading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-accent animate-spin" />
                    </div>
                )}

                {!txLoading && (
                    <div className="space-y-3">
                        {transactions.map((tx: any, index: number) => {
                            const Icon = transactionIcons[tx.type as TransactionType] || ArrowDownLeft;
                            const colors = transactionColors[tx.type as TransactionType] || transactionColors.ADJUSTMENT;
                            const isPositive = tx.amount.startsWith('+');

                            return (
                                <motion.div
                                    key={tx.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 + index * 0.05 }}
                                    className="card flex items-center gap-4"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
                                        <Icon className={`w-5 h-5 ${colors.icon}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{tx.description}</p>
                                        <p className="text-xs text-muted">{formatDate(tx.createdAt)}</p>
                                    </div>
                                    <span className={`font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                                        {tx.amount} TON
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-muted" />
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {!txLoading && transactions.length === 0 && (
                    <div className="text-center py-12 text-secondary">
                        <WalletIcon className="w-12 h-12 mx-auto mb-3 text-muted" />
                        <p className="font-medium">No transactions yet</p>
                        <p className="text-sm text-muted mt-1">Complete tasks to earn TON</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
