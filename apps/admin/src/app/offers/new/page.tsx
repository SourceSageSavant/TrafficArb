'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, DollarSign, Link as LinkIcon, Image, Clock, Tag } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function NewOfferPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: '',
        description: '',
        instructions: '',
        imageUrl: '',
        trackingUrl: '',
        payoutTon: '',
        category: 'OTHER',
        difficulty: 'MEDIUM',
        estimatedMinutes: '',
        priority: '0',
        premiumOnly: false,
        minAccountAgeDays: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const payoutNano = (parseFloat(form.payoutTon) * 1e9).toString();
            const payoutCents = Math.round(parseFloat(form.payoutTon) * 500); // Rough $5/TON

            const res = await fetch(`${API_BASE}/api/admin/offers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description || undefined,
                    instructions: form.instructions || undefined,
                    imageUrl: form.imageUrl || undefined,
                    trackingUrl: form.trackingUrl,
                    payoutCents,
                    payoutNano,
                    category: form.category,
                    difficulty: form.difficulty,
                    estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : undefined,
                    priority: parseInt(form.priority),
                    requirements: {
                        premiumOnly: form.premiumOnly,
                        minAccountAgeDays: form.minAccountAgeDays ? parseInt(form.minAccountAgeDays) : undefined,
                    },
                }),
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error?.message || 'Failed to create offer');
            }

            router.push('/offers');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Create Custom Offer</h1>
                    <p className="text-sm text-zinc-500">Add a new high-ticket affiliate task</p>
                </div>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card">
                    <h2 className="font-semibold mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Task Name *
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="input w-full"
                                placeholder="e.g., Sign up for Bybit Exchange"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Description
                            </label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="input w-full h-24 resize-none"
                                placeholder="Brief description shown to users..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Instructions
                            </label>
                            <textarea
                                value={form.instructions}
                                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                                className="input w-full h-32 resize-none"
                                placeholder="Step-by-step instructions for completing the task..."
                            />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2 className="font-semibold mb-4">Links & Media</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                <LinkIcon className="w-4 h-4 inline mr-2" />
                                Tracking/Affiliate URL *
                            </label>
                            <input
                                type="url"
                                value={form.trackingUrl}
                                onChange={(e) => setForm({ ...form, trackingUrl: e.target.value })}
                                className="input w-full"
                                placeholder="https://affiliate-link.com/ref=123"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                <Image className="w-4 h-4 inline mr-2" />
                                Image URL
                            </label>
                            <input
                                type="url"
                                value={form.imageUrl}
                                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                                className="input w-full"
                                placeholder="https://example.com/offer-image.png"
                            />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2 className="font-semibold mb-4">Payout & Difficulty</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-2" />
                                Reward (TON) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={form.payoutTon}
                                onChange={(e) => setForm({ ...form, payoutTon: e.target.value })}
                                className="input w-full"
                                placeholder="5.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                <Clock className="w-4 h-4 inline mr-2" />
                                Est. Minutes
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={form.estimatedMinutes}
                                onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
                                className="input w-full"
                                placeholder="10"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                <Tag className="w-4 h-4 inline mr-2" />
                                Category
                            </label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="input w-full"
                            >
                                <option value="SIGNUP">Signup</option>
                                <option value="APP_INSTALL">App Install</option>
                                <option value="SURVEY">Survey</option>
                                <option value="VIDEO">Video</option>
                                <option value="GAME">Game</option>
                                <option value="SOCIAL">Social</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Difficulty
                            </label>
                            <select
                                value={form.difficulty}
                                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                                className="input w-full"
                            >
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Priority (higher = shown first)
                            </label>
                            <input
                                type="number"
                                value={form.priority}
                                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                className="input w-full"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2 className="font-semibold mb-4">Sybil Resistance (Requirements)</h2>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.premiumOnly}
                                onChange={(e) => setForm({ ...form, premiumOnly: e.target.checked })}
                                className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-indigo-500"
                            />
                            <span>Require Telegram Premium</span>
                        </label>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Minimum Account Age (days)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={form.minAccountAgeDays}
                                onChange={(e) => setForm({ ...form, minAccountAgeDays: e.target.value })}
                                className="input w-full max-w-xs"
                                placeholder="30 (leave empty for none)"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Create Offer
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
