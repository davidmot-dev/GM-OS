import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Combien l'application travaille-t-elle pour un changement qui ne concerne
 * personne ?**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CETTE MESURE EXISTE POUR TRANCHER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 97 composants appellent `useSessionOSStore()` **sans sélecteur**. Zustand rend
 * alors l'état entier, et `useSyncExternalStore` compare l'identité de l'objet :
 * comme `set()` en fabrique toujours un neuf, **tous se re-rendent à chaque
 * changement, quel qu'il soit**. Déplacer un pion re-rendrait la bibliothèque
 * des campagnes.
 *
 * C'est une déduction. *Une déduction n'est pas une mesure* — et le chantier
 * qu'elle justifierait se compte en soirées, sur 97 fichiers. On mesure donc
 * avant, comme on l'a fait pour le minuteur de Clock-OS, qui s'est révélé coûter
 * 0,0004 % du fil principal et n'a pas été touché.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE STIMULUS : UN CHAMP QUE PERSONNE N'AFFICHE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⭐ On écrit `__mesureDesRendus`, une clé que **rien ne lit dans tout le
 * dépôt**. Un rendu déclenché par elle est donc, par construction, du travail
 * entièrement perdu : c'est exactement la part que des sélecteurs
 * supprimeraient, et rien d'autre.
 *
 * ⚠️ **La première rédaction écrivait `lastBackupAt`** — et `Shell` le lit,
 * pour son témoin de sauvegarde. Une partie du coût mesuré était donc
 * légitime. *Un stimulus qu'un seul composant écoute ne mesure plus du gaspillage,
 * il mesure un mélange.*
 *
 * ⚠️ **Le témoin fait la moitié du travail.** Attendre le rendu coûte du temps
 * qui n'a rien à voir avec React. On mesure donc deux fois la même boucle — une
 * qui touche le magasin, une qui n'y touche pas — et c'est **l'écart** qui est
 * lu. *Un chiffre sans témoin mesure surtout l'attente.*
 *
 * ⛔ **Et l'attente ne peut pas être `requestAnimationFrame`.** Première
 * rédaction de cette mesure : 2 000 ms des deux côtés, écart nul. 120 images à
 * 16,67 ms font exactement 2 000 ms — *la cadence d'affichage quantifiait tout,
 * et le coût des rendus tenait sous le plancher de l'instrument.* On rend donc
 * la main par une **tâche** (`setTimeout(0)`), ce qui suffit à React pour
 * committer et ramène le plancher sous la milliseconde.
 *
 * Cette spec ne casse jamais le harnais : elle **rapporte**. Son seuil d'échec
 * est volontairement très haut — elle n'est pas là pour juger, elle est là pour
 * dire un nombre qu'on puisse comparer après coup.
 */

interface Mesure {
    commits: number;
    /** Temps de rendu cumulé, mesuré par React lui-même. */
    msTotal: number;
    parChangement: number;
    /** Les composants qui se sont re-rendus, du plus coûteux au moins coûteux. */
    coupables: { nom: string; rendus: number; ms: number }[];
    composantsDistincts: number;
}

/** Combien de tours de boucle. Assez pour que la moyenne tienne, assez court pour un test. */
const TOURS = 120;

/**
 * Installe un faux crochet de React DevTools **avant** que React ne se charge.
 *
 * ⚠️ C'est la seule fenêtre où c'est possible : React lit
 * `__REACT_DEVTOOLS_GLOBAL_HOOK__` à son initialisation, et ne le relit jamais.
 * D'où le `addInitScript` suivi d'un rechargement — la fenêtre rendue par
 * `lancerGmOs` a déjà chargé React.
 *
 * Le crochet fonctionne en build de production : c'est ainsi que l'extension
 * DevTools s'attache à n'importe quel site.
 */
async function poserLeCompteurDeCommits(gmos: GmOsLance): Promise<void> {
    await gmos.fenetre.addInitScript(() => {
        const mesure = {
            commits: 0,
            /** Vrai seulement pendant la boucle de mesure. */
            enCours: false,
            /** Temps total de rendu, en millisecondes, cumulé sur les commits mesurés. */
            msTotal: 0,
            /** Combien de fois chaque composant s'est re-rendu. */
            rendus: {} as Record<string, number>,
            /** Et ce que chacun a coûté, en millisecondes cumulées. */
            dureeParNom: {} as Record<string, number>,
        };
        (window as unknown as { __MESURE_RENDUS__: typeof mesure }).__MESURE_RENDUS__ = mesure;

        (window as unknown as { __REACT_DEVTOOLS_GLOBAL_HOOK__: unknown }).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
            renderers: new Map(),
            supportsFiber: true,
            /* React appelle `inject` au démarrage et attend un identifiant. */
            inject: () => 1,
            onCommitFiberRoot: (_id: unknown, root: { current?: unknown }) => {
                mesure.commits++;
                if (!mesure.enCours) return;

                /*
                  ⭐ **`actualDuration` n'existe que dans la variante profiling**
                  de React : c'est le temps réellement passé à rendre cette fibre
                  lors de CE commit. Zéro pour un composant que React a sauté.
                  *C'est la seule donnée qui dise QUI coûte, et pas seulement
                  combien.*
                */
                const parcourir = (fibre: Record<string, unknown> | null): void => {
                    while (fibre) {
                        const duree = (fibre.actualDuration as number) ?? 0;
                        if (duree > 0) {
                            const type = fibre.type as { name?: string; displayName?: string } | string | null;
                            const nom = typeof type === 'string'
                                ? type
                                : (type?.displayName ?? type?.name ?? '(anonyme)');
                            /* Les fibres d'hôte (div, span…) ne nous apprennent
                               rien : ce sont les composants qu'on veut nommer. */
                            if (typeof type !== 'string') {
                                mesure.rendus[nom] = (mesure.rendus[nom] ?? 0) + 1;
                                mesure.dureeParNom[nom] = (mesure.dureeParNom[nom] ?? 0) + duree;
                            }
                        }
                        parcourir(fibre.child as Record<string, unknown> | null);
                        fibre = fibre.sibling as Record<string, unknown> | null;
                    }
                };

                const racine = (root?.current ?? null) as Record<string, unknown> | null;
                mesure.msTotal += (racine?.actualDuration as number) ?? 0;
                parcourir(racine);
            },
            onPostCommitFiberRoot: () => { /* rien */ },
            onCommitFiberUnmount: () => { /* rien */ },
            checkDCE: () => { /* rien */ },
        };
    });
    await gmos.fenetre.reload();
}

/**
 * La dernière sauvegarde automatique du meneur, si elle existe.
 *
 * ⚠️ **Elle n'est que LUE**, et l'instance qui la sert tourne sur un profil
 * jetable avec son propre corpus : c'est le même mécanisme que
 * `npm run repetition`. Rien de ce que ce test fait ne peut atteindre la vraie
 * base.
 *
 * ⛔ **Et sans elle, la mesure ne veut rien dire.** La campagne témoin porte
 * 2 entités, 1 entrée de wiki et 2 indices ; la vraie base en porte 125, 368 et
 * 52. *Le coût d'un rendu inutile est proportionnel à ce que les composants
 * montés ont à dessiner* — mesurer sur le témoin répondrait à une autre
 * question que celle qu'on pose.
 */
function derniereSauvegardeReelle(): string | null {
    /* ⚠️ Barres OBLIQUES, et pas des contre-obliques : dans une chaîne JS,
       `\P` et `\S` sont des échappements inconnus que le moteur avale
       silencieusement — le chemin devenait `C:Projet_DavidSecurity_...`, et
       le test se contentait de s'ignorer. Node accepte les obliques sous
       Windows. */
    const dossier = 'C:/Projet_David/Security_Backup_GMOS';
    try {
        const fichiers = fs.readdirSync(dossier)
            .filter(n => n.endsWith('.json'))
            .map(n => ({ n, t: fs.statSync(path.join(dossier, n)).mtimeMs }))
            .sort((a, b) => b.t - a.t);
        return fichiers.length > 0 ? path.join(dossier, fichiers[0].n) : null;
    } catch {
        return null;   // une autre machine, ou pas de sauvegarde : on s'en passe
    }
}

/** Mesure le coût des rendus pour un changement que personne n'affiche. */
async function mesurer(cible: GmOsLance, tours: number): Promise<Mesure> {
    return cible.fenetre.evaluate(async (n) => {
        const store = (window as unknown as {
            useSessionOSStore: { setState: (p: Record<string, unknown>) => void };
        }).useSessionOSStore;
        const c = (window as unknown as {
            __MESURE_RENDUS__: {
                commits: number; enCours: boolean; msTotal: number;
                rendus: Record<string, number>; dureeParNom: Record<string, number>;
            };
        }).__MESURE_RENDUS__;
        const rendreLaMain = () => new Promise(r => setTimeout(r, 0));

        /* Chauffe : le premier rendu d'un écran n'est jamais représentatif. */
        for (let i = 0; i < 10; i++) { store.setState({ __mesureDesRendus: `chauffe-${i}` }); await rendreLaMain(); }

        /*
          ⚠️ On n'a plus besoin de témoin : `actualDuration` est mesuré par React
          à l'intérieur du commit. Le temps d'attente entre deux tours n'y entre
          pas — c'est précisément ce qui noyait la première version de cette mesure.
        */
        c.msTotal = 0;
        c.rendus = {};
        c.dureeParNom = {};
        const commitsAvant = c.commits;
        c.enCours = true;

        for (let i = 0; i < n; i++) {
            store.setState({ __mesureDesRendus: `mesure-${i}` });
            await rendreLaMain();
        }

        c.enCours = false;
        const commits = c.commits - commitsAvant;
        const coupables = Object.entries(c.dureeParNom)
            .map(([nom, ms]) => ({ nom, rendus: c.rendus[nom] ?? 0, ms: Number(ms.toFixed(2)) }))
            .sort((a, b) => b.ms - a.ms);

        return {
            commits,
            msTotal: Number(c.msTotal.toFixed(1)),
            parChangement: Number((c.msTotal / n).toFixed(3)),
            coupables: coupables.slice(0, 12),
            composantsDistincts: coupables.length,
        };
    }, tours);
}

/**
 * ⛔ **Un zéro qui veut dire « je n'ai rien mesuré » ne doit pas se lire
 * « il n'y a rien à mesurer ».**
 *
 * `actualDuration` n'existe que dans la variante profiling de React. Dans le
 * build normal, chaque fibre la rend `undefined` : la mesure sortirait
 * **0 ms par changement** — un chiffre parfaitement rassurant, et parfaitement
 * faux. *C'est le motif que ce dépôt a déjà payé trois fois en deux jours sur
 * des gardes qui passaient au vert sans rien examiner.*
 *
 * On distingue les deux par les commits : React a bien committé, donc si le
 * temps est nul, c'est l'instrument qui manque, pas le coût.
 */
function exigerUnBuildDeProfilage(m: Mesure): void {
    if (m.commits > 0 && m.msTotal === 0) {
        test.skip(true, 'build sans profilage — relancez avec `GMOS_PROFILAGE=1 npm run build`');
    }
}

function dire(quoi: string, m: Mesure): void {
    const lignes = m.coupables.map(
        c => `      ${c.ms.toFixed(2).padStart(8)} ms  ${String(c.rendus).padStart(4)} rendus  ${c.nom}`,
    );
    console.log([
        '',
        `⭐ PROFILAGE — ${quoi}`,
        `   ${TOURS} changements d'un champ que PERSONNE n'affiche`,
        `   commits React          : ${m.commits}`,
        `   composants re-rendus   : ${m.composantsDistincts} (distincts)`,
        `   temps de rendu total   : ${m.msTotal} ms`,
        `   PAR CHANGEMENT         : ${m.parChangement} ms`,
        '   les plus coûteux :',
        ...lignes,
        '',
    ].join('\n'));
}

let gmos: GmOsLance;

test.beforeAll(async () => {
    gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
    await poserLeCompteurDeCommits(gmos);
    await attendreLHydratation(gmos);
});

test.afterAll(async () => {
    await gmos?.fermer();
});

test.describe('⭐ le coût d’un changement que personne n’affiche', () => {
    test('le crochet de mesure est bien en place', async () => {
        // Sans ce contrôle, un compteur à zéro se lirait comme « aucun rendu »
        // alors qu'il voudrait dire « je n'ai rien vu ».
        const commits = await gmos.fenetre.evaluate(
            () => (window as unknown as { __MESURE_RENDUS__?: { commits: number } }).__MESURE_RENDUS__?.commits ?? -1,
        );
        expect(commits, 'le crochet React n’a pas été posé avant le chargement').toBeGreaterThan(0);
    });

    test('sur la campagne témoin — le repère reproductible', async () => {
        await ouvrirLeModule(gmos, /Tableau de Bord/i);
        await gmos.fenetre.waitForTimeout(500);

        const m = await mesurer(gmos, TOURS);
        exigerUnBuildDeProfilage(m);
        dire('campagne témoin (2 entités, 1 wiki, 2 indices)', m);
        test.info().annotations.push({
            type: 'mesure-temoin',
            description: `${m.parChangement} ms par changement · ${m.commits} commits`,
        });

        /* ⭐ Un commit par changement, et c'est le fait qui compte : un champ que
           PERSONNE n'affiche déclenche quand même un rendu complet. */
        expect(m.commits, 'un changement devrait produire un commit').toBeGreaterThanOrEqual(TOURS);

        /* Plafond très haut : ce test rapporte, il ne juge pas. */
        expect(m.parChangement, 'un changement anodin coûte plus de 50 ms de rendu').toBeLessThan(50);
    });

    /**
     * ⭐ **Le chiffre qui décide, et il ne se prend que sur la vraie base.**
     *
     * Ignoré proprement si la sauvegarde n'est pas là — sur une autre machine,
     * ce test n'a rien à dire, et **il le dit** plutôt que de rougir.
     */
    test('sur la base réelle du meneur — le chiffre qui décide', async () => {
        const semence = derniereSauvegardeReelle();
        test.skip(!semence, 'aucune sauvegarde automatique sur cette machine');

        const reel = await lancerGmOs({ semence: semence! });
        try {
            await poserLeCompteurDeCommits(reel);
            await attendreLHydratation(reel);
            await ouvrirLeModule(reel, /Tableau de Bord/i);
            await reel.fenetre.waitForTimeout(500);

            const m = await mesurer(reel, TOURS);
            exigerUnBuildDeProfilage(m);
            dire('base réelle (125 entités, 368 wiki, 52 indices)', m);
            test.info().annotations.push({
                type: 'mesure-reelle',
                description: `${m.parChangement} ms par changement · ${m.commits} commits`,
            });

            expect(m.parChangement, 'un changement anodin coûte plus de 50 ms de rendu').toBeLessThan(50);
        } finally {
            await reel.fermer();
        }
    });
});
