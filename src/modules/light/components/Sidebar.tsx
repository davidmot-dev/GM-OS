import React from 'react';
import { useLightStore } from '../useLightStore';
import { hueEngine } from '../HueEngine';
import { useTranslation } from 'react-i18next';
import { useVoiceStore } from '../../voice/useVoiceStore';

export const Sidebar: React.FC = () => {
    const { status, bridgeIp, globalBrightness, setGlobalBrightness, suivreLaVoix, setSuivreLaVoix } = useLightStore();
    /*
      **On dit pourquoi le mode ne fait rien, plutôt que de le rendre
      inaccessible.** Armé micro coupé, il attend sans rien montrer : un
      interrupteur qui reste sans effet sans expliquer se fait prendre pour une
      panne. C'est la règle des trois points du repli de séance, vue de l'autre
      côté.
    */
    const voixActive = useVoiceStore(e => e.isActive);
    const { t } = useTranslation('modules');

    const handlePair = async () => {
        if (!bridgeIp) {
            console.log("No IP to pair");
            return;
        }
        await useLightStore.getState().setConnection('pairing');

        // Poll for 30 seconds (every 2 seconds)
        let attempts = 0;
        const maxAttempts = 15;

        const tryPair = async () => {
            try {
                const token = await hueEngine.pair(bridgeIp);
                if (token) {
                    await useLightStore.getState().setConnection('connected', bridgeIp, token);
                    await hueEngine.fetchLights();
                    return true;
                }
            } catch (e: unknown) {
                if (e instanceof Error && e.message === "LINK_BUTTON_NOT_PRESSED") {
                    // Expected during polling
                } else {
                    console.error("Pairing error", e);
                }
            }
            return false;
        };

        const poll = setInterval(async () => {
            attempts++;
            const success = await tryPair();
            if (success) {
                clearInterval(poll);
            } else if (attempts >= maxAttempts) {
                clearInterval(poll);
                await useLightStore.getState().setConnection('disconnected');
                alert(t('light.sidebar.prompt_timeout'));
            }
        }, 2000);

        // Immediate first try
        const success = await tryPair();
        if (success) clearInterval(poll);
    };

    const handleDiscover = async () => {
        await useLightStore.getState().setConnection('discovering');
        const ip = await hueEngine.discoverBridge();
        if (ip) {
            await useLightStore.getState().setConnection('disconnected', ip);
            // Auto try pair? No, user should click pair which tells them to press button.
        } else {
            await useLightStore.getState().setConnection('disconnected');
            alert(t('light.sidebar.prompt_no_bridge'));
        }
    };

    const handleFlash = (color: string) => {
        hueEngine.triggerFlash(color, 2000);
    };

    return (
        <aside className="col-span-3 bg-app-surface/95 backdrop-blur-md border-r border-app-border p-6 flex flex-col gap-8 text-app-text font-sans h-full">


            {/* Connection Status & Sync */}
            <div className="flex flex-col gap-3">
                <div className={`flex items-center justify-between p-4 rounded-xl border ${status === 'connected' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-app-bg/50 border-app-border'}`}>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-accent">hub</span>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">{t('light.sidebar.hue_bridge')}</span>
                            {bridgeIp && <span className="text-xs text-slate-500">{bridgeIp}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border bg-app-bg/20 border-app-border">
                    <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined ${useLightStore.getState().isSyncEnabled ? 'text-gm-violet animate-pulse' : 'text-slate-600'}`}>sync</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">{t('light.sidebar.sync_with_audio')}</span>
                    </div>
                    <button 
                        onClick={() => useLightStore.getState().setSyncEnabled(!useLightStore.getState().isSyncEnabled)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${useLightStore.getState().isSyncEnabled ? 'bg-accent' : 'bg-app-surface'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useLightStore.getState().isSyncEnabled ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                {status !== 'connected' && (
                    <div className="flex gap-2">
                        <button onClick={handleDiscover} className="flex-1 py-2 bg-app-bg hover:bg-app-surface rounded-lg text-xs font-bold transition-colors">
                            {t('light.sidebar.discover')}
                        </button>
                        <button onClick={handlePair} disabled={!bridgeIp} className="flex-1 py-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {t('light.sidebar.pair_key')}
                        </button>
                    </div>
                )}
                {status === 'connected' && (
                    <button onClick={async () => await useLightStore.getState().setConnection('disconnected', null, null)} className="py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-colors">
                        {t('light.sidebar.disconnect')}
                    </button>
                )}
                {bridgeIp && (
                    <button 
                        onClick={async () => {
                            if (window.confirm(t('light.sidebar.forget_confirm'))) {
                                await useLightStore.getState().forgetBridge();
                            }
                        }}
                        className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                        {t('light.sidebar.forget_bridge')}
                    </button>
                )}

            </div>

            {/* Global Brightness */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">{t('light.sidebar.global_intensity')}</label>
                    <span className="text-accent font-mono font-bold">{globalBrightness}%</span>
                </div>
                <div className="relative w-full h-8 flex items-center">
                    <input
                        type="range"
                        min="0" max="100"
                        value={globalBrightness}
                        onChange={(e) => setGlobalBrightness(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-app-bg rounded-full appearance-none cursor-pointer accent-accent"
                    />
                </div>
            </div>

            {/* Voice-to-Light — jalon d'avril 2026 */}
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => setSuivreLaVoix(!suivreLaVoix)}
                    className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                        suivreLaVoix
                            ? 'bg-accent/20 border-accent/40'
                            : 'bg-app-bg/50 border-white/10 hover:bg-app-bg'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined transition-transform group-hover:scale-110 ${suivreLaVoix ? 'text-accent' : 'text-slate-400'}`}>graphic_eq</span>
                        <span className={`font-bold ${suivreLaVoix ? 'text-app-text' : 'text-slate-300'}`}>{t('light.sidebar.suivre_la_voix')}</span>
                    </div>
                    <span className={`text-ui-10 font-black uppercase tracking-widest ${suivreLaVoix ? 'text-accent' : 'text-slate-600'}`}>
                        {suivreLaVoix ? t('light.sidebar.suivre_la_voix_actif') : t('light.sidebar.suivre_la_voix_inactif')}
                    </span>
                </button>
                {suivreLaVoix && !voixActive && (
                    <p className="text-ui-11 text-amber-400/80 px-1">{t('light.sidebar.suivre_la_voix_sans_micro')}</p>
                )}
                {suivreLaVoix && (
                    <p className="text-ui-11 text-slate-500 px-1">{t('light.sidebar.suivre_la_voix_note')}</p>
                )}
            </div>

            {/* Quick Flash Buttons */}
            <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('light.sidebar.quick_action_presets')}</h3>
                <button onClick={() => handleFlash('#ff0000')} className="group flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 group-hover:scale-110 transition-transform">local_fire_department</span>
                        <span className="font-bold text-red-100">{t('light.sidebar.critical_red')}</span>
                    </div>
                    <span className="material-symbols-outlined text-xs text-red-500/50">bolt</span>
                </button>

                <button onClick={() => handleFlash('#0088ff')} className="group flex items-center justify-between p-4 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-accent group-hover:scale-110 transition-transform">auto_fix_high</span>
                        <span className="font-bold text-blue-100">{t('light.sidebar.arcane_blue')}</span>
                    </div>
                    <span className="material-symbols-outlined text-xs text-accent/50">bolt</span>
                </button>

                <button onClick={() => handleFlash('#10b981')} className="group flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-emerald-400 group-hover:scale-110 transition-transform">healing</span>
                        <span className="font-bold text-app-text">{t('light.sidebar.healing_green')}</span>
                    </div>
                    <span className="material-symbols-outlined text-xs text-emerald-400/50">bolt</span>
                </button>
            </div>

            <div className="mt-auto pt-6 border-t border-app-border">
                <button
                    onClick={() => hueEngine.extinguishAll()}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                    <span className="material-symbols-outlined">power_settings_new</span>
                    {t('light.sidebar.emergency_blackout')}
                </button>
            </div>
        </aside>
    );
};
