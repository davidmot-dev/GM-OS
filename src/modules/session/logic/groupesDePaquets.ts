import type { DeckManifest } from '../store/types';
import { JEU_UNIVERSEL, paquetsDuJeu } from './paquetsDuJeu';

/**
 * **Les paquets de la bibliothèque, rangés par pilote** — demande de David du 2026-11-08 :
 * *« pouvoir faire des regroupements de decks par Drivers pour pouvoir filtrer plus
 * facilement »*. Torg seul porte déjà une quinzaine de paquets (Action, Destin, huit Cosms,
 * Menaces…), et la liste « Tous » les mêlait à ceux des autres jeux.
 *
 * Le filtre « actif » reste la règle commune de `paquetsDuJeu` (le jeu de la campagne et les
 * paquets génériques) : ce module ne la redit pas, il ajoute un filtre par pilote nommé.
 */

/** `tous`, `actif` (le jeu de la campagne), ou l'identifiant d'un pilote. */
export type FiltreDesPaquets = 'tous' | 'actif' | string;

export interface GroupeDePaquets {
    systemId: string;
    paquets: DeckManifest[];
}

/**
 * Les groupes, dans l'ordre où le meneur les cherche : le jeu de la campagne d'abord, les
 * autres pilotes par nom, les paquets génériques en dernier (ils servent à tous les jeux).
 * L'ordre des paquets dans un groupe est celui de la bibliothèque.
 */
export function grouperParPilote(
    paquets: readonly DeckManifest[],
    systemeActif: string,
    nommer: (systemId: string) => string,
): GroupeDePaquets[] {
    const parPilote = new Map<string, DeckManifest[]>();
    for (const p of paquets) {
        const id = p.systemId || JEU_UNIVERSEL;
        parPilote.set(id, [...(parPilote.get(id) ?? []), p]);
    }
    const rang = (id: string) => (id === systemeActif ? 0 : id === JEU_UNIVERSEL ? 2 : 1);
    return [...parPilote.entries()]
        .map(([systemId, liste]) => ({ systemId, paquets: liste }))
        .sort((a, b) => rang(a.systemId) - rang(b.systemId)
            || nommer(a.systemId).localeCompare(nommer(b.systemId), 'fr'));
}

/**
 * Les paquets que montre un filtre. Un pilote dont le dernier paquet vient d'être supprimé
 * ne laisse pas une liste vide inexplicable : on retombe sur « tous ».
 */
export function paquetsDuFiltre(
    paquets: readonly DeckManifest[],
    filtre: FiltreDesPaquets,
    systemeActif: string,
): DeckManifest[] {
    if (filtre === 'tous') return [...paquets];
    if (filtre === 'actif') return paquetsDuJeu(paquets, systemeActif);
    const duPilote = paquets.filter(p => (p.systemId || JEU_UNIVERSEL) === filtre);
    return duPilote.length ? duPilote : [...paquets];
}
