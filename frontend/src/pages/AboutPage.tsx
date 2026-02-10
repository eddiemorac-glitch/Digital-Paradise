import { AboutUs } from '../components/AboutUs';
import { useNavigate } from 'react-router-dom';

export const AboutPage = () => {
    const navigate = useNavigate();
    return <AboutUs onBack={() => navigate('/')} />;
};
