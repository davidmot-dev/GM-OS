import React, { useState } from 'react';
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
    ScrollText,
    Terminal
} from 'lucide-react';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
            }`}
    >
        <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
        </span>
        <span className="font-medium">{label}</span>
    </button>
);

export type ModuleID = 'dashboard' | 'music' | 'sound' | 'ambient' | 'combat' | 'npc' | 'clock' | 'light' | 'image' | 'story' | 'debug';

interface ShellProps {
    children: React.ReactNode;
    activeModule: ModuleID;
    setActiveModule: (id: ModuleID) => void;
}

const Shell: React.FC<ShellProps> = ({ children, activeModule, setActiveModule }) => {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800/50 bg-slate-900/30 backdrop-blur-xl flex flex-col p-4">
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
                        label="Dashboard"
                        active={activeModule === 'dashboard'}
                        onClick={() => setActiveModule('dashboard')}
                    />

                    <div className="my-3 mx-2 h-px bg-slate-800/50" />

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

                    <div className="my-3 mx-2 h-px bg-slate-800/50" />

                    <NavItem
                        icon={<Sword size={20} />}
                        label="Combat OS"
                        active={activeModule === 'combat'}
                        onClick={() => setActiveModule('combat')}
                    />
                    <NavItem
                        icon={<Users size={20} />}
                        label="NPC OS"
                        active={activeModule === 'npc'}
                        onClick={() => setActiveModule('npc')}
                    />
                    <NavItem
                        icon={<ScrollText size={20} />}
                        label="Story OS"
                        active={activeModule === 'story'}
                        onClick={() => setActiveModule('story')}
                    />

                    <div className="my-3 mx-2 h-px bg-slate-800/50" />

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
                </nav>

                <div className="mt-auto pt-4 flex flex-col gap-1 border-t border-slate-800/50">
                    <NavItem
                        icon={<Terminal size={20} />}
                        label="Debug"
                        active={activeModule === 'debug'}
                        onClick={() => setActiveModule('debug')}
                    />
                    <NavItem
                        icon={<Settings size={20} />}
                        label="Settings"
                        active={false}
                        onClick={() => { }}
                    />

                    <div className="flex items-center gap-3 px-4 py-4 mt-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 ring-2 ring-slate-800">
                            DM
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Dungeon Master</span>
                            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Session Active
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(29,78,216,0.05),transparent_40%)]">
                <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-900/20 backdrop-blur-md z-10">
                    <h2 className="text-lg font-semibold capitalize text-slate-200">
                        {activeModule}
                    </h2>
                    <div className="flex items-center gap-4">
                        {/* Right header actions could go here */}
                        <div className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-xs font-mono text-slate-400">
                            OS v5.0.0-alpha
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Shell;
