import React from 'react';
import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onChange: (start: string, end: string) => void;
    onClear?: () => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
    startDate,
    endDate,
    onChange,
    onClear
}) => {
    // Quick ranges configuration
    const quickRanges = [
        { label: '7D', days: 7 },
        { label: '30D', days: 30 },
        { label: '90D', days: 90 },
    ];

    const applyRange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1)); // inclusive of today

        onChange(
            start.toISOString().split('T')[0],
            end.toISOString().split('T')[0]
        );
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-xl">
            {/* Quick Selectors */}
            <div className="flex bg-black/20 rounded-lg p-1">
                {quickRanges.map((range) => (
                    <button
                        key={range.label}
                        onClick={() => applyRange(range.days)}
                        className="px-3 py-1 text-xs font-bold rounded-md transition-colors hover:bg-white/10 text-white/60 hover:text-white"
                    >
                        {range.label}
                    </button>
                ))}
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            {/* Manual Inputs */}
            <div className="flex items-center gap-2">
                <div className="relative group">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary" size={14} />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => onChange(e.target.value, endDate)}
                        className="pl-8 pr-2 py-1.5 bg-black/20 border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-primary/50 transition-colors w-32"
                    />
                </div>
                <span className="text-white/40 text-xs">-</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onChange(startDate, e.target.value)}
                    className="px-2 py-1.5 bg-black/20 border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-primary/50 transition-colors w-32 text-center"
                />
            </div>

            {onClear && (
                <button
                    onClick={onClear}
                    className="p-1.5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-lg transition-colors"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
};
