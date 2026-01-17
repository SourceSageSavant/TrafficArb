'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, Zap, CheckCircle } from 'lucide-react';
import type { OfferListItem } from '@traffic-arb/shared';

interface OfferCardProps {
    offer: OfferListItem;
    onClick: () => void;
    delay?: number;
}

const difficultyConfig = {
    EASY: { label: 'Easy', class: 'badge-easy' },
    MEDIUM: { label: 'Medium', class: 'badge-medium' },
    HARD: { label: 'Hard', class: 'badge-hard' },
};

export function OfferCard({ offer, onClick, delay = 0 }: OfferCardProps) {
    const difficulty = difficultyConfig[offer.difficulty];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.2 }}
            onClick={onClick}
            className="card card-glow flex items-center gap-4 cursor-pointer group"
        >
            {/* Offer Image */}
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-subtle">
                {offer.imageUrl ? (
                    <Image
                        src={offer.imageUrl}
                        alt={offer.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Zap className="w-6 h-6 text-accent" />
                    </div>
                )}
                {/* Verified Badge */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-primary truncate group-hover:text-accent transition-colors">
                    {offer.name}
                </h3>
                <p className="text-xs text-muted line-clamp-1 mt-0.5">
                    {offer.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`badge ${difficulty.class}`}>
                        {difficulty.label}
                    </span>
                    {offer.estimatedMinutes && (
                        <span className="flex items-center gap-1 text-xs text-muted">
                            <Clock className="w-3 h-3" />
                            {offer.estimatedMinutes}min
                        </span>
                    )}
                </div>
            </div>

            {/* Payout */}
            <div className="flex flex-col items-end flex-shrink-0">
                <span className="stat-value text-lg">{offer.payout}</span>
                <span className="text-xs text-muted">TON</span>
            </div>

            <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors flex-shrink-0" />
        </motion.div>
    );
}
