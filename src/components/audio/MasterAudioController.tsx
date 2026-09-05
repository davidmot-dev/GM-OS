import React from 'react';
import { Volume2, VolumeX, Mic, Zap, Power } from 'lucide-react';
import { useAudioMasterStore } from '../../stores/useAudioMasterStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useToastStore } from '../../stores/useToastStore';
import { useTranslation } from 'react-i18next';
import { useFavoriteStore } from '../../modules/favorite/useFavoriteStore';

const MasterAudioController: React.FC = () => {
    const { t } = useTranslation(['common', 'modules']);
    const { 
        masterVolume, 
        setMasterVolume, 
        basculerLaCoupure,
        isFocusMode,
        toggleFocusMode,
        focusDuckingRatio,
        setFocusDuckingRatio
    } = useAudioMasterStore();
    const { theme } = useSessionStore();

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMasterVolume(parseFloat(e.target.value));
    };

    const handleStopAll = async () => {
        interface GMWindow {
            soundEngine?: { stopAll: () => void };
            musicEngine?: { stopAll: () => void };
            ambientEngine?: { fadeOutAll: (d: number) => void };
            useImageStore?: { getState: () => { blackoutAll: () => void } };
            hueEngine?: { extinguishAll: () => Promise<void> };
        }
        const win = window as unknown as GMWindow;
        try {
            // 1. All Audio Modules via window to avoid circular dependencies
            if (win.soundEngine) win.soundEngine.stopAll();
            if (win.musicEngine) win.musicEngine.stopAll();
            if (win.ambientEngine) win.ambientEngine.fadeOutAll(1.0); // Quick 1s fade

            // 2. Projections & Displays
            if (win.useImageStore) win.useImageStore.getState().blackoutAll();

            // 3. Lighting (Hue)
            if (win.hueEngine) {
                await win.hueEngine.extinguishAll();
            }

            // 4. Favorites & Projections (Full Hub Sync cleanup)
            useFavoriteStore.getState().clearAllHubProjections();

            useToastStore.getState().showToast(t('modules:session.toasts.stop_all_success'), 'success');
        } catch (error) {
            console.error('[PanicButton] Failed to stop everything:', error);
            useToastStore.getState().showToast(t('modules:session.toasts.stop_all_error'), 'error');
        }
    };

    return (
        <div className={`flex items-center gap-6 px-6 py-2 border shadow-2xl group transition-all duration-300 ${
            theme === 'medieval' 
                ? 'bg-app-surface/90 border-app-border/60 rounded-lg' 
                : 'bg-app-surface/40 backdrop-blur-xl border-app-border/30 rounded-2xl hover:border-accent/40'
        }`}>
            {/* Master Volume Slider */}
            <div className={`flex items-center gap-3 min-w-[180px] p-2 ${
                theme === 'medieval' ? 'bg-black/20 rounded border border-app-border/30' : ''
            }`}>
                <button 
                    onClick={basculerLaCoupure}
                    title={masterVolume === 0 ? 'Rétablir le niveau d’avant' : 'Couper le son'}
                    className={`transition-colors ${theme === 'medieval' ? 'text-accent' : 'text-app-text/60 hover:text-accent'}`}
                >
                    {masterVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={masterVolume} 
                    onChange={handleVolumeChange}
                    aria-label={t('audio')}
                    className={`w-full h-1.5 appearance-none cursor-pointer accent-accent ${
                        theme === 'medieval' ? 'bg-app-bg' : 'bg-app-bg/50 rounded-lg'
                    }`}
                />
                
                <span className="text-ui-10 font-mono text-app-text/40 w-8 text-right">
                    {Math.round(masterVolume * 100)}%
                </span>
            </div>

            {/* Focus Chat Button */}
            <button
                onClick={toggleFocusMode}
                className={`flex items-center gap-2.5 px-4 py-2 border transition-all duration-500 relative overflow-hidden group/btn ${
                    theme === 'medieval' ? 'rounded-md' : 'rounded-xl'
                } ${
                    isFocusMode 
                    ? 'bg-accent/20 border-accent text-accent shadow-glow-accent' 
                    : 'bg-app-bg/50 border-app-border/50 text-app-text/40 hover:text-app-text/80 hover:border-app-text/30'
                }`}
            >
                {isFocusMode && (
                    <div className="absolute inset-0 bg-accent/10 animate-pulse" />
                )}
                
                <div className="relative z-10 flex items-center gap-2">
                    {isFocusMode ? (
                        <Zap size={16} className="animate-bounce" />
                    ) : (
                        <Mic size={16} className="group-hover/btn:scale-110 transition-transform" />
                    )}
                    <span className="text-ui-10 font-black uppercase tracking-[0.2em]">
                        {isFocusMode ? 'Focus ACTIVE' : 'Focus Chat'}
                    </span>
                </div>

                {/* Micro-animation indicator */}
                <div className={`w-1 h-1 rounded-full absolute right-2 top-2 ${isFocusMode ? 'bg-accent animate-ping' : 'bg-app-text/10'}`} />
            </button>

            {/*
              **À quel point le Focus baisse le reste** (point A10, 2026-09-05).

              `setFocusDuckingRatio` existait depuis toujours et les trois
              moteurs — ambiance, musique, bruitages — lisaient déjà la valeur.
              **Aucun écran ne l'appelait**, et le rapport valait donc toujours
              0,1 : le Focus coupait tout à 10 %, ce qui est très bas pour un
              aparté et beaucoup trop haut pour une révélation. *Toute la chaîne
              était là sauf le bouton au bout.*

              Le curseur n'apparaît **que quand le Focus est allumé** : c'est le
              seul moment où il veut dire quelque chose, et une barre de plus en
              permanence dans ce bandeau serait du bruit.

              Bornes 5 % à 60 % : au-delà, le Focus ne se distingue plus de
              l'absence de Focus, et en deçà de 5 % il vaut mieux couper.
            */}
            {isFocusMode && (
                <div className="flex flex-col gap-1 min-w-[110px]">
                    <div className="flex justify-between items-center gap-2 text-ui-9 uppercase tracking-widest text-accent/70">
                        <span>{t('modules:session.audio_master.focus_ducking')}</span>
                        <span className="font-mono">{Math.round(focusDuckingRatio * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0.05"
                        max="0.6"
                        step="0.05"
                        value={focusDuckingRatio}
                        title={t('modules:session.audio_master.focus_ducking_hint')}
                        aria-label={t('modules:session.audio_master.focus_ducking')}
                        onChange={(e) => setFocusDuckingRatio(parseFloat(e.target.value))}
                        className="w-full h-1 accent-accent bg-app-bg/60 rounded-lg cursor-pointer"
                    />
                </div>
            )}

            {/* Panic Button / Stop All */}
            <button
                onClick={handleStopAll}
                className={`flex items-center gap-2 px-4 py-2 border transition-all duration-300 group/panic ${
                    theme === 'medieval' 
                    ? 'rounded-md bg-red-900/20 border-red-900/40 text-red-400 hover:bg-red-900/40' 
                    : 'rounded-xl bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 hover:border-red-500/40 hover:shadow-glow-red/20'
                }`}
                title={t('common:actions.stop_all')}
            >
                <Power size={16} className="group-hover/panic:scale-110 transition-transform" />
                <span className="text-ui-10 font-black uppercase tracking-[0.2em] hidden sm:inline">
                    Stop All
                </span>
            </button>
        </div>
    );
};

export default MasterAudioController;
