import React from 'react';
import { X, Power, Globe, Shield, Info, Terminal, MonitorPlay, Zap } from 'lucide-react';
import { flushApplication } from '../utils/appUtils';
import { useSessionStore } from '../store/useSessionStore';

interface GlobalSettingsModalProps {
    onClose: () => void;
}

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ onClose }) => {
    const { theme, themeColor } = useSessionStore();
    const isBridgeActive = !!window.appBridge;

    return (
        <div className="flex flex-col h-full bg-app-bg text-app-text/80">
            {/* Header */}
            <div className="p-6 border-b border-app-border/10 flex items-center justify-between bg-app-surface/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-glow-accent/10">
                        <Globe size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter">Paramètres Système</h2>
                        <p className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest">GM-OS v5.0.0-alpha</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-app-surface rounded-full transition-colors text-app-text/20 hover:text-white"
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

                {/* Appearance Summary Section */}
                <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 px-1 border-l-2 border-accent/30 pl-3">Apparence Active</h3>
                    <div className="bg-app-surface/20 border border-app-border/10 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-app-bg border border-app-border flex items-center justify-center text-accent" style={{ color: themeColor }}>
                                <Zap size={24} fill="currentColor" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white uppercase tracking-tight">{theme}</p>
                                <p className="text-[10px] font-mono text-app-text/40">{themeColor}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-1.5 bg-app-surface hover:bg-app-surface/80 border border-app-border rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">
                                Changer via la Sidebar
                            </button>
                        </div>
                    </div>
                </section>

                {/* Dangerous Actions Section */}
                <section className="space-y-4 pt-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500 px-1 border-l-2 border-red-500/30 pl-3">Zone de Danger</h3>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex-1">
                            <h4 className="text-white font-bold text-sm mb-1">Réinitialisation d'Usine</h4>
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
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Designed & Powered by</p>
                        <h2 className="text-xl font-black text-white italic tracking-tighter">GM-OS <span className="text-accent">PROJECT</span></h2>
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
