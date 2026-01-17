'use client';

import {
    BarChart3,
    TrendingUp,
    Users,
    Wallet,
    Gift,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

// Mock analytics data
const dailyStats = [
    { date: 'Mon', users: 120, tasks: 450, earnings: 85 },
    { date: 'Tue', users: 145, tasks: 520, earnings: 102 },
    { date: 'Wed', users: 135, tasks: 480, earnings: 95 },
    { date: 'Thu', users: 160, tasks: 610, earnings: 124 },
    { date: 'Fri', users: 180, tasks: 720, earnings: 145 },
    { date: 'Sat', users: 210, tasks: 890, earnings: 178 },
    { date: 'Sun', users: 195, tasks: 820, earnings: 165 },
];

const topProviders = [
    { name: 'CPAGrip', completions: 4521, earnings: '$2,340', color: 'bg-indigo-500' },
    { name: 'OGAds', completions: 3892, earnings: '$1,890', color: 'bg-emerald-500' },
    { name: 'AdGate', completions: 2156, earnings: '$980', color: 'bg-orange-500' },
];

const topCountries = [
    { country: 'United States', flag: '🇺🇸', users: 4521, percentage: 35 },
    { country: 'United Kingdom', flag: '🇬🇧', users: 2341, percentage: 18 },
    { country: 'Germany', flag: '🇩🇪', users: 1892, percentage: 15 },
    { country: 'Canada', flag: '🇨🇦', users: 1456, percentage: 11 },
    { country: 'France', flag: '🇫🇷', users: 1234, percentage: 10 },
];

export default function AnalyticsPage() {
    const maxTasks = Math.max(...dailyStats.map(d => d.tasks));

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-indigo-400" />
                        Analytics
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">Platform performance and insights</p>
                </div>
                <select className="input w-36">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                </select>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">Total Revenue</p>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold mt-2">$5,210</p>
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> +24% vs last week
                    </p>
                </div>
                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">New Users</p>
                        <Users className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-2xl font-bold mt-2">1,145</p>
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> +12% vs last week
                    </p>
                </div>
                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">Tasks Completed</p>
                        <Gift className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold mt-2">4,490</p>
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> +18% vs last week
                    </p>
                </div>
                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-500">Paid Out</p>
                        <Wallet className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-2xl font-bold mt-2">847.5 TON</p>
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <ArrowDownRight className="w-3 h-3" /> -5% vs last week
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-6">
                {/* Tasks Chart */}
                <div className="col-span-2 card">
                    <h2 className="font-semibold text-lg mb-4">Daily Task Completions</h2>
                    <div className="flex items-end gap-3 h-48">
                        {dailyStats.map((day) => (
                            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-lg transition-all hover:opacity-80"
                                    style={{ height: `${(day.tasks / maxTasks) * 100}%` }}
                                />
                                <span className="text-xs text-zinc-500">{day.date}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Provider Stats */}
                <div className="card">
                    <h2 className="font-semibold text-lg mb-4">Top Providers</h2>
                    <div className="space-y-4">
                        {topProviders.map((provider) => (
                            <div key={provider.name}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">{provider.name}</span>
                                    <span className="text-sm text-zinc-400">{provider.completions.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${provider.color} rounded-full`}
                                        style={{ width: `${(provider.completions / topProviders[0].completions) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-green-400 mt-1">{provider.earnings} earned</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Countries */}
            <div className="card">
                <h2 className="font-semibold text-lg mb-4">Top Countries</h2>
                <div className="grid grid-cols-5 gap-4">
                    {topCountries.map((country) => (
                        <div key={country.country} className="text-center p-4 rounded-xl bg-white/5">
                            <span className="text-3xl">{country.flag}</span>
                            <p className="font-medium mt-2">{country.country}</p>
                            <p className="text-sm text-zinc-500">{country.users.toLocaleString()} users</p>
                            <p className="text-xs text-indigo-400 font-semibold mt-1">{country.percentage}%</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
