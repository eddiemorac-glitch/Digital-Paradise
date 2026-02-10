import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
    Users, Search, Filter, Shield,
    UserPlus, Mail, Phone,
    UserCheck, UserX, Trash2, Save,
    Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../../api/users';
import { toast } from 'sonner';

import { InvitationModal } from './InvitationModal';

export const UserVault: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('ALL');
    const [showRoleFilter, setShowRoleFilter] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');

    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: userApi.getAll
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) => userApi.updateRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Rol de usuario actualizado');
            setEditingId(null);
        },
        onError: () => toast.error('Error al actualizar rol')
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id: string) => userApi.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Usuario eliminado permanentemente');
        },
        onError: () => toast.error('Error al eliminar usuario')
    });

    const handleUpdateRole = (id: string) => {
        if (!selectedRole) return;
        updateRoleMutation.mutate({ id, role: selectedRole });
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
            deleteUserMutation.mutate(id);
        }
    };

    const filteredUsers = users?.filter(u => {
        const matchesSearch = u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'ALL' || u.role === filterRole;
        return matchesSearch && matchesRole;
    }) || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
                        <Users className="text-primary" size={24} />
                        Bóveda de Usuarios
                    </h2>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                        Control de identidades y accesos
                    </p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-white/5 transition-all"
                >
                    <UserPlus size={16} /> Crear Invitación
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre, email o ID..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-primary/50"
                    />
                </div>
                <div className="flex gap-2 relative">
                    <button
                        onClick={() => setShowRoleFilter(!showRoleFilter)}
                        className={`px-4 py-3 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${filterRole !== 'ALL' ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10'}`}
                    >
                        <Filter size={16} /> {filterRole === 'ALL' ? 'Todos los Roles' : filterRole.toUpperCase()}
                    </button>

                    {showRoleFilter && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a1015] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                            {['ALL', 'client', 'merchant', 'delivery', 'admin', 'chef'].map(role => (
                                <button
                                    key={role}
                                    onClick={() => { setFilterRole(role); setShowRoleFilter(false); }}
                                    className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                                >
                                    {role === 'ALL' ? 'Todos' : role}
                                </button>
                            ))}
                        </div>
                    )}

                    <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-2">
                        <Shield size={16} /> Permisos
                    </button>
                </div>
            </div>

            <div className="glass rounded-[2.5rem] border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Identidad</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Rol Táctico</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Puntos</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Contacto</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-white/20">Cargando identidades...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-white/20">No se encontraron usuarios.</td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black border border-white/10 group-hover:border-primary/30 transition-all">
                                                {user.fullName?.charAt(0) || user.email.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold">{user.fullName || 'Sin Nombre'}</p>
                                                <p className="text-[10px] text-white/20 font-mono">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === user.id ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="bg-black/50 border border-white/20 text-xs rounded px-2 py-1 outline-none focus:border-primary"
                                                    value={selectedRole}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                >
                                                    <option value="client">Client</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="merchant">Merchant</option>
                                                    <option value="delivery">Delivery</option>
                                                    <option value="chef">Chef</option>
                                                </select>
                                                <button
                                                    onClick={() => handleUpdateRole(user.id)}
                                                    disabled={updateRoleMutation.isPending}
                                                    className="p-1 bg-primary/20 text-primary rounded hover:bg-primary/40 disabled:opacity-50"
                                                >
                                                    {updateRoleMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-1 bg-white/10 text-white/40 rounded hover:bg-white/20"
                                                >
                                                    <UserX size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => { setEditingId(user.id); setSelectedRole(user.role); }}
                                                className={`cursor-pointer inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border hover:scale-105 transition-all ${user.role === 'admin' ? 'border-primary/30 text-primary bg-primary/5' :
                                                    user.role === 'delivery' ? 'border-purple-400/30 text-purple-400 bg-purple-400/5' :
                                                        user.role === 'merchant' ? 'border-blue-400/30 text-blue-400 bg-blue-400/5' :
                                                            'border-white/10 text-white/40 bg-white/5'
                                                    }`}
                                            >
                                                {user.role}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-yellow-500">{user.points || 0}</span>
                                            <span className="text-[9px] text-white/20 uppercase">pts</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[10px] font-bold text-white/20 tracking-wide">
                                        {user.phoneNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-all" title="Verificar">
                                                <UserCheck size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                disabled={deleteUserMutation.isPending}
                                                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all disabled:opacity-50"
                                                title="Eliminar Usuario"
                                            >
                                                {deleteUserMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass p-6 rounded-[2rem] border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Mail size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase">Newsletter Sync</p>
                            <p className="text-[10px] text-white/40 font-bold">1,402 suscriptores</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">Sincronizar</button>
                </div>
                <div className="glass p-6 rounded-[2rem] border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Phone size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase">SMS Center</p>
                            <p className="text-[10px] text-white/40 font-bold">Crédito: ₡25,000</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">Recargar</button>
                </div>
            </div>

            <AnimatePresence>
                {showInviteModal && <InvitationModal onClose={() => setShowInviteModal(false)} />}
            </AnimatePresence>
        </div>
    );
};
