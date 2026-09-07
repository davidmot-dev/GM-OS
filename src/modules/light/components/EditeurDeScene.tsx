import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LightScene } from '../useLightStore';

/**
 * **L'éditeur d'une tuile : son nom, son icône, sa couleur.**
 *
 * ⛔ Le guide promettait les trois depuis toujours. L'unique appelant de
 * `updateSceneMetadata` repassait l'icône et la couleur **inchangées** : les
 * dix-huit tuiles étaient grises et portaient la même ampoule à jamais, alors
 * que la couleur pilote la bordure active, le halo et l'étoile ✨. *Toute la
 * chaîne était là, il manquait le bouton au bout.*
 *
 * Il remplace un `gmPrompt`, qui ne sait porter qu'une ligne de texte.
 */

/**
 * **Les icônes offertes.** Une grille fermée plutôt qu'un champ libre : les noms
 * de Material Symbols ne se devinent pas, et une icône mal orthographiée ne
 * s'affiche pas — *une tuile vide ne dirait pas pourquoi*. Le champ libre reste
 * dessous pour qui connaît le catalogue.
 */
const ICONES = [
    'wb_incandescent', 'local_fire_department', 'bolt', 'nightlight',
    'wb_sunny', 'wb_twilight', 'water_drop', 'forest',
    'castle', 'church', 'cottage', 'storefront',
    'skull', 'psychology_alt', 'auto_awesome', 'stars',
    'rocket_launch', 'science', 'biotech', 'radar',
    'swords', 'shield', 'visibility_off', 'warning',
];

/**
 * **Les couleurs offertes.** Elles ne commandent aucune lampe : c'est le repère
 * de la tuile à l'écran — bordure, halo, étoile. D'où des teintes qui se
 * distinguent d'un coup d'œil sur fond sombre, et non des blancs de lampe.
 */
const COULEURS = [
    '#334155', '#ef4444', '#f97316', '#f59e0b',
    '#facc15', '#84cc16', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#6366f1', '#a855f7',
    '#d946ef', '#ec4899', '#f43f5e', '#e2e8f0',
];

interface Props {
    scene: LightScene;
    onValider: (nom: string, icone: string, couleur: string) => void;
    onAnnuler: () => void;
}

export const EditeurDeScene: React.FC<Props> = ({ scene, onValider, onAnnuler }) => {
    const { t } = useTranslation('modules');
    const [nom, setNom] = useState(scene.name);
    const [icone, setIcone] = useState(scene.icon);
    const [couleur, setCouleur] = useState(scene.color);
    const champDuNom = useRef<HTMLInputElement>(null);

    useEffect(() => {
        champDuNom.current?.select();
    }, []);

    useEffect(() => {
        const auClavier = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.stopPropagation(); onAnnuler(); }
        };
        window.addEventListener('keydown', auClavier);
        return () => window.removeEventListener('keydown', auClavier);
    }, [onAnnuler]);

    const valider = () => {
        const propre = nom.trim();
        /* Un nom vide rendrait la tuile muette : on garde l'ancien. */
        onValider(propre === '' ? scene.name : propre, icone, couleur);
    };

    return (
        /*
          `role="dialog"` n'est pas décoratif : `estUneFrappeDePastille` s'en
          sert pour rendre le clavier à la boîte ouverte. Sans lui, taper le nom
          « Taverne » lancerait les pastilles liées à T, A, V, E, R, N et E.
        */
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
            onClick={onAnnuler}
        >
            <div
                className="w-full max-w-lg bg-app-surface border border-app-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl" style={{ color: couleur }}>{icone}</span>
                    <h2 className="text-lg font-bold text-app-text">{t('light.editor.title')}</h2>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-ui-10 font-bold text-slate-500 uppercase tracking-widest">{t('light.editor.name')}</label>
                    <input
                        ref={champDuNom}
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') valider(); }}
                        className="bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm font-bold text-app-text focus:border-accent/50 outline-none"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-ui-10 font-bold text-slate-500 uppercase tracking-widest">{t('light.editor.icon')}</label>
                    <div className="grid grid-cols-8 gap-1">
                        {ICONES.map(nomDIcone => (
                            <button
                                key={nomDIcone}
                                onClick={() => setIcone(nomDIcone)}
                                title={nomDIcone}
                                className={`aspect-square rounded-lg flex items-center justify-center transition-all border ${icone === nomDIcone
                                    ? 'bg-accent/20 border-accent'
                                    : 'bg-app-bg border-app-border hover:border-accent/40'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg" style={{ color: icone === nomDIcone ? couleur : undefined }}>
                                    {nomDIcone}
                                </span>
                            </button>
                        ))}
                    </div>
                    <input
                        value={icone}
                        onChange={(e) => setIcone(e.target.value.trim())}
                        placeholder={t('light.editor.icon_free')}
                        className="bg-app-bg border border-app-border rounded-lg px-3 py-1.5 text-ui-10 font-mono text-slate-400 focus:border-accent/50 outline-none"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-ui-10 font-bold text-slate-500 uppercase tracking-widest">{t('light.editor.color')}</label>
                    <div className="flex items-center gap-2">
                        <div className="grid grid-cols-8 gap-1 flex-1">
                            {COULEURS.map(teinte => (
                                <button
                                    key={teinte}
                                    onClick={() => setCouleur(teinte)}
                                    title={teinte}
                                    className={`aspect-square rounded-lg border-2 transition-all ${couleur.toLowerCase() === teinte.toLowerCase()
                                        ? 'border-app-text scale-110'
                                        : 'border-transparent hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: teinte }}
                                />
                            ))}
                        </div>
                        <input
                            type="color"
                            value={couleur}
                            onChange={(e) => setCouleur(e.target.value)}
                            title={t('light.editor.color_free')}
                            className="size-9 rounded-lg border border-app-border cursor-pointer p-0 bg-transparent shrink-0"
                        />
                    </div>
                    <p className="text-ui-10 text-slate-500 leading-snug">{t('light.editor.color_hint')}</p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        onClick={onAnnuler}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-app-text transition-colors"
                    >
                        {t('light.grid.cancel_button')}
                    </button>
                    <button
                        onClick={valider}
                        className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold hover:brightness-110 transition-all"
                    >
                        {t('light.grid.save_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};
