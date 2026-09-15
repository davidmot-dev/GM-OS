import type { FantasyCalendar } from '../../../store/useClockStore';

/**
 * **Ce qui fait qu'un calendrier fantastique tient debout — et ce qui gèle
 * l'application quand il ne tient pas.**
 *
 * *Demandé par David le 2026-09-15 : « peut-on faire un module d'aide à la
 * création de calendrier fantastique ? ».*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔⛔ LE CONSTAT QUI DÉCIDE DE TOUT : UN CALENDRIER PEUT GELER GM-OS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `getFantasyDate` avance d'année en année par soustraction :
 *
 * ```ts
 * while (totalSeconds >= daysInYear * secondsPerDay) {
 *     totalSeconds -= daysInYear * secondsPerDay;
 *     year++;
 * }
 * ```
 *
 * Si `daysInYear * secondsPerDay` vaut **zéro** — un calendrier **sans mois**,
 * ou `hoursPerDay: 0` — la condition reste vraie, la soustraction ne retire
 * rien, et la boucle ne s'arrête jamais. **Mesuré le 2026-09-15 : cinquante
 * millions de tours, toujours dedans.** Ce n'est pas une date fausse, c'est
 * l'application figée, sans message, sans trace.
 *
 * > ⚠️ **Aujourd'hui c'est inatteignable** — rien ne permet d'écrire un
 * > calendrier. *Le jour où le meneur peut en taper un, ça devient une frappe.*
 * > C'est ce qui rend ce contrôle non négociable : il n'est pas le confort du
 * > module, **il en est la condition**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ TROIS FAMILLES DE CHAMPS ÉCRITES ET LUES PAR PERSONNE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Relevé en comptant, avant d'écrire une ligne. Le seul calendrier qui existe —
 * `harptos.json`, livré d'usine — porte :
 *
 * - `currentYear: 1492` et cinq `current*` : **aucun lecteur**. Choisir Harptos
 *   le 2026-09-15 affiche **l'an 56**, parce que la date vient de `timestamp` et
 *   jamais du fichier. *Un champ renseigné que rien ne lit est un mensonge
 *   patient.*
 * - `daysPerWeek` : **requis par le type, absent du seul fichier qui existe**, et
 *   lu par personne (`getFantasyDate` compte `daysOfWeek.length`).
 *
 * Ce module les fait vivre, parce qu'un calendrier qu'on écrit pour une campagne
 * démarrant en 1492 doit **démarrer en 1492**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LA RÈGLE BISSEXTILE ÉTAIT CODÉE EN DUR, À CINQ ENDROITS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `year % 4 === 0`, recopié dans `getFantasyDate`, `setFantasyDate` et le
 * pupitre. Harptos tombe juste **par chance** : sa Rencontre des Boucliers est
 * bien quadriennale. Aucun autre calendrier ne pouvait déclarer la sienne.
 *
 * *C'est le motif habituel : une règle recopiée dans les écrans est une règle
 * que le modèle ne peut plus changer.*
 *
 * Rien ici ne lit d'état global et rien ne lève.
 */

/* ─────────────────────────────────────────────────────────────────────────────
   LA RÈGLE BISSEXTILE
   ───────────────────────────────────────────────────────────────────────── */

/**
 * **Tous les combien une année porte-t-elle ses jours supplémentaires ?**
 *
 * `0` — ou absent — veut dire **jamais** : un calendrier sans année bissextile
 * est parfaitement légitime, et c'est même le cas le plus simple à écrire.
 *
 * ⚠️ **Absent = 4**, et non `0`, **uniquement pour les calendriers qui portent
 * un mois `leapYearOnly`** : c'était le comportement d'avant ce champ, et
 * Harptos en dépend. Un calendrier qui n'a aucun mois bissextile n'a pas de
 * cycle du tout, et la question ne se pose pas. *Une valeur par défaut doit
 * reproduire hier, pas choisir pour demain.*
 */
export const CYCLE_BISSEXTILE_HISTORIQUE = 4;

/** Ce que ce module ajoute au modèle de calendrier. */
export interface CalendrierDatable extends FantasyCalendar {
    /**
     * Tous les combien tombe une année bissextile. `0` = jamais.
     * Absent : quatre, comme avant ce champ.
     */
    cycleBissextile?: number;
    /** L'année où la chronique commence. Voir `dateDeDepart`. */
    currentYear?: number;
    currentMonthIndex?: number;
    currentDay?: number;
    currentHour?: number;
    currentMinute?: number;
    currentSecond?: number;
    /**
     * Les jours **hors calendrier** sortent-ils aussi de la semaine ?
     *
     * Absent : **oui**. ⛔ Ce défaut change ce qu'affichait hier, et c'est le
     * correctif demandé par David le 2026-09-15 — voir `intercalairesHorsSemaine`.
     */
    intercalairesHorsSemaine?: boolean;
}

/** Le cycle effectif d'un calendrier, défaut compris. */
export function cycleBissextile(cal: CalendrierDatable): number {
    const declare = cal.cycleBissextile;
    if (Number.isFinite(declare) && declare !== undefined && declare >= 0) {
        return Math.floor(declare);
    }
    return CYCLE_BISSEXTILE_HISTORIQUE;
}

/**
 * **Cette année porte-t-elle ses mois bissextiles ?**
 *
 * ⚠️ **L'unique définition**, là où il y en avait cinq écrites à la main. Un
 * cycle de zéro ne rend jamais vrai — *sans ce cas, un modulo par zéro rendrait
 * `NaN`, et `NaN === 0` est faux : le calendrier n'aurait simplement plus jamais
 * d'année bissextile, silencieusement, ce qui est la bonne réponse pour une
 * mauvaise raison.*
 */
export function estBissextile(cal: CalendrierDatable, annee: number): boolean {
    const cycle = cycleBissextile(cal);
    if (cycle <= 0) return false;
    if (!Number.isFinite(annee)) return false;
    /* Un modulo négatif rend un reste négatif en JavaScript : on le ramène dans
       le cycle, sinon l'an −4 ne serait pas bissextile alors que l'an 4 l'est. */
    return ((Math.trunc(annee) % cycle) + cycle) % cycle === 0;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LES LONGUEURS
   ───────────────────────────────────────────────────────────────────────── */

/** Les jours d'un mois, ou zéro si le mois est illisible. */
function joursDuMois(mois: { days?: number }): number {
    const j = mois?.days;
    return Number.isFinite(j) && j !== undefined && j > 0 ? Math.floor(j) : 0;
}

/**
 * **Combien de jours dans cette année-là.**
 *
 * L'unique définition, là où `useClockStore` en portait quatre copies. Les mois
 * `leapYearOnly` ne comptent que les années bissextiles ; les mois illisibles ne
 * comptent jamais.
 */
export function joursDeLAnnee(cal: CalendrierDatable, annee: number): number {
    const bissextile = estBissextile(cal, annee);
    let total = 0;
    for (const mois of cal.months ?? []) {
        if (mois.leapYearOnly && !bissextile) continue;
        total += joursDuMois(mois);
    }
    return total;
}

/** Les secondes d'un jour, selon les heures et minutes déclarées. */
export function secondesParJour(cal: CalendrierDatable): number {
    const minutes = Number.isFinite(cal.minutesPerHour) && cal.minutesPerHour > 0
        ? Math.floor(cal.minutesPerHour) : 0;
    const heures = Number.isFinite(cal.hoursPerDay) && cal.hoursPerDay > 0
        ? Math.floor(cal.hoursPerDay) : 0;
    return heures * minutes * 60;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LE CONTRÔLE
   ───────────────────────────────────────────────────────────────────────── */

export type GraviteDuConstat =
    /** Le calendrier se comportera mal — ou pas du tout. */
    | 'faute'
    /** Probablement une erreur, mais l'auteur peut l'avoir voulu. */
    | 'doute'
    /** Rien à corriger — une remarque qui aide à lire le calendrier. */
    | 'note';

export interface Constat {
    gravite: GraviteDuConstat;
    /** Stable, pour que l'écran choisisse son icône sans lire le texte. */
    code: string;
    message: string;
    /** L'index du mois concerné, quand la remarque en désigne un. */
    mois?: number;
}

/**
 * **Tout ce qu'on peut reprocher à un calendrier sans connaître son monde.**
 *
 * ⚠️ **La distinction `faute` / `doute` est la seule qui compte.** Un mois de
 * quarante jours n'est pas une erreur, c'est un choix d'auteur — un calendrier
 * dont l'année dure zéro jour, si. *Un contrôle qui crie sur ce qui est voulu
 * finit par être ignoré quand il crie sur ce qui est faux* — la leçon déjà payée
 * par le contrôle des tables, qui prenait pour des fautes les sentinelles
 * `-99`/`99` d'Alien.
 */
export function controlerLeCalendrier(cal: CalendrierDatable): Constat[] {
    const constats: Constat[] = [];
    const mois = cal.months ?? [];

    if (!cal.name?.trim()) {
        constats.push({ gravite: 'doute', code: 'sans-nom', message: 'Le calendrier n’a pas de nom.' });
    }

    /* ⛔ Les deux fautes qui GÈLENT l'application, et rien d'autre ne les
       attrape : la boucle des années ne peut pas se terminer. */
    if (mois.length === 0) {
        constats.push({
            gravite: 'faute',
            code: 'sans-mois',
            message: 'Le calendrier n’a aucun mois : l’horloge se figerait en cherchant l’année.',
        });
    }

    if (secondesParJour(cal) <= 0) {
        constats.push({
            gravite: 'faute',
            code: 'jour-vide',
            message: 'Un jour dure zéro seconde : renseignez les heures par jour et les minutes '
                + 'par heure. L’horloge se figerait en cherchant l’année.',
        });
    }

    mois.forEach((m, i) => {
        if (!m.name?.trim()) {
            constats.push({
                gravite: 'doute', code: 'mois-sans-nom', mois: i,
                message: `Le mois n° ${i + 1} n’a pas de nom.`,
            });
        }
        if (joursDuMois(m) <= 0) {
            constats.push({
                gravite: 'faute', code: 'mois-sans-jour', mois: i,
                message: `« ${m.name || `Mois n° ${i + 1}`} » ne dure aucun jour.`,
            });
        }
    });

    /* Une année de longueur nulle fige la boucle au même titre qu'un calendrier
       sans mois — et elle peut arriver avec des mois présents mais tous à zéro,
       ce que les constats ci-dessus signalent un par un sans dire la
       conséquence. */
    if (mois.length > 0 && joursDeLAnnee(cal, 0) <= 0) {
        constats.push({
            gravite: 'faute',
            code: 'annee-vide',
            message: 'L’année ne dure aucun jour : l’horloge se figerait en la cherchant.',
        });
    }

    const nomsVus = new Set<string>();
    mois.forEach((m, i) => {
        const nom = (m.name ?? '').trim().toLowerCase();
        if (!nom) return;
        if (nomsVus.has(nom)) {
            constats.push({
                gravite: 'doute', code: 'mois-en-double', mois: i,
                message: `Deux mois s’appellent « ${m.name} » : les dates deviendront ambiguës à la lecture.`,
            });
        }
        nomsVus.add(nom);
    });

    /*
      ⚠️ **Un mois bissextile sans cycle ne tombera jamais**, et c'est le genre
      de silence qui ne se remarque qu'au bout de quatre ans de campagne.
    */
    const bissextiles = mois.filter(m => m.leapYearOnly).length;
    if (bissextiles > 0 && cycleBissextile(cal) <= 0) {
        constats.push({
            gravite: 'doute',
            code: 'bissextile-sans-cycle',
            message: `${bissextiles} mois n’existe${bissextiles > 1 ? 'nt' : ''} que les années `
                + 'bissextiles, mais le cycle est réglé sur « jamais » : il ne tombera jamais.',
        });
    }

    if (bissextiles === 0 && (cal.cycleBissextile ?? 0) > 0) {
        constats.push({
            gravite: 'note',
            code: 'cycle-sans-bissextile',
            message: 'Un cycle bissextile est déclaré, mais aucun mois ne lui est rattaché : '
                + 'il ne change rien.',
        });
    }

    /*
      **Les fêtes.** Aucune n'est une faute : une fête mal placée ne casse rien,
      *elle ne tombe simplement jamais* — et c'est exactement le genre de silence
      qu'on ne remarque qu'à la séance où on l'attendait.
    */
    mois.forEach((m, i) => {
        const jours = joursDuMois(m);
        const declarees = m.fetes ?? [];

        declarees.forEach((f) => {
            if (!f || String(f.nom ?? '').trim() === '') {
                constats.push({
                    gravite: 'doute', code: 'fete-sans-nom', mois: i,
                    message: `Une fête de « ${m.name || `Mois n° ${i + 1}`} » n'a pas de nom : `
                        + 'elle ne sera pas annoncée.',
                });
                return;
            }

            const debut = departDeLaFete(f);
            if (jours > 0 && debut > jours) {
                constats.push({
                    gravite: 'doute', code: 'fete-hors-du-mois', mois: i,
                    message: `« ${f.nom.trim()} » commence le ${debut}, mais `
                        + `« ${m.name || `le mois n° ${i + 1}`} » n'a que ${jours} jours : `
                        + 'elle ne tombera jamais.',
                });
                return;
            }
            if (jours > 0 && finDeLaFete(f) > jours) {
                constats.push({
                    gravite: 'doute', code: 'fete-depasse-le-mois', mois: i,
                    message: `« ${f.nom.trim()} » déborde de « ${m.name || `le mois n° ${i + 1}`} » : `
                        + `elle finirait le ${finDeLaFete(f)} d'un mois de ${jours} jours.`,
                });
            }
        });

        /*
          Deux fêtes qui se chevauchent : un **doute**, pas une faute — un monde
          peut vouloir superposer une veillée et un solstice. Mais l'écran n'en
          montrera qu'une, et il vaut mieux le savoir en l'écrivant qu'à la
          séance.
        */
        const rangees = fetesDuMois(m);
        for (let n = 1; n < rangees.length; n++) {
            if (departDeLaFete(rangees[n]) <= finDeLaFete(rangees[n - 1])) {
                constats.push({
                    gravite: 'doute', code: 'fetes-qui-se-chevauchent', mois: i,
                    message: `« ${rangees[n - 1].nom.trim()} » et « ${rangees[n].nom.trim()} » `
                        + 'se chevauchent : seule la première sera annoncée.',
                });
            }
        }

        /*
          ⚠️ Une fête dans un mois **hors calendrier** : le mois entier est déjà
          une fête, et ses jours n'ont pas de numéro. La déclaration se perdrait.
        */
        if (m.isIntercalary && rangees.length > 0) {
            constats.push({
                gravite: 'doute', code: 'fete-dans-un-intercalaire', mois: i,
                message: `« ${m.name || `Le mois n° ${i + 1}`} » est déjà un jour hors `
                    + 'calendrier : une fête déclarée dedans fait double emploi.',
            });
        }
    });

    const semaine = cal.daysOfWeek?.length ?? 0;
    if (semaine === 0) {
        constats.push({
            gravite: 'note',
            code: 'sans-semaine',
            message: 'Aucun jour de semaine n’est nommé : les dates n’en porteront pas.',
        });
    }

    /*
      ⛔ **`daysPerWeek` n'a jamais été lu par personne** — et le seul calendrier
      qui existe ne le porte même pas, alors que le type l'exige. On ne s'en sert
      toujours pas : c'est `daysOfWeek` qui fait foi. Mais on le signale quand il
      ment, plutôt que de le supprimer en silence d'un fichier que le meneur a pu
      écrire à la main.
    */
    if (semaine > 0 && Number.isFinite(cal.daysPerWeek) && cal.daysPerWeek > 0
        && cal.daysPerWeek !== semaine) {
        constats.push({
            gravite: 'doute',
            code: 'semaine-contredite',
            message: `La semaine est déclarée à ${cal.daysPerWeek} jours, mais ${semaine} sont `
                + 'nommés. Ce sont les noms qui font foi.',
        });
    }

    return constats;
}

/**
 * **Ce calendrier peut-il être posé sur l'horloge ?**
 *
 * ⛔ **La porte, et elle se referme des deux côtés** : l'Atelier refuse
 * d'enregistrer, et le magasin refuse de calculer. *Une garde qui ne tient que
 * dans l'écran laisse entrer tout ce qui vient d'un fichier écrit à la main —
 * et c'est précisément ainsi que les calendriers arrivent aujourd'hui.*
 */
export function leCalendrierEstFautif(cal: CalendrierDatable): boolean {
    return controlerLeCalendrier(cal).some(c => c.gravite === 'faute');
}

/* ─────────────────────────────────────────────────────────────────────────────
   LA DATE DE DÉPART
   ───────────────────────────────────────────────────────────────────────── */

export interface DateDuCalendrier {
    year: number;
    monthIndex: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
}

/**
 * **L'horodatage que vaut une date dans ce calendrier.**
 *
 * L'inverse de `getFantasyDate`, et la même arithmétique — mais **en un seul
 * exemplaire**, pour que la date de départ et la saisie manuelle ne puissent pas
 * diverger.
 *
 * Rend `null` sur un calendrier fautif : *on ne calcule pas une date dans un
 * calendrier dont on sait qu'il ne tient pas debout.*
 */
export function horodatageDeLaDate(
    cal: CalendrierDatable,
    date: DateDuCalendrier,
): number | null {
    if (leCalendrierEstFautif(cal)) return null;

    const parJour = secondesParJour(cal);
    const parMinute = Math.floor(cal.minutesPerHour);
    const parHeure = parMinute * 60;

    const annee = Math.trunc(date.year);
    let secondes = 0;

    /*
      ⚠️ **Les années négatives se comptent dans l'autre sens.** Un calendrier
      peut commencer « avant » son année zéro — les chroniques qui datent depuis
      une fondation le font toutes. Sans ce cas, une année négative rendrait zéro
      et toutes les dates d'avant la fondation se confondraient.
    */
    if (annee >= 0) {
        for (let y = 0; y < annee; y++) secondes += joursDeLAnnee(cal, y) * parJour;
    } else {
        for (let y = -1; y >= annee; y--) secondes -= joursDeLAnnee(cal, y) * parJour;
    }

    const bissextile = estBissextile(cal, annee);
    const mois = cal.months ?? [];
    const cible = Math.min(Math.max(0, Math.trunc(date.monthIndex)), mois.length - 1);

    for (let i = 0; i < cible; i++) {
        if (mois[i].leapYearOnly && !bissextile) continue;
        secondes += joursDuMois(mois[i]) * parJour;
    }

    secondes += (Math.max(1, Math.trunc(date.day)) - 1) * parJour;
    secondes += Math.max(0, Math.trunc(date.hour)) * parHeure;
    secondes += Math.max(0, Math.trunc(date.minute)) * parMinute;
    secondes += Math.max(0, Math.trunc(date.second));

    const enMillisecondes = secondes * 1000;
    return Number.isFinite(enMillisecondes) ? enMillisecondes : null;
}

/**
 * **L'horodatage où ce calendrier veut qu'on commence** — ou `null` s'il ne le
 * dit pas.
 *
 * ⛔ **Les six champs `current*` existaient depuis toujours et personne ne les
 * lisait.** Harptos déclare `currentYear: 1492` ; le choisir le 2026-09-15
 * affichait **l'an 56**, parce que la date venait de l'horloge système. *Un
 * champ renseigné que rien ne lit est un mensonge patient : il a l'air d'une
 * fonctionnalité.*
 *
 * ⚠️ **`currentYear` seul suffit** — les cinq autres sont facultatifs et
 * retombent sur le premier instant de l'année. Exiger les six aurait rendu la
 * fonction inutilisable depuis l'Atelier, où l'on veut dire « ma chronique
 * commence en 1492 » sans choisir l'heure.
 */
export function dateDeDepart(cal: CalendrierDatable): number | null {
    if (!Number.isFinite(cal.currentYear)) return null;

    return horodatageDeLaDate(cal, {
        year: cal.currentYear as number,
        monthIndex: Number.isFinite(cal.currentMonthIndex) ? cal.currentMonthIndex as number : 0,
        day: Number.isFinite(cal.currentDay) ? cal.currentDay as number : 1,
        hour: Number.isFinite(cal.currentHour) ? cal.currentHour as number : 0,
        minute: Number.isFinite(cal.currentMinute) ? cal.currentMinute as number : 0,
        second: Number.isFinite(cal.currentSecond) ? cal.currentSecond as number : 0,
    });
}

/* ─────────────────────────────────────────────────────────────────────────────
   CE QUE L'ATELIER MONTRE
   ───────────────────────────────────────────────────────────────────────── */

export interface MesureDuCalendrier {
    /** Les jours d'une année ordinaire. **Le seul nombre qui compte vraiment.** */
    joursParAnneeOrdinaire: number;
    /** Les jours d'une année bissextile, ou `null` s'il n'y en a pas. */
    joursParAnneeBissextile: number | null;
    nombreDeMois: number;
    /** Les mois qui ne tombent que les années bissextiles. */
    moisBissextiles: number;
    /** Les jours hors calendrier — fêtes, solstices. */
    joursIntercalaires: number;
    joursDeSemaine: number;
    heuresParJour: number;
    /** Les jours couverts par une fête déclarée, dans une année ordinaire. */
    joursDeFete: number;
}

/**
 * **Ce que l'Atelier affiche en permanence pendant qu'on compose.**
 *
 * *La longueur de l'année est le seul nombre que l'auteur a vraiment en tête* —
 * « je veux une année de 360 jours » — et c'est justement celui qu'aucune
 * saisie ne montre : il est la somme de douze champs séparés. Le calculer en
 * direct est tout l'intérêt de l'écran, comme la bande de couverture l'était
 * pour les tables.
 */
export function mesurerLeCalendrier(cal: CalendrierDatable): MesureDuCalendrier {
    const mois = cal.months ?? [];
    const aDesBissextiles = mois.some(m => m.leapYearOnly);
    const cycle = cycleBissextile(cal);

    /*
      **Une année ordinaire est la première qui ne soit pas bissextile.**
      L'an zéro l'est toujours dès qu'un cycle existe (`0 % n === 0`), donc on
      prend l'an 1 — sauf sur un cycle de **1**, où toutes les années sont
      bissextiles et où l'ordinaire n'existe pas : les deux longueurs se
      confondent alors, ce qui est la vérité et non un repli.
    */
    const anneeOrdinaire = (cycle > 1) ? 1 : 0;

    return {
        joursParAnneeOrdinaire: joursDeLAnnee(cal, anneeOrdinaire),
        joursParAnneeBissextile: (aDesBissextiles && cycle > 0)
            ? joursDeLAnnee(cal, 0)
            : null,
        nombreDeMois: mois.length,
        moisBissextiles: mois.filter(m => m.leapYearOnly).length,
        joursIntercalaires: mois.filter(m => m.isIntercalary).reduce((t, m) => t + joursDuMois(m), 0),
        joursDeSemaine: cal.daysOfWeek?.length ?? 0,
        heuresParJour: Number.isFinite(cal.hoursPerDay) ? cal.hoursPerDay : 0,
        /* Borné à la longueur du mois : une fête qui déborde ne compte que les
           jours qui existent vraiment, sinon la mesure gonflerait pour un
           défaut que le contrôle signale par ailleurs. */
        joursDeFete: mois.reduce((total, m) => {
            const jours = joursDuMois(m);
            return total + fetesDuMois(m).reduce((n, f) => {
                const debut = departDeLaFete(f);
                if (jours > 0 && debut > jours) return n;
                return n + (Math.min(finDeLaFete(f), jours || finDeLaFete(f)) - debut + 1);
            }, 0);
        }, 0),
    };
}

/**
 * **Le nom de fichier tiré du nom lisible.**
 *
 * « Calendrier d'Harptos » → `calendrier-d-harptos`. Les accents tombent, la
 * ponctuation aussi, et tout ce qui reste est en minuscules séparées de tirets.
 *
 * ⚠️ **Il n'y a qu'UN producteur d'identifiant, et c'est celui-ci.** Le processus
 * principal ne le recalcule pas : il **valide** le chemin qu'on lui donne
 * (`cheminDesCalendriers.ts`), ce que lui seul peut faire. *Deux règles de
 * nommage écrites des deux côtés d'un pont finiraient par ne plus tomber sur le
 * même fichier — et l'Atelier afficherait un nom de fichier que personne
 * n'écrirait.*
 *
 * ⚠️ **Pourquoi pas le nom tel quel** : l'identifiant EST le nom de fichier, et
 * c'est aussi ce que `clock:list-calendars` rend au pupitre. Un nom qui porte une
 * apostrophe ou un accent traverse trois couches dont aucune ne le rend à
 * l'identique partout. *Le nom lisible vit dans le fichier, sous `name` ; le nom
 * de fichier n'a qu'à être stable.*
 *
 * Rend `''` s'il ne reste rien d'utilisable — à l'appelant de refuser.
 */
export function identifiantDuCalendrier(nom: string): string {
    return (nom ?? '')
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

/* ─────────────────────────────────────────────────────────────────────────────
   LES FÊTES
   ───────────────────────────────────────────────────────────────────────── */

/**
 * **Une fête telle qu'elle est déclarée, dans le mois qui la porte.**
 *
 * *Demandé par David le 2026-09-15 : « je veux pouvoir déclarer des jours de
 * fêtes ».*
 *
 * ⚠️ **Ce que « fête » voulait dire avant.** Une fête était un **mois d'un
 * jour** marqué `isIntercalary` — c'est ainsi qu'Harptos porte ses six — et ce
 * drapeau ne faisait **qu'une chose** : retirer le numéro du jour dans la date
 * affichée. On ne pouvait donc pas dire « le 15 de Hammer est la Fête du
 * Marteau » : il aurait fallu couper Hammer en trois mois.
 *
 * ⭐ **Les deux formes coexistent, et c'est voulu** : un mois intercalaire est un
 * jour **hors calendrier** — il ne porte pas de numéro et sort de la semaine ;
 * une fête déclarée ici est **un jour du mois qui porte un nom**, avec son
 * numéro et son jour de semaine. *Ce ne sont pas deux façons d'écrire la même
 * chose, ce sont deux choses.*
 */
export interface FeteDeclaree {
    nom: string;
    /** Premier jour, 1-based, dans le mois qui la porte. */
    jour: number;
    /** Durée en jours. Absente ou inférieure à 1 : un jour. */
    duree?: number;
    description?: string;
}

/** Un mois, tel que ce module a besoin de le lire. */
type MoisLu = CalendrierDatable['months'][number];

/** La durée effective d'une fête, jamais nulle ni négative. */
export function dureeDeLaFete(fete: { duree?: number }): number {
    const d = fete?.duree;
    return Number.isFinite(d) && d !== undefined && d >= 1 ? Math.floor(d) : 1;
}

/** Le premier jour d'une fête, jamais avant le premier du mois. */
export function departDeLaFete(fete: { jour: number }): number {
    const j = fete?.jour;
    return Number.isFinite(j) && j >= 1 ? Math.floor(j) : 1;
}

/** Le dernier jour d'une fête, bornes comprises. */
export function finDeLaFete(fete: FeteDeclaree): number {
    return departDeLaFete(fete) + dureeDeLaFete(fete) - 1;
}

/**
 * **Ce qui se passe ce jour-là, et où on en est dedans.**
 *
 * `rang` et `sur` servent l'affichage d'une fête de plusieurs jours :
 * *« 13 Hammer — Nuits du Marteau (2/4) »*. **La date ordinaire est conservée**,
 * et c'est délibéré — une fête ne remplace pas le jour, elle le qualifie.
 * *Sans le numéro, le meneur qui compte « nous partons dans trois jours » perd
 * son repère au milieu de sa propre fête.*
 */
export interface FeteDuJour {
    nom: string;
    description?: string;
    /** Le quantième jour de la fête, 1-based. */
    rang: number;
    /** Sa durée totale. `1` pour une fête d'un seul jour. */
    sur: number;
}

/**
 * Les fêtes d'un mois, dans l'ordre où elles tombent.
 *
 * ⚠️ **Une fête sans nom lisible est écartée.** Elle n'aurait rien à annoncer, et
 * une fête muette au milieu d'une date est plus déroutante qu'une absence.
 */
export function fetesDuMois(mois: MoisLu | undefined): FeteDeclaree[] {
    return [...(mois?.fetes ?? [])]
        .filter(f => !!f && String(f.nom ?? '').trim() !== '')
        .sort((a, b) => departDeLaFete(a) - departDeLaFete(b));
}

/**
 * **La fête qui tombe ce jour-là, s'il y en a une.**
 *
 * ⚠️ **La première qui couvre le jour l'emporte**, dans l'ordre des dates. Deux
 * fêtes qui se chevauchent sont signalées par le contrôle comme un **doute** —
 * un monde peut vouloir superposer une veillée et un solstice —, mais l'écran
 * doit bien en afficher une, et *la plus ancienne est la moins surprenante.*
 */
export function feteDuJour(
    cal: CalendrierDatable,
    monthIndex: number,
    day: number,
): FeteDuJour | null {
    const mois = (cal.months ?? [])[monthIndex];
    if (!mois || !Number.isFinite(day)) return null;

    const jour = Math.floor(day);
    for (const fete of fetesDuMois(mois)) {
        const debut = departDeLaFete(fete);
        if (jour < debut || jour > finDeLaFete(fete)) continue;

        return {
            nom: fete.nom.trim(),
            ...(fete.description?.trim() ? { description: fete.description.trim() } : {}),
            rang: jour - debut + 1,
            sur: dureeDeLaFete(fete),
        };
    }
    return null;
}

/**
 * **Comment une date se lit quand une fête tombe dessus.**
 *
 * *« Nuits du Marteau (2/4) »*, et *« Fête du Marteau »* pour une fête d'un
 * jour : **le rang ne s'affiche que s'il y a plusieurs jours**, sans quoi tout
 * serait suivi d'un « (1/1) » qui n'apprend rien.
 *
 * Rend `null` quand rien ne tombe ce jour-là — l'appelant garde alors sa date
 * telle quelle.
 */
export function mentionDeLaFete(fete: FeteDuJour | null): string | null {
    if (!fete) return null;
    return fete.sur > 1 ? `${fete.nom} (${fete.rang}/${fete.sur})` : fete.nom;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LA SEMAINE
   ───────────────────────────────────────────────────────────────────────── */

/**
 * ⚠️ **Les jours hors calendrier comptent-ils dans la semaine ?**
 *
 * *Tranché par David le 2026-09-15 : non, et c'est réglable par calendrier.*
 * À Harptos, les six fêtes intercalaires sont **hors semaine** ; d'autres mondes
 * les comptent. Le calendrier le déclare, comme son cycle bissextile.
 *
 * ⛔ **Le défaut change ce qu'affichait hier, et c'est le correctif demandé.**
 * Le calcul comptait *tous* les jours écoulés modulo la longueur de la semaine :
 * les six fêtes d'Harptos décalaient donc la semaine de six jours par an. **Le
 * jour de semaine affiché pour une date donnée change** — il était faux.
 */
export function intercalairesHorsSemaine(cal: CalendrierDatable): boolean {
    return cal.intercalairesHorsSemaine ?? true;
}

/** Ce mois compte-t-il dans le fil de la semaine ? */
function moisComptableDansLaSemaine(cal: CalendrierDatable, mois: MoisLu): boolean {
    return !(mois.isIntercalary && intercalairesHorsSemaine(cal));
}

/** Les jours d'une année qui font avancer la semaine. */
function joursDeSemaineDeLAnnee(cal: CalendrierDatable, annee: number): number {
    const bissextile = estBissextile(cal, annee);
    let total = 0;
    for (const mois of cal.months ?? []) {
        if (mois.leapYearOnly && !bissextile) continue;
        if (!moisComptableDansLaSemaine(cal, mois)) continue;
        total += joursDuMois(mois);
    }
    return total;
}

/**
 * **Le rang de ce jour dans la semaine**, ou `null` s'il n'en a pas.
 *
 * ⚠️ **`null` n'est pas une erreur, c'est une réponse.** Un jour hors calendrier
 * n'appartient à aucune semaine : *demander quel jour de la semaine tombe le
 * Milieu d'Hiver n'a pas plus de sens que de demander sa position dans un mois.*
 * L'écran omet alors la mention, au lieu d'en inventer une — ce qu'il faisait.
 *
 * Rend `null` aussi quand le calendrier ne nomme aucun jour de semaine, ou qu'il
 * ne tient pas debout (on ne compte pas les années d'un calendrier qui gèle).
 */
export function rangDansLaSemaine(
    cal: CalendrierDatable,
    date: { year: number; monthIndex: number; day: number },
): number | null {
    const semaine = cal.daysOfWeek?.length ?? 0;
    if (semaine <= 0) return null;
    if (leCalendrierEstFautif(cal)) return null;
    if (!Number.isFinite(date.year) || !Number.isFinite(date.monthIndex)) return null;

    const mois = cal.months ?? [];
    const courant = mois[date.monthIndex];
    if (!courant) return null;
    /* Le jour lui-même est hors semaine : il n'a pas de rang. */
    if (!moisComptableDansLaSemaine(cal, courant)) return null;

    const annee = Math.trunc(date.year);
    let jours = 0;

    if (annee >= 0) {
        for (let y = 0; y < annee; y++) jours += joursDeSemaineDeLAnnee(cal, y);
    } else {
        for (let y = -1; y >= annee; y--) jours -= joursDeSemaineDeLAnnee(cal, y);
    }

    const bissextile = estBissextile(cal, annee);
    for (let i = 0; i < date.monthIndex; i++) {
        const m = mois[i];
        if (m.leapYearOnly && !bissextile) continue;
        if (!moisComptableDansLaSemaine(cal, m)) continue;
        jours += joursDuMois(m);
    }

    jours += Math.max(1, Math.trunc(date.day)) - 1;

    /* Un reste négatif en JavaScript : on le ramène dans la semaine, sinon les
       dates d'avant l'an zéro tomberaient hors du tableau des noms. */
    return ((jours % semaine) + semaine) % semaine;
}

/** Le nom du jour de la semaine, ou `undefined` s'il n'y en a pas. */
export function jourDeLaSemaine(
    cal: CalendrierDatable,
    date: { year: number; monthIndex: number; day: number },
): string | undefined {
    const rang = rangDansLaSemaine(cal, date);
    return rang === null ? undefined : cal.daysOfWeek?.[rang];
}
