import { describe, it, expect } from 'vitest';
import {
    entreePourLOuvertureDeScene, entreePourLaFermetureDeScene, dureeLisible,
} from './journalDeLaTrame';
import { natureParDefaut } from '../../journal/types';
import type { Acte, Scene } from '../../../types/trame.types';

/**
 * **L'ouverture d'une scène laisse une trace — le trou trouvé le 2026-09-12.**
 *
 * Sans entrée à l'ouverture, une scène jouée mais silencieuse n'apparaissait pas
 * dans la revue de séance, et le filet prévu par le plan du 08/08 — *scinder à
 * la revue ce qu'on a oublié de marquer* — était inatteignable dans le seul cas
 * qui l'exigeait.
 *
 * ⭐ **Et l'entrée porte le décor, pas des identifiants.** Demande de David le
 * jour même : *« je veux que tu notes les infos intéressantes — le synopsis de
 * la scène, les joueurs présents, le lieu »*. Le journal est la seule trace qui
 * survive à la soirée.
 */

/** La ligne vide qui sépare les rubriques du synopsis. */
const SEPARATEUR = '\n\n';

const scene = (p: Partial<Scene> = {}): Scene => ({
    id: 'sc-1',
    campaignId: 'c-1',
    acteId: 'a-1',
    ordre: 0,
    titre: 'Amarrage',
    resume: 'Le sas s’ouvre sur un couloir vide.',
    origine: 'preparee',
    entiteIds: [],
    indiceIds: [],
    creeeLe: 1_000,
    ...p,
});

const acte: Acte = { id: 'a-1', campaignId: 'c-1', ordre: 0, titre: 'L’arrivée', resume: '' };

const table = {
    acte,
    lieu: { name: 'Station Varn' },
    personnages: [
        { id: 'pj-1', name: 'Nel Varga' },
        { id: 'pj-2', name: 'Idris Koa' },
    ],
    entites: [{ id: 'pnj-1', name: 'Superviseur Hale' }],
};

/** La scène pleine : un lieu, deux PJ, un PNJ. */
const garnie = () => scene({
    lieuId: 'lieu-1',
    personnagesIds: ['pj-1', 'pj-2'],
    entiteIds: ['pnj-1'],
});

describe('ce qu’on consigne en ouvrant une scène', () => {
    it('nomme la scène, et la rattache explicitement', () => {
        const e = entreePourLOuvertureDeScene(scene(), { acte });

        expect(e).not.toBeNull();
        expect(e!.title).toContain('Amarrage');
        /*
          ⛔ Le rattachement ne peut PAS être déduit : `laSceneCourante()` ne
          répond que s'il y a exactement une scène en cours — et celle qu'on
          ouvre ne l'est pas encore au moment où l'entrée part.
        */
        expect(e!.sceneId).toBe('sc-1');
    });

    /*
      ⭐ La décision qui évite de fausser le résumé : une ouverture est un fait
      mécanique. `SYSTEM` retombe sur `trace`, donc la scène devient visible dans
      la revue SANS entrer dans la chronique. Le résumé, lui, reçoit déjà la
      structure par `leRecitCureDuJournal`, qui groupe par scène.
    */
    it('est une trace, pas de la matière à chronique', () => {
        const e = entreePourLOuvertureDeScene(scene(), { acte })!;
        expect(natureParDefaut(e.type)).toBe('trace');
    });
});

describe('le décor de la scène', () => {
    it('porte l’acte, le lieu, les PJ présents et les PNJ', () => {
        const c = entreePourLOuvertureDeScene(garnie(), table)!.content;

        expect(c).toContain('L’arrivée');
        expect(c).toContain('Station Varn');
        expect(c).toContain('Nel Varga');
        expect(c).toContain('Idris Koa');
        expect(c).toContain('Superviseur Hale');
    });

    /*
      ⛔ **Par leur NOM, jamais par leur identifiant.** « PJ présents : pj-1 » ne
      se relit pas six mois plus tard ; c'est toute la raison d'être de la
      résolution faite dans le magasin.
    */
    it('ne laisse échapper aucun identifiant brut', () => {
        const c = entreePourLOuvertureDeScene(garnie(), table)!.content;

        expect(c).not.toContain('pj-1');
        expect(c).not.toContain('pnj-1');
        expect(c).not.toContain('lieu-1');
    });

    /*
      ⚠️ Une rubrique vide affirme un manque ; une rubrique absente n'affirme
      rien. « Lieu : » suivi de rien se lit comme une information perdue.
    */
    it('omet les rubriques qui n’ont rien à dire', () => {
        const c = entreePourLOuvertureDeScene(scene(), {})!.content;

        expect(c).not.toContain('Lieu :');
        expect(c).not.toContain('PJ présents :');
        expect(c).not.toContain('PNJ :');
        expect(c).not.toContain('Acte :');
        /* Il reste le synopsis, qui est justement ce qu'on relit. */
        expect(c).toContain('Le sas s’ouvre');
    });

    /*
      Un PNJ supprimé après coup laisserait son identifiant brut au milieu d'une
      phrase. On saute ce qui ne désigne plus rien.
    */
    it('saute un identifiant qui ne désigne plus personne', () => {
        const orpheline = scene({ personnagesIds: ['pj-1', 'pj-disparu'] });
        const c = entreePourLOuvertureDeScene(orpheline, table)!.content;

        expect(c).toContain('Nel Varga');
        expect(c).not.toContain('pj-disparu');
        expect(c).not.toContain('undefined');
    });

    it('n’écrit pas de rubrique quand plus personne n’est retrouvé', () => {
        const c = entreePourLOuvertureDeScene(
            scene({ personnagesIds: ['inconnu'] }), table,
        )!.content;

        expect(c).not.toContain('PJ présents');
    });

    /*
      ⭐ Le synopsis vient en dernier et détaché : c'est le seul morceau de prose,
      et le coller aux rubriques le noierait.
    */
    it('met le synopsis en dernier, séparé des rubriques', () => {
        const blocs = entreePourLOuvertureDeScene(garnie(), table)!.content.split(SEPARATEUR);

        expect(blocs.length).toBe(2);
        expect(blocs[0]).toContain('Station Varn');
        expect(blocs[1]).toBe('Le sas s’ouvre sur un couloir vide.');
    });

    it('se passe d’un synopsis absent', () => {
        const c = entreePourLOuvertureDeScene(scene({ resume: '   ' }), table)!.content;

        expect(c).not.toContain(SEPARATEUR);
        expect(c).toContain('L’arrivée');
    });
});

describe('ce qu’on ne consigne PAS', () => {
    /*
      ⛔ `ouvrirLaScene` ne fait rien sur une scène déjà ouverte. Le journal doit
      dire la même chose : *une trace d'un geste qui n'a rien changé est un
      mensonge sur le parcours*, et deux clics sur « commencer » en produiraient
      deux.
    */
    it('rien quand la scène est déjà en cours', () => {
        const enCours = scene({ passages: [{ debut: 1_000 }] });
        expect(entreePourLOuvertureDeScene(enCours, table)).toBeNull();
    });

    it('rien quand la scène n’existe pas', () => {
        expect(entreePourLOuvertureDeScene(undefined, table)).toBeNull();
    });
});

describe('rouvrir n’est pas ouvrir', () => {
    /*
      `ouvrirLaScene` ranime délibérément une scène terminée. En relisant, les
      deux ne racontent pas la même soirée : le groupe est revenu sur ses pas.
    */
    it('le dit dans le titre', () => {
        const close = scene({ termineeLe: 5_000, passages: [{ debut: 1_000, fin: 5_000 }] });

        expect(entreePourLOuvertureDeScene(close, table)!.title).toContain('rouverte');
        expect(entreePourLOuvertureDeScene(scene(), table)!.title).toContain('ouverte');
        expect(entreePourLOuvertureDeScene(scene(), table)!.title).not.toContain('rouverte');
    });

    /* Une scène close sans passage — l'acte s'est achevé et l'a emportée. */
    it('vaut aussi pour une scène close sans avoir été jouée', () => {
        const jamaisJouee = scene({ termineeLe: 5_000 });
        expect(entreePourLOuvertureDeScene(jamaisJouee, table)!.title).toContain('rouverte');
    });
});

describe('ce qu’on consigne en terminant une scène', () => {
    const MINUTE = 60_000;

    it('nomme la scène et dit sa durée', () => {
        const jouee = scene({ passages: [{ debut: 0, fin: 42 * MINUTE }] });
        const e = entreePourLaFermetureDeScene(jouee, 42 * MINUTE)!;

        expect(e.title).toContain('Scène terminée');
        expect(e.title).toContain('Amarrage');
        expect(e.content).toContain('42 min');
        expect(e.sceneId).toBe('sc-1');
    });

    /*
      Le passage encore ouvert se ferme à l'instant même du geste : c'est `quand`
      qui le termine, et la durée doit en tenir compte.
    */
    it('compte le passage encore ouvert jusqu’à maintenant', () => {
        const enCours = scene({ passages: [{ debut: 0 }] });
        expect(entreePourLaFermetureDeScene(enCours, 30 * MINUTE)!.content).toContain('30 min');
    });

    it('additionne les passages d’une scène reprise', () => {
        const reprise = scene({
            passages: [{ debut: 0, fin: 20 * MINUTE }, { debut: 60 * MINUTE }],
        });
        expect(entreePourLaFermetureDeScene(reprise, 75 * MINUTE)!.content).toContain('35 min');
    });

    /*
      ⭐ L'acte s'achève et emporte ses scènes, dont celles où le groupe n'est
      jamais passé. Les confondre avec des scènes jouées ferait croire à une
      partie qui n'a pas eu lieu.
    */
    it('dit qu’une scène jamais jouée est close sans l’avoir été', () => {
        const e = entreePourLaFermetureDeScene(scene(), 10 * MINUTE)!;

        expect(e.content).toContain('sans avoir été jouée');
        expect(e.content).not.toContain('Durée');
    });

    it('ne consigne rien sur une scène déjà terminée, ni sur une scène absente', () => {
        const close = scene({ termineeLe: 5_000, passages: [{ debut: 0, fin: 5_000 }] });

        expect(entreePourLaFermetureDeScene(close, 9_000)).toBeNull();
        expect(entreePourLaFermetureDeScene(undefined, 9_000)).toBeNull();
    });

    it('est une trace, comme l’ouverture', () => {
        const e = entreePourLaFermetureDeScene(scene({ passages: [{ debut: 0 }] }), MINUTE)!;
        expect(natureParDefaut(e.type)).toBe('trace');
    });
});

describe('la durée en clair', () => {
    /*
      ⚠️ Une scène de quarante secondes afficherait « 0 min », ce qui se lit
      comme une erreur plutôt que comme une scène courte.
    */
    it('ne rend jamais « 0 min »', () => {
        expect(dureeLisible(40_000)).toContain('moins d’une minute');
        expect(dureeLisible(0)).toContain('moins d’une minute');
    });

    it('passe aux heures quand il le faut', () => {
        expect(dureeLisible(59 * 60_000)).toBe('59 min');
        expect(dureeLisible(80 * 60_000)).toBe('1 h 20');
        expect(dureeLisible(120 * 60_000)).toBe('2 h');
    });
});
