import type { DeckManifest, DeckSessionState } from '../../../types/deck.types';
import { jouerUneCarteTenue, mainDuPorteur } from './mainsDuPaquet';
import { piocherPour, type Melange } from './cartesDuDestin';

/**
 * **Les Cartes de Cosm** — Torg, 2026-10-14 (carnet « Torg », livre p. 113).
 *
 * - *« Chaque joueur reçoit une Carte de Cosm au début de chaque Acte. Si le
 *   joueur a encore en sa possession une Carte de Cosm non utilisée du précédent
 *   Acte, il doit la défausser et en tirer une nouvelle (le MJ doit de nouveau
 *   mélanger toutes les cartes du cosm actuel et redistribuer). »*
 * - *« Pénétrer dans un nouveau cosm […] si ce n'est pas [au début d'un Acte],
 *   les joueurs qui ont encore des Cartes de Cosm doivent les défausser. Puis ils
 *   reçoivent une carte de remplacement du nouveau cosm. […] Les joueurs qui ont
 *   déjà utilisé leur Carte de Cosm pour cet Acte n'en reçoivent pas une
 *   nouvelle. »*
 * - *« Elles ne comptent pas dans la taille de la main du joueur et ne vont pas
 *   dans la Réserve d'Action. […] Dans une Zone Mixte, le joueur peut choisir à
 *   partir de quel cosm piocher sa carte. »*
 *
 * Un paquet par cosm, marqué « Paquet de Cosm » dans Deck-OS : la carte tenue
 * vit dans la main de SON paquet, à part de la main du Destin — elle ne compte
 * donc jamais dans sa taille. Fonctions pures ; le mélange est passé en paramètre.
 */

/** Les paquets de Cosm d'un jeu, chacun rattaché à son cosm. */
export function paquetsDeCosm(decks: readonly DeckManifest[], systemeId: string | null | undefined): DeckManifest[] {
    if (!systemeId) return [];
    return decks.filter(d => d.systemId === systemeId && d.role === 'cosm' && !!d.cosm);
}

/** Les paquets des cosms courants, dans l'ordre des cosms (le premier par défaut). */
export function paquetsDesCosmsCourants(paquets: readonly DeckManifest[], cosmsCourants: readonly string[]): DeckManifest[] {
    return cosmsCourants.map(id => paquets.find(p => p.cosm === id)).filter((p): p is DeckManifest => !!p);
}

/** Jouer une carte de Cosm : elle part, et son porteur a joué la sienne pour cet Acte. */
export function jouerUneCarteDeCosm(etat: DeckSessionState, index: number, avecDefausse: boolean): DeckSessionState {
    const carte = (etat.enMain ?? []).find(c => c.index === index);
    if (!carte) return etat;
    const apres = jouerUneCarteTenue(etat, index, avecDefausse);
    if (!carte.porteur) return apres;
    return { ...apres, cosmJoues: [...new Set([...(apres.cosmJoues ?? []), carte.porteur])] };
}

/** « Le MJ doit de nouveau mélanger toutes les cartes du cosm » : la défausse revient dans la pioche. */
function remelanger(etat: DeckSessionState, melanger: Melange): DeckSessionState {
    return { ...etat, remainingIndices: melanger([...etat.remainingIndices, ...etat.discardedIndices]), discardedIndices: [] };
}

export interface DistributionDeCosm {
    /** Le nouvel état de chaque paquet touché, par identifiant. */
    etats: Record<string, DeckSessionState>;
    /** Qui a reçu une carte, et de quel paquet. */
    recues: Record<string, string>;
    /** Qui a défaussé une carte non jouée. */
    defaussees: string[];
    /** Qui ne reçoit rien : il a déjà joué la sienne pour cet Acte. */
    dejaJouee: string[];
    /** Qui n'a rien reçu parce que le paquet était vide. */
    sansCarte: string[];
}

interface Contexte {
    /** Tous les paquets de Cosm du jeu, et leur état. */
    paquets: readonly DeckManifest[];
    etats: Record<string, DeckSessionState | undefined>;
    /** Les personnages joueurs de la campagne. */
    porteurs: readonly string[];
    /** Les paquets des cosms courants — deux en zone mixte. */
    courants: readonly DeckManifest[];
    /** Zone mixte : le paquet que chaque joueur a choisi. Absent : le premier. */
    choix?: Record<string, string>;
    melanger: Melange;
}

function distribuer(c: Contexte, debutDActe: boolean): DistributionDeCosm {
    const etats: Record<string, DeckSessionState> = {};
    for (const p of c.paquets) {
        const e = c.etats[p.id];
        if (e) etats[p.id] = debutDActe ? { ...e, cosmJoues: [] } : e;
    }
    const idsCourants = new Set(c.courants.map(p => p.id));
    const joues = debutDActe ? new Set<string>() : new Set(Object.values(etats).flatMap(e => e.cosmJoues ?? []));
    const resultat: DistributionDeCosm = { etats, recues: {}, defaussees: [], dejaJouee: [], sansCarte: [] };

    for (const porteur of c.porteurs) {
        // Au début d'un Acte, toute carte tenue part ; en changeant de cosm, celles d'un cosm quitté.
        let tientEncore = false;
        for (const p of c.paquets) {
            const e = etats[p.id];
            if (!e) continue;
            for (const carte of mainDuPorteur(e, porteur)) {
                if (debutDActe || !idsCourants.has(p.id)) {
                    etats[p.id] = jouerUneCarteTenue(etats[p.id], carte.index, p.useDiscard);
                    if (!resultat.defaussees.includes(porteur)) resultat.defaussees.push(porteur);
                } else {
                    tientEncore = true;
                }
            }
        }
        if (tientEncore) continue;
        if (joues.has(porteur)) { resultat.dejaJouee.push(porteur); continue; }
    }

    // Le paquet courant est remélangé au début de l'Acte, avant que chacun pioche.
    if (debutDActe) for (const p of c.courants) if (etats[p.id]) etats[p.id] = remelanger(etats[p.id], c.melanger);

    for (const porteur of c.porteurs) {
        if (resultat.dejaJouee.includes(porteur)) continue;
        if (c.courants.some(p => etats[p.id] && mainDuPorteur(etats[p.id], porteur).length > 0)) continue;
        const choisi = c.courants.find(p => p.id === c.choix?.[porteur]) ?? c.courants[0];
        if (!choisi || !etats[choisi.id]) { resultat.sansCarte.push(porteur); continue; }
        const tire = piocherPour(etats[choisi.id], porteur, c.melanger);
        if (tire.index === null) { resultat.sansCarte.push(porteur); continue; }
        etats[choisi.id] = tire.etat;
        resultat.recues[porteur] = choisi.id;
    }
    return resultat;
}

/** Début d'Acte : toutes les cartes de Cosm défaussées, le paquet remélangé, une carte chacun. */
export const cartesDeCosmDuDebutDActe = (c: Contexte) => distribuer(c, true);

/** Changement de cosm en cours d'Acte : la carte d'un cosm quitté s'échange, sauf pour qui a joué la sienne. */
export const cartesDeCosmAuChangement = (c: Contexte) => distribuer(c, false);
