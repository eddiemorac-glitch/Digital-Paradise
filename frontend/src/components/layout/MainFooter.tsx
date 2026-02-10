import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { PrivacyModal } from '../PrivacyModal';
import logo from '../../assets/logo.png';

export const MainFooter = () => {
    const { t } = useLanguageStore();
    const { user } = useAuthStore();
    const { addNotification } = useNotificationStore();
    const navigate = useNavigate();
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

    const handleBackToHome = () => {
        navigate('/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <footer className="mt-20 border-t border-white/5 pt-20 pb-24 lg:pb-10 px-4 md:px-8 safe-area-bottom">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:gap-12 mb-20">
                        <div className="space-y-6 col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-3">
                                <img src={logo} className="w-8 h-8 object-contain" alt="Logo" />
                                <span className="text-lg font-black tracking-tighter">DIGITAL<span className="text-primary">PARADISE</span></span>
                            </div>
                            <p className="text-white/40 text-sm font-medium leading-relaxed">
                                {t('footer_desc')}
                            </p>
                        </div>
                        {user?.role !== 'delivery' && (
                            <div>
                                <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">{t('explore')}</h4>
                                <ul className="space-y-4 text-white/40 text-xs font-bold uppercase tracking-widest">
                                    <li><button onClick={handleBackToHome} className="hover:text-primary transition-colors text-left w-full">{t('restaurants')}</button></li>
                                    <li><button onClick={() => navigate('/map')} className="hover:text-primary transition-colors text-left w-full">{t('map')}</button></li>
                                    <li><button onClick={() => navigate('/events')} className="hover:text-primary transition-colors text-left w-full">{t('events')}</button></li>
                                </ul>
                            </div>
                        )}
                        <div>
                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">{t('community')}</h4>
                            <ul className="space-y-4 text-white/40 text-xs font-bold uppercase tracking-widest">
                                <li><button onClick={() => navigate('/about')} className="hover:text-primary transition-colors text-left w-full">{t('about')}</button></li>
                                <li><button onClick={() => navigate('/sustainability')} className="hover:text-primary transition-colors text-left w-full">{t('sustainability')}</button></li>
                                <li><button onClick={() => navigate('/blog')} className="hover:text-primary transition-colors text-left w-full">{t('blog')}</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">{t('legal')}</h4>
                            <ul className="space-y-4 text-white/40 text-xs font-bold uppercase tracking-widest">
                                <li><button onClick={() => setIsPrivacyOpen(true)} className="hover:text-primary transition-colors text-left w-full">{t('privacy_policy')}</button></li>
                                <li><button onClick={() => addNotification({ title: t('terms_of_use'), message: t('coming_soon_terms'), type: 'info' })} className="hover:text-primary transition-colors text-left w-full">{t('terms_of_use')}</button></li>
                                <li><button onClick={() => addNotification({ title: t('refunds'), message: t('coming_soon_refunds'), type: 'info' })} className="hover:text-primary transition-colors text-left w-full">{t('refunds')}</button></li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-white/5 text-white/20 text-[10px] font-black uppercase tracking-widest">
                        <p>© 2026 DIGITAL PARADISE. {t('rights_reserved')}</p>
                        <div className="flex gap-8">
                            <span>{t('made_with_love')}</span>
                            <span className="text-primary/40 text-xs">{t('pura_vida')}</span>
                        </div>
                    </div>
                </div>
            </footer>

            <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
        </>
    );
};
