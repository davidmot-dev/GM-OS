import { describe, it, expect, vi } from 'vitest';
import {
    lireLAppui, BOUTONS, ENTETE_DU_JETON, TAILLE_MAX_DU_CORPS,
} from './boutonsDeLUlanzi';

/**
 * **La porte d'entrée des boutons — et elle donne sur `0.0.0.0`.**
 *
 * ⛔ La moitié de ces tests ne parlent pas de boutons : ils parlent de ce qu'un
 * inconnu sur le réseau peut obtenir. *Un pont ouvert en séance, sur le réseau
 * d'un hôtel, c'est la main sur l'initiative au moment où elle compte.*
 */

const BON = 'secret-dappairage';
const leSecretEstBon = (jeton: unknown) => jeton === BON;

const appui = (surcharge: Partial<Parameters<typeof lireLAppui>[0]> = {}) => lireLAppui({
    methode: 'POST',
    jeton: BON,
    corps: JSON.stringify({ bouton: 'gauche' }),
    leSecretEstBon,
    ...surcharge,
});

describe('un appui légitime', () => {
    it.each(BOUTONS)('« %s » est reconnu', (bouton) => {
        expect(appui({ corps: JSON.stringify({ bouton }) })).toEqual({ ok: true, bouton });
    });

    /* Home Assistant enverra d'autres champs un jour (l'heure, l'appareil) : ils
       ne doivent pas faire échouer la lecture. */
    it('les champs en trop sont ignorés', () => {
        const corps = JSON.stringify({ bouton: 'droite', quand: 1757000000, appareil: 'awtrix' });

        expect(appui({ corps })).toEqual({ ok: true, bouton: 'droite' });
    });
});

describe('⛔ ce que le réseau n’obtient pas', () => {
    it('sans jeton, c’est non', () => {
        expect(appui({ jeton: undefined })).toMatchObject({ ok: false, code: 401 });
    });

    it('avec un mauvais jeton, c’est non', () => {
        expect(appui({ jeton: 'a-peu-pres-le-bon' })).toMatchObject({ ok: false, code: 401 });
    });

    /*
      ⛔ **LE TEST QUI TIENT L'ORDRE DES CONTRÔLES.** Un corps invalide ET un
      jeton invalide : la réponse doit être **401**, pas 400. Sinon un inconnu
      apprend, requête après requête, quelle forme le corps doit avoir et quels
      noms de boutons existent — *sans jamais avoir eu le droit d'être là.*
    */
    it('un jeton faux l’emporte sur un corps faux — 401, jamais 400', () => {
        const verdict = appui({ jeton: 'faux', corps: 'ceci n’est pas du JSON' });

        expect(verdict).toMatchObject({ code: 401 });
    });

    /* Et le motif ne nomme rien non plus. */
    it('et le motif du refus ne nomme aucun bouton', () => {
        const verdict = appui({ jeton: undefined });

        if (verdict.ok) throw new Error('refus attendu');
        for (const bouton of BOUTONS) expect(verdict.motif).not.toContain(bouton);
    });

    it('une autre méthode que POST est refusée', () => {
        expect(appui({ methode: 'GET' })).toMatchObject({ ok: false, code: 405 });
    });

    /*
      ⚠️ Le serveur écoute sur toutes les interfaces : un corps sans borne est
      une invitation. La borne est ici, et elle est vérifiée **après** le jeton —
      un inconnu ne doit pas pouvoir mesurer nos limites non plus.
    */
    it('un corps démesuré est refusé', () => {
        const enorme = JSON.stringify({ bouton: 'gauche', bourrage: 'x'.repeat(TAILLE_MAX_DU_CORPS) });

        expect(appui({ corps: enorme })).toMatchObject({ ok: false, code: 413 });
    });

    it('mais un corps normal passe la borne', () => {
        expect(appui().ok).toBe(true);
    });
});

describe('un corps mal formé', () => {
    it.each([
        ['du texte', 'bonjour'],
        ['un tableau', '[]'],
        ['nul', 'null'],
        ['un bouton inconnu', JSON.stringify({ bouton: 'haut' })],
        ['un bouton numérique', JSON.stringify({ bouton: 1 })],
        ['aucun bouton', JSON.stringify({})],
    ])('%s est refusé', (_, corps) => {
        expect(appui({ corps })).toMatchObject({ ok: false, code: 400 });
    });

    /*
      ⭐ Un appelant **authentifié** a droit, lui, à un message utile : c'est toi
      qui débogues ton automatisation Home Assistant à ce moment-là.
    */
    it('et l’appelant authentifié apprend ce qui était attendu', () => {
        const verdict = appui({ corps: JSON.stringify({ bouton: 'haut' }) });

        if (verdict.ok) throw new Error('refus attendu');
        expect(verdict.motif).toContain('gauche');
    });
});

describe('⭐ le pré-vol dont dépend le serveur', () => {
    /*
      ⛔ **CE TEST TIENT UNE PROPRIÉTÉ DU SERVEUR, PAS DE CETTE FONCTION.**

      `SyncServer.traiterLAppui` appelle `lireLAppui` **avec un corps vide**
      avant d'avoir lu quoi que ce soit du réseau : c'est ainsi qu'un inconnu ne
      nous fait rien accumuler. Tout le mécanisme repose sur le fait qu'un corps
      vide, jeton valide, rende `400` — « la méthode et le jeton passent, il
      reste à lire ». S'il rendait `401`, le pont refuserait **tout le monde** ;
      s'il rendait `ok`, il accepterait un appui **sans bouton**.

      *C'est le même contrôle appelé deux fois, et non deux contrôles : deux
      écrivains pour une même décision finissent toujours par diverger.*
    */
    it('corps vide et bon jeton → 400, jamais 401', () => {
        expect(appui({ corps: '' })).toMatchObject({ ok: false, code: 400 });
    });

    it('corps vide et mauvais jeton → 401', () => {
        expect(appui({ corps: '', jeton: 'faux' })).toMatchObject({ ok: false, code: 401 });
    });

    it('corps vide et mauvaise méthode → 405', () => {
        expect(appui({ corps: '', methode: 'GET' })).toMatchObject({ ok: false, code: 405 });
    });
});

describe('le contrat', () => {
    /*
      ⚠️ Le secret voyage dans un EN-TÊTE. Une adresse se retrouve dans les
      journaux du serveur et dans l'historique de Home Assistant.
    */
    it('l’en-tête du jeton est en minuscules — Node normalise ainsi', () => {
        expect(ENTETE_DU_JETON).toBe(ENTETE_DU_JETON.toLowerCase());
    });

    it('la vérification du secret est déléguée, jamais recodée ici', () => {
        const verifier = vi.fn().mockReturnValue(true);

        appui({ leSecretEstBon: verifier });

        expect(verifier, 'le module a comparé le jeton lui-même').toHaveBeenCalledWith(BON);
    });

    it('il y a exactement trois boutons', () => {
        expect(BOUTONS).toHaveLength(3);
    });
});
