'use client';

import { useState } from 'react';
import {
    Search,
    Filter,
    MoreHorizontal,
    Ban,
    CheckCircle,
    Eye,
    Download,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

// Mock user data
const mockUsers = [
    { id: '1', telegramId: '123456', username: '@crypto_king', firstName: 'Alex', level: 20, balance: '156.50', status: 'ACTIVE', tasksCompleted: 234, riskScore: 15, createdAt: '2024-01-01' },
    { id: '2', telegramId: '234567', username: '@ton_whale', firstName: 'Maria', level: 18, balance: '134.25', status: 'ACTIVE', tasksCompleted: 198, riskScore: 8, createdAt: '2024-01-02' },
    { id: '3', telegramId: '345678', username: '@task_master', firstName: 'John', level: 17, balance: '112.00', status: 'ACTIVE', tasksCompleted: 176, riskScore: 22, createdAt: '2024-01-03' },
    { id: '4', telegramId: '456789', username: '@earn_daily', firstName: 'Sarah', level: 15, balance: '98.75', status: 'SUSPENDED', tasksCompleted: 165, riskScore: 78, createdAt: '2024-01-04' },
    { id: '5', telegramId: '567890', username: null, firstName: 'Michael', level: 14, balance: '87.50', status: 'ACTIVE', tasksCompleted: 142, riskScore: 5, createdAt: '2024-01-05' },
    { id: '6', telegramId: '678901', username: '@mega_earner', firstName: 'Emma', level: 13, balance: '76.25', status: 'ACTIVE', tasksCompleted: 128, riskScore: 12, createdAt: '2024-01-06' },
    { id: '7', telegramId: '789012', username: '@crypto_lover', firstName: 'David', level: 12, balance: '65.00', status: 'BANNED', tasksCompleted: 95, riskScore: 92, createdAt: '2024-01-07' },
    { id: '8', telegramId: '890123', username: null, firstName: 'Sophie', level: 11, balance: '54.75', status: 'ACTIVE', tasksCompleted: 82, riskScore: 3, createdAt: '2024-01-08' },
];

const statusStyles: Record<string, string> = {
    ACTIVE: 'badge-success',
    SUSPENDED: 'badge-warning',
    BANNED: 'badge-danger',
};

export default function UsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredUsers = mockUsers.filter(user => {
        if (statusFilter !== 'all' && user.status !== statusFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                user.username?.toLowerCase().includes(query) ||
                user.firstName.toLowerCase().includes(query) ||
                user.telegramId.includes(query)
            );
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Users</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage platform users</p>
                </div>
                <button className="btn-secondary flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by username, name, or Telegram ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input w-40"
                >
                    <option value="all">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="BANNED">Banned</option>
                </select>
                <button className="btn-secondary flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    More Filters
                </button>
            </div>

            {/* Users Table */}
            <div className="card p-0 overflow-hidden">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Level</th>
                            <th>Balance</th>
                            <th>Tasks</th>
                            <th>Risk Score</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-semibold text-white text-sm">
                                            {user.firstName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium">{user.username || user.firstName}</p>
                                            <p className="text-xs text-zinc-500">ID: {user.telegramId}</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="font-medium">Lvl {user.level}</span>
                                </td>
                                <td>
                                    <span className="font-semibold text-indigo-400">{user.balance} TON</span>
                                </td>
                                <td>{user.tasksCompleted}</td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${user.riskScore < 30 ? 'bg-green-500' :
                                                user.riskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`} />
                                        <span className={
                                            user.riskScore < 30 ? 'text-green-400' :
                                                user.riskScore < 60 ? 'text-yellow-400' : 'text-red-400'
                                        }>{user.riskScore}%</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${statusStyles[user.status]}`}>
                                        {user.status.toLowerCase()}
                                    </span>
                                </td>
                                <td className="text-zinc-400 text-sm">{user.createdAt}</td>
                                <td>
                                    <div className="flex items-center gap-1">
                                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors" title="View Details">
                                            <Eye className="w-4 h-4 text-zinc-400" />
                                        </button>
                                        {user.status === 'ACTIVE' ? (
                                            <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Suspend User">
                                                <Ban className="w-4 h-4 text-red-400" />
                                            </button>
                                        ) : (
                                            <button className="p-2 hover:bg-green-500/10 rounded-lg transition-colors" title="Activate User">
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                            </button>
                                        )}
                                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                            <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                    <p className="text-sm text-zinc-500">
                        Showing 1-{filteredUsers.length} of {mockUsers.length} users
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50" disabled>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium">1</span>
                        <button className="px-3 py-1 hover:bg-white/5 rounded-lg text-sm text-zinc-400">2</button>
                        <button className="px-3 py-1 hover:bg-white/5 rounded-lg text-sm text-zinc-400">3</button>
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
