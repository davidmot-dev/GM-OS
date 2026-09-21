import React from 'react';
import { useLightStore } from '../useLightStore';
import { gmConfirm } from '../../../stores/useModalStore';
import { gmToast } from '../../../stores/useToastStore';
import { hueEngine } from '../HueEngine';
import { RefreshCw, RotateCcw, Wand2 } from 'lucide-react';
import SelecteurDEffet from './SelecteurDEffet';
import { useTranslation } from 'react-i18next';

export const TopControls: React.FC = () => {
    const { transitionTimeMs, setTransitionTime, reset, isSyncEnabled, setSyncEnabled, status } = useLightStore();
    const { t } = useTranslation('modules');

    /*
      ⛔ **La porte de l'atelier — posée le 2026-09-21, un jour après l'atelier
      lui-même.**

      L'écran des effets ne s'ouvrait que depuis le pied de page d'une **lampe** :
      sans pont branché ni mode simulé, il n'y a aucune lampe à l'écran, donc
      aucun bouton, donc **pas d'atelier** — alors qu'il sait très bien composer
      un effet sans elles.

      ⭐ *Une fonctionnalité qu'on ne peut pas atteindre n'existe pas*, et c'est
      la **troisième fois en deux jours** qu'une porte manque dans ce dépôt —
      après la boucle d'une vidéo, cherchée dans Image-OS et rangée au Media Hub.

      ⚠️ **C'est le même écran, pas une copie.** Ouvert d'ici, il ne peut
      simplement pas *poser* d'effet — il n'y a personne à qui le poser — et il
      le dit. *Deux écrans pour un même vocabulaire finiraient par diverger.*
    */
    const [atelierOuvert, setAtelierOuvert] = React.useState(false);

    /** La relecture est-elle en vol ? Le pont peut mettre une seconde à répondre. */
    const [relectureEnCours, setRelectureEnCours] = React.useState(false);

    /**
     * **Aller redemander au pont ce qu'éclairent vraiment les lampes.**
     *
     * GM-OS ne tenait que le compte de ce qu'il avait lui-même envoyé. Le
     * meneur, lui, règle aussi sa pièce depuis son téléphone — et tout ce qui
     * lit le miroir (les curseurs du pied de page, et surtout la **capture**
     * d'une tuile) travaillait alors sur une pièce d'hier.
     *
     * ⚠️ On ne le fait **pas** tout seul, en boucle : le pont tient de l'ordre
     * de dix commandes par seconde et les effets logiciels en consomment déjà.
     * *C'est un geste du meneur, au moment où il le veut.*
     */
    const relire = async () => {
        if (relectureEnCours) return;
        /*
          On dit pourquoi le bouton ne fait rien plutôt que de l'éteindre : un
          bouton inerte et muet se fait prendre pour une panne. C'est la règle
          déjà suivie par le mode « suivre la voix » dans le panneau de gauche.
        */
        if (status !== 'connected') {
            gmToast(t('light.top.reread_offline'), 'warning');
            return;
        }
        setRelectureEnCours(true);
        try {
            await hueEngine.relireLesLampes();
            const nombre = Object.keys(useLightStore.getState().lights).length;
            gmToast(t('light.top.reread_done', { nombre }), 'success');
        } catch {
            gmToast(t('light.top.reread_failed'), 'error');
        } finally {
            setRelectureEnCours(false);
        }
    };

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

            {/*
              **Le bouton vit à droite, seul.** Le groupe de gauche tient déjà
              quatre réglages et deux interrupteurs : le 2026-09-17, une barre
              trop pleine avait poussé le pied de page des lampes sous la ligne
              de flottaison sur un écran 1440×900. *Ce qu'on ajoute dans une
              rangée pleine pousse ce qui y était — ici il y avait la place à
              côté.*
            */}
            <button
                onClick={() => setAtelierOuvert(true)}
                title={t('light.top.atelier_tooltip')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-accent/20 bg-accent/5 hover:bg-accent/20 text-accent/70 hover:text-accent transition-all active:scale-95"
            >
                <Wand2 size={14} />
                <span className="text-ui-10 font-bold uppercase tracking-widest leading-none">
                    {t('light.top.atelier')}
                </span>
            </button>

            {atelierOuvert && (
                <SelecteurDEffet
                    effetActuel=""
                    nomDeLaLampe=""
                    onFermer={() => setAtelierOuvert(false)}
                />
            )}

            <button
                onClick={relire}
                disabled={relectureEnCours}
                title={t('light.top.reread_tooltip')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all active:scale-95 group ${
                    status === 'connected'
                        ? 'bg-accent/5 hover:bg-accent/20 border-accent/20 text-accent/70 hover:text-accent'
                        : 'bg-app-surface/30 border-app-border text-slate-500 hover:text-slate-400'
                }`}
            >
                <RefreshCw
                    size={14}
                    className={relectureEnCours ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}
                />
                <span className="text-ui-10 font-bold uppercase tracking-widest leading-none">{t('light.top.reread')}</span>
            </button>

        </header>
    );
};
