import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, Plus, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import { useLightStore } from '../useLightStore';
import { hueEngine } from '../HueEngine';
import {
    identifiantDAtelier, etapeBornee,
    DUREE_MINIMALE_MS, DUREE_MAXIMALE_MS,
    type EtapeDEffet,
} from '../logic/effetDAtelier';

/**
 * **L'atelier : fabriquer un effet de zéro, et le voir pendant qu'on l'écrit.**
 *
 * Demandé par David le 2026-09-18 (*« je me demande si on ne devrait pas faire
 * un module de création d'ambiance »*), puis précisé le 20/09 : **créer** un
 * effet, pas décliner un des quarante-huit.
 *
 * ⭐ **Un effet est une suite d'étapes, et rien d'autre.** Une lampe Hue ne sait
 * qu'obéir à *va à cette couleur et à cette brillance, en tant de temps* : tout
 * le catalogue n'est que des façons d'enchaîner cet ordre-là. L'atelier expose
 * donc exactement ces quatre nombres, plus le **désordre** qui sépare une suite
 * d'un geste. Le raisonnement vit dans `logic/effetDAtelier.ts`.
 *
 * ⛔ **Il se règle sur une lampe qui joue.** Une couleur ne se juge pas dans un
 * champ de saisie, et un rythme encore moins : le moteur relit l'effet à chaque
 * passage, donc chaque retouche se voit au tour suivant. *C'est la leçon du
 * curseur d'intensité du 09/09, et c'est ici qu'elle compte le plus.*
 */

interface Props {
    /** L'effet à régler — il existe déjà quand cet écran s'ouvre. */
    effetId: string;
    onFermer: () => void;
}

/** Un champ de nombre borné, avec son unité — trois fois la même forme. */
const Nombre: React.FC<{
    valeur: number;
    min: number;
    max: number;
    pas: number;
    unite: string;
    onChange: (v: number) => void;
}> = ({ valeur, min, max, pas, unite, onChange }) => (
    <div className="flex items-center gap-1">
        <input
            type="number"
            value={valeur}
            min={min}
            max={max}
            step={pas}
            onChange={e => onChange(Number(e.target.value))}
            className="w-16 bg-app-bg/60 border border-app-border/30 rounded px-1.5 py-1 text-ui-10 text-app-text text-right tabular-nums outline-none focus:border-accent/50"
        />
        <span className="text-ui-9 text-app-text/30 w-6">{unite}</span>
    </div>
);

export const AtelierDEffet: React.FC<Props> = ({ effetId, onFermer }) => {
    const effet = useLightStore(s => s.effetsDAtelier.find(e => e.id === effetId));
    const lampes = useLightStore(s => s.lights);
    const modifier = useLightStore(s => s.modifierUnEffetDAtelier);

    const listeDesLampes = Object.values(lampes);
    const [lampeDEssai, setLampeDEssai] = useState<string | null>(null);

    useFermetureParEchap(true, onFermer, 'Atelier d’effet');

    /*
      ⛔ **L'essai ne survit pas à l'atelier.** On ferme l'écran, la lampe
      garderait un effet qu'on ne voit plus nulle part — et le seul moyen de
      l'arrêter serait de retrouver cette lampe dans le pied de page. *Une porte
      de sortie qui disparaît avec le panneau n'est pas une porte de sortie*,
      la même règle que l'essai d'une ambiance composée.
    */
    const lampeDEssaiRef = useRef<string | null>(null);
    useEffect(() => { lampeDEssaiRef.current = lampeDEssai; }, [lampeDEssai]);
    useEffect(() => () => {
        if (lampeDEssaiRef.current) hueEngine.stopSoftwareEffect(lampeDEssaiRef.current, 'rendreLEtat');
    }, []);

    if (!effet) return null;

    const etapes = effet.etapes;

    const poserLesEtapes = (suite: EtapeDEffet[]) => modifier(effetId, { etapes: suite });

    const retoucher = (index: number, retouche: Partial<EtapeDEffet>) =>
        poserLesEtapes(etapes.map((e, i) => (i === index ? etapeBornee({ ...e, ...retouche }) : e)));

    const ajouter = () => poserLesEtapes([...etapes, { ...etapes[etapes.length - 1] ?? {
        couleur: '#ffffff', brillance: 60, duree: 1000, fondu: 400,
    } }]);

    /* ⚠️ La dernière étape ne se supprime pas : un effet sans étape ne joue
       rien, et l'écran n'aurait plus rien à montrer. */
    const supprimer = (index: number) => {
        if (etapes.length <= 1) return;
        poserLesEtapes(etapes.filter((_, i) => i !== index));
    };

    const deplacer = (index: number, sens: -1 | 1) => {
        const cible = index + sens;
        if (cible < 0 || cible >= etapes.length) return;
        const suite = [...etapes];
        [suite[index], suite[cible]] = [suite[cible], suite[index]];
        poserLesEtapes(suite);
    };

    const basculerLEssai = (idLampe: string) => {
        if (lampeDEssai === idLampe) {
            hueEngine.stopSoftwareEffect(idLampe, 'rendreLEtat');
            setLampeDEssai(null);
            return;
        }
        if (lampeDEssai) hueEngine.stopSoftwareEffect(lampeDEssai, 'rendreLEtat');
        hueEngine.startSoftwareEffect(idLampe, identifiantDAtelier(effetId));
        setLampeDEssai(idLampe);
    };

    /** La durée totale d'un tour, pour donner les proportions de l'aperçu. */
    const tour = etapes.reduce((somme, e) => somme + e.duree, 0) || 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-app-surface border border-app-border/20 shadow-2xl overflow-hidden">

                <div className="flex items-center gap-3 p-4 border-b border-app-border/10">
                    <input
                        value={effet.nom}
                        onChange={e => modifier(effetId, { nom: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Escape') e.stopPropagation(); }}
                        placeholder="Nom de l’effet"
                        className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-app-text outline-none min-w-0"
                    />
                    <button onClick={onFermer} className="p-1 text-app-text/30 hover:text-app-text shrink-0">
                        <X size={18} />
                    </button>
                </div>

                {/*
                  L'aperçu : chaque étape occupe sa part du tour, et sa teinte
                  s'assombrit avec sa brillance. ⚠️ **Il montre la SUITE, pas le
                  rendu** — le désordre et le fondu ne s'y voient pas, et aucune
                  bande de couleur ne dira jamais ce que fait une lampe dans une
                  pièce. *C'est un plan, pas une photographie ; l'essai est là
                  pour le reste.*
                */}
                <div className="px-4 pt-4 flex flex-col gap-1.5">
                    <div className="flex h-8 rounded-lg overflow-hidden border border-app-border/20">
                        {etapes.map((e, i) => (
                            <div
                                key={i}
                                style={{
                                    width: `${(e.duree / tour) * 100}%`,
                                    backgroundColor: e.couleur,
                                    opacity: 0.15 + (e.brillance / 100) * 0.85,
                                }}
                                title={`${e.brillance} % · ${e.duree} ms`}
                            />
                        ))}
                    </div>
                    <p className="text-ui-9 text-app-text/30 uppercase tracking-widest">
                        un tour = {(tour / 1000).toFixed(1)} s · {etapes.length} étape{etapes.length > 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2">
                    {etapes.map((etape, i) => (
                        <div
                            key={i}
                            className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-app-bg/60 border border-app-border/30"
                        >
                            <span className="text-ui-9 text-app-text/25 w-4 tabular-nums">{i + 1}</span>

                            <input
                                type="color"
                                value={etape.couleur}
                                onChange={e => retoucher(i, { couleur: e.target.value })}
                                className="size-7 rounded border border-app-border/30 bg-transparent cursor-pointer shrink-0"
                                title="La couleur de l’étape"
                            />

                            <label className="flex items-center gap-1.5 flex-1 min-w-[9rem]">
                                <span className="text-ui-9 text-app-text/30 uppercase tracking-widest">lum</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={etape.brillance}
                                    onChange={e => retoucher(i, { brillance: Number(e.target.value) })}
                                    className="flex-1 accent-accent min-w-0"
                                />
                                <span className="text-ui-9 text-app-text/40 w-9 text-right tabular-nums">
                                    {etape.brillance} %
                                </span>
                            </label>

                            <label className="flex items-center gap-1" title="Le temps passé sur cette étape">
                                <span className="text-ui-9 text-app-text/30 uppercase tracking-widest">durée</span>
                                <Nombre
                                    valeur={etape.duree}
                                    min={DUREE_MINIMALE_MS}
                                    max={DUREE_MAXIMALE_MS}
                                    pas={100}
                                    unite="ms"
                                    onChange={v => retoucher(i, { duree: v })}
                                />
                            </label>

                            <label className="flex items-center gap-1" title="Le temps mis pour y arriver — zéro change d’un coup">
                                <span className="text-ui-9 text-app-text/30 uppercase tracking-widest">fondu</span>
                                <Nombre
                                    valeur={etape.fondu}
                                    min={0}
                                    max={etape.duree}
                                    pas={100}
                                    unite="ms"
                                    onChange={v => retoucher(i, { fondu: v })}
                                />
                            </label>

                            <div className="flex items-center gap-0.5 ml-auto shrink-0">
                                <button
                                    onClick={() => deplacer(i, -1)}
                                    disabled={i === 0}
                                    className="p-1 text-app-text/25 hover:text-app-text disabled:opacity-20"
                                    title="Monter"
                                >
                                    <ChevronUp size={14} />
                                </button>
                                <button
                                    onClick={() => deplacer(i, 1)}
                                    disabled={i === etapes.length - 1}
                                    className="p-1 text-app-text/25 hover:text-app-text disabled:opacity-20"
                                    title="Descendre"
                                >
                                    <ChevronDown size={14} />
                                </button>
                                <button
                                    onClick={() => supprimer(i)}
                                    disabled={etapes.length <= 1}
                                    className="p-1 text-app-text/25 hover:text-red-400 disabled:opacity-20"
                                    title={etapes.length <= 1 ? 'Un effet garde au moins une étape' : 'Supprimer cette étape'}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={ajouter}
                        className="flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-app-border/40 text-app-text/40 hover:text-accent hover:border-accent/50 transition-colors text-ui-10 font-bold uppercase tracking-widest"
                    >
                        <Plus size={13} /> Ajouter une étape
                    </button>
                </div>

                <div className="p-4 border-t border-app-border/10 flex flex-col gap-3">
                    {/*
                      ⭐ **Le désordre est le réglage qui fait le plus, et c'est
                      pour ça qu'il est seul en bas.** Une bougie sans lui est un
                      métronome ; à 30 %, c'est une flamme. Les quarante-huit
                      effets du catalogue tirent tous au sort quelque part.
                    */}
                    <label className="flex items-center gap-3">
                        <span className="text-ui-10 font-bold uppercase tracking-widest text-app-text/40 shrink-0">
                            désordre
                        </span>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={effet.alea}
                            onChange={e => modifier(effetId, { alea: Number(e.target.value) })}
                            className="flex-1 accent-accent min-w-0"
                        />
                        <span className="text-ui-10 text-app-text/40 w-10 text-right tabular-nums">
                            {effet.alea} %
                        </span>
                    </label>

                    {listeDesLampes.length === 0 ? (
                        <p className="text-ui-10 text-app-text/30 italic">
                            Aucune lampe connue : branchez le pont, ou passez Light-OS en mode simulé
                            pour composer à l’aveugle.
                        </p>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-ui-10 font-bold uppercase tracking-widest text-app-text/40">
                                essayer sur
                            </span>
                            {listeDesLampes.map(lampe => (
                                <button
                                    key={lampe.id}
                                    onClick={() => basculerLEssai(lampe.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-ui-10 font-bold transition-colors ${
                                        lampeDEssai === lampe.id
                                            ? 'border-amber-400/50 text-amber-400 bg-amber-400/10'
                                            : 'border-app-border/30 text-app-text/60 hover:border-accent/50 hover:text-accent'
                                    }`}
                                    title={lampeDEssai === lampe.id
                                        ? 'Rendre la lampe à ce qu’elle montrait'
                                        : 'Jouer l’effet sur cette lampe pendant que vous le réglez'}
                                >
                                    {lampeDEssai === lampe.id ? <Square size={11} /> : <Play size={11} />}
                                    <span className="truncate max-w-[8rem]">{lampe.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <p className="px-4 py-2 border-t border-app-border/10 text-ui-10 text-app-text/25">
                    Tout est enregistré au fur et à mesure. Une lampe qui joue l’effet suit vos
                    retouches au passage suivant.
                </p>
            </div>
        </div>
    );
};

export default AtelierDEffet;
