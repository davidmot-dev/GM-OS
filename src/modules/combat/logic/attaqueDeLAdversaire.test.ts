import { describe, it, expect } from 'vitest';
import {
    attaqueDesEntrees, coupAAppliquer, degatsDuCoup, lireLaReserveDeLAttaque, riposteDeCthulhuHack, tirerLAttaque,
} from './attaqueDeLAdversaire';

/*
  T3 du chantier § 263 (19/11/2026). Les effets cités viennent du bestiaire du pilote Alien
  1.11.0 (export du dépôt) et de `docs/systems/alien/rules/bestiaire-du-livre-de-base.md`.
*/

describe('tirer l’attaque d’une créature au d6 (C3)', () => {
    const lignes = [
        { de: '1', nom: 'Cri', effet: 'Test de Panique.' },
        { de: '2–3', nom: 'Saisie au tentacule', effet: 'Attaque à huit dés de base, Dégâts 1.' },
        { de: '4-5', nom: 'Balayage', effet: 'dix dés de base, Dégâts 1.' },
        { de: '6', nom: 'Viol', effet: 'Jet opposé à dix dés de base contre Combat rapproché.' },
    ];

    it('lit les fourchettes « 2–3 » et « 4-5 » comme le tirage existant', () => {
        expect(tirerLAttaque(lignes, 3)).toEqual({ code: 3, nom: 'Saisie au tentacule', effet: 'Attaque à huit dés de base, Dégâts 1.' });
        expect(tirerLAttaque(lignes, 4)?.nom).toBe('Balayage');
        expect(tirerLAttaque(lignes, 6)?.nom).toBe('Viol');
    });

    it('un dé qu’aucune ligne ne couvre ne tire pas une autre attaque en silence', () => {
        expect(tirerLAttaque(lignes.slice(1), 1)).toBeNull();
        expect(tirerLAttaque([], 4)).toBeNull();
    });

    it('une table du disque garde sa description et son effet', () => {
        const entrees = [{ min: 1, max: 6, title: 'Coup de queue', description: 'Il fouette.', effect: 'six dés de base, Dégâts 2' }];
        expect(attaqueDesEntrees(entrees, 5)).toEqual({ code: 5, nom: 'Coup de queue', effet: 'Il fouette. — six dés de base, Dégâts 2' });
    });
});

describe('lire « N dés de base, Dégâts M » (C3)', () => {
    it.each([
        ['neuf dés de base, Dégâts 2 ; si elle touche, la cible est à terre', 9, 2],
        ['Attaque avec dix dés de base, Dégâts de 1.', 10, 1],
        ['*: Quatorze dés de base, Dégâts 2. Si dégâts, réduit l’Esprit', 14, 2],
        ['Bête affamée : une seconde contre la même cible (huit dés de base, Dégâts 1)', 8, 1],
        ['Cinq dés de base, Dégâts 2.', 5, 2],
        ['12 dés de base, Dégâts 3', 12, 3],
    ])('« %s » → %i dés, Dégâts %i', (effet, des, degats) => {
        expect(lireLaReserveDeLAttaque(effet)).toMatchObject({ des, degats, perforant: false, oppose: false });
    });

    it('sans dégâts écrits, la réserve seule', () => {
        const r = lireLaReserveDeLAttaque('*: Dix dés de base. Si réussi, cible agrippée (Broyage et fracture au Round suivant).');
        expect(r).toEqual({ des: 10, perforant: false, oppose: false });
        expect(lireLaReserveDeLAttaque('son Empalement caudal lance quatorze dés de base')).toEqual({ des: 14, perforant: false, oppose: false });
    });

    it('seule la première attaque compte : la seconde ne prête ni ses dégâts ni son perforant', () => {
        expect(lireLaReserveDeLAttaque('huit dés de base, Dégâts 1, contre une victime, puis six dés de base, Dégâts 1, perforant, contre une seconde'))
            .toEqual({ des: 8, degats: 1, perforant: false, oppose: false });
        expect(lireLaReserveDeLAttaque('Huit dés de base. Si réussi, cible agrippée et déchiquetée (huit dés); si dégâts, tire la blessure critique'))
            .toEqual({ des: 8, perforant: false, oppose: false });
        expect(lireLaReserveDeLAttaque('Six dés de base, Dégâts 1. Cible à terre puis attaque bonus non blocable à huit dés de base, Dégâts 2.'))
            .toMatchObject({ des: 6, degats: 1 });
    });

    it('signale le perforant et le test opposé', () => {
        expect(lireLaReserveDeLAttaque('six dés de base, Dégâts 1, perforant.')).toMatchObject({ perforant: true });
        expect(lireLaReserveDeLAttaque('*: Quatorze dés de base, Dégâts 1 (perce-armure). Si dégâts…')).toMatchObject({ perforant: true, degats: 1 });
        expect(lireLaReserveDeLAttaque('test opposé de dix dés de base contre le Combat rapproché de la cible.')).toMatchObject({ des: 10, oppose: true });
    });

    it('un effet sans réserve ne s’invente pas de jet', () => {
        expect(lireLaReserveDeLAttaque('Test d’Esprit pur ou perte des prochaines actions rapide et lente.')).toBeNull();
        expect(lireLaReserveDeLAttaque('Sifflement appelant D6 Soldats et deux Prétoriens en défense au Round suivant')).toBeNull();
        expect(lireLaReserveDeLAttaque('')).toBeNull();
    });
});

describe('les dégâts d’un coup au jet à réserve (C2)', () => {
    it('arme + 1 par réussite au-delà de la première', () => {
        expect(degatsDuCoup(2, 1)).toBe(2);
        expect(degatsDuCoup(2, 3)).toBe(4);
        expect(degatsDuCoup(1, 2)).toBe(2);
    });

    it('aucune réussite : le coup manque', () => {
        expect(degatsDuCoup(3, 0)).toBe(0);
    });

    it('arme inconnue : rien de proposé, on ne devine pas', () => {
        expect(degatsDuCoup(undefined, 3)).toBeNull();
        expect(degatsDuCoup(Number.NaN, 3)).toBeNull();
    });
});

describe('le coup à appliquer à la cible (T7)', () => {
    const reserve = (n: number) => ({ total: n, successes: n, compte: 'reussites' as const });
    const yz = 'arme-plus-succes' as const;

    it('jet à réserve de Year Zero : arme + succès − 1, puis la protection', () => {
        expect(coupAAppliquer({ resultat: reserve(3), regle: yz, degatsDeLArme: 2 })).toEqual({ montant: 4, calcul: 'arme 2 + 3 succès − 1 = 4' });
        expect(coupAAppliquer({ resultat: reserve(3), regle: yz, degatsDeLArme: 2, protection: 1 }))
            .toEqual({ montant: 3, calcul: 'arme 2 + 3 succès − 1 = 4, − protection 1 = 3' });
    });

    it('la protection ne fait jamais descendre sous zéro', () => {
        expect(coupAAppliquer({ resultat: reserve(1), regle: yz, degatsDeLArme: 1, protection: 3 }).montant).toBe(0);
    });

    it('aucun succès : le coup manque', () => {
        expect(coupAAppliquer({ resultat: reserve(0), regle: yz, degatsDeLArme: 3 })).toMatchObject({ montant: 0, raison: 'rate' });
    });

    it('arme inconnue : rien à envoyer, et on dit ce qui manque', () => {
        expect(coupAAppliquer({ resultat: reserve(2), regle: yz })).toMatchObject({ montant: null, raison: 'arme-inconnue' });
    });

    it('§ 267, T0 : un jet en réussites d’un autre jeu ne reçoit pas la règle de Year Zero, le montant se saisit', () => {
        expect(coupAAppliquer({ resultat: reserve(3), degatsDeLArme: 2 })).toMatchObject({ montant: null, raison: 'montant-a-saisir' });
        expect(coupAAppliquer({ resultat: reserve(3), regle: 'montant', montantSaisi: 6, protection: 1 }).montant).toBe(5);
    });

    it('un autre jet ne dit pas ses dégâts : le montant saisi, moins la protection', () => {
        expect(coupAAppliquer({ resultat: { total: 14 } })).toMatchObject({ montant: null, raison: 'montant-a-saisir' });
        expect(coupAAppliquer({ resultat: { total: 14 }, montantSaisi: 5, protection: 2 }).montant).toBe(3);
    });
});

describe('la riposte d’un adversaire de Cthulhu Hack (C6)', () => {
    it('dégâts fixes moins l’Armure du PJ, jamais sous zéro', () => {
        expect(riposteDeCthulhuHack(4, 1, false)).toBe(3);
        expect(riposteDeCthulhuHack(2, 3, false)).toBe(0);
    });

    it('sur un 20 naturel, les dégâts doublés, puis la protection (D5, David, 19/11 ; livre p. 48)', () => {
        expect(riposteDeCthulhuHack(4, 1, true), 'Revolver 4 contre 1 PA : 8 − 1').toBe(7);
        expect(riposteDeCthulhuHack(2, 3, true), '4 − 3').toBe(1);
        expect(riposteDeCthulhuHack(1, 3, true), 'jamais sous zéro').toBe(0);
    });
});
