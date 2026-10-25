import { describe, it, expect } from 'vitest';
import {
    autreCamp,
    campDe,
    ouvrirLeRound,
    candidats,
    restants,
    roundTermine,
    agir,
    passerLaMain,
    conserverLaMain,
    retentionPossible,
    ouvertureGratuite,
    ouvrirLeRoundSuivant,
    agirDansSonCamp,
    campQuiALaMain,
    secondTourDuCamp,
    initiativeParCamps,
    type DescripteurDInitiative,
} from './OrdreDuTour';
import type { Combatant } from '../types';

/**
 * Les règles testées viennent de
 * `docs/systems/dune/rules/initiative-et-deroulement-du-tour.md`, fiche v3.
 */
const DUNE: DescripteurDInitiative = {
    mode: 'alternance',
    coutDeRetention: { montant: 2, ressource: 'impulsion' },
    coutDOuverture: { montant: 2, ressource: 'impulsion' },
    activationsConsecutivesMax: 2,
};

const combattant = (id: string, p: Partial<Combatant> = {}): Combatant => ({
    id,
    name: id,
    init: 0,
    hp: 0,
    hpMax: 0,
    isPlayer: false,
    faction: 'enemy',
    statuses: [],
    ...p,
});

const PAUL = combattant('paul', { isPlayer: true, faction: 'player' });
const DUNCAN = combattant('duncan', { faction: 'ally' });
const HARKONNEN = combattant('harkonnen');
const SARDAUKAR = combattant('sardaukar');
const TABLE = [PAUL, DUNCAN, HARKONNEN, SARDAUKAR];

describe('Dune : reprise et résultat de l’action (p. 165–167)', () => {
    const regle = { ...DUNE, repriseDune: true };
    it('un PJ seul peut reprendre la main pour lui-même', () => {
        const t = agir(ouvrirLeRound('joueurs'), PAUL.id);
        expect(retentionPossible(regle, [PAUL, HARKONNEN], t).possible).toBe(true);
        expect(retentionPossible(regle, TABLE, { ...t, actionDune: 'attaque-ratee' }).possible).toBe(false);
        expect(retentionPossible(regle, TABLE, { ...t, actionDune: 'deplacement-rate' }).possible).toBe(false);
        expect(retentionPossible(regle, TABLE, { ...t, actionDune: 'discretion' }).cout).toBeUndefined();
    });
    it('la reprise ne duplique pas les tours pris et reste plafonnée', () => {
        const t = agir(ouvrirLeRound('joueurs'), PAUL.id);
        const deux = agir({ ...t, repriseDune: PAUL.id }, PAUL.id);
        expect(deux.ontAgi).toEqual([PAUL.id]);
        expect(retentionPossible(regle, TABLE, deux).possible).toBe(false);
    });
});

describe('les camps', () => {
    it('un allié du meneur agit avec les joueurs', () => {
        // Le livre oppose des camps, pas des fiches. Sans cela, un PNJ allié
        // attendrait son tour dans le camp d'en face.
        expect(campDe(PAUL)).toBe('joueurs');
        expect(campDe(DUNCAN)).toBe('joueurs');
        expect(campDe(HARKONNEN)).toBe('adversaires');
    });

    it('les neutres rejoignent les adversaires — limite assumée', () => {
        // « Les sources ne précisent pas comment s'organise l'alternance si plus
        // de deux camps s'affrontent. » On n'en invente pas un troisième.
        expect(campDe(combattant('contrebandier', { faction: 'neutral' }))).toBe('adversaires');
    });

    it('alterner, c\'est passer à l\'autre', () => {
        expect(autreCamp('joueurs')).toBe('adversaires');
        expect(autreCamp('adversaires')).toBe('joueurs');
    });
});

describe('le round', () => {
    it('s\'ouvre sur le camp que le meneur désigne — aucun tri nulle part', () => {
        const etat = ouvrirLeRound('adversaires');
        expect(etat.campActif).toBe('adversaires');
        expect(etat.ontAgi).toEqual([]);
        expect(etat.round).toBe(1);
    });

    it('ne propose que le camp actif', () => {
        const etat = ouvrirLeRound('joueurs');
        expect(candidats(TABLE, etat).map(c => c.id)).toEqual(['paul', 'duncan']);
    });

    it('s\'achève quand tout le monde a agi', () => {
        let etat = ouvrirLeRound('joueurs');
        expect(roundTermine(TABLE, etat)).toBe(false);
        for (const c of TABLE) etat = agir(etat, c.id);
        expect(roundTermine(TABLE, etat)).toBe(true);
        expect(restants(TABLE, etat)).toEqual([]);
    });

    it('un camp à court de combattants laisse l\'autre finir', () => {
        /**
         * « Si un camp n'a plus de personnages disponibles, les combattants
         * restants de l'autre camp effectuent leurs tours les uns après les
         * autres. » Sans ce repli, un round ne s'achèverait jamais dès que les
         * effectifs sont inégaux — c'est-à-dire presque toujours.
         */
        let etat = ouvrirLeRound('joueurs');
        etat = agir(etat, 'paul');
        etat = agir(etat, 'duncan');
        // La main est aux joueurs, mais ils ont tous joué.
        expect(etat.campActif).toBe('joueurs');
        expect(candidats(TABLE, etat).map(c => c.id)).toEqual(['harkonnen', 'sardaukar']);
    });
});

describe('agir et céder — deux gestes, pas un', () => {
    it('agir ne passe pas la main, il ouvre une décision', () => {
        // C'est ce qui rend la rétention exprimable. Les fusionner était
        // exactement l'erreur du mode « formule ».
        const etat = agir(ouvrirLeRound('joueurs'), 'paul');
        expect(etat.campActif).toBe('joueurs');
        expect(etat.dernierAgissant).toBe('paul');
        expect(etat.activationsConsecutives).toBe(1);
        expect(etat.enAttenteDeDecision).toBe(true);
    });

    it('céder rend la main et remet le compteur à zéro', () => {
        const etat = passerLaMain(agir(ouvrirLeRound('joueurs'), 'paul'));
        expect(etat.campActif).toBe('adversaires');
        expect(etat.activationsConsecutives).toBe(0);
        expect(etat.enAttenteDeDecision).toBe(false);
    });

    it('conserver referme la décision sans rendre la main', () => {
        // L'écran doit revenir à la désignation d'un intervenant, et le camp
        // garder son compteur — c'est lui qui tient le plafond de deux tours.
        const etat = conserverLaMain(agir(ouvrirLeRound('joueurs'), 'paul'));
        expect(etat.campActif).toBe('joueurs');
        expect(etat.activationsConsecutives).toBe(1);
        expect(etat.enAttenteDeDecision).toBe(false);
    });

    it('agir deux fois du même combattant ne compte qu\'une', () => {
        const une = agir(ouvrirLeRound('joueurs'), 'paul');
        expect(agir(une, 'paul')).toEqual(une);
    });
});

describe('conserver l\'initiative', () => {
    it('coûte deux points, et le dit avant', () => {
        const etat = agir(ouvrirLeRound('joueurs'), 'paul');
        const r = retentionPossible(DUNE, TABLE, etat);
        expect(r.possible).toBe(true);
        expect(r.cout).toEqual({ montant: 2, ressource: 'impulsion' });
    });

    it('est refusée au-delà de deux tours consécutifs, avec le motif', () => {
        // « Un même camp ne peut pas enchaîner plus de deux tours d'action
        // consécutifs. Conserver l'initiative est impossible tant qu'au moins un
        // ennemi n'a pas agi. »
        let etat = ouvrirLeRound('joueurs');
        etat = agir(etat, 'paul');
        etat = agir(etat, 'duncan');
        const r = retentionPossible(DUNE, TABLE, etat);
        expect(r.possible).toBe(false);
        expect(r.raison).toContain('un adversaire agisse');
    });

    it('est refusée quand le camp n\'a plus personne à faire agir', () => {
        let etat = ouvrirLeRound('joueurs');
        etat = agir(etat, 'paul');
        // Un seul joueur à cette table : plus personne derrière lui.
        const r = retentionPossible({ ...DUNE, activationsConsecutivesMax: 5 }, [PAUL, HARKONNEN], etat);
        expect(r.possible).toBe(false);
        expect(r.raison).toContain('Plus personne');
    });

    it('le compteur repart après que l\'adversaire a agi', () => {
        let etat = ouvrirLeRound('joueurs');
        etat = agir(etat, 'paul');
        etat = agir(etat, 'duncan');
        expect(retentionPossible(DUNE, TABLE, etat).possible).toBe(false);
        etat = agir(passerLaMain(etat), 'harkonnen');
        expect(retentionPossible(DUNE, TABLE, etat).possible).toBe(true);
    });
});

describe('le round suivant', () => {
    it('s\'ouvre gratuitement sur le camp adverse du dernier agissant', () => {
        // « Le dernier personnage à avoir agi désigne le camp qui commencera le
        // round suivant, ou paie pour que son propre camp débute. » Céder est
        // gratuit ; reprendre se paie.
        let etat = ouvrirLeRound('joueurs');
        for (const c of TABLE) etat = agir(etat, c.id);
        expect(etat.dernierAgissant).toBe('sardaukar');
        expect(ouvertureGratuite(TABLE, etat)).toBe('joueurs');
    });

    it('remet tout à zéro et compte le round', () => {
        let etat = ouvrirLeRound('joueurs');
        for (const c of TABLE) etat = agir(etat, c.id);
        const suivant = ouvrirLeRoundSuivant(etat, 'adversaires');
        expect(suivant).toEqual({
            round: 2,
            campActif: 'adversaires',
            ontAgi: [],
            activationsConsecutives: 0,
            enAttenteDeDecision: false,
        });
    });
});

/**
 * **Torg : le Paquet d'Action** (2026-10-13). La carte désigne le camp qui
 * commence ; il joue tous ses tours dans l'ordre de son choix, puis l'autre.
 */
describe('le mode « paquet » de Torg', () => {
    it('le camp garde la main tant qu’il lui reste quelqu’un — ni cession, ni rétention', () => {
        let tour = ouvrirLeRound('joueurs');
        tour = agirDansSonCamp(tour, 'paul');
        expect(tour.enAttenteDeDecision).toBe(false);
        expect(candidats(TABLE, tour).map(c => c.id)).toEqual(['duncan']);
        expect(campQuiALaMain(TABLE, tour)).toBe('joueurs');
    });

    it('le camp épuisé, l’autre joue tous ses tours', () => {
        let tour = ouvrirLeRound('joueurs');
        tour = agirDansSonCamp(agirDansSonCamp(tour, 'paul'), 'duncan');
        expect(campQuiALaMain(TABLE, tour)).toBe('adversaires');
        expect(candidats(TABLE, tour).map(c => c.id)).toEqual(['harkonnen', 'sardaukar']);
        tour = agirDansSonCamp(agirDansSonCamp(tour, 'harkonnen'), 'sardaukar');
        expect(roundTermine(TABLE, tour)).toBe(true);
    });

    it('Vivacité : le camp rejoue un tour complet', () => {
        let tour = ouvrirLeRound('joueurs');
        tour = agirDansSonCamp(agirDansSonCamp(tour, 'paul'), 'duncan');
        tour = secondTourDuCamp(TABLE, tour, 'joueurs');
        expect(campQuiALaMain(TABLE, tour)).toBe('joueurs');
        expect(candidats(TABLE, tour).map(c => c.id)).toEqual(['paul', 'duncan']);
    });

    it('ne demande pas d’initiative chiffrée, comme l’alternance', () => {
        expect(initiativeParCamps('paquet')).toBe(true);
        expect(initiativeParCamps('alternance')).toBe(true);
        expect(initiativeParCamps('formule')).toBe(false);
        expect(initiativeParCamps(undefined)).toBe(false);
    });
});
