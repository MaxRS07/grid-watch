interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
    isLoading: boolean;
    status?: string;
    currentFileName?: string;
    currentFileEvents?: number;
    totalFileEvents?: number;
}

export default function ProgressBar({
    current,
    total,
    label = 'Loading',
    isLoading,
    status,
    currentFileName,
    currentFileEvents,
    totalFileEvents
}: ProgressBarProps) {
    if (!isLoading) return null;

    const percentage = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {label}
                    </h3>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {current} / {total}
                    </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {status && (
                    <p className="text-xs text-zinc-700 dark:text-zinc-200 font-medium">
                        {status}
                    </p>
                )}
                {currentFileName && currentFileEvents !== undefined && totalFileEvents !== undefined && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                        <span className="font-medium">{currentFileName}</span>: {currentFileEvents.toLocaleString()} / {totalFileEvents.toLocaleString()} events
                    </p>
                )}
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Processing data...
                </p>
            </div>
        </div>
    );
}
