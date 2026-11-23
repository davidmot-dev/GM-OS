import { describe, it, expect } from 'vitest';
import {
    armesDeBarbarians, armesDuCatalogue, attaqueDeBarbarians, attaqueDeDeltaGreen, lancerLesDegatsDeBarbarians, attaqueDeVampire, attaqueDesEntrees, attaqueParDefaut, coupAAppliquer, degatsDuCoup, lireLaReserveDeLAttaque,
    riposteDeCthulhuHack, tirerLAttaque,
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

/*
  § 267, T1 (22/11/2026) : Vampire V5 — « le vainqueur inflige des dégâts égaux à sa marge de
  réussites, plus le bonus d'arme » (p. 126, 303) ; l'armure change le type, elle ne retire rien.
*/
describe('Vampire : la marge plus l’arme (T1)', () => {
    const jet = { total: 4, successes: 4 };
    const vampire = 'marge-plus-arme' as const;

    it('marge 2 + pistolet 9 mm (+3) = 5, et l’armure ne retire rien', () => {
        expect(coupAAppliquer({ resultat: jet, regle: vampire, marge: 2, degatsDeLArme: 3, protection: 4 }))
            .toEqual({ montant: 5, calcul: 'marge 2 + arme 3 = 5' });
    });
    it('aucune marge : le coup ne porte pas ; sans arme choisie, le bonus se saisit', () => {
        expect(coupAAppliquer({ resultat: jet, regle: vampire, marge: 0, degatsDeLArme: 3 })).toMatchObject({ montant: 0, raison: 'rate' });
        expect(coupAAppliquer({ resultat: jet, regle: vampire, degatsDeLArme: 3 })).toMatchObject({ montant: 0, raison: 'rate' });
        expect(coupAAppliquer({ resultat: jet, regle: vampire, marge: 2 })).toMatchObject({ montant: null, raison: 'arme-inconnue' });
        expect(coupAAppliquer({ resultat: jet, regle: vampire, marge: 2, degatsDeLArme: 0 }).montant).toBe(2);
    });

    const CATALOGUE = { catalogue: { objets: [
        { id: 'a', famille: 'arme', nom: 'Improvisée, pieu', valeurs: { 'valeur-de-degats': '+0' } },
        { id: 'b', famille: 'arme', nom: 'De mêlée lourde (épée longue, hache de pompier)', valeurs: { 'valeur-de-degats': '+3' } },
        { id: 'c', famille: 'arme', nom: 'À feu moyenne (pistolet 9 mm)', valeurs: { 'valeur-de-degats': '+3' } },
        { id: 'd', famille: 'protection', nom: 'Kevlar', valeurs: { 'valeur-d-armure': 4 } },
        { id: 'e', famille: 'arme', nom: 'Sans valeur', valeurs: {} },
    ] } } as never;

    it('les armes du catalogue et leur bonus, les armes à feu d’abord pour un tir', () => {
        expect(armesDuCatalogue(CATALOGUE).map(a => `${a.libelle} ${a.degats}`))
            .toEqual(['Improvisée, pieu 0', 'De mêlée lourde (épée longue, hache de pompier) 3', 'À feu moyenne (pistolet 9 mm) 3']);
        expect(armesDuCatalogue(CATALOGUE, true)[0].libelle).toBe('À feu moyenne (pistolet 9 mm)');
        expect(armesDuCatalogue(null)).toEqual([]);
    });

    it('le lieutenant de police tire avec son groupement « Armes à feu 5 » (p. 371)', () => {
        const lieutenant = { groupement_1_nom: 'Physique', groupement_1: 4, groupement_4_nom: 'Armes à feu', groupement_4: 5, groupement_7_nom: 'Investigation', groupement_7: 6 };
        expect(attaqueDeVampire(lieutenant)).toEqual({ champs: { attribut: 'groupement_4' }, tir: true });
        expect(attaqueParDefaut({ jet: { vampire: {} } }, [], lieutenant)).toEqual({ attribut: 'groupement_4' });
    });
    it('sans groupement : Dextérité + Armes à feu, puis Force + Mêlée ou Bagarre ; rien d’offensif, rien de proposé', () => {
        expect(attaqueDeVampire({ dexterite: 3, armes_a_feu: 2, melee: 3 })).toEqual({ champs: { attribut: 'dexterite', competence: 'armes_a_feu' }, tir: true });
        expect(attaqueDeVampire({ force: 3, melee: 2 })).toEqual({ champs: { attribut: 'force', competence: 'melee' }, tir: false });
        expect(attaqueDeVampire({ force: 3, bagarre: 1 })).toEqual({ champs: { attribut: 'force', competence: 'bagarre' }, tir: false });
        expect(attaqueDeVampire({ force: 3 })).toBeNull();
        expect(attaqueDeVampire({ groupement_1_nom: 'Mêlée', groupement_1: 3, groupement_2_nom: 'Armes à feu', groupement_2: 2 }))
            .toEqual({ champs: { attribut: 'groupement_1' }, tir: false });
    });
});

describe('COC : l’attaque proposée (§ 267, T2)', () => {
    const COC = { jet: { coc: { dommages: { armes: [1, 2, 3].map(n => ({ attaque: `arme${n}_attaque`, nom: `arme${n}` })) } } } };
    it('la première arme nommée dont la fiche porte l’attaque', () => {
        expect(attaqueParDefaut(COC, [], { arme1: '', arme2: 'Revolver', arme2_attaque: 3, attaque_au_contact: 2 })).toEqual({ caracteristique: 'arme2_attaque' });
    });
    it('sans arme : l’attaque au contact, puis à distance ; rien quand la fiche ne porte aucune attaque', () => {
        expect(attaqueParDefaut(COC, [], { attaque_au_contact: 0 })).toEqual({ caracteristique: 'attaque_au_contact' });
        expect(attaqueParDefaut(COC, [], { attaque_a_distance: 2 })).toEqual({ caracteristique: 'attaque_a_distance' });
        expect(attaqueParDefaut(COC, [], { arme1: 'Couteau' })).toBeNull();
    });
});

describe('Delta Green : l’attaque proposée (§ 267, T3)', () => {
    it('la compétence de la première arme nommée, et son numéro pour la carte de dégâts', () => {
        const agent = { arme1: '', arme2: 'Glock 17', arme2_competence: 'Armes à feu', armes_a_feu: 50, combat_a_mains_nues: 40 };
        expect(attaqueDeDeltaGreen(agent)).toEqual({ champs: { competence: 'armes_a_feu' }, arme: '2' });
        expect(attaqueParDefaut({ jet: { deltaGreen: {} } }, [], agent)).toEqual({ competence: 'armes_a_feu' });
        expect(attaqueDeDeltaGreen({ arme1: 'Machette', arme1_competence: 'Armes de mêlée', armes_de_melee: 30 }))
            .toEqual({ champs: { competence: 'armes_de_melee' }, arme: '1' });
    });
    it('une arme dont la compétence n’est pas sur la fiche est passée ; sans arme, les mains nues ; sinon rien', () => {
        expect(attaqueDeDeltaGreen({ arme1: 'Arc', arme1_competence: 'Tir à l’arc', combat_a_mains_nues: 40 })).toEqual({ champs: { competence: 'combat_a_mains_nues' } });
        expect(attaqueDeDeltaGreen({})).toBeNull();
    });
});

/*
  § 267, T4 (23/11/2026) : Barbarians of Lemuria — le dé de l'arme plus la Vigueur, ou sa moitié à
  distance et à mains nues ; +6 au Coup dévastateur (p. 49-53, 56-60, 62-63).
*/
describe('Barbarians of Lemuria : l’arme, l’attaque et ses dégâts (§ 267, T4)', () => {
    const suite = (...des: number[]) => { let i = 0; return () => des[i++]; };

    it('les armes de la fiche, puis la colonne « armes » du livre ; une arme de jet est à distance', () => {
        expect(armesDeBarbarians({ arme1: 'Épée', arme1_degats: 'd6', arme2: 'Arc court', arme2_degats: 'd6', arme3: 'Rien', arme3_degats: '' }))
            .toEqual([{ libelle: 'Épée', formule: 'd6', distance: false }, { libelle: 'Arc court', formule: 'd6', distance: true }]);
        expect(armesDeBarbarians({ armes: 'Khastok (lance lourde) d6B, Couteau d6M' })).toEqual([
            { libelle: 'Khastok (lance lourde)', formule: 'd6B', distance: false },
            { libelle: 'Couteau', formule: 'd6M', distance: false },
        ]);
    });

    it('Vigueur + Mêlée pour une arme de contact, Agilité + Tir pour un arc ; sans arme, l’aptitude la plus haute', () => {
        expect(attaqueDeBarbarians({ arme1: 'Hache', arme1_degats: 'd6B' })).toEqual({ attribut: 'vigueur', action: 'melee' });
        expect(attaqueDeBarbarians({ arme1: 'Arbalète', arme1_degats: 'd6+1' })).toEqual({ attribut: 'agilite', action: 'tir' });
        expect(attaqueDeBarbarians({ melee: 1, tir: 2 })).toEqual({ attribut: 'agilite', action: 'tir' });
        expect(attaqueDeBarbarians({})).toBeNull();
    });

    it('les dés de l’arme : d6B garde le meilleur, d6M le pire, d3 la moitié du d6 arrondie au-dessus', () => {
        const base = { vigueur: 2, moitie: false, ajouterLaVigueur: true, devastateur: false };
        expect(lancerLesDegatsDeBarbarians('d6B', base, suite(2, 5))).toEqual({ total: 7, calcul: 'd6B (2, 5 → 5) + Vigueur 2 = 7' });
        expect(lancerLesDegatsDeBarbarians('d6M', base, suite(2, 5))!.total).toBe(4);
        expect(lancerLesDegatsDeBarbarians('d3', base, suite(5))!.total).toBe(5);
    });

    it('à distance, la moitié de la Vigueur à l’inférieur ; le Coup dévastateur ajoute 6', () => {
        expect(lancerLesDegatsDeBarbarians('d6', { vigueur: 3, moitie: true, ajouterLaVigueur: true, devastateur: true }, suite(4)))
            .toEqual({ total: 11, calcul: 'd6 (4) + moitié de la Vigueur 1 + 6 Coup dévastateur = 11' });
    });

    it('une formule qui porte son bonus, sans Vigueur ajoutée ; une formule inconnue rend null', () => {
        expect(lancerLesDegatsDeBarbarians('d6+3', { vigueur: 3, moitie: false, ajouterLaVigueur: false, devastateur: false }, suite(1)))
            .toEqual({ total: 4, calcul: 'd6 (1) + 3 = 4' });
        // Le banth, une créature énorme : « d6 x2 », sans Vigueur (p. 108, 111).
        expect(lancerLesDegatsDeBarbarians('d6 x2', { vigueur: 8, moitie: false, ajouterLaVigueur: false, devastateur: false }, suite(5)))
            .toEqual({ total: 10, calcul: 'd6 (5) × 2 = 10' });
        expect(lancerLesDegatsDeBarbarians('2d8', { vigueur: 0, moitie: false, ajouterLaVigueur: true, devastateur: false }, suite(1))).toBeNull();
    });

    it('le coup : manqué ne blesse pas ; réussi, le total lancé moins l’armure', () => {
        expect(coupAAppliquer({ resultat: { total: 7, successes: 0 }, regle: 'de-de-l-arme', montantSaisi: 6 }).raison).toBe('rate');
        expect(coupAAppliquer({ resultat: { total: 10, successes: 1 }, regle: 'de-de-l-arme' }).raison).toBe('arme-inconnue');
        expect(coupAAppliquer({ resultat: { total: 10, successes: 1 }, regle: 'de-de-l-arme', montantSaisi: 7, protection: 2 }).montant).toBe(5);
    });

    it('« Attaquer » propose l’attaque de Barbarians', () => {
        expect(attaqueParDefaut({ jet: { barbarians: {} } } as never, [], { arme1: 'Fronde', arme1_degats: 'd3' }))
            .toEqual({ attribut: 'agilite', action: 'tir' });
    });
});
