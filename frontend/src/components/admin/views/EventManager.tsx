import React from 'react';
import { Calendar, Plus, RefreshCw, Leaf } from 'lucide-react';
import { EventForm } from './EventForm';
import { useEventManagement } from '../../hooks/useEventManagement';
import { EventList } from './events/EventList';
import { EventRequestList } from './events/EventRequestList';
import { EventFilters } from './events/EventFilters';
import { AnimatePresence } from 'framer-motion';

interface EventManagerProps {
    onViewOnMap?: (event: any) => void;
}

export const EventManager: React.FC<EventManagerProps> = ({ onViewOnMap }) => {
    const {
        // State
        searchTerm, setSearchTerm,
        filterType, setFilterType,
        showForm, setShowForm,
        editingEvent,
        deleteConfirm, setDeleteConfirm,
        viewMode, setViewMode,

        // Data
        events,
        filteredEvents,
        eventsLoading, refetchEvents,
        requests,

        // Handlers
        handleSubmit,
        handleEdit,
        handlePromote,
        handleDelete,
        handleCloseForm,

        // Mutation Status
        isSubmitting, // Note: EventForm needs isLoading prop, check if it matches
        isDeleting,
        rejectRequest
    } = useEventManagement();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
                        <Calendar className="text-accent" size={24} />
                        Gestión de Eventos
                    </h2>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                        {events?.length || 0} eventos activos • {requests?.length || 0} solicitudes
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('active')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'active' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        Activos
                    </button>
                    <button
                        onClick={() => setViewMode('requests')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all relative ${viewMode === 'requests' ? 'bg-primary/20 text-primary' : 'text-white/40 hover:text-white'}`}
                    >
                        Solicitudes
                        {requests && requests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </button>

                    <div className="w-[1px] h-8 bg-white/10 mx-2" />

                    <button
                        onClick={() => refetchEvents()}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                    >
                        <RefreshCw size={16} className={eventsLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-3 bg-primary text-background rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                    >
                        <Plus size={16} />
                        Nuevo
                    </button>
                </div>
            </div>

            {viewMode === 'active' ? (
                <>
                    {/* Filters */}
                    <EventFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterType={filterType}
                        setFilterType={setFilterType}
                    />

                    {/* Events Grid */}
                    <EventList
                        events={filteredEvents || []}
                        loading={eventsLoading}
                        onViewOnMap={onViewOnMap}
                        onEdit={handleEdit}
                        deleteConfirm={deleteConfirm}
                        setDeleteConfirm={setDeleteConfirm}
                        onDelete={handleDelete}
                        isDeleting={isDeleting}
                        onOpenForm={() => setShowForm(true)}
                    />
                </>
            ) : (
                /* Requests Grid */
                <EventRequestList
                    requests={requests || []}
                    onPromote={handlePromote}
                    onReject={rejectRequest}
                />
            )}

            {/* Event Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <EventForm
                        event={editingEvent}
                        onSubmit={handleSubmit}
                        onClose={handleCloseForm}
                        isLoading={isSubmitting}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
