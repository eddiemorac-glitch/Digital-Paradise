import api from './api';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    isAvailable: boolean;
    isPopular?: boolean;
    isEco?: boolean;
    merchantId: string;
    cabysCode?: string;
    optionsMetadata?: {
        name: string;
        required: boolean;
        maxSelections?: number;
        values: { name: string; addPrice: number }[];
    }[];
}

export const productApi = {
    getByMerchant: async (merchantId: string, all = false) => {
        const response = await api.get<Product[]>(`/products/merchant/${merchantId}`, {
            params: { all: all ? 'true' : 'false' }
        });
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await api.get<Product>(`/products/${id}`);
        return response.data;
    },

    create: async (data: Partial<Product>) => {
        const response = await api.post<Product>('/products', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Product>) => {
        const response = await api.patch<Product>(`/products/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/products/${id}`);
    },

    findByIds: async (ids: string[]) => {
        const response = await api.post<Product[]>('/products/bulk', { ids });
        return response.data;
    },
};
