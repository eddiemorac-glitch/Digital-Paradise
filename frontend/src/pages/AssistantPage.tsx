import { CaribeAssistant } from '../components/CaribeAssistant';
import { useNavigate } from 'react-router-dom';

export const AssistantPage = () => {
    const navigate = useNavigate();
    return <CaribeAssistant onBack={() => navigate('/')} onNavigate={(view) => navigate(view === 'home' ? '/' : `/${view}`)} />;
};
