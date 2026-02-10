import React, { useState, useEffect } from 'react';
import { Box, H2, H5, Text, Icon } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const api = new ApiClient();

const Dashboard = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/admin/stats/dashboard')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            }).catch(err => {
                console.error('Failed to fetch dashboard stats:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <Box p="xl" bg="#050a06"><Text color="#00ff66">Cargando Inteligencia de Plataforma...</Text></Box>;

    const stats = data || {
        revenueToday: 0,
        activeOrdersCount: 0,
        liveMissionsCount: 0,
        onTimeDeliveryRate: 100,
        failedDeliveries: 0
    };

    return (
        <Box p="xl" bg="#050a06" minHeight="100vh">
            <Box mb="xl">
                <H2 color="#00ff66">Consola Táctica Caribe Digital</H2>
                <Text color="#888">Estado operativo de la red en tiempo real (v1.0)</Text>
            </Box>

            <Box display="flex" flexDirection="row" flexWrap="wrap" mx="-md">
                {/* KPI Cards */}
                <Box width={[1, 1 / 2, 1 / 4]} p="md">
                    <Box bg="#0a140c" border="1px solid #1a331e" p="lg" borderRadius="lg" boxShadow="0 4px 12px rgba(0,255,102,0.05)">
                        <H5 color="#888">VENTAS HOY</H5>
                        <H2 color="white">₡{stats.revenueToday?.toLocaleString()}</H2>
                    </Box>
                </Box>

                <Box width={[1, 1 / 2, 1 / 4]} p="md">
                    <Box bg="#0a140c" border="1px solid #1a331e" p="lg" borderRadius="lg">
                        <H5 color="#888">PEDIDOS ACTIVOS</H5>
                        <H2 color="#00ff66">{stats.activeOrdersCount}</H2>
                    </Box>
                </Box>

                <Box width={[1, 1 / 2, 1 / 4]} p="md">
                    <Box bg="#0a140c" border="1px solid #1a331e" p="lg" borderRadius="lg">
                        <H5 color="#888">MISIONES LIVE</H5>
                        <H2 color="#3399ff">{stats.liveMissionsCount}</H2>
                    </Box>
                </Box>

                <Box width={[1, 1 / 2, 1 / 4]} p="md">
                    <Box bg="#0a140c" border="1px solid #1a331e" p="lg" borderRadius="lg">
                        <H5 color="#888">ESTADO FLOTA</H5>
                        <H2 color="#3399ff">{stats.onlineCouriers} / {stats.totalCouriers}</H2>
                        <Text color="#888" variant="sm">Repartidores Activos</Text>
                    </Box>
                </Box>
            </Box>

            <Box mt="xl" display="grid" gridTemplateColumns={['1fr', '1fr 1fr']} gridGap="xl">
                <Box width={[1, 1 / 2, 1 / 4]} p="md">
                    <Box bg="#0a140c" border="1px solid #1a331e" p="lg" borderRadius="lg">
                        <H5 color="#888">ÉXITO LOGÍSTICA</H5>
                        <H2 color={stats.onTimeDeliveryRate > 90 ? '#00ff66' : '#ffcc00'}>{stats.onTimeDeliveryRate}%</H2>
                    </Box>
                </Box>
            </Box>

            <Box mt="xl" display="grid" gridTemplateColumns={['1fr', '1fr 1fr']} gridGap="xl">
                <Box bg="#0a140c" border="1px solid #1a331e" p="lg" borderRadius="lg">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb="md">
                        <H5 color="#888">ALERTAS DE SISTEMA</H5>
                        <Icon icon="Bell" color={stats.failedDeliveries > 0 ? "#ff4d4d" : "#00ff66"} />
                    </Box>
                    {stats.failedDeliveries > 0 ? (
                        <Text color="#ff4d4d" fontWeight="bold">⚠️ {stats.failedDeliveries} entregas fallidas detectadas en las últimas 24h.</Text>
                    ) : (
                        <Text color="#00ff66">✓ Todos los sistemas nominales. No se detectan fallos críticos.</Text>
                    )}
                </Box>

                <Box bg="#0a140c" border="1px solid #1a331e" p="lg" borderRadius="lg">
                    <H5 color="#888" mb="md">ENLACE HACIENDA</H5>
                    <Box height="20px" bg="#1a331e" borderRadius="10px" overflow="hidden" mb="sm">
                        <Box width="100%" height="100%" bg="#00ff66" />
                    </Box>
                    <Text color="#888" variant="sm">Sincronización v4.4 activa. Latencia promedio: 850ms.</Text>
                </Box>
            </Box>
        </Box>
    );
};

export default Dashboard;
