'use client';

import { motion } from 'framer-motion';
import { History, CheckCircle2, XCircle, Clock, Loader2, Search } from 'lucide-react';
import { useUserTasks } from '@/hooks/useApi';

export default function HistoryPage() {
    const { data: tasksData, isLoading } = useUserTasks();
    const tasks = (tasksData as any)?.items || [];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle2 className="w-5 h-5 text-success" />;
            case 'REJECTED': return <XCircle className="w-5 h-5 text-danger" />;
            default: return <Clock className="w-5 h-5 text-warning" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'text-success bg-success/10';
            case 'REJECTED': return 'text-danger bg-danger/10';
            default: return 'text-warning bg-warning/10';
        }
    };

    return (
        <div className="px-4 py-4 pb-24 min-h-screen bg-primary">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
            >
                <div className="w-12 h-12 mx-auto bg-secondary rounded-full flex items-center justify-center mb-3">
                    <History className="w-6 h-6 text-accent" />
                </div>
                <h1 className="text-xl font-bold">Task History</h1>
            </motion.div>

            {isLoading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
            )}

            {!isLoading && tasks.length === 0 && (
                <div className="text-center py-16">
                    <Search className="w-12 h-12 mx-auto text-muted mb-4" />
                    <p className="text-secondary font-medium">No tasks found</p>
                    <p className="text-sm text-muted">Complete offers to see them here</p>
                </div>
            )}

            <div className="space-y-3">
                {tasks.map((task: any, index: number) => (
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="card flex items-center gap-4"
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.offerName}</p>
                            <p className="text-xs text-muted">
                                {new Date(task.startedAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-sm">+{task.payout} TON</p>
                            <span className="text-[10px] uppercase font-bold text-muted">
                                {task.status}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
