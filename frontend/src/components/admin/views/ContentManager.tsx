import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Search, Plus,
    Eye, Edit3, Trash2, Clock,
    Tag, Loader2, X, Check,
    Sparkles, BookOpen
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi, BlogPost } from '../../../api/blog';
import { API_BASE_URL } from '../../../api/api';
import { toast } from 'sonner';

export const ContentManager: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'BLOG' | 'GUIDE'>('BLOG');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);

    const { data: posts, isLoading } = useQuery<BlogPost[]>({
        queryKey: ['admin-posts'],
        queryFn: () => blogApi.getAdminAll(),
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<BlogPost>) => blogApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
            toast.success('Publicación creada');
            setIsEditorOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<BlogPost> }) => blogApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
            toast.success('Cambios guardados');
            setIsEditorOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => blogApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
            toast.success('Publicación eliminada');
        }
    });

    const filteredPosts = posts?.filter(p =>
        p.type === activeTab &&
        (p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSave = () => {
        if (!editingPost?.title || !editingPost?.content) {
            toast.error('Título y contenido son requeridos');
            return;
        }

        const data = {
            ...editingPost,
            type: activeTab,
        };

        if (editingPost.id) {
            updateMutation.mutate({ id: editingPost.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar esta publicación?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
                        <FileText className="text-primary" size={24} />
                        Gestor de Contenido
                    </h2>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                        Blog, Guías y Ecosistema
                    </p>
                </div>
                <button
                    onClick={() => { setEditingPost({ status: 'DRAFT' }); setIsEditorOpen(true); }}
                    className="px-6 py-3 bg-primary text-background rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                    <Plus size={16} /> Nueva Entrada
                </button>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('BLOG')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'BLOG' ? 'bg-primary text-background' : 'text-white/40 hover:text-white'}`}
                    >
                        <Sparkles size={14} /> Blog
                    </button>
                    <button
                        onClick={() => setActiveTab('GUIDE')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'GUIDE' ? 'bg-primary text-background' : 'text-white/40 hover:text-white'}`}
                    >
                        <BookOpen size={14} /> Guías
                    </button>
                </div>

                <div className="relative flex-1 w-full text-white">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={`Buscar en ${activeTab === 'BLOG' ? 'el Blog' : 'las Guías'}...`}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-primary/50"
                    />
                </div>
            </div>

            {/* Post Table / Grid */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="py-20 text-center text-white/20 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin" size={32} />
                        Escaneando repositorio de contenido...
                    </div>
                ) : filteredPosts?.length === 0 ? (
                    <div className="py-20 text-center glass rounded-[3rem] border-white/5">
                        <p className="text-white/20 font-black uppercase tracking-[0.2em]">No hay entradas creadas</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredPosts?.map((post) => (
                            <motion.div
                                key={post.id}
                                layout
                                className="glass p-6 rounded-[2rem] border-white/5 flex flex-col md:flex-row items-center gap-6 hover:border-primary/20 transition-all group"
                            >
                                <div className="w-full md:w-40 h-24 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                                    {post.coverImage ? (
                                        <img src={post.coverImage} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileText size={24} className="text-white/10" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 space-y-2 min-w-0 w-full">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-lg font-black uppercase tracking-tighter truncate">{post.title}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${post.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-white/5 text-white/40 border-white/10'
                                            }`}>
                                            {post.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                                    <div className="flex items-center gap-6 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5"><Clock size={12} /> {new Date(post.createdAt).toLocaleDateString()}</div>
                                        <div className="flex items-center gap-1.5"><Eye size={12} /> {post.views} vistas</div>
                                        <div className="flex items-center gap-1.5"><Tag size={12} /> {post.tags?.join(', ') || 'Sin tags'}</div>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => { setEditingPost(post); setIsEditorOpen(true); }}
                                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                                        title="Editar"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            <AnimatePresence>
                {isEditorOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditorOpen(false)}
                            className="absolute inset-0 bg-[#0a0f18]/90 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass w-full max-w-4xl max-h-[90vh] rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden flex flex-col"
                        >
                            <div className="p-8 space-y-6 overflow-y-auto">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                                        {editingPost?.id ? 'Editar Entrada' : 'Nueva Entrada'}
                                    </h3>
                                    <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                        <X size={24} className="text-white/20" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-primary italic">Título</label>
                                            <input
                                                type="text"
                                                value={editingPost?.title || ''}
                                                onChange={e => setEditingPost(prev => ({ ...prev, title: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs outline-none focus:border-primary/50"
                                                placeholder="Ej: El renacer de la selva..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-primary italic">Extracto (Resumen)</label>
                                            <textarea
                                                value={editingPost?.excerpt || ''}
                                                onChange={e => setEditingPost(prev => ({ ...prev, excerpt: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs outline-none focus:border-primary/50 h-20 resize-none"
                                                placeholder="Breve descripción para la lista..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-primary italic">Etiquetas (separadas por coma)</label>
                                            <input
                                                type="text"
                                                value={editingPost?.tags?.join(', ') || ''}
                                                onChange={e => setEditingPost(prev => ({ ...prev, tags: e.target.value.split(',').map(s => s.trim()) }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs outline-none focus:border-primary/50"
                                                placeholder="Ej: Sostenibilidad, Selva, Tortugas"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-primary italic">URL Imagen de Portada</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editingPost?.coverImage || ''}
                                                    onChange={e => setEditingPost(prev => ({ ...prev, coverImage: e.target.value }))}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs outline-none focus:border-primary/50"
                                                    placeholder="URL o subir imagen..."
                                                />
                                                <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 flex items-center justify-center transition-all">
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;

                                                            const formData = new FormData();
                                                            formData.append('file', file);

                                                            // Temporary direct fetch call until api wrapper is updated
                                                            try {
                                                                const token = localStorage.getItem('token');
                                                                const apiBase = API_BASE_URL.replace(/\/api$/, '');
                                                                const res = await fetch(`${apiBase}/uploads/blog-image`, {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Authorization': `Bearer ${token}`
                                                                    },
                                                                    body: formData
                                                                });

                                                                if (!res.ok) throw new Error('Upload failed');

                                                                const data = await res.json();
                                                                setEditingPost(prev => ({ ...prev, coverImage: data.url }));
                                                                toast.success('Imagen subida correctamente');
                                                            } catch (err) {
                                                                toast.error('Error al subir imagen');
                                                            }
                                                        }}
                                                    />
                                                    <Plus size={16} className="text-white/40" />
                                                </label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-primary italic">Estado</label>
                                                <select
                                                    value={editingPost?.status || 'DRAFT'}
                                                    onChange={e => setEditingPost(prev => ({ ...prev, status: e.target.value as any }))}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs outline-none focus:border-primary/50 appearance-none"
                                                >
                                                    <option value="DRAFT">Borrador</option>
                                                    <option value="PUBLISHED">Publicado</option>
                                                    <option value="ARCHIVED">Archivado</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1 flex flex-col justify-end">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={editingPost?.isSustainableHighlight || false}
                                                        onChange={e => setEditingPost(prev => ({ ...prev, isSustainableHighlight: e.target.checked }))}
                                                        className="hidden"
                                                    />
                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${editingPost?.isSustainableHighlight ? 'bg-green-500' : 'bg-white/10'}`}>
                                                        <motion.div animate={{ x: editingPost?.isSustainableHighlight ? 22 : 2 }} className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full" />
                                                    </div>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Destacado ECO</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="w-full h-28 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                            {editingPost?.coverImage ? (
                                                <img src={editingPost.coverImage} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center opacity-10">
                                                    <Eye size={48} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary italic">Contenido (Post)</label>
                                    <textarea
                                        value={editingPost?.content || ''}
                                        onChange={e => setEditingPost(prev => ({ ...prev, content: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs outline-none focus:border-primary/50 h-60 resize-none font-mono"
                                        placeholder="Escribe tu historia aquí..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => setIsEditorOpen(false)}
                                        className="flex-1 py-4 bg-white/5 text-white/40 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => setIsPreviewOpen(true)}
                                        className="flex-1 py-4 bg-blue-500/10 text-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Eye size={16} /> Previsualizar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="flex-[3] py-4 bg-primary text-background rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {(createMutation.isPending || updateMutation.isPending) ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            <><Check size={16} /> {editingPost?.id ? 'Guardar Cambios' : 'Publicar Ahora'}</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isPreviewOpen && editingPost && (
                    <PreviewModal post={editingPost} onClose={() => setIsPreviewOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

const PreviewModal: React.FC<{ post: Partial<BlogPost>, onClose: () => void }> = ({ post, onClose }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-4xl bg-white text-black rounded-[2rem] overflow-hidden relative max-h-[90vh] overflow-y-auto"
            >
                <div className="h-64 w-full relative">
                    {post.coverImage ? (
                        <img src={post.coverImage} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 font-bold uppercase">Sin Portada</span>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent text-white">
                        <div className="flex gap-2 mb-2">
                            {post.tags?.map(t => <span key={t} className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest">{t}</span>)}
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic">{post.title}</h1>
                    </div>
                </div>
                <div className="p-8 prose prose-lg max-w-none">
                    <p className="lead font-bold opacity-80">{post.excerpt}</p>
                    <hr className="my-6 border-gray-200" />
                    <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed opacity-90">
                        {post.content}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
