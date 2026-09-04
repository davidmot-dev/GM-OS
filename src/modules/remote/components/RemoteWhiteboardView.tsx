import React, { useState } from 'react';
import {
    Pencil,
    Eraser,
    Square,
    Circle,
    Zap,
    RotateCcw,
    RotateCw,
    Trash2,
    Sun,
    Moon,
} from 'lucide-react';
import RemoteDrawingCanvas from './RemoteDrawingCanvas';
import { type DrawingPath, type Point, type WhiteboardTool } from '../types/remote.types';

/**
 * **Le tableau blanc de la télécommande, réparé le 2026-09-05.**
 *
 * Il portait le défaut le plus coûteux de cette tablette : le meneur envoyait
 * **quatre** des sept champs déclarés du tableau, et les trois manquants —
 * outil, couleur, épaisseur — restaient à leur valeur de départ. Comme le
 * canevas les recopie dans chaque tracé qu'il émet, **tout ce qu'on dessinait
 * depuis la tablette partait en crayon blanc d'épaisseur 3**, quel que soit le
 * bouton touché. La gomme dessinait au lieu d'effacer.
 *
 * Ils sont envoyés maintenant. Reste le trajet : toucher « Gomme » traverse le
 * réseau, atteint le magasin du meneur, et ne revient qu'à la synchronisation
 * suivante — *entre les deux, un doigt qui dessine tout de suite émettrait
 * encore l'ancien outil.* D'où l'**écho optimiste** ci-dessous : le choix
 * s'applique sur-le-champ et l'aller-retour vient le confirmer.
 */

interface RemoteWhiteboardViewProps {
    whiteboard: {
        paths: DrawingPath[];
        activePath: DrawingPath | null;
        laserPointer: Point | null;
        backgroundMode: 'dark' | 'light';
        currentTool: WhiteboardTool;
        currentColor: string;
        currentWidth: number;
    };
    onAction: (type: string, payload: unknown) => void;
}

const OUTILS = [
    { id: 'brush', icon: Pencil, label: 'Crayon' },
    { id: 'eraser', icon: Eraser, label: 'Gomme' },
    { id: 'laser', icon: Zap, label: 'Laser' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Cercle' },
] as const;

/** Trois épaisseurs plutôt qu'un curseur : trois appuis valent mieux qu'un glissement. */
const EPAISSEURS = [
    { valeur: 2, titre: 'Fin', point: 4 },
    { valeur: 4, titre: 'Moyen', point: 7 },
    { valeur: 8, titre: 'Épais', point: 11 },
] as const;

/**
 * **L'écho optimiste.**
 *
 * Le meneur détient la vérité — c'est lui qui résout, et deux sources pour un
 * même réglage finiraient par diverger. Mais son écho met un aller-retour à
 * revenir, et pendant ce temps un doigt peut déjà dessiner.
 *
 * On applique donc le choix localement **jusqu'à ce que le meneur confirme la
 * même valeur**, puis on lui rend la main. Un changement fait sur l'écran du
 * meneur arrive donc bien sur la tablette : rien n'est en attente, la valeur
 * reçue s'applique directement.
 */
function useEchoOptimiste<T>(valeurDuMeneur: T): [T, (v: T) => void] {
    const [enAttente, setEnAttente] = useState<T | null>(null);
    const [valeurPrecedente, setValeurPrecedente] = useState(valeurDuMeneur);

    /*
      **Toute valeur neuve venue du meneur lève l'attente** — que ce soit l'écho
      de notre propre choix ou un changement fait sur son écran. On compare à la
      valeur *précédemment reçue* et non à la nôtre : sans quoi un réglage changé
      côté meneur pendant qu'on attend resterait bloqué sur notre choix.

      C'est l'ajustement en phase de rendu que React documente, et le motif
      qu'emploie déjà `RemoteDicePad` pour suivre le pilote actif.
    */
    if (valeurDuMeneur !== valeurPrecedente) {
        setValeurPrecedente(valeurDuMeneur);
        setEnAttente(null);
        return [valeurDuMeneur, setEnAttente];
    }

    return [enAttente ?? valeurDuMeneur, setEnAttente];
}

const RemoteWhiteboardView: React.FC<RemoteWhiteboardViewProps> = ({ whiteboard, onAction }) => {
    const [outil, poserOutil] = useEchoOptimiste(whiteboard.currentTool);
    const [couleur, poserCouleur] = useEchoOptimiste(whiteboard.currentColor);
    const [epaisseur, poserEpaisseur] = useEchoOptimiste(whiteboard.currentWidth);
    const [fond, poserFond] = useEchoOptimiste(whiteboard.backgroundMode);

    const enClair = fond === 'light';

    const couleurs = [
        enClair ? '#000000' : '#ffffff',
        '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4',
    ];

    /* Le canevas ne doit dessiner qu'avec ce que le meneur enregistrera : on lui
       passe l'état effectif, écho compris, et jamais les props brutes. */
    const tableauEffectif = {
        ...whiteboard,
        currentTool: outil,
        currentColor: couleur,
        currentWidth: epaisseur,
        backgroundMode: fond,
    };

    const choisir = <T,>(type: string, valeur: T, poser: (v: T) => void) => {
        poser(valeur);
        onAction(type, valeur);
    };

    return (
        <div className={`h-full w-full flex flex-col relative overflow-hidden rounded-xl border ${enClair ? 'bg-white border-slate-200' : 'bg-slate-950 border-white/10'}`}>
            <div className={`shrink-0 flex items-center justify-between gap-2 p-1.5 border-b ${enClair ? 'bg-white/80 border-slate-200' : 'bg-slate-900/80 border-white/10'}`}>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {OUTILS.map((o) => (
                        <button
                            key={o.id}
                            onClick={() => choisir('whiteboard:set-tool', o.id as WhiteboardTool, poserOutil)}
                            className={`p-2 rounded-lg transition-colors shrink-0 ${outil === o.id
                                ? 'bg-accent text-white'
                                : enClair ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}
                            title={o.label}
                            aria-label={o.label}
                            aria-pressed={outil === o.id}
                        >
                            <o.icon size={18} />
                        </button>
                    ))}

                    <div className={`w-px h-5 mx-1 shrink-0 ${enClair ? 'bg-slate-200' : 'bg-white/10'}`} />

                    {/*
                      **L'épaisseur, offerte pour la première fois.**
                      `whiteboard:set-width` avait son handler côté meneur et son
                      contrôle dans `registry.test.ts` — et **aucun émetteur**.
                      La tablette dessinait à l'épaisseur que le meneur avait
                      laissée, sans moyen d'en changer.
                    */}
                    {EPAISSEURS.map((e) => (
                        <button
                            key={e.valeur}
                            onClick={() => choisir('whiteboard:set-width', e.valeur, poserEpaisseur)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${epaisseur === e.valeur
                                ? 'bg-accent/20 ring-1 ring-accent'
                                : enClair ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}
                            title={`Trait ${e.titre.toLowerCase()}`}
                            aria-label={`Trait ${e.titre.toLowerCase()}`}
                            aria-pressed={epaisseur === e.valeur}
                        >
                            <span
                                className={`rounded-full block ${epaisseur === e.valeur ? 'bg-accent' : enClair ? 'bg-slate-400' : 'bg-slate-500'}`}
                                style={{ width: e.point, height: e.point }}
                            />
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {/*
                      **Le fond clair, branché des deux côtés.**
                      `whiteboard:set-background` était déclaré dans les types,
                      sans émetteur ici **et sans destinataire** chez le meneur :
                      une action morte de bout en bout.
                    */}
                    <button
                        onClick={() => choisir('whiteboard:set-background', enClair ? 'dark' : 'light', poserFond)}
                        className={`p-2 rounded-lg transition-colors ${enClair ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}
                        title={enClair ? 'Passer en fond sombre' : 'Passer en fond clair'}
                        aria-label={enClair ? 'Passer en fond sombre' : 'Passer en fond clair'}
                    >
                        {enClair ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                    <button
                        onClick={() => onAction('whiteboard:undo', null)}
                        className={`p-2 rounded-lg transition-colors ${enClair ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}
                        title="Annuler" aria-label="Annuler"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button
                        onClick={() => onAction('whiteboard:redo', null)}
                        className={`p-2 rounded-lg transition-colors ${enClair ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}
                        title="Rétablir" aria-label="Rétablir"
                    >
                        <RotateCw size={16} />
                    </button>
                    <button
                        onClick={() => onAction('whiteboard:clear', null)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Effacer tout" aria-label="Effacer tout"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/*
              **Le canevas prend toute la place restante.** Il portait
              `aspect-video max-h-[55vh] md:max-h-[60vh]` — une provision taillée
              pour l'ancienne disposition, où les trois rangées dépassaient la
              hauteur disponible et où le `flex-shrink` écrasait le canevas, lui
              faisant perdre le 16/9 que la classe prétendait garantir.

              `flex-1 min-h-0` le laisse remplir : *ce qui compte ici est la
              surface de dessin, et c'est elle qui doit recevoir la place rendue.*
            */}
            <div className={`flex-1 min-h-0 relative overflow-hidden ${enClair ? 'bg-white' : 'bg-slate-900/40'}`}>
                <RemoteDrawingCanvas
                    whiteboard={tableauEffectif}
                    onAction={onAction}
                />
            </div>

            <div className={`shrink-0 flex items-center gap-2 p-2 border-t overflow-x-auto no-scrollbar justify-center ${enClair ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-white/10'}`}>
                {couleurs.map((c) => (
                    <button
                        key={c}
                        onClick={() => choisir('whiteboard:set-color', c, poserCouleur)}
                        className={`size-7 rounded-full border transition-transform shrink-0 bg-[var(--swatch-color)] ${couleur === c
                            ? `scale-110 ring-2 ring-accent ring-offset-2 ${enClair ? 'ring-offset-slate-50' : 'ring-offset-slate-900'}`
                            : 'border-white/20 hover:scale-105'}`}
                        style={{ '--swatch-color': c } as React.CSSProperties}
                        title={`Couleur ${c}`}
                        aria-label={`Choisir la couleur ${c}`}
                        aria-pressed={couleur === c}
                    />
                ))}
            </div>
        </div>
    );
};

export default RemoteWhiteboardView;
