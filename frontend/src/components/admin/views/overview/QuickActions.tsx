import React from 'react';
import { Globe, Bell, Download, Sparkles, Shield, AlertTriangle, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface QuickActionsProps {
    onBroadcastOpen: () => void;
    onExportCSV: () => void;
    onEventModalOpen: () => void;
    onEmergencyModalOpen: () => void;
    onNavigate?: (view: any) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
    onBroadcastOpen,
    onExportCSV,
    onEventModalOpen,
    onEmergencyModalOpen,
    onNavigate
}) => {
    const actions = [
        { label: 'Broadcast', icon: <Bell />, action: onBroadcastOpen },
        { label: 'Exportar CSV', icon: <Download />, action: onExportCSV },
        { label: 'Nuevo Evento', icon: <Sparkles />, action: onEventModalOpen },
        { label: 'Verificar Merchant', icon: <Shield />, action: () => onNavigate && onNavigate('merchants') },
        { label: 'Emergencia', icon: <AlertTriangle />, action: onEmergencyModalOpen },
        { label: 'Soporte', icon: <Activity />, action: () => toast.info('Panel de soporte próximamente') },
    ];

    return (
        <div className="glass p-8 rounded-[3.5rem] border-white/5">
            <div className="flex items-center gap-4 mb-6">
                <Globe className="text-primary" size={24} />
                <h3 className="text-xl font-black uppercase tracking-tight italic">Nexos Rápidos</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {actions.map((action, i) => (
                    <button
                        key={i}
                        onClick={action.action}
                        className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-[2rem] border border-white/5 transition-all group"
                    >
                        <div className="text-white/40 group-hover:text-primary transition-colors">
                            {action.icon}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
