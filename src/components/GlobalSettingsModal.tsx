import React, { useState } from 'react';
import { X, Power, Globe, Shield, Info, Terminal, MonitorPlay, Zap, Settings, Tablet, BookOpen, FolderOpen, CheckCircle2, Brain } from 'lucide-react';
import { flushApplication } from '../utils/appUtils';
import { useSessionStore, THEME_PALETTES } from '../store/useSessionStore';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../config/languages';
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
import { QRCodeSVG } from 'qrcode.react';
import { measureLocalStorageUsage, formatBytes, type StorageUsage } from '../modules/session/logic/storageDiagnostics';
import { InlinedMediaPanel } from './settings/InlinedMediaPanel';

/* GitHub Sync Section Removed at user request */

interface GlobalSettingsModalProps {
    onClose: () => void;
}

type TabID = 'system' | 'ai' | 'tactical' | 'remote';

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ onClose }) => {
    const { t, i18n } = useTranslation(['settings', 'common']);
    const [activeTab, setActiveTab] = useState<TabID>('system');
    const [connectionInfo, setConnectionInfo] = useState<{ip: string, port: number} | null>(null);
    const [pairingSecret, setPairingSecret] = useState<string>('');
    const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
    const { theme, setTheme, themeColor, setThemeColor, language, setLanguage } = useSessionStore();
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

    // Secret d'appairage : il n'est encodé que dans le QR de la télécommande MJ,
    // jamais affiché en clair ni transmis à un service externe.
    React.useEffect(() => {
        window.appBridge?.pairing?.getSecret().then(setPairingSecret).catch(console.error);
    }, []);

    // Mesure à l'ouverture des réglages : l'état a pu grossir depuis le démarrage.
    React.useEffect(() => {
        try {
            setStorageUsage(measureLocalStorageUsage());
        } catch (err) {
            console.warn('[Settings] Mesure du stockage impossible:', err);
        }
    }, []);

    const port = connectionInfo?.port || 3001;
    const remoteUrl = connectionInfo?.ip ? `http://${connectionInfo.ip}:${port}/?window=remote` : '';
    const tabletUrl = connectionInfo?.ip ? `http://${connectionInfo.ip}:${port}/?window=tablet` : '';

    // Le secret voyage dans le fragment : il n'est pas envoyé au serveur avec la
    // requête HTTP, donc il ne traîne ni dans les logs d'accès ni dans un Referer.
    const remotePairingUrl = remoteUrl && pairingSecret
        ? `${remoteUrl}#token=${encodeURIComponent(pairingSecret)}`
        : remoteUrl;

    const handleRevokePairings = async () => {
        if (!window.appBridge?.pairing?.rotate) return;
        const fresh = await window.appBridge.pairing.rotate();
        setPairingSecret(fresh);
        gmToast(t('settings:remote.pairings_revoked'), 'success');
    };

    return (
        <div className="flex flex-col h-full bg-app-bg text-app-text/80">
            {/* Main Header */}
            <div className="p-6 border-b border-app-border/10 flex items-center justify-between bg-app-surface/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shadow-glow-accent/10">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-app-text">{t('settings:title')}</h2>
                        <p className="text-[10px] text-app-text/60 font-bold uppercase tracking-widest">{t('settings:version_subtitle')}</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-app-surface rounded-full transition-colors text-app-text/40 hover:text-app-text"
                    title={t('settings:close_tooltip')}
                    aria-label={t('settings:close_tooltip')}
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 border-r border-app-border/10 bg-app-surface/20 flex flex-col p-4 gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-app-text/30 px-3 mb-2">{t('settings:categories_label')}</p>
                    <button 
                        onClick={() => setActiveTab('system')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'system' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-app-surface/40 hover:text-app-text border border-transparent'}`}
                    >
                        <Globe size={18} />
                        {t('settings:tabs.system')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('tactical')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'tactical' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-app-surface/40 hover:text-app-text border border-transparent'}`}
                    >
                        <Zap size={18} />
                        {t('settings:tabs.tactical')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('ai')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'ai' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-app-surface/40 hover:text-app-text border border-transparent'}`}
                    >
                        <Brain size={18} />
                        {t('settings:tabs.ai')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('remote')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'remote' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-app-text/60 hover:bg-app-surface/40 hover:text-app-text border border-transparent'}`}
                    >
                        <Tablet size={18} />
                        {t('settings:tabs.remote')}
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {activeTab === 'system' && (
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* System Status Section */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 px-1 border-l-2 border-accent/30 pl-3">{t('settings:sections.system_status')}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${isBridgeActive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                        <div className={`p-2 rounded-lg ${isBridgeActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            <Shield size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{t('settings:system.bridge_label')}</p>
                                            <p className={`text-sm font-black ${isBridgeActive ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {isBridgeActive ? t('settings:system.connected') : t('settings:system.disconnected')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-app-border/20 bg-app-surface/20 flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                            <Terminal size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{t('settings:system.environment')}</p>
                                            <p className="text-sm font-black text-blue-400">PRODUCTION-DAWN</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Appearance & Customization Section */}
                            <section className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 px-1 border-l-2 border-accent/30 pl-3">{t('settings:sections.customization')}</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Theme Selection */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">{t('settings:system.theme_label')}</p>
                                        <div className="flex flex-col gap-2">
                                            {(['cyberpunk', 'medieval', 'modern', 'claire'] as ThemeID[]).map((tID) => (
                                                <button
                                                    key={tID}
                                                    onClick={() => setTheme(tID)}
                                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${theme === tID ? 'bg-accent/10 border-accent shadow-glow-accent/20' : 'bg-app-surface/20 border-app-border/20 hover:border-app-border/40'}`}
                                                    title={`${t('settings:system.theme_label')} ${tID}`}
                                                    aria-label={`${t('settings:system.theme_label')} ${tID}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                        className="w-8 h-8 rounded-lg bg-app-bg border border-app-border/50 flex items-center justify-center text-accent" 
                                                    >
                                                        <Zap size={18} fill={theme === tID ? "currentColor" : "none"} />
                                                    </div>
                                                        <span className="text-sm font-black uppercase tracking-tight text-app-text">{t(`settings:themes.${tID}`)}</span>
                                                    </div>
                                                    {theme === tID && <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Palette Selection */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">{t('settings:system.palette_label', { theme })}</p>
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
                                                                <Zap size={10} fill="currentColor" />
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
                                                <p className="text-[9px] uppercase tracking-[0.2em] text-app-text/40 mt-1">{t('settings:system.active_sample')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Language & Region Section */}
                            <section className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 px-1 border-l-2 border-accent/30 pl-3">{t('settings:sections.language')}</h3>
                                <div className="bg-app-surface/20 border border-app-border/20 rounded-[2rem] p-8 space-y-6">
                                    <div className="flex items-start gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-gm-gold/10 flex items-center justify-center text-gm-gold shrink-0 border border-gm-gold/20 shadow-glow-gold/10">
                                            <Globe size={24} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-sm font-black uppercase tracking-tight text-app-text">{t('settings:system.language_label')}</h4>
                                            <p className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest leading-relaxed">
                                                {t('settings:system.language_description')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {SUPPORTED_LANGUAGES.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setLanguage(lang.code);
                                                    i18n.changeLanguage(lang.code);
                                                }}
                                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${language === lang.code ? 'bg-accent/10 border-accent shadow-glow-accent/20' : 'bg-app-bg/40 border-app-border/20 hover:border-app-border/40'}`}
                                            >
                                                <span className="text-2xl">{lang.flag}</span>
                                                <div className="text-left">
                                                    <p className="text-xs font-black uppercase tracking-widest text-app-text">{lang.name}</p>
                                                    <p className="text-[9px] font-bold text-app-text/40 uppercase tracking-tighter">{lang.code.toUpperCase()}</p>
                                                </div>
                                                {language === lang.code && <CheckCircle2 size={16} className="ml-auto text-accent" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Hardware & Routing Section */}
                            <section className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 px-1 border-l-2 border-gm-gold/50 pl-3 italic">{t('settings:sections.hardware')}</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Audio Outputs */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{t('settings:hardware.audio_outputs')}</p>
                                            <button onClick={() => fetchAudioDevices()} className="text-[10px] text-accent font-bold uppercase transition-opacity hover:opacity-70">{t('settings:hardware.refresh')}</button>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {audioDevices.length === 0 && (
                                                <div className="p-4 rounded-xl border border-app-border/10 bg-app-surface/10 text-center">
                                                    <p className="text-xs text-app-text/40">{t('settings:hardware.no_devices')}</p>
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
                                                        placeholder={t('settings:hardware.audio_alias_placeholder')}
                                                        className="bg-app-bg/50 border border-app-border/40 rounded-lg px-3 py-2 text-xs font-bold text-app-text focus:border-accent/50 outline-none transition-all placeholder:text-app-text/20"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Monitor Displays */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{t('settings:hardware.monitors')}</p>
                                            <button onClick={() => fetchDisplays()} className="text-[10px] text-accent font-bold uppercase transition-opacity hover:opacity-70">{t('settings:hardware.refresh')}</button>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {displays.length === 0 && (
                                                <div className="p-4 rounded-xl border border-app-border/10 bg-app-surface/10 text-center">
                                                    <p className="text-xs text-app-text/40">{t('settings:hardware.no_monitors')}</p>
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
                                                        placeholder={t('settings:hardware.monitor_alias_placeholder')}
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
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 border-l-2 border-accent/30 pl-3 italic">{t('settings:sections.obsidian')}</h3>
                                    {testStatus === 'success' && (
                                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-black uppercase animate-pulse">
                                            <CheckCircle2 size={12} /> {t('settings:obsidian.connected')}
                                        </span>
                                    )}
                                </div>
                                <div className="bg-app-surface/20 border border-app-border/20 rounded-[2rem] p-8 space-y-6">
                                    <div className="flex items-start gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
                                            <BookOpen size={24} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-sm font-black uppercase tracking-tight text-app-text">{t('settings:obsidian.vault_path')}</h4>
                                            <p className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest leading-relaxed">
                                                {t('settings:obsidian.vault_description')}
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
                                                placeholder={t('settings:obsidian.vault_placeholder')}
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
                                            title={t('settings:obsidian.browse_tooltip')}
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
                                                    gmToast(t('common:success_connect_vault', "Connexion au coffre établie avec succès"), "success");
                                                } else {
                                                    setTestStatus('error');
                                                    gmToast(`${t('common:error')} : ${currentError}`, "error");
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
                                            {isObsidianLoading ? t('settings:obsidian.testing') : t('settings:obsidian.test_button')}
                                        </button>
                                    </div>

                                    {obsidianError && (
                                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight italic">
                                                {t('settings:obsidian.error_prefix')}{obsidianError}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Maintenance Section */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-app-text/40 px-1 border-l-2 border-accent/30 pl-3">{t('settings:sections.maintenance')}</h3>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Media Cleanup */}
                                    <div className="p-6 rounded-2xl bg-app-surface/20 border border-app-border/10 flex items-center justify-between">
                                        <div className="flex-1">
                                            <h4 className="text-app-text font-bold text-sm mb-1">{t('settings:maintenance.media_cleanup_title')}</h4>
                                            <p className="text-xs text-app-text/40 max-w-md">{t('settings:maintenance.media_cleanup_desc')}</p>
                                            {cleanupResult && (
                                                <p className="text-[10px] text-accent font-black uppercase mt-2">
                                                    {t('settings:maintenance.media_cleanup_last', { count: cleanupResult.deletedCount, size: (cleanupResult.savedBytes / 1024 / 1024).toFixed(2) })}
                                                </p>
                                            )}
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                setIsCleaning(true);
                                                try {
                                                    const res = await mediaCleanupService.performCleanup();
                                                    setCleanupResult(res);
                                                    gmToast(t('common:success_cleanup', { count: res.deletedCount }), "success");
                                                } catch {
                                                    gmToast(t('common:error_cleanup'), "error");
                                                } finally {
                                                    setIsCleaning(false);
                                                }
                                            }}
                                            disabled={isCleaning}
                                            className="flex items-center gap-2 bg-accent/10 hover:bg-accent text-accent hover:text-app-bg border border-accent/30 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                        >
                                            {isCleaning ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                            {isCleaning ? t('settings:maintenance.cleaning') : t('settings:maintenance.cleanup_button')}
                                        </button>
                                    </div>

                                    <InlinedMediaPanel />

                                    {/* Occupation du stockage local */}
                                    <div className="p-6 rounded-2xl bg-app-surface/20 border border-app-border/10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-app-text font-bold text-sm mb-1">{t('settings:maintenance.storage_usage_title')}</h4>
                                                <p className="text-xs text-app-text/40 max-w-md">{t('settings:maintenance.storage_usage_desc')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-2xl font-black tabular-nums ${storageUsage?.isNearQuota ? 'text-rose-400' : 'text-app-text'}`}>
                                                    {storageUsage ? formatBytes(storageUsage.totalBytes) : '—'}
                                                </p>
                                                {storageUsage && (
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-app-text/40 mt-1">
                                                        {t('settings:maintenance.storage_usage_session', { size: formatBytes(storageUsage.sessionBytes) })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {storageUsage?.isNearQuota && (
                                            <p className="text-[10px] text-rose-400 font-black uppercase mt-3">
                                                {t('settings:maintenance.storage_usage_warning')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Dangerous Actions Section */}
                            <section className="space-y-4 pt-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500 px-1 border-l-2 border-red-500/30 pl-3">{t('settings:sections.danger_zone')}</h3>
                                <div className={`${theme === 'claire' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-500/5 border-red-500/10'} rounded-2xl p-6 flex items-center justify-between`}>
                                    <div className="flex-1">
                                        <h4 className="text-app-text font-bold text-sm mb-1">{t('settings:danger.factory_reset_title')}</h4>
                                        <p className="text-xs text-app-text/40 max-w-md">{t('settings:danger.factory_reset_desc')}</p>
                                    </div>
                                    <button 
                                        onClick={flushApplication}
                                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-glow-red/0 hover:shadow-glow-red/20 active:scale-95"
                                    >
                                        <Power size={18} />
                                        {t('settings:danger.reset_button')}
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
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-app-text">{t('settings:ai.title')}</h3>
                                        <p className="text-[10px] text-app-text/60 font-black uppercase tracking-widest mt-0.5">{t('settings:ai.subtitle')}</p>
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
                                            <h4 className="text-sm font-black uppercase tracking-tight text-app-text">{t('settings:tactical.master_switch')}</h4>
                                            <p className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest">{t('settings:tactical.switch_desc')}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updateTacticalSettings({ isEnabled: !tacticalSettings.isEnabled })}
                                        className={`relative w-14 h-7 rounded-full transition-all duration-300 ${tacticalSettings.isEnabled ? 'bg-accent shadow-glow-accent/20' : 'bg-app-surface border border-app-border/50'}`}
                                        title={tacticalSettings.isEnabled ? t('settings:tactical.disable_tooltip') : t('settings:tactical.enable_tooltip')}
                                        aria-label={tacticalSettings.isEnabled ? t('settings:tactical.disable_tooltip') : t('settings:tactical.enable_tooltip')}
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
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-app-text">{t('settings:remote.gm_remote_title')}</h3>
                                            <p className="text-[10px] text-app-text/60 max-w-[240px] mt-1 uppercase tracking-widest font-black">{t('settings:remote.gm_remote_subtitle')}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-6">
                                        <div className="relative p-2 bg-white rounded-[1.5rem] shadow-2xl group transition-transform hover:scale-105">
                                            {remotePairingUrl ? (
                                                <QRCodeSVG
                                                    value={remotePairingUrl}
                                                    size={160}
                                                    bgColor="#ffffff"
                                                    fgColor="#000000"
                                                    level="Q"
                                                    className="w-40 h-40"
                                                />
                                            ) : (
                                                <div className="w-40 h-40 flex flex-col items-center justify-center gap-2">
                                                    <div className="w-8 h-8 border-3 border-accent border-t-transparent animate-spin rounded-full" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 border-2 border-accent/20 rounded-[1.5rem] pointer-events-none" />
                                        </div>
                                        {/* On affiche l'URL sans le fragment : le secret ne doit pas
                                            se retrouver sur un partage d'écran ou une capture. */}
                                        <p className="text-[9px] font-bold text-app-text/30 uppercase tracking-widest italic select-all cursor-help">{remoteUrl || t('settings:remote.waiting_url')}</p>
                                        <button
                                            onClick={handleRevokePairings}
                                            className="text-[9px] font-bold uppercase tracking-widest text-rose-400/70 hover:text-rose-400 transition-colors"
                                            title={t('settings:remote.revoke_pairings_tooltip')}
                                        >
                                            {t('settings:remote.revoke_pairings')}
                                        </button>
                                    </div>

                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-app-text/30 uppercase tracking-widest">{t('settings:remote.direct_connection')}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-emerald" />
                                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{t('settings:remote.active')} (3001)</span>
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
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-app-text">{t('settings:remote.tablet_hub_title')}</h3>
                                            <p className="text-[10px] text-app-text/60 max-w-[240px] mt-1 uppercase tracking-widest font-black">{t('settings:remote.tablet_hub_subtitle')}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-6">
                                        <div className="relative p-2 bg-white rounded-[1.5rem] shadow-2xl group transition-transform hover:scale-105">
                                            {tabletUrl ? (
                                                <QRCodeSVG
                                                    value={tabletUrl}
                                                    size={160}
                                                    bgColor="#ffffff"
                                                    fgColor="#000000"
                                                    level="Q"
                                                    className="w-40 h-40"
                                                />
                                            ) : (
                                                <div className="w-40 h-40 flex flex-col items-center justify-center gap-2">
                                                    <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent animate-spin rounded-full" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 border-2 border-blue-400/20 rounded-[1.5rem] pointer-events-none" />
                                        </div>
                                        <p className="text-[9px] font-bold text-app-text/30 uppercase tracking-widest italic select-all cursor-help">{tabletUrl || t('settings:remote.waiting_url')}</p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-app-text/30 uppercase tracking-widest">{t('settings:remote.streaming_label')}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-glow-blue" />
                                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{t('settings:remote.active')}</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <LobbyMonitor />

                            <section className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-app-text/40 px-1 border-l-2 border-accent/30 pl-3">{t('settings:remote.functions_label')}</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: t('settings:remote.functions.soundboard_label'), desc: t('settings:remote.functions.soundboard_desc') },
                                        { label: t('settings:remote.functions.dice_label'), desc: t('settings:remote.functions.dice_desc') },
                                        { label: t('settings:remote.functions.scene_label'), desc: t('settings:remote.functions.scene_desc') }
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
