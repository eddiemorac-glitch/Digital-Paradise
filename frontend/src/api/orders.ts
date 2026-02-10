import api from './api';

export interface CreateOrderItemDto {
    productId?: string;
    eventId?: string;
    quantity: number;
}

export interface CreateOrderDto {
    merchantId: string;
    items: CreateOrderItemDto[];
    customerNotes?: string;
    courierTip?: number;
    deliveryAddress?: string;
    deliveryLat?: number;
    deliveryLng?: number;
}

export interface Order {
    id: string;
    merchantId: string;
    status: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
    customerNotes?: string;
    courierTip?: number;
    haciendaKey?: string;
    electronicSequence?: string;
    isElectronicInvoice?: boolean;
    merchant?: { name: string; address: string };
    user?: { id: string; fullName: string; email: string };
    items?: any[];
    metadata?: {
        haciendaClave?: string;
        prepTime?: number;
        [key: string]: any;
    };
    logisticsMission?: {
        id?: string;
        status?: string;
        courier?: { id: string; fullName: string; phone?: string };
        metadata?: {
            metersToDestination?: number;
            tripState?: string;
            [key: string]: any;
        };
    };
    deliveryAddress?: string;
    deliveryLat?: number;
    deliveryLng?: number;
}

export const orderApi = {
    create: async (data: CreateOrderDto): Promise<Order> => {
        const response = await api.post('/orders/create', data);
        return response.data;
    },

    preview: async (data: CreateOrderDto): Promise<{ subtotal: number; tax: number; deliveryFee: number; courierTip: number; platformFee: number; transactionFee: number; total: number }> => {
        const response = await api.post('/orders/preview', data);
        return response.data;
    },

    getAll: async (): Promise<Order[]> => {
        const response = await api.get('/orders');
        return response.data;
    },

    getMyOrders: async (): Promise<Order[]> => {
        const response = await api.get('/orders/mine');
        return response.data;
    },

    adminUpdateStatus: async (id: string, status: string): Promise<Order> => {
        const response = await api.patch<Order>(`/orders/${id}/admin-status`, { status });
        return response.data;
    },

    getDeliveryOtp: async (orderId: string): Promise<{ orderId: string; otp: string | null; courierName: string | null; missionStatus: string | null }> => {
        const response = await api.get(`/orders/${orderId}/delivery-otp`);
        return response.data;
    }
};
