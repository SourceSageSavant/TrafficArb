'use client';

import { motion } from 'framer-motion';
import { Settings, Bell, Moon, Volume2, Shield, ChevronRight } from 'lucide-react';
import { useTelegram } from '@/components/providers/TelegramProvider';
import { useState } from 'react';

export default function SettingsPage() {
    const { hapticFeedback } = useTelegram();
    const [notifications, setNotifications] = useState(true);
    const [sound, setSound] = useState(true);

    const toggle = (setter: any, val: boolean) => {
        hapticFeedback('light');
        setter(!val);
    };

    return (
        <div className="px-4 py-4 pb-24 min-h-screen bg-primary">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
            >
                <h1 className="text-xl font-bold flex items-center justify-center gap-2">
                    <Settings className="w-5 h-5" />
                    Settings
                </h1>
            </motion.div>

            <div className="space-y-4">
                {/* Preferences */}
                <div className="card space-y-4">
                    <h2 className="text-sm font-bold text-muted uppercase tracking-wider">Preferences</h2>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                <Bell className="w-4 h-4 text-accent" />
                            </div>
                            <span className="font-medium">Notifications</span>
                        </div>
                        <button
                            onClick={() => toggle(setNotifications, notifications)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-accent' : 'bg-subtle'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-subtle">
                                <Volume2 className="w-4 h-4 text-muted" />
                            </div>
                            <span className="font-medium">Sound Effects</span>
                        </div>
                        <button
                            onClick={() => toggle(setSound, sound)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${sound ? 'bg-accent' : 'bg-subtle'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${sound ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                {/* About */}
                <div className="card space-y-1">
                    <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">About</h2>

                    <button className="w-full flex items-center justify-between py-2">
                        <span className="font-medium">Privacy Policy</span>
                        <ChevronRight className="w-4 h-4 text-muted" />
                    </button>
                    <div className="h-px bg-subtle" />
                    <button className="w-full flex items-center justify-between py-2">
                        <span className="font-medium">Terms of Service</span>
                        <ChevronRight className="w-4 h-4 text-muted" />
                    </button>
                    <div className="h-px bg-subtle" />
                    <div className="flex items-center justify-between py-2 text-sm text-muted">
                        <span>Version</span>
                        <span>1.0.0 (Beta)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
