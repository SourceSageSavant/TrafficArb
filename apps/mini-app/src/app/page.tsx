'use client';

import { useState, useEffect } from 'react';
import { Flame, Filter, Search, Sparkles, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { useAuth } from '@/context/AuthContext';
import { useAutoLogin } from '@/hooks/useAutoLogin';
import { useOffers, useWalletBalance, useUserTasks } from '@/hooks/useApi';
import { OfferCard } from '@/components/offers/OfferCard';
import { OfferDetailModal } from '@/components/offers/OfferDetailModal';
import { StreakBanner } from '@/components/gamification/StreakBanner';
import { BalanceHeader } from '@/components/common/BalanceHeader';
import type { OfferListItem } from '@/types/shared';

const categories = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'APP_INSTALL', label: 'Apps', icon: Zap },
    { id: 'SURVEY', label: 'Survey' },
    { id: 'VIDEO', label: 'Video' },
    { id: 'GAME', label: 'Games' },
    { id: 'SIGNUP', label: 'Signup' },
    { id: 'SOCIAL', label: 'Social' },
];

export default function HomePage() {
    const { isReady } = useTelegram();
    const { isAuthenticated } = useAuth();
    const { isLoading: isAuthLoading } = useAutoLogin();

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedOffer, setSelectedOffer] = useState<OfferListItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch data from API
    const { data: offersData, isLoading: offersLoading } = useOffers({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        limit: 20
    });
    const { data: balanceData } = useWalletBalance();
    const { data: tasksData } = useUserTasks();

    // Transform API offers to display format
    const offers: OfferListItem[] = (offersData as any)?.offers?.map((offer: any) => ({
        id: offer.id,
        name: offer.name,
        description: offer.description || '',
        imageUrl: offer.imageUrl || `https://placehold.co/80x80/6366f1/ffffff?text=${offer.name.charAt(0)}`,
        payout: (offer.payoutNano / 1e9).toFixed(2),
        payoutUsd: `$${(offer.payoutCents / 100).toFixed(2)}`,
        category: offer.category,
        difficulty: offer.difficulty,
        estimatedMinutes: offer.estimatedMinutes || 5,
        provider: offer.provider,
    })) || [];

    // Filter offers by search
    const filteredOffers = offers.filter((offer) => {
        if (searchQuery && !offer.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        return true;
    });

    // Calculate balance from API
    const balance = balanceData
        ? ((balanceData as any).balance / 1e9).toFixed(2)
        : '0.00';

    // Count pending tasks
    const pendingTasks = (tasksData as any)?.tasks?.filter((t: any) =>
        t.status === 'STARTED' || t.status === 'PENDING'
    ).length || 0;

    // Loading state
    if (!isReady || isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full gradient-primary animate-pulse-glow flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-secondary text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-4 pb-24 min-h-screen bg-primary">
            {/* Balance Header */}
            <BalanceHeader
                balance={balance}
                pendingTasks={pendingTasks}
            />

            {/* Streak Banner */}
            <StreakBanner
                currentStreak={5}
                claimedToday={false}
            />

            {/* Search & Filter */}
            <div className="flex items-center gap-2 mt-5 mb-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        type="text"
                        placeholder="Search offers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input w-full pl-10 pr-4 py-3"
                    />
                </div>
                <button className="p-3 bg-secondary rounded-xl border border-subtle hover:border-accent/30 transition-colors">
                    <Filter className="w-5 h-5 text-secondary" />
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {categories.map((category) => (
                    <motion.button
                        key={category.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === category.id
                            ? 'gradient-primary text-white shadow-lg glow-accent'
                            : 'bg-secondary text-secondary border border-subtle hover:border-accent/30'
                            }`}
                    >
                        {category.icon && <category.icon className="w-3.5 h-3.5" />}
                        {category.label}
                    </motion.button>
                ))}
            </div>

            {/* Hot Offers Section */}
            <div className="flex items-center gap-2 mt-6 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <Flame className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold">Hot Offers</h2>
                <span className="text-xs text-muted bg-secondary px-2.5 py-1 rounded-full border border-subtle ml-auto">
                    {filteredOffers.length} available
                </span>
            </div>

            {/* Loading Offers */}
            {offersLoading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                </div>
            )}

            {/* Offers Grid */}
            {!offersLoading && (
                <div className="grid gap-3">
                    {filteredOffers.map((offer, index) => (
                        <OfferCard
                            key={offer.id}
                            offer={offer}
                            onClick={() => setSelectedOffer(offer)}
                            delay={index * 0.05}
                        />
                    ))}
                </div>
            )}

            {!offersLoading && filteredOffers.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-secondary border border-subtle mx-auto mb-4 flex items-center justify-center">
                        <Search className="w-8 h-8 text-muted" />
                    </div>
                    <p className="text-secondary font-medium">No offers found</p>
                    <p className="text-muted text-sm mt-1">
                        {isAuthenticated ? 'Try a different category' : 'Please wait while we connect...'}
                    </p>
                </div>
            )}

            {/* Offer Detail Modal */}
            {selectedOffer && (
                <OfferDetailModal
                    offer={selectedOffer}
                    onClose={() => setSelectedOffer(null)}
                />
            )}
        </div>
    );
}
