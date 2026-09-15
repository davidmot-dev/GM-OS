import { describe, it, expect } from 'vitest';
import {
    controlerLeCalendrier,
    departDeLaFete,
    dureeDeLaFete,
    feteDuJour,
    fetesDuMois,
    finDeLaFete,
    intercalairesHorsSemaine,
    jourDeLaSemaine,
    leCalendrierEstFautif,
    mentionDeLaFete,
    mesurerLeCalendrier,
    rangDansLaSemaine,
    type CalendrierDatable,
} from './formeDuCalendrier';

/**
 * **Les jours de fête, et la semaine qu'ils ne doivent plus décaler.**
 *
 * *David, le 2026-09-15 : « je veux pouvoir déclarer des jours de fêtes ».*
 *
 * ⚠️ **« Fête » voulait déjà dire quelque chose, et c'était mince** : un mois
 * d'un jour marqué `isIntercalary`, dont le seul effet était de retirer le
 * numéro du jour à l'affichage. On ne pouvait pas dire « le 15 de Hammer est la
 * Fête du Marteau ».
 *
 * ⛔ **Et une fête consommait un jour de semaine** : le calcul comptait tous les
 * jours écoulés modulo la longueur de la semaine. Les six fêtes d'Harptos
 * décalaient donc la semaine de six jours par an.
 */

const SEMAINE = ['Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept'];

const cal = (sur: Partial<CalendrierDatable> = {}): CalendrierDatable => ({
    id: 'c', name: 'Test', daysPerWeek: 7, hoursPerDay: 24, minutesPerHour: 60,
    daysOfWeek: SEMAINE,
    months: [{ name: 'Hammer', days: 30 }, { name: 'Alturiak', days: 30 }],
    ...sur,
});

/** Un mois qui porte des fêtes. */
const avecFetes = (fetes: CalendrierDatable['months'][number]['fetes']) => cal({
    months: [{ name: 'Hammer', days: 30, fetes }, { name: 'Alturiak', days: 30 }],
});

describe('la forme d’une fête', () => {
    it('dure un jour quand rien n’est déclaré', () => {
        expect(dureeDeLaFete({})).toBe(1);
        expect(dureeDeLaFete({ duree: 4 })).toBe(4);
    });

    it.each([0, -3, Number.NaN])('dure un jour sur une durée de %s', (d) => {
        expect(dureeDeLaFete({ duree: d as number })).toBe(1);
    });

    it('ne commence jamais avant le premier du mois', () => {
        expect(departDeLaFete({ jour: 0 })).toBe(1);
        expect(departDeLaFete({ jour: -5 })).toBe(1);
        expect(departDeLaFete({ jour: Number.NaN as number })).toBe(1);
    });

    it('finit bornes comprises', () => {
        expect(finDeLaFete({ nom: 'x', jour: 12, duree: 4 })).toBe(15);
        expect(finDeLaFete({ nom: 'x', jour: 15 })).toBe(15);
    });

    /** ⚠️ Une fête muette au milieu d'une date est plus déroutante qu'une absence. */
    it('écarte une fête sans nom', () => {
        const mois = { name: 'H', days: 30, fetes: [
            { nom: '  ', jour: 3 }, { nom: 'Vraie', jour: 5 },
        ] };
        expect(fetesDuMois(mois).map(f => f.nom)).toEqual(['Vraie']);
    });

    it('les range dans l’ordre des dates', () => {
        const mois = { name: 'H', days: 30, fetes: [
            { nom: 'Tard', jour: 20 }, { nom: 'Tôt', jour: 3 },
        ] };
        expect(fetesDuMois(mois).map(f => f.nom)).toEqual(['Tôt', 'Tard']);
    });

    it('n’exige aucune fête', () => {
        expect(fetesDuMois(undefined)).toEqual([]);
        expect(fetesDuMois({ name: 'H', days: 30 })).toEqual([]);
    });
});

describe('feteDuJour — ce qui tombe ce jour-là', () => {
    const c = avecFetes([
        { nom: 'Fête du Marteau', jour: 15 },
        { nom: 'Nuits du Marteau', jour: 20, duree: 4, description: 'Quatre nuits de veille.' },
    ]);

    it('trouve une fête d’un seul jour', () => {
        expect(feteDuJour(c, 0, 15)).toEqual({ nom: 'Fête du Marteau', rang: 1, sur: 1 });
    });

    it('ne trouve rien la veille ni le lendemain', () => {
        expect(feteDuJour(c, 0, 14)).toBeNull();
        expect(feteDuJour(c, 0, 16)).toBeNull();
    });

    /** ⭐ Le choix de David : une fête est une PÉRIODE, pas un seul jour. */
    it.each([
        [20, 1], [21, 2], [22, 3], [23, 4],
    ])('dit où on en est le %s : jour %s de la fête', (jour, rang) => {
        expect(feteDuJour(c, 0, jour as number)).toMatchObject({
            nom: 'Nuits du Marteau', rang, sur: 4,
        });
    });

    it('s’arrête au dernier jour', () => {
        expect(feteDuJour(c, 0, 24)).toBeNull();
    });

    it('emporte la description quand il y en a une', () => {
        expect(feteDuJour(c, 0, 20)?.description).toBe('Quatre nuits de veille.');
        expect(feteDuJour(c, 0, 15)).not.toHaveProperty('description');
    });

    it('ne cherche pas dans un autre mois', () => {
        expect(feteDuJour(c, 1, 15)).toBeNull();
    });

    it('ne lève pas sur un mois qui n’existe pas', () => {
        expect(feteDuJour(c, 99, 15)).toBeNull();
        expect(feteDuJour(c, 0, Number.NaN)).toBeNull();
    });

    /** ⚠️ *La plus ancienne est la moins surprenante* — le contrôle signale le reste. */
    it('rend la première quand deux se chevauchent', () => {
        const chevauche = avecFetes([
            { nom: 'Veillée', jour: 10, duree: 5 },
            { nom: 'Solstice', jour: 12 },
        ]);
        expect(feteDuJour(chevauche, 0, 12)?.nom).toBe('Veillée');
    });
});

describe('mentionDeLaFete — comment elle se lit', () => {
    /** ⚠️ Sans ça, tout serait suivi d'un « (1/1) » qui n'apprend rien. */
    it('n’affiche pas le rang d’une fête d’un seul jour', () => {
        expect(mentionDeLaFete({ nom: 'Solstice', rang: 1, sur: 1 })).toBe('Solstice');
    });

    it('affiche le rang d’une fête de plusieurs jours', () => {
        expect(mentionDeLaFete({ nom: 'Nuits', rang: 2, sur: 4 })).toBe('Nuits (2/4)');
    });

    it('rend null quand rien ne tombe', () => {
        expect(mentionDeLaFete(null)).toBeNull();
    });
});

describe('⛔ la semaine — les jours hors calendrier ne la font plus avancer', () => {
    /** Harptos en miniature : un mois, une fête hors calendrier, un mois. */
    const harptos = (sur: Partial<CalendrierDatable> = {}) => cal({
        months: [
            { name: 'Hammer', days: 30 },
            { name: 'Milieu d’Hiver', days: 1, isIntercalary: true },
            { name: 'Alturiak', days: 30 },
        ],
        ...sur,
    });

    it('vaut « hors semaine » quand rien n’est déclaré', () => {
        expect(intercalairesHorsSemaine(cal())).toBe(true);
    });

    /**
     * ⛔ **Le défaut corrigé.** Le 1er d'Alturiak suit le 30 de Hammer dans la
     * semaine, parce que le Milieu d'Hiver n'en fait pas partie. Avant, il
     * sautait un cran.
     */
    it('le lendemain d’un jour hors calendrier reprend le fil', () => {
        const c = harptos();
        const avant = rangDansLaSemaine(c, { year: 1, monthIndex: 0, day: 30 })!;
        const apres = rangDansLaSemaine(c, { year: 1, monthIndex: 2, day: 1 })!;

        expect(apres).toBe((avant + 1) % SEMAINE.length);
    });

    /** ⚠️ `null` n'est pas une erreur, c'est une réponse. */
    it('un jour hors calendrier n’a AUCUN jour de semaine', () => {
        expect(rangDansLaSemaine(harptos(), { year: 1, monthIndex: 1, day: 1 })).toBeNull();
        expect(jourDeLaSemaine(harptos(), { year: 1, monthIndex: 1, day: 1 })).toBeUndefined();
    });

    /** Un monde qui compte ses fêtes dans la semaine reste exprimable. */
    it('les compte quand le calendrier le déclare', () => {
        const c = harptos({ intercalairesHorsSemaine: false });

        expect(rangDansLaSemaine(c, { year: 1, monthIndex: 1, day: 1 })).not.toBeNull();

        const avant = rangDansLaSemaine(c, { year: 1, monthIndex: 0, day: 30 })!;
        const apres = rangDansLaSemaine(c, { year: 1, monthIndex: 2, day: 1 })!;
        expect(apres, 'la fête consomme un cran').toBe((avant + 2) % SEMAINE.length);
    });

    it('avance d’un cran par jour à l’intérieur d’un mois', () => {
        const c = cal();
        const a = rangDansLaSemaine(c, { year: 0, monthIndex: 0, day: 1 })!;
        const b = rangDansLaSemaine(c, { year: 0, monthIndex: 0, day: 2 })!;

        expect(b).toBe((a + 1) % SEMAINE.length);
    });

    it('boucle sur la longueur de la semaine', () => {
        const c = cal();
        const a = rangDansLaSemaine(c, { year: 0, monthIndex: 0, day: 1 });
        const b = rangDansLaSemaine(c, { year: 0, monthIndex: 0, day: 1 + SEMAINE.length });

        expect(b).toBe(a);
    });

    /** Les chroniques qui datent depuis une fondation vivent en années négatives. */
    it('reste dans le tableau des noms pour une année négative', () => {
        const rang = rangDansLaSemaine(cal(), { year: -3, monthIndex: 0, day: 1 });

        expect(rang).not.toBeNull();
        expect(rang).toBeGreaterThanOrEqual(0);
        expect(rang).toBeLessThan(SEMAINE.length);
    });

    it('rend null quand aucun jour n’est nommé', () => {
        expect(rangDansLaSemaine(cal({ daysOfWeek: [] }), { year: 1, monthIndex: 0, day: 1 }))
            .toBeNull();
    });

    /** ⛔ On ne compte pas les années d'un calendrier qui gèlerait l'horloge. */
    it('rend null sur un calendrier fautif', () => {
        expect(leCalendrierEstFautif(cal({ months: [] }))).toBe(true);
        expect(rangDansLaSemaine(cal({ months: [] }), { year: 1, monthIndex: 0, day: 1 }))
            .toBeNull();
    });

    it('rend le NOM du jour, pas seulement son rang', () => {
        const nom = jourDeLaSemaine(cal(), { year: 0, monthIndex: 0, day: 1 });
        expect(SEMAINE).toContain(nom);
    });
});

describe('le contrôle des fêtes — des doutes, jamais des fautes', () => {
    /**
     * ⚠️ *Une fête mal placée ne casse rien : elle ne tombe simplement jamais* —
     * et c'est le genre de silence qu'on ne remarque qu'à la séance où on
     * l'attendait.
     */
    it('signale une fête qui ne tombera jamais', () => {
        const c = avecFetes([{ nom: 'Jamais', jour: 40 }]);
        const constat = controlerLeCalendrier(c).find(x => x.code === 'fete-hors-du-mois');

        expect(constat?.gravite).toBe('doute');
        expect(constat?.message).toContain('ne tombera jamais');
        expect(leCalendrierEstFautif(c), 'jamais une faute').toBe(false);
    });

    it('signale une fête qui déborde du mois', () => {
        const constat = controlerLeCalendrier(avecFetes([{ nom: 'Longue', jour: 28, duree: 10 }]))
            .find(x => x.code === 'fete-depasse-le-mois');

        expect(constat?.gravite).toBe('doute');
        expect(constat?.mois).toBe(0);
    });

    it('signale une fête sans nom', () => {
        expect(controlerLeCalendrier(avecFetes([{ nom: '', jour: 3 }]))
            .find(x => x.code === 'fete-sans-nom')?.gravite).toBe('doute');
    });

    it('signale deux fêtes qui se chevauchent', () => {
        const constat = controlerLeCalendrier(avecFetes([
            { nom: 'Veillée', jour: 10, duree: 5 },
            { nom: 'Solstice', jour: 12 },
        ])).find(x => x.code === 'fetes-qui-se-chevauchent');

        expect(constat?.message).toContain('seule la première sera annoncée');
    });

    /**
     * ⚠️ **Les bornes sont comprises** : du 10 sur trois jours, c'est 10, 11 et
     * 12. Le 13 suit sans se toucher ; le 12 se chevauche. *Mon premier essai
     * plaçait la frontière un jour trop loin — l'essai avait tort, pas le code.*
     */
    it('place la frontière du chevauchement au bon jour', () => {
        const chevauchent = (jourDeB: number) => controlerLeCalendrier(avecFetes([
            { nom: 'A', jour: 10, duree: 3 },
            { nom: 'B', jour: jourDeB },
        ])).some(x => x.code === 'fetes-qui-se-chevauchent');

        expect(chevauchent(12), 'dernier jour de A').toBe(true);
        expect(chevauchent(13), 'le lendemain de A').toBe(false);
    });

    /** ⚠️ Le mois entier est déjà une fête : la déclaration se perdrait. */
    it('signale une fête déclarée dans un mois hors calendrier', () => {
        const c = cal({
            months: [{ name: 'Solstice', days: 1, isIntercalary: true, fetes: [{ nom: 'Bis', jour: 1 }] }],
        });

        expect(controlerLeCalendrier(c).find(x => x.code === 'fete-dans-un-intercalaire')?.gravite)
            .toBe('doute');
    });

    it('ne dit rien d’un calendrier dont les fêtes sont bien posées', () => {
        const c = avecFetes([{ nom: 'Marteau', jour: 15 }, { nom: 'Nuits', jour: 20, duree: 4 }]);

        expect(controlerLeCalendrier(c).filter(x => x.code.startsWith('fete'))).toEqual([]);
    });
});

describe('la mesure compte les jours de fête', () => {
    it('additionne les jours couverts', () => {
        const c = avecFetes([{ nom: 'A', jour: 3 }, { nom: 'B', jour: 10, duree: 4 }]);
        expect(mesurerLeCalendrier(c).joursDeFete).toBe(5);
    });

    /** Une fête qui déborde ne compte que les jours qui existent vraiment. */
    it('borne une fête qui dépasse le mois', () => {
        expect(mesurerLeCalendrier(avecFetes([{ nom: 'Longue', jour: 28, duree: 10 }])).joursDeFete)
            .toBe(3);
    });

    it('ignore une fête qui ne tombe jamais', () => {
        expect(mesurerLeCalendrier(avecFetes([{ nom: 'Jamais', jour: 40 }])).joursDeFete).toBe(0);
    });

    it('vaut zéro sans fête', () => {
        expect(mesurerLeCalendrier(cal()).joursDeFete).toBe(0);
    });
});
