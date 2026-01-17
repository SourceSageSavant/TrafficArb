'use client';

import { Bell, Search, User } from 'lucide-react';

export function Header() {
    return (
        <header className="h-16 border-b border-white/5 bg-[#0c0c0f]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-10">
            {/* Search */}
            <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search users, offers..."
                    className="input pl-10 py-2 text-sm bg-white/5"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Bell className="w-5 h-5 text-zinc-400" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* User Menu */}
                <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                    <div className="text-right">
                        <p className="text-sm font-medium">Admin</p>
                        <p className="text-xs text-zinc-500">Super Admin</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>
        </header>
    );
}
