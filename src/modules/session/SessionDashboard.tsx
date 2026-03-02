import React from 'react';
import CampaignWidget from './components/CampaignWidget';
import SessionChecklist from './components/SessionChecklist';
import TeamTracker from './components/TeamTracker';
import DoubleJournal from './components/DoubleJournal';
import MapPreview from './components/MapPreview';
import ModuleSnapshots from './components/ModuleSnapshots';
import QuickRollWidget from './components/QuickRollWidget';
import { useSessionStore } from '../../store/useSessionStore';
import { gmAlert } from '../../stores/useModalStore';
import { LayoutDashboard as DashboardIcon, Swords, Users, Map as MapIcon, Archive, PlusCircle, Settings, Bell, Play } from 'lucide-react';

const SessionDashboard: React.FC = () => {
    const { setActiveModule, toggleSessionMode, isSessionMode } = useSessionStore();

    return (
        <div className="flex-1 h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-background-dark text-slate-100 font-display">
            {/* Top Navigation Bar - Contextual Header for Session OS */}
            <header className="flex items-center justify-between h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 text-gm-gold">
                        <Users size={28} />
                        <h1 className="text-slate-100 text-lg font-bold tracking-tight">
                            Session OS <span className="text-gm-gold font-light">Master Cockpit</span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => toggleSessionMode()}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-glow-gold ${isSessionMode ? 'bg-amber-600 text-white' : 'bg-gm-gold text-background-dark hover:brightness-110'}`}
                        >
                            <Play size={18} fill="currentColor" />
                            {isSessionMode ? 'Session Active' : 'Launch Session'}
                        </button>
                        <button
                            onClick={() => gmAlert('Le module de configuration globale sera bientôt disponible.')}
                            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
                        >
                            <Settings size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all relative">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <main className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">

                {/* Left Sidebar (col-span-3) */}
                <aside className="col-span-3 bg-slate-900/90 backdrop-blur-md border-r border-slate-800 p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                    <CampaignWidget />

                    {/* Navigation Menu (Static Mockup from Stitch) */}
                    <nav className="flex flex-col gap-1">
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-2 px-3">Management</p>
                        <button
                            onClick={() => setActiveModule('dashboard')}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gm-gold/10 text-gm-gold group w-full text-left"
                        >
                            <DashboardIcon className="group-hover:scale-110 transition-transform" size={20} />
                            <span className="text-sm font-medium">Cockpit</span>
                        </button>
                        <button
                            onClick={() => setActiveModule('combat')}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all w-full text-left"
                        >
                            <Swords size={20} />
                            <span className="text-sm font-medium">Encounters</span>
                        </button>
                        <button
                            onClick={() => setActiveModule('npc')}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all w-full text-left"
                        >
                            <Users size={20} />
                            <span className="text-sm font-medium">NPC Gallery</span>
                        </button>
                        <button
                            onClick={() => setActiveModule('map')}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all w-full text-left"
                        >
                            <MapIcon size={20} />
                            <span className="text-sm font-medium">World Atlas</span>
                        </button>
                        <button
                            onClick={() => setActiveModule('table')}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all w-full text-left"
                        >
                            <Archive size={20} />
                            <span className="text-sm font-medium">Loot Tables</span>
                        </button>
                    </nav>

                    <SessionChecklist />

                    {/* New Encounter Button */}
                    <div className="mt-auto pt-4">
                        <button
                            onClick={() => setActiveModule('combat')}
                            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 py-3 rounded-xl text-sm font-bold transition-all"
                        >
                            <PlusCircle className="text-gm-gold" size={20} />
                            New Encounter
                        </button>
                    </div>
                </aside>

                {/* Central Workspace (col-span-6) */}
                <section className="col-span-6 flex flex-col gap-6 p-6 overflow-y-auto custom-scrollbar bg-obsidian-dark/50 shadow-inner">
                    <TeamTracker />
                    <DoubleJournal />
                    <MapPreview />
                </section>

                {/* Right Sidebar (col-span-3) */}
                <aside className="col-span-3 bg-slate-900/80 border-l border-slate-800 p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                    <ModuleSnapshots />
                    <QuickRollWidget />
                </aside>
            </main>
        </div>
    );
};

export default SessionDashboard;
