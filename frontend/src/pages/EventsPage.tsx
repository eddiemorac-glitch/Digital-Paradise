import { EventHub } from '../components/EventHub';
import { useNavigate } from 'react-router-dom';

export const EventsPage = () => {
    const navigate = useNavigate();
    // EventHub manages its own close logic, we just redirect home or back on close
    return <EventHub onClose={() => navigate('/')} />;
};
