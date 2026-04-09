import React, { useState } from 'react';
import { X, Power, Globe, Shield, Info, Terminal, MonitorPlay, Zap, Settings, Tablet, BookOpen, FolderOpen, CheckCircle2, Brain } from 'lucide-react';
import { flushApplication } from '../utils/appUtils';
import { useSessionStore, THEME_PALETTES } from '../store/useSessionStore';
import type { ThemeID } from '../store/useSessionStore';
import { useHardwareStore } from '../stores/useHardwareStore';
import AISettings from '../modules/ai/components/AISettings';
import { TacticalTaxonomyEditor } from '../modules/tactical-ai/components/TacticalTaxonomyEditor';
import { useTacticalAIStore } from '../modules/tactical-ai/useTacticalAIStore';
import { mediaCleanupService } from '../services/MediaCleanupService';
import { gmToast } from '../stores/useToastStore';
import { Trash2, RefreshCw } from 'lucide-react';
// import { useBackupSync } from '../hooks/useBackupSync';
import LobbyMonitor from './settings/LobbyMonitor';
import { useObsidianStore } from '../modules/session/useObsidianStore';

/* GitHub Sync Section Removed at user request */

interface GlobalSettingsModalProps {
    onClose: () => void;
}

type TabID = 'system' | 'ai' | 'tactical' | 'remote';

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<TabID>('system');
    const [connectionInfo, setConnectionInfo] = useState<{ip: string, port: number} | null>(null);
    const { theme, setTheme, themeColor, setThemeColor } = useSessionStore();
    const { 
        audioDevices, fetchAudioDevices, audioAliases, setAudioAlias,
        displays, fetchDisplays, displayAliases, setDisplayAlias 
    } = useHardwareStore();
    
    // Tactical AI Store Integration (Reactive)
    const { settings: tacticalSettings, updateSettings: updateTacticalSettings } = useTacticalAIStore();
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<{deletedCount: number, savedBytes: number} | null>(null);
    
    // Obsidian Store Integration
    const { vaultPath, setVaultPath, browseVaultPath, fetchNotes, isLoading: isObsidianLoading, error: obsidianError } = useObsidianStore();
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
    
    const isBridgeActive = !!window.appBridge;

    React.useEffect(() => {
        fetchAudioDevices();
        fetchDisplays();

        const updateInfo = async () => {
            console.log("[Remote] Requesting connection info...");
            if (window.appBridge?.remote?.getConnectionInfo) {
                const info = await window.appBridge.remote.getConnectionInfo();
                console.log("[Remote] Received info:", info);
                setConnectionInfo(info);
            } else {
                console.error("[Remote] Bridge function not found!");
            }
        };

        updateInfo();
    }, [fetchAudioDevices, fetchDisplays]);

    const remoteUrl = connectionInfo?.ip ? `http://${connectionInfo.ip}:5173/?window=remote` : '';
    const tabletUrl = connectionInfo?.ip ? `http://${connectionInfo.ip}:5173/?window=tablet` : '';
    
    // Use a direct qrcode API that is very reliable
    const qrCodeUrl = remoteUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(remoteUrl)}` : '';
    const tabletQrCodeUrl = tabletUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(tabletUrl)}` : '';

    return (
        <div className="flex flex-col h-full bg-app-bg text-app-text/80">
            {/* Main Header */}
            <div className="p-6 border-b border-app-border/10 flex items-center justify-between bg-app-surface/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-glow-accent/10">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-app-text">Paramètres OS</h2>
                        <p className="text-[10px] text-app-text/60 font-bold uppercase tracking-widest">GM-OS v5.1.0 (System Forge Edition)</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-app-surface rounded-full transition-colors text-app-text/40 hover:text-app-text"
                    title="Fermer les paramètres"
                    aria-label="Fermer les paramètres"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 border-r border-app-border/10 bg-app-surface/20 flex flex-col p-4 gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-app-text/30 px-3 mb-2">Catégories</p>
                    <button 
                        onClick={() => setActiveTab('system')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'system' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-app-surface/40 hover:text-app-text border border-transparent'}`}
                    >
                        <Globe size={18} />
                        Système
                    </button>
                    <button 
                        onClick={() => setActiveTab('tactical')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'tactical' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-app-surface/40 hover:text-app-text border border-transparent'}`}
                    >
                        <Zap size={18} />
                        Tactique
                    </button>
                    <button 
                        onClick={() => setActiveTab('ai')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'ai' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-app-surface/40 hover:text-app-text border border-transparent'}`}
                    >
                        <Brain size={18} />
                        IA
                    </button>
                    <button 
                        onClick={() => setActiveTab('remote')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'remote' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-app-surface/40 hover:text-app-text border border-transparent'}`}
                    >
                        <Tablet size={18} />
                        Télécommande
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {activeTab === 'system' && (
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* System Status Section */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 px-1 border-l-2 border-accent/30 pl-3">État du Système</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${isBridgeActive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                        <div className={`p-2 rounded-lg ${isBridgeActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            <Shield size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Bridge Electron/Tauri</p>
                                            <p className={`text-sm font-black ${isBridgeActive ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {isBridgeActive ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-app-border/20 bg-app-surface/20 flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                            <Terminal size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Environnement</p>
                                            <p className="text-sm font-black text-blue-400">PRODUCTION-DAWN</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Appearance & Customization Section */}
                            <section className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 px-1 border-l-2 border-accent/30 pl-3">Personnalisation (Look & Feel)</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Theme Selection */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Choix du Thème Global</p>
                                        <div className="flex flex-col gap-2">
                                            {(['cyberpunk', 'medieval', 'modern', 'claire'] as ThemeID[]).map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setTheme(t)}
                                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${theme === t ? 'bg-accent/10 border-accent shadow-glow-accent/20' : 'bg-app-surface/20 border-app-border/20 hover:border-app-border/40'}`}
                                                    title={`Sélectionner le thème ${t}`}
                                                    aria-label={`Sélectionner le thème ${t}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                        className="w-8 h-8 rounded-lg bg-app-bg border border-app-border/50 flex items-center justify-center text-accent" 
                                                    >
                                                        <Zap size={18} fill={theme === t ? "currentColor" : "none"} />
                                                    </div>
                                                        <span className="text-sm font-black uppercase tracking-tight text-app-text">{t}</span>
                                                    </div>
                                                    {theme === t && <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Palette Selection */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Palette de l'Accentuation ({theme})</p>
                                        <div className="bg-app-surface/20 border border-app-border/20 rounded-xl p-6 h-[184px] flex flex-col items-center justify-center space-y-6">
                                            <div className="flex gap-3">
                                                {(THEME_PALETTES[theme]?.palettes || []).map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setThemeColor(color)}
                                                        className={`group relative w-10 h-10 rounded-full transition-all duration-300 ${themeColor === color ? `ring-4 ${theme === 'claire' ? 'ring-app-text/20' : 'ring-white'} ring-offset-4 ring-offset-app-bg scale-110 shadow-lg` : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                                                        style={{ backgroundColor: color }}
                                                    >
                                                        {themeColor === color && (
                                                            <div className={`absolute -top-2 -right-2 ${theme === 'claire' ? 'bg-app-text text-app-bg' : 'bg-white text-app-bg'} rounded-full p-0.5`}>
                                                                < Zap size={10} fill="currentColor" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="text-center">
                                                <p 
                                                    className="text-sm font-mono font-bold text-accent" 
                                                >
                                                    {themeColor}
                                                </p>
                                                <p className="text-[9px] uppercase tracking-[0.2em] text-app-text/40 mt-1">Échantillon ACTIF</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Hardware & Routing Section */}
                            <section className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 px-1 border-l-2 border-gm-gold/50 pl-3 italic">Hardware & Routing (Alias)</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Audio Outputs */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sorties Audio</p>
                                            <button onClick={() => fetchAudioDevices()} className="text-[10px] text-accent font-bold uppercase transition-opacity hover:opacity-70">Actualiser</button>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {audioDevices.length === 0 && (
                                                <div className="p-4 rounded-xl border border-app-border/10 bg-app-surface/10 text-center">
                                                    <p className="text-xs text-app-text/40">Aucune sortie détectée</p>
                                                </div>
                                            )}
                                            {audioDevices.map((device) => (
                                                <div key={device.deviceId} className="p-4 rounded-xl border border-app-border/20 bg-app-surface/20 flex flex-col gap-2 transition-all hover:bg-app-surface/40">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-mono font-bold text-app-text/40 truncate flex-1 uppercase tracking-tighter">
                                                            {device.label}
                                                        </p>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow-emerald/30 ml-2" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={audioAliases[device.deviceId] || ''}
                                                        onChange={(e) => setAudioAlias(device.deviceId, e.target.value)}
                                                        placeholder="Assigner un alias (ex: Enceintes MJ)"
                                                        className="bg-app-bg/50 border border-app-border/40 rounded-lg px-3 py-2 text-xs font-bold text-app-text focus:border-accent/50 outline-none transition-all placeholder:text-app-text/20"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Monitor Displays */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Moniteurs & Écrans</p>
                                            <button onClick={() => fetchDisplays()} className="text-[10px] text-accent font-bold uppercase transition-opacity hover:opacity-70">Actualiser</button>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {displays.length === 0 && (
                                                <div className="p-4 rounded-xl border border-app-border/10 bg-app-surface/10 text-center">
                                                    <p className="text-xs text-app-text/40">Aucun écran détecté via Bridge</p>
                                                </div>
                                            )}
                                            {displays.map((display) => (
                                                <div key={display.id} className="p-4 rounded-xl border border-app-border/20 bg-app-surface/20 flex flex-col gap-2 transition-all hover:bg-app-surface/40">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-mono font-bold text-app-text/40 truncate flex-1 uppercase tracking-tighter">
                                                            {display.label} ({display.bounds.width}x{display.bounds.height})
                                                        </p>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-glow-blue/30 ml-2" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={displayAliases[display.id] || ''}
                                                        onChange={(e) => setDisplayAlias(display.id, e.target.value)}
                                                        placeholder="Assigner un alias (ex: TV Salon)"
                                                        className="bg-app-bg/50 border border-app-border/40 rounded-lg px-3 py-2 text-xs font-bold text-app-text focus:border-accent/50 outline-none transition-all placeholder:text-app-text/20"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>


                            {/* Obsidian Integration Section */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 border-l-2 border-accent/30 pl-3 italic">Intégration Obsidian (Second Brain)</h3>
                                    {testStatus === 'success' && (
                                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-black uppercase animate-pulse">
                                            <CheckCircle2 size={12} /> Connecté
                                        </span>
                                    )}
                                </div>
                                <div className="bg-app-surface/20 border border-app-border/20 rounded-[2rem] p-8 space-y-6">
                                    <div className="flex items-start gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
                                            <BookOpen size={24} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-sm font-black uppercase tracking-tight text-app-text">Chemin du Coffre (Vault Path)</h4>
                                            <p className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest leading-relaxed">
                                                Le chemin absolu vers votre dossier Obsidian. GM-OS lira vos notes pour alimenter le Codex et l'Oracle.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1 relative group">
                                            <input 
                                                type="text" 
                                                value={vaultPath}
                                                onChange={(e) => {
                                                    setVaultPath(e.target.value);
                                                    setTestStatus('idle');
                                                }}
                                                placeholder="C:\Users\VotreNom\Documents\MonCoffre"
                                                className="w-full bg-app-bg/50 border border-app-border/30 rounded-xl px-4 py-3 text-xs font-bold text-app-text focus:border-purple-500/50 outline-none transition-all placeholder:text-app-text/10 group-hover:border-app-border/60"
                                            />
                                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Settings size={14} className="text-app-text/20 animate-spin-slow" />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                await browseVaultPath();
                                                setTestStatus('idle');
                                            }}
                                            className="flex items-center gap-2 bg-app-surface border border-app-border/30 px-4 rounded-xl text-app-text/60 hover:text-purple-400 hover:border-purple-500/30 transition-all active:scale-95"
                                            title="Parcourir les dossiers"
                                        >
                                            <FolderOpen size={18} />
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                setTestStatus('idle');
                                                await fetchNotes();
                                                const currentError = useObsidianStore.getState().error;
                                                if (!currentError) {
                                                    setTestStatus('success');
                                                    gmToast("Connexion au coffre établie avec succès", "success");
                                                } else {
                                                    setTestStatus('error');
                                                    gmToast(`Erreur : ${currentError}`, "error");
                                                }
                                            }}
                                            disabled={isObsidianLoading || !vaultPath}
                                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                testStatus === 'success' 
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                                                : testStatus === 'error'
                                                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                                                : 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white'
                                            } disabled:opacity-30`}
                                        >
                                            {isObsidianLoading ? 'TEST...' : 'TESTER'}
                                        </button>
                                    </div>

                                    {obsidianError && (
                                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight italic">
                                                Attention : {obsidianError}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Maintenance Section */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 px-1 border-l-2 border-accent/30 pl-3">Maintenance & Optimisation</h3>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Media Cleanup */}
                                    <div className="p-6 rounded-2xl bg-app-surface/20 border border-app-border/10 flex items-center justify-between">
                                        <div className="flex-1">
                                            <h4 className="text-app-text font-bold text-sm mb-1">Nettoyage de l'Index Médias</h4>
                                            <p className="text-xs text-app-text/40 max-w-md">Supprime les fichiers orphelins pour libérer de l'espace.</p>
                                            {cleanupResult && (
                                                <p className="text-[10px] text-accent font-black uppercase mt-2">
                                                    Dernier : {cleanupResult.deletedCount} items ({(cleanupResult.savedBytes / 1024 / 1024).toFixed(2)} Mo libérés)
                                                </p>
                                            )}
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                setIsCleaning(true);
                                                try {
                                                    const res = await mediaCleanupService.performCleanup();
                                                    setCleanupResult(res);
                                                    gmToast(`${res.deletedCount} médias orphelins supprimés.`, "success");
                                                } catch {
                                                    gmToast("Erreur lors du nettoyage", "error");
                                                } finally {
                                                    setIsCleaning(false);
                                                }
                                            }}
                                            disabled={isCleaning}
                                            className="flex items-center gap-2 bg-accent/10 hover:bg-accent text-accent hover:text-app-bg border border-accent/30 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                        >
                                            {isCleaning ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                            {isCleaning ? 'NETTOYAGE...' : 'NETTOYER'}
                                        </button>
                                    </div>

                                    {/* GitHub Sync (DISABLED) */}
                                    {/* <GitHubSyncSection /> */}
                                </div>
                            </section>

                            {/* Dangerous Actions Section */}
                            <section className="space-y-4 pt-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500 px-1 border-l-2 border-red-500/30 pl-3">Zone de Danger</h3>
                                <div className={`${theme === 'claire' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-500/5 border-red-500/10'} rounded-2xl p-6 flex items-center justify-between`}>
                                    <div className="flex-1">
                                        <h4 className="text-app-text font-bold text-sm mb-1">Réinitialisation d'Usine</h4>
                                        <p className="text-xs text-app-text/40 max-w-md">Efface toutes les données locales, les campagnes, les fichiers et les réglages de thème. Cette action est irréversible.</p>
                                    </div>
                                    <button 
                                        onClick={flushApplication}
                                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-glow-red/0 hover:shadow-glow-red/20 active:scale-95"
                                    >
                                        <Power size={18} />
                                        RESET TOTAL
                                    </button>
                                </div>
                            </section>

                            {/* Information Section */}
                            <section className="pt-8 flex flex-col items-center gap-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-app-border to-transparent" />
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-app-text/40">Designed & Powered by</p>
                                    <h2 className="text-xl font-black text-app-text italic tracking-tighter">GM-OS <span className="text-accent">PROJECT</span></h2>
                                </div>
                                <div className="flex gap-4">
                                     <div className="p-2 bg-app-surface rounded-lg border border-app-border"><Info size={16} /></div>
                                     <div className="p-2 bg-app-surface rounded-lg border border-app-border"><MonitorPlay size={16} /></div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                            <section className="space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-glow-accent/10">
                                        <Brain size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-app-text">Paramètres IA</h3>
                                        <p className="text-[10px] text-app-text/60 font-black uppercase tracking-widest mt-0.5">Configuration des modèles et des GEMS assistés</p>
                                    </div>
                                </div>
                                
                                <div className="bg-app-surface/20 border border-app-border/20 rounded-[2rem] p-8 shadow-inner-white/5">
                                    <AISettings />
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'tactical' && (
                        <div className="flex-1 overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">
                            {/* Master Toggle for Tactical AI */}
                            <div className="p-6 border-b border-app-border/10 bg-app-surface/20">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-app-bg/40 border border-app-border/20">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${tacticalSettings.isEnabled ? 'bg-accent/20 text-accent shadow-glow-accent/10' : 'bg-app-surface text-app-text/20'}`}>
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase tracking-tight text-app-text">Cortex Tactique (Master Switch)</h4>
                                            <p className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest">Activer ou désactiver l'IA tactique globalement</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updateTacticalSettings({ isEnabled: !tacticalSettings.isEnabled })}
                                        className={`relative w-14 h-7 rounded-full transition-all duration-300 ${tacticalSettings.isEnabled ? 'bg-accent shadow-glow-accent/20' : 'bg-app-surface border border-app-border/50'}`}
                                        title={tacticalSettings.isEnabled ? "Désactiver l'IA Tactique" : "Activer l'IA Tactique"}
                                        aria-label={tacticalSettings.isEnabled ? "Désactiver l'IA Tactique" : "Activer l'IA Tactique"}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-md ${tacticalSettings.isEnabled ? 'left-8' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto">
                                <TacticalTaxonomyEditor />
                            </div>
                        </div>
                    )}

                    {activeTab === 'remote' && (
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Section 1: GM Remote Control */}
                                <section className="flex flex-col gap-6 bg-app-surface/20 border border-app-border/20 rounded-[2.5rem] p-8">
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-glow-accent/10">
                                            <Tablet size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-app-text">GM Remote Control</h3>
                                            <p className="text-[10px] text-app-text/60 max-w-[240px] mt-1 uppercase tracking-widest font-black">Pilotez votre session via smartphone</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-6">
                                        <div className="relative p-2 bg-white rounded-[1.5rem] shadow-2xl group transition-transform hover:scale-105">
                                            {qrCodeUrl ? (
                                                <img 
                                                    src={qrCodeUrl} 
                                                    alt="Remote QR Code" 
                                                    className="w-40 h-40 mix-blend-multiply" 
                                                />
                                            ) : (
                                                <div className="w-40 h-40 flex flex-col items-center justify-center gap-2">
                                                    <div className="w-8 h-8 border-3 border-accent border-t-transparent animate-spin rounded-full" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 border-2 border-accent/20 rounded-[1.5rem] pointer-events-none" />
                                        </div>
                                        <p className="text-[9px] font-bold text-app-text/30 uppercase tracking-widest italic select-all cursor-help">{remoteUrl || 'URL en attente...'}</p>
                                    </div>
                                    
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-app-text/30 uppercase tracking-widest">Connexion Directe</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-emerald" />
                                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Actif (3001)</span>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 2: Tablet Hub (Second Screen) */}
                                <section className="flex flex-col gap-6 bg-accent/5 border border-accent/10 rounded-[2.5rem] p-8">
                                    <div className="flex flex-col items-center text-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-glow-blue/10">
                                            <MonitorPlay size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-app-text">Tablet Hub</h3>
                                            <p className="text-[10px] text-app-text/60 max-w-[240px] mt-1 uppercase tracking-widest font-black">Diffusion déportée (Stats & Tensions)</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-6">
                                        <div className="relative p-2 bg-white rounded-[1.5rem] shadow-2xl group transition-transform hover:scale-105">
                                            {tabletQrCodeUrl ? (
                                                <img 
                                                    src={tabletQrCodeUrl} 
                                                    alt="Tablet Hub QR Code" 
                                                    className="w-40 h-40 mix-blend-multiply" 
                                                />
                                            ) : (
                                                <div className="w-40 h-40 flex flex-col items-center justify-center gap-2">
                                                    <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent animate-spin rounded-full" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 border-2 border-blue-400/20 rounded-[1.5rem] pointer-events-none" />
                                        </div>
                                        <p className="text-[9px] font-bold text-app-text/30 uppercase tracking-widest italic select-all cursor-help">{tabletUrl || 'URL en attente...'}</p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-app-text/30 uppercase tracking-widest">Streaming WebSocket</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-glow-blue" />
                                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Actif</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <LobbyMonitor />

                            <section className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-app-text/40 px-1 border-l-2 border-accent/30 pl-3">Fonctions Disponibles</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: 'Soundboard FX', desc: 'Déclenchez les sons' },
                                        { label: 'Dice Roller', desc: 'Lancez les dés' },
                                        { label: 'Scene Master', desc: 'Changez les ambiances' }
                                    ].map(f => (
                                        <div key={f.label} className="p-4 rounded-2xl bg-app-surface/20 border border-app-border/20 text-center space-y-1">
                                            <p className="text-[10px] font-black text-app-text/80 uppercase">{f.label}</p>
                                            <p className="text-[9px] text-app-text/40">{f.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalSettingsModal;
