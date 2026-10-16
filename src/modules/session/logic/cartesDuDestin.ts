import type { DeckManifest, DeckSessionState } from '../../../types/deck.types';
import { jouerUneCarteTenue, mainDuPorteur, piocherEnMain } from './mainsDuPaquet';

/**
 * **Les Cartes du Destin de Torg Eternity** — 2026-10-14, d'après le carnet
 * NotebookLM « Torg ».
 *
 * - **La main** : 4 cartes au début de chaque scène (5 sous la Loi de
 *   l'Héroïsme) ; on la complète en fin de scène.
 * - **La Réserve d'Action** : en combat, une carte posée face visible devant
 *   soi (une par fin de tour, sans limite) ; elle se joue à tout moment, et toute
 *   la table la voit. Après le combat, la Réserve revient en main.
 * - **Le Moment critique** : une fois par Acte, toute la main passe en Réserve.
 * - **Fin d'Acte** : chacun défausse sa main et en tire une nouvelle.
 *
 * Les effets des cartes sont imprimés dessus : GM-OS ne les joue pas, il tient
 * les mains. Tout est pur ; le paquet reste la seule vérité (`mainsDuPaquet`).
 */

/** Le Paquet du Destin du jeu — le premier paquet du système marqué `destin`. */
export function paquetDuDestinDuJeu(decks: readonly DeckManifest[], systemeId: string | undefined | null): DeckManifest | null {
    if (!systemeId) return null;
    return decks.find(d => d.systemId === systemeId && d.role === 'destin') ?? null;
}

/** Les cartes qu'un personnage tient — en main **et** en Réserve. */
export const cartesTenues = (etat: DeckSessionState, porteur: string) => mainDuPorteur(etat, porteur).length;

/**
 * Une carte tenue passe en Réserve d'Action : face visible, publique. Rend
 * l'état inchangé si la carte n'est pas tenue — *poser ne crée jamais de carte.*
 */
export function poserEnReserve(etat: DeckSessionState, index: number): DeckSessionState {
    if (!(etat.enMain ?? []).some(c => c.index === index)) return etat;
    return { ...etat, enMain: (etat.enMain ?? []).map(c => (c.index === index ? { ...c, face: 'revelee', enReserve: true } : c)) };
}

/** Fin du combat : chaque Réserve revient dans la main de son porteur. */
export function reprendreLesReserves(etat: DeckSessionState): { etat: DeckSessionState; reprises: number } {
    const reprises = (etat.enMain ?? []).filter(c => c.enReserve).length;
    if (reprises === 0) return { etat, reprises };
    return { etat: { ...etat, enMain: (etat.enMain ?? []).map(c => (c.enReserve ? { ...c, enReserve: false } : c)) }, reprises };
}

/**
 * **Le Moment critique** : toute la main du personnage passe en Réserve — une
 * fois par Acte. Le refus se dit : le geste est rare, et un bouton qui ne fait
 * rien sans un mot passerait pour une panne.
 */
export function momentCritique(etat: DeckSessionState, porteur: string): { etat: DeckSessionState; refus?: string } {
    if ((etat.momentsCritiques ?? []).includes(porteur)) return { etat, refus: 'Le Moment critique est déjà joué pour cet Acte.' };
    const enMain = mainDuPorteur(etat, porteur).filter(c => !c.enReserve);
    if (enMain.length === 0) return { etat, refus: 'Aucune carte en main à poser en Réserve.' };
    return {
        etat: {
            ...etat,
            enMain: (etat.enMain ?? []).map(c => (c.porteur === porteur ? { ...c, face: 'revelee', enReserve: true } : c)),
            momentsCritiques: [...(etat.momentsCritiques ?? []), porteur],
        },
    };
}

/** Mélanger une pile — `DeckInterpreter.shuffle` à l'usage, l'identité dans les essais. */
export type Melange = (indices: number[]) => number[];

/**
 * La carte du dessus va dans la main du personnage, face révélée. Pioche vide :
 * la défausse est remélangée pour la refaire — **sans toucher aux mains**, à la
 * différence du remélange de Deck-OS. `null` : il n'y a plus rien nulle part.
 */
export function piocherPour(etat: DeckSessionState, porteur: string, melanger?: Melange): { etat: DeckSessionState; index: number | null } {
    let courant = etat;
    if (courant.remainingIndices.length === 0 && melanger && courant.discardedIndices.length > 0) {
        courant = { ...courant, remainingIndices: melanger([...courant.discardedIndices]), discardedIndices: [] };
    }
    const index = courant.remainingIndices[0];
    if (index === undefined) return { etat, index: null };
    return { etat: piocherEnMain(courant, index, porteur, 'revelee'), index };
}

export interface BilanDesMains {
    etat: DeckSessionState;
    /** Ce que chacun a pioché. */
    pioches: Record<string, number>;
    /** Qui tient plus que la taille de main : à lui de défausser — GM-OS ne choisit pas pour lui. */
    enTrop: Record<string, number>;
    /** Les cartes qui manquaient quand la pioche s'est vidée. */
    manquantes: number;
}

/** **Fin de scène** : chacun complète sa main jusqu'à la taille du jeu. */
export function completerLesMains(etat: DeckSessionState, porteurs: readonly string[], taille: number, melanger?: Melange): BilanDesMains {
    let courant = etat;
    const pioches: Record<string, number> = {};
    const enTrop: Record<string, number> = {};
    let manquantes = 0;
    for (const porteur of porteurs) {
        const tenues = cartesTenues(courant, porteur);
        if (tenues > taille) enTrop[porteur] = tenues - taille;
        for (let i = tenues; i < taille; i++) {
            const tire = piocherPour(courant, porteur, melanger);
            if (tire.index === null) { manquantes += taille - i; break; }
            courant = tire.etat;
            pioches[porteur] = (pioches[porteur] ?? 0) + 1;
        }
    }
    return { etat: courant, pioches, enTrop, manquantes };
}

/**
 * **Fin d'Acte** : chacun défausse toute sa main — Réserve comprise — et en tire
 * une nouvelle ; les Moments critiques reviennent.
 */
export function nouvellesMains(
    etat: DeckSessionState,
    porteurs: readonly string[],
    taille: number,
    avecDefausse: boolean,
    melanger?: Melange,
): BilanDesMains {
    let courant: DeckSessionState = { ...etat, momentsCritiques: [] };
    for (const porteur of porteurs) {
        for (const carte of mainDuPorteur(courant, porteur)) courant = jouerUneCarteTenue(courant, carte.index, avecDefausse);
    }
    return completerLesMains(courant, porteurs, taille, melanger);
}

/**
 * **Les cartes du dessus, pour choisir** — les Atouts qui piochent plusieurs
 * cartes et n'en gardent qu'une (carnet « Torg », 2026-10-16) : Aspect effrayant
 * (deux au lieu d'une, p. 105), Occultiste (une à trois selon le succès, p. 94),
 * Ingénieux (une à trois, *« à la main de n'importe quel joueur »*, Empire du Nil
 * p. 16). *« Il en garde une et défausse les autres. »*
 *
 * Regarder ne sort aucune carte : le choix se fait ensuite, par
 * `garderUneParmi`. Pioche trop courte : la défausse remélangée passe dessous,
 * comme à la pioche ordinaire.
 */
export function regarderLesProchaines(etat: DeckSessionState, nombre: number, melanger?: Melange): { etat: DeckSessionState; indices: number[] } {
    const n = Math.max(0, Math.floor(nombre));
    let courant = etat;
    if (courant.remainingIndices.length < n && melanger && courant.discardedIndices.length > 0) {
        courant = { ...courant, remainingIndices: [...courant.remainingIndices, ...melanger([...courant.discardedIndices])], discardedIndices: [] };
    }
    return { etat: courant, indices: courant.remainingIndices.slice(0, n) };
}

/**
 * Le choix fait : la carte gardée va dans la main du porteur, face révélée ; les
 * autres partent en défausse (dessous de la pioche pour un paquet sans
 * défausse). Une carte qui n'est plus dans la pioche — le paquet a bougé entre
 * le regard et le choix — rend l'état inchangé : *garder ne crée jamais de carte.*
 */
export function garderUneParmi(
    etat: DeckSessionState,
    indices: readonly number[],
    garde: number,
    porteur: string,
    avecDefausse: boolean,
): DeckSessionState {
    if (!indices.includes(garde) || indices.some(i => !etat.remainingIndices.includes(i))) return etat;
    const autres = indices.filter(i => i !== garde);
    const tiree = piocherEnMain(etat, garde, porteur, 'revelee');
    const restantes = tiree.remainingIndices.filter(i => !autres.includes(i));
    return avecDefausse
        ? { ...tiree, remainingIndices: restantes, discardedIndices: [...tiree.discardedIndices, ...autres] }
        : { ...tiree, remainingIndices: [...restantes, ...autres] };
}

/**
 * **Chercher une carte** — l'Atout Populaire (Empire du Nil p. 17) : *« une
 * fois par Acte, il peut chercher dans le Paquet du Destin ou la défausse une
 * carte Relation et l'ajouter à sa main. »* La carte vient de la pioche ou de la
 * défausse ; tenue ou introuvable, l'état revient inchangé.
 */
export function prendreUneCarte(etat: DeckSessionState, index: number, porteur: string): DeckSessionState {
    if (etat.remainingIndices.includes(index)) return piocherEnMain(etat, index, porteur, 'revelee');
    if (!etat.discardedIndices.includes(index)) return etat;
    return {
        ...etat,
        discardedIndices: etat.discardedIndices.filter(i => i !== index),
        enMain: [...(etat.enMain ?? []), { index, porteur, face: 'revelee' }],
    };
}
