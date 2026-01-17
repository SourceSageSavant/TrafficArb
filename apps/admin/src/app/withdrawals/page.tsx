'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Filter,
    Loader2,
    RefreshCw
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Withdrawal {
    id: string;
    amountNano: string;
    walletAddress: string;
    status: string;
    txHash: string | null;
    adminNotes: string | null;
    createdAt: string;
    processedAt: string | null;
    user: {
        id: string;
        username: string | null;
        telegramId: string;
        riskScore: number;
    };
}

const statusConfig: Record<string, { style: string; icon: typeof Clock }> = {
    PENDING: { style: 'badge-warning', icon: Clock },
    PROCESSING: { style: 'badge-info', icon: Clock },
    COMPLETED: { style: 'badge-success', icon: CheckCircle },
    REJECTED: { style: 'badge-danger', icon: XCircle },
    FAILED: { style: 'badge-danger', icon: XCircle },
};

export default function WithdrawalsPage() {
    const router = useRouter();
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [error, setError] = useState('');

    const fetchWithdrawals = async () => {
        setIsLoading(true);
        setError('');

        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '20' });
            if (statusFilter) params.set('status', statusFilter);

            const res = await fetch(`${API_BASE}/api/admin/withdrawals?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) {
                router.push('/login');
                return;
            }

            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || 'Failed to fetch');

            setWithdrawals(data.data.items);
            setTotal(data.data.total);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, [page, statusFilter]);

    const formatTon = (nano: string) => {
        return (Number(BigInt(nano)) / 1e9).toFixed(2);
    };

    const handleApprove = async (id: string) => {
        const txHash = prompt('Enter TX Hash (optional, press Cancel to skip):');
        if (txHash === null) return; // User cancelled

        setActionLoading(id);
        const token = localStorage.getItem('admin_token');

        try {
            const res = await fetch(`${API_BASE}/api/admin/withdrawals/${id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ txHash: txHash || undefined }),
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || 'Failed to approve');

            // Refresh list
            fetchWithdrawals();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        setActionLoading(id);
        const token = localStorage.getItem('admin_token');

        try {
            const res = await fetch(`${API_BASE}/api/admin/withdrawals/${id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason }),
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || 'Failed to reject');

            fetchWithdrawals();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const pendingCount = withdrawals.filter(w => w.status === 'PENDING' || w.status === 'PROCESSING').length;
    const pendingTotal = withdrawals
        .filter(w => w.status === 'PENDING' || w.status === 'PROCESSING')
        .reduce((sum, w) => sum + Number(BigInt(w.amountNano)) / 1e9, 0);

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Withdrawals</h1>
                    <p className="text-sm text-zinc-500 mt-1">Process and manage withdrawal requests</p>
                </div>
                <button onClick={fetchWithdrawals} className="btn-secondary flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="stat-card">
                    <p className="text-sm text-zinc-500">Pending</p>
                    <p className="text-2xl font-bold mt-1 text-amber-400">{pendingCount}</p>
                </div>
                <div className="stat-card">
                    <p className="text-sm text-zinc-500">Pending Amount</p>
                    <p className="text-2xl font-bold mt-1">{pendingTotal.toFixed(2)} TON</p>
                </div>
                <div className="stat-card">
                    <p className="text-sm text-zinc-500">Total Shown</p>
                    <p className="text-2xl font-bold mt-1">{withdrawals.length}</p>
                </div>
                <div className="stat-card">
                    <p className="text-sm text-zinc-500">Total Records</p>
                    <p className="text-2xl font-bold mt-1">{total}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="input w-40"
                >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="FAILED">Failed</option>
                </select>
            </div>

            {/* Withdrawals Table */}
            <div className="card p-0 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Amount</th>
                                <th>Wallet Address</th>
                                <th>Risk</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>TX Hash</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.map((withdrawal) => {
                                const config = statusConfig[withdrawal.status] || statusConfig.PENDING;
                                const Icon = config.icon;

                                return (
                                    <tr key={withdrawal.id}>
                                        <td className="font-medium">
                                            {withdrawal.user.username || `#${withdrawal.user.telegramId.slice(-6)}`}
                                        </td>
                                        <td className="font-bold text-indigo-400">
                                            {formatTon(withdrawal.amountNano)} TON
                                        </td>
                                        <td>
                                            <code className="text-xs text-zinc-400 bg-white/5 px-2 py-1 rounded">
                                                {withdrawal.walletAddress.slice(0, 8)}...{withdrawal.walletAddress.slice(-6)}
                                            </code>
                                        </td>
                                        <td>
                                            <span className={`text-sm font-medium ${withdrawal.user.riskScore > 50 ? 'text-red-400' :
                                                    withdrawal.user.riskScore > 20 ? 'text-amber-400' : 'text-green-400'
                                                }`}>
                                                {withdrawal.user.riskScore}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${config.style} flex items-center gap-1 w-fit`}>
                                                <Icon className="w-3 h-3" />
                                                {withdrawal.status.toLowerCase()}
                                            </span>
                                        </td>
                                        <td className="text-zinc-400 text-sm">
                                            {new Date(withdrawal.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            {withdrawal.txHash ? (
                                                <a
                                                    href={`https://tonscan.org/tx/${withdrawal.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-400 hover:underline flex items-center gap-1 text-sm"
                                                >
                                                    {withdrawal.txHash.slice(0, 10)}...
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-zinc-500 text-sm">-</span>
                                            )}
                                        </td>
                                        <td>
                                            {(withdrawal.status === 'PENDING' || withdrawal.status === 'PROCESSING') && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(withdrawal.id)}
                                                        disabled={actionLoading === withdrawal.id}
                                                        className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === withdrawal.id ? '...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(withdrawal.id)}
                                                        disabled={actionLoading === withdrawal.id}
                                                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                            {withdrawal.status === 'COMPLETED' && (
                                                <span className="text-xs text-green-400">✓ Processed</span>
                                            )}
                                            {withdrawal.status === 'REJECTED' && (
                                                <span className="text-xs text-red-400">✗ Rejected</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {withdrawals.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-zinc-500">
                                        No withdrawals found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {total > 20 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                        <p className="text-sm text-zinc-500">
                            Page {page} of {Math.ceil(total / 20)}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium">
                                {page}
                            </span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= Math.ceil(total / 20)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
