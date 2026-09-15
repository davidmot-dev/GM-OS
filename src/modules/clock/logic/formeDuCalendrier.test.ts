import { describe, it, expect } from 'vitest';
import {
    CYCLE_BISSEXTILE_HISTORIQUE,
    controlerLeCalendrier,
    cycleBissextile,
    dateDeDepart,
    estBissextile,
    horodatageDeLaDate,
    joursDeLAnnee,
    leCalendrierEstFautif,
    mesurerLeCalendrier,
    secondesParJour,
    type CalendrierDatable,
} from './formeDuCalendrier';

/**
 * **Ce qui fait qu'un calendrier tient debout.**
 *
 * *David, le 2026-09-15 : « peut-on faire un module d'aide à la création de
 * calendrier fantastique ? ».*
 *
 * ⛔ **Le contrôle n'est pas le confort de ce module, il en est la condition.**
 * Un calendrier sans mois — ou dont le jour dure zéro seconde — met
 * `getFantasyDate` en **boucle infinie** : mesuré le jour même, cinquante
 * millions de tours sans sortir. Aujourd'hui c'est inatteignable, personne ne
 * pouvant écrire un calendrier ; *le jour où le meneur peut en taper un, ça
 * devient une frappe.*
 */

const cal = (sur: Partial<CalendrierDatable> = {}): CalendrierDatable => ({
    id: 'c', name: 'Test', daysPerWeek: 7, hoursPerDay: 24, minutesPerHour: 60,
    months: [{ name: 'Premier', days: 30 }, { name: 'Second', days: 30 }],
    ...sur,
});

/** Harptos, tel qu'il est livré — le seul calendrier qui ait jamais existé ici. */
const harptos = (sur: Partial<CalendrierDatable> = {}): CalendrierDatable => cal({
    name: "Calendrier d'Harptos",
    daysOfWeek: ['Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix'],
    months: [
        ...Array.from({ length: 12 }, (_, i) => ({ name: `Mois ${i + 1}`, days: 30 })),
        { name: 'Milieu d’Hiver', days: 1, isIntercalary: true },
        { name: 'Herbeverte', days: 1, isIntercalary: true },
        { name: 'Milieu d’Été', days: 1, isIntercalary: true },
        { name: 'Fête de la Moisson', days: 1, isIntercalary: true },
        { name: 'Fête de la Lune', days: 1, isIntercalary: true },
        { name: 'Rencontre des Boucliers', days: 1, isIntercalary: true, leapYearOnly: true },
    ],
    ...sur,
});

describe('la règle bissextile — elle était codée en dur à cinq endroits', () => {
    /** ⚠️ Le défaut doit reproduire hier, pas choisir pour demain. */
    it('vaut quatre quand rien n’est déclaré, comme avant ce champ', () => {
        expect(cycleBissextile(cal())).toBe(CYCLE_BISSEXTILE_HISTORIQUE);
        expect(estBissextile(cal(), 4)).toBe(true);
        expect(estBissextile(cal(), 5)).toBe(false);
    });

    it('suit le cycle déclaré', () => {
        expect(estBissextile(cal({ cycleBissextile: 3 }), 6)).toBe(true);
        expect(estBissextile(cal({ cycleBissextile: 3 }), 7)).toBe(false);
    });

    /** Un calendrier sans année bissextile est parfaitement légitime. */
    it('ne rend JAMAIS vrai sur un cycle de zéro', () => {
        for (const an of [0, 1, 4, 100, -4]) {
            expect(estBissextile(cal({ cycleBissextile: 0 }), an)).toBe(false);
        }
    });

    /**
     * ⚠️ Un modulo négatif rend un reste négatif en JavaScript. Sans le
     * ramener dans le cycle, l'an −4 ne serait pas bissextile alors que l'an 4
     * l'est — et les chroniques qui datent depuis une fondation vivent toutes
     * en années négatives.
     */
    it('traite les années négatives comme les positives', () => {
        expect(estBissextile(cal(), -4)).toBe(true);
        expect(estBissextile(cal(), -5)).toBe(false);
    });

    it('ne se laisse pas troubler par une année illisible', () => {
        expect(estBissextile(cal(), Number.NaN)).toBe(false);
    });
});

describe('joursDeLAnnee — l’unique définition, là où il y en avait quatre', () => {
    it('compte 365 jours à Harptos, et 366 les années bissextiles', () => {
        expect(joursDeLAnnee(harptos(), 1)).toBe(365);
        expect(joursDeLAnnee(harptos(), 4)).toBe(366);
    });

    it('ignore un mois dont les jours sont illisibles', () => {
        const abime = cal({ months: [{ name: 'Bon', days: 30 }, { name: 'Cassé', days: -5 }] });
        expect(joursDeLAnnee(abime, 1)).toBe(30);
    });

    it('n’exige aucun mois', () => {
        expect(joursDeLAnnee(cal({ months: [] }), 1)).toBe(0);
    });
});

describe('secondesParJour', () => {
    it('multiplie les heures, les minutes et les secondes', () => {
        expect(secondesParJour(cal())).toBe(86_400);
        expect(secondesParJour(cal({ hoursPerDay: 20, minutesPerHour: 100 }))).toBe(120_000);
    });

    /** ⛔ La valeur qui fige la boucle des années. */
    it.each([0, -1, Number.NaN])('rend zéro sur %s heure(s) par jour', (h) => {
        expect(secondesParJour(cal({ hoursPerDay: h as number }))).toBe(0);
    });
});

describe('⛔ le contrôle — les fautes qui GÈLENT l’application', () => {
    /**
     * ⛔⛔ **Le test qui justifie tout le module.** `getFantasyDate` avance par
     * soustraction ; si une année dure zéro seconde, la soustraction ne retire
     * rien et la boucle ne s'arrête jamais. *Ce n'est pas une date fausse,
     * c'est l'application figée, sans message et sans trace.*
     */
    it('refuse un calendrier sans aucun mois', () => {
        const constats = controlerLeCalendrier(cal({ months: [] }));

        expect(constats.some(c => c.code === 'sans-mois' && c.gravite === 'faute')).toBe(true);
        expect(leCalendrierEstFautif(cal({ months: [] }))).toBe(true);
    });

    it('refuse un jour qui ne dure aucune seconde', () => {
        expect(leCalendrierEstFautif(cal({ hoursPerDay: 0 }))).toBe(true);
        expect(leCalendrierEstFautif(cal({ minutesPerHour: 0 }))).toBe(true);

        expect(controlerLeCalendrier(cal({ hoursPerDay: 0 }))
            .find(c => c.code === 'jour-vide')?.message).toContain('figerait');
    });

    /** Des mois présents, mais tous vides : même gel, autre chemin. */
    it('refuse une année de longueur nulle même avec des mois', () => {
        const vide = cal({ months: [{ name: 'Rien', days: 0 }] });

        expect(controlerLeCalendrier(vide).some(c => c.code === 'annee-vide')).toBe(true);
        expect(leCalendrierEstFautif(vide)).toBe(true);
    });

    it('nomme le mois fautif par son rang', () => {
        const constat = controlerLeCalendrier(cal({
            months: [{ name: 'Bon', days: 30 }, { name: 'Creux', days: 0 }],
        })).find(c => c.code === 'mois-sans-jour');

        expect(constat?.mois).toBe(1);
        expect(constat?.message).toContain('Creux');
    });
});

describe('le contrôle — ce qui n’est qu’un doute', () => {
    /**
     * ⚠️ *Un contrôle qui crie sur ce qui est voulu finit par être ignoré
     * quand il crie sur ce qui est faux* — la leçon des sentinelles d'Alien.
     */
    it('laisse passer un mois de quarante jours sans rien dire', () => {
        const long = cal({ months: [{ name: 'Long', days: 40 }] });
        expect(controlerLeCalendrier(long).some(c => c.gravite === 'faute')).toBe(false);
    });

    it('signale deux mois du même nom', () => {
        const jumeaux = cal({ months: [{ name: 'Givre', days: 30 }, { name: 'givre', days: 30 }] });

        const constat = controlerLeCalendrier(jumeaux).find(c => c.code === 'mois-en-double');
        expect(constat?.gravite).toBe('doute');
        expect(constat?.mois).toBe(1);
    });

    /** ⚠️ Un silence qui ne se remarque qu'au bout de quatre ans de campagne. */
    it('signale un mois bissextile que le cycle ne fera jamais tomber', () => {
        const orphelin = cal({
            cycleBissextile: 0,
            months: [{ name: 'An', days: 30 }, { name: 'Rare', days: 1, leapYearOnly: true }],
        });

        expect(controlerLeCalendrier(orphelin)
            .find(c => c.code === 'bissextile-sans-cycle')?.gravite).toBe('doute');
    });

    it('note un cycle déclaré qui ne sert à rien', () => {
        expect(controlerLeCalendrier(cal({ cycleBissextile: 4, daysOfWeek: ['A'] }))
            .find(c => c.code === 'cycle-sans-bissextile')?.gravite).toBe('note');
    });

    /**
     * ⛔ `daysPerWeek` n'a jamais eu de lecteur, et **le seul calendrier qui
     * existe ne le porte même pas** alors que le type l'exige. On ne s'en sert
     * toujours pas ; on signale seulement quand il ment.
     */
    it('signale une semaine déclarée qui contredit les noms', () => {
        const ment = cal({ daysPerWeek: 7, daysOfWeek: ['A', 'B', 'C'] });

        expect(controlerLeCalendrier(ment).find(c => c.code === 'semaine-contredite')?.message)
            .toContain('les noms qui font foi');
    });

    it('note simplement l’absence de jours de semaine', () => {
        expect(controlerLeCalendrier(cal()).find(c => c.code === 'sans-semaine')?.gravite)
            .toBe('note');
    });

    /** Harptos, tel qu'il est livré, ne doit porter aucune faute. */
    it('ne trouve aucune FAUTE dans le calendrier d’usine', () => {
        const constats = controlerLeCalendrier(harptos());

        expect(constats.filter(c => c.gravite === 'faute')).toEqual([]);
        expect(leCalendrierEstFautif(harptos())).toBe(false);
    });
});

describe('⛔ la date de départ — six champs que personne ne lisait', () => {
    /**
     * ⛔ **Mesuré le 2026-09-15** : Harptos déclare `currentYear: 1492`, et le
     * choisir affichait **l'an 56** — la date venait de l'horloge système.
     * *Un champ renseigné que rien ne lit est un mensonge patient : il a l'air
     * d'une fonctionnalité.*
     */
    it('rend un horodatage qui retombe sur l’année déclarée', () => {
        const c = harptos({ currentYear: 1492 });
        const quand = dateDeDepart(c)!;

        expect(quand).not.toBeNull();
        // Le nombre de jours écoulés doit valoir la somme des années précédentes.
        let attendu = 0;
        for (let y = 0; y < 1492; y++) attendu += joursDeLAnnee(c, y);
        expect(quand / 1000 / 86_400).toBe(attendu);
    });

    /** ⚠️ `currentYear` seul suffit — sinon la fonction serait inutilisable. */
    it('se contente de l’année, et retombe sur le premier instant', () => {
        expect(dateDeDepart(harptos({ currentYear: 10 })))
            .toBe(dateDeDepart(harptos({
                currentYear: 10, currentMonthIndex: 0, currentDay: 1,
                currentHour: 0, currentMinute: 0, currentSecond: 0,
            })));
    });

    it('rend null quand le calendrier ne dit pas d’année', () => {
        expect(dateDeDepart(harptos())).toBeNull();
    });

    /** ⛔ On ne calcule pas une date dans un calendrier qui ne tient pas debout. */
    it('rend null sur un calendrier fautif', () => {
        expect(dateDeDepart(cal({ months: [], currentYear: 1492 }))).toBeNull();
        expect(horodatageDeLaDate(cal({ hoursPerDay: 0 }), {
            year: 1, monthIndex: 0, day: 1, hour: 0, minute: 0, second: 0,
        })).toBeNull();
    });

    it('avance du bon nombre de jours dans l’année', () => {
        const c = cal({ months: [{ name: 'A', days: 30 }, { name: 'B', days: 30 }] });
        const premier = horodatageDeLaDate(c, { year: 0, monthIndex: 0, day: 1, hour: 0, minute: 0, second: 0 })!;
        const suivant = horodatageDeLaDate(c, { year: 0, monthIndex: 1, day: 1, hour: 0, minute: 0, second: 0 })!;

        expect((suivant - premier) / 1000 / 86_400).toBe(30);
    });

    /**
     * ⚠️ Les chroniques qui datent depuis une fondation vivent en années
     * négatives. Sans ce cas, toutes les dates d'avant la fondation se
     * confondraient sur zéro.
     */
    it('descend dans les années négatives au lieu de les écraser', () => {
        const c = cal();
        const avant = horodatageDeLaDate(c, { year: -2, monthIndex: 0, day: 1, hour: 0, minute: 0, second: 0 })!;
        const zero = horodatageDeLaDate(c, { year: 0, monthIndex: 0, day: 1, hour: 0, minute: 0, second: 0 })!;

        expect(avant).toBeLessThan(zero);
        expect((zero - avant) / 1000 / 86_400).toBe(joursDeLAnnee(c, -1) + joursDeLAnnee(c, -2));
    });

    it('saute un mois bissextile dans une année qui ne l’est pas', () => {
        const c = cal({
            cycleBissextile: 4,
            months: [
                { name: 'A', days: 30 },
                { name: 'Rare', days: 1, leapYearOnly: true },
                { name: 'B', days: 30 },
            ],
        });
        const ordinaire = horodatageDeLaDate(c, { year: 1, monthIndex: 2, day: 1, hour: 0, minute: 0, second: 0 })!;
        const debut = horodatageDeLaDate(c, { year: 1, monthIndex: 0, day: 1, hour: 0, minute: 0, second: 0 })!;

        expect((ordinaire - debut) / 1000 / 86_400, 'le mois rare ne compte pas').toBe(30);
    });

    it('borne un mois hors liste au lieu de partir dans le vide', () => {
        const c = cal();
        expect(horodatageDeLaDate(c, { year: 0, monthIndex: 99, day: 1, hour: 0, minute: 0, second: 0 }))
            .toBe(horodatageDeLaDate(c, { year: 0, monthIndex: 1, day: 1, hour: 0, minute: 0, second: 0 }));
    });
});

describe('mesurerLeCalendrier — ce que l’Atelier montre en permanence', () => {
    /**
     * *La longueur de l'année est le seul nombre que l'auteur a en tête* — et
     * c'est justement celui qu'aucune saisie ne montre : il est la somme de
     * douze champs séparés.
     */
    it('dit la longueur des deux sortes d’année', () => {
        const m = mesurerLeCalendrier(harptos());

        expect(m.joursParAnneeOrdinaire).toBe(365);
        expect(m.joursParAnneeBissextile).toBe(366);
        expect(m.nombreDeMois).toBe(18);
        expect(m.moisBissextiles).toBe(1);
        expect(m.joursIntercalaires).toBe(6);
        expect(m.joursDeSemaine).toBe(10);
    });

    it('ne promet pas d’année bissextile quand il n’y en a pas', () => {
        expect(mesurerLeCalendrier(cal()).joursParAnneeBissextile).toBeNull();
    });

    it('n’en promet pas non plus quand le cycle est « jamais »', () => {
        const c = cal({
            cycleBissextile: 0,
            months: [{ name: 'A', days: 30 }, { name: 'Rare', days: 1, leapYearOnly: true }],
        });
        expect(mesurerLeCalendrier(c).joursParAnneeBissextile).toBeNull();
    });

    /** ⚠️ Sur un cycle de 1, l'année ordinaire n'existe pas : les deux se confondent. */
    it('dit la vérité quand toutes les années sont bissextiles', () => {
        const c = cal({
            cycleBissextile: 1,
            months: [{ name: 'A', days: 30 }, { name: 'Rare', days: 5, leapYearOnly: true }],
        });
        const m = mesurerLeCalendrier(c);

        expect(m.joursParAnneeOrdinaire).toBe(35);
        expect(m.joursParAnneeBissextile).toBe(35);
    });

    it('survit à un calendrier vide', () => {
        const m = mesurerLeCalendrier(cal({ months: [], daysOfWeek: undefined }));

        expect(m.joursParAnneeOrdinaire).toBe(0);
        expect(m.nombreDeMois).toBe(0);
        expect(m.joursDeSemaine).toBe(0);
    });
});
