import { describe, it, expect } from 'vitest';
import {
    lireLaFormule,
    valeursPossibles,
    controlerLaTable,
    laTableEstFautive,
    ENUMERATION_MAXIMALE,
    decouperLaPortee,
} from './formeDeLaTable';
import { TableEngine } from '../TableEngine';
import type { TableData } from '../types';

/**
 * **Ce qu'un dé peut sortir, et ce qu'une table doit couvrir.**
 *
 * ⛔ **Le défaut d'origine, trouvé le 2026-09-15 en comptant les 46 tables du
 * dépôt** : `Alien/blessures_critiques.json` déclarait `1d66` au lieu de `d66`.
 * Le moteur y lisait un dé uniforme à 66 faces ; les entrées vont de 11 à 66 par
 * paires de d6. **45 % des jets ne tombaient sur aucune entrée**, et
 * `resolveEntry` rend alors la plus proche — *un 17 rendait l'entrée 66*, la
 * pire blessure du jeu, sans une ligne de journal.
 */

const table = (p: Partial<TableData>): TableData => ({
    name: 'Table', dice: '1d6',
    entries: [
        { min: 1, max: 3, title: 'Bas', description: '' },
        { min: 4, max: 6, title: 'Haut', description: '' },
    ],
    ...p,
});

const codes = (t: TableData) => controlerLaTable(t).map(c => c.code);

describe('lireLaFormule', () => {
    it.each([
        ['1d20', 'standard', 1, 20, 0],
        ['2d6', 'standard', 2, 6, 0],
        ['d6', 'standard', 1, 6, 0],
        ['1d100+5', 'standard', 1, 100, 5],
        ['1d20-2', 'standard', 1, 20, -2],
        ['  1D12 ', 'standard', 1, 12, 0],
    ])('lit %s', (f, genre, nombre, faces, mod) => {
        expect(lireLaFormule(f)).toEqual({ genre, nombre, faces, modificateur: mod });
    });

    it.each([['d44', 2, 4], ['d66', 2, 6], ['d88', 2, 8], ['d666', 3, 6]])(
        'lit le dé juxtaposé %s', (f, nombre, faces) => {
            expect(lireLaFormule(f)).toMatchObject({ genre: 'juxtapose', nombre, faces });
        });

    /**
     * ⛔ **La règle exacte, et le cœur du défaut** : un dé juxtaposé n'a **rien
     * devant**. `1d66` est une formule valide — c'est là le piège — mais c'est
     * un dé ordinaire à 66 faces.
     */
    it('ne prend PAS « 1d66 » pour un dé juxtaposé', () => {
        expect(lireLaFormule('1d66')).toEqual({
            genre: 'standard', nombre: 1, faces: 66, modificateur: 0,
        });
    });

    it.each(['d1010', 'd36', 'd55', 'd77'])('refuse le faux juxtaposé %s', (f) => {
        expect(lireLaFormule(f).genre).not.toBe('juxtapose');
    });

    it('lit un nombre nu', () => {
        expect(lireLaFormule('100')).toMatchObject({ genre: 'fixe', faces: 100 });
    });

    it.each(['', '   ', 'dix', 'd', 'abc', undefined, null])('déclare illisible : %s', (f) => {
        expect(lireLaFormule(f).genre).toBe('illisible');
    });
});

describe('valeursPossibles', () => {
    it('donne l’intervalle d’un dé standard', () => {
        expect(valeursPossibles('1d6')).toEqual([1, 2, 3, 4, 5, 6]);
        expect(valeursPossibles('2d6')).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(valeursPossibles('1d6+2')).toEqual([3, 4, 5, 6, 7, 8]);
    });

    /**
     * ⛔ **Un dé juxtaposé n'est pas un intervalle.** C'est la phrase qu'il faut
     * retenir : `d66` ne peut sortir ni 17, ni 20, ni 30 — et c'est exactement
     * ce qu'on ne voit pas en relisant un fichier JSON.
     */
    it('donne les 36 valeurs d’un d66, et pas une de plus', () => {
        const v = valeursPossibles('d66')!;
        expect(v).toHaveLength(36);
        expect(v[0]).toBe(11);
        expect(v.at(-1)).toBe(66);
        for (const impossible of [1, 10, 17, 18, 19, 20, 27, 30, 60, 67]) {
            expect(v, `${impossible} ne devrait pas être tirable sur un d66`).not.toContain(impossible);
        }
    });

    it('donne 512 valeurs pour un d888', () => {
        expect(valeursPossibles('d888')).toHaveLength(8 ** 3);
    });

    /** *Un contrôle qui tronque en silence ment* : on distingue « aucune valeur »
        de « trop de valeurs ». */
    it('rend null plutôt que de tronquer une énumération trop large', () => {
        expect(valeursPossibles(`1d${ENUMERATION_MAXIMALE + 1}`)).toBeNull();
        expect(valeursPossibles('abc')).toBeNull();
    });
});

/**
 * ⚠️ **La même lecture des deux côtés.** Deux lectures auraient divergé le jour
 * où l'une accepte `1d66` et pas l'autre — et le contrôle aurait alors déclaré
 * saine une table que le moteur casse.
 */
describe('le moteur et le contrôle lisent la même chose', () => {
    it.each(['1d6', '2d6', 'd66', 'd444', '1d100+5', '20'])(
        'un tirage sur %s tombe toujours dans les valeurs annoncées', (formule) => {
            const attendues = new Set(valeursPossibles(formule)!);
            for (let i = 0; i < 300; i++) {
                expect(attendues, `${formule} a sorti une valeur hors de sa portée`)
                    .toContain(TableEngine.rollDice(formule));
            }
        });

    it('un d66 ne sort jamais un chiffre interdit', () => {
        const vus = new Set<number>();
        for (let i = 0; i < 2000; i++) vus.add(TableEngine.rollDice('d66'));
        expect([...vus].every(v => v % 10 >= 1 && v % 10 <= 6)).toBe(true);
        expect([...vus].every(v => v >= 11 && v <= 66)).toBe(true);
    });

    it('une formule illisible rend 1, comme avant', () => {
        expect(TableEngine.rollDice('n’importe quoi')).toBe(1);
    });
});

describe('controlerLaTable', () => {
    it('ne dit rien d’une table saine', () => {
        expect(controlerLaTable(table({}))).toEqual([]);
        expect(laTableEstFautive(table({}))).toBe(false);
    });

    /**
     * ⛔ **Le contrôle qui aurait sauvé les deux tables Alien.** Il nomme la
     * forme voulue plutôt que de dire « formule douteuse » : *un message qui ne
     * dit pas quoi écrire à la place laisse chercher.*
     */
    it('nomme le piège du « 1d66 »', () => {
        const constats = controlerLaTable(table({ dice: '1d66', entries: [{ min: 11, max: 66, title: 'x', description: '' }] }));
        const faute = constats.find(c => c.code === 'juxtapose-avec-compte')!;

        expect(faute.gravite).toBe('faute');
        expect(faute.message).toContain('« d66 »');
    });

    it('trouve un trou dans la couverture, et le chiffre', () => {
        const constat = controlerLaTable(table({
            dice: '1d6',
            entries: [{ min: 1, max: 2, title: 'a', description: '' }, { min: 5, max: 6, title: 'b', description: '' }],
        })).find(c => c.code === 'trou')!;

        expect(constat.gravite).toBe('faute');
        expect(constat.valeurs).toEqual([3, 4]);
        expect(constat.message).toContain('33 %');
    });

    it('trouve un chevauchement', () => {
        const constat = controlerLaTable(table({
            dice: '1d6',
            entries: [{ min: 1, max: 4, title: 'a', description: '' }, { min: 3, max: 6, title: 'b', description: '' }],
        })).find(c => c.code === 'chevauchement')!;

        expect(constat.valeurs).toEqual([3, 4]);
    });

    it.each([
        ['un dé illisible', { dice: 'dix' }, 'de-illisible'],
        ['aucune entrée', { entries: [] }, 'sans-entree'],
        ['des bornes inversées', { entries: [{ min: 6, max: 1, title: 'a', description: '' }] }, 'bornes-inversees'],
    ])('signale %s', (_cas, patch, code) => {
        expect(codes(table(patch))).toContain(code);
        expect(laTableEstFautive(table(patch))).toBe(true);
    });

    /**
     * ⚠️ **Ce qui n'est PAS un défaut**, et qu'il a fallu apprendre en comptant :
     * `Alien/test_de_panique` déclare `1d6` et va jusqu'à 20, parce que le jet de
     * panique ajoute le stress. Les sentinelles `-99` / `99` relèvent du même
     * idiome. *Ma première passe les avait comptées comme des fautes : sept
     * tables sur neuf accusées à tort.*
     */
    it('ne reproche pas des entrées au-delà du dé — c’est le modificateur', () => {
        const t = table({
            dice: '1d6',
            entries: [
                { min: -99, max: 1, title: 'plancher', description: '' },
                { min: 2, max: 6, title: 'milieu', description: '' },
                { min: 7, max: 99, title: 'plafond', description: '' },
            ],
        });

        expect(laTableEstFautive(t)).toBe(false);
        const note = controlerLaTable(t).find(c => c.code === 'hors-portee')!;
        expect(note.gravite).toBe('note');
    });

    /**
     * ⚠️ **Couvrir large sur un dé juxtaposé ne coûte rien, et ne se signale
     * pas.** Une plage de 11 à 26 sur un `d66` contient douze valeurs qu'on ne
     * peut pas tirer (17-20, 27-30…) : rien ne tombe dedans. La première
     * version les nommait et conseillait un modificateur — *un contrôle qui
     * conseille à tort se fait désarmer.* Trouvé en collant une vraie table.
     */
    it('ne reproche pas les creux d’un dé juxtaposé couverts par une plage', () => {
        const t = table({
            dice: 'd66',
            entries: [
                { min: 11, max: 26, title: 'a', description: '' },
                { min: 31, max: 46, title: 'b', description: '' },
                { min: 51, max: 66, title: 'c', description: '' },
            ],
        });

        expect(controlerLaTable(t)).toEqual([]);
    });

    it('doute d’une quantité de butin illisible, sans en faire une faute', () => {
        const t = table({
            entries: [{
                min: 1, max: 6, title: 'a', description: '',
                butin: [{ name: 'Crédits', quantite: 'beaucoup' }],
            }],
        });

        expect(codes(t)).toContain('quantite-illisible');
        expect(laTableEstFautive(t)).toBe(false);
    });

    it('range les fautes avant les doutes, et les doutes avant les notes', () => {
        const gravites = controlerLaTable(table({
            name: '',
            dice: '1d6',
            entries: [
                { min: 1, max: 2, title: '', description: '' },
                { min: 5, max: 99, title: 'b', description: '' },
            ],
        })).map(c => c.gravite);

        expect(gravites).toEqual([...gravites].sort(
            (a, b) => ({ faute: 0, doute: 1, note: 2 })[a] - ({ faute: 0, doute: 1, note: 2 })[b],
        ));
        expect(gravites[0]).toBe('faute');
    });
});

describe('decouperLaPortee', () => {
    it('couvre toute la portée, sans trou ni chevauchement', () => {
        for (const [formule, n] of [['1d20', 3], ['1d6', 6], ['d66', 5], ['2d6', 4]] as const) {
            const plages = decouperLaPortee(formule, n);
            const possibles = valeursPossibles(formule)!;
            const couvertes = plages.flatMap(p => possibles.filter(v => v >= p.min && v <= p.max));

            expect(plages, `${formule} en ${n}`).toHaveLength(n);
            expect(new Set(couvertes).size, `${formule} en ${n} : trou`).toBe(possibles.length);
            expect(couvertes.length, `${formule} en ${n} : chevauchement`).toBe(possibles.length);
        }
    });

    it('donne le reste aux premières plages', () => {
        expect(decouperLaPortee('1d20', 3)).toEqual([
            { min: 1, max: 7 }, { min: 8, max: 14 }, { min: 15, max: 20 },
        ]);
    });

    /**
     * ⚠️ **Un dé juxtaposé se découpe sur ses valeurs, pas sur son intervalle.**
     * Couper `d66` en deux au milieu de l'intervalle donnerait `11-38`, et 38 ne
     * peut pas sortir. Les bornes doivent tomber sur des valeurs réelles.
     */
    it('appuie les bornes d’un d66 sur des valeurs tirables', () => {
        const possibles = new Set(valeursPossibles('d66')!);
        for (const plage of decouperLaPortee('d66', 4)) {
            expect(possibles, `${plage.min} n’est pas tirable`).toContain(plage.min);
            expect(possibles, `${plage.max} n’est pas tirable`).toContain(plage.max);
        }
    });

    it('produit une table que le contrôle déclare saine', () => {
        const table: TableData = {
            name: 'Découpée', dice: 'd66',
            entries: decouperLaPortee('d66', 6).map((p, i) => ({
                ...p, title: `Entrée ${i + 1}`, description: '',
            })),
        };
        expect(controlerLaTable(table)).toEqual([]);
    });

    /** *On ne fabrique pas des plages vides pour satisfaire un compte.* */
    it.each([
        ['plus d’entrées que de valeurs', '1d6', 7],
        ['zéro entrée', '1d6', 0],
        ['un compte négatif', '1d6', -2],
        ['un dé illisible', 'dix', 3],
    ])('rend une liste vide : %s', (_cas, formule, n) => {
        expect(decouperLaPortee(formule, n)).toEqual([]);
    });
});
