import React, { useState, useEffect, useMemo } from 'react';
import { useClientStore } from '../../stores/useClientStore';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { Radar, User, Shield, Fingerprint, WifiOff, AlertCircle } from 'lucide-react';

type OnboardingStep = 'SCANNING' | 'SELECTION' | 'SYNCING';

const LobbyOnboarding: React.FC = () => {
    const { setPseudo, setPlayerName, setCharacterId, completeOnboarding, resetIdentity } = useClientStore();
    const { sessions } = useSessionOSStore();
    const players = useSessionOSStore(state => state.players);
    const campaigns = useSessionOSStore(state => state.campaigns);
    
    const [step, setStep] = useState<OnboardingStep>('SCANNING');
    const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

    // Trouver la session active
    const activeSession = useMemo(() => {
        if (!sessions || sessions.length === 0) return null;
        
        // On cherche d'abord une session réellement active qui n'est pas la session de démo par défaut
        const realActive = sessions.find(s => s.status === 'active' && s.id !== 's-1');
        if (realActive) return realActive;

        // Sinon on prend n'importe quelle session active (y compris démo si c'est tout ce qu'on a)
        return sessions.find(s => s.status === 'active') || sessions[0];
    }, [sessions]);

    // Formater le nom de la session de manière lisible
    const sessionDisplayName = useMemo(() => {
        if (!activeSession) return "Aucune session active";
        
        const state = useSessionOSStore.getState();
        const campaign = campaigns.find(c => c.id === activeSession.campaignId) || 
                         campaigns.find(c => c.id === state.activeCampaignId);
        const campaignName = campaign?.name || state.activeCampaignName || "Campagne";
        const sessionNum = activeSession.number || 1;
        const sessionDate = activeSession.date 
          ? new Date(activeSession.date).toLocaleDateString('fr-FR') 
          : "Date inconnue";

        // Si c'est la session de démo, on le laisse paraître un peu mais proprement
        if (activeSession.id === 's-1' && !campaign) {
            return `Session de Démonstration (#${sessionNum})`;
        }

        return `${campaignName} • Session ${sessionNum} • ${sessionDate}`;
    }, [activeSession, campaigns]);

    // Filtrer les PJ présents dans la session (détection des IDs de personnages OU de leurs joueurs parents)
    const presentPcs = useMemo(() => {
        if (!activeSession) return [];
        
        return players.reduce<(import('../../modules/session/store/types').PlayerCharacter & { playerName: string })[]>((acc, player) => {
            const isPlayerInSession = activeSession.sessionEntityIds.includes(player.id);
            
            const playerSessionChars = player.characters
                .filter(char => isPlayerInSession || activeSession.sessionEntityIds.includes(char.id))
                .map(char => ({ ...char, playerName: player.realName }));
            
            return [...acc, ...playerSessionChars];
        }, []);
    }, [activeSession, players]);

    // Gestion des transitions d'étapes (Onboarding & Session Guard)
    useEffect(() => {
        if (!activeSession) {
            if (step !== 'SCANNING') {
                // Utilisation d'un micro-task pour éviter le warning de render en cascade
                queueMicrotask(() => setStep('SCANNING'));
            }
            return;
        }

        if (step === 'SCANNING') {
            const timer = setTimeout(() => setStep('SELECTION'), 2000);
            return () => clearTimeout(timer);
        }
    }, [activeSession, step]);

    const handleSelectCharacter = (char: { id: string; name: string; playerName: string }) => {
        setSelectedCharId(char.id);
        setStep('SYNCING');
        
        // Simulation de scan biométrique
        setTimeout(() => {
            setPseudo(char.name);
            setPlayerName(char.playerName); // On stocke aussi le nom du joueur
            setCharacterId(char.id);
            completeOnboarding();
        }, 2500);
    };

    // --- RENDER: SCANNING (No Session) ---
    if (step === 'SCANNING' || !activeSession) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 p-6 overflow-hidden">
                <div className="relative mb-12">
                    {/* Radar Circles */}
                    <div className="absolute inset-0 border-2 border-gm-cyan/20 rounded-full animate-ping duration-[3000ms]" />
                    <div className="absolute inset-0 border-2 border-gm-cyan/10 rounded-full animate-ping duration-[5000ms] delay-700" />
                    
                    <div className="relative w-48 h-48 bg-gm-cyan/5 rounded-full flex items-center justify-center border border-gm-cyan/20 backdrop-blur-sm">
                        <Radar className="text-gm-cyan animate-pulse" size={64} strokeWidth={1} />
                        
                        {/* Scanning Sweep */}
                        <div className="absolute inset-0 border-t-2 border-gm-cyan/60 rounded-full animate-spin duration-[4000ms] pointer-events-none" />
                    </div>
                </div>

                <div className="text-center max-w-sm">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-4 animate-pulse">
                        Saisie du Signal...
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-gm-cyan/60 mb-8">
                        <div className="w-2 h-2 bg-gm-cyan rounded-full animate-bounce" />
                        <span className="text-xs font-black uppercase tracking-widest">Recherche de session active</span>
                    </div>
                    
                    <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl flex items-start gap-4 text-left">
                        <WifiOff className="text-slate-500 shrink-0" size={20} />
                        <div>
                            <p className="text-slate-400 text-xs font-bold leading-relaxed lowercase">
                                <span className="text-white uppercase">Note au joueur :</span> le Hub est actuellement en veille. Demandez à votre Maître de Jeu de lancer une session depuis le cockpit GM-OS.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: SYNCING (Biometric Scan) ---
    if (step === 'SYNCING') {
        const char = presentPcs.find(c => c.id === selectedCharId);
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 p-6">
                <div className="relative w-64 h-64 mb-12">
                    {/* Character Frame */}
                    <div className="absolute inset-0 border-2 border-gm-cyan rounded-[3rem] overflow-hidden">
                        {char?.portraitUrl ? (
                            <img src={char.portraitUrl} alt="" className="w-full h-full object-cover grayscale opacity-50" />
                        ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                <User className="text-slate-700" size={80} />
                            </div>
                        )}
                        
                        {/* Scan Line */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gm-cyan to-transparent h-12 w-full animate-scan opacity-80" />
                        <div className="absolute inset-0 bg-gm-cyan/10 animate-pulse" />
                    </div>
                    
                    {/* Corner Brackets */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-gm-cyan rounded-tl-xl" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-gm-cyan rounded-tr-xl" />
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-gm-cyan rounded-bl-xl" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-gm-cyan rounded-br-xl" />
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <Fingerprint className="text-gm-cyan animate-pulse" size={32} />
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Synchronisation</h2>
                    </div>
                    <p className="text-gm-cyan font-mono text-sm tracking-[0.3em] uppercase opacity-60">
                        {char?.name} — Protocol V5.0
                    </p>
                </div>

                <style>{`
                    @keyframes scan {
                        0% { transform: translateY(-100%); }
                        100% { transform: translateY(500%); }
                    }
                    .animate-scan {
                        animation: scan 2s linear infinite;
                    }
                `}</style>
            </div>
        );
    }

    // --- RENDER: SELECTION (Character Grid) ---
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center bg-slate-950/95 backdrop-blur-2xl p-6 overflow-y-auto">
            {/* Top Bar for Reset/Logout */}
            <div className="absolute top-8 left-8 z-50">
                <button 
                    onClick={resetIdentity}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/10 rounded-full text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-red-400 hover:border-red-500/30 transition-all group"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/40 group-hover:bg-red-500 group-hover:animate-pulse" />
                    Quitter la session
                </button>
            </div>

            <div className="w-full max-w-5xl mt-12 mb-12 relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-6xl font-black text-white tracking-tightest uppercase mb-4">
                        Qui es-tu ?
                    </h1>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-[1px] w-12 bg-gm-cyan/40" />
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">
                                Agent de la Session
                            </span>
                            <span className="text-sm font-medium text-cyan-400/90 text-center max-w-[280px] leading-tight px-4" title={sessionDisplayName}>
                                {sessionDisplayName}
                            </span>
                        </div>
                        <div className="h-[1px] w-12 bg-gm-cyan/40" />
                    </div>
                </div>

                {presentPcs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {presentPcs.map((char) => (
                            <button
                                key={char.id}
                                onClick={() => handleSelectCharacter(char)}
                                className="group relative flex flex-col bg-slate-900/50 border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-gm-cyan/50 hover:bg-slate-900 transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(6,182,212,0.3)] active:scale-95"
                            >
                                {/* Character Backdrop Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gm-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                {/* Player Name Badge (Top Right) */}
                                <div className="absolute top-4 right-4 z-10">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-gm-cyan/40 uppercase tracking-widest mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Joueur</span>
                                        <span className="px-3 py-1.5 bg-gm-cyan text-slate-950 text-[10px] font-black uppercase tracking-[0.1em] rounded-lg shadow-lg group-hover:scale-110 transition-all duration-300">
                                            {char.playerName}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950 relative">
                                    {char.portraitUrl ? (
                                        <img 
                                            src={char.portraitUrl} 
                                            alt={char.name} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="text-slate-800" size={64} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                                </div>

                                <div className="p-8 text-left relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="px-3 py-1 bg-gm-cyan/10 border border-gm-cyan/20 text-gm-cyan text-[10px] font-black uppercase tracking-widest rounded-full">
                                            Connectable
                                        </span>
                                        <Shield size={16} className="text-slate-600 group-hover:text-gm-cyan transition-colors" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 select-none">
                                        {char.name}
                                    </h3>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest select-none leading-relaxed mt-2">
                                        {char.classRace || "Héros d'Eldoria"}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 bg-slate-900/30 border-2 border-dashed border-white/5 rounded-[3rem]">
                        <AlertCircle className="text-slate-700 mb-6" size={48} />
                        <h3 className="text-xl font-black text-slate-500 uppercase tracking-tighter mb-2">Aucun PJ détecté</h3>
                        <p className="text-slate-600 text-xs text-center max-w-xs uppercase leading-relaxed font-bold">
                            Le Maître de Jeu doit ajouter vos personnages à la session pour qu'ils apparaissent ici.
                        </p>
                    </div>
                )}
            </div>
            
            <div className="mt-auto pb-8 text-slate-700 font-bold text-[10px] uppercase tracking-[0.2em]">
                GM-OS V5 • Tablet HUB Client • nexus_bridge_initialized
            </div>
        </div>
    );
};

export default LobbyOnboarding;
