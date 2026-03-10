import React, { useEffect } from 'react';
import {
    Music,
    Volume2,
    Wind,
    Sword,
    Users,
    Clock,
    Lightbulb,
    LayoutDashboard,
    Settings,
    Image as ImageIcon,
    Terminal,
    Dices,
    Mic2,
    Map as MapIcon,
    Table,
    Globe,
    Star,
    Palette,
    Power,
    FolderOpen,
    Edit3,
    MonitorPlay
} from 'lucide-react';
import { useSessionStore, THEME_PALETTES } from '../store/useSessionStore';
import type { ThemeID } from '../store/useSessionStore';
import { useModalStore } from '../stores/useModalStore';
import { SessionService } from '../store/SessionService';
import { flushApplication } from '../utils/appUtils';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
    className?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, className = '' }) => (
    <button
        onClick={onClick}
        title={label}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
            ? 'bg-accent/20 text-accent border border-accent/30'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
            } ${className}`}
    >
        <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
        </span>
        <span className="font-medium truncate">{label}</span>
    </button>
);

interface ShellProps {
    children: React.ReactNode;
}

const Shell: React.FC<ShellProps> = ({ children }) => {
    const {
        activeModule,
        setActiveModule,
        theme,
        setTheme,
        themeColor,
    } = useSessionStore();

    const { openMediaHub } = useModalStore();

    // Appliquer le thème et la couleur d'accentuation au document
    useEffect(() => {
        const root = document.documentElement;
        const palette = THEME_PALETTES[theme] || THEME_PALETTES['cyberpunk'];
        
        root.setAttribute('data-theme', theme);
        root.style.setProperty('--app-accent', themeColor);
        root.style.setProperty('--app-bg', palette.bg);
        root.style.setProperty('--app-surface', palette.surface);
        root.style.setProperty('--app-border', palette.border);

        // Mise à jour des classes de thème pour des ajustements CSS fins
        root.classList.remove('theme-cyberpunk', 'theme-medieval', 'theme-modern');
        root.classList.add(`theme-${theme}`);
    }, [theme, themeColor]);

    const cycleTheme = () => {
        const themes: ThemeID[] = ['cyberpunk', 'medieval', 'modern'];
        const idx = themes.indexOf(theme);
        setTheme(themes[(idx + 1) % themes.length]);
    };

    const handleLaunchHub = () => {
        if (window.appBridge?.session?.launchHubWindow) {
            window.appBridge.session.launchHubWindow();
        } else {
            alert("Veuillez lancer le Player Hub dans un onglet `http://localhost:5173/?window=hub` ou via le bridge Electron.");
        }
    };

    return (
        <div className="flex h-screen bg-app-bg text-slate-50 overflow-hidden font-sans selection:bg-accent/30">
            {/* Sidebar */}
            <aside className="w-64 border-r border-app-border/50 bg-app-surface/30 backdrop-blur-xl flex flex-col p-4 z-20">
                <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <path d="m12 3-8.5 5v8l8.5 5 8.5-5V8z"></path>
                            <polyline points="12 22 12 13 2 9"></polyline>
                            <path d="m12 13 8.5-4"></path>
                            <line x1="12" y1="3" x2="12" y2="13"></line>
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent leading-none">
                            GM-OS v5
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mt-1 opacity-80 backdrop-blur-sm">
                            {theme}
                        </span>
                    </div>
                </div>

                <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Session OS"
                        active={activeModule === 'dashboard'}
                        onClick={() => setActiveModule('dashboard')}
                    />

                    <div className="my-3 mx-2 h-px bg-app-border/20" />

                    <div className="px-3 mb-2 text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Audio</div>
                    <NavItem
                        icon={<Music size={20} />}
                        label="Music OS"
                        active={activeModule === 'music'}
                        onClick={() => setActiveModule('music')}
                    />
                    <NavItem
                        icon={<Volume2 size={20} />}
                        label="Sound OS"
                        active={activeModule === 'sound'}
                        onClick={() => setActiveModule('sound')}
                    />
                    <NavItem
                        icon={<Wind size={20} />}
                        label="Ambient OS"
                        active={activeModule === 'ambient'}
                        onClick={() => setActiveModule('ambient')}
                    />
                    <NavItem
                        icon={<Mic2 size={20} />}
                        label="Voice OS"
                        active={activeModule === 'voice'}
                        onClick={() => setActiveModule('voice')}
                    />

                    <div className="my-3 mx-2 h-px bg-app-border/20" />

                    <div className="px-3 mb-2 text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Global</div>
                    <NavItem
                        icon={<Star size={20} className="text-amber-500" />}
                        label="Favorite OS"
                        active={activeModule === 'favorite'}
                        onClick={() => setActiveModule('favorite')}
                    />

                    <div className="my-3 mx-2 h-px bg-app-border/20" />

                    <div className="px-3 mb-2 text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Aventure</div>
                    <NavItem
                        icon={<Sword size={20} />}
                        label="Combat OS"
                        active={activeModule === 'combat'}
                        onClick={() => setActiveModule('combat')}
                    />
                    <NavItem
                        icon={<Dices size={20} />}
                        label="Dice OS"
                        active={activeModule === 'dice'}
                        onClick={() => setActiveModule('dice')}
                    />
                    <NavItem
                        icon={<Users size={20} />}
                        label="NPC OS"
                        active={activeModule === 'npc'}
                        onClick={() => setActiveModule('npc')}
                    />
                    <NavItem
                        icon={<MapIcon size={20} />}
                        label="Map OS"
                        active={activeModule === 'map'}
                        onClick={() => setActiveModule('map')}
                    />

                    <div className="my-3 mx-2 h-px bg-app-border/20" />

                    <div className="px-3 mb-2 text-[10px] font-bold text-app-text/40 uppercase tracking-widest">Outils</div>
                    <NavItem
                        icon={<FolderOpen size={20} className="text-gm-cyan" />}
                        label="Media Hub"
                        active={false}
                        onClick={() => openMediaHub()}
                    />
                    <NavItem
                        icon={<ImageIcon size={20} />}
                        label="Image OS"
                        active={activeModule === 'image'}
                        onClick={() => setActiveModule('image')}
                    />
                    <NavItem
                        icon={<Clock size={20} />}
                        label="Clock OS"
                        active={activeModule === 'clock'}
                        onClick={() => setActiveModule('clock')}
                    />
                    <NavItem
                        icon={<Lightbulb size={20} />}
                        label="Light OS"
                        active={activeModule === 'light'}
                        onClick={() => setActiveModule('light')}
                    />
                    <NavItem
                        icon={<Table size={20} />}
                        label="Table OS"
                        active={activeModule === 'table'}
                        onClick={() => setActiveModule('table')}
                    />
                    <NavItem
                        icon={<Globe size={20} />}
                        label="Web OS"
                        active={activeModule === 'web'}
                        onClick={() => setActiveModule('web')}
                    />
                    <NavItem
                        icon={<Edit3 size={20} />}
                        label="Whiteboard OS"
                        active={activeModule === 'whiteboard'}
                        onClick={() => setActiveModule('whiteboard')}
                    />
                </nav>

                <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-app-border/20">
                    {/* 1. Unified System Bar */}
                    <div className="flex items-center justify-between px-1 py-1 bg-app-bg/40 backdrop-blur-md rounded-xl border border-app-border/30 shadow-inner">
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={cycleTheme}
                                className="p-2 rounded-lg text-slate-400 hover:text-accent hover:bg-accent/10 transition-all group"
                                title={`Thème : ${theme} (${themeColor})`}
                            >
                                <Palette size={18} className="group-hover:rotate-12 transition-transform" />
                            </button>
                            <button
                                onClick={() => setActiveModule('debug')}
                                className={`p-2 rounded-lg transition-all ${activeModule === 'debug' ? 'text-blue-400 bg-blue-400/10' : 'text-slate-400 hover:text-blue-400 hover:bg-blue-400/10'}`}
                                title="Debug & Logs"
                            >
                                <Terminal size={18} />
                            </button>
                            <button
                                onClick={handleLaunchHub}
                                className="p-1.5 rounded-lg text-app-text/40 hover:text-sky-400 hover:bg-sky-400/10 transition-all"
                                title="Launch Player Hub"
                            >
                                <MonitorPlay size={18} />
                            </button>
                            <button
                                onClick={() => { }}
                                className="p-1.5 rounded-lg text-app-text/40 hover:text-app-text/80 hover:bg-white/5 transition-all"
                                title="Réglages"
                            >
                                <Settings size={18} />
                            </button>
                        </div>

                        <div className="w-px h-4 bg-app-border/20 mx-0.5" />

                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={() => SessionService.saveFullSession()}
                                className="p-1.5 rounded-lg text-app-text/40 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
                                title="Sauvegarder"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                            </button>
                            <button
                                onClick={() => SessionService.loadFullSession()}
                                className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                                title="Charger"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            </button>
                        </div>
                    </div>

                    {/* 2. Premium DM Card */}
                    <div className="group relative p-4 rounded-[1.25rem] bg-gradient-to-br from-app-surface/40 to-app-bg/60 border border-app-border/30 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-accent/30 overflow-hidden">
                        {/* Background subtle glow */}
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-500" />
                        
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-white ring-2 ring-slate-800 shadow-inner group-hover:ring-accent/50 transition-all">
                                    DM
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                            </div>
                            
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-xs font-black text-white uppercase tracking-tighter truncate leading-none">Dungeon Master</span>
                                <span className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                    Session Link Active
                                </span>
                            </div>

                            <button
                                onClick={flushApplication}
                                className="p-2 rounded-lg text-app-text/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                title="RÉINITIALISATION TOTALE"
                            >
                                <Power size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(29,78,216,0.05),transparent_40%)]">
                <header className="h-16 border-b border-app-border/20 flex items-center justify-between px-8 bg-app-surface/10 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold tracking-tight text-white uppercase italic">
                            {activeModule} <span className="text-accent">OS</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
                             <span className="text-[10px] font-mono text-app-text/40 uppercase tracking-widest">System Link Active</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-app-bg border border-app-border text-xs font-mono text-app-text/40 shadow-xl">
                            GM-OS_v5.0.0-ALPHA
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Shell;
