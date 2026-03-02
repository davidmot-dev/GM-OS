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
    Shield,
    ShieldOff,
    Palette,
    Power
} from 'lucide-react';
import { useSessionStore } from '../store/useSessionStore';
import type { ThemeID } from '../store/useSessionStore';
import { SessionService } from '../store/SessionService';

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
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
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
        isSessionMode,
        toggleSessionMode
    } = useSessionStore();

    // Appliquer le thème au document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Appliquer le mode session via une classe globale
    useEffect(() => {
        if (isSessionMode) {
            document.body.classList.add('session-focus');
        } else {
            document.body.classList.remove('session-focus');
        }
    }, [isSessionMode]);

    const cycleTheme = () => {
        const themes: ThemeID[] = ['cyberpunk', 'medieval', 'modern'];
        const idx = themes.indexOf(theme);
        setTheme(themes[(idx + 1) % themes.length]);
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800/50 bg-slate-900/30 backdrop-blur-xl flex flex-col p-4 z-20">
                <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <path d="m12 3-8.5 5v8l8.5 5 8.5-5V8z"></path>
                            <polyline points="12 22 12 13 2 9"></polyline>
                            <path d="m12 13 8.5-4"></path>
                            <line x1="12" y1="3" x2="12" y2="13"></line>
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        GM-OS v5
                    </span>
                </div>

                <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Session OS"
                        active={activeModule === 'dashboard'}
                        onClick={() => setActiveModule('dashboard')}
                    />

                    <div className="my-3 mx-2 h-px bg-slate-800/50" />

                    <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Audio</div>
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

                    <div className="my-3 mx-2 h-px bg-slate-800/50" />

                    <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aventure</div>
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

                    <div className="my-3 mx-2 h-px bg-slate-800/50" />

                    <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Outils</div>
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
                        icon={<Star size={20} />}
                        label="Favoris"
                        active={activeModule === 'favorite'}
                        onClick={() => setActiveModule('favorite')}
                    />
                </nav>

                <div className="mt-auto pt-4 flex flex-col gap-1 border-t border-slate-800/50">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button
                            onClick={() => toggleSessionMode()}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${isSessionMode
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                                }`}
                            title={isSessionMode ? "Mode Session : MJ Focus (Outils masqués)" : "Mode Edition : MJ Tools (Outils visibles)"}
                        >
                            {isSessionMode ? <Shield size={18} /> : <ShieldOff size={18} />}
                            <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">Session</span>
                        </button>
                        <button
                            onClick={cycleTheme}
                            className="flex flex-col items-center justify-center p-2 rounded-xl border bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
                            title={`Thème actuel : ${theme}`}
                        >
                            <Palette size={18} />
                            <span className="text-[9px] mt-1 font-bold uppercase tracking-tighter">Thème</span>
                        </button>
                    </div>

                    <NavItem
                        icon={<Terminal size={20} />}
                        label="Debug / Logs"
                        active={activeModule === 'debug'}
                        onClick={() => setActiveModule('debug')}
                    />
                    <NavItem
                        icon={<Settings size={20} />}
                        label="Réglages"
                        active={false}
                        onClick={() => { }}
                    />
                    <div className="grid grid-cols-2 gap-2 mt-2 px-2">
                        <button
                            onClick={() => SessionService.saveFullSession()}
                            className="flex items-center justify-center p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                            title="Sauvegarder Session"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                        </button>
                        <button
                            onClick={() => SessionService.loadFullSession()}
                            className="flex items-center justify-center p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                            title="Charger Session"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-4 mt-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 ring-2 ring-slate-800 shadow-inner">
                            DM
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-200">Dungeon Master</span>
                            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Session Active
                            </span>
                        </div>
                        <button className="ml-auto text-slate-500 hover:text-red-400 transition-colors" title="Quitter">
                            <Power size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(29,78,216,0.05),transparent_40%)]">
                <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-900/20 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold tracking-tight text-white uppercase italic">
                            {activeModule} <span className="text-blue-500">OS</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">System Link Active</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-500 shadow-xl">
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
