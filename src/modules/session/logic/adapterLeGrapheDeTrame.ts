import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { LIBELLE_DU_TYPE, type GrapheDeTrame, type NoeudDeTrame, type SourceDeLaTrame, type TypeDeNoeud } from './grapheDeLaTrame';
import { DIMENSIONS_DES_CARTES } from './geometrieDesCartesDeTrame';
import type { Position } from './rangementDeLaTrame';
import type { StyleDeLienDeTrame, OrganisationDeTrame, TrajetDeTrame } from '../../../types/campaign.types';
import { apparenceDuLien, accrocheDuLien, normaliserLeStyleDeLien } from './stylesDesLiensDeTrame';
import { trajetDeTrameValide } from './trajetsDeTrame';

/** Couleurs sémantiques : la palette effective vient du socle, y compris en clair. */
export const TEINTE_DE_TRAME: Record<TypeDeNoeud, string> = {
    acte: 'var(--app-text)', scene: 'var(--app-accent)', lieu: 'var(--etat-succes)',
    pnj: 'var(--etat-alerte)', indice: 'var(--etat-info)', pj: 'var(--app-accent)', ambiance: 'var(--etat-info)',
};
export type DonneesDeCarte = Record<string, unknown> & {
    noeud: NoeudDeTrame; acte?: string; lieu?: string; nombrePnj?: number; nombreIndices?: number;
    liaison: boolean; jonction: boolean; jonctionsMultiples?: boolean; extremite?: 'depart' | 'arrivee'; estompe: boolean;
};
export type CarteDeTrame = Node<DonneesDeCarte, 'trame'>;
export type TraitDeTrame = Edge<{ lien: GrapheDeTrame['liens'][number]; trajet?: TrajetDeTrame;
    commentaire?: string; pointsDePassage?: Position[]; pointsDuLien?: Position[];
    onModifierPoints?: (points?: Position[]) => void }, 'trame'>;

/** Épingle > instantané figé > mémoire de cette campagne > rangement. Jamais d'écriture. */
export function positionDeLaCarte(id: string, contexte: {
    epingles?: Record<string, Position>; instantane?: Record<string, Position>; fige?: boolean;
    vivantes?: Record<string, Position>; rangement: Record<string, Position>;
}): Position {
    const valide = (p?: Position): p is Position => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
    const candidates = [contexte.epingles?.[id], contexte.fige ? contexte.instantane?.[id] : undefined,
        contexte.vivantes?.[id], contexte.rangement[id]];
    return { ...(candidates.find(valide) ?? { x: 0, y: 0 }) };
}

export function adapterLeGrapheDeTrame(graphe: GrapheDeTrame, source: SourceDeLaTrame, options: {
    positionDe: (id: string) => Position; choisi: string | null; liaison: boolean; surlignes: Set<string>; fige: boolean;
    styles?: Record<string, StyleDeLienDeTrame>; lienChoisi?: string | null; selection?: ReadonlySet<string>;
    organisation?: OrganisationDeTrame;
    jonctionsMultiples?: boolean;
}): { noeuds: CarteDeTrame[]; liens: TraitDeTrame[] } {
    const ids = new Set(graphe.noeuds.map(n => n.id));
    const noms = new Map(graphe.noeuds.map(n => [n.id, n.nom]));
    const scenes = new Map(source.scenes?.map(s => [s.id, s]));
    const actes = new Map(source.actes?.map(a => [a.id, a.titre]));
    const lieux = new Map(source.atlasMaps?.map(l => [l.id, l.name]));
    const pnj = new Set(source.entities?.map(n => n.id));
    const indices = new Set(source.clues?.map(n => n.id));
    const selection = graphe.liens.find(l => JSON.stringify([l.nature, l.source, l.target]) === options.lienChoisi);
    return {
        noeuds: graphe.noeuds.map(noeud => {
            const scene = noeud.type === 'scene' ? scenes.get(noeud.refId) : undefined;
            const taille = DIMENSIONS_DES_CARTES[noeud.type];
            return {
                id: noeud.id, type: 'trame', position: options.positionDe(noeud.id),
                width: taille.largeur, height: taille.hauteur,
                selected: options.selection ? options.selection.has(noeud.id) : options.choisi === noeud.id, draggable: !options.fige && !options.liaison,
                ariaLabel: `${LIBELLE_DU_TYPE[noeud.type]} : ${noeud.nom}`,
                data: { noeud, acte: scene ? actes.get(scene.acteId) : undefined,
                    lieu: scene?.lieuId ? lieux.get(scene.lieuId) : undefined,
                    nombrePnj: scene?.entiteIds?.filter(id => pnj.has(id)).length,
                    nombreIndices: scene?.indiceIds?.filter(id => indices.has(id)).length,
                    liaison: options.liaison, jonction: !options.liaison && !!selection && (selection.source === noeud.id || selection.target === noeud.id),
                    jonctionsMultiples: options.jonctionsMultiples,
                    extremite: selection?.source === noeud.id ? 'depart' : selection?.target === noeud.id ? 'arrivee' : undefined,
                    estompe: options.surlignes.size > 0 && !options.surlignes.has(noeud.id) },
            };
        }),
        liens: graphe.liens.filter(l => ids.has(l.source) && ids.has(l.target)).map(lien => {
            const direction = lien.nature === 'suite' || lien.nature === 'enchainement';
            const couleur = lien.nature === 'enchainement' ? 'var(--app-accent)'
                : TEINTE_DE_TRAME[lien.nature as TypeDeNoeud] ?? 'var(--app-border)';
            const id = JSON.stringify([lien.nature, lien.source, lien.target]);
            const reglage = normaliserLeStyleDeLien(options.styles?.[id]);
            const candidat = options.organisation?.trajets?.[id];
            const trajet = trajetDeTrameValide(candidat, options.positionDe(lien.source), options.positionDe(lien.target), reglage) ? candidat : undefined;
            const style = apparenceDuLien(reglage, { stroke: couleur,
                strokeWidth: lien.nature === 'enchainement' ? 2.5 : 1.2,
                opacity: lien.nature === 'appartenance' ? 0.25 : lien.nature === 'suite' ? 0.45 : 0.8 });
            const depart = reglage?.depart ?? trajet?.depart ?? (direction ? 'droite' : 'bas');
            const arrivee = reglage?.arrivee ?? trajet?.arrivee ?? (direction ? 'gauche' : 'haut');
            const bord = (idNoeud: string, cote: NonNullable<StyleDeLienDeTrame['depart']>, point = 2) => {
                const n = graphe.noeuds.find(n => n.id === idNoeud)!;
                const taille = DIMENSIONS_DES_CARTES[n.type], p = options.positionDe(idNoeud);
                return { x: p.x + (cote === 'gauche' ? -taille.largeur / 2 : cote === 'droite' ? taille.largeur / 2 : (point - 2) * taille.largeur / 4),
                    y: p.y + (cote === 'haut' ? -taille.hauteur / 2 : cote === 'bas' ? taille.hauteur / 2 : (point - 2) * taille.hauteur / 4) };
            };
            return {
                // Ni le libellé ni l'ordre du tableau ne changent l'identité du lien.
                id, type: 'trame', selected: options.lienChoisi === id,
                source: lien.source, target: lien.target,
                sourceHandle: accrocheDuLien(depart, reglage?.pointDepart),
                targetHandle: accrocheDuLien(arrivee, reglage?.pointArrivee),
                reconnectable: !options.liaison && options.lienChoisi === id,
                data: { lien, trajet, commentaire: reglage?.commentaire, pointsDePassage: reglage?.pointsDePassage,
                    pointsDuLien: [bord(lien.source, depart, reglage?.pointDepart),
                        ...(reglage?.pointsDePassage ?? trajet?.points.slice(1, -1) ?? []), bord(lien.target, arrivee, reglage?.pointArrivee)] }, style,
                markerEnd: direction ? { type: MarkerType.ArrowClosed, color: style.stroke as string, width: 18, height: 18 } : undefined,
                interactionWidth: 24, focusable: true, ariaLabel: `Lien ${LIBELLE_DU_TYPE[lien.nature as TypeDeNoeud] ?? lien.nature} : ${noms.get(lien.source)} vers ${noms.get(lien.target)}`,
            };
        }),
    };
}
