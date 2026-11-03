import { describe, it, expect } from 'vitest';
import {
    coutDuSort, gainDuJourSaint, journeeEntiere, jourSaint, lancerLeGain, payerLeSort, reposDeSixHeures, statutDuRang,
    type RegleDeLaMagie,
} from './magieDeRuneQuest';

/** RQ-A6, 03/11/2026 : le livre de base, p. 54, 254, 313-315, et la sorcellerie du corpus relu. */
const REGLE: RegleDeLaMagie = {
    pm: 'points_de_magie', pmMax: 'pm_max', pou: 'pou',
    cultes: [
        { nom: 'culte', rang: 'culte_rang', pr: 'points_de_rune', prMax: 'pr_max', veneration: 'veneration' },
        { nom: 'culte_2', rang: 'culte_2_rang', pr: 'points_de_rune_2', prMax: 'pr_max_2', veneration: 'veneration_2' },
    ],
};
const fiche = { pou: 15, pm_max: 15, points_de_magie: 9, culte: 'Orlanth', culte_rang: 'initié', points_de_rune: 3, pr_max: 4, culte_2: 'Ernalda', points_de_rune_2: 0, pr_max_2: 2 };
const au = (...valeurs: number[]) => { let i = 0; return () => valeurs[i++ % valeurs.length]; };

describe('le coût d’un sort selon le jet', () => {
    it('magie spirituelle : rien sur un échec, les PM et l’appoint sur une réussite (p. 254)', () => {
        expect(coutDuSort('spirituelle', 'reussite', 2, 3)).toMatchObject({ pm: 5, pr: 0 });
        expect(coutDuSort('spirituelle', 'echec', 2, 3)).toMatchObject({ pm: 0, pr: 0 });
        expect(coutDuSort('spirituelle', 'echec-critique', 2)).toMatchObject({ pm: 0, pr: 0 });
    });

    it('magie runique : le critique ne coûte pas de PR, l’échec renforcé coûte 1 PM, l’échec critique les PR (p. 314)', () => {
        expect(coutDuSort('runique', 'reussite', 2)).toMatchObject({ pm: 0, pr: 2 });
        expect(coutDuSort('runique', 'reussite-speciale', 1, 6)).toMatchObject({ pm: 6, pr: 1 }); // Vostor, Guérison de blessure
        expect(coutDuSort('runique', 'reussite-critique', 2)).toMatchObject({ pm: 0, pr: 0 });
        expect(coutDuSort('runique', 'echec', 2)).toMatchObject({ pm: 0, pr: 0 });
        expect(coutDuSort('runique', 'echec', 2, 4)).toMatchObject({ pm: 1, pr: 0 });
        expect(coutDuSort('runique', 'echec-critique', 2)).toMatchObject({ pm: 0, pr: 2 });
    });

    it('sorcellerie : un PM sur un critique ou un échec, tout sur une réussite ou un échec critique', () => {
        expect(coutDuSort('sorcellerie', 'reussite-critique', 5).pm).toBe(1);
        expect(coutDuSort('sorcellerie', 'reussite', 5).pm).toBe(5);
        expect(coutDuSort('sorcellerie', 'echec', 5).pm).toBe(1);
        expect(coutDuSort('sorcellerie', 'echec-critique', 5).pm).toBe(5);
    });
});

describe('payer le sort', () => {
    it('débite le bon culte et les PM, et garde de quoi annuler', () => {
        const p = payerLeSort(REGLE, fiche, { pm: 1, pr: 2, explication: '' }, 0, 'Vent tempétueux');
        expect(p.maj).toEqual({ points_de_rune: 1, points_de_magie: 8 });
        expect(p.avant).toEqual({ points_de_rune: 3, points_de_magie: 9 });
        expect(p.ligne).toBe('Vent tempétueux : payé 2 PR (Orlanth, reste 1) et 1 PM (reste 8).');
    });

    it('refuse un sort runique sans assez de points de Rune dans ce culte (p. 314)', () => {
        const p = payerLeSort(REGLE, fiche, { pm: 0, pr: 1, explication: '' }, 1, 'Bénir les récoltes');
        expect(p.refus).toBe('Il faudrait 1 points de Rune du culte Ernalda ; il en reste 0 (p. 314).');
        expect(p.maj).toEqual({});
    });

    it('prévient de l’inconscience à 0 PM (p. 54)', () => {
        const p = payerLeSort(REGLE, { ...fiche, points_de_magie: 2 }, { pm: 2, pr: 0, explication: '' }, 0, 'Soins');
        expect(p.maj).toEqual({ points_de_magie: 0 });
        expect(p.alertes[0]).toMatch(/inconscience/);
        expect(payerLeSort(REGLE, { ...fiche, points_de_magie: 1 }, { pm: 2, pr: 0, explication: '' }, 0, 'Soins').refus).toMatch(/2 PM ; il en reste 1/);
    });
});

describe('la récupération', () => {
    it('rend le quart du POU en 6 h, arrondi au plus proche, sans dépasser le maximum (p. 54)', () => {
        expect(reposDeSixHeures(REGLE, fiche).maj).toEqual({ points_de_magie: 13 }); // Vasana : 3,75 → 4
        expect(reposDeSixHeures(REGLE, { ...fiche, points_de_magie: 13 }).maj).toEqual({ points_de_magie: 15 });
        expect(journeeEntiere(REGLE, fiche).maj).toEqual({ points_de_magie: 15 });
    });

    it('lit le statut dans le rang saisi', () => {
        expect(statutDuRang('initié')).toBe('initie');
        expect(statutDuRang('Prêtre runique')).toBe('maitre');
        expect(statutDuRang('Seigneur runique')).toBe('maitre');
        expect(statutDuRang('Chantre sacré')).toBe('maitre');
    });

    it('suit la table du jour saint (p. 315)', () => {
        expect(gainDuJourSaint('tres-saint', 'initie', true)).toBe('tout');
        expect(gainDuJourSaint('tres-saint', 'initie', false)).toBe('2D6');
        expect(gainDuJourSaint('saisonnier', 'initie', true)).toBe('2D6');
        expect(gainDuJourSaint('saisonnier', 'maitre', true)).toBe('tout');
        expect(gainDuJourSaint('saisonnier', 'initie', false)).toBe('1D3');
        expect(gainDuJourSaint('saisonnier', 'maitre', false)).toBe('1D6');
        expect(gainDuJourSaint('mineur', 'maitre', true)).toBe('1D6+1');
        expect(gainDuJourSaint('culte-associe', 'initie', false)).toBeNull();
        expect(gainDuJourSaint('lieu-sacre', 'initie', false)).toBe('1');
        expect(lancerLeGain('1D6+1', au(4)).total).toBe(5);
    });

    it('Sorala : 2D6 = 5 pour un maximum de 3, l’excédent est perdu, et 2 PM dépensés (p. 315)', () => {
        const sorala = { ...fiche, points_de_rune: 0, pr_max: 3 };
        const r = jourSaint(REGLE, sorala, 0, 'saisonnier', 'initie', 'reussite', au(2, 3));
        expect(r.maj).toEqual({ points_de_magie: 7, points_de_rune: 3 });
        expect(r.ligne).toMatch(/2D6 = 2 \+ 3 = 5 → PR 3 \/ 3 ; 2 PM dépensés/);
    });

    it('refuse la cérémonie sans 2 PM à dépenser', () => {
        expect(jourSaint(REGLE, { ...fiche, points_de_magie: 1 }, 0, 'tres-saint', 'initie', 'reussite', au(1)).refus).toMatch(/au moins 2 points de magie/);
    });
});
