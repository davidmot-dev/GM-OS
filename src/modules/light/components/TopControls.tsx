import { useLightStore } from '../useLightStore';
import { gmConfirm } from '../../../stores/useModalStore';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TopControls: React.FC = () => {
    const { transitionTimeMs, setTransitionTime, reset, isSyncEnabled, setSyncEnabled, status } = useLightStore();
    const { t } = useTranslation('modules');

    return (
        <header className="p-6 border-b border-app-border flex items-center justify-between bg-app-surface/50 backdrop-blur-sm z-10 font-sans">
            <div className="flex items-center gap-8">
                <div className="flex flex-col gap-2">
                    <span className="text-ui-10 font-bold text-slate-500 uppercase tracking-widest">{t('light.top.transition_time')}</span>
                    <div className="flex bg-app-bg p-1 rounded-lg border border-app-border">
                        <button
                            onClick={() => setTransitionTime(0)}
                            className={`px-3 py-1 text-xs font-bold rounded-md ${transitionTimeMs === 0 ? 'bg-gm-cyan text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                            {t('light.top.inst')}
                        </button>
                        <button
                            onClick={() => setTransitionTime(2000)}
                            className={`px-3 py-1 text-xs font-bold rounded-md ${transitionTimeMs === 2000 ? 'bg-gm-cyan text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                            2s
                        </button>
                        <button
                            onClick={() => setTransitionTime(5000)}
                            className={`px-3 py-1 text-xs font-bold rounded-md ${transitionTimeMs === 5000 ? 'bg-gm-cyan text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                            5s
                        </button>
                        <button
                            onClick={() => setTransitionTime(15000)}
                            className={`px-3 py-1 text-xs font-bold rounded-md ${transitionTimeMs === 15000 ? 'bg-gm-cyan text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                            15s
                        </button>
                    </div>
                </div>

                <div className="h-10 w-px bg-app-border"></div>

                {/*
                  **La synchro des autres modules — l'interrupteur que le guide
                  promettait depuis toujours.**

                  ⛔ `isSyncEnabled` était lu **dix fois**, dans Sound-OS,
                  Music-OS et Ambient-OS, persisté, et **aucun écran ne
                  l'écrivait** : il valait `true` à jamais. *La chaîne entière
                  était là, il manquait le bouton au bout.*

                  Il est posé **avant** le mode simulé, parce que c'est celui
                  qu'on cherche : le voisin, lui, débranche le pont.
                */}
                <div className="flex items-center gap-4">
                    <span className={`text-ui-10 font-bold uppercase tracking-widest transition-colors ${isSyncEnabled ? 'text-accent' : 'text-slate-500'}`}>
                        {t('light.top.sync')}
                    </span>
                    <button
                        onClick={() => setSyncEnabled(!isSyncEnabled)}
                        title={isSyncEnabled ? t('light.top.sync_on_tooltip') : t('light.top.sync_off_tooltip')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isSyncEnabled ? 'bg-accent' : 'bg-app-surface'}`}>
                        <span className={`${isSyncEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                    </button>
                </div>

                <div className="h-10 w-px bg-app-border"></div>

                {/*
                  **Le mode simulé, renommé.** Il s'appelait « Synchro Simulée »
                  et se tenait seul dans cette barre : le meneur qui suivait le
                  guide — *« désactivez le bouton Sync »* — **débranchait son
                  pont Hue** au lieu de couper la synchro. *Deux réglages dont
                  l'un porte le nom de l'autre, c'est un piège, pas une
                  étiquette maladroite.*
                */}
                <div className="flex items-center gap-4">
                    <span className={`text-ui-10 font-bold uppercase tracking-widest transition-colors ${status === 'mock' ? 'text-amber-400' : 'text-slate-500'}`}>
                        {t('light.top.mock_mode')}
                    </span>
                    <button
                        onClick={() => {
                            if (useLightStore.getState().status === 'mock') {
                                useLightStore.getState().setConnection('disconnected');
                            } else {
                                useLightStore.getState().setConnection('mock');
                            }
                        }}
                        title={t('light.top.mock_mode_tooltip')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${status === 'mock' ? 'bg-amber-500' : 'bg-app-surface'}`}>
                        <span className={`${status === 'mock' ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                    </button>
                </div>

                <div className="h-10 w-px bg-app-border"></div>

                <button
                    onClick={() => gmConfirm(t('light.top.reset_confirm'), () => reset())}
                    title={t('light.top.reset_tooltip')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/20 border border-red-500/10 text-red-500/50 hover:text-red-500 transition-all active:scale-95 group"
                >
                    <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-ui-10 font-bold uppercase tracking-widest leading-none">{t('light.top.reset_module')}</span>
                </button>
            </div>

        </header>
    );
};
