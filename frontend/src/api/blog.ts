import api from './api';

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    tags?: string[];
    isSustainableHighlight: boolean;
    type: 'BLOG' | 'GUIDE';
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    publishedAt?: string;
    views: number;
    likes: number;
    authorId: string;
    author?: {
        id: string;
        name: string;
    };
    createdAt: string;
}

export const blogApi = {
    getAll: async (status?: string) => {
        const response = await api.get<BlogPost[]>('/blog', { params: { status } });
        return response.data;
    },

    getAdminAll: async () => {
        const response = await api.get<BlogPost[]>('/blog/admin');
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await api.get<BlogPost>(`/blog/${id}`);
        return response.data;
    },

    create: async (data: Partial<BlogPost>) => {
        const response = await api.post<BlogPost>('/blog', data);
        return response.data;
    },

    update: async (id: string, data: Partial<BlogPost>) => {
        const response = await api.patch<BlogPost>(`/blog/${id}`, data);
        return response.data;
    },

    remove: async (id: string) => {
        const response = await api.delete(`/blog/${id}`);
        return response.data;
    }
};
