import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Clock-OS — les jauges de tension et le minuteur.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI SE JOUE ICI, ET POURQUOI C'EST SENSIBLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une jauge de tension est **faite pour être vue des joueurs** — c'est ce qui la
 * rend angoissante. Mais toutes ne le sont pas : certaines comptent un secret du
 * meneur. Jusqu'au correctif **C1**, elles étaient publiques **tout ou rien** —
 * `isClockProjected` valait `true` au démarrage et **trois écrans** le lisaient,
 * si bien que cacher une seule jauge obligeait à cacher l'horloge entière.
 *
 * ⭐ **La décision qui en est sortie : un drapeau par jauge, et une jauge neuve
 * naît SECRÈTE.** C'est le défaut par défaut le plus prudent — *une jauge qu'on
 * croyait privée et que la table voyait ne se rattrape pas.* Ce fichier la fige.
 */

interface Jauge {
    id: string;
    name: string;
    totalSegments: number;
    filledSegments: number;
    vueParLesJoueurs: boolean;
    sens?: 'remplissage' | 'epuisement';
    pasParScene?: number;
}

async function horloge(gmos: GmOsLance) {
    return gmos.fenetre.evaluate(() => {
        const c = (window as never as {
            useClockStore: { getState: () => Record<string, unknown> };
        }).useClockStore.getState();
        return {
            jauges: c.tensions as Jauge[],
            mode: c.mode as string,
            minuteur: {
                duree: c.timerDuration as number,
                reste: c.timerRemaining as number,
                marche: c.timerIsRunning as boolean,
            },
        };
    });
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Horloge & Temps');
    await gmos.fenetre.getByPlaceholder('Nom de la jauge...').waitFor({ timeout: 20_000 });
});

test.afterAll(async () => { await gmos?.fermer(); });

test.describe('les jauges de tension', () => {
    test('se créent nommées, au nombre de segments choisi', async () => {
        await gmos.fenetre.getByPlaceholder('Nom de la jauge...').fill('Alerte de la station');
        await gmos.fenetre.getByRole('button', { name: /^\+6$/ }).first().click();

        await expect.poll(async () => (await horloge(gmos)).jauges.length, { timeout: 10_000 }).toBe(1);

        const [jauge] = (await horloge(gmos)).jauges;
        expect(jauge.name).toBe('Alerte de la station');
        expect(jauge.totalSegments, 'le nombre de segments demandé').toBe(6);
        expect(jauge.filledSegments, 'une jauge neuve part à zéro').toBe(0);

        /* Et elle est à l'écran, sous son nom : c'est ainsi qu'on la reconnaît. */
        await expect(gmos.fenetre.locator('main').last()).toContainText('Alerte de la station');
    });

    /*
      ⛔ **LA DÉCISION C1, FIGÉE ICI.** Une jauge neuve naît secrète. Si ce test
      rougit un jour, ce n'est pas lui qu'il faut corriger : c'est qu'une jauge
      vient de devenir publique par défaut, et qu'un secret du meneur s'affichera
      sur la tablette des joueurs sans que personne ne l'ait demandé.
    */
    test('⭐ naissent SECRÈTES, et le bouton propose de les montrer', async () => {
        const [jauge] = (await horloge(gmos)).jauges;
        expect(jauge.vueParLesJoueurs, 'une jauge neuve ne doit PAS être publique').toBe(false);

        await expect(
            gmos.fenetre.getByTitle('Montrer cette jauge aux joueurs, sur tous leurs écrans').first(),
        ).toBeVisible();
    });

    test('se montrent aux joueurs sur demande', async () => {
        await gmos.fenetre.getByTitle('Montrer cette jauge aux joueurs, sur tous leurs écrans').first().click();

        await expect.poll(
            async () => (await horloge(gmos)).jauges[0].vueParLesJoueurs,
            { timeout: 10_000 },
        ).toBe(true);
    });

    test('se remplissent', async () => {
        const avant = (await horloge(gmos)).jauges[0].filledSegments;

        await gmos.fenetre.getByTitle(/^Remplir la jauge/).first().click();

        await expect.poll(
            async () => (await horloge(gmos)).jauges[0].filledSegments,
            { timeout: 10_000, message: 'la jauge n’a pas bougé' },
        ).toBeGreaterThan(avant);
    });
});

/**
 * ⭐ **Une jauge qui se VIDE — le consommable.**
 *
 * *David, le 2026-09-15 :* **« j'ai des jauges qui augmentent, mais je n'ai pas
 * de jauge qui diminue pour simuler la diminution de consommable »**.
 *
 * Descendre une jauge était possible depuis toujours — shift-clic et clic droit
 * font `−1`. Ce qui manquait, c'est que **rien autour ne savait qu'elle se lit
 * à l'envers** : elle naissait vide, criait au plein, et son clic facile allait
 * dans le mauvais sens.
 *
 * ⚠️ Ce fichier fige les deux décisions qui se voient à l'écran : **elle naît
 * pleine**, et **le clic principal consomme**.
 */
test.describe('⭐ une jauge qui se vide', () => {
    test('naît PLEINE quand on choisit « s’épuise »', async () => {
        await gmos.fenetre.getByPlaceholder('Nom de la jauge...').fill('Rations');
        await gmos.fenetre.getByRole('button', { name: 'S’épuise' }).first().click();
        await gmos.fenetre.getByRole('button', { name: /^\+6$/ }).first().click();

        await expect.poll(
            async () => (await horloge(gmos)).jauges.find(j => j.name === 'Rations')?.filledSegments,
            { timeout: 10_000, message: 'des vivres qu’on vient de poser doivent être pleins' },
        ).toBe(6);

        const rations = (await horloge(gmos)).jauges.find(j => j.name === 'Rations')!;
        expect(rations.sens).toBe('epuisement');
    });

    /*
      ⛔ **Le clic facile suit le sens de la jauge** — tranché par David le
      2026-09-15. Sur un consommable, le geste de la soirée est de consommer ;
      avant, c'était le geste difficile (shift-clic). Si ce test rougit, c'est
      que le clic principal s'est remis à remplir les vivres.
    */
    test('⭐ le clic principal CONSOMME au lieu de remplir', async () => {
        const avant = (await horloge(gmos)).jauges.find(j => j.name === 'Rations')!.filledSegments;

        await gmos.fenetre.getByTitle(/^Clic : consommer un segment/).first().click();

        await expect.poll(
            async () => (await horloge(gmos)).jauges.find(j => j.name === 'Rations')?.filledSegments,
            { timeout: 10_000, message: 'le clic n’a pas consommé' },
        ).toBe(avant - 1);
    });

    /* Le compte se lit « restants » : sans ce mot, rien ne dit si 5 est une bonne nouvelle. */
    test('le compte annonce ce qui RESTE', async () => {
        await expect(gmos.fenetre.locator('main').last()).toContainText('restants');
    });

    /**
     * ⭐ **Le code couleur, demandé par David le 2026-09-15.**
     *
     * ⚠️ **Il se vérifie à l'écran et nulle part ailleurs.** Le calcul de la
     * gravité est pur et éprouvé ; ce qui peut se défaire sans bruit, c'est le
     * **câblage** entre le cran et le pigment — une ligne de rendu qui retombe sur
     * la couleur du thème ne lève rien, ne rougit aucun test unitaire, et ne se
     * voit qu'en pleine séance.
     *
     * Les seuils sont en fractions : sur 6 segments, l'orange à 3 restants et le
     * rouge à 1.
     */
    const teinteDuCompte = (compte: string) => gmos.fenetre.evaluate((attendu) => {
        const noeud = Array.from(document.querySelectorAll('svg text'))
            .find(e => (e.textContent ?? '').replace(/\s/g, '') === attendu);
        return noeud?.getAttribute('fill') ?? null;
    }, compte);

    const consommer = async (fois: number) => {
        for (let n = 0; n < fois; n++) {
            await gmos.fenetre.getByTitle(/^Clic : consommer un segment/).first().click();
        }
    };

    test('⭐ passe à l’ORANGE à mi-course', async () => {
        await consommer(2); // 5 → 3 restants sur 6

        await expect.poll(() => teinteDuCompte('3/6'), { timeout: 10_000 }).toBe('#ea580c');
    });

    test('⭐ passe au ROUGE au dernier quart, AVANT le bout', async () => {
        await consommer(2); // 3 → 1 restant

        await expect.poll(() => teinteDuCompte('1/6'), { timeout: 10_000 }).toBe('#ef4444');
    });

    /*
      ⚠️ À zéro, une jauge qui se vide n'a plus AUCUN segment allumé : la forme
      n'aurait rien à teindre, et sur la barre ou les points — qui n'ont pas de
      cercle qui s'échappe — l'épuisement serait presque muet. Le creux prend
      donc un rouge sourd : *ce n'est pas une jauge éteinte, c'est une jauge
      consommée.*
    */
    test('⭐ à zéro, le creux lui-même est teinté', async () => {
        await consommer(1); // 1 → 0

        await expect.poll(() => teinteDuCompte('0/6'), { timeout: 10_000 }).toBe('#ef4444');

        const creux = await gmos.fenetre.evaluate(() => {
            const svg = Array.from(document.querySelectorAll('svg'))
                .find(e => Array.from(e.querySelectorAll('text'))
                    .some(t => (t.textContent ?? '').replace(/\s/g, '') === '0/6'));
            return Array.from(svg?.querySelectorAll('path[stroke]') ?? [])
                .map(e => e.getAttribute('stroke'));
        });

        expect(creux, 'les segments vides doivent porter le rouge sourd')
            .toContain('#7f1d1d');
    });
});

test.describe('le minuteur', () => {
    /*
      ⚠️ Les raccourcis sont en minutes, le magasin en secondes. C'est le genre
      d'unité qui se perd en chemin sans que personne ne le voie — jusqu'à ce
      qu'un minuteur de cinq minutes sonne au bout de cinq secondes.
    */
    test('un raccourci de 5 minutes pose 300 secondes', async () => {
        await gmos.fenetre.getByRole('button', { name: /^5m$/ }).first().click();

        await expect.poll(async () => (await horloge(gmos)).minuteur.duree, { timeout: 10_000 })
            .toBe(300);
    });

    test('« Départ » le met en marche', async () => {
        await gmos.fenetre.getByRole('button', { name: /^Départ$/ }).first().click();

        await expect.poll(async () => (await horloge(gmos)).minuteur.marche, { timeout: 10_000 })
            .toBe(true);
    });
});

/**
 * ⭐ **L'Atelier des calendriers.**
 *
 * *David, le 2026-09-15 : « peut-on faire un module d'aide à la création de
 * calendrier fantastique ? »*
 *
 * **Un seul calendrier existait** — Harptos, livré d'usine — et en un mois de
 * construction David n'en avait jamais fait un second : **il n'existait aucun
 * chemin d'écriture**.
 *
 * ⛔⛔ **Et un calendrier mal formé ne rend pas une mauvaise date : il GÈLE
 * GM-OS.** L'écran rend ça atteignable au clavier, d'où la porte qui refuse
 * d'enregistrer — c'est elle que cet essai fige.
 *
 * ⚠️ **Il écrit vraiment dans `databases/calendars/`.** D'où un nom jetable sans
 * ambiguïté, supprimé par `afterAll`. *Un test qui laisse un fichier derrière lui
 * finit par être celui qui casse le suivant.*
 */
const CALENDRIER_JETABLE = 'zz-atelier-essai';

test.afterAll(async () => {
    const fs = await import('node:fs/promises');
    await fs.rm(`databases/calendars/${CALENDRIER_JETABLE}.json`, { force: true });
});

test.describe('⭐ l’atelier des calendriers', () => {
    const atelier = () => gmos.fenetre.getByRole('dialog', { name: 'Atelier des calendriers' });

    test('s’ouvre depuis le mode fantastique', async () => {
        await gmos.fenetre.getByRole('button', { name: /^Fantastique$/ }).first().click();
        await gmos.fenetre.getByLabel(/Atelier des calendriers/).first().click();

        await expect(atelier()).toBeVisible();
    });

    /**
     * ⭐ **La mesure en tête, avant les champs.** *Une table trouée se voit ; un
     * calendrier dont l'année fait 358 jours au lieu de 360 a l'air parfait.*
     * C'est le seul endroit où l'auteur voit ce qu'il est en train de faire.
     */
    test('⭐ compte les jours de l’année en direct', async () => {
        await expect(atelier(), 'un calendrier neuf part à un mois de 30 jours')
            .toContainText('30');

        await atelier().getByLabel('Jours du mois 1').fill('31');
        await atelier().getByRole('button', { name: 'Ajouter', exact: true }).click();

        /* 31 + 30 : la somme se fait toute seule, et c'est tout l'intérêt. */
        await expect(atelier()).toContainText('61');
    });

    /**
     * ⛔⛔ **LA PORTE, et c'est l'essai qui compte.** Un calendrier sans mois met
     * `getFantasyDate` en boucle infinie — mesuré : cinquante millions de tours
     * sans sortir. Si ce test rougit un jour, ce n'est pas lui qu'il faut
     * corriger : c'est qu'on peut de nouveau enregistrer un calendrier qui fige
     * l'application.
     */
    test('⛔ REFUSE d’enregistrer un calendrier sans mois', async () => {
        await atelier().getByLabel('Retirer le mois 2').click();
        await atelier().getByLabel('Retirer le mois 1').click();

        await expect(atelier(), 'le motif doit être écrit, pas seulement le bouton grisé')
            .toContainText('figerait');
        await expect(atelier().getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    });

    test('un calendrier écrit ici se retrouve dans le pupitre', async () => {
        await atelier().getByRole('button', { name: 'Ajouter', exact: true }).click();
        await atelier().getByLabel('Nom du mois 1').fill('Givre');
        await atelier().getByLabel('Jours du mois 1').fill('40');

        /*
          ⭐ **Une fête DÉCLARÉE DANS un mois** — demandé par David le 2026-09-15.
          Avant, une fête ne pouvait être qu'un mois d'un jour hors calendrier :
          « le 15 de Givre est la Longue Nuit » était inexprimable.

          ⚠️ Et c'est une **période**, pas un seul jour — son choix.
        */
        /*
          ⚠️ **`{ name }` cherche une SOUS-CHAÎNE chez Playwright.** Le bouton des
          mois s'appelle « Ajouter » et celui des fêtes « Ajouter une fête au
          mois 1 » : le premier sélecteur en a trouvé deux le jour où le second est
          apparu. D'où l'`exact: true` sur le bouton des mois. *Un sélecteur par
          nom se casse quand un autre nom COMMENCE pareil — et rien ne le dit
          avant l'exécution.*
        */
        await atelier().getByLabel('Ajouter une fête au mois 1').click();
        await atelier().getByLabel('Nom de la fête 1 du mois 1').fill('La Longue Nuit');
        await atelier().getByLabel('Premier jour de la fête 1 du mois 1').fill('15');
        await atelier().getByLabel('Durée de la fête 1 du mois 1').fill('3');

        await atelier().getByPlaceholder(/Calendrier de la Fondation/).fill(CALENDRIER_JETABLE);

        await expect(atelier().getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
        await atelier().getByRole('button', { name: 'Enregistrer' }).click();

        await atelier().getByLabel('Fermer l’Atelier').click();
        await expect(atelier()).toBeHidden();

        /* Le pont a écrit, le dossier se relit, et le pupitre l'offre. */
        await expect(
            gmos.fenetre.locator(`option[value="${CALENDRIER_JETABLE}"]`).first(),
        ).toBeAttached({ timeout: 10_000 });
    });

    /**
     * ⭐ **Le miroir de `databases/` — le filet demandé par David le 2026-09-15.**
     *
     * ⛔ **Ce dossier n'était dans AUCUNE sauvegarde**, et le trou grossissait à
     * chaque table et chaque calendrier écrits depuis les Ateliers.
     *
     * ⚠️ **Et la sauvegarde automatique ne pouvait pas le porter** : elle part
     * sur un changement d'état de session, or écrire un calendrier ne touche
     * aucun magasin. Le miroir est donc branché sur **l'écriture elle-même** —
     * c'est exactement ce que cet essai vérifie, et aucun essai unitaire ne peut
     * le faire : il faut le vrai processus principal et le vrai disque.
     */
    test('⭐ le calendrier écrit part aussitôt dans le miroir de sauvegarde', async () => {
        const fs = await import('node:fs/promises');
        const chemin = await import('node:path');

        /* Le miroir vit sous le profil jetable, dans `backups/databases/`. */
        const chercher = async (dossier: string): Promise<string | null> => {
            let entrees;
            try {
                entrees = await fs.readdir(dossier, { withFileTypes: true });
            } catch {
                return null;
            }
            for (const e of entrees) {
                const vise = chemin.join(dossier, e.name);
                if (e.isDirectory()) {
                    const trouve = await chercher(vise);
                    if (trouve) return trouve;
                } else if (e.name === `${CALENDRIER_JETABLE}.json`
                    && vise.includes(chemin.join('backups', 'databases'))) {
                    return vise;
                }
            }
            return null;
        };

        const reflet = await chercher(gmos.profil);

        expect(reflet, 'le calendrier doit être dans le miroir de sauvegarde').not.toBeNull();

        /* Et ce sont bien les octets écrits, pas un fichier vide. */
        const contenu = JSON.parse(await fs.readFile(reflet!, 'utf-8'));
        expect(contenu.months[0].name).toBe('Givre');
        expect(contenu.months[0].fetes[0].nom).toBe('La Longue Nuit');
    });

    /**
     * ⭐ **La fête se voit dans la date, et elle ne la remplace pas.**
     *
     * « 16 Givre 0 — La Longue Nuit (2/3) ». *Sans le numéro, le meneur qui
     * compte « nous partons dans trois jours » perd son repère au milieu de sa
     * propre fête.*
     *
     * ⚠️ **C'est l'aller-retour complet** : l'écran écrit la fête, le pont la
     * pose sur le disque, le pupitre relit le fichier, et le calcul de date la
     * retrouve. Aucun essai unitaire ne traverse tout ça.
     */
    test('⭐ la fête déclarée apparaît dans la date, avec son rang', async () => {
        /*
          ⚠️ **Une `<option>` dans un `<select>` fermé n'est jamais « visible ».**
          Mon premier essai l'attendait avec `waitFor()`, dont le défaut est
          l'état *visible* : il a tourné trente secondes sur un élément bel et
          bien présent. On attend donc qu'elle soit **attachée**.
        */
        await gmos.fenetre.locator(`option[value="${CALENDRIER_JETABLE}"]`).first()
            .waitFor({ state: 'attached', timeout: 10_000 });

        await gmos.fenetre.locator('select').filter({ hasText: CALENDRIER_JETABLE })
            .first().selectOption(CALENDRIER_JETABLE);

        /* Le deuxième jour de la fête : on doit lire « (2/3) ». */
        await gmos.fenetre.evaluate(() => (window as never as {
            useClockStore: { getState: () => {
                setFantasyDate: (d: Record<string, number>) => void;
            } };
        }).useClockStore.getState().setFantasyDate({ monthIndex: 0, day: 16 }));

        await expect.poll(
            async () => gmos.fenetre.evaluate(() => (window as never as {
                useClockStore: { getState: () => {
                    getFantasyDate: () => { fete?: { nom: string; rang: number; sur: number } } | null;
                } };
            }).useClockStore.getState().getFantasyDate()?.fete),
            { timeout: 10_000, message: 'la fête doit avoir survécu à l’aller-retour par le disque' },
        ).toMatchObject({ nom: 'La Longue Nuit', rang: 2, sur: 3 });

        /* Et elle se lit à l'écran, à côté de la date, pas à sa place. */
        const ligne = gmos.fenetre.locator('main').last();
        await expect(ligne).toContainText('La Longue Nuit (2/3)');
        await expect(ligne, 'le numéro du jour reste').toContainText('16');
    });

    /**
     * ⛔ **`currentYear` était écrit dans Harptos et lu par PERSONNE.** Mesuré le
     * 2026-09-15 : le choisir affichait **l'an 56**, parce que la date venait de
     * l'horloge système. *Un champ renseigné que rien ne lit est un mensonge
     * patient : il a l'air d'une fonctionnalité.*
     */
    test('⭐ choisir Harptos pose enfin son année de départ', async () => {
        await gmos.fenetre.locator('select').filter({ hasText: 'harptos' }).first()
            .selectOption('harptos');

        await expect.poll(
            async () => gmos.fenetre.evaluate(() => (window as never as {
                useClockStore: { getState: () => { getFantasyDate: () => { year: number } | null } };
            }).useClockStore.getState().getFantasyDate()?.year),
            { timeout: 10_000, message: 'la date doit venir du fichier, pas de l’horloge système' },
        ).toBe(1492);
    });
});

test.describe('les modes de temps', () => {
    test('se choisissent, et le magasin suit', async () => {
        await gmos.fenetre.getByRole('button', { name: /^Statique$/ }).first().click();
        await expect.poll(async () => (await horloge(gmos)).mode, { timeout: 10_000 }).not.toBe('realtime');

        await gmos.fenetre.getByRole('button', { name: /^Temps Réel$/ }).first().click();
        await expect.poll(async () => (await horloge(gmos)).mode, { timeout: 10_000 }).toBe('realtime');
    });
});
