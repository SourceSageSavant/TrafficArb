'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Star, Loader2 } from 'lucide-react';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { useAuth } from '@/context/AuthContext';
import { useLeaderboard } from '@/hooks/useApi';
import type { LeaderboardPeriod, LeaderboardType } from '@traffic-arb/shared';

const periods: { value: LeaderboardPeriod; label: string }[] = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'Month' },
    { value: 'alltime', label: 'All Time' },
];

const types: { value: LeaderboardType; label: string }[] = [
    { value: 'earnings', label: 'Earnings' },
    { value: 'tasks', label: 'Tasks' },
    { value: 'referrals', label: 'Referrals' },
];

const rankConfig = {
    1: { icon: Crown, gradient: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    2: { icon: Medal, gradient: 'from-gray-300 to-gray-400', bg: 'bg-gray-400/10', text: 'text-gray-300' },
    3: { icon: Trophy, gradient: 'from-amber-600 to-amber-700', bg: 'bg-amber-500/10', text: 'text-amber-500' },
};

export default function LeaderboardPage() {
    const { hapticFeedback } = useTelegram();
    const { user } = useAuth();
    const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
    const [type, setType] = useState<LeaderboardType>('earnings');

    // Fetch leaderboard from API
    const { data: leaderboardData, isLoading } = useLeaderboard(period, type);

    // Transform API data
    const entries = (leaderboardData as any)?.entries?.map((entry: any, index: number) => ({
        rank: index + 1,
        userId: entry.userId,
        username: entry.username,
        firstName: entry.firstName,
        level: entry.level || 1,
        value: type === 'earnings'
            ? (entry.totalEarned / 1e9).toFixed(2)
            : String(entry.tasksCompleted || entry.referralCount || 0),
        isCurrentUser: entry.userId === user?.id,
    })) || [];

    const currentUser = entries.find((e: any) => e.isCurrentUser);
    const userPosition = (leaderboardData as any)?.userPosition;

    return (
        <div className="px-4 py-4 pb-24 min-h-screen bg-primary">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-5"
            >
                <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Trophy className="w-6 h-6 text-accent" />
                    Leaderboard
                </h1>
                <p className="text-sm text-muted mt-1">Top earners this week</p>
            </motion.div>

            {/* Period Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {periods.map((p) => (
                    <motion.button
                        key={p.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { hapticFeedback('light'); setPeriod(p.value); }}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${period === p.value
                            ? 'gradient-primary text-white glow-accent'
                            : 'bg-secondary text-secondary border border-subtle'
                            }`}
                    >
                        {p.label}
                    </motion.button>
                ))}
            </div>

            {/* Type Filter */}
            <div className="flex gap-2 mt-4">
                {types.map((t) => (
                    <button
                        key={t.value}
                        onClick={() => { hapticFeedback('light'); setType(t.value); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${type === t.value
                            ? 'bg-accent/15 text-accent border border-accent/30'
                            : 'bg-secondary text-muted border border-subtle'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
            )}

            {/* Current User Position */}
            {!isLoading && (currentUser || userPosition) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card card-glow mt-5"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center font-bold text-white text-lg">
                            #{currentUser?.rank || userPosition?.rank || '?'}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold">Your Position</p>
                            <p className="text-sm text-muted">Keep earning to climb! 🚀</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-accent text-lg">
                                {currentUser?.value || userPosition?.value || '0'}
                            </p>
                            <p className="text-xs text-muted">{type === 'earnings' ? 'TON earned' : type}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Top 3 Podium */}
            {!isLoading && entries.length >= 3 && (
                <div className="flex items-end justify-center gap-3 mt-8 mb-6">
                    {[entries[1], entries[0], entries[2]].map((entry: any, idx: number) => {
                        if (!entry) return null;
                        const config = rankConfig[entry.rank as 1 | 2 | 3];
                        const isFirst = idx === 1;
                        const Icon = config?.icon || Trophy;

                        return (
                            <motion.div
                                key={entry.userId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + idx * 0.1 }}
                                className={`flex flex-col items-center ${isFirst ? 'mb-4' : ''}`}
                            >
                                <div className={`${config?.bg || 'bg-accent/10'} p-3 rounded-full mb-2`}>
                                    <Icon className={`w-6 h-6 ${config?.text || 'text-accent'}`} />
                                </div>
                                <div className={`${isFirst ? 'w-20 h-20 text-2xl ring-4 ring-yellow-400/30' : 'w-16 h-16 text-xl'} rounded-full bg-gradient-to-br ${config?.gradient || 'from-accent to-purple-500'} flex items-center justify-center font-bold text-white`}>
                                    {entry.firstName?.charAt(0) || '?'}
                                </div>
                                <p className="font-semibold mt-2 text-sm truncate max-w-[80px]">
                                    {entry.username ? `@${entry.username}` : entry.firstName}
                                </p>
                                <p className="text-xs text-accent font-medium">{entry.value} {type === 'earnings' ? 'TON' : ''}</p>
                                <div className={`px-3 py-0.5 rounded-full text-xs font-bold mt-1.5 ${config?.bg || 'bg-accent/10'} ${config?.text || 'text-accent'}`}>
                                    #{entry.rank}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Rest of Leaderboard */}
            {!isLoading && (
                <div className="space-y-2">
                    {entries.slice(3).map((entry: any, index: number) => (
                        <motion.div
                            key={entry.userId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                            className={`card flex items-center gap-4 ${entry.isCurrentUser ? 'card-glow' : ''}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${entry.isCurrentUser ? 'gradient-primary text-white' : 'bg-secondary text-muted'
                                }`}>
                                #{entry.rank}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center font-semibold text-white">
                                {entry.firstName?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                    {entry.username ? `@${entry.username}` : entry.firstName}
                                    {entry.isCurrentUser && <span className="text-accent ml-1">(You)</span>}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted">
                                    <Star className="w-3 h-3" />
                                    Level {entry.level}
                                </div>
                            </div>
                            <span className="font-bold text-sm">{entry.value} {type === 'earnings' ? 'TON' : ''}</span>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && entries.length === 0 && (
                <div className="text-center py-16">
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-muted" />
                    <p className="font-medium text-secondary">No data yet</p>
                    <p className="text-sm text-muted mt-1">Be the first to climb the leaderboard!</p>
                </div>
            )}
        </div>
    );
}
