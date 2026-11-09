import { describe, expect, it } from 'vitest';
import {
    bilanDArgyropee, bilanDeLOpposition, bonusDesAidants, bonusDuMetierChoisi, depenserLePanache, faceDuD10, lancerArgyropee,
    lancerLAdversaire, metiersDeLaFiche, modificateurBorne, moyenneDesCompetences, paliersAtteignables, panacheEncorePossible,
    resoudreArgyropee, succesDOpposition,
    coutDuSort, degreDuPnj, doubleHumeur, lancerUnPnj, magieDuCombatApres, obstacleALExuberance, prieresRestantes, regainDuMatin,
    silenciadaContractee,
} from './argyropee';

const sans = { modificateur: 0, aidants: 0 };

describe('Argyropée — le test (livre 2, p. 44-45)', () => {
    it('lit les cinq paliers du livre sur le total', () => {
        expect([0, 1, 7, 8, 9, 10, 14, 15, 21].map(bilanDArgyropee)).toEqual([
            'echec-critique', 'echec', 'echec', 'reussite-partielle', 'reussite-partielle',
            'reussite', 'reussite', 'reussite-critique', 'reussite-critique',
        ]);
    });

    it('fait d’un total négatif un échec critique (décision de David, 08/11/2026)', () => {
        expect(bilanDArgyropee(-3)).toBe('echec-critique');
        const jet = resoudreArgyropee(0, 1, 0, { modificateur: -3, aidants: 0 });
        expect(jet.total).toBe(-2);
        expect(jet.argyropee.bilan).toBe('echec-critique');
        expect(jet.degre).toBe('echec-total');
        expect(jet.tagSuccess).toBe(false);
    });

    it('additionne le dé, la compétence et le métier : l’exemple de Vanille (p. 45)', () => {
        // Les totaux de l'exemple : 0 critique, 7 échec, 9 partielle, 12 réussite, 16 critique.
        expect(resoudreArgyropee(0, 0, 0, sans).argyropee.bilan).toBe('echec-critique');
        expect(resoudreArgyropee(4, 3, 0, sans).argyropee.bilan).toBe('echec');
        expect(resoudreArgyropee(4, 3, 2, sans).argyropee.bilan).toBe('reussite-partielle');
        expect(resoudreArgyropee(7, 3, 2, sans).argyropee.bilan).toBe('reussite');
        const critique = resoudreArgyropee(9, 5, 2, sans);
        expect(critique.total).toBe(16);
        expect(critique.argyropee.bilan).toBe('reussite-critique');
        expect(critique.degre).toBe('reussite-particuliere');
        expect(critique.tagSuccess).toBe(true);
    });

    it('compte une réussite partielle comme une réussite', () => {
        const jet = resoudreArgyropee(3, 3, 2, sans);
        expect(jet.total).toBe(8);
        expect(jet.tagSuccess).toBe(true);
        expect(jet.successes).toBe(1);
        expect(jet.totalDisplay).toContain('Réussite partielle');
    });

    it('lit le d10 du moteur de 0 à 9 : le 10 est le zéro du dé (p. 44)', () => {
        expect([1, 5, 9, 10].map(faceDuD10)).toEqual([1, 5, 9, 0]);
        expect(lancerArgyropee(0, 0, sans, () => 10).argyropee.bilan).toBe('echec-critique');
        expect(lancerArgyropee(3, 2, sans, () => 10).total).toBe(5);
    });

    it('cumule les modificateurs sans borne, et borne l’entraide à +5 (p. 45)', () => {
        // « Les bonus et malus en provenance de diverses sources peuvent se cumuler » : pas de plafond au global.
        expect(modificateurBorne(8)).toBe(8);
        expect(modificateurBorne(-9)).toBe(-9);
        expect(bonusDesAidants(7)).toBe(5);
        expect(bonusDesAidants(-1)).toBe(0);
        const jet = resoudreArgyropee(2, 3, 0, { modificateur: -2, aidants: 3 });
        expect(jet.total).toBe(2 + 3 - 2 + 3);
        expect(jet.totalDisplay).toContain('entraide 3');
    });
});

describe('Argyropée — le Panache (p. 84-85)', () => {
    it('reprend l’exemple de Vanille : Commerce 3, dé 1, 4 points → 8, réussite partielle', () => {
        const jet = resoudreArgyropee(1, 3, 0, sans);
        expect(jet.total).toBe(4);
        expect(jet.argyropee.bilan).toBe('echec');
        const apres = depenserLePanache(jet, 4);
        expect(apres.argyropee.deFinal).toBe(5);
        expect(apres.argyropee.panache).toBe(4);
        expect(apres.total).toBe(8);
        expect(apres.argyropee.bilan).toBe('reussite-partielle');
        expect(apres.totalDisplay).toContain('4 Panache');
    });

    it('ne porte jamais le dé au-delà de 9 : 8 points au plus sur un 1', () => {
        const jet = resoudreArgyropee(1, 3, 0, sans);
        expect(panacheEncorePossible(jet.argyropee)).toBe(8);
        const apres = depenserLePanache(jet, 20);
        expect(apres.argyropee.deFinal).toBe(9);
        expect(apres.argyropee.panache).toBe(8);
        expect(depenserLePanache(apres, 1)).toBe(apres);
    });

    it('cumule deux dépenses sur le même tirage', () => {
        const jet = depenserLePanache(depenserLePanache(resoudreArgyropee(2, 3, 0, sans), 1), 2);
        expect(jet.argyropee.de).toBe(2);
        expect(jet.argyropee.panache).toBe(3);
        expect(jet.total).toBe(8);
    });

    it('dit ce que le Panache peut encore acheter, et son coût', () => {
        const jet = resoudreArgyropee(1, 3, 0, sans); // total 4, 8 points possibles
        expect(paliersAtteignables(jet.argyropee)).toEqual([
            { bilan: 'reussite-partielle', cout: 4 },
            { bilan: 'reussite', cout: 6 },
        ]);
        // Dé à 9 : plus rien à acheter.
        expect(paliersAtteignables(resoudreArgyropee(9, 0, 0, sans).argyropee)).toEqual([]);
    });
});

describe('Argyropée — l’action complexe (p. 46)', () => {
    it('reprend l’exemple du livre : Escalade 1, Furtivité 4, dé 4 → 6, échec, mais 8 avec Furtivité seule : partiellement ratée', () => {
        expect(moyenneDesCompetences([1, 4])).toBe(2);
        const jet = resoudreArgyropee(4, 0, 0, sans, 0, [1, 4]);
        expect(jet.total).toBe(6);
        expect(jet.argyropee.complexe).toEqual({ competences: [1, 4], meilleure: 4, totalDeRattrapage: 8, issue: 'partiellement-ratee' });
        expect(jet.argyropee.libelle).toBe('Action partiellement ratée');
        expect(jet.tagSuccess).toBe(false);
        expect(jet.degre).toBe('echec-normal');
        expect(jet.totalDisplay).toContain('moyenne 2 (1, 4)');
    });

    it('un succès, même partiel, accomplit parfaitement l’action', () => {
        const jet = resoudreArgyropee(6, 0, 0, sans, 0, [1, 4]);
        expect(jet.total).toBe(8);
        expect(jet.argyropee.complexe?.issue).toBe('reussie');
        expect(jet.tagSuccess).toBe(true);
    });

    it('rate complètement si même la meilleure compétence échoue', () => {
        const jet = resoudreArgyropee(2, 0, 0, sans, 0, [1, 4]);
        expect(jet.argyropee.complexe).toMatchObject({ totalDeRattrapage: 6, issue: 'ratee' });
        expect(jet.degre).toBe('echec-particulier');
    });

    it('le Panache relève le même dé, et l’action reste complexe', () => {
        const apres = depenserLePanache(resoudreArgyropee(4, 0, 0, sans, 0, [1, 4]), 2);
        expect(apres.total).toBe(8);
        expect(apres.argyropee.complexe?.issue).toBe('reussie');
    });

    it('une seule compétence n’est pas une action complexe', () => {
        expect(resoudreArgyropee(4, 3, 0, sans, 0, [3]).argyropee.complexe).toBeUndefined();
    });
});

describe('Argyropée — le test en opposition (p. 46)', () => {
    const manche = (j: number, a: number) => ({ joueur: resoudreArgyropee(j, 5, 0, sans), adversaire: resoudreArgyropee(a, 5, 0, sans) });

    it('compte 1 succès par réussite, même partielle, et 2 par critique', () => {
        expect(succesDOpposition('reussite-critique')).toBe(2);
        expect(succesDOpposition('reussite')).toBe(1);
        expect(succesDOpposition('reussite-partielle')).toBe(1);
        expect(succesDOpposition('echec')).toBe(0);
    });

    it('le premier à 5 succès l’emporte', () => {
        // Joueur : 9+5 = 14 (1), adversaire 1+5 = 6 (0), quatre fois, puis un dernier.
        const manches = Array.from({ length: 5 }, () => manche(9, 1));
        expect(bilanDeLOpposition(manches.slice(0, 4))).toEqual({ joueur: 4, adversaire: 0, issue: null });
        expect(bilanDeLOpposition(manches)).toEqual({ joueur: 5, adversaire: 0, issue: 'joueur' });
    });

    it('deux parties à 5 en même temps n’arrivent pas à se mettre d’accord', () => {
        const manches = Array.from({ length: 5 }, () => manche(5, 5));
        expect(bilanDeLOpposition(manches).issue).toBe('egalite');
    });

    it('l’adversaire lance un d10 lu de 0 à 9 et ajoute son score', () => {
        const a = lancerLAdversaire(6, () => 10);
        expect(a.total).toBe(6);
        expect(a.argyropee.bilan).toBe('echec');
    });
});

describe('Argyropée — le métier choisi au jet', () => {
    const regle = { metiers: [
        { nom: 'metier1_nom', bonus: 'metier1_bonus' },
        { nom: 'metier2_nom', bonus: 'metier2_bonus' },
        { nom: 'metier3_nom', bonus: 'metier3_bonus' },
    ] };

    it('ne propose que les métiers que la fiche porte, bonus borné à +5', () => {
        const proposes = metiersDeLaFiche(regle, { metier1_nom: 'Malandrin', metier1_bonus: 2, metier2_nom: '', metier2_bonus: '', metier3_bonus: 9 });
        expect(proposes).toEqual([
            { index: 0, libelle: 'Malandrin', bonus: 2 },
            { index: 2, libelle: 'Métier 3', bonus: 5 },
        ]);
        expect(bonusDuMetierChoisi(proposes, 0)).toBe(2);
        expect(bonusDuMetierChoisi(proposes, -1)).toBe(0);
        expect(bonusDuMetierChoisi(proposes, 1)).toBe(0);
    });

    it('rend une liste vide sans règle', () => {
        expect(metiersDeLaFiche(undefined, {})).toEqual([]);
    });
});

/*
  Les cinq règles posées le 09/11/2026 à la demande de David : « l'Exubérance, la Faveur
  divine, la Guigne, la magie et le dé de compétence des PNJ ».
*/
describe('Argyropée — la Faveur divine (p. 81)', () => {
    it('lance deux d10 et garde le meilleur, lu de 0 à 9 (le 10 du moteur vaut 0)', () => {
        const faces = [10, 6];
        const jet = lancerArgyropee(3, 0, sans, () => faces.shift()!, undefined, true);
        expect(jet.argyropee.de).toBe(6);
        expect(jet.argyropee.faveur).toEqual([0, 6]);
        expect(jet.totalDisplay).toContain('Faveur divine : 0 et 6');
        expect(jet.total).toBe(9);
    });

    it('garde la Faveur quand le Panache monte ensuite le dé', () => {
        const faces = [2, 5];
        const apres = depenserLePanache(lancerArgyropee(3, 0, sans, () => faces.shift()!, undefined, true), 2);
        expect(apres.argyropee.faveur).toEqual([2, 5]);
        expect(apres.argyropee.deFinal).toBe(7);
    });

    it('compte les prières du jour sur Sciences religieuses', () => {
        expect(prieresRestantes(3, 1)).toBe(2);
        expect(prieresRestantes(2, 5)).toBe(0);
        expect(prieresRestantes('', undefined)).toBe(0);
    });
});

describe('Argyropée — le Panache de la journée (p. 84-85, 177)', () => {
    it('regagne 1d10 (0 à 9) + 10 + le bonus permanent + l’offrande de la Guigne', () => {
        expect(regainDuMatin(7, 0, 0)).toEqual({ de: 7, panache: 17 });
        expect(regainDuMatin(10, 2, 3)).toEqual({ de: 0, panache: 15 });
    });
});

describe('Argyropée — l’Exubérance (p. 85-86)', () => {
    it('demande 3 points de Panache et un avatar conscient', () => {
        expect(obstacleALExuberance(3, 0)).toBeNull();
        expect(obstacleALExuberance(2, 5)).toContain('3 points');
        expect(obstacleALExuberance(10, -1)).toContain('inconscient');
        expect(obstacleALExuberance(4)).toBeNull();
    });
});

describe('Argyropée — la magie et la silenciada (p. 127, 135-136)', () => {
    it('coûte 1 point avec la lueur, 2 sans ; 1 toujours pour une double humeur', () => {
        expect(coutDuSort(false, false)).toBe(1);
        expect(coutDuSort(true, false)).toBe(2);
        expect(coutDuSort(true, true)).toBe(1);
        expect(doubleHumeur(['Verre', ' verre '])).toBe(true);
        expect(doubleHumeur(['Verre', 'Métal'])).toBe(false);
        expect(doubleHumeur(['', ''])).toBe(false);
    });

    it('tire les 20 % une seule fois : au sort qui fait atteindre 7 points dans le combat', () => {
        expect(magieDuCombatApres(5, 2)).toEqual({ apres: 7, franchit: true });
        expect(magieDuCombatApres(6, 2)).toEqual({ apres: 8, franchit: true });
        expect(magieDuCombatApres(7, 1)).toEqual({ apres: 8, franchit: false });
        expect(magieDuCombatApres(4, 2)).toEqual({ apres: 6, franchit: false });
        expect(silenciadaContractee(20)).toBe(true);
        expect(silenciadaContractee(21)).toBe(false);
    });
});

describe('Argyropée — le dé de compétence des PNJ (p. 185)', () => {
    it('tire 1d6 pour une compétence privilégiée, 1d6 divisé par deux sinon', () => {
        expect(degreDuPnj(5, true)).toBe(5);
        expect(degreDuPnj(5, false)).toBe(2);
        expect(degreDuPnj(1, false)).toBe(0);
    });

    it('ajoute le d10, le bonus de carrière et le modificateur', () => {
        const jet = lancerUnPnj({ privilegiee: false, carriere: 2, modificateur: -1 }, () => 5, () => 7);
        expect(jet.argyropee.competence).toBe(2);
        expect(jet.total).toBe(7 + 2 + 2 - 1);
        expect(jet.argyropee.pnj).toEqual({ d6: 5, privilegiee: false });
        expect(jet.totalDisplay).toContain('1d6 = 5, divisé par 2');
    });

    it('tire le degré de l’adversaire PNJ à chaque manche d’opposition', () => {
        const d6 = [6, 2];
        const premier = lancerLAdversaire(1, () => 4, { privilegiee: true, d6: () => d6.shift()! });
        const second = lancerLAdversaire(1, () => 4, { privilegiee: true, d6: () => d6.shift()! });
        expect([premier.total, second.total]).toEqual([11, 7]);
    });
});
