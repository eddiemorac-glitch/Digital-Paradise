import { JungleBlog } from '../components/JungleBlog';
import { useNavigate } from 'react-router-dom';

export const BlogPage = () => {
    const navigate = useNavigate();
    return <JungleBlog onBack={() => navigate('/')} onNavigate={(view) => navigate(view === 'home' ? '/' : `/${view}`)} />;
};
