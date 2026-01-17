'use client';

import { Flame, Gift, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTelegram } from '@/components/providers/TelegramProvider';

interface StreakBannerProps {
    currentStreak: number;
    claimedToday: boolean;
}

export function StreakBanner({ currentStreak, claimedToday }: StreakBannerProps) {
    const { hapticFeedback } = useTelegram();

    const handleClaim = () => {
        if (claimedToday) return;
        hapticFeedback('heavy');
        // TODO: API call to claim daily bonus
    };

    const bonusAmount = Math.min(0.01 + currentStreak * 0.005, 0.05);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl p-4 mt-4 gradient-primary glow-accent"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
                <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-white/5 blur-xl" />
                <Sparkles className="absolute top-4 right-4 w-5 h-5 text-white/20" />
            </div>

            <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Flame className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-white">{currentStreak}</span>
                            <span className="text-white/70 text-sm font-medium">day streak</span>
                        </div>
                        <p className="text-white/50 text-xs mt-0.5">
                            +{bonusAmount.toFixed(3)} TON bonus per task
                        </p>
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClaim}
                    disabled={claimedToday}
                    className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${claimedToday
                            ? 'bg-white/10 text-white/40 cursor-not-allowed'
                            : 'bg-white text-indigo-600 hover:bg-white/90 shadow-lg'
                        }`}
                >
                    <Gift className="w-4 h-4" />
                    {claimedToday ? 'Claimed' : 'Claim'}
                </motion.button>
            </div>

            {/* Streak Progress */}
            <div className="mt-4 flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div
                        key={day}
                        className={`flex-1 h-1.5 rounded-full transition-all ${day <= currentStreak % 7 || (currentStreak >= 7 && day === 7)
                                ? 'bg-white shadow-glow'
                                : 'bg-white/20'
                            }`}
                    />
                ))}
            </div>
            <p className="text-white/40 text-[10px] mt-2 text-center font-medium">
                {7 - (currentStreak % 7 || 7)} days until tier bonus ✨
            </p>
        </motion.div>
    );
}
