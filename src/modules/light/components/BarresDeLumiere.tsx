import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLightStore } from '../useLightStore';
import { hueEngine } from '../HueEngine';

/**
 * **Les temps de transition, en tête de la grille** — refonte, L2, étape 2
 * (2026-10-02). Ils vivaient dans la barre du haut avec la synchro, le mode
 * simulé et la réinitialisation : un réglage de jeu entre trois réglages de
 * préparation. Les autres sont partis au panneau de droite.
 */
export const BarreDeTransition: React.FC<{ aLaTable?: boolean }> = ({ aLaTable = false }) => {
    const { transitionTimeMs, setTransitionTime } = useLightStore();
    const { t } = useTranslation('modules');
    const durees: [number, string][] = [[0, t('light.top.inst')], [2000, '2s'], [5000, '5s'], [15000, '15s']];

    return (
        <div className="flex items-center gap-3">
            <span className="text-ui-10 font-bold text-app-subtle uppercase tracking-widest">{t('light.top.transition_time')}</span>
            <div className="flex bg-app-bg p-1 rounded-lg border border-app-border">
                {durees.map(([ms, libelle]) => (
                    <button
                        key={ms}
                        onClick={() => setTransitionTime(ms)}
                        aria-pressed={transitionTimeMs === ms}
                        className={`${aLaTable ? 'px-4 py-2' : 'px-3 py-1'} text-xs font-bold rounded-md transition-colors ${transitionTimeMs === ms ? 'bg-gm-cyan text-app-bg shadow-lg' : 'text-app-muted hover:text-app-text'}`}
                    >
                        {libelle}
                    </button>
                ))}
            </div>
        </div>
    );
};

/**
 * **Les gestes rapides, en pied de la grille** : les trois flashs, et
 * « Arrêter la scène ». Ce sont des gestes de jeu — ils vivaient dans le
 * panneau de gauche, entre le pont et l'éclairage normal.
 */
export const BarreDesGestes: React.FC = () => {
    const { activeSceneId, defaultSceneId } = useLightStore();
    const { t } = useTranslation('modules');

    const handleFlash = (color: string) => {
        hueEngine.triggerFlash(color, 2000);
    };

    const geste = 'group flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold uppercase tracking-widest transition-all';

    return (
        <div role="group" aria-label={t('light.agencement.gestes')} className="sticky bottom-0 z-20 grid grid-cols-4 gap-2 rounded-2xl border border-app-border bg-app-bg/95 p-2 shadow-xl backdrop-blur-sm">
            <button onClick={() => handleFlash('#ff0000')} className={`${geste} bg-etat-danger/10 border-etat-danger/30 text-etat-danger hover:bg-etat-danger/20`}>
                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">local_fire_department</span>
                {t('light.sidebar.critical_red')}
            </button>
            <button onClick={() => handleFlash('#0088ff')} className={`${geste} bg-accent/10 border-accent/30 text-accent hover:bg-accent/20`}>
                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">auto_fix_high</span>
                {t('light.sidebar.arcane_blue')}
            </button>
            <button onClick={() => handleFlash('#10b981')} className={`${geste} bg-etat-succes/10 border-etat-succes/30 text-etat-succes hover:bg-etat-succes/20`}>
                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">healing</span>
                {t('light.sidebar.healing_green')}
            </button>

            {/*
              **Arrêter la scène en cours — le geste qui n'avait pas de
              bouton.**

              ⛔ Le moteur savait le faire depuis le 07/09
              (`revenirALEclairageNormal`), et **rien dans Light-OS ne
              l'appelait** : seul le Stop All de la barre audio y menait.
              Dans le module lui-même, la seule façon d'arrêter une ambiance
              était l'extinction d'urgence — *c'est-à-dire éteindre la pièce
              pour arrêter une scène.*

              Il vise l'**éclairage normal**, jamais la dernière scène
              choisie : c'est la deuxième des trois portes du retour, et
              elles ne s'alignent pas (voir `sceneDeRepli`).

              Éteint quand rien ne joue : *un bouton qui « arrête » alors
              que rien ne joue allumerait la pièce.* On le montre quand
              même, et le titre dit pourquoi il attend.
            */}
            <button
                onClick={() => hueEngine.revenirALEclairageNormal()}
                disabled={!activeSceneId}
                title={!activeSceneId
                    ? t('light.sidebar.stop_scene_none_active')
                    : (defaultSceneId ? t('light.sidebar.stop_scene_tooltip') : t('light.sidebar.stop_scene_tooltip_none'))}
                className={`${geste} bg-app-surface border-app-border text-app-text hover:border-accent/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-app-border`}
            >
                <span className="material-symbols-outlined text-lg">stop_circle</span>
                {t('light.sidebar.stop_scene')}
                {/*
                  **Le raccourci se lit sur le bouton**, comme la touche
                  d'une tuile se lit sur la tuile : *un raccourci qu'il faut
                  chercher dans un guide n'en est pas un.*
                */}
                <span className="text-ui-10 font-mono font-normal normal-case text-app-subtle border border-app-border rounded px-1 py-0.5 leading-none">
                    Échap
                </span>
            </button>
        </div>
    );
};
