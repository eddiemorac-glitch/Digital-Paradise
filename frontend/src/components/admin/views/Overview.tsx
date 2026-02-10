import React from 'react';
import { Clock, Shield } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

import { useOverviewLogic } from './overview/useOverviewLogic';
import { OverviewStats } from './overview/OverviewStats';
import { RevenueChart, StatusDistributionChart, TopMerchantsChart } from './overview/Charts';
import { GeographicHeatmap } from './overview/GeographicHeatmap';
import { RecentOrdersTable } from './overview/RecentOrdersTable';
import { QuickActions } from './overview/QuickActions';
import { BroadcastModal } from './overview/BroadcastModal';
import { EventForm } from './EventForm';
import { EmergencyModal } from './EmergencyModal';

interface OverviewProps {
    onNavigate?: (view: any) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
    const {
        analytics,
        heatmapData,
        isBroadcastOpen, setIsBroadcastOpen,
        showEventModal, setShowEventModal,
        showEmergencyModal, setShowEmergencyModal,
        createEventMutation,
        broadcastMutation,
        sendBroadcast,
        handleExportCSV
    } = useOverviewLogic();

    return (
        <div className="space-y-8 relative">
            {/* Modals */}
            <AnimatePresence>
                {isBroadcastOpen && (
                    <BroadcastModal
                        isOpen={isBroadcastOpen}
                        onClose={() => setIsBroadcastOpen(false)}
                        onBroadcast={sendBroadcast}
                        isLoading={broadcastMutation.isPending}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEventModal && (
                    <EventForm
                        onClose={() => setShowEventModal(false)}
                        onSubmit={(data) => createEventMutation.mutate(data)}
                        isLoading={createEventMutation.isPending}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEmergencyModal && (
                    <EmergencyModal onClose={() => setShowEmergencyModal(false)} />
                )}
            </AnimatePresence>

            {/* Control Center Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                        <Shield className="text-primary" size={28} />
                        Misión Control
                    </h2>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Sistema en línea | Tiempo Real
                    </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                    <Clock size={16} className="text-white/40" />
                    <span className="text-sm font-mono font-bold">{new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            {/* Tactical Stats Grid */}
            <OverviewStats analytics={analytics} />

            {/* Intelligence & Trends Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RevenueChart analytics={analytics} />
                <StatusDistributionChart analytics={analytics} onNavigate={onNavigate} />
                <TopMerchantsChart analytics={analytics} onNavigate={onNavigate} />
                <GeographicHeatmap data={heatmapData} />
            </div>

            {/* Bóveda Caribe - Financial Integrity Monitor */}
            <RecentOrdersTable analytics={analytics} />

            {/* Quick Actions Nexus */}
            <QuickActions
                onBroadcastOpen={() => setIsBroadcastOpen(true)}
                onExportCSV={handleExportCSV}
                onEventModalOpen={() => setShowEventModal(true)}
                onEmergencyModalOpen={() => setShowEmergencyModal(true)}
                onNavigate={onNavigate}
            />
        </div>
    );
};
