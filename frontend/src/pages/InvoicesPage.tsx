import { MyInvoices } from '../components/MyInvoices';
import { useNavigate } from 'react-router-dom';

export const InvoicesPage = () => {
    const navigate = useNavigate();
    return <MyInvoices onBack={() => navigate('/')} />;
};
