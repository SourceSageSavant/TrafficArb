'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ExternalLink, CheckCircle2, AlertCircle, Zap, Shield, Star } from 'lucide-react';
import { useTelegram } from '@/components/providers/TelegramProvider';
import type { OfferListItem } from '@/types/shared';
import { useStartTask } from '@/hooks/useApi';

interface OfferDetailModalProps {
    offer: OfferListItem;
    onClose: () => void;
}

const difficultyInfo = {
    EASY: { label: 'Easy', class: 'badge-easy' },
    MEDIUM: { label: 'Medium', class: 'badge-medium' },
    HARD: { label: 'Hard', class: 'badge-hard' },
};

export function OfferDetailModal({ offer, onClose }: OfferDetailModalProps) {
    const { hapticFeedback, showConfirm } = useTelegram();
    const [isStarting, setIsStarting] = useState(false);

    const startTaskMutation = useStartTask();

    const handleStart = async () => {
        hapticFeedback('medium');

        const confirmed = await showConfirm(
            `Start this task? You will earn ${offer.payout} TON upon completion.`
        );

        if (!confirmed) return;

        setIsStarting(true);

        try {
            const result: any = await startTaskMutation.mutateAsync(offer.id);
            const trackingUrl = result?.data?.trackingUrl;

            if (trackingUrl) {
                window.open(trackingUrl, '_blank');
                onClose();
            } else {
                // Fallback needed? unlikely if API guarantees it
                console.error('No tracking URL returned');
            }
        } catch (error) {
            console.error('Failed to start task:', error);
            // Maybe show alert?
        } finally {
            setIsStarting(false);
        }
    };

    const difficulty = difficultyInfo[offer.difficulty];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg bg-card border-t border-subtle rounded-t-3xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-subtle">
                        <h2 className="text-lg font-bold">Offer Details</h2>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 rounded-full hover:bg-secondary transition-colors"
                        >
                            <X className="w-5 h-5 text-muted" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
                        {/* Offer Header */}
                        <div className="flex items-start gap-4">
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-subtle">
                                {offer.imageUrl ? (
                                    <Image
                                        src={offer.imageUrl}
                                        alt={offer.name}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Zap className="w-8 h-8 text-accent" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">{offer.name}</h3>
                                <p className="text-sm text-secondary mt-1">{offer.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Shield className="w-3.5 h-3.5 text-success" />
                                    <span className="text-xs text-success font-medium">Verified Offer</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="stat-card">
                                <p className="stat-value">{offer.payout}</p>
                                <p className="stat-label">TON Reward</p>
                            </div>
                            <div className="stat-card">
                                <span className={`badge ${difficulty.class}`}>
                                    {difficulty.label}
                                </span>
                                <p className="stat-label mt-1">Difficulty</p>
                            </div>
                            <div className="stat-card">
                                <p className="text-lg font-semibold text-primary flex items-center justify-center gap-1">
                                    <Clock className="w-4 h-4 text-muted" />
                                    {offer.estimatedMinutes || '?'}m
                                </p>
                                <p className="stat-label">Est. Time</p>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-secondary border border-subtle rounded-xl p-4">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-success" />
                                How to Complete
                            </h4>
                            <ol className="text-sm text-secondary space-y-2.5">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold">1</span>
                                    <span>Click the "Start Task" button below</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold">2</span>
                                    <span>Complete all required actions on the offer page</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold">3</span>
                                    <span>Wait for verification (usually 1-24 hours)</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-success/20 text-success text-xs flex items-center justify-center font-semibold">✓</span>
                                    <span>Rewards credited automatically to your wallet</span>
                                </li>
                            </ol>
                        </div>

                        {/* Warning */}
                        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-warning">Important</p>
                                <p className="text-warning/80 mt-0.5">
                                    Use the same device to complete. Don't use VPN or ad blockers.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-subtle safe-area-bottom">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleStart}
                            disabled={isStarting}
                            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
                        >
                            {isStarting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ExternalLink className="w-5 h-5" />
                                    Start Task
                                </>
                            )}
                        </motion.button>
                        <p className="text-xs text-center text-muted mt-3">
                            Earn <span className="text-accent font-semibold">{offer.payout} TON</span> (~{offer.payoutUsd}) upon completion
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
