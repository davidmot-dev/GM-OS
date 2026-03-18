import React, { useState } from 'react';
import { X, Power, Globe, Shield, Info, Terminal, MonitorPlay, Zap, Settings, Tablet, RefreshCw } from 'lucide-react';
import { flushApplication } from '../utils/appUtils';
import { useSessionStore, THEME_PALETTES } from '../store/useSessionStore';
import type { ThemeID } from '../store/useSessionStore';
import { useHardwareStore } from '../stores/useHardwareStore';
import AISettings from '../modules/ai/components/AISettings';
import { TacticalTaxonomyEditor } from '../modules/tactical-ai/components/TacticalTaxonomyEditor';
import { useTacticalAIStore } from '../modules/tactical-ai/useTacticalAIStore';

interface GlobalSettingsModalProps {
    onClose: () => void;
}

type TabID = 'system' | 'tactical' | 'remote';

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
    // Use a direct qrcode API that is very reliable
    const qrCodeUrl = remoteUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(remoteUrl)}` : '';

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
                        <p className="text-[10px] text-app-text/60 font-bold uppercase tracking-widest">GM-OS v5.1.0-alpha (System Forge Edition)</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-app-surface rounded-full transition-colors text-app-text/40 hover:text-app-text"
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
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-app-bg border border-app-border/50 flex items-center justify-center text-accent" style={{ color: theme === t ? themeColor : 'inherit' }}>
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
                                                <p className="text-sm font-mono font-bold" style={{ color: (theme === 'claire' || themeColor === '#ffffff') ? 'var(--app-text)' : themeColor }}>{themeColor}</p>
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

                            {/* AI Configuration Section */}
                            <section className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 px-1 border-l-2 border-accent/30 pl-3 italic">Intelligence Artificielle (Cloud)</h3>
                                <div className="bg-app-surface/20 border border-app-border/20 rounded-[2rem] p-8">
                                    <AISettings />
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
                            <section className="flex flex-col items-center text-center space-y-6">
                                <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center text-accent shadow-glow-accent/10">
                                    <Tablet size={40} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-app-text">GM Remote Control</h3>
                                    <p className="text-sm text-app-text/60 max-w-md mx-auto mt-2">Transformez votre tablette ou smartphone en surface de contrôle tactile pour piloter vos sessions.</p>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-app-surface/20 border border-app-border/20 rounded-[2.5rem] p-10">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-accent">Connexion Rapide</h4>
                                        <p className="text-xs text-app-text/40 leading-relaxed">Scannez ce QR Code avec l'appareil photo de votre tablette ou téléphone pour ouvrir instantanément la télécommande GM-OS.</p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-app-text/30 uppercase tracking-widest">Adresse IP Locale</span>
                                            <button 
                                                onClick={() => window.appBridge?.remote?.getConnectionInfo().then(setConnectionInfo)}
                                                className="p-1 hover:bg-white/10 rounded-lg text-accent transition-colors"
                                            >
                                                <RefreshCw size={12} />
                                            </button>
                                        </div>
                                        <p className="font-mono text-sm font-bold text-app-text/80">{connectionInfo?.ip || 'Recherche...'}</p>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-glow-emerald" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Serveur WebSocket Actif (Port 3001)</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative p-4 bg-white rounded-[2rem] shadow-2xl group transition-transform hover:scale-105 min-w-[200px] min-h-[200px] flex items-center justify-center">
                                        {qrCodeUrl ? (
                                            <img 
                                                src={qrCodeUrl} 
                                                alt="Remote QR Code" 
                                                className="w-48 h-48 mix-blend-multiply" 
                                                onLoad={() => console.log("[Remote] QR Code loaded successfully")}
                                                onError={() => console.error("[Remote] QR Code image failed to load")}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 border-4 border-accent border-t-transparent animate-spin rounded-full" />
                                                <p className="text-[10px] text-slate-500 font-bold uppercase">Génération...</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 border-4 border-accent/20 rounded-[2rem] pointer-events-none" />
                                    </div>
                                    <p className="text-[10px] font-bold text-app-text/30 uppercase tracking-widest italic select-all cursor-help">{remoteUrl || 'URL en attente...'}</p>
                                    
                                    {!connectionInfo && (
                                        <button 
                                            onClick={async () => {
                                                console.log("[Remote] Manual detection triggered");
                                                const info = await window.appBridge?.remote?.getConnectionInfo();
                                                console.log("[Remote] Manual info result:", info);
                                                setConnectionInfo(info);
                                            }}
                                            className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent text-[10px] font-black uppercase rounded-lg border border-accent/20 transition-all"
                                        >
                                            Forcer la détection
                                        </button>
                                    )}
                                </div>
                            </section>

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
