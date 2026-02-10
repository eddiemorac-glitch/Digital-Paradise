import { SustainabilityHub } from '../components/SustainabilityHub';
import { useNavigate } from 'react-router-dom';

export const SustainabilityPage = () => {
    const navigate = useNavigate();
    return <SustainabilityHub onBack={() => navigate('/')} onNavigate={(view) => navigate(view === 'home' ? '/' : `/${view}`)} />;
};
