import React from 'react';
import { X, Power, Globe, Shield, Info, Terminal, MonitorPlay, Zap } from 'lucide-react';
import { flushApplication } from '../utils/appUtils';
import { useSessionStore, THEME_PALETTES } from '../store/useSessionStore';
import type { ThemeID } from '../store/useSessionStore';
import { useHardwareStore } from '../stores/useHardwareStore';

interface GlobalSettingsModalProps {
    onClose: () => void;
}

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ onClose }) => {
    const { theme, setTheme, themeColor, setThemeColor } = useSessionStore();
    const { 
        audioDevices, fetchAudioDevices, audioAliases, setAudioAlias,
        displays, fetchDisplays, displayAliases, setDisplayAlias 
    } = useHardwareStore();
    const isBridgeActive = !!window.appBridge;

    React.useEffect(() => {
        fetchAudioDevices();
        fetchDisplays();
    }, [fetchAudioDevices, fetchDisplays]);

    return (
        <div className="flex flex-col h-full bg-app-bg text-app-text/80">
            {/* Header */}
            <div className="p-6 border-b border-app-border/10 flex items-center justify-between bg-app-surface/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-glow-accent/10">
                        <Globe size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-app-text">Paramètres Système</h2>
                        <p className="text-[10px] text-app-text/60 font-bold uppercase tracking-widest">GM-OS v5.0.0-alpha</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-app-surface rounded-full transition-colors text-app-text/40 hover:text-app-text"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                
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
        </div>
    );
};

export default GlobalSettingsModal;
