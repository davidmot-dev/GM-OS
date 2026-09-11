import { describe, it, expect } from 'vitest';
import { chercherDansLeManuel, sansAccent } from './rechercheDansLeManuel';
import type { GuideDuManuel } from '../../../electron/formeDuManuel';

/**
 * **Le moteur de recherche du manuel.**
 *
 * Ce qu'il doit garder, et qui n'est pas évident : que le classement réponde à
 * *« où est la réponse ? »* et non à *« où le mot revient-il le plus ? »*, et
 * que la déaccentuation s'applique **des deux côtés**.
 */

const guide = (nom: string, titre: string, contenu: string): GuideDuManuel => ({
    nom, titre, famille: nom[0], contenu: `# ${titre}\n\n${contenu}`,
});

const MANUEL: GuideDuManuel[] = [
    guide('35-Projeter-un-jet.md', 'Projeter un jet', 'Le pupitre envoie le résultat sur l’écran des joueurs.'),
    guide('34-Dice-OS-le-pupitre.md', 'Dice-OS', [
        '## Les modes de jet',
        'Un jet peut être caché. On parle de jet partout dans cette page : jet, jet, jet.',
        '## Réussite et degrés',
        'Une réussite critique double les dés.',
    ].join('\n\n')),
    guide('22-Map-OS-le-plateau.md', 'Map-OS', 'Le plateau porte les pions et les calques.'),
];

describe('sansAccent', () => {
    it('replie la casse et les diacritiques', () => {
        expect(sansAccent('Réussite')).toBe('reussite');
        expect(sansAccent('ÉCHEC critique')).toBe('echec critique');
    });
});

describe('ce que la recherche trouve', () => {
    /*
      ⛔ La leçon du 2026-08-23 : l'Oracle déaccentuait le mot cherché et PAS le
      corps — « réussite » était invisible dans treize fiches sur vingt-et-une.
      Ici les deux côtés passent par `sansAccent`, dans les deux sens.
    */
    it('trouve un mot accentué tapé sans accent', () => {
        const r = chercherDansLeManuel(MANUEL, 'reussite');
        expect(r.map(x => x.guide.nom)).toContain('34-Dice-OS-le-pupitre.md');
    });

    it('trouve un mot non accentué tapé avec accent', () => {
        const r = chercherDansLeManuel(MANUEL, 'pupïtre');
        expect(r.length).toBeGreaterThan(0);
    });

    /*
      Une recherche à deux mots qui rendrait les guides parlant de l'un OU de
      l'autre rendrait le manuel entier — et un moteur qui rend tout ne rend rien.
    */
    it('exige TOUS les mots, pas un seul', () => {
        const r = chercherDansLeManuel(MANUEL, 'jet plateau');
        expect(r, 'aucun guide ne parle des deux').toEqual([]);
    });

    it('ne rend rien sur une requête vide', () => {
        expect(chercherDansLeManuel(MANUEL, '')).toEqual([]);
        expect(chercherDansLeManuel(MANUEL, '   ')).toEqual([]);
    });
});

describe('le classement', () => {
    /*
      Le cœur du moteur. « Dice-OS » répète « jet » cinq fois ; « Projeter un
      jet » le porte dans son TITRE. C'est le second qui répond à la question.
    */
    it('un titre qui porte le mot bat un corps qui le répète', () => {
        const r = chercherDansLeManuel(MANUEL, 'jet');
        expect(r[0].guide.nom).toBe('35-Projeter-un-jet.md');
    });

    it('une section qui porte le mot compte plus qu’une phrase perdue', () => {
        const r = chercherDansLeManuel(MANUEL, 'reussite');
        const dice = r.find(x => x.guide.nom === '34-Dice-OS-le-pupitre.md')!;
        expect(dice.section, 'la section qui porte la réponse est nommée').toBe('Réussite et degrés');
    });

    /* Un tri instable ferait danser la liste entre deux frappes. */
    it('départage à rang égal par le numéro du guide', () => {
        const exaequo = [
            guide('40-B.md', 'Sujet', 'le mot cible une fois'),
            guide('20-A.md', 'Sujet', 'le mot cible une fois'),
        ];
        const r = chercherDansLeManuel(exaequo, 'cible');
        expect(r.map(x => x.guide.nom)).toEqual(['20-A.md', '40-B.md']);
    });
});

describe('l’extrait', () => {
    it('montre la phrase autour du mot, pas le début du guide', () => {
        const r = chercherDansLeManuel(MANUEL, 'critique');
        expect(r[0].extrait).toContain('critique');
    });

    /* Un extrait qui commence par « …ussite » demande un effort pour rien. */
    it('ne coupe pas au milieu d’un mot', () => {
        const long = guide('10-Long.md', 'Long', 'a'.repeat(400) + ' cible ' + 'b'.repeat(400));
        const r = chercherDansLeManuel([long], 'cible');
        expect(r[0].extrait.startsWith('… ')).toBe(true);
        expect(r[0].extrait.endsWith(' …')).toBe(true);
    });

    it('compte les occurrences', () => {
        const r = chercherDansLeManuel(MANUEL, 'jet');
        const dice = r.find(x => x.guide.nom === '34-Dice-OS-le-pupitre.md')!;
        expect(dice.occurrences).toBeGreaterThan(3);
    });
});
