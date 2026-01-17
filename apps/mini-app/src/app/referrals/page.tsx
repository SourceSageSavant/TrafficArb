'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Copy,
    Check,
    Share2,
    Gift,
    TrendingUp,
    ChevronRight,
    Star,
    Sparkles,
    Loader2
} from 'lucide-react';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { useAuth } from '@/context/AuthContext';
import { useReferralStats } from '@/hooks/useApi';

const tierConfig = {
    1: { label: 'Tier 1', rate: '10%', color: 'text-accent', bg: 'bg-accent/15' },
    2: { label: 'Tier 2', rate: '3%', color: 'text-warning', bg: 'bg-warning/15' },
    3: { label: 'Tier 3', rate: '1%', color: 'text-danger', bg: 'bg-danger/15' },
};

export default function ReferralsPage() {
    const { hapticFeedback, showAlert } = useTelegram();
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);

    // Fetch referral stats from API
    const { data: referralData, isLoading } = useReferralStats();

    // Extract data
    const stats = (referralData as any) || {};
    const referralCode = stats.referralCode || user?.referralCode || 'ref_demo';
    const referralLink = `https://t.me/TrafficArbBot?start=${referralCode}`;

    const totalEarnings = stats.totalEarnings
        ? ((stats.totalEarnings as number) / 1e9).toFixed(2)
        : '0.00';

    const referrals = stats.referrals || [];
    const tier1Count = stats.tier1Count || 0;
    const tier2Count = stats.tier2Count || 0;
    const tier3Count = stats.tier3Count || 0;
    const totalReferrals = tier1Count + tier2Count + tier3Count;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            hapticFeedback('light');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            showAlert('Failed to copy link');
        }
    };

    const handleShare = () => {
        hapticFeedback('medium');
        const text = `🚀 Earn TON crypto by completing simple tasks!\n\n💰 Join using my link:`;

        if (window.Telegram?.WebApp) {
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
            window.open(shareUrl, '_blank');
        } else if (navigator.share) {
            navigator.share({ title: 'Earn Crypto!', text, url: referralLink });
        } else {
            handleCopy();
        }
    };

    return (
        <div className="px-4 py-4 pb-24 min-h-screen bg-primary">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-5"
            >
                <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Users className="w-6 h-6 text-accent" />
                    Invite Friends
                </h1>
                <p className="text-sm text-muted mt-1">Earn up to 10% of their earnings forever!</p>
            </motion.div>

            {/* Referral Link Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="gradient-primary rounded-2xl p-5 relative overflow-hidden glow-accent"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
                <Sparkles className="absolute top-4 right-4 w-5 h-5 text-white/20" />

                <div className="relative">
                    <p className="text-white/70 text-sm font-medium mb-3">Your Referral Link</p>

                    <div className="bg-white/15 rounded-xl p-3 font-mono text-sm text-white/90 break-all backdrop-blur-sm">
                        {referralLink}
                    </div>

                    <div className="flex gap-2 mt-4">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-indigo-600 rounded-xl font-semibold text-sm shadow-lg"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleShare}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 text-white rounded-xl font-semibold text-sm backdrop-blur-sm"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-8 mt-5">
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                </div>
            )}

            {/* Stats Grid */}
            {!isLoading && (
                <div className="grid grid-cols-2 gap-3 mt-5">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="stat-card"
                    >
                        <Users className="w-6 h-6 mx-auto text-accent mb-2" />
                        <p className="stat-value">{totalReferrals}</p>
                        <p className="stat-label">Total Referrals</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="stat-card"
                    >
                        <Gift className="w-6 h-6 mx-auto text-success mb-2" />
                        <p className="stat-value">{totalEarnings}</p>
                        <p className="stat-label">TON Earned</p>
                    </motion.div>
                </div>
            )}

            {/* Tier Breakdown */}
            {!isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card mt-5"
                >
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-accent" />
                        Commission Tiers
                    </h3>
                    <div className="space-y-3">
                        {[
                            { tier: 1, count: tier1Count },
                            { tier: 2, count: tier2Count },
                            { tier: 3, count: tier3Count },
                        ].map(({ tier, count }) => {
                            const config = tierConfig[tier as 1 | 2 | 3];
                            return (
                                <div key={tier} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`badge ${config.bg} ${config.color}`}>
                                            {config.label}
                                        </span>
                                        <span className="text-sm text-muted">{config.rate} commission</span>
                                    </div>
                                    <span className="font-semibold">{count} users</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Recent Referrals */}
            {!isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mt-8"
                >
                    <h2 className="font-bold text-lg mb-4">Recent Referrals</h2>

                    {referrals.length > 0 ? (
                        <div className="space-y-3">
                            {referrals.map((referral: any, index: number) => {
                                const tierCfg = tierConfig[referral.tier as 1 | 2 | 3] || tierConfig[1];
                                const earnings = referral.earnings
                                    ? (referral.earnings / 1e9).toFixed(2)
                                    : '0.00';
                                return (
                                    <motion.div
                                        key={referral.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.05 }}
                                        className="card flex items-center gap-4"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center font-semibold text-white">
                                            {referral.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {referral.username ? `@${referral.username}` : 'Anonymous'}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted">
                                                <span className={`badge ${tierCfg.bg} ${tierCfg.color}`}>
                                                    {tierCfg.label}
                                                </span>
                                                <span className="flex items-center gap-0.5">
                                                    <Star className="w-3 h-3" />
                                                    Lvl {referral.level || 1}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm text-success">+{earnings}</p>
                                            <p className="text-xs text-muted">TON earned</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted" />
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 mx-auto mb-3 text-muted" />
                            <p className="font-medium text-secondary">No referrals yet</p>
                            <p className="text-sm text-muted mt-1">Share your link to start earning!</p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
