import { describe, it, expect } from 'vitest';
import { lireUnCollage, regimeDuTexte } from './collageDUneTable';
import { controlerLaTable } from './formeDeLaTable';

/**
 * **Ce qu'on colle vraiment.**
 *
 * Les échantillons ci-dessous ne sont pas inventés : ce sont les quatre formes
 * qu'on obtient en copiant une table depuis un PDF de manuel, un tableau
 * Markdown, une page web, ou en tapant une liste d'oracle à la main.
 *
 * ⛔ **Le piège central** : `11 — Fuite d'oxygène` n'est pas une plage. Un tiret
 * ne fait une plage que s'il a des **chiffres des deux côtés**. C'est la
 * ponctuation la plus courante des tables françaises, et la confondre décalerait
 * la table entière.
 */

const titres = (texte: string, de?: string) =>
    lireUnCollage(texte, { de }).entrees.map(e => `${e.min}-${e.max} ${e.title}`);

describe('regimeDuTexte', () => {
    it('reconnaît une table numérotée', () => {
        expect(regimeDuTexte('1 Rien\n2 Un bruit\n3 Une ombre')).toBe('bornes');
    });

    it('reconnaît une liste sans numéros', () => {
        expect(regimeDuTexte('Rien\nUn bruit\nUne ombre')).toBe('lignes');
    });

    /** *Entre les deux, on préfère lire des bornes qui existent que d'en inventer.* */
    it('penche vers les bornes dès que la moitié des lignes en porte', () => {
        expect(regimeDuTexte('1 Rien\nsuite du paragraphe\n2 Un bruit\nsuite aussi')).toBe('bornes');
    });

    it('ne s’étrangle pas sur du vide', () => {
        expect(regimeDuTexte('')).toBe('lignes');
        expect(regimeDuTexte('\n\n   \n')).toBe('lignes');
    });
});

describe('lireUnCollage — ce qui porte ses bornes', () => {
    it('lit des numéros simples', () => {
        expect(titres('1 Rien\n2 Un bruit\n3 Une ombre'))
            .toEqual(['1-1 Rien', '2-2 Un bruit', '3-3 Une ombre']);
    });

    it('lit des plages', () => {
        expect(titres('1-5 Rien\n6-12 Un bruit\n13-20 Une ombre'))
            .toEqual(['1-5 Rien', '6-12 Un bruit', '13-20 Une ombre']);
    });

    it.each(['-', '–', '—'])('accepte le tiret « %s » dans une plage', (tiret) => {
        expect(titres(`11${tiret}16 Fuite`)).toEqual(['11-16 Fuite']);
    });

    /**
     * ⛔ **Le piège.** Sans chiffre après le tiret, ce n'est pas une plage :
     * c'est l'entrée 11 et un titre. Une table entière se décalerait ici.
     */
    it.each([
        ['11 — Fuite d’oxygène', '11-11 Fuite d’oxygène'],
        ['11 - Fuite d’oxygène', '11-11 Fuite d’oxygène'],
        ['11. Fuite d’oxygène', '11-11 Fuite d’oxygène'],
        ['11) Fuite d’oxygène', '11-11 Fuite d’oxygène'],
        ['11 : Fuite d’oxygène', '11-11 Fuite d’oxygène'],
        ['11  Fuite d’oxygène', '11-11 Fuite d’oxygène'],
    ])('ne prend pas « %s » pour une plage', (ligne, attendu) => {
        expect(titres(ligne)).toEqual([attendu]);
    });

    /** Un titre qui commence par un nombre reste un titre. */
    it('ne confond pas un titre chiffré avec une borne', () => {
        expect(titres('12 3 hommes armés')).toEqual(['12-12 3 hommes armés']);
    });

    it('lit un tableau Markdown', () => {
        const colle = [
            '| Jet | Résultat |',
            '|-----|----------|',
            '| 1-3 | Rien |',
            '| 4-6 | Un bruit |',
        ].join('\n');

        const lu = lireUnCollage(colle);
        expect(lu.entrees.map(e => `${e.min}-${e.max} ${e.title}`))
            .toEqual(['1-3 Rien', '4-6 Un bruit']);
        // L'en-tête n'appartient à personne : il est signalé, pas avalé.
        expect(lu.ignorees).toEqual(['Jet  Résultat']);
    });

    it('lit des tabulations, comme un PDF les rend', () => {
        expect(titres('1\tRien\n2\tUn bruit')).toEqual(['1-1 Rien', '2-2 Un bruit']);
    });

    /**
     * ⭐ **Ce qui n'est pas une devinette** : une ligne sans numéro qui suit une
     * ligne numérotée appartient à celle-ci. C'est la forme des manuels — un
     * résultat, puis son paragraphe.
     */
    it('rattache un paragraphe à l’entrée du dessus', () => {
        const lu = lireUnCollage([
            '1-3 Fuite d’oxygène',
            'Le sifflement couvre les communications.',
            'Toute action bruyante devient impossible.',
            '4-6 Rien',
        ].join('\n'));

        expect(lu.entrees).toHaveLength(2);
        expect(lu.entrees[0].description)
            .toBe('Le sifflement couvre les communications.\nToute action bruyante devient impossible.');
        expect(lu.entrees[1].title).toBe('Rien');
    });

    it('accepte un numéro seul, le texte venant en dessous', () => {
        const lu = lireUnCollage('11\nFuite d’oxygène\n12\nCourt-circuit');
        expect(lu.entrees.map(e => `${e.min} ${e.title}`)).toEqual(['11 Fuite d’oxygène', '12 Court-circuit']);
    });

    /** *Un import qui jette en silence laisse croire que la table est complète.* */
    it('signale ce qu’il n’a pas su rattacher', () => {
        const lu = lireUnCollage('Table des avaries\n1 Rien');
        expect(lu.ignorees).toEqual(['Table des avaries']);
        expect(lu.entrees).toHaveLength(1);
    });
});

describe('lireUnCollage — ce qui n’a pas de bornes', () => {
    it('répartit une liste sur le dé', () => {
        expect(titres('Rien\nUn bruit\nUne ombre\nUn cri\nLe noir\nLa fin', '1d6'))
            .toEqual(['1-1 Rien', '2-2 Un bruit', '3-3 Une ombre', '4-4 Un cri', '5-5 Le noir', '6-6 La fin']);
    });

    it('découpe un d20 en trois, sans trou', () => {
        const lu = lireUnCollage('Rien\nUn bruit\nUne ombre', { de: '1d20' });
        expect(lu.entrees.map(e => [e.min, e.max])).toEqual([[1, 7], [8, 14], [15, 20]]);
    });

    /**
     * ⚠️ **Un d66 ne se numérote pas de 1 à 36.** Les bornes doivent tomber sur
     * des valeurs tirables — c'est `decouperLaPortee` qui le sait, et c'est
     * pourquoi le dé passe jusqu'ici.
     */
    it('pose des bornes tirables sur un d66', () => {
        const lu = lireUnCollage('Rien\nUn bruit\nUne ombre', { de: 'd66' });
        expect(lu.entrees[0].min).toBe(11);
        expect(lu.entrees.at(-1)!.max).toBe(66);
        expect(controlerLaTable({ name: 'x', dice: 'd66', entries: lu.entrees })).toEqual([]);
    });

    /** *Mieux vaut une table à recadrer qu'un import qui refuse.* */
    it.each([
        ['aucun dé', undefined],
        ['un dé illisible', 'dix'],
        ['un dé trop petit', '1d4'],
    ])('numérote une par une quand le découpage est impossible : %s', (_cas, de) => {
        const lu = lireUnCollage('a\nb\nc\nd\ne', { de });
        expect(lu.entrees.map(e => e.min)).toEqual([1, 2, 3, 4, 5]);
    });

    it('peut être forcé malgré des lignes numérotées', () => {
        const lu = lireUnCollage('1 Rien\n2 Un bruit', { de: '1d6', regime: 'lignes' });
        expect(lu.entrees.map(e => e.title)).toEqual(['1 Rien', '2 Un bruit']);
    });
});

describe('ce que le collage produit se tient', () => {
    /** Le vrai critère : la table qui sort passe le contrôle de l'Atelier. */
    it('une table de manuel collée telle quelle est saine', () => {
        const lu = lireUnCollage([
            '1-5   Rien de notable',
            '6-12  Un bruit dans la coursive',
            '13-17 Une ombre passe',
            '18-19 Le courant saute',
            '20    Elle est là',
        ].join('\n'));

        expect(controlerLaTable({ name: 'Avaries', dice: '1d20', entries: lu.entrees })).toEqual([]);
    });

    it('un collage vide ne produit rien, et ne casse rien', () => {
        const lu = lireUnCollage('   \n\n');
        expect(lu.entrees).toEqual([]);
        expect(lu.ignorees).toEqual([]);
    });
});

/**
 * **Le format que l'application produit, et qu'elle ne savait pas lire.**
 *
 * ⛔ Mesuré avant d'être comblé : un JSON de table collé donnait **huit entrées
 * de charabia** — `11-15 {`, `16-24 "name": "Avaries mineures",`… Visible dans
 * l'aperçu, donc jamais destructeur, mais inutilisable. *Un import qui refuse le
 * format que l'application elle-même écrit.*
 */
describe('lireUnCollage — le JSON', () => {
    const TABLE = JSON.stringify({
        name: 'Avaries mineures',
        dice: 'd66',
        entries: [
            { min: 11, max: 12, title: 'Fuite', description: 'Un sifflement.', effect: 'Bruit' },
            /* Jusqu'à 66 : un échantillon qui ne couvre pas tout le dé ferait
               rougir le contrôle plus bas — et il aurait raison. */
            { min: 13, max: 66, title: 'Court-circuit', description: 'Le noir.' },
        ],
    }, null, 4);

    it('se reconnaît tout seul', () => {
        expect(regimeDuTexte(TABLE)).toBe('json');
    });

    it('rend les entrées, le nom et le dé', () => {
        const lu = lireUnCollage(TABLE);

        expect(lu.regime).toBe('json');
        expect(lu.nom).toBe('Avaries mineures');
        expect(lu.de).toBe('d66');
        expect(lu.entrees).toEqual([
            { min: 11, max: 12, title: 'Fuite', description: 'Un sifflement.', effect: 'Bruit' },
            { min: 13, max: 66, title: 'Court-circuit', description: 'Le noir.' },
        ]);
    });

    it('conserve le butin déclaré', () => {
        const lu = lireUnCollage(JSON.stringify({
            entries: [{ min: 1, max: 6, title: 'x', butin: [{ name: 'Eurodollars', quantite: '1d100' }] }],
        }));
        expect(lu.entrees[0].butin).toEqual([{ name: 'Eurodollars', quantite: '1d100' }]);
    });

    /** *La refuser pour une accolade manquante ferait recommencer une conversation entière.* */
    it('accepte un tableau nu', () => {
        const lu = lireUnCollage('[{"min":1,"max":6,"title":"x"}]');
        expect(lu.regime).toBe('json');
        expect(lu.entrees).toHaveLength(1);
        expect(lu.nom).toBeUndefined();
    });

    it('accepte des bornes en chaînes', () => {
        const lu = lireUnCollage('{"entries":[{"min":"3","max":"7","title":"x"}]}');
        expect(lu.entrees[0]).toMatchObject({ min: 3, max: 7 });
    });

    it('écarte une entrée sans bornes, et la montre', () => {
        const lu = lireUnCollage('{"entries":[{"min":1,"max":2,"title":"bonne"},{"title":"sans bornes"}]}');
        expect(lu.entrees).toHaveLength(1);
        expect(lu.ignorees).toHaveLength(1);
        expect(lu.ignorees[0]).toContain('sans bornes');
    });

    /** Un JSON qui n'est pas une table reste du texte : on ne casse rien. */
    it.each([
        ['du JSON sans entrées', '{"bonjour":"monde"}'],
        ['du JSON invalide', '{ ceci n’est pas du json'],
        ['du texte ordinaire', '1 Rien\n2 Un bruit'],
    ])('ne se déclare pas JSON pour %s', (_cas, texte) => {
        expect(regimeDuTexte(texte)).not.toBe('json');
    });

    /** *Forcé sur du non-JSON, on ne fabrique rien.* */
    it('forcé à tort, rend zéro entrée plutôt que du charabia', () => {
        const lu = lireUnCollage('1 Rien\n2 Un bruit', { regime: 'json' });
        expect(lu.entrees).toEqual([]);
    });

    it('ce qui sort d’un JSON passe le contrôle', () => {
        const lu = lireUnCollage(TABLE);
        expect(controlerLaTable({ name: lu.nom!, dice: lu.de!, entries: lu.entrees }))
            .toEqual([]);
    });
});
