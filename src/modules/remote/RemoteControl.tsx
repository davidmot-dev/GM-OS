import React, { useState, useEffect, useRef } from 'react';
import { 
    Dice5, 
    Clapperboard, 
    Wifi, 
    WifiOff, 
    Volume2, 
    Play,
    Smartphone,
    RotateCcw,
    X,
    Swords,
    Shield,
    ChevronRight,
    FileText,
    EyeOff,
    Eraser
} from 'lucide-react';
import { type Point, type DrawingPath } from '../whiteboard/useWhiteboardStore';
import RemoteWhiteboardView from './components/RemoteWhiteboardView';

type HealthSystemData = 
    { type: 'wounds', data: { currentLevel: 'SAIN' | 'BLESSÉ' | 'MORTEL' | 'FATAL' } } |
    { type: 'clock', data: { segments: number, maxSegments: number } } |
    { type: 'boxes', data: { boxes: { filled: boolean }[] } } |
    { type: 'anatomy', data: { parts: Record<string, { status: string }> } };

const RemoteControl: React.FC = () => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [activeTab, setActiveTab] = useState<'dice' | 'sounds' | 'storyboard' | 'combat' | 'whiteboard' | 'notes'>('dice');
    const [notesView, setNotesView] = useState<'public' | 'private'>('private');
    const [isAventureMode, setIsAventureMode] = useState(false);
    const [syncData, setSyncData] = useState<{
        sounds: { id: string, title: string, active: boolean }[],
        moments: { id: string, name: string }[],
        masterVolume: number,
        combat: {
            combatants: { 
                id: string, 
                name: string, 
                hp: number, 
                hpMax: number, 
                init: number, 
                isPlayer: boolean,
                healthSystem?: HealthSystemData
            }[],
            currentTurnIdx: number,
            round: number
        },
        notes: { public: string, private: string },
        whiteboard: {
            paths: DrawingPath[],
            activePath: DrawingPath | null,
            laserPointer: Point | null,
            backgroundMode: 'dark' | 'light',
            currentTool: string,
            currentColor: string,
            currentWidth: number
        }
    }>({ 
        sounds: [], 
        moments: [], 
        masterVolume: 1.0,
        combat: { combatants: [], currentTurnIdx: 0, round: 1 },
        notes: { public: '', private: '' },
        whiteboard: {
            paths: [],
            activePath: null,
            laserPointer: null,
            backgroundMode: 'dark',
            currentTool: 'brush',
            currentColor: '#ffffff',
            currentWidth: 3
        }
    });

    const socketRef = useRef<WebSocket | null>(null);

    // Get the host IP from current URL
    const host = window.location.hostname;
    const port = 3001;

    const connectRef = useRef<(() => void) | null>(null);

    const connect = React.useCallback(() => {
        setStatus('connecting');
        const socketUrl = `ws://${host}:${port}`;
        console.log(`[Remote] Attempting to connect to: ${socketUrl}`);
        const socket = new WebSocket(socketUrl);

        socket.onopen = () => {
            console.log('Connected to GM-OS');
            setStatus('connected');
            socket.send(JSON.stringify({ type: 'remote:hello' }));
        };

        socket.onclose = () => {
            console.log('Disconnected');
            setStatus('error');
            // Safely call via ref to allow recursion without closure trap
            setTimeout(() => {
                if (connectRef.current) connectRef.current();
            }, 3000);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'sync') {
                    console.log('[Remote] Sync data received:', data.payload);
                    setSyncData(prev => {
                        // Crucial: Merge partial updates instead of overwriting
                        const newData = { ...prev, ...data.payload };
                        
                        // Ensure required sub-objects remain stable
                        if (data.payload.combat) newData.combat = { ...prev.combat, ...data.payload.combat };
                        if (data.payload.notes) newData.notes = { ...prev.notes, ...data.payload.notes };
                        if (data.payload.whiteboard) newData.whiteboard = { ...prev.whiteboard, ...data.payload.whiteboard };
                        
                        return newData;
                    });
                }
            } catch (err) {
                console.error('[Remote] Failed to parse server message:', err);
            }
        };

        socket.onerror = () => setStatus('error');
        socketRef.current = socket;
    }, [host, port]);

    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        connect();
        return () => socketRef.current?.close();
    }, [connect]);

    const sendAction = (type: string, payload: unknown) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type, payload }));
            if ('vibrate' in navigator) window.navigator.vibrate(50);
        }
    };

    const renderDicePad = () => (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {[4, 6, 8, 10, 12, 20, 100].map(d => (
                <button 
                    key={d}
                    onClick={() => sendAction('dice:roll', { die: d })}
                    className="aspect-square bg-white/5 border border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-2 active:scale-95 active:bg-accent active:text-app-bg transition-all"
                >
                    <Dice5 size={32} />
                    <span className="text-xl font-black italic">D{d}</span>
                </button>
            ))}
            <button 
                onClick={() => sendAction('dice:clear', {})}
                className="aspect-square bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex flex-col items-center justify-center gap-2 active:scale-95 text-rose-500"
            >
                <RotateCcw size={32} />
                <span className="text-[10px] font-black uppercase">Vider</span>
            </button>
        </div>
    );

    const renderSoundboard = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Master Controls */}
            <div className="flex flex-col gap-4 p-6 bg-white/5 border border-white/10 rounded-[2.5rem]">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Volume Maître</span>
                    <span className="text-xs font-black text-accent">{Math.round((syncData?.masterVolume ?? 0) * 100)}%</span>
                </div>
                <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={syncData?.masterVolume ?? 0}
                    onChange={(e) => {
                        const vol = parseFloat(e.target.value);
                        setSyncData(prev => ({ ...prev, masterVolume: vol }));
                        sendAction('sound:volume', { volume: vol });
                    }}
                    className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <button 
                    onClick={() => sendAction('sound:stop-all', {})}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 active:scale-95 transition-all"
                >
                    <X size={20} strokeWidth={3} />
                    <span className="text-xs font-black uppercase tracking-widest">STOP ALL SOUNDS</span>
                </button>
            </div>

            <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest text-center">Déclencheurs SFX</p>
                <div className="grid grid-cols-2 gap-3">
                    {syncData.sounds && syncData.sounds.length > 0 ? (
                        syncData.sounds.map(s => (
                            <button 
                                key={s.id}
                                onClick={() => sendAction('sound:trigger', { padId: s.id })}
                                disabled={!s.active}
                                className={`p-6 border rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all ${
                                    s.active ? 'bg-white/5 border-white/10 text-white' : 'bg-black/20 border-white/5 text-white/20'
                                }`}
                            >
                                <Volume2 size={24} className={s.active ? 'text-rose-400' : ''} />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-tight truncate w-full px-2">
                                    {s.title}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="col-span-2 text-center py-10 text-slate-500 italic text-sm">
                            Chargement des sons...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderStoryboard = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest text-center">Séquences de Session</p>
            <div className="space-y-3">
                {syncData.moments.length > 0 ? (
                    syncData.moments.map((m, i) => (
                        <button 
                            key={m.id}
                            onClick={() => sendAction('storyboard:trigger', { index: i })}
                            className="w-full p-6 bg-accent/5 border border-accent/20 rounded-3xl flex items-center justify-between active:bg-accent active:text-app-bg transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-black italic opacity-20">{(i + 1).toString().padStart(2, '0')}</span>
                                <span className="font-bold uppercase tracking-tight text-left">{m.name}</span>
                            </div>
                            <Play size={24} fill="currentColor" className="text-accent group-active:text-app-bg" />
                        </button>
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-500 italic text-sm">
                        Aucune séquence détectée.
                    </div>
                )}
            </div>
        </div>
    );

    const renderCombatTracker = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-[2.5rem]">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Round Actuel</span>
                    <span className="text-3xl font-black text-white">{syncData.combat?.round ?? 1}</span>
                </div>
                <button 
                    onClick={() => sendAction('combat:next-turn', {})}
                    className="px-8 py-4 bg-accent text-app-bg rounded-2xl flex items-center gap-2 font-black uppercase text-xs active:scale-95 transition-all"
                >
                    Suivant <ChevronRight size={18} />
                </button>
            </div>

            <div className="space-y-3">
                {syncData.combat?.combatants?.map((c, i) => {
                    const isActive = i === syncData.combat.currentTurnIdx;
                    return (
                        <div key={c.id} className={`p-4 rounded-3xl border transition-all ${isActive ? 'bg-accent/10 border-accent scale-[1.02]' : 'bg-white/5 border-white/5'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors duration-500 ${isActive ? 'bg-accent text-app-bg shadow-glow-accent/50' : 'bg-white/10'}`}>{c.init}</div>
                                    <div className="flex flex-col">
                                        <span className={`font-bold text-sm transition-colors ${isActive ? 'text-accent' : 'text-slate-200'}`}>{c.name}</span>
                                        <span className="text-[8px] uppercase text-slate-500">{c.isPlayer ? 'Joueur' : 'Ennemi'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(!isAventureMode || c.isPlayer) && (
                                        <>
                                            <button onClick={() => sendAction('combat:update-hp', { id: c.id, delta: -1 })} className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center active:scale-90">-</button>
                                            <div className="flex flex-col items-center min-w-[30px]">
                                                <span className="text-xs font-black">{c.hp}</span>
                                                <span className="text-[8px] text-slate-500">PV</span>
                                            </div>
                                            <button onClick={() => sendAction('combat:update-hp', { id: c.id, delta: 1 })} className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center active:scale-90">+</button>
                                        </>
                                    )}
                                    {isAventureMode && !c.isPlayer && (
                                        <div className="text-[10px] font-black uppercase text-slate-600 tracking-widest italic pr-2">Caché</div>
                                    )}
                                </div>
                            </div>

                            {/* Modular Health Display */}
                            {c.healthSystem && (
                                <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-2 items-center">
                                    {c.healthSystem.type === 'wounds' && (
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                            c.healthSystem.data.currentLevel === 'SAIN' ? 'border-emerald-500/30 text-emerald-400' :
                                            c.healthSystem.data.currentLevel === 'FATAL' ? 'border-rose-600 bg-rose-600 text-white animate-pulse' :
                                            'border-amber-500 text-amber-400'
                                        }`}>
                                            {c.healthSystem.data.currentLevel}
                                        </span>
                                    )}
                                    {c.healthSystem.type === 'clock' && (
                                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                                            <span className="text-[10px] font-bold text-blue-400">
                                                {c.healthSystem.data.segments} / {c.healthSystem.data.maxSegments}
                                            </span>
                                        </div>
                                    )}
                                    {c.healthSystem.type === 'boxes' && (
                                        <div className="flex gap-1">
                                            {c.healthSystem.data.boxes.map((b: { filled: boolean }, bi: number) => (
                                                <div 
                                                    key={bi} 
                                                    className={`w-2 h-2 rounded-sm border ${b.filled ? 'bg-orange-500 border-orange-400' : 'border-white/20'}`} 
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {c.healthSystem.type === 'anatomy' && (
                                        <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold uppercase">
                                            <Shield size={10} /> 
                                            {Object.values(c.healthSystem.data.parts).filter((p: any) => p.status !== 'healthy').length} Blessures Localisées
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderNotes = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* View Selector */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                <button 
                    onClick={() => setNotesView('private')}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${notesView === 'private' ? 'bg-accent text-app-bg' : 'text-slate-500'}`}
                >
                    <EyeOff size={14} /> Secrets MJ
                </button>
                <button 
                    onClick={() => setNotesView('public')}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${notesView === 'public' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                >
                    <FileText size={14} /> Synopsis
                </button>
            </div>

            {/* Content Area */}
            <div className={`p-6 rounded-[2.5rem] bg-white/5 border border-white/5 min-h-[300px] transition-all ${isAventureMode && notesView === 'private' ? 'blur-md grayscale pointer-events-none' : ''}`}>
                <div className="prose prose-invert prose-sm max-w-none">
                    {notesView === 'private' ? (
                        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
                            {isAventureMode ? "Contenu protégé par le Mode Aventure." : (syncData.notes?.private || "Aucun secret enregistré pour cette campagne.")}
                        </div>
                    ) : (
                        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
                            {syncData.notes?.public || "Aucun synopsis public disponible."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#050505] text-slate-200 flex flex-col font-sans overflow-hidden select-none touch-none">
            {/* Top Status Bar */}
            <div className="px-6 py-4 flex items-center justify-between bg-black/40 border-b border-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                        <Smartphone size={18} />
                    </div>
                    <div>
                        <h1 className="text-xs font-black uppercase tracking-tighter">GM Remote</h1>
                        <div className="flex items-center gap-1">
                            {status === 'connected' ? (
                                <>
                                    <Wifi size={10} className="text-emerald-500" />
                                    <span className="text-[8px] font-bold text-emerald-500 uppercase">Connecté</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff size={10} className="text-rose-500" />
                                    <span className="text-[8px] font-bold text-rose-500 uppercase">Déconnecté</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsAventureMode(!isAventureMode)}
                        className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${
                            isAventureMode 
                            ? 'bg-rose-500 border-rose-400 text-white shadow-glow-rose/30' 
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                    >
                        {isAventureMode ? 'AVENTURE ON' : 'MODE MJ'}
                    </button>
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold">
                        V5.1
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-32">
                {activeTab === 'dice' && renderDicePad()}
                {activeTab === 'sounds' && renderSoundboard()}
                {activeTab === 'storyboard' && renderStoryboard()}
                {activeTab === 'combat' && renderCombatTracker()}
                {activeTab === 'whiteboard' && (
                    <div className="h-[60vh]">
                        <RemoteWhiteboardView 
                            whiteboard={syncData.whiteboard}
                            onAction={(type, payload) => {
                                socketRef.current?.send(JSON.stringify({ type, payload }));
                            }}
                        />
                    </div>
                )}
                {activeTab === 'notes' && renderNotes()}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-6 left-6 right-6 h-20 bg-app-surface/80 border border-white/10 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl flex items-center justify-around px-2 z-50">
                <button 
                    onClick={() => setActiveTab('dice')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dice' ? 'text-accent scale-110' : 'text-slate-500'}`}
                >
                    <Dice5 size={20} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Dés</span>
                </button>
                <button 
                    onClick={() => setActiveTab('sounds')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'sounds' ? 'text-rose-400 scale-110' : 'text-slate-500'}`}
                >
                    <Volume2 size={20} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Sons</span>
                </button>
                <button 
                    onClick={() => setActiveTab('storyboard')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'storyboard' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}
                >
                    <Clapperboard size={20} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Scenes</span>
                </button>
                <button 
                    onClick={() => setActiveTab('combat')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'combat' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}
                >
                    <Swords size={20} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Combat</span>
                </button>
                <button 
                    onClick={() => setActiveTab('whiteboard')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'whiteboard' ? 'text-accent scale-110' : 'text-slate-500'}`}
                >
                    <Eraser size={20} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Dessin</span>
                </button>
                <button 
                    onClick={() => setActiveTab('notes')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'notes' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}
                >
                    <FileText size={20} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Notes</span>
                </button>
            </div>
        </div>
    );
};

export default RemoteControl;
