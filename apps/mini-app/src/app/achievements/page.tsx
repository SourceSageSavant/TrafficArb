'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { useAchievements } from '@/hooks/useApi';

interface Achievement {
    id: string;
    code: string;
    name: string;
    description: string;
    xpReward: number;
    requirement: { type: string; value: number };
    progress: number;
    currentValue: number;
    isUnlocked: boolean;
    unlockedAt: string | null;
}

const categoryLabels: Record<string, string> = {
    tasks_completed: '📋 Tasks',
    referrals: '👥 Referrals',
    streak: '🔥 Streaks',
    total_earned: '💰 Earnings',
    level: '⭐ Levels',
};

export default function AchievementsPage() {
    const { data, isLoading } = useAchievements();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const achievements = (data as any)?.achievements as Achievement[] || [];
    const stats = (data as any)?.stats || { total: 0, unlocked: 0 };

    // Group achievements by requirement type
    const categories = achievements.reduce((acc, a) => {
        const cat = a.requirement.type;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(a);
        return acc;
    }, {} as Record<string, Achievement[]>);

    const filteredAchievements = selectedCategory
        ? achievements.filter(a => a.requirement.type === selectedCategory)
        : achievements;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-primary">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="px-4 py-4 pb-24 min-h-screen bg-primary">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
            >
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl font-bold">Achievements</h1>
                <p className="text-muted mt-1">
                    {stats.unlocked} / {stats.total} Unlocked
                </p>
            </motion.div>

            {/* Progress Bar */}
            <div className="w-full bg-secondary rounded-full h-2 mb-6">
                <div
                    className="h-2 bg-gradient-to-r from-accent to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.unlocked / stats.total) * 100}%` }}
                />
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${!selectedCategory ? 'bg-accent text-white' : 'bg-secondary text-muted'
                        }`}
                >
                    All
                </button>
                {Object.entries(categoryLabels).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === key ? 'bg-accent text-white' : 'bg-secondary text-muted'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 gap-3">
                {filteredAchievements.map((achievement, index) => (
                    <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`card flex items-center gap-4 ${achievement.isUnlocked
                                ? 'border-success/30 bg-success/5'
                                : 'opacity-70'
                            }`}
                    >
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${achievement.isUnlocked
                                ? 'bg-success/20 text-success'
                                : 'bg-secondary text-muted'
                            }`}>
                            {achievement.isUnlocked ? (
                                <CheckCircle className="w-6 h-6" />
                            ) : (
                                <Lock className="w-5 h-5" />
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{achievement.name}</h3>
                            <p className="text-xs text-muted truncate">{achievement.description}</p>

                            {/* Progress Bar (if not unlocked) */}
                            {!achievement.isUnlocked && (
                                <div className="mt-2">
                                    <div className="w-full bg-secondary rounded-full h-1.5">
                                        <div
                                            className="h-1.5 bg-accent rounded-full transition-all"
                                            style={{ width: `${achievement.progress * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted mt-1">
                                        {achievement.currentValue} / {achievement.requirement.value}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* XP Reward */}
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-accent">
                                <Star className="w-4 h-4" />
                                <span className="font-bold">{achievement.xpReward}</span>
                            </div>
                            <span className="text-[10px] text-muted">XP</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {achievements.length === 0 && (
                <div className="text-center py-12 text-muted">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No achievements available yet</p>
                </div>
            )}
        </div>
    );
}
