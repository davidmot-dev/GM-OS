import i18next from 'i18next';
import type { SessionMessage } from '../../types/session.types';
import { lireLaDemande, type DemandeDeJet } from './demandeDeJet';
import { cleI18nDuDegre, degreOuBooleen, type DegreDeReussite } from './degresDeReussite';

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

/**
 * **Ce que le jet demandé a donné** (11/11, David : « quand je demande un jet je
 * voudrais voir aussi le résultat dans la messagerie », et 5 s dans une fenêtre
 * volante). Il voyage avec la suite qui clôt la demande : un seul message, un
 * seul écrivain — le meneur, qui l'a reçu de la tablette.
 */
export interface ResultatDeLaDemande {
    /** Le jet tel qu'il a été lancé — « Agilité 3 », « Sauvegarde de Force ». */
    titre: string;
    totalDisplay: string;
    degre?: DegreDeReussite;
    tagSuccess?: boolean;
}

/** Le verdict nommé par le jeu (« Réussite partielle »), ou rien si le jet n'en dit pas. */
export function verdictDuResultat(r: Pick<ResultatDeLaDemande, 'degre' | 'tagSuccess'>): string | null {
    const degre = degreOuBooleen(r.degre, r.tagSuccess);
    // ⚠️ Les degrés vivent dans `modules` ; l'espace par défaut est `common` (sans lui : « dice.degres.… »).
    return degre ? i18next.t(cleI18nDuDegre(degre), { ns: 'modules' }) : null;
}

/**
 * Le verdict **à ajouter** au texte du jeu, ou `null` quand ce texte le nomme
 * déjà : Argyropée écrit « Réussite partielle — dé 8 … » sous le degré commun
 * « Réussite » ; le redire en tête serait faux autant que redondant.
 */
export function verdictADire(r: Pick<ResultatDeLaDemande, 'totalDisplay' | 'degre' | 'tagSuccess'>): string | null {
    const verdict = verdictDuResultat(r);
    if (!verdict) return null;
    return r.totalDisplay.trim().toLocaleLowerCase('fr').startsWith(verdict.toLocaleLowerCase('fr')) ? null : verdict;
}

/** « Réussite — 30 (seuil 58) », ou le seul texte du jeu quand il dit déjà son verdict. */
export function resumeDuResultat(r: ResultatDeLaDemande): string {
    const verdict = verdictADire(r);
    const total = r.totalDisplay.trim();
    if (!verdict) return total;
    return total ? `${verdict} — ${total}` : verdict;
}

/** Le message qui clôt une demande — au même destinataire, pour que sa tablette le sache. */
export function messageDeSuite(
    demande: Pick<DemandeDeJet, 'id' | 'characterId' | 'titre'>,
    etat: 'lancee' | 'annulee',
    nomDuPersonnage: string,
    campaignId?: string,
    resultat?: ResultatDeLaDemande,
): SessionMessage {
    const recu = resultat ? `✓ Jet reçu : ${demande.titre} — ${resumeDuResultat(resultat)}` : `✓ Jet reçu : ${demande.titre}`;
    return {
        id: nouvelId(),
        fromId: ID_DU_MENEUR,
        fromName: 'Maître du Jeu',
        toId: demande.characterId,
        toName: nomDuPersonnage,
        content: etat === 'lancee' ? recu : `Demande annulée : ${demande.titre}`,
        timestamp: Date.now(),
        isRead: true,
        ...(campaignId ? { campaignId } : {}),
        suiteDeDemande: { id: demande.id, etat, ...(etat === 'lancee' && resultat ? { resultat } : {}) },
    };
}

/** Un résultat de jet demandé, prêt pour la fenêtre volante du meneur. */
export interface ResultatArrive {
    /** L'identifiant du message de suite : une carte par message. */
    id: string;
    personnage: string;
    resultat: ResultatDeLaDemande;
    timestamp: number;
}

/**
 * **Les jets demandés revenus depuis `depuis`** — la fenêtre volante du meneur.
 * Seules les suites **du meneur**, « lancée », qui portent un résultat ; relues
 * champ par champ, le fil a pu voyager. Un fil relu au démarrage ne rejoue
 * rien : seul compte ce qui arrive après l'ouverture.
 */
export function resultatsArrives(messages: readonly SessionMessage[], depuis: number): ResultatArrive[] {
    const arrives: ResultatArrive[] = [];
    for (const m of messages) {
        if (!estUneSuiteDeDemande(m) || m.timestamp < depuis) continue;
        const r = m.suiteDeDemande!.resultat;
        if (m.suiteDeDemande!.etat !== 'lancee' || !r || typeof r !== 'object') continue;
        if (typeof r.titre !== 'string' || typeof r.totalDisplay !== 'string') continue;
        arrives.push({
            id: m.id, personnage: m.toName ?? '', timestamp: m.timestamp,
            resultat: {
                titre: r.titre.slice(0, 200), totalDisplay: r.totalDisplay.slice(0, 400),
                ...(typeof r.degre === 'string' ? { degre: r.degre } : {}),
                ...(typeof r.tagSuccess === 'boolean' ? { tagSuccess: r.tagSuccess } : {}),
            },
        });
    }
    return arrives;
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
