import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* Le dépôt est en ESM (`"type": "module"`) : `__dirname` n'y existe pas. */
const ICI = path.dirname(fileURLToPath(import.meta.url));

/**
 * **Lancer GM-OS sur un profil jetable.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUE CE FICHIER PROTÈGE, ET POURQUOI IL EXISTE AVANT LES TESTS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Ce dépôt a perdu ses campagnes deux fois, et a cru les perdre une troisième le
 * 2026-09-11 au matin. **Un test de bout en bout lance la vraie application** :
 * sans précaution, il écrirait dans le vrai profil, et un test raté deviendrait
 * une perte de données.
 *
 * `--user-data-dir` règle ça entièrement. C'est un commutateur de Chromium qui
 * **impose** l'emplacement des données, et il l'emporte sur le chemin déduit de
 * `app.name`. Chaque exécution reçoit donc un dossier neuf sous le temporaire du
 * système, et le supprime en partant.
 *
 * ⭐ *Le retournement à retenir : on croit l'E2E risqué parce qu'il « lance
 * vraiment l'application ». C'est l'inverse — c'est le seul contexte où elle
 * tourne sur des données qui n'existent que le temps du test.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUI RESTE DEHORS — À LIRE AVANT D'ÉCRIRE UN TEST
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `--user-data-dir` isole **ce qui vit dans le profil** : IndexedDB, le stockage
 * local, le coffre des clés, les médias temporaires, le miroir. Le reste a été
 * cherché un par un — et tout est fermé depuis le 2026-09-11 :
 *
 * | Quoi | Où ça allait | Comment c'est fermé |
 * | --- | --- | --- |
 * | Sauvegardes automatiques | chemin absolu, hors installation | `GMOS_DOSSIER_SAUVEGARDES` |
 * | Corpus `docs/` | `APP_ROOT/docs` — le dépôt | `GMOS_RACINE_DOCS` |
 * | Coffre Obsidian | dossier du meneur | `GMOS_COFFRE_OBSIDIAN` |
 * | Pont Hue, afficheur Ulanzi | le réseau, donc le salon | `GMOS_SANS_APPAREILS` |
 *
 * ⭐ Les APIs d'IA, elles, sont protégées **par accident heureux** : le coffre du
 * profil jetable est vide, et depuis le 2026-09-11 c'est le processus principal
 * qui pose les clés — sans clé, l'appel est refusé avant de partir.
 *
 * ⚠️ **Ce qui reste à la charge du test**, et qu'aucune variable ne couvre : un
 * test qui déclencherait une vraie génération d'image, un envoi vers une tablette
 * appairée, ou l'ouverture d'un fichier par le système. *L'inventaire vaut pour
 * ce qui a été cherché ; il ne prouve pas qu'il ne reste rien.*
 *
 * ⚠️ `verifierLIsolation` n'est pas une politesse : c'est la garde. Elle
 * interroge le processus principal sur le chemin qu'il a réellement retenu, et
 * refuse de continuer s'il ne tombe pas dans le dossier jetable. *Une isolation
 * qu'on suppose n'est pas une isolation.*
 */

/** Le paquet construit, celui qu'Electron reçoit en argument. */
const POINT_DENTREE = 'dist-electron/main.js';

/**
 * **La campagne témoin, gelée.**
 *
 * Un test qui a besoin d'autre chose qu'un écran d'accueil la demande à
 * `lancerGmOs({ semence: CAMPAGNE_TEMOIN })`. Sans elle, l'instance démarre sur
 * `INITIAL_DATA` — « The Eternal Quest » — ce qui suffit à la plupart des tests
 * et ne coûte rien.
 *
 * ⛔ **Elle est gelée, pas maintenue.** Son contenu ne se régénère pas ; il est
 * gardé par `src/modules/session/data/campagneTemoinGelee.test.ts`, qui échoue
 * bruyamment le jour où le code ne sait plus la lire. *Un témoin qu'on
 * rafraîchit cesse de pouvoir contredire le code.*
 */
export const CAMPAGNE_TEMOIN = path.join(ICI, 'donnees', 'campagne-temoin.json');

export interface OptionsDeLancement {
    /**
     * Le fichier de sauvegarde dont partir, s'il y en a un.
     *
     * ⚠️ La semence n'entre que sur un état d'usine, et seulement après
     * l'hydratation — voir les trois gardes de `src/hooks/useSemence.ts`. Sur une
     * instance qui porte déjà des campagnes, elle ne fait rien **et le dit au
     * journal**.
     */
    semence?: string;
}

export interface GmOsLance {
    application: ElectronApplication;
    /** La fenêtre du meneur — la première qu'Electron ouvre. */
    fenetre: Page;
    /** Le profil jetable, pour les assertions d'isolation. */
    profil: string;
    /** Les ports attribués à ce worker — voir `portsDeCeWorker`. */
    ports: { sync: number; fiches: number };
    fermer: () => Promise<void>;
}

/**
 * Ouvre GM-OS et rend sa fenêtre principale.
 *
 * ⚠️ **Exige un `npm run build` à jour.** Sans `VITE_DEV_SERVER_URL`, `main.ts`
 * charge `dist/index.html` : c'est ce qui permet de tester sans orchestrer Vite,
 * mais un `dist/` périmé ferait passer des tests sur du code d'hier.
 */
export async function lancerGmOs(options: OptionsDeLancement = {}): Promise<GmOsLance> {
    const racine = path.resolve(ICI, '..');
    const entree = path.join(racine, POINT_DENTREE);

    if (!fs.existsSync(entree)) {
        throw new Error(
            `[E2E] ${POINT_DENTREE} est absent. Lancez \`npm run build\` avant les tests de bout en bout.`,
        );
    }

    const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-e2e-'));
    const ports = portsDeCeWorker();

    const application = await electron.launch({
        args: [
            entree,
            /* La garde : tout ce que l'application écrit tombe ici. */
            `--user-data-dir=${profil}`,
        ],
        cwd: racine,
        env: {
            ...environnementPropre(),
            ...ports.variables,
            /*
              ⛔ **Les sauvegardes automatiques ne vivent PAS sous `userData`.**

              Leur dossier est un chemin absolu — `C:\Projet_David\Security_Backup_GMOS`
              — posé là exprès pour ne jamais tomber sous l'installation. Il
              échappe donc entièrement à `--user-data-dir`, et **il tourne** :
              une sauvegarde écrite par un test évincerait les vraies.

              `GMOS_DOSSIER_SAUVEGARDES` existait déjà ; il suffisait de s'en
              servir. *Le profil jetable isole ce qui vit dans le profil — le
              reste demande à être cherché un par un.*
            */
            GMOS_DOSSIER_SAUVEGARDES: path.join(profil, 'sauvegardes'),

            /*
              Les trois échappements du périmètre — voir
              `electron/perimetreDeLInstance.ts`.

              ⚠️ Le corpus vise un dossier **vide** du profil, pas une copie du
              vrai : un test qui a besoin de règles doit les y semer lui-même.
              *Lire le vrai corpus marcherait aujourd'hui et écrirait dedans le
              jour où un test touche la Forge.*
            */
            GMOS_RACINE_DOCS: path.join(profil, 'corpus'),
            GMOS_COFFRE_OBSIDIAN: path.join(profil, 'coffre'),
            /* Et surtout : aucune lampe, aucun afficheur. */
            GMOS_SANS_APPAREILS: '1',

            /*
              La semence, seulement si le test la demande.

              ⛔ **Elle n'est jamais héritée** : `environnementPropre` efface
              toutes les `GMOS_*` du terminal. Sans ça, une variable posée dans
              le shell du meneur — pour une répétition, par exemple — entrerait
              dans les tests, et le décor dépendrait de qui lance la commande.
            */
            ...(options.semence ? { GMOS_SEMENCE: options.semence } : {}),
        },
    });

    const fenetre = await fenetreDuMeneur(application);
    await verifierLIsolation(application, profil);

    return {
        application,
        fenetre,
        profil,
        ports: { sync: ports.sync, fiches: ports.fiches },
        fermer: async () => {
            await application.close();
            /* Le dossier part avec le test. `force` : un fichier encore tenu par
               un processus qui s'éteint ne doit pas faire échouer le nettoyage. */
            fs.rmSync(profil, { recursive: true, force: true });
        },
    };
}

/**
 * Attend que la base ait fini d'être relue.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUI SE PASSE SI ON ATTEND LA MAUVAISE CHOSE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * On a d'abord attendu « le magasin porte au moins une campagne ». **C'est un
 * faux signal** : le magasin naît avec `INITIAL_DATA`, donc la condition est
 * vraie *avant* la moindre lecture d'IndexedDB. C'est la même méprise que la
 * garde de la semence a payée en août — *une base neuve n'est jamais vide.*
 *
 * Et la conséquence était muette : `gmOnlyStateStorage.setItem` refuse d'écrire
 * tant que la base n'a pas été relue, **et retourne sans rien dire**. Un test
 * qui écrivait trop tôt voyait donc son écriture disparaître, sans erreur, sans
 * trace — puis l'application persistait son propre état par-dessus. *Trois
 * hypothèses fausses avant de simplement demander à Zustand ce qu'il sait
 * déjà.*
 *
 * `persist.hasHydrated()` est ce signal, et il vient de la même mécanique que
 * le verrou d'écriture : les deux sont posés par `onRehydrateStorage`.
 */
export async function attendreLHydratation(gmos: GmOsLance): Promise<void> {
    await gmos.fenetre.waitForFunction(
        () => {
            const magasin = (window as never as {
                useSessionOSStore?: { persist?: { hasHydrated: () => boolean } };
            }).useSessionOSStore;
            return magasin?.persist?.hasHydrated() === true;
        },
        undefined,
        { timeout: 30_000 },
    );
}

/**
 * **Deux ports par worker, attribués sans course.**
 *
 * Playwright numérote ses workers dans `TEST_PARALLEL_INDEX`. On en dérive une
 * paire distincte plutôt que de chercher un port libre : *sonder un port puis le
 * reprendre laisse une fenêtre où le système peut l'attribuer à quelqu'un
 * d'autre* — j'ai écrit ce défaut le matin même dans `portOccupe.test.ts`, et il
 * a fait échouer le test pour la mauvaise raison.
 *
 * Les ports par défaut (3001/3002) sont **volontairement évités**, y compris
 * pour le worker 0 : un GM-OS ouvert sur la machine du meneur ne doit pas voir
 * ses tablettes se connecter à une instance de test.
 */
function portsDeCeWorker(): { sync: number; fiches: number; variables: Record<string, string> } {
    const index = Number(process.env.TEST_PARALLEL_INDEX ?? '0') || 0;
    const sync = 4100 + index * 10;
    const fiches = sync + 1;
    return {
        sync,
        fiches,
        variables: {
            GMOS_PORT_SYNC: String(sync),
            GMOS_PORT_FICHES: String(fiches),
        },
    };
}

/**
 * La fenêtre de l'application, et non les DevTools.
 *
 * ⛔ **`main.ts` ouvre les DevTools en fenêtre DÉTACHÉE à chaque démarrage**
 * (`openDevTools({ mode: 'detach' })`, « at User's request »). C'est donc une
 * vraie fenêtre de plus, et `firstWindow()` tombait dessus : le test cherchait
 * les onglets de l'aide dans l'inspecteur de Chromium.
 *
 * On choisit donc par l'adresse plutôt que par l'ordre d'arrivée. *L'ordre des
 * fenêtres est un détail d'implémentation ; ce qu'on veut, c'est celle qui porte
 * l'application.*
 */
async function fenetreDuMeneur(application: ElectronApplication): Promise<Page> {
    const limite = Date.now() + 30_000;

    while (Date.now() < limite) {
        for (const fenetre of application.windows()) {
            if (!fenetre.url().startsWith('devtools://')) return fenetre;
        }
        /* Une fenêtre peut encore arriver : on attend la suivante plutôt que de
           boucler à vide sur celles qu'on a déjà écartées. */
        await application.waitForEvent('window', { timeout: 2_000 }).catch(() => undefined);
    }

    throw new Error(
        "[E2E] Aucune fenêtre d'application trouvée — seules des DevTools se sont ouvertes.",
    );
}

/**
 * L'environnement du processus lancé, débarrassé de ce qui le ferait dérailler.
 *
 * ⛔ **`ELECTRON_RUN_AS_NODE` fait démarrer Electron déguisé en Node.** Il rejette
 * alors les commutateurs de Chromium — Playwright en passe deux — et meurt sur
 * « bad option: --remote-debugging-port=0 », un message qui ne dit rien de la
 * cause.
 *
 * Ce dépôt connaît déjà ce piège : lancer l'application depuis un terminal qui
 * porte cette variable exige `env -u ELECTRON_RUN_AS_NODE`. On la retire donc
 * ici plutôt que d'exiger un terminal particulier — *une précaution qui dépend
 * de qui lance la commande n'est pas une précaution.*
 *
 * ⛔ **Et toutes les `GMOS_*` héritées partent avec elle.** Le périmètre d'une
 * instance de test est déclaré ici, en entier, juste au-dessus ; une variable
 * venue du terminal s'y ajouterait sans que personne ne l'ait voulu. Le cas
 * concret : `GMOS_SEMENCE`, posée à la main pour une répétition, ferait démarrer
 * les tests sur les vraies campagnes du meneur. Elle ne détruirait rien — la
 * semence lit un fichier — mais un test vert ou rouge selon le shell ne prouve
 * plus rien. *Le même raisonnement que la ligne du dessus, appliqué à nos
 * propres variables.*
 */
function environnementPropre(): Record<string, string> {
    const propre: Record<string, string> = {};
    for (const [cle, valeur] of Object.entries(process.env)) {
        if (cle === 'ELECTRON_RUN_AS_NODE') continue;
        if (cle.startsWith('GMOS_')) continue;
        if (valeur !== undefined) propre[cle] = valeur;
    }
    /* Sans elle, `main.ts` chargerait le serveur de dev au lieu de `dist/`. */
    propre.VITE_DEV_SERVER_URL = '';
    return propre;
}

/**
 * Refuse de continuer si l'application n'écrit pas dans le profil jetable.
 *
 * Elle interroge le **processus principal** — seul endroit qui connaisse la
 * vérité — plutôt que de supposer que le commutateur a été pris en compte.
 */
async function verifierLIsolation(application: ElectronApplication, profil: string): Promise<void> {
    const retenu = await application.evaluate(({ app }) => app.getPath('userData'));

    const normaliser = (p: string) => path.resolve(p).toLowerCase();
    if (!normaliser(retenu).startsWith(normaliser(profil))) {
        await application.close();
        throw new Error(
            `[E2E] ⛔ ARRÊT : l'application écrit dans « ${retenu} » et non dans le profil jetable ` +
            `« ${profil} ». Aucun test ne doit tourner sur les données réelles.`,
        );
    }

    /* Et le dossier des sauvegardes, qui n'est pas sous `userData` — voir le
       commentaire de la variable au lancement. */
    const sauvegardes = await application.evaluate(
        () => process.env.GMOS_DOSSIER_SAUVEGARDES ?? '(non posée)',
    );
    if (!normaliser(sauvegardes).startsWith(normaliser(profil))) {
        await application.close();
        throw new Error(
            `[E2E] ⛔ ARRÊT : les sauvegardes iraient dans « ${sauvegardes} », hors du profil jetable. ` +
            `Elles tournent : un test évincerait de vraies sauvegardes.`,
        );
    }
}
