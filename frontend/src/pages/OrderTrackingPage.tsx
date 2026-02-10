import { useParams, useNavigate } from 'react-router-dom';
import { OrderTracking } from '../components/OrderTracking';

export const OrderTrackingPage = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();

    if (!orderId) {
        navigate('/orders');
        return null;
    }

    return <OrderTracking orderId={orderId} />;
};
