'use client';

import { motion } from 'framer-motion';
import {
    User as UserIcon,
    Star,
    Flame,
    Trophy,
    CheckCircle2,
    Clock,
    Gift,
    Settings,
    ChevronRight,
    ExternalLink,
    Shield
} from 'lucide-react';
import { useTelegram } from '@/components/providers/TelegramProvider';
import Link from 'next/link';
import { useUserStats } from '@/hooks/useApi';

// Mock achievements
const mockAchievements = [
    { code: 'first_task', name: 'First Steps', isUnlocked: true },
    { code: 'task_10', name: 'Getting Started', isUnlocked: true },
    { code: 'task_50', name: 'Task Master', isUnlocked: false, progress: 92 },
    { code: 'referral_5', name: 'Networker', isUnlocked: false, progress: 60 },
    { code: 'streak_7', name: 'Week Warrior', isUnlocked: true },
];

export default function ProfilePage() {
    const { user, hapticFeedback } = useTelegram();

    const { data: statsData } = useUserStats();

    // Default safe stats
    const stats: any = statsData || {};

    const profileStats = {
        level: stats.level || 1,
        xp: stats.xp || 0,
        xpToNext: stats.nextLevelXp || 100,
        totalEarned: stats.totalEarnedNano ? (stats.totalEarnedNano / 1e9).toFixed(2) : '0.00',
        tasksCompleted: stats.tasksCompleted || 0,
        currentStreak: stats.currentStreak || 0,
        longestStreak: stats.longestStreak || 0,
        referrals: stats.referralCount || 0,
        rank: stats.rank || 'N/A',
    };

    const xpProgress = (profileStats.xp / profileStats.xpToNext) * 100;



    const menuItems = [
        { icon: Clock, label: 'Task History', href: '/history' },
        { icon: Gift, label: 'Daily Bonus', href: '/bonus' },
        { icon: Settings, label: 'Settings', href: '/settings' },
        { icon: ExternalLink, label: 'Help & Support', href: '/support' },
    ];

    return (
        <div className="px-4 py-4 pb-24 min-h-screen bg-primary">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="relative inline-block">
                    <div className="w-24 h-24 mx-auto gradient-primary rounded-full flex items-center justify-center text-white text-4xl font-bold glow-accent">
                        {user?.first_name?.charAt(0) || 'U'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-success rounded-full flex items-center justify-center border-4 border-[var(--background)]">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                </div>
                <h1 className="text-xl font-bold mt-4">
                    {user?.first_name || 'User'} {user?.last_name || ''}
                </h1>
                {user?.username && (
                    <p className="text-sm text-muted">@{user.username}</p>
                )}
            </motion.div>

            {/* Level Progress */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card card-glow mt-5"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
                            <Star className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold">Level {profileStats.level}</span>
                    </div>
                    <span className="text-sm text-muted">
                        {profileStats.xp} / {profileStats.xpToNext} XP
                    </span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress}%` }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="h-full gradient-gold rounded-full"
                    />
                </div>
                <p className="text-xs text-muted mt-2 text-center">
                    {profileStats.xpToNext - profileStats.xp} XP to Level {profileStats.level + 1} ✨
                </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mt-5">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="stat-card"
                >
                    <p className="stat-value">{profileStats.totalEarned}</p>
                    <p className="stat-label">Total Earned (TON)</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="stat-card"
                >
                    <p className="stat-value">{profileStats.tasksCompleted}</p>
                    <p className="stat-label">Tasks Completed</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="stat-card"
                >
                    <div className="flex items-center justify-center gap-1.5">
                        <Flame className="w-5 h-5 text-orange-400" />
                        <span className="stat-value">{profileStats.currentStreak}</span>
                    </div>
                    <p className="stat-label">Day Streak</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="stat-card"
                >
                    <div className="flex items-center justify-center gap-1.5">
                        <Trophy className="w-5 h-5 text-accent" />
                        <span className="stat-value">#{profileStats.rank}</span>
                    </div>
                    <p className="stat-label">Global Rank</p>
                </motion.div>
            </div>

            {/* Achievements */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-8"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">Achievements</h2>
                    <span className="text-sm text-muted">
                        {mockAchievements.filter(a => a.isUnlocked).length}/{mockAchievements.length}
                    </span>
                </div>

                <div className="grid grid-cols-5 gap-3">
                    {mockAchievements.map((achievement, index) => (
                        <motion.div
                            key={achievement.code}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className={`relative aspect-square rounded-xl flex items-center justify-center border ${achievement.isUnlocked
                                ? 'bg-accent/15 border-accent/30'
                                : 'bg-secondary border-subtle opacity-60'
                                }`}
                        >
                            {achievement.isUnlocked ? (
                                <CheckCircle2 className="w-6 h-6 text-accent" />
                            ) : (
                                <div className="relative w-6 h-6">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="text-muted/30"
                                        />
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeDasharray={`${(achievement.progress || 0) * 0.628} 62.8`}
                                            className="text-accent"
                                        />
                                    </svg>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Menu */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 space-y-2"
            >
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="card flex items-center gap-4"
                        onClick={() => hapticFeedback('light')}
                    >
                        <div className="w-10 h-10 rounded-xl bg-secondary border border-subtle flex items-center justify-center">
                            <item.icon className="w-5 h-5 text-accent" />
                        </div>
                        <span className="flex-1 font-medium">{item.label}</span>
                        <ChevronRight className="w-5 h-5 text-muted" />
                    </Link>
                ))}
            </motion.div>
        </div>
    );
}
