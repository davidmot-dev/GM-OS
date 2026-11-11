import type { SessionMessage } from '../../types/session.types';
import { lireLaDemande, type DemandeDeJet } from './demandeDeJet';

/**
 * **Les demandes de jet vivent dans le fil des messages** — plan
 * `2026-11-11-jets-demandes-et-caches.md`, T3.
 *
 * Plutôt qu'un canal neuf, la demande voyage dans un **message privé du
 * meneur**, et sa clôture (lancée, annulée) dans un second. Ce chemin a déjà
 * tout ce qu'il faut, et il a été payé cher (12/10) :
 * - le serveur remet un message privé **à son seul destinataire** (C1),
 *   `electron/destinatairesDesMessages.ts` ;
 * - le meneur garde le fil de la campagne et **le rend à une tablette qui se
 *   reconnecte** (C6) — y compris celle que Vite recharge en `npm run dev` ;
 * - le message reste lisible dans la messagerie, même par une tablette qui ne
 *   saurait pas encore afficher la bannière.
 *
 * L'état d'une demande se **déduit** du fil : ouverte tant qu'aucune suite du
 * meneur ne la clôt. Un seul écrivain — le meneur —, et rien d'autre à garder.
 */

export const ID_DU_MENEUR = 'GM';

const nouvelId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Le message qui porte une demande au personnage visé. */
export function messageDeDemande(demande: DemandeDeJet, nomDuPersonnage: string, campaignId?: string): SessionMessage {
    return {
        id: nouvelId(),
        fromId: ID_DU_MENEUR,
        fromName: 'Maître du Jeu',
        toId: demande.characterId,
        toName: nomDuPersonnage,
        content: `🎲 Le meneur te demande un jet : ${demande.titre}`,
        timestamp: Date.now(),
        isRead: true,
        ...(campaignId ? { campaignId } : {}),
        demandeDeJet: demande,
    };
}

/** Le message qui clôt une demande — au même destinataire, pour que sa tablette le sache. */
export function messageDeSuite(
    demande: Pick<DemandeDeJet, 'id' | 'characterId' | 'titre'>,
    etat: 'lancee' | 'annulee',
    nomDuPersonnage: string,
    campaignId?: string,
): SessionMessage {
    return {
        id: nouvelId(),
        fromId: ID_DU_MENEUR,
        fromName: 'Maître du Jeu',
        toId: demande.characterId,
        toName: nomDuPersonnage,
        content: etat === 'lancee' ? `✓ Jet reçu : ${demande.titre}` : `Demande annulée : ${demande.titre}`,
        timestamp: Date.now(),
        isRead: true,
        ...(campaignId ? { campaignId } : {}),
        suiteDeDemande: { id: demande.id, etat },
    };
}

/** Un message qui ne fait que clore une demande — une messagerie peut choisir de le taire. */
export const estUneSuiteDeDemande = (m: Pick<SessionMessage, 'fromId' | 'suiteDeDemande'>): boolean =>
    m.fromId === ID_DU_MENEUR && !!m.suiteDeDemande;

/**
 * **Les demandes encore ouvertes**, de la plus ancienne à la plus récente ;
 * pour un seul personnage quand il est nommé.
 *
 * ⛔ Seuls les messages **du meneur** comptent. Le serveur retire déjà ces
 * champs des messages de joueur ; cette règle est la seconde ceinture, celle
 * qui tient même devant un fil venu d'ailleurs (un export, une vieille tablette).
 * Chaque demande est **relue** (`lireLaDemande`) : le fil a pu voyager.
 * Une demande adressée à un autre personnage que le destinataire du message
 * est ignorée — elle n'aurait pas dû y être.
 */
export function demandesOuvertes(messages: readonly SessionMessage[], characterId?: string): DemandeDeJet[] {
    return suiviDesDemandes(messages, characterId)
        .filter(s => s.etat === 'en-attente')
        .map(s => s.demande);
}

/** Une demande et ce qu'il en est advenu, lu dans le fil. */
export interface SuiviDeDemande {
    demande: DemandeDeJet;
    etat: 'en-attente' | 'lancee' | 'annulee';
}

/**
 * **Toutes les demandes, avec leur état**, de la plus ancienne à la plus
 * récente — la liste « Demandes en cours » du meneur (T7). Mêmes règles que
 * `demandesOuvertes` : seul le meneur fait foi, chaque demande est relue, une
 * demande en double ne compte qu'une fois ; la **première** suite qui la clôt
 * dit son état.
 */
export function suiviDesDemandes(messages: readonly SessionMessage[], characterId?: string): SuiviDeDemande[] {
    const ordre = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    const fins = new Map<string, 'lancee' | 'annulee'>();
    for (const m of ordre) {
        if (!estUneSuiteDeDemande(m)) continue;
        const { id, etat } = m.suiteDeDemande!;
        if (!fins.has(id) && (etat === 'lancee' || etat === 'annulee')) fins.set(id, etat);
    }
    const vues = new Set<string>();
    const suivi: SuiviDeDemande[] = [];
    for (const m of ordre) {
        if (m.fromId !== ID_DU_MENEUR || !m.demandeDeJet) continue;
        const demande = lireLaDemande(m.demandeDeJet);
        if (!demande || demande.characterId !== m.toId) continue;
        if (characterId && demande.characterId !== characterId) continue;
        if (vues.has(demande.id)) continue;
        vues.add(demande.id);
        suivi.push({ demande, etat: fins.get(demande.id) ?? 'en-attente' });
    }
    return suivi;
}
