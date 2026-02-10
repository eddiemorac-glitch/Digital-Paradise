import { UserProfile } from '../components/UserProfile';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
    const navigate = useNavigate();
    return (
        <UserProfile
            onBack={() => navigate('/')}
            onViewOrders={() => navigate('/orders')}
            onViewRewards={() => navigate('/rewards')}
            onViewInvoices={() => navigate('/invoices')}
        />
    );
};
