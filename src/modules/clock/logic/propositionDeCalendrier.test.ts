import { describe, it, expect, vi } from 'vitest';
import { proposerUnCalendrier, type AppelStructure } from './propositionDeCalendrier';
import { controlerLeCalendrier, leCalendrierEstFautif, mesurerLeCalendrier } from './formeDuCalendrier';

/**
 * **Ce qu'on fait de la réponse du modèle — qui est tout le sujet.**
 *
 * ⛔ **L'enjeu est plus haut qu'avec une table.** Un modèle qui rend
 * `months: []` ne produit pas un calendrier bancal : il produit un calendrier
 * qui **gèle GM-OS**. *Sans le contrôle en aval, cet appel serait une façon de
 * figer l'application en tapant une phrase.*
 */

const repond = (objet: unknown): AppelStructure => vi.fn().mockResolvedValue(objet);

const id = (c: Awaited<ReturnType<typeof proposerUnCalendrier>>) => ({ ...c, id: 'x' });

describe('proposerUnCalendrier — ce qui passe', () => {
    it('range les mois dans l’ordre rendu', async () => {
        const c = await proposerUnCalendrier('un monde de glace', {}, repond({
            name: 'Calendrier du Gel',
            months: [{ name: 'Givre', days: 40 }, { name: 'Dégel', days: 20 }],
        }));

        expect(c.name).toBe('Calendrier du Gel');
        expect(c.months.map(m => m.name)).toEqual(['Givre', 'Dégel']);
        expect(mesurerLeCalendrier(id(c)).joursParAnneeOrdinaire).toBe(60);
    });

    it('garde les drapeaux de mois', async () => {
        const c = await proposerUnCalendrier('x', {}, repond({
            months: [
                { name: 'An', days: 30 },
                { name: 'Solstice', days: 1, isIntercalary: true },
                { name: 'Rare', days: 1, leapYearOnly: true },
            ],
        }));

        expect(c.months[1].isIntercalary).toBe(true);
        expect(c.months[2].leapYearOnly).toBe(true);
        expect(c.months[0].isIntercalary).toBeUndefined();
    });

    it('reprend la semaine et le cycle déclarés', async () => {
        const c = await proposerUnCalendrier('x', {}, repond({
            months: [{ name: 'A', days: 30 }],
            daysOfWeek: ['Lune', 'Feu', ''],
            cycleBissextile: 7,
        }));

        expect(c.daysOfWeek).toEqual(['Lune', 'Feu']);
        expect(c.cycleBissextile).toBe(7);
        /* `daysPerWeek` n'a pas de lecteur, mais il ne doit pas contredire les noms. */
        expect(c.daysPerWeek).toBe(2);
        expect(controlerLeCalendrier(id(c)).some(x => x.code === 'semaine-contredite')).toBe(false);
    });

    it('accepte un cycle de zéro — « jamais » est une réponse', async () => {
        const c = await proposerUnCalendrier('x', {}, repond({
            months: [{ name: 'A', days: 30 }], cycleBissextile: 0,
        }));

        expect(c.cycleBissextile).toBe(0);
    });

    it('transmet la longueur d’année visée dans la consigne', async () => {
        const appel = repond({ months: [{ name: 'A', days: 360 }] });
        await proposerUnCalendrier('x', { joursParAnnee: 360 }, appel);

        expect(appel).toHaveBeenCalledWith('x', expect.stringContaining('EXACTEMENT 360 jours'),
            expect.objectContaining({ sansPersona: true }));
    });

    /** ⛔ Une voix de meneur n'a rien à faire dans la composition d'un calendrier. */
    it('appelle toujours sansPersona, avec un schéma imposé', async () => {
        const appel = repond({ months: [{ name: 'A', days: 30 }] });
        await proposerUnCalendrier('x', {}, appel);

        expect(appel).toHaveBeenCalledWith('x', expect.any(String), expect.objectContaining({
            sansPersona: true,
            schema: expect.objectContaining({ required: ['months'] }),
        }));
    });
});

describe('⛔ proposerUnCalendrier — ce qu’on refuse de rafistoler', () => {
    /**
     * ⚠️ *Un mois en moins se voit dans la mesure ; un mois inventé ne se voit
     * nulle part.* Lui donner trente jours d'office changerait la longueur de
     * l'année — le seul nombre que le meneur croit contrôler.
     */
    it.each([
        ['sans durée', { name: 'Flou' }],
        ['à zéro jour', { name: 'Creux', days: 0 }],
        ['à durée négative', { name: 'Absurde', days: -3 }],
        ['à durée illisible', { name: 'Texte', days: 'beaucoup' }],
    ])('écarte un mois %s au lieu de lui inventer une durée', async (_, mauvais) => {
        const c = await proposerUnCalendrier('x', {}, repond({
            months: [{ name: 'Bon', days: 30 }, mauvais],
        }));

        expect(c.months).toHaveLength(1);
        expect(mesurerLeCalendrier(id(c)).joursParAnneeOrdinaire).toBe(30);
    });

    /**
     * ⛔ **Le cas qui gèlerait l'application.** On ne le corrige pas ici — on le
     * laisse arriver jusqu'au contrôle, qui est le seul endroit où la règle
     * vit. *Deux définitions du « calendrier utilisable » finiraient par ne plus
     * refuser la même chose.*
     */
    it('laisse un calendrier SANS MOIS être refusé par le contrôle', async () => {
        const c = await proposerUnCalendrier('x', {}, repond({ months: [] }));

        expect(c.months).toEqual([]);
        expect(leCalendrierEstFautif(id(c)), 'le contrôle doit l’attraper').toBe(true);
    });

    /**
     * ⚠️ **Sans ce repli, un modèle qui omet l'heure rendrait un calendrier dont
     * le jour dure zéro seconde** — c'est-à-dire un calendrier qui gèle
     * l'horloge. Le contrôle l'attraperait, mais le meneur verrait une faute
     * qu'il n'a pas commise.
     */
    it('retombe sur 24 h et 60 min quand le modèle se tait', async () => {
        const c = await proposerUnCalendrier('x', {}, repond({ months: [{ name: 'A', days: 30 }] }));

        expect(c.hoursPerDay).toBe(24);
        expect(c.minutesPerHour).toBe(60);
        expect(leCalendrierEstFautif(id(c))).toBe(false);
    });

    it.each([0, -5, 'douze'])('retombe aussi sur 24 h quand il rend %s', async (h) => {
        const c = await proposerUnCalendrier('x', {}, repond({
            months: [{ name: 'A', days: 30 }], hoursPerDay: h,
        }));

        expect(c.hoursPerDay).toBe(24);
    });

    it('honore des heures inhabituelles quand elles sont lisibles', async () => {
        const c = await proposerUnCalendrier('x', {}, repond({
            months: [{ name: 'A', days: 30 }], hoursPerDay: 20, minutesPerHour: 100,
        }));

        expect(c.hoursPerDay).toBe(20);
        expect(c.minutesPerHour).toBe(100);
    });

    it('survit à une réponse vide, ou d’une autre forme', async () => {
        expect((await proposerUnCalendrier('x', {}, repond(null))).months).toEqual([]);
        expect((await proposerUnCalendrier('x', {}, repond('n’importe quoi'))).months).toEqual([]);
    });

    /** Un modèle qui rend directement le tableau des mois reste compris. */
    it('accepte un tableau de mois rendu tel quel', async () => {
        const c = await proposerUnCalendrier('x', {}, repond([{ name: 'A', days: 30 }]));

        expect(c.months).toHaveLength(1);
    });
});
