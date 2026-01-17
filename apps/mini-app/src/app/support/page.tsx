'use client';

import { motion } from 'framer-motion';
import { HelpCircle, Mail, MessageSquare } from 'lucide-react';

export default function SupportPage() {
    return (
        <div className="px-4 py-4 pb-24 min-h-screen bg-primary">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                    <HelpCircle className="w-8 h-8 text-accent" />
                </div>
                <h1 className="text-2xl font-bold">Help & Support</h1>
                <p className="text-muted mt-2">How can we help you today?</p>
            </motion.div>

            <div className="grid gap-4">
                <a
                    href="https://t.me/TrafficArbSupport"
                    target="_blank"
                    className="card flex items-center gap-4 hover:bg-secondary/80 transition-colors"
                >
                    <div className="w-12 h-12 rounded-xl bg-[#0088cc]/10 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-[#0088cc]" />
                    </div>
                    <div>
                        <h3 className="font-bold">Telegram Support</h3>
                        <p className="text-sm text-muted">Chat with our support team</p>
                    </div>
                </a>

                <a
                    href="mailto:support@trafficarb.com"
                    className="card flex items-center gap-4 hover:bg-secondary/80 transition-colors"
                >
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="font-bold">Email Support</h3>
                        <p className="text-sm text-muted">Get help via email</p>
                    </div>
                </a>
            </div>

            <div className="mt-8">
                <h2 className="font-bold mb-4">FAQ</h2>
                <div className="space-y-3">
                    <details className="card p-0 overflow-hidden group">
                        <summary className="p-4 cursor-pointer font-medium flex items-center justify-between">
                            How do I earn TON?
                            <span className="text-xl">+</span>
                        </summary>
                        <div className="px-4 pb-4 text-sm text-muted border-t border-subtle pt-3">
                            Complete tasks from our partners listed on the homepage. Once verified, rewards are credited to your wallet immediately.
                        </div>
                    </details>

                    <details className="card p-0 overflow-hidden group">
                        <summary className="p-4 cursor-pointer font-medium flex items-center justify-between">
                            When can I withdraw?
                            <span className="text-xl">+</span>
                        </summary>
                        <div className="px-4 pb-4 text-sm text-muted border-t border-subtle pt-3">
                            The minimum withdrawal is 3 TON. We process withdrawals instantly to your connected TON wallet.
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
}
