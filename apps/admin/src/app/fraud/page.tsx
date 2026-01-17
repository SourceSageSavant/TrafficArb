'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield,
    AlertTriangle,
    Eye,
    Ban,
    Filter,
    TrendingUp,
    Fingerprint,
    Globe,
    Smartphone,
    Loader2,
    RefreshCw,
    CheckCircle
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FraudAlert {
    id: string;
    userId: string;
    alertType: string;
    riskScore: number;
    riskLevel: string;
    flags: string[];
    details: any;
    status: string;
    createdAt: string;
    user: {
        id: string;
        username: string | null;
        telegramId: string;
    };
}

const typeConfig: Record<string, { icon: typeof Fingerprint; label: string; color: string }> = {
    MULTIPLE_DEVICES: { icon: Smartphone, label: 'Multiple Devices', color: 'text-amber-400 bg-amber-500/15' },
    RAPID_COMPLETION: { icon: TrendingUp, label: 'Rapid Completion', color: 'text-red-400 bg-red-500/15' },
    VPN_DETECTED: { icon: Globe, label: 'VPN/Proxy', color: 'text-blue-400 bg-blue-500/15' },
    SELF_REFERRAL: { icon: Fingerprint, label: 'Self Referral', color: 'text-purple-400 bg-purple-500/15' },
    HIGH_RISK_SCORE: { icon: AlertTriangle, label: 'High Risk', color: 'text-red-400 bg-red-500/15' },
};

const statusConfig: Record<string, string> = {
    OPEN: 'badge-danger',
    INVESTIGATING: 'badge-warning',
    RESOLVED: 'badge-success',
    DISMISSED: 'badge-secondary',
};

export default function FraudPage() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<FraudAlert[]>([]);
    const [openCount, setOpenCount] = useState(0);
    const [investigatingCount, setInvestigatingCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [error, setError] = useState('');

    const fetchAlerts = async () => {
        setIsLoading(true);
        setError('');

        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);

            const res = await fetch(`${API_BASE}/api/admin/fraud-alerts?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) {
                router.push('/login');
                return;
            }

            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || 'Failed to fetch');

            setAlerts(data.data.items);
            setOpenCount(data.data.openCount);
            setInvestigatingCount(data.data.investigatingCount);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, [statusFilter]);

    const handleUpdateStatus = async (id: string, status: string) => {
        setActionLoading(id);
        const token = localStorage.getItem('admin_token');

        try {
            const res = await fetch(`${API_BASE}/api/admin/fraud-alerts/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || 'Failed to update');

            fetchAlerts();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBlockUser = async (id: string) => {
        if (!confirm('Are you sure you want to BLOCK this user? This will ban them from the platform.')) return;

        setActionLoading(id);
        const token = localStorage.getItem('admin_token');

        try {
            const res = await fetch(`${API_BASE}/api/admin/fraud-alerts/${id}/block-user`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || 'Failed to block');

            fetchAlerts();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="w-6 h-6 text-indigo-400" />
                        Fraud Detection
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">Monitor and investigate suspicious activities</p>
                </div>
                <button onClick={fetchAlerts} className="btn-secondary flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Alert Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="stat-card border-l-4 border-l-red-500">
                    <p className="text-sm text-zinc-500">Open Alerts</p>
                    <p className="text-2xl font-bold mt-1 text-red-400">{openCount}</p>
                </div>
                <div className="stat-card border-l-4 border-l-amber-500">
                    <p className="text-sm text-zinc-500">Investigating</p>
                    <p className="text-2xl font-bold mt-1 text-amber-400">{investigatingCount}</p>
                </div>
                <div className="stat-card">
                    <p className="text-sm text-zinc-500">Total Alerts</p>
                    <p className="text-2xl font-bold mt-1">{alerts.length}</p>
                </div>
                <div className="stat-card">
                    <p className="text-sm text-zinc-500">High Risk</p>
                    <p className="text-2xl font-bold mt-1 text-red-400">
                        {alerts.filter(a => a.riskScore > 70).length}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input w-40"
                >
                    <option value="">All Status</option>
                    <option value="OPEN">Open</option>
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="DISMISSED">Dismissed</option>
                </select>
            </div>

            {/* Alerts List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
            ) : alerts.length === 0 ? (
                <div className="card text-center py-12 text-zinc-500">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No fraud alerts found</p>
                    <p className="text-sm">The system is running clean 🎉</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {alerts.map((alert) => {
                        const config = typeConfig[alert.alertType] || typeConfig.HIGH_RISK_SCORE;
                        const Icon = config.icon;

                        return (
                            <div key={alert.id} className="card">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color.split(' ')[1]}`}>
                                        <Icon className={`w-6 h-6 ${config.color.split(' ')[0]}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-semibold">{config.label}</h3>
                                            <span className={`badge ${statusConfig[alert.status] || 'badge-secondary'}`}>
                                                {alert.status.toLowerCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-400">
                                            {alert.flags?.join(', ') || 'No specific flags'}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                                            <span>
                                                User: <span className="text-indigo-400">
                                                    {alert.user.username || `#${alert.user.telegramId.slice(-6)}`}
                                                </span>
                                            </span>
                                            <span>{new Date(alert.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-zinc-500">Risk</span>
                                            <span className={`text-lg font-bold ${alert.riskScore > 70 ? 'text-red-400' :
                                                    alert.riskScore > 40 ? 'text-amber-400' : 'text-green-400'
                                                }`}>
                                                {alert.riskScore}%
                                            </span>
                                        </div>
                                        {alert.status !== 'RESOLVED' && alert.status !== 'DISMISSED' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(alert.id, 'INVESTIGATING')}
                                                    disabled={actionLoading === alert.id || alert.status === 'INVESTIGATING'}
                                                    className="px-3 py-1.5 text-xs font-medium hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    Review
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(alert.id, 'DISMISSED')}
                                                    disabled={actionLoading === alert.id}
                                                    className="px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/10 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-3 h-3" />
                                                    Dismiss
                                                </button>
                                                <button
                                                    onClick={() => handleBlockUser(alert.id)}
                                                    disabled={actionLoading === alert.id}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    <Ban className="w-3 h-3" />
                                                    Block
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
