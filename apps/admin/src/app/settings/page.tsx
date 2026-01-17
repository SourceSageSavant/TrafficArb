'use client';

import { useState } from 'react';
import {
    Settings as SettingsIcon,
    Wallet,
    Shield,
    Bell,
    Users,
    Save
} from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        minWithdrawal: '3',
        maxWithdrawal: '100',
        withdrawalFee: '0.5',
        referralTier1: '10',
        referralTier2: '3',
        referralTier3: '1',
        autoApproveWithdrawals: false,
        enableNewUserBonus: true,
        newUserBonusAmount: '0.1',
        requireEmailVerification: false,
        maxDailyTasks: '50',
        fraudRiskThreshold: '70',
    });

    const handleSave = () => {
        // Save settings to API
        alert('Settings saved!');
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <SettingsIcon className="w-6 h-6 text-indigo-400" />
                        Settings
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">Configure platform settings</p>
                </div>
                <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>

            {/* Withdrawal Settings */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-green-400" />
                    </div>
                    <h2 className="font-semibold text-lg">Withdrawal Settings</h2>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Minimum Withdrawal (TON)</label>
                        <input
                            type="number"
                            value={settings.minWithdrawal}
                            onChange={(e) => setSettings({ ...settings, minWithdrawal: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Maximum Withdrawal (TON)</label>
                        <input
                            type="number"
                            value={settings.maxWithdrawal}
                            onChange={(e) => setSettings({ ...settings, maxWithdrawal: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Withdrawal Fee (%)</label>
                        <input
                            type="number"
                            value={settings.withdrawalFee}
                            onChange={(e) => setSettings({ ...settings, withdrawalFee: e.target.value })}
                            className="input"
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.autoApproveWithdrawals}
                            onChange={(e) => setSettings({ ...settings, autoApproveWithdrawals: e.target.checked })}
                            className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="text-sm">Auto-approve withdrawals under 5 TON</span>
                    </label>
                </div>
            </div>

            {/* Referral Settings */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="font-semibold text-lg">Referral Commission</h2>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Tier 1 Commission (%)</label>
                        <input
                            type="number"
                            value={settings.referralTier1}
                            onChange={(e) => setSettings({ ...settings, referralTier1: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Tier 2 Commission (%)</label>
                        <input
                            type="number"
                            value={settings.referralTier2}
                            onChange={(e) => setSettings({ ...settings, referralTier2: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Tier 3 Commission (%)</label>
                        <input
                            type="number"
                            value={settings.referralTier3}
                            onChange={(e) => setSettings({ ...settings, referralTier3: e.target.value })}
                            className="input"
                        />
                    </div>
                </div>
            </div>

            {/* User Settings */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="font-semibold text-lg">User Settings</h2>
                </div>
                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.enableNewUserBonus}
                            onChange={(e) => setSettings({ ...settings, enableNewUserBonus: e.target.checked })}
                            className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="text-sm">Enable new user bonus</span>
                    </label>
                    {settings.enableNewUserBonus && (
                        <div className="ml-8">
                            <label className="block text-sm text-zinc-400 mb-2">Bonus Amount (TON)</label>
                            <input
                                type="number"
                                value={settings.newUserBonusAmount}
                                onChange={(e) => setSettings({ ...settings, newUserBonusAmount: e.target.value })}
                                className="input w-32"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Max Daily Tasks per User</label>
                        <input
                            type="number"
                            value={settings.maxDailyTasks}
                            onChange={(e) => setSettings({ ...settings, maxDailyTasks: e.target.value })}
                            className="input w-32"
                        />
                    </div>
                </div>
            </div>

            {/* Fraud Settings */}
            <div className="card">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-400" />
                    </div>
                    <h2 className="font-semibold text-lg">Anti-Fraud Settings</h2>
                </div>
                <div>
                    <label className="block text-sm text-zinc-400 mb-2">Auto-suspend threshold (Risk Score %)</label>
                    <input
                        type="number"
                        value={settings.fraudRiskThreshold}
                        onChange={(e) => setSettings({ ...settings, fraudRiskThreshold: e.target.value })}
                        className="input w-32"
                    />
                    <p className="text-xs text-zinc-500 mt-2">Users exceeding this risk score will be automatically suspended</p>
                </div>
            </div>
        </div>
    );
}
