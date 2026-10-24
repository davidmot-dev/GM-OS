import { describe, expect, it } from 'vitest';
import { appliquerOperationDeVoyageur, type DonneesDeVoyage, type OperationDeVoyageur } from './operationsDeVoyageur';
import {
    lireHautReve, proposerCaseHumide, proposerDeclenchement, proposerEffetDeDragon, proposerEffetDecide, proposerLutte,
    proposerRefoulement, proposerRencontre, proposerResistance, proposerSort, reservesDuLivret,
} from './hautReveDuVoyageur';
import { lireProgression } from './progressionDuVoyageur';

/** Nitouche dans l'exemple général du Livre du Haut-Rêve (p. 193–194) : RÊVE 15, Hypnos +3. */
const nitouche: DonneesDeVoyage = {
    reve: 15, reve_seuil: 15, reve_pts: 13, onrios: -2, hypnos: 3, narcos: 1, thanatos: -11, vie: 11, vie_max: 11, endurance: 23,
    spells_0_path: 'Hypnos', spells_0_name: 'Invocation du Guerrier Sorde', spells_0_tmr: 'Cité Sordide (D13)', spells_0_difficulty: -8, spells_0_dreamCost: 7, spells_0_cellBonus: '',
    spells_1_path: 'Hypnos', spells_1_name: 'Tympan d’Hypnos', spells_1_tmr: 'Collines d’Encre (J4)', spells_1_difficulty: 5, spells_1_dreamCost: 2, spells_1_cellBonus: '8',
};
const appliquer = (d: DonneesDeVoyage, p: OperationDeVoyageur) => appliquerOperationDeVoyageur(d, p)!;

describe('Le Haut-Rêve sur la fiche du Voyageur', () => {
    it('une Fleur maîtrisée ajoute sa force au rêve', () => {
        const d = appliquer(nitouche, proposerRencontre(nitouche, { genre: 'cite', d100: 55, force: 4, choix: 'maitriser', d100Maitrise: 10 }, 'fleur'));
        expect(d.reve_pts).toBe(17);
    });

    it('un Changeur de 9 manqué ne coûte rien au rêve, comme pour Nitouche', () => {
        const p = proposerRencontre(nitouche, { genre: 'desert', d100: 55, force: 9, choix: 'maitriser', d100Maitrise: 42 }, 'changeur');
        expect(p.details.join(' ')).toMatch(/26 %.*non maîtrisé/);
        expect(appliquer(nitouche, p).reve_pts).toBe(13);
    });

    it('un Tourbillon blanc emprisonne, aspire un rêve par round, puis fait dériver', () => {
        let d = appliquer(nitouche, proposerRencontre(nitouche, { genre: 'desolation', d100: 70, force: 4, choix: 'maitriser', d100Maitrise: 61 }, 'tourbillon'));
        expect(d.reve_pts).toBe(12);
        expect(lireHautReve(d).lutte).toMatchObject({ rencontre: 'tourbillon-blanc', rounds: 1 });
        d = appliquer(d, proposerLutte(d, 84, 'r3'));
        d = appliquer(d, proposerLutte(d, 90, 'r4'));
        expect(d.reve_pts).toBe(10);
        const fin = proposerLutte(d, 4, 'r5');
        expect(fin.details.join(' ')).toMatch(/dérive de 3 case/);
        expect(lireHautReve(appliquer(d, fin)).lutte).toBeNull();
    });

    it('refouler marque le compteur, le recopie sur le livret et peut déclencher un souffle', () => {
        const d = appliquer(nitouche, proposerRencontre(nitouche, { genre: 'cite', d100: 99, force: 9, choix: 'refouler', d20: 15 }, 'rdd'));
        expect(lireHautReve(d).refoulement).toBe(2);
        expect(d.magic_repression).toBe('2');
        const craque = appliquer(d, proposerRefoulement(d, 3, 'encore'));
        expect(lireHautReve(craque).refoulement).toBe(0);
        expect(lireHautReve(craque).enAttente.map(e => e.type)).toEqual(['souffle']);
    });

    it('un Rêve de Dragon maîtrisé en particulière : rêve, seuil, tête et expérience', () => {
        const d = appliquer({ ...nitouche, reve_seuil: 14 }, proposerRencontre({ ...nitouche, reve_seuil: 14 },
            { genre: 'plaines', rencontreId: 'reve-de-dragon', force: 9, choix: 'maitriser', d100Maitrise: 1 }, 'rdd'));
        expect(d.reve_pts).toBe(22);
        expect(d.reve_seuil).toBe(15);
        expect(lireHautReve(d).enAttente.map(e => e.type)).toEqual(['tete']);
        expect(lireProgression(d).exercice).toMatchObject({ hypnos: 3, reve: 3 });
    });

    it('la case humide manquée rompt la concentration ; l’échec total donne un souffle', () => {
        const d = { ...nitouche, reve_pts: 10 };
        expect(proposerCaseHumide(d, 70, 'f').details.join(' ')).toMatch(/30 %.*Concentration rompue/s);
        expect(lireHautReve(appliquer(d, proposerCaseHumide(d, 100, 'ft'))).enAttente[0].type).toBe('souffle');
    });

    it('lance le Guerrier Sorde : RÊVE à −5, sept points dépensés', () => {
        const d = { ...nitouche, reve_pts: 8 };
        const p = proposerSort(d, { ligne: 0, d100: 28, rituel: false, astrologie: 0, depuisSaCase: true, reserve: false }, 'sort');
        expect(p.details[0]).toMatch(/à -5/);
        expect(appliquer(d, p).reve_pts).toBe(1);
    });

    it('le bonus de case grandit à chaque réussite depuis la même case', () => {
        const p = proposerSort(nitouche, { ligne: 1, d100: 30, rituel: false, astrologie: 0, depuisSaCase: true, reserve: false }, 'tympan');
        expect(p.details[0]).toMatch(/\+ 8 % de case — 68 %/);
        expect(appliquer(nitouche, p).spells_1_cellBonus).toBe('9');
    });

    it('la mise en réserve coûte un point de plus et respecte le niveau de la voie', () => {
        let d = appliquer(nitouche, proposerSort(nitouche, { ligne: 1, d100: 30, rituel: false, astrologie: 0, depuisSaCase: false, reserve: true }, 'r1'));
        expect(d.reve_pts).toBe(10);
        expect(reservesDuLivret(d)[0]).toMatchObject({ nom: 'Tympan d’Hypnos', voie: 'Hypnos' });
        d = { ...d, hypnos: 1 };
        expect(() => proposerSort(d, { ligne: 1, d100: 30, rituel: false, astrologie: 0, depuisSaCase: false, reserve: true }, 'r2')).toThrow(/au plus/);
        expect(() => proposerSort(d, { ligne: 0, d100: 30, rituel: true, astrologie: 0, depuisSaCase: false, reserve: true }, 'r3')).toThrow(/rituels/);
        const libere = appliquer(d, proposerDeclenchement(d, 0, 'dec'));
        expect(reservesDuLivret(libere)[0].nom).toBe('');
    });

    it('un échec total au lancer coûte 150 % et peut endormir', () => {
        const d = { ...nitouche, reve_pts: 8 };
        const e = appliquer(d, proposerSort(d, { ligne: 0, d100: 100, rituel: false, astrologie: 0, depuisSaCase: false, reserve: false }, 'et'));
        expect(e.reve_pts).toBe(0);
    });

    it('le JR se joue au rêve actuel et rapporte un point de RÊVE en particulière', () => {
        const d = appliquer(nitouche, proposerResistance(nitouche, -8, 1, 'jr'));
        expect(lireProgression(d).exercice.reve).toBe(1);
    });

    it('tire une queue en attente, la recopie sur le livret, puis la refoule', () => {
        let d = appliquer(nitouche, proposerEffetDecide(nitouche, 'queue', 'Rêve de Dragon non maîtrisé', 'q'));
        const source = lireHautReve(d).enAttente[0].id;
        d = appliquer(d, proposerEffetDeDragon(d, { source, d100: 72, sousDe: 1 }, 'tirage'));
        expect(String(d.magic_dragonEffects)).toMatch(/Désir lancinant — Danser nu sous la pluie/);
        const effet = lireHautReve(d).actifs[0];
        expect(effet.refoulable).toBe(1);
        d = appliquer(d, proposerRefoulement(d, 20, 'ref', effet.id));
        expect(lireHautReve(d).actifs).toEqual([]);
        expect(lireHautReve(d).refoulement).toBe(1);
    });

    it('consomme aussi les queues laissées par le Château Dormant', () => {
        const d: DonneesDeVoyage = { ...nitouche, __rddRepos231: { version: 1, jour: 0, heuresDormies: 0, dernierBilan: '', bilans: [], maladieOuPoison: false, vieApresJour: 0,
            effets: [{ id: 'nuit-queue', type: 'queue', nombre: 2, motif: 'Rêve de Dragon force 12' }] } };
        const apres = appliquer(d, proposerEffetDeDragon(d, { source: 'repos:nuit-queue', d100: 30 }, 't'));
        expect((apres.__rddRepos231 as { effets: { nombre: number }[] }).effets[0].nombre).toBe(1);
        expect(lireHautReve(apres).actifs).toEqual([]); // un coup de barre est immédiat
    });

    it('après Thanatos, la prochaine queue est une ombre', () => {
        const d = { ...nitouche, thanatos: 2, spells_2_path: 'Thanatos', spells_2_name: 'Griffe', spells_2_tmr: 'Nécropole', spells_2_difficulty: 5, spells_2_dreamCost: 3 };
        let e = appliquer(d, proposerSort(d, { ligne: 2, d100: 20, rituel: false, astrologie: 0, depuisSaCase: false, reserve: false }, 'th'));
        e = appliquer(e, proposerEffetDecide(e, 'queue', 'essai', 'q2'));
        const tirage = proposerEffetDeDragon(e, { source: lireHautReve(e).enAttente[0].id, d100: 40 }, 'o');
        expect(tirage.motif).toMatch(/Ombre de Thanatos — Désir de boire du sang chaud/);
    });
});
