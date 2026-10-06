import React, { useState, useEffect, useMemo, memo } from 'react';
import { useClientStore } from '../../stores/useClientStore';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { Radar, User, Shield, Fingerprint, WifiOff, AlertCircle } from 'lucide-react';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import { Bouton, EnTeteDeModule, Etiquette, Panneau, GabaritDeModule } from '../socle';

type OnboardingStep = 'SCANNING' | 'SELECTION' | 'SYNCING';

interface LobbyOnboardingProps {
    latency?: number | null;
}

const LobbyOnboarding: React.FC<LobbyOnboardingProps> = memo(({ latency: propLatency }) => {
    const { deviceId, setPseudo, setPlayerName, setCharacterId, completeOnboarding, logout, lastError, setLastError } = useClientStore();
    const { sessions, activeCampaignId, campaigns, activeCampaignWallpaper, activeCampaignName } = useSessionOSStore();
    const players = useSessionOSStore(state => state.players);
    const characterLocks = useSessionOSStore(state => state.connectedCharacters);
    
    // Prioritize prop latency (passed from TabletHub)
    const latency = propLatency ?? null;
    
    const [step, setStep] = useState<OnboardingStep>('SCANNING');
    const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const resolvedWallpaper = useMediaUrl(activeCampaignWallpaper || undefined);
    
    useEffect(() => {
        if (activeCampaignWallpaper) {
            console.log(`[LobbyOnboarding] Wallpaper State:`, {
                id: activeCampaignWallpaper,
                resolved: resolvedWallpaper
            });
        }
    }, [activeCampaignWallpaper, resolvedWallpaper]);

    // Trouver la session active
    const activeSession = useMemo(() => {
        if (!sessions || sessions.length === 0) return null;
        
        let filteredSessions = sessions;
        if (activeCampaignId) {
            filteredSessions = sessions.filter(s => String(s.campaignId) === String(activeCampaignId));
        }
        
        // 1. On cherche d'abord une session réellement active dans la campagne courante (hors démo)
        const realActiveInCampaign = filteredSessions.find(s => s.status === 'active' && s.id !== 's-1');
        if (realActiveInCampaign) return realActiveInCampaign;

        // 2. Si rien trouvé, on cherche n'importe quelle session active (hors démo) dans TOUTES les sessions
        // Cela sauve le Hub si le GM a changé de campagne active tout en laissant une session tourner ailleurs
        const realActiveAnywhere = sessions.find(s => s.status === 'active' && s.id !== 's-1');
        if (realActiveAnywhere) {
            console.warn('[LobbyOnboarding] Found active session outside current campaign:', realActiveAnywhere.campaignId);
            return realActiveAnywhere;
        }

        // 3. Fallback ultime sur la session de démo s-1 si elle est active (dans la campagne ou ailleurs)
        return sessions.find(s => s.status === 'active' && s.id === 's-1') || null;
    }, [sessions, activeCampaignId]);

    // Formater le nom de la session de manière lisible
    const sessionDisplayName = useMemo(() => {
        if (!activeSession) return "Aucune session active";
        
        const state = useSessionOSStore.getState();
        const campaign = campaigns.find(c => String(c.id) === String(activeSession.campaignId)) || 
                         campaigns.find(c => String(c.id) === String(activeCampaignId));
        const campaignName = campaign?.name || activeCampaignName || state.activeCampaignName || "Campagne";
        
        const sessionNum = activeSession.id === 's-1' ? 'Démo' : (activeSession.number ?? '1');
        
        // Formater la date en DD/MM/YYYY si possible
        let sessionDate = new Date().toLocaleDateString('fr-FR');
        if (activeSession.date) {
            try {
                // Tenter de nettoyer ou de formater activeSession.date si c'est YYYY-MM-DD
                const d = new Date(activeSession.date);
                if (!isNaN(d.getTime())) {
                    sessionDate = d.toLocaleDateString('fr-FR');
                } else {
                    sessionDate = activeSession.date; // Garder la string telle quelle
                }
            } catch {
                // Ignore
            }
        }
        
        return `${campaignName} • Session ${sessionNum} • ${sessionDate}`;
    }, [activeSession, campaigns, activeCampaignId, activeCampaignName]);

    // Filtrer les PJ présents dans la session (détection des IDs de personnages OU de leurs joueurs parents)
    const presentPcs = useMemo(() => {
        if (!activeSession) return [];
        
        const sessionIds = (activeSession.sessionEntityIds || []).map(id => String(id));
        
        console.log('[Lobby] Calculating presentPcs. Session IDs:', sessionIds);
        
        const result = players.reduce<(import('../../modules/session/store/types').PlayerCharacter & { playerName: string })[]>((acc, player) => {
            const isPlayerInSession = sessionIds.includes(String(player.id));
            
            const playerSessionChars = (player.characters || [])
                .filter(char => isPlayerInSession || sessionIds.includes(String(char.id)))
                .map(char => ({ ...char, playerName: player.realName }));
            
            return [...acc, ...playerSessionChars];
        }, []);

        console.log('[Lobby] Present PCs count:', result.length);
        
        // Filter out already connected characters to prevent multi-selection
        // BUT allow reclaiming if it's the SAME deviceId (reconnection)
        const filtered = result.filter(pc => {
            const lockOwnerId = characterLocks[String(pc.id)];
            return !lockOwnerId || lockOwnerId === deviceId;
        });
        
        console.log('[Lobby] Available PCs count:', filtered.length, 'Locks:', characterLocks);
        
        return filtered;
    }, [activeSession, players, characterLocks, deviceId]);

    // Gestion des transitions d'étapes (Onboarding & Session Guard)
    useEffect(() => {
        if (!activeSession) {
            if (step !== 'SCANNING') {
                queueMicrotask(() => setStep('SCANNING'));
            }
            return;
        }

        console.log('[LobbyOnboarding] Active session detected:', activeSession.id, 'Status:', activeSession.status);

        if (step === 'SCANNING') {
            const timer = setTimeout(() => setStep('SELECTION'), 1500);
            return () => clearTimeout(timer);
        }
    }, [activeSession, step]);

    const haptic = (pattern: number | number[] = 50) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    };

    const handleSelectCharacter = (char: { id: string; name: string; playerName: string }) => {
        console.log('[Lobby] Character selected, locking immediately:', char.id);
        haptic([40, 30, 40]);
        
        setLastError(null); // Clear any previous error
        setSelectedCharId(char.id);
        setStep('SYNCING');
        
        // Verrouillage immédiat pour re-déclencher l'enregistrement WebSocket
        // et notifier le MJ que ce personnage est pris avant la fin de l'animation.
        setPseudo(char.name);
        setPlayerName(char.playerName); 
        setCharacterId(char.id);
        
        // Simulation de scan biométrique
        setTimeout(() => {
            // Uniquement si aucune erreur n'est apparue entre temps (collision serveur)
            if (!useClientStore.getState().lastError) {
                completeOnboarding();
            }
        }, 2500);
    };

    const getLatencyColor = (ms: number | null) => {
        if (ms === null) return 'text-app-muted';
        if (ms < 50) return 'text-etat-succes';
        if (ms < 150) return 'text-etat-alerte';
        return 'text-etat-danger';
    };

    const getLatencyLabel = (ms: number | null) => {
        if (ms === null) return '--';
        return `${ms}ms`;
    };

    // DEBUG PANEL - Visible only in dev or via triple click (mocked here as always for debug)
    const renderDebugOverlay = () => (
        <div className="fixed bottom-4 left-4 z-[9999] bg-app-bg/80 backdrop-blur-md border border-app-border/40 p-4 rounded-xl text-ui-10 font-mono text-app-text/60 max-w-xs shadow-2xl pointer-events-none select-none">
            <h5 className="text-accent font-bold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                HUB SYNC DEBUG
            </h5>
            <div className="space-y-1">
                <p><span className="text-app-text/40">Campaign ID:</span> {activeCampaignId || 'NONE'}</p>
                <p><span className="text-app-text/40">Campaign Name:</span> {activeCampaignName || 'NONE'}</p>
                <p><span className="text-app-text/40">Sessions Count:</span> {sessions?.length || 0}</p>
                <div className="mt-2 pt-2 border-t border-app-text/5">
                    <p className="text-app-text/80 font-bold mb-1">Active Session:</p>
                    {activeSession ? (
                        <div className="text-etat-succes">
                            <p>ID: {activeSession.id}</p>
                            <p>CID: {activeSession.campaignId}</p>
                            <p>Num: #{activeSession.number}</p>
                        </div>
                    ) : (
                        <p className="text-etat-danger italic">None Detected</p>
                    )}
                </div>
            </div>
        </div>
    );

    // --- RENDER: SCANNING (No Session) ---
    if (step === 'SCANNING' || !activeSession) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-app-bg p-6 overflow-hidden">
                {renderDebugOverlay()}
                <div className="relative mb-12">
                    {/* Radar Circles */}
                    <div className="absolute inset-0 border-2 border-accent/20 rounded-full animate-ping duration-[3000ms]" />
                    <div className="absolute inset-0 border-2 border-accent/10 rounded-full animate-ping duration-[5000ms] delay-700" />
                    
                    <div className="relative w-48 h-48 bg-accent/5 rounded-full flex items-center justify-center border border-accent/20 backdrop-blur-sm">
                        <Radar className="text-accent animate-pulse" size={64} strokeWidth={1} />
                        
                        {/* Scanning Sweep */}
                        <div className="absolute inset-0 border-t-2 border-accent/60 rounded-full animate-spin duration-[4000ms] pointer-events-none" />
                    </div>
                </div>

                <div className="text-center max-w-sm">
                    <h1 className="text-3xl font-black text-app-text tracking-tighter uppercase mb-4 animate-pulse">
                        Saisie du Signal...
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-accent/60 mb-8">
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                        <span className="text-xs font-black uppercase tracking-widest">Recherche de session active</span>
                    </div>
                    
                    <Panneau as="div" habillage="libre" className="p-4 bg-app-surface/50 border border-app-border/10 rounded-2xl flex items-start gap-4 text-left">
                        <WifiOff className="text-app-text/40 shrink-0" size={20} />
                        <div>
                            <p className="text-app-text/60 text-xs font-bold leading-relaxed lowercase">
                                <span className="text-app-text uppercase">Note au joueur :</span> le Hub est actuellement en veille. Demandez à votre Maître de Jeu de lancer une session depuis le cockpit GM-OS.
                            </p>
                        </div>
                    </Panneau>
                </div>
            </div>
        );
    }

    // --- RENDER: ERROR (e.g., Collision) ---
    if (lastError) {
        return (
            <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-etat-danger/20 backdrop-blur-3xl p-6">
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-etat-danger/20 rounded-full blur-3xl animate-pulse" />
                    <div className="relative w-48 h-48 bg-etat-danger/10 rounded-full flex items-center justify-center border-2 border-etat-danger/50">
                        <AlertCircle className="text-etat-danger animate-bounce" size={80} strokeWidth={1.5} />
                    </div>
                </div>

                <div className="text-center max-w-md">
                    <h2 className="text-4xl font-black text-etat-danger uppercase tracking-tightest mb-4">
                        Accès Refusé
                    </h2>
                    <p className="text-app-text/80 text-lg font-bold mb-12 leading-relaxed">
                        {lastError}
                    </p>
                    
                    <Bouton habillage="libre" cibleTactile
                        onClick={() => {
                            setLastError(null);
                            setStep('SELECTION');
                        }}
                        className="px-12 py-5 bg-etat-danger hover:brightness-110 text-app-bg rounded-full text-lg font-black uppercase tracking-widest shadow-glow-rose/40 transition-all active:scale-95"
                    >
                        Choisir un autre signal
                    </Bouton>
                </div>
            </div>
        );
    }

    // --- RENDER: SYNCING (Biometric Scan) ---
    if (step === 'SYNCING') {
        const char = presentPcs.find(c => c.id === selectedCharId);
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-app-bg p-6">
                <div className="relative w-64 h-64 mb-12">
                    {/* Character Frame */}
                    <div className="absolute inset-0 border-2 border-accent rounded-[3rem] overflow-hidden">
                        {char?.portraitUrl ? (
                            <img src={char.portraitUrl} alt="" className="w-full h-full object-cover grayscale opacity-50" />
                        ) : (
                            <div className="w-full h-full bg-app-surface flex items-center justify-center">
                                <User className="text-app-text/20" size={80} />
                            </div>
                        )}
                        
                        {/* Scan Line */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent to-transparent h-12 w-full animate-scan opacity-80" />
                        <div className="absolute inset-0 bg-accent/10 animate-pulse" />
                    </div>
                    
                    {/* Corner Brackets */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-xl" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-xl" />
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-xl" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-xl" />
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <Fingerprint className="text-accent animate-pulse" size={32} />
                        <h2 className="text-4xl font-black text-app-text uppercase tracking-tighter">Synchronisation</h2>
                    </div>
                    <p className="text-accent font-mono text-sm tracking-[0.3em] uppercase opacity-60">
                        {char?.name} — Protocol V6.3.0
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

    // T4 J1 : en-tête et sortie fixes, cartes et pied dans la zone de lecture.
    return (
        <div data-accueil-joueur="" className="fixed inset-0 z-[100] bg-app-bg overflow-hidden">
            {resolvedWallpaper && (
                <img src={resolvedWallpaper} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
            )}
            <GabaritDeModule
                className="relative mx-auto max-w-6xl"
                entete={(
                    <EnTeteDeModule
                        titre="Qui es-tu ?"
                        surtitre="Agent de la Session"
                        etat={<p className="text-[14px] text-accent break-words" title={sessionDisplayName}>{sessionDisplayName}</p>}
                        className="shrink-0"
                    />
                )}
                barreDOutils={showLogoutConfirm ? (
                    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirmation de sortie">
                        <span className="text-[14px] text-app-text">Vraiment ?</span>
                        <Bouton cibleTactile onClick={() => { haptic(10); setShowLogoutConfirm(false); }}>Non</Bouton>
                        <Bouton cibleTactile variante="danger" onClick={() => { haptic([10, 50, 10]); setShowLogoutConfirm(false); logout(); }}>Oui, quitter</Bouton>
                    </div>
                ) : (
                    <Bouton cibleTactile variante="danger" onClick={() => { haptic(10); setShowLogoutConfirm(true); }}>
                        Quitter la session
                    </Bouton>
                )}
            >
                <div className="flex min-h-full flex-col gap-6">
                    {presentPcs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {presentPcs.map(char => (
                                <Panneau as="div" key={char.id} className="flex">
                                    <Bouton
                                        habillage="libre"
                                        cibleTactile
                                        onClick={() => handleSelectCharacter(char)}
                                        className={`flex w-full min-w-0 items-center gap-4 p-4 text-left lg:flex-col lg:items-stretch hover:bg-accent/5 active:bg-accent/10 ${selectedCharId === char.id ? 'ring-2 ring-inset ring-accent' : ''}`}
                                    >
                                        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-app-bg lg:h-auto lg:w-full lg:aspect-[4/3]">
                                            {char.portraitUrl ? (
                                                <img src={char.portraitUrl} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <User aria-hidden="true" className="text-app-muted" size={48} />
                                            )}
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                                            <Etiquette ton="accent" className="max-w-full break-words">{char.playerName}</Etiquette>
                                            <h3 className="font-display text-[18px] font-bold leading-tight text-app-text break-words">{char.name}</h3>
                                            <p className="text-[14px] leading-relaxed text-app-muted break-words">{char.classRace || "Héros d'Eldoria"}</p>
                                            <span className="flex items-center gap-2">
                                                <Etiquette ton="accent">Connectable</Etiquette>
                                                <Shield aria-hidden="true" size={16} className="text-accent" />
                                            </span>
                                        </div>
                                    </Bouton>
                                </Panneau>
                            ))}
                        </div>
                    ) : (
                        <Panneau as="div" vide className="flex flex-col items-center gap-4 p-6 text-center">
                            <AlertCircle aria-hidden="true" className="text-app-muted" size={40} />
                            <h3 className="font-display text-[18px] font-bold text-app-text">Aucun PJ détecté</h3>
                            <p className="max-w-sm text-[14px] leading-relaxed text-app-muted">
                                Le Maître de Jeu doit ajouter vos personnages à la session pour qu'ils apparaissent ici.
                            </p>
                        </Panneau>
                    )}
                    <footer className="mt-auto border-t border-app-border pt-4 text-ui-11 text-app-muted">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`flex items-center gap-2 ${getLatencyColor(latency ?? null)}`}>
                                <span className="h-2 w-2 shrink-0 rounded-full bg-current" />
                                {getLatencyLabel(latency ?? null)}
                            </span>
                            <span className="break-words">GM-OS v{__APP_VERSION__} • nexus_bridge_active</span>
                        </div>
                        <p className="mt-2 font-mono break-all">Device ID: {deviceId?.substring(0, 12)}...</p>
                    </footer>
                </div>
            </GabaritDeModule>
        </div>
    );

});

export default LobbyOnboarding;
