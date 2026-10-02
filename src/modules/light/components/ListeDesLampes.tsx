import React, { useEffect, useRef } from 'react';
import { useLightStore } from '../useLightStore';
import type { HueLight } from '../useLightStore';
import { hueEngine } from '../HueEngine';
import { creerLimiteur } from '../logic/limiterLaCadence';
import {
    estUneVariante, identifiantDeVariante, idDepuisLIdentifiant,
    FORCE_MIN, FORCE_MAX,
} from '../logic/varianteDEffet';
import { estUnEffetDAtelier, idDepuisLAtelier } from '../logic/effetDAtelier';
import { VITESSE_EFFET_MIN, VITESSE_EFFET_MAX } from '../useLightStore';
import SelecteurDEffet from './SelecteurDEffet';
import { useTranslation } from 'react-i18next';
import { Panneau } from '../../../components/socle';

/**
 * Les bornes de brillance du protocole Hue. **1 et non 0** : zéro n'est pas une
 * brillance, c'est une lampe éteinte — et l'interrupteur est juste à côté.
 */
const BRI_MIN = 1;
const BRI_MAX = 254;
/** Le pas du curseur : ~1 % de la plage, assez fin pour viser, assez gros pour ne pas noyer le pont. */
const PAS_DE_BRILLANCE = 2;

/**
 * **Une commande au pont toutes les 150 ms au plus, par lampe.**
 *
 * Le pont en accepte une dizaine par seconde en tout, et les effets logiciels
 * en consomment déjà. Un curseur laissé libre en émettrait soixante.
 */
const CADENCE_CURSEUR_MS = 150;

/** De la brillance Hue (1-254) au pourcentage qu'on montre au meneur. */
const enPourcent = (bri: number) => Math.round((bri / BRI_MAX) * 100);

export const ListeDesLampes: React.FC = () => {
    const { lights, updateLightState } = useLightStore();
    const { t } = useTranslation('modules');
    const lightList = Object.values(lights);

    /** Quelle lampe a son sélecteur ouvert. `null` = aucun. */
    const [selecteurOuvert, setSelecteurOuvert] = React.useState<string | null>(null);

    /** Le nom lisible d'un effet, d'une ambiance ou d'un effet d'atelier. */
    const nomDeLEffet = (valeur: string): string => {
        if (estUneVariante(valeur)) {
            return variantes.find(v => v.id === idDepuisLIdentifiant(valeur))?.nom
                ?? t('light.footer.selecteur.ambiance_perdue');
        }
        /* ⚠️ Sans cette branche, une lampe qui joue un effet d'atelier
           afficherait `atelier:a-1758…` sur son bouton — *un identifiant à
           l'écran est un défaut, même quand tout fonctionne.* */
        if (estUnEffetDAtelier(valeur)) {
            return effetsDAtelier.find(e => e.id === idDepuisLAtelier(valeur))?.nom
                ?? t('light.footer.selecteur.ambiance_perdue');
        }
        const cle = valeur === 'lightning' ? 'storm' : valeur === 'none' ? 'steady' : valeur;
        return t(`light.footer.effects.${cle}`, { defaultValue: valeur });
    };

    /* Les effets de l'atelier : ils n'ont ici qu'un nom à rendre — ils se
       règlent dans le sélecteur, qui porte l'atelier. */
    const effetsDAtelier = useLightStore(s => s.effetsDAtelier);

    /* Les ambiances du meneur, et les trois gestes qui les manipulent. */
    const variantes = useLightStore(s => s.variantes);
    const creerUneVariante = useLightStore(s => s.creerUneVariante);
    const modifierUneVariante = useLightStore(s => s.modifierUneVariante);
    const supprimerUneVariante = useLightStore(s => s.supprimerUneVariante);

    /**
     * **Dupliquer l'effet d'une lampe, et basculer dessus dans la foulée.**
     *
     * ⚠️ **La bascule n'est pas un confort, c'est ce qui rend la copie
     * visible.** Créer une ambiance sans la jouer laisserait le meneur devant
     * une liste où un nom de plus est apparu, sans rien à l'écran ni dans la
     * pièce — et l'éditeur, qui ne s'ouvre que sur l'ambiance jouée, resterait
     * fermé. *Un geste dont le résultat ne se voit nulle part ressemble à un
     * geste qui n'a pas marché.*
     */
    const dupliquer = (idLampe: string, effetSource: string) => {
        const nomSource = t(`light.footer.effects.${effetSource}`, { defaultValue: effetSource });
        const id = creerUneVariante(effetSource, nomSource);
        handleEffectChange(idLampe, identifiantDeVariante(id));
    };

    /* Le sélecteur est monté **une seule fois**, pas une par lampe : c'est une
       surcouche, et deux surcouches identiques empilées se disputeraient la
       touche Échap. */
    const lampeDuSelecteur = selecteurOuvert ? lights[selecteurOuvert] : null;

    /* Un limiteur pour tout le pied de page, mais qui compte par lampe : régler
       la deuxième ne doit pas faire attendre la première. */
    const limiteur = useRef(creerLimiteur(CADENCE_CURSEUR_MS));
    useEffect(() => {
        const courant = limiteur.current;
        return () => courant.annuler();
    }, []);

    /**
     * **Le curseur de brillance d'une lampe.**
     *
     * L'écran suit la main tout de suite ; le pont, lui, ne reçoit qu'une
     * valeur par intervalle — *la dernière*, donc celle où la main s'arrête.
     *
     * ⚠️ La valeur réglée ici est la brillance **nominale**, celle qu'une
     * capture enregistrera dans une tuile. Ce qu'on voit dans la pièce est
     * cette valeur passée par le curseur global, exactement comme pour une
     * scène : à 50 % de global, une lampe poussée au maximum éclaire à moitié.
     */
    const handleBrightnessChange = (id: string, bri: number) => {
        updateLightState(id, { bri, on: true });
        limiteur.current(id, () => {
            hueEngine.setLightState(id, { bri, on: true }, 200).catch(() => { });
        });
    };

    const handleColorChange = (id: string, hexColor: string) => {
        const xy = hueEngine.hexToXy(hexColor);
        hueEngine.setLightState(id, { xy, on: true });

        // Stop any effect ONLY if it's the native colorloop or 'none' (since software effects now support dynamic color changes)
        const currentEffect = useLightStore.getState().lights[id]?.state?.effect;
        if (currentEffect === 'none' || currentEffect === 'colorloop') {
            hueEngine.stopSoftwareEffect(id);
        }
    };

    const defaultColors: Record<string, string> = {
        'candle': '#ffb732',
        'fire': '#ff8a1e',
        'arcane': '#a855f7',
        'dragon': '#f97316',
        'holy': '#fff9e5',
        'radiation': '#84cc16',
        'underwater': '#06b6d4',
        'heartbeat': '#ef4444',
        'breathing': '#0ea5e9',
        'lumiere-ville': '#f59e0b',
        'foret-profonde': '#064e3b',
        'cyber-night': '#ff00ff',
        'disco': '#ffffff',
        'aurore': '#22c55e',
        'lave': '#ff4500',
        'fantome': '#e0f2fe',
        'terminal': '#22c55e',
        'stroboscope': '#ffffff',
        'crepuscule': '#f59e0b',
        /* L'or de l'aube tenue. Voir `HueEngine`, `case 'aube-doree'` : il
           respire entre ce ton et un or plus clair, sans jamais quitter les
           ors. ⚠️ Cale sur le creux du souffle, pas sur son sommet — c'est la
           couleur que le meneur doit reconnaître dans la liste. */
        'aube-doree': '#ff9a12',
        /* Le plein jour d'une bande, pas l'ombre : c'est la couleur que le
           meneur associe à « stores ». */
        'stores': '#fff1d0',
        'toxique': '#84cc16',
        'zen': '#fafaf9',
        'neant': '#2e1065',
        'alerte': '#ff0000',
        'abysses': '#1e3a8a',
        'trou-noir': '#4c1d95',
        'hyperspace': '#06b6d4',
        'reacteur': '#e0f2fe',
        'passerelle': '#bae6fd',
        'alien': '#701a75',
        'lever-soleil': '#450a0a',
        /* `warp` alterne rouge/vert/bleu : on part du rouge, comme son premier temps. */
        'warp': '#ff0000',
        /* Le blanc chaud d'un éclair de bouche. */
        'fusillade': '#fff4e0',
        'deflagration': '#ffffff',
        'impact': '#ff2000',
        'panne': '#fff3d0',
        'torche': '#ff8c21',
        'incendie': '#e02a00',
        'sonar': '#22d3ee',
        'sirene': '#dc2626',
        'chute-de-tension': '#fff7ed'
    };

    const handleEffectChange = (id: string, effectName: string) => {
        if (effectName === 'none') {
            /*
              ⛔ **Le seul arrêt qui doit rendre son état à la lampe.**

              Une boucle d'effet écrit `bri`, `xy` et `on` directement sur le
              pont sans passer par le magasin. L'arrêter ne faisait donc que
              couper la boucle : **la lampe restait à la valeur où le dernier
              battement l'avait laissée.** Choisir « Fixe » sur un fantôme
              pouvait rendre une lampe presque éteinte, et sur un stroboscope
              une lampe au minimum — sans que rien ne le dise.

              C'est le seul des neuf appels de `stopSoftwareEffect` qui n'est
              suivi d'aucune pose d'état. *Les huit autres n'ont rien à
              restaurer : ils écrivent juste après.*
            */
            hueEngine.stopSoftwareEffect(id, 'rendreLEtat');
        } else {
            const defaultColor = defaultColors[effectName];
            if (defaultColor) {
                const xy = hueEngine.hexToXy(defaultColor);
                hueEngine.setLightState(id, { xy, on: true });
            }
            hueEngine.startSoftwareEffect(id, effectName);
        }
    };

    const toggleLight = (id: string, currentState: boolean) => {
        hueEngine.setLightState(id, { on: !currentState });
        hueEngine.stopSoftwareEffect(id);
    };

    /*
      **Les lampes en liste verticale, dans le panneau de réglages** — refonte,
      L2, étape 2 (2026-10-02). Elles vivaient dans un pied de page qui
      défilait à l'horizontale : *« la disposition des lampes »* était l'une
      des deux plaintes de David sur Light-OS, et le 2026-09-17 ce pied était
      déjà passé sous la ligne de flottaison. En colonne, chaque lampe a sa
      ligne, et la grille des tuiles garde toute la hauteur.
    */
    return (
        <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-ui-11 font-semibold text-app-muted uppercase tracking-widest">{t('light.agencement.lampes')}</h2>
                <span className="text-ui-10 text-app-subtle">{t('light.agencement.lampes_nombre', { nombre: lightList.length })}</span>
            </div>

            {lightList.length === 0 && (
                <p className="text-xs font-bold text-app-subtle">{t('light.footer.no_lights')}</p>
            )}

            {lightList.map((light: HueLight) => {
                const isOn = light.state.on;
                const effect = light.state.effect || 'none';
                return (
                    <div key={light.id} className="flex flex-col gap-2 rounded-lg border border-app-border bg-app-bg/60 p-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleLight(light.id, isOn)}
                                aria-pressed={isOn}
                                title={light.name}
                                className={`size-8 rounded-full flex items-center justify-center shrink-0 transition-all ${isOn ? 'bg-gm-gold shadow-glow-accent' : 'bg-app-surface border border-app-border'}`}
                            >
                                <span className={`material-symbols-outlined text-lg ${isOn ? 'text-app-bg' : 'text-app-subtle'}`}>lightbulb</span>
                            </button>
                            <span className="min-w-0 flex-1 truncate text-xs font-bold text-app-text">{light.name}</span>
                            <input
                                type="color"
                                onChange={(e) => handleColorChange(light.id, e.target.value)}
                                className="size-6 shrink-0 rounded border border-app-border cursor-pointer p-0 bg-transparent hover:border-accent/50 transition-colors"
                                title={t('light.footer.change_color')}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            {/*
                              ⛔ **La liste déroulante a été retirée le 2026-09-18.**

                              Elle portait **cinquante entrées** une fois les
                              ambiances du meneur ajoutées. David, après avoir
                              créé ses premières copies : *« je ne retrouve pas
                              les différentes copies d'un effet »*, puis *« la
                              liste déroulante n'est plus adaptée avec 40 items »*.

                              ⭐ *Une liste déroulante de cinquante entrées n'est
                              plus une liste, c'est un couloir* — on y descend,
                              on dépasse ce qu'on cherchait, on remonte. Et rien
                              ne s'y cherche.
                            */}
                            <button
                                onClick={() => setSelecteurOuvert(light.id)}
                                className="flex min-w-0 flex-1 items-center gap-2 rounded border border-app-border bg-app-bg/80 px-2 py-1 hover:border-accent/30 transition-colors"
                                title={t('light.footer.selecteur.ouvrir')}
                            >
                                <span className="material-symbols-outlined text-sm text-app-subtle shrink-0">tune</span>
                                <span className="truncate text-xs font-bold text-accent">
                                    {nomDeLEffet(effect)}
                                </span>
                            </button>

                            {/*
                              **Dupliquer l'effet joué par cette lampe.**

                              Le bouton ne s'offre que sur un effet du
                              catalogue : dupliquer une ambiance donnerait
                              une copie de copie dont plus personne ne
                              saurait dire de quoi elle descend. *Une
                              variante désigne toujours un effet réel.*
                            */}
                            {effect !== 'none' && effect !== 'colorloop' && !estUneVariante(effect) && (
                                <button
                                    onClick={() => dupliquer(light.id, effect)}
                                    className="shrink-0 size-7 rounded border border-app-border text-app-muted hover:text-accent hover:border-accent/50 transition-colors flex items-center justify-center"
                                    title={t('light.footer.ambiances.duplicate')}
                                >
                                    <span className="material-symbols-outlined text-sm">palette</span>
                                </button>
                            )}
                        </div>

                        {/*
                          **L'éditeur d'ambiance** — il n'apparaît que sur la
                          lampe qui joue l'ambiance qu'on retouche, et il montre
                          son effet d'origine : sans ça, une liste de noms
                          inventés par le meneur ne dit plus de quoi chacun
                          descend.
                        */}
                        {estUneVariante(effect) && (() => {
                            const v = variantes.find(x => x.id === idDepuisLIdentifiant(effect));
                            if (!v) return null;
                            return (
                                <div className="p-2 rounded-lg bg-app-bg/60 border border-app-border/40 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={v.nom}
                                            onChange={(e) => modifierUneVariante(v.id, { nom: e.target.value })}
                                            className="flex-1 bg-transparent border-none p-0 text-xs font-bold text-gm-gold outline-none min-w-0"
                                            title={t('light.footer.ambiances.name')}
                                        />
                                        <span className="text-ui-10 text-app-subtle shrink-0">
                                            {t('light.footer.ambiances.from', {
                                                source: t(`light.footer.effects.${v.source}`, { defaultValue: v.source }),
                                            })}
                                        </span>
                                        <button
                                            onClick={() => supprimerUneVariante(v.id)}
                                            className="shrink-0 text-app-subtle hover:text-etat-danger transition-colors"
                                            title={t('light.footer.ambiances.delete')}
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={v.teinte ?? '#ffb347'}
                                            onChange={(e) => modifierUneVariante(v.id, { teinte: e.target.value })}
                                            className="size-6 rounded border border-app-border cursor-pointer p-0 bg-transparent shrink-0"
                                            title={t('light.footer.ambiances.tint')}
                                        />
                                        <input
                                            type="range"
                                            min={FORCE_MIN} max={FORCE_MAX} step={0.05}
                                            value={v.force}
                                            onChange={(e) => modifierUneVariante(v.id, { force: parseFloat(e.target.value) })}
                                            title={t('light.footer.ambiances.force')}
                                            className="flex-1 h-1 bg-app-bg rounded-full appearance-none cursor-pointer accent-accent min-w-0"
                                        />
                                        <span className="text-ui-10 font-mono text-app-muted w-8 text-right shrink-0">
                                            {Math.round(v.force * 100)}%
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-app-subtle shrink-0">speed</span>
                                        <input
                                            type="range"
                                            min={VITESSE_EFFET_MIN} max={VITESSE_EFFET_MAX} step={0.25}
                                            value={v.vitesse}
                                            onChange={(e) => modifierUneVariante(v.id, { vitesse: parseFloat(e.target.value) })}
                                            title={t('light.footer.ambiances.speed')}
                                            className="flex-1 h-1 bg-app-bg rounded-full appearance-none cursor-pointer accent-accent min-w-0"
                                        />
                                        <span className="text-ui-10 font-mono text-app-muted w-8 text-right shrink-0">
                                            ×{v.vitesse}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/*
                          **La brillance de la lampe**, qui n'existait
                          nulle part : on pouvait choisir sa couleur et
                          son effet, mais son intensité venait de
                          l'application Hue et d'elle seule — et c'est
                          cette valeur-là que la capture d'une tuile
                          enregistre.
                        */}
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-app-subtle shrink-0">light_mode</span>
                            <input
                                type="range"
                                min={BRI_MIN}
                                max={BRI_MAX}
                                step={PAS_DE_BRILLANCE}
                                value={light.state.bri ?? BRI_MAX}
                                onChange={(e) => handleBrightnessChange(light.id, parseInt(e.target.value, 10))}
                                title={t('light.footer.brightness')}
                                className="min-w-0 flex-1 h-1 bg-app-bg rounded-full appearance-none cursor-pointer accent-accent"
                            />
                            <span className="text-ui-10 font-mono font-bold text-app-muted w-9 text-right shrink-0">
                                {enPourcent(light.state.bri ?? BRI_MAX)}%
                            </span>
                        </div>
                    </div>
                );
            })}

            {lampeDuSelecteur && (
                <SelecteurDEffet
                    effetActuel={lampeDuSelecteur.state.effect || 'none'}
                    nomDeLaLampe={lampeDuSelecteur.name}
                    onChoisir={(valeur) => handleEffectChange(lampeDuSelecteur.id, valeur)}
                    onFermer={() => setSelecteurOuvert(null)}
                />
            )}
        </Panneau>
    );
};
