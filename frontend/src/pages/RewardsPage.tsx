import { RewardsHub } from '../components/RewardsHub';
import { useNavigate } from 'react-router-dom';

export const RewardsPage = () => {
    const navigate = useNavigate();
    return <RewardsHub onBack={() => navigate('/')} onNavigate={(view) => navigate(view === 'home' ? '/' : `/${view}`)} />;
};
