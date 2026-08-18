import { describe, it, expect } from 'vitest';
import { titreAvecNomDeCampagne, reparerLesTitres } from './titreDeJournal';

const campagnes = [
    { id: 'c-1187082150026-gtbgs', name: 'Hadley Hope' },
    { id: 'c-2', name: 'Le secret de Milo' },
];

describe('titreAvecNomDeCampagne', () => {
    it('remplace l\'identifiant en tete par le nom de la campagne', () => {
        expect(titreAvecNomDeCampagne('c-1187082150026-gtbgs - 18/08 21:59 (Session #1)', campagnes))
            .toBe('Hadley Hope - 18/08 21:59 (Session #1)');
    });

    it('laisse intact un titre deja correct', () => {
        const titre = 'Hadley Hope - 18/08 21:59 (Session #1)';
        expect(titreAvecNomDeCampagne(titre, campagnes)).toBe(titre);
    });

    /* Une campagne supprimée depuis : mieux vaut le titre laid que la perte. */
    it('laisse intact un identifiant qu\'aucune campagne ne reclame', () => {
        const titre = 'c-inconnue - 18/08 21:59 (Session #1)';
        expect(titreAvecNomDeCampagne(titre, campagnes)).toBe(titre);
    });

    it('ne touche a rien quand la campagne n\'a pas de nom', () => {
        const titre = 'c-3 - 18/08 21:59';
        expect(titreAvecNomDeCampagne(titre, [{ id: 'c-3', name: '  ' }])).toBe(titre);
    });

    /*
      Le garde le plus important : l'identifiant doit être suivi du séparateur
      exact. Sans lui, une campagne dont l'identifiant préfixe celui d'une autre
      réécrirait le titre de sa voisine.
    */
    it('n\'attrape pas un identifiant qui en prefixe un autre', () => {
        const titre = 'c-20 - 18/08 21:59 (Session #1)';
        expect(titreAvecNomDeCampagne(titre, [{ id: 'c-2', name: 'Le secret de Milo' }]))
            .toBe(titre);
    });

    it('remplace un titre qui n\'est que l\'identifiant', () => {
        expect(titreAvecNomDeCampagne('c-2', campagnes)).toBe('Le secret de Milo');
    });
});

describe('reparerLesTitres', () => {
    it('ne repare que ce qui en a besoin', () => {
        const journaux = [
            { id: 'j1', title: 'c-1187082150026-gtbgs - 18/08 21:59 (Session #1)' },
            { id: 'j2', title: 'Le secret de Milo - 16/08 20:00 (Session #3)' },
        ];
        const repares = reparerLesTitres(journaux, campagnes);

        expect(repares[0].title).toBe('Hadley Hope - 18/08 21:59 (Session #1)');
        // L'objet intact n'est pas recopié : rien ne doit croire qu'il a changé.
        expect(repares[1]).toBe(journaux[1]);
    });

    /*
      Cette réparation tourne à chaque montage de l'écran. Rendre un tableau neuf
      quand rien n'a bougé ferait rejouer tout ce qui l'observe — et, branchée sur
      un `set` de store, boucler.
    */
    it('rend le MEME tableau quand il n\'y a rien a faire', () => {
        const journaux = [{ id: 'j1', title: 'Hadley Hope - 18/08 21:59' }];
        expect(reparerLesTitres(journaux, campagnes)).toBe(journaux);
    });

    it('supporte une liste de campagnes vide', () => {
        const journaux = [{ id: 'j1', title: 'c-2 - 18/08' }];
        expect(reparerLesTitres(journaux, [])).toBe(journaux);
    });
});
