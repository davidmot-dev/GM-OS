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
    MonitorPlay,
    Save,
    Download,
    Brain,
    Sparkles
} from 'lucide-react';
import { useSessionStore, THEME_PALETTES } from '../store/useSessionStore';
import type { ThemeID } from '../store/useSessionStore';
import { useModalStore } from '../stores/useModalStore';
import { SessionService } from '../store/SessionService';
import AIChatPanel from '../modules/ai/components/AIChatPanel';
import { TacticalAIControlPanel } from '../modules/tactical-ai/components/TacticalAIControlPanel';

import { useTacticalAIStore } from '../modules/tactical-ai/useTacticalAIStore';
import { useTacticalOrchestrator } from '../modules/tactical-ai/hooks/useTacticalOrchestrator';
import { useHardwareBridge } from '../modules/tactical-ai/hooks/useHardwareBridge';
import { useAudioTactical } from '../modules/tactical-ai/hooks/useAudioTactical';
import { useHueAutoConnect } from '../modules/light/hooks/useHueAutoConnect';
import { gmToast } from '../stores/useToastStore';

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
            : 'text-app-text/60 hover:bg-app-surface hover:text-app-text border border-transparent'
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
    // Activate Tactical AI listeners
    useHardwareBridge();
    useAudioTactical();
    useTacticalOrchestrator();

    // Global persistence/sync hooks
    useHueAutoConnect();

    const {
        activeModule,
        setActiveModule,
        theme,
        setTheme,
        themeColor,
        isAIPanelOpen,
        toggleAIPanel,
    } = useSessionStore();

    const { openMediaHub, showCustom } = useModalStore();
    const tacticalStatus = useTacticalAIStore((state) => state.status);

    // Appliquer le thème et la couleur d'accentuation au document
    useEffect(() => {
        const root = document.documentElement;
        const palette = THEME_PALETTES[theme] || THEME_PALETTES['cyberpunk'];
        
        root.setAttribute('data-theme', theme);
        root.style.setProperty('--app-accent', themeColor);
        root.style.setProperty('--app-bg', palette.bg);
        root.style.setProperty('--app-surface', palette.surface);
        root.style.setProperty('--app-border', palette.border);
        root.style.setProperty('--font-display', palette.fonts);



        // Mise à jour des classes de thème pour des ajustements CSS fins
        root.classList.remove('theme-cyberpunk', 'theme-medieval', 'theme-modern');
        root.classList.add(`theme-${theme}`);
    }, [theme, themeColor]);

    const cycleTheme = () => {
        const themes: ThemeID[] = ['cyberpunk', 'medieval', 'modern', 'claire'];
        const idx = themes.indexOf(theme);
        setTheme(themes[(idx + 1) % themes.length]);
    };

    const handleLaunchHub = () => {
        console.log('[Shell] Launching Player Hub...');
        if (window.appBridge?.session?.launchHubWindow) {
            console.log('[Shell] Calling bridge launchHubWindow');
            gmToast('Lancement du Player Hub...', 'info');
            window.appBridge.session.launchHubWindow();
        } else {
            console.warn('[Shell] Bridge launchHubWindow not found');
            alert("Veuillez lancer le Player Hub dans un onglet `http://localhost:5173/?window=hub` ou via le bridge Electron.");
        }
    };
    
    const handleQuitApp = () => {
        if (confirm("Voulez-vous vraiment quitter GM-OS ?")) {
            if (window.appBridge?.app?.quit) {
                window.appBridge.app.quit();
            } else {
                console.warn("Bridge 'app.quit' non disponible.");
                // En mode web, on peut essayer de fermer la fenêtre
                window.close();
            }
        }
    };

    const { isPanelOpen, setIsPanelOpen, status: tacticalAIStatus, settings: tacticalSettings } = useTacticalAIStore();

    return (
        <div data-theme={theme} className="flex h-screen bg-app-bg text-app-text overflow-hidden font-sans selection:bg-accent/30 bg-texture-overlay theme-root">

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
                        <span className={`text-xl font-bold tracking-tight leading-none ${theme === 'claire' ? 'text-app-text' : 'bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent'}`}>
                            GM-OS v5
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mt-1 opacity-80 backdrop-blur-sm">
                            {theme === 'medieval' ? 'Médiéval-Dark' : theme}
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

                    <div className="px-3 mb-2 text-[10px] font-bold text-app-text/60 uppercase tracking-widest">Audio</div>
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
                    <NavItem
                        icon={<Sparkles size={20} className="text-purple-400" />}
                        label="Obsidian"
                        active={activeModule === 'obsidian'}
                        onClick={() => setActiveModule('obsidian')}
                    />
                    <NavItem
                        icon={<Brain size={20} className="text-accent" />}
                        label="AI GEMS"
                        active={isAIPanelOpen}
                        onClick={() => toggleAIPanel()}
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
                    <div className="flex bg-app-surface/60 backdrop-blur-md border border-app-border/50 rounded-2xl overflow-hidden shadow-xl">
                        <button 
                            onClick={() => setIsPanelOpen(!isPanelOpen)}
                            className={`flex-1 py-3 flex items-center justify-center transition-all group ${isPanelOpen ? 'text-accent bg-accent/10' : 'text-app-text/50 hover:text-accent hover:bg-accent/10'}`}
                            title="Cortex Tactique"
                        >
                            <Brain size={18} className={`${tacticalAIStatus === 'analyzing' ? 'animate-pulse' : ''} group-hover:scale-110 transition-transform`} />
                        </button>
                        <button 
                            onClick={cycleTheme}
                            className="flex-1 py-3 flex items-center justify-center text-app-text/50 hover:text-accent hover:bg-accent/10 transition-all group border-l border-app-border/50"
                            title={`Thème : ${theme}`}
                        >
                            <Palette size={18} className="group-hover:rotate-12 transition-transform" />
                        </button>
                        <button 
                            onClick={() => setActiveModule('debug')}
                            className={`flex-1 py-3 flex items-center justify-center transition-all border-x border-app-border/50 ${activeModule === 'debug' ? 'text-blue-400 bg-blue-400/10' : 'text-app-text/50 hover:text-blue-400 hover:bg-blue-400/10'}`}
                            title="Debug & Logs"
                        >
                            <Terminal size={18} />
                        </button>
                        <button 
                            onClick={() => showCustom('global-settings')}
                            className="flex-1 py-3 flex items-center justify-center text-app-text/50 hover:text-gm-gold hover:bg-gm-gold/10 transition-all duration-300 relative group"
                            title="Paramètres de l'OS"
                        >
                            <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gm-gold/0 group-hover:bg-gm-gold/5 transition-colors" />
                        </button>
                        <button 
                            onClick={() => SessionService.saveFullSession()}
                            className="flex-1 py-3 flex items-center justify-center text-app-text/50 hover:text-gm-cyan hover:bg-gm-cyan/10 border-x border-app-border/50 transition-all duration-300 relative group"
                            title="Sauvegarder la session"
                        >
                            <Save size={18} className="group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-gm-cyan/0 group-hover:bg-gm-cyan/5 transition-colors" />
                        </button>
                        <button 
                            onClick={() => SessionService.loadFullSession()}
                            className="flex-1 py-3 flex items-center justify-center text-app-text/50 hover:text-gm-violet hover:bg-gm-violet/10 border-app-border/50 transition-all duration-300 relative group"
                            title="Charger une session"
                        >
                            <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                            <div className="absolute inset-0 bg-gm-violet/0 group-hover:bg-gm-violet/5 transition-colors" />
                        </button>
                    </div>
                    <div className="group relative p-4 rounded-[1.25rem] bg-gradient-to-br from-app-surface/40 to-app-bg/60 border border-app-border/30 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-accent/30 overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-500" />
                        
                        <div className="flex items-center justify-center gap-4 relative z-10 px-2">
                            <button
                                onClick={handleLaunchHub}
                                className="p-3 rounded-xl bg-sky-500/5 text-sky-400/60 hover:text-sky-400 hover:bg-sky-500/10 hover:shadow-glow-sky transition-all border border-sky-500/10"
                                title="Launch Player Hub"
                            >
                                <MonitorPlay size={20} />
                            </button>

                            <button
                                onClick={handleQuitApp}
                                className="p-3 rounded-xl bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 hover:shadow-glow-red transition-all border border-red-500/10"
                                title="QUITTER GM-OS"
                            >
                                <Power size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(29,78,216,0.05),transparent_40%)]">
                <header className="h-16 border-b border-app-border/20 flex items-center justify-between px-8 bg-app-surface/10 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold tracking-tight text-app-text uppercase italic">
                            {activeModule === 'dashboard' ? 'SESSION' : activeModule} <span className="text-accent">OS</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-4 px-4 py-1.5 rounded-full ${tacticalSettings.isEnabled ? 'bg-accent/10 border border-accent/20' : 'bg-app-surface border border-app-border opacity-50'}`}>
                            <div className={`w-2 h-2 rounded-full ${tacticalSettings.isEnabled ? (tacticalStatus === 'analyzing' ? 'bg-emerald-400 animate-pulse' : 'bg-accent') : 'bg-app-text/20'} shadow-glow-accent`} />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/80">
                                {tacticalSettings.isEnabled ? 'CORTEX ACTIVE' : 'CORTEX DISABLED'}
                             </span>
                        </div>
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

            {/* AI Side Panel */}
            <AIChatPanel />

            {/* Tactical AI HUD */}
            {tacticalSettings.isEnabled && <TacticalAIControlPanel />}

        </div>
    );
};

export default Shell;
