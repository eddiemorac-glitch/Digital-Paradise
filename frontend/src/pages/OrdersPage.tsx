import { MyOrders } from '../components/MyOrders';
import { useNavigate, useOutletContext } from 'react-router-dom';

export const OrdersPage = () => {
    const navigate = useNavigate();
    const { setActiveMission } = useOutletContext<any>();

    return (
        <MyOrders
            onBack={() => navigate('/')}
            onSelectOrder={(order) => setActiveMission(order)}
        />
    );
};
