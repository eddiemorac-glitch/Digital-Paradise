import React from 'react';
import { Search, Filter } from 'lucide-react';
import { EVENT_TYPE_CONFIG, EventType } from '../../../../types/event-type-config';

interface EventFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterType: EventType | 'all';
    setFilterType: (type: EventType | 'all') => void;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar eventos..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shrink-0 transition-all ${filterType === 'all'
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                >
                    <Filter size={12} className="inline mr-1" />
                    Todos
                </button>
                {Object.entries(EVENT_TYPE_CONFIG).slice(0, 5).map(([key, config]: [any, any]) => (
                    <button
                        key={key}
                        onClick={() => setFilterType(key as EventType)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${filterType === key
                            ? 'border'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                            }`}
                        style={{
                            borderColor: filterType === key ? config.color : undefined,
                            backgroundColor: filterType === key ? `${config.color}20` : undefined,
                            color: filterType === key ? config.color : undefined
                        }}
                    >
                        {config.icon} {config.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
