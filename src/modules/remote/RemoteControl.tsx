import React, { useState } from 'react';
import { 
    LayoutDashboard, 
    Dices, 
    Volume2, 
    Sword, 
    PenTool, 
    BookOpen, 
    Film,
    WifiOff,
    Smartphone,
    ShieldAlert
} from 'lucide-react';
import { useRemoteSync } from './hooks/useRemoteSync';
import { type RemoteActionType } from './types/remote.types';
import RemoteUniversalPads from './components/RemoteUniversalPads';
import RemoteDicePad from './components/RemoteDicePad';
import RemoteSoundboard from './components/RemoteSoundboard';
import RemoteCombatTracker from './components/RemoteCombatTracker';
import RemoteStoryboard from './components/RemoteStoryboard';
import RemoteNotes from './components/RemoteNotes';
import RemoteDiceResultOverlay from './components/RemoteDiceResultOverlay';
import RemoteWhiteboardView from './components/RemoteWhiteboardView';

const RemoteControl: React.FC = () => {
    const { status, isPaired, syncData, lastDiceResult, clearDiceResult, sendAction } = useRemoteSync();
    const [activeTab, setActiveTab] = useState<'pads' | 'dice' | 'sound' | 'combat' | 'whiteboard' | 'notes' | 'story'>('pads');
    const [isAventureMode] = useState(() => typeof window !== 'undefined' ? window.location.search.includes('mode=adventure') : false);

    const tabs = [
        { id: 'pads', icon: LayoutDashboard, label: 'Pads' },
        { id: 'dice', icon: Dices, label: 'Dés' },
        { id: 'sound', icon: Volume2, label: 'Sons' },
        { id: 'combat', icon: Sword, label: 'Combat' },
        { id: 'whiteboard', icon: PenTool, label: 'Tableau' },
        { id: 'notes', icon: BookOpen, label: 'Notes' },
        { id: 'story', icon: Film, label: 'Scénario' },
    ] as const;

    const renderContent = () => {
        switch (activeTab) {
            case 'pads':
                return (
                    <RemoteUniversalPads 
                        pads={syncData.universalPads} 
                        onTrigger={(id) => sendAction('remote:pad:trigger', { id })} 
                    />
                );
            case 'dice':
                return (
                    <RemoteDicePad 
                        activeDiceConfig={syncData.session?.activeDiceConfig}
                        desEchelonnes={syncData.session?.desEchelonnes}
                        onRoll={(dice) => sendAction('remote:dice:roll', dice)} 
                        onClear={() => sendAction('remote:dice:clear', {})}
                    />
                );
            case 'sound':
                return (
                    <RemoteSoundboard 
                        sounds={syncData.sounds}
                        masterVolume={syncData.masterVolume}
                        onVolumeChange={(vol) => sendAction('remote:sound:volume', { volume: vol })}
                        onTrigger={(id) => sendAction('remote:sound:trigger', { id })}
                        onStopAll={() => sendAction('remote:sound:stop-all', {})}
                    />
                );
            case 'combat':
                return (
                    <RemoteCombatTracker 
                        combat={syncData.combat}
                        isAventureMode={isAventureMode}
                        onNextTurn={() => sendAction('remote:combat:next', {})}
                        onUpdateHp={(id, delta) => sendAction('remote:combat:hp', { id, delta })}
                    />
                );
            case 'whiteboard':
                return (
                    <RemoteWhiteboardView 
                        whiteboard={syncData.whiteboard}
                        onAction={(type, payload) => sendAction(type as RemoteActionType, payload)}
                    />
                );
            case 'notes':
                return (
                    <RemoteNotes 
                        notes={syncData.notes}
                        isAventureMode={isAventureMode}
                    />
                );
            case 'story':
                return (
                    <RemoteStoryboard 
                        moments={syncData.moments}
                        onTrigger={(index) => sendAction('remote:story:trigger', { index })}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-app-bg text-app-text font-sans selection:bg-accent/30 flex flex-col w-full sm:max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto relative overflow-hidden">
            <header className="p-6 pt-10 flex items-center justify-between sticky top-0 z-50 bg-app-bg/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-glow-accent/20 border border-accent/20">
                        <Smartphone size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-black uppercase tracking-tighter leading-tight">GM Remote</h1>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-rose-500 shadow-glow-rose animate-pulse'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                {status === 'connected' ? 'Session Live' : 'Hors Ligne'}
                            </span>
                        </div>
                    </div>
                </div>
                
                {isAventureMode && (
                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-glow-amber" />
                        <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest">Aventure</span>
                    </div>
                )}
            </header>

            {status !== 'connected' && (
                <div className="bg-rose-600 px-4 py-2 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
                    <WifiOff size={14} className="text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Reconnection...</span>
                </div>
            )}

            {/* Connecté mais non appairé : le serveur ne transmet que le flux joueur,
                donc ni les notes privées ni les secrets de PNJ. */}
            {status === 'connected' && !isPaired && (
                <div className="bg-amber-600 px-4 py-2 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
                    <ShieldAlert size={14} className="text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white text-center">
                        Appareil non appairé — scannez le QR code des réglages MJ
                    </span>
                </div>
            )}

            <main className="flex-1 p-4 md:p-10 pb-32 overflow-y-auto scrollbar-hide">
                {renderContent()}
            </main>

            <nav className="fixed bottom-6 left-6 right-6 z-[100]">
                <div className="premium-glass rounded-[2rem] border border-white/10 p-2 flex items-center justify-between shadow-2xl backdrop-blur-2xl">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                title={tab.label}
                                aria-label={tab.label}
                                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                    isActive ? 'text-accent scale-110' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                {isActive && (
                                    <span className="absolute -top-1 right-2 w-1 h-1 rounded-full bg-accent shadow-glow-accent" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            <div className="fixed -top-20 -right-20 w-64 h-64 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed -bottom-20 -left-20 w-64 h-64 bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Global Dice Result Overlay */}
            <RemoteDiceResultOverlay 
                result={lastDiceResult} 
                onClose={clearDiceResult} 
            />
        </div>
    );
};

export default RemoteControl;
