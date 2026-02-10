import { Shield, Eye, Leaf, Sun, Anchor, Radar, Activity, Target } from 'lucide-react';

export const AVATAR_CATEGORIES = {
    FAUNA: 'FAUNA',
    FLORA: 'FLORA',
    TACTICAL: 'TACTICAL'
};

// Fauna - Custom representations using simple paths or lucide combinations
const Jaguar = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-md" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full text-yellow-500 z-10" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8 2 4 6 4 10C4 13 6 15 8 16L6 20H18L16 16C18 15 20 13 20 10C20 6 16 2 12 2Z" />
            <path d="M9 10C9 10 10 11 12 11C14 11 15 10 15 10" />
            <circle cx="9" cy="8" r="1" fill="currentColor" />
            <circle cx="15" cy="8" r="1" fill="currentColor" />
        </svg>
    </div>
);

const Toucan = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-md" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full text-orange-500 z-10" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10C3 6.686 5.686 4 9 4H14C17.866 4 21 7.134 21 11C21 14.866 17.866 18 14 18H9C5.686 18 3 15.314 3 12V10Z" />
            <path d="M14 8C14 8 16 9 16 11" />
            <circle cx="9" cy="9" r="1" fill="currentColor" />
        </svg>
    </div>
);

const Sloth = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-amber-700/20 rounded-full blur-md" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full text-amber-700 z-10" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 16C4 16 6 20 12 20C18 20 20 16 20 16" />
            <path d="M8 8C8 5.79 9.79 4 12 4C14.21 4 16 5.79 16 8" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
        </svg>
    </div>
);

const SeaTurtle = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full text-emerald-500 z-10" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4L12 20" />
            <path d="M4 12L20 12" />
            <circle cx="12" cy="12" r="6" />
            <path d="M18 18L16 16" />
            <path d="M6 6L8 8" />
            <path d="M18 6L16 8" />
            <path d="M6 18L8 16" />
        </svg>
    </div>
);

const Monkey = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-stone-500/20 rounded-full blur-md" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full text-stone-500 z-10" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="10" r="4" />
            <path d="M12 14v4" />
            <path d="M8 18h8" />
            <path d="M4 8C4 8 2 9 2 11C2 13 4 14 4 14" />
            <path d="M20 8C20 8 22 9 22 11C22 13 20 14 20 14" />
        </svg>
    </div>
);

// Flora - Styled standard icons
const PalmTree = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md" />
        <Leaf className="w-full h-full text-green-500 z-10" />
    </div>
);

const Hibiscus = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-md" />
        <Sun className="w-full h-full text-pink-500 z-10" />
    </div>
);

const Monstera = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-teal-600/20 rounded-full blur-md" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full text-teal-600 z-10" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" />
            <path d="M12 2L12 22" />
            <path d="M12 12L20 6" />
            <path d="M12 12L4 6" />
        </svg>
    </div>
);

const Cacao = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-orange-800/20 rounded-full blur-md" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full text-orange-800 z-10" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="12" rx="6" ry="9" />
            <path d="M12 3V21" />
        </svg>
    </div>
);

const Dolphin = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-md" />
        <Anchor className="w-full h-full text-blue-400 z-10" />
    </div>
);


// Tactical - High tech styling
const TacticalRadar = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md animate-pulse" />
        <Radar className="w-full h-full text-green-500 z-10" />
    </div>
);

const CyberShield = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md" />
        <Shield className="w-full h-full text-blue-500 z-10" />
    </div>
);

const DigitalEye = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md" />
        <Eye className="w-full h-full text-purple-500 z-10" />
    </div>
);

const NetworkNode = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-md" />
        <Activity className="w-full h-full text-cyan-400 z-10" />
    </div>
);

const DataCore = ({ className }: { className?: string }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md" />
        <Target className="w-full h-full text-red-500 z-10" />
    </div>
);


export const AVATARS = [
    // Fauna
    { id: 'jaguar', component: Jaguar, name: 'Jaguar', category: AVATAR_CATEGORIES.FAUNA },
    { id: 'toucan', component: Toucan, name: 'Toucan', category: AVATAR_CATEGORIES.FAUNA },
    { id: 'sloth', component: Sloth, name: 'Sloth', category: AVATAR_CATEGORIES.FAUNA },
    { id: 'turtle', component: SeaTurtle, name: 'Turtle', category: AVATAR_CATEGORIES.FAUNA },
    { id: 'monkey', component: Monkey, name: 'Monkey', category: AVATAR_CATEGORIES.FAUNA },
    { id: 'dolphin', component: Dolphin, name: 'Dolphin', category: AVATAR_CATEGORIES.FAUNA },

    // Flora
    { id: 'palm', component: PalmTree, name: 'Palm', category: AVATAR_CATEGORIES.FLORA },
    { id: 'hibiscus', component: Hibiscus, name: 'Hibiscus', category: AVATAR_CATEGORIES.FLORA },
    { id: 'monstera', component: Monstera, name: 'Monstera', category: AVATAR_CATEGORIES.FLORA },
    { id: 'cacao', component: Cacao, name: 'Cacao', category: AVATAR_CATEGORIES.FLORA },

    // Tactical
    { id: 'radar', component: TacticalRadar, name: 'Radar', category: AVATAR_CATEGORIES.TACTICAL },
    { id: 'shield', component: CyberShield, name: 'Shield', category: AVATAR_CATEGORIES.TACTICAL },
    { id: 'eye', component: DigitalEye, name: 'Watcher', category: AVATAR_CATEGORIES.TACTICAL },
    { id: 'node', component: NetworkNode, name: 'Node', category: AVATAR_CATEGORIES.TACTICAL },
    { id: 'core', component: DataCore, name: 'Core', category: AVATAR_CATEGORIES.TACTICAL },
];

export const getAvatarById = (id: string) => AVATARS.find(a => a.id === id) || AVATARS[0];
