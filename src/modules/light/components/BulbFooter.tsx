import React, { useEffect, useRef } from 'react';
import { useLightStore } from '../useLightStore';
import type { HueLight } from '../useLightStore';
import { hueEngine } from '../HueEngine';
import { creerLimiteur } from '../logic/limiterLaCadence';
import {
    estUneVariante, identifiantDeVariante, idDepuisLIdentifiant,
    FORCE_MIN, FORCE_MAX,
} from '../logic/varianteDEffet';
import { VITESSE_EFFET_MIN, VITESSE_EFFET_MAX } from '../useLightStore';
import { useTranslation } from 'react-i18next';

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

export const BulbFooter: React.FC = () => {
    const { lights, updateLightState } = useLightStore();
    const { t } = useTranslation('modules');
    const lightList = Object.values(lights);

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

    if (lightList.length === 0) {
        return (
        /*
          ⚠️ `shrink-0` — son voisin porte `flex-1`, et sans cette garde ce pied
          de page peut être écrasé à zéro quand la place manque. *Le message qui
          dirait « aucune lampe » est justement celui qui disparaîtrait* — et on
          chercherait la panne ailleurs.
        */
        <footer className="bg-app-surface/50 border-t border-app-border p-4 h-24 shrink-0 flex items-center justify-center">
                <span className="text-slate-500 font-bold text-xs">{t('light.footer.no_lights')}</span>
            </footer>
        );
    }

    return (
        <footer className="bg-app-surface/50 border-t border-app-border p-4 shrink-0">
            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                {lightList.map((light: HueLight) => {
                    const isOn = light.state.on;
                    const effect = light.state.effect || 'none';
                    return (
                        <div key={light.id} className="flex-none w-64 bg-app-bg/80 rounded-lg p-3 border border-app-border flex items-center gap-4">
                            <button
                                onClick={() => toggleLight(light.id, isOn)}
                                className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-all ${isOn ? 'bg-amber-500 shadow-glow-accent' : 'bg-app-surface'}
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-xl ${isOn ? 'text-white' : 'text-slate-500'}`}>lightbulb</span>
                            </button>
                            <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                                <span className="text-xs font-bold text-slate-200 truncate">{light.name}</span>
                                <div className="flex items-center gap-3 mt-1">
                                    <input
                                        type="color"
                                        onChange={(e) => handleColorChange(light.id, e.target.value)}
                                        className="size-6 rounded border border-app-border cursor-pointer p-0 bg-transparent hover:border-accent/50 transition-colors"
                                        title={t('light.footer.change_color')}
                                    />
                                    <div className="flex items-center bg-app-bg/80 border border-app-border rounded px-2 py-1 w-full hover:border-accent/30 transition-colors">
                                        <span className="material-symbols-outlined text-sm text-slate-500 mr-2">tune</span>
                                        <select
                                            value={effect}
                                            onChange={(e) => handleEffectChange(light.id, e.target.value)}
                                            className="bg-transparent border-none p-0 text-xs font-bold text-accent focus:ring-0 cursor-pointer outline-none w-full"
                                        >
                                            <option value="none" className="bg-app-bg text-app-text/50">{t('light.footer.effects.steady')}</option>
                                            <option value="colorloop" className="bg-app-bg text-accent">{t('light.footer.effects.colorloop')}</option>

                                            {/*
                                              ⭐ **Les ambiances du meneur passent EN TÊTE.**
                                              Ce sont les siennes : les chercher après
                                              quarante-sept effets d'usine serait leur donner
                                              le rang de l'exception. Le groupe disparaît
                                              tant qu'il n'y en a aucune — *un groupe vide
                                              est une promesse qui ne tient pas.*
                                            */}
                                            {variantes.length > 0 && (
                                                <optgroup label={t('light.footer.categories.ambiances')} className="bg-app-bg text-slate-400">
                                                    {variantes.map(v => (
                                                        <option key={v.id} value={identifiantDeVariante(v.id)} className="text-amber-200">
                                                            {v.nom}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            
                                            <optgroup label={t('light.footer.categories.urban')} className="bg-app-bg text-slate-400">
                                                <option value="lumiere-ville" className="text-amber-500">{t('light.footer.effects.lumiere-ville')}</option>
                                                <option value="terminal" className="text-green-500">{t('light.footer.effects.terminal')}</option>
                                                <option value="cyber-night" className="text-fuchsia-500">{t('light.footer.effects.cyber-night')}</option>
                                                <option value="neon" className="text-pink-500">{t('light.footer.effects.neon')}</option>
                                                <option value="stroboscope" className="text-white">{t('light.footer.effects.stroboscope')}</option>
                                                <option value="police" className="text-blue-500">{t('light.footer.effects.police')}</option>
                                                <option value="sirene" className="text-red-500">{t('light.footer.effects.sirene')}</option>
                                                <option value="panne" className="text-amber-200">{t('light.footer.effects.panne')}</option>
                                                <option value="chute-de-tension" className="text-amber-300">{t('light.footer.effects.chute-de-tension')}</option>
                                            </optgroup>

                                            <optgroup label={t('light.footer.categories.nature')} className="bg-app-bg text-slate-400">
                                                <option value="foret-profonde" className="text-emerald-600">{t('light.footer.effects.foret-profonde')}</option>
                                                <option value="aurore" className="text-cyan-400">{t('light.footer.effects.aurore')}</option>
                                                <option value="crepuscule" className="text-orange-600">{t('light.footer.effects.crepuscule')}</option>
                                                <option value="underwater" className="text-cyan-500">{t('light.footer.effects.underwater')}</option>
                                                <option value="abysses" className="text-blue-800">{t('light.footer.effects.abysses')}</option>
                                                <option value="lever-soleil" className="text-orange-400">{t('light.footer.effects.lever-soleil')}</option>
                                                <option value="aube-doree" className="text-amber-300">{t('light.footer.effects.aube-doree')}</option>
                                                <option value="stores" className="text-amber-100">{t('light.footer.effects.stores')}</option>
                                                <option value="lightning" className="text-app-text/70">{t('light.footer.effects.storm')}</option>
                                            </optgroup>

                                            <optgroup label={t('light.footer.categories.fantasy')} className="bg-app-bg text-slate-400">
                                                <option value="candle" className="text-amber-500">{t('light.footer.effects.candle')}</option>
                                                <option value="fire" className="text-red-500">{t('light.footer.effects.fire')}</option>
                                                <option value="incendie" className="text-orange-600">{t('light.footer.effects.incendie')}</option>
                                                <option value="torche" className="text-orange-400">{t('light.footer.effects.torche')}</option>
                                                <option value="lave" className="text-orange-700">{t('light.footer.effects.lave')}</option>
                                                <option value="arcane" className="text-purple-400">{t('light.footer.effects.arcane')}</option>
                                                <option value="dragon" className="text-orange-500">{t('light.footer.effects.dragon')}</option>
                                                <option value="holy" className="text-yellow-300">{t('light.footer.effects.holy')}</option>
                                                <option value="fantome" className="text-blue-200">{t('light.footer.effects.fantome')}</option>
                                            </optgroup>

                                            <optgroup label={t('light.footer.categories.space')} className="bg-app-bg text-slate-400">
                                                <option value="neant" className="text-violet-900">{t('light.footer.effects.neant')}</option>
                                                <option value="trou-noir" className="text-indigo-950">{t('light.footer.effects.trou-noir')}</option>
                                                <option value="hyperspace" className="text-cyan-300">{t('light.footer.effects.hyperspace')}</option>
                                                <option value="reacteur" className="text-blue-100">{t('light.footer.effects.reacteur')}</option>
                                                <option value="sonar" className="text-cyan-400">{t('light.footer.effects.sonar')}</option>
                                                <option value="passerelle" className="text-sky-300">{t('light.footer.effects.passerelle')}</option>
                                                <option value="alien" className="text-purple-700">{t('light.footer.effects.alien')}</option>
                                                {/*
                                                  ⛔ **`warp` existait partout sauf ici.** Il est codé
                                                  dans le moteur (`HueEngine`, `case 'warp'`), nommé
                                                  dans les deux langues (« Saut Spatial » / « Warp
                                                  Speed ») et cité en exemple dans `useLightStore` —
                                                  mais **aucune liste ne l'offrait**, donc personne ne
                                                  pouvait le choisir. *Une chaîne complète dont il
                                                  manque le bouton au bout : le même motif que
                                                  l'arrêt de scène du 07/09, à l'envers.*
                                                */}
                                                <option value="warp" className="text-indigo-300">{t('light.footer.effects.warp')}</option>
                                            </optgroup>

                                            <optgroup label={t('light.footer.categories.alerts')} className="bg-app-bg text-slate-400">
                                                <option value="alerte" className="text-red-600">{t('light.footer.effects.alerte')}</option>
                                                <option value="fusillade" className="text-orange-300">{t('light.footer.effects.fusillade')}</option>
                                                <option value="deflagration" className="text-orange-200">{t('light.footer.effects.deflagration')}</option>
                                                <option value="impact" className="text-red-400">{t('light.footer.effects.impact')}</option>
                                                <option value="heartbeat" className="text-red-600">{t('light.footer.effects.heartbeat')}</option>
                                                <option value="radiation" className="text-emerald-400">{t('light.footer.effects.radiation')}</option>
                                                <option value="toxique" className="text-lime-400">{t('light.footer.effects.toxique')}</option>
                                                <option value="glitch" className="text-green-400">{t('light.footer.effects.glitch')}</option>
                                                <option value="tv" className="text-cyan-200">{t('light.footer.effects.tv')}</option>
                                            </optgroup>

                                            <optgroup label={t('light.footer.categories.misc')} className="bg-app-bg text-slate-400">
                                                <option value="disco" className="text-fuchsia-400">{t('light.footer.effects.disco')}</option>
                                                <option value="flashlight" className="text-white">{t('light.footer.effects.flashlight')}</option>
                                                <option value="breathing" className="text-app-text/60">{t('light.footer.effects.breathing')}</option>
                                                <option value="zen" className="text-slate-100">{t('light.footer.effects.zen')}</option>
                                            </optgroup>
                                        </select>
                                    </div>

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
                                            className="shrink-0 size-7 rounded border border-app-border text-slate-400 hover:text-accent hover:border-accent/50 transition-colors flex items-center justify-center"
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
                                        <div className="mt-2 p-2 rounded-lg bg-app-bg/60 border border-app-border/40 flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    value={v.nom}
                                                    onChange={(e) => modifierUneVariante(v.id, { nom: e.target.value })}
                                                    className="flex-1 bg-transparent border-none p-0 text-xs font-bold text-amber-200 outline-none min-w-0"
                                                    title={t('light.footer.ambiances.name')}
                                                />
                                                <span className="text-ui-10 text-slate-500 shrink-0">
                                                    {t('light.footer.ambiances.from', {
                                                        source: t(`light.footer.effects.${v.source}`, { defaultValue: v.source }),
                                                    })}
                                                </span>
                                                <button
                                                    onClick={() => supprimerUneVariante(v.id)}
                                                    className="shrink-0 text-slate-500 hover:text-red-400 transition-colors"
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
                                                <span className="text-ui-10 font-mono text-slate-400 w-8 text-right shrink-0">
                                                    {Math.round(v.force * 100)}%
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm text-slate-500 shrink-0">speed</span>
                                                <input
                                                    type="range"
                                                    min={VITESSE_EFFET_MIN} max={VITESSE_EFFET_MAX} step={0.25}
                                                    value={v.vitesse}
                                                    onChange={(e) => modifierUneVariante(v.id, { vitesse: parseFloat(e.target.value) })}
                                                    title={t('light.footer.ambiances.speed')}
                                                    className="flex-1 h-1 bg-app-bg rounded-full appearance-none cursor-pointer accent-accent min-w-0"
                                                />
                                                <span className="text-ui-10 font-mono text-slate-400 w-8 text-right shrink-0">
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
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="material-symbols-outlined text-sm text-slate-500 shrink-0">light_mode</span>
                                    <input
                                        type="range"
                                        min={BRI_MIN}
                                        max={BRI_MAX}
                                        step={PAS_DE_BRILLANCE}
                                        value={light.state.bri ?? BRI_MAX}
                                        onChange={(e) => handleBrightnessChange(light.id, parseInt(e.target.value, 10))}
                                        title={t('light.footer.brightness')}
                                        className="flex-1 h-1 bg-app-bg rounded-full appearance-none cursor-pointer accent-accent"
                                    />
                                    <span className="text-ui-10 font-mono font-bold text-slate-400 w-8 text-right shrink-0">
                                        {enPourcent(light.state.bri ?? BRI_MAX)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </footer>
    );
};
