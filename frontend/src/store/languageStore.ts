import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'es' | 'en';

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations = {
    es: {
        // General
        'search_placeholder': '¿Qué se te antoja hoy?',
        'hero_title': 'SABORES DEL PARAÍSO',
        'near_me': 'Cerca de mí',
        'near_you': 'Cerca de ti',
        'coming_soon': '¡Ya casi llega!',
        'loading': 'Cargando buenas vibras...',
        'retry': 'Probar de nuevo',
        'connection_error': 'Uy, se nos fue la señal',
        'connection_error_desc': 'Parece que el mar está picado. Revisa tu conexión e intenta otra vez.',

        // Navigation
        'explore': 'Explorar',
        'map': 'Mapa',
        'events': 'Entradas',
        'about': 'La Tribu',
        'sustainability': 'Eco Vida',
        'blog': 'Historias',
        'profile': 'Mi Perfil',
        'history': 'Mis Pedidos',
        'my_orders': 'Mis Pedidos',
        'logout': 'Cerrar Sesión',
        'admin_panel': 'Panel de Control',
        'dashboard': 'Mi Negocio',
        'courier_central': 'Central de Entregas',

        // Auth
        'login': 'Ingresar',
        'register': 'Unirme',
        'welcome_jungle': 'Bienvenido a la Jungla',
        'enter_paradise': 'Entrar al Paraíso',
        'join_tribe': 'Únete a la Tribu',
        'email_label': 'Tu Correo',
        'password_label': 'Clave Secreta',
        'no_account': '¿Aún no eres parte?',
        'has_account': '¿Ya tienes cuenta?',
        'auth_error': 'Mmm, esos datos no nos suenan.',

        // Cart
        'your_order': 'Tu Canasta',
        'empty_cart': 'Tu canasta está vacía',
        'empty_cart_desc': '¡Llénala de sabor caribeño!',
        'subtotal': 'Subtotal',
        'delivery_fee': 'Envío',
        'courier_tip': 'Propina al Repartidor',
        'total': 'Total a Pagar',
        'place_order': 'Confirmar Pedido',
        'add_notes': '¿Algún detalle extra?',
        'notes_placeholder': 'Ej: Sin culantro, salsa aparte...',

        // Categories & Filters
        'all': 'Todo',
        'restaurants': 'Restaurantes',
        'cafes': 'Cafecitos',
        'seafood': 'Del Mar',
        'essentials': 'Lo Básico',
        'eco_friendly': '100% Eco',

        // Footer & Community
        'support_wa': 'Escríbenos al WhatsApp',
        'order_help': '¿Ayuda con tu pedido?',
        'rights_reserved': 'Todos los derechos reservados, mae.',
        'made_with_love': 'Hecho con ❤️ en el Caribe',
        'pura_vida': '¡Pura Vida!',

        // Sort
        'sort_az': 'A-Z',
        'sort_rating': 'Los Favoritos',
        'sort_distance': 'A la vuelta',
        'new': 'Nuevo',
        'local_establishment': 'Establecimiento Local',
        'inactive': 'Inactivo',
        'closed': 'Cerrado',
        'busy': 'Ocupado',
        'operational': 'Operativo'
    },
    en: {
        // General
        'search_placeholder': 'What are you craving today?',
        'hero_title': 'FLAVORS OF PARADISE',
        'near_me': 'Near Me',
        'near_you': 'Near You',
        'coming_soon': 'Coming Soon!',
        'loading': 'Loading good vibes...',
        'retry': 'Try Again',
        'connection_error': 'Oops, signal drifted away',
        'connection_error_desc': 'The sea looks rough. Check your connection and try again.',

        // Navigation
        'explore': 'Explore',
        'map': 'Map',
        'events': 'Tickets',
        'about': 'The Tribe',
        'sustainability': 'Eco Life',
        'blog': 'Stories',
        'profile': 'My Profile',
        'history': 'My Orders',
        'my_orders': 'My Orders',
        'logout': 'Log Out',
        'admin_panel': 'Control Panel',
        'dashboard': 'My Business',
        'courier_central': 'Delivery Central',

        // Auth
        'login': 'Log In',
        'register': 'Join Us',
        'welcome_jungle': 'Welcome to the Jungle',
        'enter_paradise': 'Enter Paradise',
        'join_tribe': 'Join the Tribe',
        'email_label': 'Your Email',
        'password_label': 'Secret Key',
        'no_account': 'Not part of it yet?',
        'has_account': 'Already have an account?',
        'auth_error': 'Hmm, those details don\'t ring a bell.',

        // Cart
        'your_order': 'Your Basket',
        'empty_cart': 'Your basket is empty',
        'empty_cart_desc': 'Fill it with Caribbean flavor!',
        'subtotal': 'Subtotal',
        'delivery_fee': 'Delivery',
        'courier_tip': 'Tip the Courier',
        'total': 'Total to Pay',
        'place_order': 'Confirm Order',
        'add_notes': 'Any extra details?',
        'notes_placeholder': 'Ex: No cilantro, sauce on the side...',

        // Categories & Filters
        'all': 'All',
        'restaurants': 'Restaurants',
        'cafes': 'Coffee Spots',
        'seafood': 'From the Sea',
        'essentials': 'Essentials',
        'eco_friendly': '100% Eco',

        // Assistant
        'ai_placeholder': 'Ask something to Sentinel...',
        'ai_title': 'COCO Caribeño - Digital Paradise Assistant',
        'quick_points': 'My Cocos?',
        'quick_eat': 'Where to eat?',
        'quick_eco': 'Sustainability',

        // Footer & Community
        'support_wa': 'WhatsApp Us',
        'order_help': 'Help with your order?',
        'rights_reserved': 'All rights reserved, mate.',
        'made_with_love': 'Made with ❤️ in the Caribbean',
        'pura_vida': 'Pura Vida!',

        // Sort
        'sort_az': 'A-Z',
        'sort_rating': 'Favorites',
        'sort_distance': 'Around the corner',
        'new': 'New',
        'local_establishment': 'Local Establishment',
        'inactive': 'Inactive',
        'closed': 'Closed',
        'busy': 'Busy',
        'operational': 'Operational',
        'buy_tickets': 'Buy Tickets',
        'event_store_title': 'Tickets Store',
        'event_details': 'Event Info'
    }
};

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: 'es',
            setLanguage: (language) => set({ language }),
            t: (key) => {
                const lang = get().language;
                return translations[lang][key as keyof typeof translations['es']] || key;
            }
        }),
        {
            name: 'paradise-language-storage',
        }
    )
);
