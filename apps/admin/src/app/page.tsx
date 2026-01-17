'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Wallet,
    Gift,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Activity,
    Loader2,
    RefreshCw
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Stats {
    users: { total: number; newToday: number };
    offers: { active: number };
    withdrawals: { pending: number; pendingAmountNano: string };
    tasks: { completedToday: number };
    revenue: { totalNano: string };
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    const fetchStats = async () => {
        setIsLoading(true);
        setError('');

        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) {
                router.push('/login');
                return;
            }

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error?.message || 'Failed to fetch stats');
            }

            setStats(data.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatTon = (nano: string) => {
        return (BigInt(nano) / BigInt(1e9)).toString();
    };

    const statCards = stats ? [
        {
            label: 'Total Users',
            value: stats.users.total.toLocaleString(),
            subtext: `+${stats.users.newToday} today`,
            positive: stats.users.newToday > 0,
            icon: Users,
            color: 'indigo'
        },
        {
            label: 'Active Offers',
            value: stats.offers.active.toString(),
            subtext: 'Tasks available',
            positive: true,
            icon: Gift,
            color: 'purple'
        },
        {
            label: 'Pending Withdrawals',
            value: `${formatTon(stats.withdrawals.pendingAmountNano)} TON`,
            subtext: `${stats.withdrawals.pending} requests`,
            positive: false,
            icon: Wallet,
            color: 'amber'
        },
        {
            label: 'Tasks Today',
            value: stats.tasks.completedToday.toLocaleString(),
            subtext: 'Completed',
            positive: true,
            icon: TrendingUp,
            color: 'green'
        },
    ] : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-sm text-zinc-500 mt-1">Welcome back, Admin</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStats}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <a href="/offers/new" className="btn-primary">+ Add Offer</a>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="stat-card">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-zinc-500">{stat.label}</p>
                                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 mt-3 text-sm ${stat.positive ? 'text-green-400' : 'text-amber-400'}`}>
                                {stat.positive ? <ArrowUpRight className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                <span>{stat.subtext}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-6">
                <a href="/withdrawals" className="card hover:border-indigo-500/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Pending Withdrawals</h3>
                            <p className="text-sm text-zinc-500">{stats?.withdrawals.pending || 0} awaiting approval</p>
                        </div>
                    </div>
                </a>

                <a href="/offers" className="card hover:border-indigo-500/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Gift className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Manage Offers</h3>
                            <p className="text-sm text-zinc-500">Add or edit tasks</p>
                        </div>
                    </div>
                </a>

                <a href="/users" className="card hover:border-indigo-500/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold">User Management</h3>
                            <p className="text-sm text-zinc-500">View and manage users</p>
                        </div>
                    </div>
                </a>
            </div>

            {/* Revenue Card */}
            {stats && (
                <div className="card">
                    <h2 className="font-semibold text-lg mb-4">Total Revenue</h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-indigo-400">
                            {formatTon(stats.revenue.totalNano)}
                        </span>
                        <span className="text-zinc-500">TON distributed</span>
                    </div>
                </div>
            )}
        </div>
    );
}
