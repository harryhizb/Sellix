import { cn } from '@/lib/utils';
import { colors } from '@/lib/design-system';

export type StatusType = 'pending' | 'confirmed' | 'dispatched' | 'completed' | 'cancelled';

interface StatusBadgeProps {
    status: StatusType;
    className?: string;
}

const statusConfig: Record<StatusType, { label: string; color: string; bgColor: string }> = {
    pending: {
        label: 'Pending',
        color: '#f59e0b',
        bgColor: '#fef3c7',
    },
    confirmed: {
        label: 'Confirmed',
        color: '#3b82f6',
        bgColor: '#dbeafe',
    },
    dispatched: {
        label: 'Dispatched',
        color: '#8b5cf6',
        bgColor: '#ede9fe',
    },
    completed: {
        label: 'Completed',
        color: '#22c55e',
        bgColor: '#dcfce7',
    },
    cancelled: {
        label: 'Cancelled',
        color: '#ef4444',
        bgColor: '#fee2e2',
    },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                className
            )}
            style={{
                backgroundColor: config.bgColor,
                color: config.color,
            }}
        >
            {config.label}
        </span>
    );
}
