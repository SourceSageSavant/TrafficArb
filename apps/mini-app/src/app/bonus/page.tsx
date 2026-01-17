'use client';

import { motion } from 'framer-motion';
import { Calendar, Check, Gift, Flame, Loader2 } from 'lucide-react';
import { useUserProfile, useClaimBonus } from '@/hooks/useApi';
import { useTelegram } from '@/components/providers/TelegramProvider';

export default function BonusPage() {
    const { hapticFeedback, showAlert } = useTelegram();
    const { data: userProfile, isLoading } = useUserProfile();
    const claimMutation = useClaimBonus();

    const streak = (userProfile as any)?.streak || { current: 0, claimedToday: false };
    const currentDay = streak.claimedToday ? streak.current : streak.current + 1;

    const handleClaim = async () => {
        hapticFeedback('medium');
        try {
            const res: any = await claimMutation.mutateAsync();
            showAlert(res.data.message || 'Bonus claimed!');
        } catch (error: any) {
            showAlert(error.message || 'Failed to claim bonus');
        }
    };

    const days = [1, 2, 3, 4, 5, 6, 7];

    return (
        <div className="px-4 py-4 pb-24 min-h-screen bg-primary">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl font-bold">Daily Login Bonus</h1>
                <p className="text-muted mt-2">Log in daily to increase your reward!</p>
            </motion.div>

            {/* Streak Counter */}
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="card card-glow mb-8 text-center"
            >
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <span className="text-2xl font-bold">{streak.current} Days</span>
                </div>
                <p className="text-sm text-muted">Current Streak</p>
            </motion.div>

            {/* Days Grid */}
            <div className="grid grid-cols-4 gap-3 mb-8">
                {days.map((day) => {
                    const isCompleted = day <= streak.current;
                    const isToday = day === (streak.current + 1) && !streak.claimedToday;
                    const isFuture = day > (streak.claimedToday ? streak.current : streak.current + 1);

                    // Calculate reward for this day (simplified logic for display)
                    const reward = (0.01 + (day - 1) * 0.005).toFixed(3);

                    return (
                        <div
                            key={day}
                            className={`
                                relative p-2 rounded-xl border text-center
                                ${day === 7 ? 'col-span-2 aspect-[2/1] flex flex-row items-center justify-between px-4' : 'aspect-square flex flex-col items-center justify-center'}
                                ${isCompleted
                                    ? 'bg-success/10 border-success/30'
                                    : isToday
                                        ? 'bg-accent/10 border-accent animate-pulse-glow'
                                        : 'bg-secondary border-subtle opacity-60'
                                }
                            `}
                        >
                            <span className="text-xs font-bold text-muted mb-1">Day {day}</span>

                            {isCompleted ? (
                                <Check className="w-5 h-5 text-success" />
                            ) : (
                                <Gift className={`w-5 h-5 ${isToday ? 'text-accent' : 'text-muted'}`} />
                            )}

                            <span className="text-[10px] font-medium mt-1 text-muted">+{reward}</span>
                        </div>
                    );
                })}
            </div>

            {/* Claim Button */}
            <div className="fixed bottom-24 left-4 right-4 max-w-lg mx-auto">
                <button
                    onClick={handleClaim}
                    disabled={streak.claimedToday || claimMutation.isPending || isLoading}
                    className="btn-primary w-full py-4 text-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {claimMutation.isPending ? (
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    ) : streak.claimedToday ? (
                        <span className="flex items-center justify-center gap-2">
                            <Check className="w-5 h-5" />
                            Come Back Tomorrow
                        </span>
                    ) : (
                        'Claim Daily Reward'
                    )}
                </button>
            </div>
        </div>
    );
}
