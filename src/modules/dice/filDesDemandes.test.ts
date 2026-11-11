import { describe, it, expect } from 'vitest';
import '../../i18n';
import { demandesOuvertes, estUneSuiteDeDemande, messageDeDemande, messageDeSuite, resultatsArrives, resumeDuResultat } from './filDesDemandes';
import type { DemandeDeTest } from './demandeDeJet';
import type { SessionMessage } from '../../types/session.types';

/**
 * Ce que ces essais protègent (plan `2026-11-11-jets-demandes-et-caches.md`, T3) :
 * l'état d'une demande se déduit du fil, et seul le meneur peut en ouvrir ou en
 * clore une.
 */

const demande = (id: string, characterId = 'wilson', titre = 'Agilité + Mobilité'): DemandeDeTest => ({
    genre: 'test', id, characterId, emiseLe: 1, titre,
    composition: { champs: { attribut: 'agilite', competence: 'mobilite' } },
});

/** Un fil daté, pour ne pas dépendre de l'horloge. */
const date = (m: SessionMessage, timestamp: number): SessionMessage => ({ ...m, timestamp });

describe('les messages du meneur', () => {
    it('une demande part au seul personnage, lisible dans la messagerie', () => {
        const m = messageDeDemande(demande('d1'), 'Wilson', 'c-1');
        expect(m).toMatchObject({
            fromId: 'GM', toId: 'wilson', toName: 'Wilson', campaignId: 'c-1',
            content: '🎲 Le meneur te demande un jet : Agilité + Mobilité',
        });
        expect(m.demandeDeJet).toEqual(demande('d1'));
    });

    it('la suite dit ce qui est arrivé, au même destinataire', () => {
        expect(messageDeSuite(demande('d1'), 'lancee', 'Wilson')).toMatchObject({
            fromId: 'GM', toId: 'wilson', content: '✓ Jet reçu : Agilité + Mobilité', suiteDeDemande: { id: 'd1', etat: 'lancee' },
        });
        expect(messageDeSuite(demande('d1'), 'annulee', 'Wilson').content).toBe('Demande annulée : Agilité + Mobilité');
    });

    it('deux messages n’ont jamais le même identifiant', () => {
        expect(messageDeDemande(demande('d1'), 'W').id).not.toBe(messageDeDemande(demande('d1'), 'W').id);
    });

    it('lancée, la suite porte le résultat, lisible dans la messagerie (David, 11/11)', () => {
        const resultat = { titre: 'Agilité 3', totalDisplay: '30 (seuil 58)', degre: 'reussite-normale' as const, tagSuccess: true };
        const m = messageDeSuite(demande('d1'), 'lancee', 'Wilson', undefined, resultat);
        expect(m.content).toBe('✓ Jet reçu : Agilité + Mobilité — Réussite — 30 (seuil 58)');
        expect(m.suiteDeDemande).toEqual({ id: 'd1', etat: 'lancee', resultat });
        // Annulée, il n'y a pas de résultat à porter.
        expect(messageDeSuite(demande('d1'), 'annulee', 'Wilson', undefined, resultat).suiteDeDemande).toEqual({ id: 'd1', etat: 'annulee' });
    });
});

describe('resumeDuResultat', () => {
    it('le verdict d’abord, sauf quand le texte du jeu le dit déjà', () => {
        expect(resumeDuResultat({ titre: 't', totalDisplay: '7 (seuil 11)', tagSuccess: true })).toBe('Réussite — 7 (seuil 11)');
        // Argyropée : « Réussite partielle — dé 8 + compétence 0 = 8 » nomme déjà son verdict.
        expect(resumeDuResultat({ titre: 't', totalDisplay: 'Échec — dé 6 + compétence 0 = 6', degre: 'echec-normal' }))
            .toBe('Échec — dé 6 + compétence 0 = 6');
        expect(resumeDuResultat({ titre: 't', totalDisplay: '12' })).toBe('12');
    });
});

describe('resultatsArrives — la fenêtre volante du meneur', () => {
    const resultat = { titre: 'Agilité 3', totalDisplay: '30 (seuil 58)', tagSuccess: true };
    it('seules les suites lancées du meneur, avec un résultat, arrivées depuis l’ouverture', () => {
        const fil = [
            date(messageDeSuite(demande('d0'), 'lancee', 'Wilson', undefined, resultat), 5),  // avant l'ouverture
            date(messageDeSuite(demande('d1'), 'lancee', 'Wilson', undefined, resultat), 20),
            date(messageDeSuite(demande('d2'), 'lancee', 'Wilson'), 21),                     // sans résultat
            date(messageDeSuite(demande('d3'), 'annulee', 'Wilson'), 22),
            date({ ...messageDeSuite(demande('d4'), 'lancee', 'Wilson', undefined, resultat), fromId: 'wilson' }, 23),
        ];
        const arrives = resultatsArrives(fil, 10);
        expect(arrives).toHaveLength(1);
        expect(arrives[0]).toMatchObject({ id: fil[1].id, personnage: 'Wilson', resultat });
    });

    it('un résultat illisible venu du fil est ignoré', () => {
        const m = date(messageDeSuite(demande('d1'), 'lancee', 'Wilson'), 20);
        const abime = { ...m, suiteDeDemande: { id: 'd1', etat: 'lancee' as const, resultat: { titre: 3, totalDisplay: null } as never } };
        expect(resultatsArrives([abime], 0)).toEqual([]);
    });
});

describe('demandesOuvertes', () => {
    it('une demande sans suite est ouverte ; lancée ou annulée, elle se ferme', () => {
        const fil = [
            date(messageDeDemande(demande('d1'), 'Wilson'), 1),
            date(messageDeDemande(demande('d2'), 'Wilson'), 2),
            date(messageDeDemande(demande('d3'), 'Wilson'), 3),
            date(messageDeSuite(demande('d1'), 'lancee', 'Wilson'), 4),
            date(messageDeSuite(demande('d3'), 'annulee', 'Wilson'), 5),
        ];
        expect(demandesOuvertes(fil).map(d => d.id)).toEqual(['d2']);
    });

    it('de la plus ancienne à la plus récente, et pour un personnage quand on le nomme', () => {
        const fil = [
            date(messageDeDemande(demande('tard', 'ripley'), 'Ripley'), 9),
            date(messageDeDemande(demande('tot', 'wilson'), 'Wilson'), 1),
            date(messageDeDemande(demande('milieu', 'ripley'), 'Ripley'), 5),
        ];
        expect(demandesOuvertes(fil).map(d => d.id)).toEqual(['tot', 'milieu', 'tard']);
        expect(demandesOuvertes(fil, 'ripley').map(d => d.id)).toEqual(['milieu', 'tard']);
    });

    it('⛔ une demande qui ne vient pas du meneur ne compte pas', () => {
        const forge = { ...messageDeDemande(demande('x'), 'Wilson'), fromId: 'ripley' };
        expect(demandesOuvertes([forge])).toEqual([]);
    });

    it('⛔ une suite qui ne vient pas du meneur ne ferme rien', () => {
        const fil = [
            date(messageDeDemande(demande('d1'), 'Wilson'), 1),
            date({ ...messageDeSuite(demande('d1'), 'annulee', 'Wilson'), fromId: 'wilson' }, 2),
        ];
        expect(demandesOuvertes(fil).map(d => d.id)).toEqual(['d1']);
        expect(estUneSuiteDeDemande(fil[1])).toBe(false);
    });

    it('une demande adressée à un autre que le destinataire du message est ignorée', () => {
        const egaree = { ...messageDeDemande(demande('d1', 'ripley'), 'Wilson'), toId: 'wilson' };
        expect(demandesOuvertes([egaree])).toEqual([]);
    });

    it('une demande illisible est ignorée, un doublon ne compte qu’une fois', () => {
        const illisible = { ...messageDeDemande(demande('d1'), 'Wilson'), demandeDeJet: { genre: 'degats' } as never };
        const une = messageDeDemande(demande('d2'), 'Wilson');
        expect(demandesOuvertes([illisible, une, { ...une, id: 'autre-message' }]).map(d => d.id)).toEqual(['d2']);
    });
});
