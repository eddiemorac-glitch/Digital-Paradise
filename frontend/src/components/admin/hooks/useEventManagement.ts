import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { eventsApi, CreateEventDTO } from '../../../api/events';
import { Event as AppEvent, EventRequest as AppEventRequest } from '../../../types/event';
import { EventType } from '../../../types/event-type-config';

export const useEventManagement = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<EventType | 'all'>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'active' | 'requests'>('active');
    const [selectedRequest, setSelectedRequest] = useState<AppEventRequest | null>(null);

    // Queries
    const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
        queryKey: ['admin-events'],
        queryFn: eventsApi.getAll
    });

    const { data: requests } = useQuery({
        queryKey: ['admin-event-requests'],
        queryFn: () => eventsApi.getAllRequests('PENDING'),
        refetchInterval: 30000
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: eventsApi.create,
        onSuccess: async () => {
            if (selectedRequest) {
                await eventsApi.updateRequestStatus(selectedRequest.id, 'APPROVED');
            }
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            queryClient.invalidateQueries({ queryKey: ['admin-event-requests'] });
            setShowForm(false);
            setSelectedRequest(null);
            toast.success('Evento publicado y solicitud aprobada');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateEventDTO> }) =>
            eventsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            setEditingEvent(null);
            setShowForm(false);
            toast.success('Evento actualizado');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: eventsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            setDeleteConfirm(null);
            toast.success('Evento eliminado');
        }
    });

    const rejectRequestMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            eventsApi.updateRequestStatus(id, 'REJECTED', reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-event-requests'] });
            toast.info('Solicitud rechazada');
        }
    });

    // Handlers
    const handleSubmit = (data: CreateEventDTO) => {
        if (editingEvent && editingEvent.id !== 'NEW_REQUEST') {
            updateMutation.mutate({ id: editingEvent.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (event: AppEvent) => {
        setEditingEvent(event);
        setShowForm(true);
    };

    const handlePromote = (request: any) => {
        setSelectedRequest(request);
        const prefilledEvent: any = {
            title: request.title,
            description: request.description,
            date: request.date,
            time: request.time,
            locationName: request.locationName || request.venue,
            venue: request.venue,
            category: request.category,
            adTier: request.adTier,
            adSize: request.adSize,
            isEcoFriendly: request.isEcoFriendly
        };
        setEditingEvent({ ...prefilledEvent, id: 'NEW_REQUEST' } as AppEvent);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingEvent(null);
        setSelectedRequest(null);
    };

    // Filters
    const filteredEvents = events?.filter((event: AppEvent) => {
        const titleMatch = (event.title || '').toLowerCase().includes(searchTerm.toLowerCase());
        const locationMatch = (event.locationName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch = titleMatch || locationMatch;
        const matchesType = filterType === 'all' || event.type === filterType;
        return matchesSearch && matchesType;
    });

    return {
        // State
        searchTerm, setSearchTerm,
        filterType, setFilterType,
        showForm, setShowForm,
        editingEvent, setEditingEvent,
        deleteConfirm, setDeleteConfirm,
        viewMode, setViewMode,
        selectedRequest,

        // Data
        events,
        filteredEvents, // Exported
        eventsLoading, refetchEvents,
        requests,

        // Handlers
        handleSubmit,
        handleEdit,
        handlePromote,
        handleDelete,
        handleCloseForm,

        // Mutation Status
        isSubmitting: createMutation.isPending || updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        rejectRequest: rejectRequestMutation.mutate
    };
};
