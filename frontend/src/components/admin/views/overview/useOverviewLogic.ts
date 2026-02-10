import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { analyticsApi, AdminSummary } from '../../../../api/analytics';
import { eventsApi } from '../../../../api/events';
import { notificationsApi } from '../../../../api/notifications';
import { socketService } from '../../../../api/socket';

export const useOverviewLogic = () => {
    const queryClient = useQueryClient();

    // State
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);

    // Refs (Map logic will be handled within the Heatmap component, but we need data here)
    // Actually, let's keep map logic in the Heatmap component to avoid passing refs.

    // Queries
    const { data: analytics } = useQuery<AdminSummary>({
        queryKey: ['admin-analytics'],
        queryFn: () => analyticsApi.getAdminSummary()
    });

    const { data: heatmapData } = useQuery<any[]>({
        queryKey: ['admin-heatmap'],
        queryFn: () => analyticsApi.getHeatmap()
    });

    // Mutations
    const createEventMutation = useMutation({
        mutationFn: eventsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            toast.success('Evento creado directamente desde Misión Control');
            setShowEventModal(false);
        },
        onError: () => toast.error('Error al crear evento')
    });

    const broadcastMutation = useMutation({
        mutationFn: (data: { title: string; message: string; type: string }) => notificationsApi.broadcast(data),
        onSuccess: () => {
            toast.success('Mensaje emitido a toda la red');
            setIsBroadcastOpen(false);
        },
        onError: () => toast.error('Error al emitir mensaje')
    });

    // WebSockets
    useEffect(() => {
        socketService.connect();
        socketService.joinAdminRoom();

        socketService.onEmergencyAlert((data) => {
            toast(`🚨 EMERGENCIA: ${data.title}`, {
                description: data.message,
                duration: 10000,
                action: {
                    label: 'Ver Detalle',
                    onClick: () => setShowEmergencyModal(true)
                }
            });
        });

        socketService.onNewOrder(() => {
            queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
            toast.info('Nuevo pedido recibido - Actualizando métricas');
        });
    }, [queryClient]);

    // Handlers
    // Handlers
    const sendBroadcast = (data: { title: string; message: string; type: string }) => {
        broadcastMutation.mutate(data);

        socketService.emitEmergencyBroadcast({
            title: data.title,
            message: data.message,
            type: data.type === 'warning' ? 'ALERT' : 'LOCKDOWN'
        });
        // Mutation onSuccess will close modal and toast
    };

    const handleExportCSV = () => {
        if (!analytics) return;

        const csvRows = [];
        // Header
        csvRows.push(['Fecha', 'Ingresos', 'Pedidos']);

        // Data
        analytics.dailyTrends.forEach((day: any) => {
            csvRows.push([day.date, day.revenue, day.orders]);
        });

        // Add Merchant Summary
        csvRows.push(['']);
        csvRows.push(['Comercio', 'Ingresos Totales', 'Pedidos Totales']);
        analytics.topMerchants.forEach((m: any) => {
            csvRows.push([m.name, m.revenue, m.orders]);
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_general_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Reporte CSV generado correctamente');
    };

    return {
        // Data
        analytics,
        heatmapData,

        // State
        isBroadcastOpen, setIsBroadcastOpen,
        showEventModal, setShowEventModal,
        showEmergencyModal, setShowEmergencyModal,

        // Mutations
        createEventMutation,
        broadcastMutation,

        // Handlers
        sendBroadcast,
        handleExportCSV
    };
};
