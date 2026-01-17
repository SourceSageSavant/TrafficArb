'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    ToggleLeft,
    ToggleRight,
    Trash2,
    Edit,
    Loader2,
    RefreshCw,
    ExternalLink
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Offer {
    id: string;
    externalId: string;
    provider: string;
    name: string;
    description: string | null;
    payoutNano: string;
    category: string;
    difficulty: string;
    isActive: boolean;
    priority: number;
    completionCount: number;
    createdAt: string;
}

export default function OffersPage() {
    const router = useRouter();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');

    const fetchOffers = async () => {
        setIsLoading(true);
        setError('');

        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/admin/offers?page=${page}&limit=20`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) {
                router.push('/login');
                return;
            }

            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || 'Failed to fetch');

            setOffers(data.data.items);
            setTotal(data.data.total);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, [page]);

    const formatTon = (nano: string) => {
        return (Number(BigInt(nano)) / 1e9).toFixed(2);
    };

    const handleToggle = async (id: string) => {
        setActionLoading(id);
        const token = localStorage.getItem('admin_token');

        try {
            const res = await fetch(`${API_BASE}/api/admin/offers/${id}/toggle`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || 'Failed to toggle');

            // Update local state
            setOffers(offers.map(o =>
                o.id === id ? { ...o, isActive: data.data.isActive } : o
            ));
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string, provider: string) => {
        if (provider !== 'CUSTOM') {
            alert('Only custom offers can be deleted');
            return;
        }

        if (!confirm('Are you sure you want to delete this offer?')) return;

        setActionLoading(id);
        const token = localStorage.getItem('admin_token');

        try {
            const res = await fetch(`${API_BASE}/api/admin/offers/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || 'Failed to delete');

            fetchOffers();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredOffers = searchQuery
        ? offers.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : offers;

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Offers</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage tasks and affiliate offers</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchOffers} className="btn-secondary flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <a href="/offers/new" className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Custom Offer
                    </a>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="stat-card">
                    <p className="text-sm text-zinc-500">Total Offers</p>
                    <p className="text-2xl font-bold mt-1">{total}</p>
                </div>
                <div className="stat-card">
                    <p className="text-sm text-zinc-500">Active</p>
                    <p className="text-2xl font-bold mt-1 text-green-400">
                        {offers.filter(o => o.isActive).length}
                    </p>
                </div>
                <div className="stat-card">
                    <p className="text-sm text-zinc-500">Custom</p>
                    <p className="text-2xl font-bold mt-1 text-purple-400">
                        {offers.filter(o => o.provider === 'CUSTOM').length}
                    </p>
                </div>
                <div className="stat-card">
                    <p className="text-sm text-zinc-500">Total Completions</p>
                    <p className="text-2xl font-bold mt-1">
                        {offers.reduce((sum, o) => sum + o.completionCount, 0).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search offers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                />
            </div>

            {/* Offers Table */}
            <div className="card p-0 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Provider</th>
                                <th>Category</th>
                                <th>Payout</th>
                                <th>Completions</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOffers.map((offer) => (
                                <tr key={offer.id}>
                                    <td>
                                        <div className="max-w-xs">
                                            <p className="font-medium truncate">{offer.name}</p>
                                            <p className="text-xs text-zinc-500 truncate">
                                                {offer.description || 'No description'}
                                            </p>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${offer.provider === 'CUSTOM' ? 'badge-info' : 'badge-secondary'
                                            }`}>
                                            {offer.provider}
                                        </span>
                                    </td>
                                    <td className="text-sm text-zinc-400">{offer.category}</td>
                                    <td className="font-bold text-indigo-400">
                                        {formatTon(offer.payoutNano)} TON
                                    </td>
                                    <td className="text-sm">{offer.completionCount}</td>
                                    <td className="text-sm">{offer.priority}</td>
                                    <td>
                                        <button
                                            onClick={() => handleToggle(offer.id)}
                                            disabled={actionLoading === offer.id}
                                            className="flex items-center gap-1"
                                        >
                                            {offer.isActive ? (
                                                <ToggleRight className="w-6 h-6 text-green-400" />
                                            ) : (
                                                <ToggleLeft className="w-6 h-6 text-zinc-500" />
                                            )}
                                        </button>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            {offer.provider === 'CUSTOM' && (
                                                <button
                                                    onClick={() => handleDelete(offer.id, offer.provider)}
                                                    disabled={actionLoading === offer.id}
                                                    className="p-1.5 hover:bg-red-500/10 rounded text-red-400"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredOffers.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-zinc-500">
                                        No offers found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
