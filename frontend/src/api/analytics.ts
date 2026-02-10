import api from './api';

export interface DailyTrend {
    date: string;
    revenue: number;
    orders: number;
}

export interface MerchantStat {
    name: string;
    revenue: number;
    orders: number;
}

export interface AdminSummary {
    summary: {
        totalRevenue: number;
        totalTax: number;
        platformProfit: number;
        netVolume: number;
        totalOrders: number;
        averageOrderValue: number;
        onlineCouriers: number;
        otdr: number;
        avgServiceTime: number;
        haciendaSyncRate: number;
    };
    statusDistribution: Array<{ status: string; count: string }>;
    dailyTrends: DailyTrend[];
    topMerchants: MerchantStat[];
    recentOrders: Array<{
        id: string;
        merchantName: string;
        subtotal: number;
        tax: number;
        transactionFee: number;
        platformFee: number;
        total: number;
        createdAt: Date;
    }>;
}

export const analyticsApi = {
    getAdminSummary: async (): Promise<AdminSummary> => {
        const { data } = await api.get('/analytics/admin/summary');
        return data;
    },
    getMerchantAnalytics: async (id: string) => {
        const { data } = await api.get(`/analytics/merchant/${id}`);
        return data;
    },
    getHeatmap: async (): Promise<any[]> => {
        const { data } = await api.get('/analytics/heatmap');
        return data;
    }
};
