import { describe, it, expect, vi } from 'vitest';
import { rangerParLIA, type AppelStructure } from './miseEnFormeParLIA';
import { controlerLaTable } from './formeDeLaTable';

/**
 * **Ce qu'on fait de la réponse du modèle** — c'est tout le sujet.
 *
 * On n'éprouve pas le modèle : on éprouve qu'une réponse **abîmée** ne devienne
 * pas une table abîmée. Un modèle rend un `min` en chaîne, oublie un champ,
 * inverse deux bornes, répond un tableau nu au lieu d'un objet : rien de tout
 * cela ne doit atteindre le fichier.
 *
 * ⭐ **Et ce qui rend l'ensemble sûr n'est pas ici** : c'est que la proposition
 * repasse par `controlerLaTable` et s'affiche dans la bande de couverture avant
 * d'être enregistrée. *Le modèle propose, le contrôle relit, l'écran montre.*
 */

const repond = (valeur: unknown): AppelStructure => vi.fn().mockResolvedValue(valeur);

const TABLE_RENDUE = {
    name: 'Avaries mineures',
    entries: [
        { min: 1, max: 5, title: 'Rien', description: 'Le calme.', effect: 'Aucun' },
        { min: 6, max: 10, title: 'Fuite', description: 'Un sifflement.' },
    ],
};

describe('rangerParLIA', () => {
    it('rend les entrées et le nom', async () => {
        const proposition = await rangerParLIA('…', {}, repond(TABLE_RENDUE));

        expect(proposition.name).toBe('Avaries mineures');
        expect(proposition.entries).toHaveLength(2);
        expect(proposition.entries[0]).toEqual({
            min: 1, max: 5, title: 'Rien', description: 'Le calme.', effect: 'Aucun',
        });
    });

    /** Un champ absent n'est pas un champ vide à inventer : `effect` disparaît. */
    it('n’ajoute pas un effet que le modèle n’a pas donné', async () => {
        const { entries } = await rangerParLIA('…', {}, repond(TABLE_RENDUE));
        expect(entries[1]).not.toHaveProperty('effect');
    });

    it('accepte des bornes rendues en chaînes', async () => {
        const { entries } = await rangerParLIA('…', {},
            repond({ entries: [{ min: '3', max: '7', title: 'x' }] }));

        expect(entries[0]).toMatchObject({ min: 3, max: 7 });
    });

    /**
     * ⛔ **Une entrée sans bornes lisibles est écartée, pas rafistolée.** Lui
     * inventer un `min` la placerait au hasard dans la table : *une entrée
     * perdue se voit dans la bande, une entrée déplacée ne se voit nulle part.*
     */
    it.each([
        ['un min absent', { max: 5, title: 'x' }],
        ['un min non entier', { min: 1.5, max: 5, title: 'x' }],
        ['un min illisible', { min: 'trois', max: 5, title: 'x' }],
        ['une entrée nulle', null],
    ])('écarte %s', async (_cas, mauvaise) => {
        const { entries } = await rangerParLIA('…', {}, repond({
            entries: [{ min: 1, max: 2, title: 'bonne' }, mauvaise],
        }));

        expect(entries).toHaveLength(1);
        expect(entries[0].title).toBe('bonne');
    });

    it('remet à l’endroit des bornes inversées', async () => {
        const { entries } = await rangerParLIA('…', {},
            repond({ entries: [{ min: 8, max: 3, title: 'x' }] }));

        expect(entries[0]).toMatchObject({ min: 8, max: 8 });
    });

    it('accepte un tableau nu, que certains modèles rendent', async () => {
        const { entries, name } = await rangerParLIA('…', {},
            repond([{ min: 1, max: 6, title: 'x' }]));

        expect(entries).toHaveLength(1);
        expect(name).toBeUndefined();
    });

    it.each([
        ['une réponse vide', null],
        ['une réponse sans entrées', { name: 'Vide' }],
        ['une réponse absurde', 'du texte'],
    ])('ne casse pas sur %s', async (_cas, reponse) => {
        const { entries } = await rangerParLIA('…', {}, repond(reponse));
        expect(entries).toEqual([]);
    });
});

describe('ce qu’on demande au modèle', () => {
    it('lui impose le dé quand le meneur en a choisi un', async () => {
        const appel = vi.fn().mockResolvedValue({ entries: [] });
        await rangerParLIA('…', { de: 'd66' }, appel);

        const consigne = appel.mock.calls[0][1] as string;
        expect(consigne).toContain('« d66 »');
        expect(consigne).toContain('Ne change pas de dé');
    });

    it('le laisse déduire les bornes quand aucun dé n’est posé', async () => {
        const appel = vi.fn().mockResolvedValue({ entries: [] });
        await rangerParLIA('…', {}, appel);

        expect(appel.mock.calls[0][1] as string).toContain('Déduis les bornes');
    });

    /**
     * ⚠️ **L'image part en pièce jointe, et c'est tout ce qu'on peut garder
     * ici.** Elle n'est honorée que par le chemin Gemini de `generateJSON` ; les
     * autres fournisseurs l'ignorent **en silence**. Cet essai dit qu'on la
     * transmet — il ne dit pas qu'un modèle la lit, et *un essai qui
     * prétendrait le dire donnerait une couverture décorative.*
     */
    it('transmet l’image en pièce jointe', async () => {
        const appel = vi.fn().mockResolvedValue({ entries: [] });
        await rangerParLIA('', { image: { donnees: 'AAAA', mimeType: 'image/png' } }, appel);

        expect(appel.mock.calls[0][3]).toEqual([{ data: 'AAAA', mimeType: 'image/png' }]);
    });

    /** Sans texte, l'invite doit quand même dire quoi faire de la pièce jointe. */
    it('donne une consigne au modèle même sans texte collé', async () => {
        const appel = vi.fn().mockResolvedValue({ entries: [] });
        await rangerParLIA('', { image: { donnees: 'AAAA', mimeType: 'image/png' } }, appel);

        expect(appel.mock.calls[0][0]).toContain('l’image');
    });

    it('n’envoie aucune pièce jointe quand il n’y a pas d’image', async () => {
        const appel = vi.fn().mockResolvedValue({ entries: [] });
        await rangerParLIA('du texte', {}, appel);

        expect(appel.mock.calls[0][3]).toBeUndefined();
    });

    /** Une extraction n'a que faire d'une voix de meneur. */
    it('part sans persona, avec son schéma et un plafond relevé', async () => {
        const appel = vi.fn().mockResolvedValue({ entries: [] });
        await rangerParLIA('…', {}, appel);

        expect(appel.mock.calls[0][2]).toMatchObject({
            sansPersona: true,
            plafondDeGeneration: 4096,
        });
        expect(appel.mock.calls[0][2]).toHaveProperty('schema');
    });
});

/**
 * ⭐ **La composition qui protège.** Une réponse trouée passe la mise en forme —
 * c'est normal, elle ne juge pas — et se fait prendre par le contrôle. C'est
 * cette seconde lecture qui autorise à laisser une machine écrire des oracles.
 */
describe('la proposition repasse par le contrôle', () => {
    it('une table oubliant des valeurs est signalée, pas acceptée', async () => {
        const { entries } = await rangerParLIA('…', { de: '1d20' }, repond({
            entries: [
                { min: 1, max: 5, title: 'a' },
                { min: 6, max: 12, title: 'b' },
                // Le modèle s'arrête à 12 : 13 à 20 manquent.
            ],
        }));

        const constat = controlerLaTable({ name: 'x', dice: '1d20', entries })
            .find(c => c.code === 'trou')!;

        expect(constat.gravite).toBe('faute');
        expect(constat.valeurs).toEqual([13, 14, 15, 16, 17, 18, 19, 20]);
    });

    it('une table complète ne déclenche rien', async () => {
        const { entries } = await rangerParLIA('…', { de: '1d6' }, repond({
            entries: [{ min: 1, max: 3, title: 'a' }, { min: 4, max: 6, title: 'b' }],
        }));

        expect(controlerLaTable({ name: 'x', dice: '1d6', entries })).toEqual([]);
    });
});
