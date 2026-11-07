// c8d22f6b1b18f0bb1fe9a7880ab7c7cb3159bcce
import { _electron as electron } from '@playwright/test';
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
/**
 * Ouvre GM-OS et rend sa fenêtre principale.
 *
 * ⚠️ **Exige un `npm run build` à jour.** Sans `VITE_DEV_SERVER_URL`, `main.ts`
 * charge `dist/index.html` : c'est ce qui permet de tester sans orchestrer Vite,
 * mais un `dist/` périmé ferait passer des tests sur du code d'hier.
 */
export async function lancerGmOs(options = {}) {
  var _options$preparerLePr, _processus$stdout, _processus$stderr;
  const racine = path.resolve(ICI, '..');
  const entree = path.join(racine, POINT_DENTREE);
  if (!fs.existsSync(entree)) {
    throw new Error(`[E2E] ${POINT_DENTREE} est absent. Lancez \`npm run build\` avant les tests de bout en bout.`);
  }
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-e2e-'));
  // USERPROFILE est isolé aussi : Electron exige que ses deux AppData existent.
  const roaming = path.join(profil, 'AppData', 'Roaming');
  const local = path.join(profil, 'AppData', 'Local');
  fs.mkdirSync(roaming, {
    recursive: true
  });
  fs.mkdirSync(local, {
    recursive: true
  });
  (_options$preparerLePr = options.preparerLeProfil) === null || _options$preparerLePr === void 0 || _options$preparerLePr.call(options, profil);
  const ports = portsDeCeWorker();
  const application = await electron.launch({
    args: [entree, /* La garde : tout ce que l'application écrit tombe ici. */
    `--user-data-dir=${profil}`],
    cwd: racine,
    env: {
      ...environnementPropre(),
      ...ports.variables,
      // Le pont MCP écrit son journal sous USERPROFILE, hors userData.
      // Cette variable appartient seulement au processus Electron jetable.
      USERPROFILE: profil,
      APPDATA: roaming,
      LOCALAPPDATA: local,
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
      ...(options.semence ? {
        GMOS_SEMENCE: options.semence
      } : {})
    }
  });
  const sorties = [];
  const relever = chunk => {
    sorties.push(chunk.toString());
  };
  const processus = application.process();
  (_processus$stdout = processus.stdout) === null || _processus$stdout === void 0 || _processus$stdout.on('data', relever);
  (_processus$stderr = processus.stderr) === null || _processus$stderr === void 0 || _processus$stderr.on('data', relever);
  let fenetre;
  try {
    fenetre = await fenetreDuMeneur(application);
  } catch (erreur) {
    // Un lancement raté doit laisser un diagnostic et fermer son instance jetable.
    const etat = await application.evaluate(({
      app,
      BrowserWindow
    }) => ({
      pret: app.isReady(),
      fenetres: BrowserWindow.getAllWindows().map(w => w.webContents.getURL())
    })).catch(() => null);
    console.error('[E2E] Démarrage impossible', {
      profil,
      etat,
      sorties: sorties.join('').slice(-12000)
    });
    await application.close().catch(() => {});
    throw erreur;
  } finally {
    var _processus$stdout2, _processus$stderr2;
    (_processus$stdout2 = processus.stdout) === null || _processus$stdout2 === void 0 || _processus$stdout2.off('data', relever);
    (_processus$stderr2 = processus.stderr) === null || _processus$stderr2 === void 0 || _processus$stderr2.off('data', relever);
  }
  await verifierLIsolation(application, profil);
  return {
    application,
    fenetre,
    profil,
    ports: {
      sync: ports.sync,
      fiches: ports.fiches
    },
    fermer: async () => {
      await application.close();
      /* Le dossier part avec le test. `force` : un fichier encore tenu par
         un processus qui s'éteint ne doit pas faire échouer le nettoyage. */
      fs.rmSync(profil, {
        recursive: true,
        force: true
      });
    }
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
export async function attendreLHydratation(gmos) {
  await gmos.fenetre.waitForFunction(() => {
    var _magasin$persist;
    const magasin = window.useSessionOSStore;
    return (magasin === null || magasin === void 0 || (_magasin$persist = magasin.persist) === null || _magasin$persist === void 0 ? void 0 : _magasin$persist.hasHydrated()) === true;
  }, undefined, {
    timeout: 30000
  });
}

/**
 * Ouvre un module par son bouton de la barre latérale.
 *
 * ⚠️ **Par le bouton, et non en posant `activeModule` dans un magasin.** Poser
 * l'état sauterait précisément ce qu'on veut éprouver : que le bouton existe,
 * qu'il porte le bon libellé, et qu'il atteigne le module. *Un raccourci de test
 * qui court-circuite le geste ne teste plus le geste.*
 */
export async function ouvrirLeModule(gmos, nom) {
  const motif = typeof nom === 'string' ? new RegExp(`^${nom}$`) : nom;
  await gmos.fenetre.getByRole('button', {
    name: motif
  }).first().click();
}

/**
 * Ouvre un onglet de la fiche de personnage — chez le meneur (« Formulaire »,
 * « Lancer un test », « Fiche du jeu ») ou sur la tablette (« Vue
 * synthétique », « Lancer un test », « Ma fiche »).
 *
 * Le test vit dans son onglet depuis le 2026-10-22 : masqué, son panneau ne se
 * clique plus. Comme pour les modules, on passe par l'onglet, pas par l'état.
 */
export async function ongletDeLaFiche(page, nom) {
  await page.getByRole('tab', {
    name: nom,
    exact: true
  }).click();
}

/**
 * La carte repliable qui range un panneau dans l'onglet du test. On la
 * photographie plutôt que le panneau : c'est elle qui porte le titre.
 */
export function carteDe(panneau) {
  return panneau.locator('xpath=ancestor::details[@data-carte-du-jeu][1]');
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
function portsDeCeWorker() {
  var _process$env$TEST_PAR;
  const index = Number((_process$env$TEST_PAR = process.env.TEST_PARALLEL_INDEX) !== null && _process$env$TEST_PAR !== void 0 ? _process$env$TEST_PAR : '0') || 0;
  const sync = 4100 + index * 10;
  const fiches = sync + 1;
  return {
    sync,
    fiches,
    variables: {
      GMOS_PORT_SYNC: String(sync),
      GMOS_PORT_FICHES: String(fiches)
    }
  };
}

/**
 * La fenêtre de l'application, et non les DevTools.
 *
 * ⛔ **`main.ts` a longtemps ouvert les DevTools en fenêtre DÉTACHÉE à chaque
 * démarrage** (`openDevTools({ mode: 'detach' })`, retiré le 2026-09-30 à la
 * demande de David). C'était une vraie fenêtre de plus, et `firstWindow()`
 * tombait dessus : le test cherchait les onglets de l'aide dans l'inspecteur
 * de Chromium. La garde reste : des DevTools ouverts à la main font pareil.
 *
 * On choisit donc par l'adresse plutôt que par l'ordre d'arrivée. *L'ordre des
 * fenêtres est un détail d'implémentation ; ce qu'on veut, c'est celle qui porte
 * l'application.*
 */
async function fenetreDuMeneur(application) {
  const limite = Date.now() + 30000;
  while (Date.now() < limite) {
    for (const fenetre of application.windows()) {
      if (!fenetre.url().startsWith('devtools://')) return fenetre;
    }
    /* Une fenêtre peut encore arriver : on attend la suivante plutôt que de
       boucler à vide sur celles qu'on a déjà écartées. */
    await application.waitForEvent('window', {
      timeout: 2000
    }).catch(() => undefined);
  }
  throw new Error("[E2E] Aucune fenêtre d'application trouvée — seules des DevTools se sont ouvertes.");
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
function environnementPropre() {
  const propre = {};
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
async function verifierLIsolation(application, profil) {
  const retenu = await application.evaluate(({
    app
  }) => app.getPath('userData'));
  const normaliser = p => path.resolve(p).toLowerCase();
  if (!normaliser(retenu).startsWith(normaliser(profil))) {
    await application.close();
    throw new Error(`[E2E] ⛔ ARRÊT : l'application écrit dans « ${retenu} » et non dans le profil jetable ` + `« ${profil} ». Aucun test ne doit tourner sur les données réelles.`);
  }

  /* Et le dossier des sauvegardes, qui n'est pas sous `userData` — voir le
     commentaire de la variable au lancement. */
  const sauvegardes = await application.evaluate(() => {
    var _process$env$GMOS_DOS;
    return (_process$env$GMOS_DOS = process.env.GMOS_DOSSIER_SAUVEGARDES) !== null && _process$env$GMOS_DOS !== void 0 ? _process$env$GMOS_DOS : '(non posée)';
  });
  if (!normaliser(sauvegardes).startsWith(normaliser(profil))) {
    await application.close();
    throw new Error(`[E2E] ⛔ ARRÊT : les sauvegardes iraient dans « ${sauvegardes} », hors du profil jetable. ` + `Elles tournent : un test évincerait de vraies sauvegardes.`);
  }
}

/**
 * Les libellés exacts des boutons, relevés dans l'application.
 *
 * ⚠️ **Écrits en dur, et c'est voulu.** Les dériver de l'application les ferait
 * s'accorder avec elle quoi qu'elle devienne — un module renommé ou disparu ne
 * ferait alors plus rougir personne. *Une liste attendue n'a de valeur que si
 * elle peut contredire le code.*
 */
export const LES_PANNEAUX = ['Tableau de Bord', 'Journal de Jeu', 'Forge', 'Musique', 'Effets Sonores', 'Ambiances', 'Voice-OS', 'Favoris', 'Nexus Wiki', 'Cortex IA', 'Combat-OS', 'Dice-OS', 'Générateur PNJ', 'Cartographie', 'Image-OS', 'Horloge & Temps', 'Light-OS', 'Tables Aléatoires', 'Navigateur Web', 'Tableau Blanc'];

/**
 * **Une tablette de recette qui revient, avec son jeton de reprise** — comme une
 * vraie tablette rechargée (2026-10-22).
 *
 * Depuis le transport privé des modules (`a128c7af`), le serveur refuse un
 * identifiant connu qui revient **sans** son jeton (`reprise_refusee`) : c'est
 * ce qui empêche une autre tablette de se faire passer pour celle-ci. Les
 * recettes T0/T4 reprenaient le même identifiant dans un stockage neuf à chaque
 * essai : seul le premier passait, les suivants restaient sur « Aucun PJ
 * détecté », sans l'état du meneur.
 */
const JETONS_DE_REPRISE = new Map();
export async function presenterLaTablette(cible, id) {
  var _JETONS_DE_REPRISE$ge;
  await cible.addInitScript(([appareil, jeton]) => {
    localStorage.setItem('gmos-tablet-uuid', appareil);
    if (jeton) localStorage.setItem(`gmos:reprise-modules:${appareil}`, jeton);
  }, [id, (_JETONS_DE_REPRISE$ge = JETONS_DE_REPRISE.get(id)) !== null && _JETONS_DE_REPRISE$ge !== void 0 ? _JETONS_DE_REPRISE$ge : '']);
}

/** Retient le jeton que le serveur vient de remettre à cette tablette, pour son prochain retour. */
export async function retenirLaTablette(page, id) {
  const jeton = await page.waitForFunction(appareil => localStorage.getItem(`gmos:reprise-modules:${appareil}`), id, {
    timeout: 10000
  }).then(h => h.jsonValue()).catch(() => null);
  if (jeton) JETONS_DE_REPRISE.set(id, jeton);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZWxlY3Ryb24iLCJlbGVjdHJvbiIsImZzIiwib3MiLCJwYXRoIiwiZmlsZVVSTFRvUGF0aCIsIklDSSIsImRpcm5hbWUiLCJpbXBvcnQiLCJtZXRhIiwidXJsIiwiUE9JTlRfREVOVFJFRSIsIkNBTVBBR05FX1RFTU9JTiIsImpvaW4iLCJsYW5jZXJHbU9zIiwib3B0aW9ucyIsIl9vcHRpb25zJHByZXBhcmVyTGVQciIsIl9wcm9jZXNzdXMkc3Rkb3V0IiwiX3Byb2Nlc3N1cyRzdGRlcnIiLCJyYWNpbmUiLCJyZXNvbHZlIiwiZW50cmVlIiwiZXhpc3RzU3luYyIsIkVycm9yIiwicHJvZmlsIiwibWtkdGVtcFN5bmMiLCJ0bXBkaXIiLCJyb2FtaW5nIiwibG9jYWwiLCJta2RpclN5bmMiLCJyZWN1cnNpdmUiLCJwcmVwYXJlckxlUHJvZmlsIiwiY2FsbCIsInBvcnRzIiwicG9ydHNEZUNlV29ya2VyIiwiYXBwbGljYXRpb24iLCJsYXVuY2giLCJhcmdzIiwiY3dkIiwiZW52IiwiZW52aXJvbm5lbWVudFByb3ByZSIsInZhcmlhYmxlcyIsIlVTRVJQUk9GSUxFIiwiQVBQREFUQSIsIkxPQ0FMQVBQREFUQSIsIkdNT1NfRE9TU0lFUl9TQVVWRUdBUkRFUyIsIkdNT1NfUkFDSU5FX0RPQ1MiLCJHTU9TX0NPRkZSRV9PQlNJRElBTiIsIkdNT1NfU0FOU19BUFBBUkVJTFMiLCJzZW1lbmNlIiwiR01PU19TRU1FTkNFIiwic29ydGllcyIsInJlbGV2ZXIiLCJjaHVuayIsInB1c2giLCJ0b1N0cmluZyIsInByb2Nlc3N1cyIsInByb2Nlc3MiLCJzdGRvdXQiLCJvbiIsInN0ZGVyciIsImZlbmV0cmUiLCJmZW5ldHJlRHVNZW5ldXIiLCJlcnJldXIiLCJldGF0IiwiZXZhbHVhdGUiLCJhcHAiLCJCcm93c2VyV2luZG93IiwicHJldCIsImlzUmVhZHkiLCJmZW5ldHJlcyIsImdldEFsbFdpbmRvd3MiLCJtYXAiLCJ3Iiwid2ViQ29udGVudHMiLCJnZXRVUkwiLCJjYXRjaCIsImNvbnNvbGUiLCJlcnJvciIsInNsaWNlIiwiY2xvc2UiLCJfcHJvY2Vzc3VzJHN0ZG91dDIiLCJfcHJvY2Vzc3VzJHN0ZGVycjIiLCJvZmYiLCJ2ZXJpZmllckxJc29sYXRpb24iLCJzeW5jIiwiZmljaGVzIiwiZmVybWVyIiwicm1TeW5jIiwiZm9yY2UiLCJhdHRlbmRyZUxIeWRyYXRhdGlvbiIsImdtb3MiLCJ3YWl0Rm9yRnVuY3Rpb24iLCJfbWFnYXNpbiRwZXJzaXN0IiwibWFnYXNpbiIsIndpbmRvdyIsInVzZVNlc3Npb25PU1N0b3JlIiwicGVyc2lzdCIsImhhc0h5ZHJhdGVkIiwidW5kZWZpbmVkIiwidGltZW91dCIsIm91dnJpckxlTW9kdWxlIiwibm9tIiwibW90aWYiLCJSZWdFeHAiLCJnZXRCeVJvbGUiLCJuYW1lIiwiZmlyc3QiLCJjbGljayIsIm9uZ2xldERlTGFGaWNoZSIsInBhZ2UiLCJleGFjdCIsImNhcnRlRGUiLCJwYW5uZWF1IiwibG9jYXRvciIsIl9wcm9jZXNzJGVudiRURVNUX1BBUiIsImluZGV4IiwiTnVtYmVyIiwiVEVTVF9QQVJBTExFTF9JTkRFWCIsIkdNT1NfUE9SVF9TWU5DIiwiU3RyaW5nIiwiR01PU19QT1JUX0ZJQ0hFUyIsImxpbWl0ZSIsIkRhdGUiLCJub3ciLCJ3aW5kb3dzIiwic3RhcnRzV2l0aCIsIndhaXRGb3JFdmVudCIsInByb3ByZSIsImNsZSIsInZhbGV1ciIsIk9iamVjdCIsImVudHJpZXMiLCJWSVRFX0RFVl9TRVJWRVJfVVJMIiwicmV0ZW51IiwiZ2V0UGF0aCIsIm5vcm1hbGlzZXIiLCJwIiwidG9Mb3dlckNhc2UiLCJzYXV2ZWdhcmRlcyIsIl9wcm9jZXNzJGVudiRHTU9TX0RPUyIsIkxFU19QQU5ORUFVWCIsIkpFVE9OU19ERV9SRVBSSVNFIiwiTWFwIiwicHJlc2VudGVyTGFUYWJsZXR0ZSIsImNpYmxlIiwiaWQiLCJfSkVUT05TX0RFX1JFUFJJU0UkZ2UiLCJhZGRJbml0U2NyaXB0IiwiYXBwYXJlaWwiLCJqZXRvbiIsImxvY2FsU3RvcmFnZSIsInNldEl0ZW0iLCJnZXQiLCJyZXRlbmlyTGFUYWJsZXR0ZSIsImdldEl0ZW0iLCJ0aGVuIiwiaCIsImpzb25WYWx1ZSIsInNldCJdLCJzb3VyY2VzIjpbImxhbmNlckdtT3MudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgX2VsZWN0cm9uIGFzIGVsZWN0cm9uLCB0eXBlIEJyb3dzZXJDb250ZXh0LCB0eXBlIEVsZWN0cm9uQXBwbGljYXRpb24sIHR5cGUgTG9jYXRvciwgdHlwZSBQYWdlIH0gZnJvbSAnQHBsYXl3cmlnaHQvdGVzdCc7XG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgb3MgZnJvbSAnbm9kZTpvcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ25vZGU6dXJsJztcblxuLyogTGUgZMOpcMO0dCBlc3QgZW4gRVNNIChgXCJ0eXBlXCI6IFwibW9kdWxlXCJgKSA6IGBfX2Rpcm5hbWVgIG4neSBleGlzdGUgcGFzLiAqL1xuY29uc3QgSUNJID0gcGF0aC5kaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSk7XG5cbi8qKlxuICogKipMYW5jZXIgR00tT1Mgc3VyIHVuIHByb2ZpbCBqZXRhYmxlLioqXG4gKlxuICog4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gKiDim5QgQ0UgUVVFIENFIEZJQ0hJRVIgUFJPVMOIR0UsIEVUIFBPVVJRVU9JIElMIEVYSVNURSBBVkFOVCBMRVMgVEVTVFNcbiAqIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICpcbiAqIENlIGTDqXDDtHQgYSBwZXJkdSBzZXMgY2FtcGFnbmVzIGRldXggZm9pcywgZXQgYSBjcnUgbGVzIHBlcmRyZSB1bmUgdHJvaXNpw6htZSBsZVxuICogMjAyNi0wOS0xMSBhdSBtYXRpbi4gKipVbiB0ZXN0IGRlIGJvdXQgZW4gYm91dCBsYW5jZSBsYSB2cmFpZSBhcHBsaWNhdGlvbioqIDpcbiAqIHNhbnMgcHLDqWNhdXRpb24sIGlsIMOpY3JpcmFpdCBkYW5zIGxlIHZyYWkgcHJvZmlsLCBldCB1biB0ZXN0IHJhdMOpIGRldmllbmRyYWl0XG4gKiB1bmUgcGVydGUgZGUgZG9ubsOpZXMuXG4gKlxuICogYC0tdXNlci1kYXRhLWRpcmAgcsOoZ2xlIMOnYSBlbnRpw6hyZW1lbnQuIEMnZXN0IHVuIGNvbW11dGF0ZXVyIGRlIENocm9taXVtIHF1aVxuICogKippbXBvc2UqKiBsJ2VtcGxhY2VtZW50IGRlcyBkb25uw6llcywgZXQgaWwgbCdlbXBvcnRlIHN1ciBsZSBjaGVtaW4gZMOpZHVpdCBkZVxuICogYGFwcC5uYW1lYC4gQ2hhcXVlIGV4w6ljdXRpb24gcmXDp29pdCBkb25jIHVuIGRvc3NpZXIgbmV1ZiBzb3VzIGxlIHRlbXBvcmFpcmUgZHVcbiAqIHN5c3TDqG1lLCBldCBsZSBzdXBwcmltZSBlbiBwYXJ0YW50LlxuICpcbiAqIOKtkCAqTGUgcmV0b3VybmVtZW50IMOgIHJldGVuaXIgOiBvbiBjcm9pdCBsJ0UyRSByaXNxdcOpIHBhcmNlIHF1J2lsIMKrIGxhbmNlXG4gKiB2cmFpbWVudCBsJ2FwcGxpY2F0aW9uIMK7LiBDJ2VzdCBsJ2ludmVyc2Ug4oCUIGMnZXN0IGxlIHNldWwgY29udGV4dGUgb8O5IGVsbGVcbiAqIHRvdXJuZSBzdXIgZGVzIGRvbm7DqWVzIHF1aSBuJ2V4aXN0ZW50IHF1ZSBsZSB0ZW1wcyBkdSB0ZXN0LipcbiAqXG4gKiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAqIOKaoO+4jyBDRSBRVUkgUkVTVEUgREVIT1JTIOKAlCDDgCBMSVJFIEFWQU5UIEQnw4lDUklSRSBVTiBURVNUXG4gKiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAqXG4gKiBgLS11c2VyLWRhdGEtZGlyYCBpc29sZSAqKmNlIHF1aSB2aXQgZGFucyBsZSBwcm9maWwqKiA6IEluZGV4ZWREQiwgbGUgc3RvY2thZ2VcbiAqIGxvY2FsLCBsZSBjb2ZmcmUgZGVzIGNsw6lzLCBsZXMgbcOpZGlhcyB0ZW1wb3JhaXJlcywgbGUgbWlyb2lyLiBMZSByZXN0ZSBhIMOpdMOpXG4gKiBjaGVyY2jDqSB1biBwYXIgdW4g4oCUIGV0IHRvdXQgZXN0IGZlcm3DqSBkZXB1aXMgbGUgMjAyNi0wOS0xMSA6XG4gKlxuICogfCBRdW9pIHwgT8O5IMOnYSBhbGxhaXQgfCBDb21tZW50IGMnZXN0IGZlcm3DqSB8XG4gKiB8IC0tLSB8IC0tLSB8IC0tLSB8XG4gKiB8IFNhdXZlZ2FyZGVzIGF1dG9tYXRpcXVlcyB8IGNoZW1pbiBhYnNvbHUsIGhvcnMgaW5zdGFsbGF0aW9uIHwgYEdNT1NfRE9TU0lFUl9TQVVWRUdBUkRFU2AgfFxuICogfCBDb3JwdXMgYGRvY3MvYCB8IGBBUFBfUk9PVC9kb2NzYCDigJQgbGUgZMOpcMO0dCB8IGBHTU9TX1JBQ0lORV9ET0NTYCB8XG4gKiB8IENvZmZyZSBPYnNpZGlhbiB8IGRvc3NpZXIgZHUgbWVuZXVyIHwgYEdNT1NfQ09GRlJFX09CU0lESUFOYCB8XG4gKiB8IFBvbnQgSHVlLCBhZmZpY2hldXIgVWxhbnppIHwgbGUgcsOpc2VhdSwgZG9uYyBsZSBzYWxvbiB8IGBHTU9TX1NBTlNfQVBQQVJFSUxTYCB8XG4gKlxuICog4q2QIExlcyBBUElzIGQnSUEsIGVsbGVzLCBzb250IHByb3TDqWfDqWVzICoqcGFyIGFjY2lkZW50IGhldXJldXgqKiA6IGxlIGNvZmZyZSBkdVxuICogcHJvZmlsIGpldGFibGUgZXN0IHZpZGUsIGV0IGRlcHVpcyBsZSAyMDI2LTA5LTExIGMnZXN0IGxlIHByb2Nlc3N1cyBwcmluY2lwYWxcbiAqIHF1aSBwb3NlIGxlcyBjbMOpcyDigJQgc2FucyBjbMOpLCBsJ2FwcGVsIGVzdCByZWZ1c8OpIGF2YW50IGRlIHBhcnRpci5cbiAqXG4gKiDimqDvuI8gKipDZSBxdWkgcmVzdGUgw6AgbGEgY2hhcmdlIGR1IHRlc3QqKiwgZXQgcXUnYXVjdW5lIHZhcmlhYmxlIG5lIGNvdXZyZSA6IHVuXG4gKiB0ZXN0IHF1aSBkw6ljbGVuY2hlcmFpdCB1bmUgdnJhaWUgZ8OpbsOpcmF0aW9uIGQnaW1hZ2UsIHVuIGVudm9pIHZlcnMgdW5lIHRhYmxldHRlXG4gKiBhcHBhaXLDqWUsIG91IGwnb3V2ZXJ0dXJlIGQndW4gZmljaGllciBwYXIgbGUgc3lzdMOobWUuICpMJ2ludmVudGFpcmUgdmF1dCBwb3VyXG4gKiBjZSBxdWkgYSDDqXTDqSBjaGVyY2jDqSA7IGlsIG5lIHByb3V2ZSBwYXMgcXUnaWwgbmUgcmVzdGUgcmllbi4qXG4gKlxuICog4pqg77iPIGB2ZXJpZmllckxJc29sYXRpb25gIG4nZXN0IHBhcyB1bmUgcG9saXRlc3NlIDogYydlc3QgbGEgZ2FyZGUuIEVsbGVcbiAqIGludGVycm9nZSBsZSBwcm9jZXNzdXMgcHJpbmNpcGFsIHN1ciBsZSBjaGVtaW4gcXUnaWwgYSByw6llbGxlbWVudCByZXRlbnUsIGV0XG4gKiByZWZ1c2UgZGUgY29udGludWVyIHMnaWwgbmUgdG9tYmUgcGFzIGRhbnMgbGUgZG9zc2llciBqZXRhYmxlLiAqVW5lIGlzb2xhdGlvblxuICogcXUnb24gc3VwcG9zZSBuJ2VzdCBwYXMgdW5lIGlzb2xhdGlvbi4qXG4gKi9cblxuLyoqIExlIHBhcXVldCBjb25zdHJ1aXQsIGNlbHVpIHF1J0VsZWN0cm9uIHJlw6dvaXQgZW4gYXJndW1lbnQuICovXG5jb25zdCBQT0lOVF9ERU5UUkVFID0gJ2Rpc3QtZWxlY3Ryb24vbWFpbi5qcyc7XG5cbi8qKlxuICogKipMYSBjYW1wYWduZSB0w6ltb2luLCBnZWzDqWUuKipcbiAqXG4gKiBVbiB0ZXN0IHF1aSBhIGJlc29pbiBkJ2F1dHJlIGNob3NlIHF1J3VuIMOpY3JhbiBkJ2FjY3VlaWwgbGEgZGVtYW5kZSDDoFxuICogYGxhbmNlckdtT3MoeyBzZW1lbmNlOiBDQU1QQUdORV9URU1PSU4gfSlgLiBTYW5zIGVsbGUsIGwnaW5zdGFuY2UgZMOpbWFycmUgc3VyXG4gKiBgSU5JVElBTF9EQVRBYCDigJQgwqsgVGhlIEV0ZXJuYWwgUXVlc3Qgwrsg4oCUIGNlIHF1aSBzdWZmaXQgw6AgbGEgcGx1cGFydCBkZXMgdGVzdHNcbiAqIGV0IG5lIGNvw7t0ZSByaWVuLlxuICpcbiAqIOKblCAqKkVsbGUgZXN0IGdlbMOpZSwgcGFzIG1haW50ZW51ZS4qKiBTb24gY29udGVudSBuZSBzZSByw6lnw6luw6hyZSBwYXMgOyBpbCBlc3RcbiAqIGdhcmTDqSBwYXIgYHNyYy9tb2R1bGVzL3Nlc3Npb24vZGF0YS9jYW1wYWduZVRlbW9pbkdlbGVlLnRlc3QudHNgLCBxdWkgw6ljaG91ZVxuICogYnJ1eWFtbWVudCBsZSBqb3VyIG/DuSBsZSBjb2RlIG5lIHNhaXQgcGx1cyBsYSBsaXJlLiAqVW4gdMOpbW9pbiBxdSdvblxuICogcmFmcmHDrmNoaXQgY2Vzc2UgZGUgcG91dm9pciBjb250cmVkaXJlIGxlIGNvZGUuKlxuICovXG5leHBvcnQgY29uc3QgQ0FNUEFHTkVfVEVNT0lOID0gcGF0aC5qb2luKElDSSwgJ2Rvbm5lZXMnLCAnY2FtcGFnbmUtdGVtb2luLmpzb24nKTtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zRGVMYW5jZW1lbnQge1xuICAgIC8qKlxuICAgICAqIExlIGZpY2hpZXIgZGUgc2F1dmVnYXJkZSBkb250IHBhcnRpciwgcydpbCB5IGVuIGEgdW4uXG4gICAgICpcbiAgICAgKiDimqDvuI8gTGEgc2VtZW5jZSBuJ2VudHJlIHF1ZSBzdXIgdW4gw6l0YXQgZCd1c2luZSwgZXQgc2V1bGVtZW50IGFwcsOoc1xuICAgICAqIGwnaHlkcmF0YXRpb24g4oCUIHZvaXIgbGVzIHRyb2lzIGdhcmRlcyBkZSBgc3JjL2hvb2tzL3VzZVNlbWVuY2UudHNgLiBTdXIgdW5lXG4gICAgICogaW5zdGFuY2UgcXVpIHBvcnRlIGTDqWrDoCBkZXMgY2FtcGFnbmVzLCBlbGxlIG5lIGZhaXQgcmllbiAqKmV0IGxlIGRpdCBhdVxuICAgICAqIGpvdXJuYWwqKi5cbiAgICAgKi9cbiAgICBzZW1lbmNlPzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogRMOpcG9zZSBkZXMgZmljaGllcnMgZGFucyBsZSBwcm9maWwgamV0YWJsZSAqKmF2YW50KiogbGUgZMOpbWFycmFnZSDigJQgbGVcbiAgICAgKiBtaXJvaXIgZGVzIG3DqWRpYXMsIHBhciBleGVtcGxlLCBxdWUgbCdhcHBsaWNhdGlvbiBuZSBsaXQgcXVlIHNvdXNcbiAgICAgKiBgdXNlckRhdGFgLiBUb3V0IGNlIHF1J2VsbGUgeSDDqWNyaXQgcmVzdGUgZGFucyBsZSBwcm9maWwsIGV0IHBhcnQgYXZlYyBsdWkuXG4gICAgICovXG4gICAgcHJlcGFyZXJMZVByb2ZpbD86IChwcm9maWw6IHN0cmluZykgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHbU9zTGFuY2Uge1xuICAgIGFwcGxpY2F0aW9uOiBFbGVjdHJvbkFwcGxpY2F0aW9uO1xuICAgIC8qKiBMYSBmZW7DqnRyZSBkdSBtZW5ldXIg4oCUIGxhIHByZW1pw6hyZSBxdSdFbGVjdHJvbiBvdXZyZS4gKi9cbiAgICBmZW5ldHJlOiBQYWdlO1xuICAgIC8qKiBMZSBwcm9maWwgamV0YWJsZSwgcG91ciBsZXMgYXNzZXJ0aW9ucyBkJ2lzb2xhdGlvbi4gKi9cbiAgICBwcm9maWw6IHN0cmluZztcbiAgICAvKiogTGVzIHBvcnRzIGF0dHJpYnXDqXMgw6AgY2Ugd29ya2VyIOKAlCB2b2lyIGBwb3J0c0RlQ2VXb3JrZXJgLiAqL1xuICAgIHBvcnRzOiB7IHN5bmM6IG51bWJlcjsgZmljaGVzOiBudW1iZXIgfTtcbiAgICBmZXJtZXI6ICgpID0+IFByb21pc2U8dm9pZD47XG59XG5cbi8qKlxuICogT3V2cmUgR00tT1MgZXQgcmVuZCBzYSBmZW7DqnRyZSBwcmluY2lwYWxlLlxuICpcbiAqIOKaoO+4jyAqKkV4aWdlIHVuIGBucG0gcnVuIGJ1aWxkYCDDoCBqb3VyLioqIFNhbnMgYFZJVEVfREVWX1NFUlZFUl9VUkxgLCBgbWFpbi50c2BcbiAqIGNoYXJnZSBgZGlzdC9pbmRleC5odG1sYCA6IGMnZXN0IGNlIHF1aSBwZXJtZXQgZGUgdGVzdGVyIHNhbnMgb3JjaGVzdHJlciBWaXRlLFxuICogbWFpcyB1biBgZGlzdC9gIHDDqXJpbcOpIGZlcmFpdCBwYXNzZXIgZGVzIHRlc3RzIHN1ciBkdSBjb2RlIGQnaGllci5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxhbmNlckdtT3Mob3B0aW9uczogT3B0aW9uc0RlTGFuY2VtZW50ID0ge30pOiBQcm9taXNlPEdtT3NMYW5jZT4ge1xuICAgIGNvbnN0IHJhY2luZSA9IHBhdGgucmVzb2x2ZShJQ0ksICcuLicpO1xuICAgIGNvbnN0IGVudHJlZSA9IHBhdGguam9pbihyYWNpbmUsIFBPSU5UX0RFTlRSRUUpO1xuXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGVudHJlZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYFtFMkVdICR7UE9JTlRfREVOVFJFRX0gZXN0IGFic2VudC4gTGFuY2V6IFxcYG5wbSBydW4gYnVpbGRcXGAgYXZhbnQgbGVzIHRlc3RzIGRlIGJvdXQgZW4gYm91dC5gLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHByb2ZpbCA9IGZzLm1rZHRlbXBTeW5jKHBhdGguam9pbihvcy50bXBkaXIoKSwgJ2dtb3MtZTJlLScpKTtcbiAgICAvLyBVU0VSUFJPRklMRSBlc3QgaXNvbMOpIGF1c3NpIDogRWxlY3Ryb24gZXhpZ2UgcXVlIHNlcyBkZXV4IEFwcERhdGEgZXhpc3RlbnQuXG4gICAgY29uc3Qgcm9hbWluZyA9IHBhdGguam9pbihwcm9maWwsICdBcHBEYXRhJywgJ1JvYW1pbmcnKTtcbiAgICBjb25zdCBsb2NhbCA9IHBhdGguam9pbihwcm9maWwsICdBcHBEYXRhJywgJ0xvY2FsJyk7XG4gICAgZnMubWtkaXJTeW5jKHJvYW1pbmcsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLm1rZGlyU3luYyhsb2NhbCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgb3B0aW9ucy5wcmVwYXJlckxlUHJvZmlsPy4ocHJvZmlsKTtcbiAgICBjb25zdCBwb3J0cyA9IHBvcnRzRGVDZVdvcmtlcigpO1xuXG4gICAgY29uc3QgYXBwbGljYXRpb24gPSBhd2FpdCBlbGVjdHJvbi5sYXVuY2goe1xuICAgICAgICBhcmdzOiBbXG4gICAgICAgICAgICBlbnRyZWUsXG4gICAgICAgICAgICAvKiBMYSBnYXJkZSA6IHRvdXQgY2UgcXVlIGwnYXBwbGljYXRpb24gw6ljcml0IHRvbWJlIGljaS4gKi9cbiAgICAgICAgICAgIGAtLXVzZXItZGF0YS1kaXI9JHtwcm9maWx9YCxcbiAgICAgICAgXSxcbiAgICAgICAgY3dkOiByYWNpbmUsXG4gICAgICAgIGVudjoge1xuICAgICAgICAgICAgLi4uZW52aXJvbm5lbWVudFByb3ByZSgpLFxuICAgICAgICAgICAgLi4ucG9ydHMudmFyaWFibGVzLFxuICAgICAgICAgICAgLy8gTGUgcG9udCBNQ1Agw6ljcml0IHNvbiBqb3VybmFsIHNvdXMgVVNFUlBST0ZJTEUsIGhvcnMgdXNlckRhdGEuXG4gICAgICAgICAgICAvLyBDZXR0ZSB2YXJpYWJsZSBhcHBhcnRpZW50IHNldWxlbWVudCBhdSBwcm9jZXNzdXMgRWxlY3Ryb24gamV0YWJsZS5cbiAgICAgICAgICAgIFVTRVJQUk9GSUxFOiBwcm9maWwsXG4gICAgICAgICAgICBBUFBEQVRBOiByb2FtaW5nLFxuICAgICAgICAgICAgTE9DQUxBUFBEQVRBOiBsb2NhbCxcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgIOKblCAqKkxlcyBzYXV2ZWdhcmRlcyBhdXRvbWF0aXF1ZXMgbmUgdml2ZW50IFBBUyBzb3VzIGB1c2VyRGF0YWAuKipcblxuICAgICAgICAgICAgICBMZXVyIGRvc3NpZXIgZXN0IHVuIGNoZW1pbiBhYnNvbHUg4oCUIGBDOlxcUHJvamV0X0RhdmlkXFxTZWN1cml0eV9CYWNrdXBfR01PU2BcbiAgICAgICAgICAgICAg4oCUIHBvc8OpIGzDoCBleHByw6hzIHBvdXIgbmUgamFtYWlzIHRvbWJlciBzb3VzIGwnaW5zdGFsbGF0aW9uLiBJbFxuICAgICAgICAgICAgICDDqWNoYXBwZSBkb25jIGVudGnDqHJlbWVudCDDoCBgLS11c2VyLWRhdGEtZGlyYCwgZXQgKippbCB0b3VybmUqKiA6XG4gICAgICAgICAgICAgIHVuZSBzYXV2ZWdhcmRlIMOpY3JpdGUgcGFyIHVuIHRlc3Qgw6l2aW5jZXJhaXQgbGVzIHZyYWllcy5cblxuICAgICAgICAgICAgICBgR01PU19ET1NTSUVSX1NBVVZFR0FSREVTYCBleGlzdGFpdCBkw6lqw6AgOyBpbCBzdWZmaXNhaXQgZGUgcydlblxuICAgICAgICAgICAgICBzZXJ2aXIuICpMZSBwcm9maWwgamV0YWJsZSBpc29sZSBjZSBxdWkgdml0IGRhbnMgbGUgcHJvZmlsIOKAlCBsZVxuICAgICAgICAgICAgICByZXN0ZSBkZW1hbmRlIMOgIMOqdHJlIGNoZXJjaMOpIHVuIHBhciB1bi4qXG4gICAgICAgICAgICAqL1xuICAgICAgICAgICAgR01PU19ET1NTSUVSX1NBVVZFR0FSREVTOiBwYXRoLmpvaW4ocHJvZmlsLCAnc2F1dmVnYXJkZXMnKSxcblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgTGVzIHRyb2lzIMOpY2hhcHBlbWVudHMgZHUgcMOpcmltw6h0cmUg4oCUIHZvaXJcbiAgICAgICAgICAgICAgYGVsZWN0cm9uL3BlcmltZXRyZURlTEluc3RhbmNlLnRzYC5cblxuICAgICAgICAgICAgICDimqDvuI8gTGUgY29ycHVzIHZpc2UgdW4gZG9zc2llciAqKnZpZGUqKiBkdSBwcm9maWwsIHBhcyB1bmUgY29waWUgZHVcbiAgICAgICAgICAgICAgdnJhaSA6IHVuIHRlc3QgcXVpIGEgYmVzb2luIGRlIHLDqGdsZXMgZG9pdCBsZXMgeSBzZW1lciBsdWktbcOqbWUuXG4gICAgICAgICAgICAgICpMaXJlIGxlIHZyYWkgY29ycHVzIG1hcmNoZXJhaXQgYXVqb3VyZCdodWkgZXQgw6ljcmlyYWl0IGRlZGFucyBsZVxuICAgICAgICAgICAgICBqb3VyIG/DuSB1biB0ZXN0IHRvdWNoZSBsYSBGb3JnZS4qXG4gICAgICAgICAgICAqL1xuICAgICAgICAgICAgR01PU19SQUNJTkVfRE9DUzogcGF0aC5qb2luKHByb2ZpbCwgJ2NvcnB1cycpLFxuICAgICAgICAgICAgR01PU19DT0ZGUkVfT0JTSURJQU46IHBhdGguam9pbihwcm9maWwsICdjb2ZmcmUnKSxcbiAgICAgICAgICAgIC8qIEV0IHN1cnRvdXQgOiBhdWN1bmUgbGFtcGUsIGF1Y3VuIGFmZmljaGV1ci4gKi9cbiAgICAgICAgICAgIEdNT1NfU0FOU19BUFBBUkVJTFM6ICcxJyxcblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgTGEgc2VtZW5jZSwgc2V1bGVtZW50IHNpIGxlIHRlc3QgbGEgZGVtYW5kZS5cblxuICAgICAgICAgICAgICDim5QgKipFbGxlIG4nZXN0IGphbWFpcyBow6lyaXTDqWUqKiA6IGBlbnZpcm9ubmVtZW50UHJvcHJlYCBlZmZhY2VcbiAgICAgICAgICAgICAgdG91dGVzIGxlcyBgR01PU18qYCBkdSB0ZXJtaW5hbC4gU2FucyDDp2EsIHVuZSB2YXJpYWJsZSBwb3PDqWUgZGFuc1xuICAgICAgICAgICAgICBsZSBzaGVsbCBkdSBtZW5ldXIg4oCUIHBvdXIgdW5lIHLDqXDDqXRpdGlvbiwgcGFyIGV4ZW1wbGUg4oCUIGVudHJlcmFpdFxuICAgICAgICAgICAgICBkYW5zIGxlcyB0ZXN0cywgZXQgbGUgZMOpY29yIGTDqXBlbmRyYWl0IGRlIHF1aSBsYW5jZSBsYSBjb21tYW5kZS5cbiAgICAgICAgICAgICovXG4gICAgICAgICAgICAuLi4ob3B0aW9ucy5zZW1lbmNlID8geyBHTU9TX1NFTUVOQ0U6IG9wdGlvbnMuc2VtZW5jZSB9IDoge30pLFxuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc29ydGllczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCByZWxldmVyID0gKGNodW5rOiBCdWZmZXIpID0+IHsgc29ydGllcy5wdXNoKGNodW5rLnRvU3RyaW5nKCkpOyB9O1xuICAgIGNvbnN0IHByb2Nlc3N1cyA9IGFwcGxpY2F0aW9uLnByb2Nlc3MoKTtcbiAgICBwcm9jZXNzdXMuc3Rkb3V0Py5vbignZGF0YScsIHJlbGV2ZXIpO1xuICAgIHByb2Nlc3N1cy5zdGRlcnI/Lm9uKCdkYXRhJywgcmVsZXZlcik7XG4gICAgbGV0IGZlbmV0cmU6IFBhZ2U7XG4gICAgdHJ5IHtcbiAgICAgICAgZmVuZXRyZSA9IGF3YWl0IGZlbmV0cmVEdU1lbmV1cihhcHBsaWNhdGlvbik7XG4gICAgfSBjYXRjaCAoZXJyZXVyKSB7XG4gICAgICAgIC8vIFVuIGxhbmNlbWVudCByYXTDqSBkb2l0IGxhaXNzZXIgdW4gZGlhZ25vc3RpYyBldCBmZXJtZXIgc29uIGluc3RhbmNlIGpldGFibGUuXG4gICAgICAgIGNvbnN0IGV0YXQgPSBhd2FpdCBhcHBsaWNhdGlvbi5ldmFsdWF0ZSgoeyBhcHAsIEJyb3dzZXJXaW5kb3cgfSkgPT4gKHtcbiAgICAgICAgICAgIHByZXQ6IGFwcC5pc1JlYWR5KCksIGZlbmV0cmVzOiBCcm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKS5tYXAodyA9PiB3LndlYkNvbnRlbnRzLmdldFVSTCgpKSxcbiAgICAgICAgfSkpLmNhdGNoKCgpID0+IG51bGwpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdbRTJFXSBEw6ltYXJyYWdlIGltcG9zc2libGUnLCB7IHByb2ZpbCwgZXRhdCwgc29ydGllczogc29ydGllcy5qb2luKCcnKS5zbGljZSgtMTJfMDAwKSB9KTtcbiAgICAgICAgYXdhaXQgYXBwbGljYXRpb24uY2xvc2UoKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgIHRocm93IGVycmV1cjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICBwcm9jZXNzdXMuc3Rkb3V0Py5vZmYoJ2RhdGEnLCByZWxldmVyKTtcbiAgICAgICAgcHJvY2Vzc3VzLnN0ZGVycj8ub2ZmKCdkYXRhJywgcmVsZXZlcik7XG4gICAgfVxuICAgIGF3YWl0IHZlcmlmaWVyTElzb2xhdGlvbihhcHBsaWNhdGlvbiwgcHJvZmlsKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGFwcGxpY2F0aW9uLFxuICAgICAgICBmZW5ldHJlLFxuICAgICAgICBwcm9maWwsXG4gICAgICAgIHBvcnRzOiB7IHN5bmM6IHBvcnRzLnN5bmMsIGZpY2hlczogcG9ydHMuZmljaGVzIH0sXG4gICAgICAgIGZlcm1lcjogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgYXBwbGljYXRpb24uY2xvc2UoKTtcbiAgICAgICAgICAgIC8qIExlIGRvc3NpZXIgcGFydCBhdmVjIGxlIHRlc3QuIGBmb3JjZWAgOiB1biBmaWNoaWVyIGVuY29yZSB0ZW51IHBhclxuICAgICAgICAgICAgICAgdW4gcHJvY2Vzc3VzIHF1aSBzJ8OpdGVpbnQgbmUgZG9pdCBwYXMgZmFpcmUgw6ljaG91ZXIgbGUgbmV0dG95YWdlLiAqL1xuICAgICAgICAgICAgZnMucm1TeW5jKHByb2ZpbCwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbi8qKlxuICogQXR0ZW5kIHF1ZSBsYSBiYXNlIGFpdCBmaW5pIGQnw6p0cmUgcmVsdWUuXG4gKlxuICog4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gKiDim5QgQ0UgUVVJIFNFIFBBU1NFIFNJIE9OIEFUVEVORCBMQSBNQVVWQUlTRSBDSE9TRVxuICog4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gKlxuICogT24gYSBkJ2Fib3JkIGF0dGVuZHUgwqsgbGUgbWFnYXNpbiBwb3J0ZSBhdSBtb2lucyB1bmUgY2FtcGFnbmUgwrsuICoqQydlc3QgdW5cbiAqIGZhdXggc2lnbmFsKiogOiBsZSBtYWdhc2luIG5hw650IGF2ZWMgYElOSVRJQUxfREFUQWAsIGRvbmMgbGEgY29uZGl0aW9uIGVzdFxuICogdnJhaWUgKmF2YW50KiBsYSBtb2luZHJlIGxlY3R1cmUgZCdJbmRleGVkREIuIEMnZXN0IGxhIG3Dqm1lIG3DqXByaXNlIHF1ZSBsYVxuICogZ2FyZGUgZGUgbGEgc2VtZW5jZSBhIHBhecOpZSBlbiBhb8O7dCDigJQgKnVuZSBiYXNlIG5ldXZlIG4nZXN0IGphbWFpcyB2aWRlLipcbiAqXG4gKiBFdCBsYSBjb25zw6lxdWVuY2Ugw6l0YWl0IG11ZXR0ZSA6IGBnbU9ubHlTdGF0ZVN0b3JhZ2Uuc2V0SXRlbWAgcmVmdXNlIGQnw6ljcmlyZVxuICogdGFudCBxdWUgbGEgYmFzZSBuJ2EgcGFzIMOpdMOpIHJlbHVlLCAqKmV0IHJldG91cm5lIHNhbnMgcmllbiBkaXJlKiouIFVuIHRlc3RcbiAqIHF1aSDDqWNyaXZhaXQgdHJvcCB0w7R0IHZveWFpdCBkb25jIHNvbiDDqWNyaXR1cmUgZGlzcGFyYcOudHJlLCBzYW5zIGVycmV1ciwgc2Fuc1xuICogdHJhY2Ug4oCUIHB1aXMgbCdhcHBsaWNhdGlvbiBwZXJzaXN0YWl0IHNvbiBwcm9wcmUgw6l0YXQgcGFyLWRlc3N1cy4gKlRyb2lzXG4gKiBoeXBvdGjDqHNlcyBmYXVzc2VzIGF2YW50IGRlIHNpbXBsZW1lbnQgZGVtYW5kZXIgw6AgWnVzdGFuZCBjZSBxdSdpbCBzYWl0XG4gKiBkw6lqw6AuKlxuICpcbiAqIGBwZXJzaXN0Lmhhc0h5ZHJhdGVkKClgIGVzdCBjZSBzaWduYWwsIGV0IGlsIHZpZW50IGRlIGxhIG3Dqm1lIG3DqWNhbmlxdWUgcXVlXG4gKiBsZSB2ZXJyb3UgZCfDqWNyaXR1cmUgOiBsZXMgZGV1eCBzb250IHBvc8OpcyBwYXIgYG9uUmVoeWRyYXRlU3RvcmFnZWAuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhdHRlbmRyZUxIeWRyYXRhdGlvbihnbW9zOiBHbU9zTGFuY2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBnbW9zLmZlbmV0cmUud2FpdEZvckZ1bmN0aW9uKFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtYWdhc2luID0gKHdpbmRvdyBhcyBuZXZlciBhcyB7XG4gICAgICAgICAgICAgICAgdXNlU2Vzc2lvbk9TU3RvcmU/OiB7IHBlcnNpc3Q/OiB7IGhhc0h5ZHJhdGVkOiAoKSA9PiBib29sZWFuIH0gfTtcbiAgICAgICAgICAgIH0pLnVzZVNlc3Npb25PU1N0b3JlO1xuICAgICAgICAgICAgcmV0dXJuIG1hZ2FzaW4/LnBlcnNpc3Q/Lmhhc0h5ZHJhdGVkKCkgPT09IHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgeyB0aW1lb3V0OiAzMF8wMDAgfSxcbiAgICApO1xufVxuXG4vKipcbiAqIE91dnJlIHVuIG1vZHVsZSBwYXIgc29uIGJvdXRvbiBkZSBsYSBiYXJyZSBsYXTDqXJhbGUuXG4gKlxuICog4pqg77iPICoqUGFyIGxlIGJvdXRvbiwgZXQgbm9uIGVuIHBvc2FudCBgYWN0aXZlTW9kdWxlYCBkYW5zIHVuIG1hZ2FzaW4uKiogUG9zZXJcbiAqIGwnw6l0YXQgc2F1dGVyYWl0IHByw6ljaXPDqW1lbnQgY2UgcXUnb24gdmV1dCDDqXByb3V2ZXIgOiBxdWUgbGUgYm91dG9uIGV4aXN0ZSxcbiAqIHF1J2lsIHBvcnRlIGxlIGJvbiBsaWJlbGzDqSwgZXQgcXUnaWwgYXR0ZWlnbmUgbGUgbW9kdWxlLiAqVW4gcmFjY291cmNpIGRlIHRlc3RcbiAqIHF1aSBjb3VydC1jaXJjdWl0ZSBsZSBnZXN0ZSBuZSB0ZXN0ZSBwbHVzIGxlIGdlc3RlLipcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG91dnJpckxlTW9kdWxlKGdtb3M6IEdtT3NMYW5jZSwgbm9tOiBzdHJpbmcgfCBSZWdFeHApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtb3RpZiA9IHR5cGVvZiBub20gPT09ICdzdHJpbmcnID8gbmV3IFJlZ0V4cChgXiR7bm9tfSRgKSA6IG5vbTtcbiAgICBhd2FpdCBnbW9zLmZlbmV0cmUuZ2V0QnlSb2xlKCdidXR0b24nLCB7IG5hbWU6IG1vdGlmIH0pLmZpcnN0KCkuY2xpY2soKTtcbn1cblxuLyoqXG4gKiBPdXZyZSB1biBvbmdsZXQgZGUgbGEgZmljaGUgZGUgcGVyc29ubmFnZSDigJQgY2hleiBsZSBtZW5ldXIgKMKrIEZvcm11bGFpcmUgwrssXG4gKiDCqyBMYW5jZXIgdW4gdGVzdCDCuywgwqsgRmljaGUgZHUgamV1IMK7KSBvdSBzdXIgbGEgdGFibGV0dGUgKMKrIFZ1ZVxuICogc3ludGjDqXRpcXVlIMK7LCDCqyBMYW5jZXIgdW4gdGVzdCDCuywgwqsgTWEgZmljaGUgwrspLlxuICpcbiAqIExlIHRlc3Qgdml0IGRhbnMgc29uIG9uZ2xldCBkZXB1aXMgbGUgMjAyNi0xMC0yMiA6IG1hc3F1w6ksIHNvbiBwYW5uZWF1IG5lIHNlXG4gKiBjbGlxdWUgcGx1cy4gQ29tbWUgcG91ciBsZXMgbW9kdWxlcywgb24gcGFzc2UgcGFyIGwnb25nbGV0LCBwYXMgcGFyIGwnw6l0YXQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbmdsZXREZUxhRmljaGUocGFnZTogUGFnZSwgbm9tOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBwYWdlLmdldEJ5Um9sZSgndGFiJywgeyBuYW1lOiBub20sIGV4YWN0OiB0cnVlIH0pLmNsaWNrKCk7XG59XG5cbi8qKlxuICogTGEgY2FydGUgcmVwbGlhYmxlIHF1aSByYW5nZSB1biBwYW5uZWF1IGRhbnMgbCdvbmdsZXQgZHUgdGVzdC4gT24gbGFcbiAqIHBob3RvZ3JhcGhpZSBwbHV0w7R0IHF1ZSBsZSBwYW5uZWF1IDogYydlc3QgZWxsZSBxdWkgcG9ydGUgbGUgdGl0cmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYXJ0ZURlKHBhbm5lYXU6IExvY2F0b3IpOiBMb2NhdG9yIHtcbiAgICByZXR1cm4gcGFubmVhdS5sb2NhdG9yKCd4cGF0aD1hbmNlc3Rvcjo6ZGV0YWlsc1tAZGF0YS1jYXJ0ZS1kdS1qZXVdWzFdJyk7XG59XG5cbi8qKlxuICogKipEZXV4IHBvcnRzIHBhciB3b3JrZXIsIGF0dHJpYnXDqXMgc2FucyBjb3Vyc2UuKipcbiAqXG4gKiBQbGF5d3JpZ2h0IG51bcOpcm90ZSBzZXMgd29ya2VycyBkYW5zIGBURVNUX1BBUkFMTEVMX0lOREVYYC4gT24gZW4gZMOpcml2ZSB1bmVcbiAqIHBhaXJlIGRpc3RpbmN0ZSBwbHV0w7R0IHF1ZSBkZSBjaGVyY2hlciB1biBwb3J0IGxpYnJlIDogKnNvbmRlciB1biBwb3J0IHB1aXMgbGVcbiAqIHJlcHJlbmRyZSBsYWlzc2UgdW5lIGZlbsOqdHJlIG/DuSBsZSBzeXN0w6htZSBwZXV0IGwnYXR0cmlidWVyIMOgIHF1ZWxxdSd1blxuICogZCdhdXRyZSog4oCUIGonYWkgw6ljcml0IGNlIGTDqWZhdXQgbGUgbWF0aW4gbcOqbWUgZGFucyBgcG9ydE9jY3VwZS50ZXN0LnRzYCwgZXQgaWxcbiAqIGEgZmFpdCDDqWNob3VlciBsZSB0ZXN0IHBvdXIgbGEgbWF1dmFpc2UgcmFpc29uLlxuICpcbiAqIExlcyBwb3J0cyBwYXIgZMOpZmF1dCAoMzAwMS8zMDAyKSBzb250ICoqdm9sb250YWlyZW1lbnQgw6l2aXTDqXMqKiwgeSBjb21wcmlzXG4gKiBwb3VyIGxlIHdvcmtlciAwIDogdW4gR00tT1Mgb3V2ZXJ0IHN1ciBsYSBtYWNoaW5lIGR1IG1lbmV1ciBuZSBkb2l0IHBhcyB2b2lyXG4gKiBzZXMgdGFibGV0dGVzIHNlIGNvbm5lY3RlciDDoCB1bmUgaW5zdGFuY2UgZGUgdGVzdC5cbiAqL1xuZnVuY3Rpb24gcG9ydHNEZUNlV29ya2VyKCk6IHsgc3luYzogbnVtYmVyOyBmaWNoZXM6IG51bWJlcjsgdmFyaWFibGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IH0ge1xuICAgIGNvbnN0IGluZGV4ID0gTnVtYmVyKHByb2Nlc3MuZW52LlRFU1RfUEFSQUxMRUxfSU5ERVggPz8gJzAnKSB8fCAwO1xuICAgIGNvbnN0IHN5bmMgPSA0MTAwICsgaW5kZXggKiAxMDtcbiAgICBjb25zdCBmaWNoZXMgPSBzeW5jICsgMTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzeW5jLFxuICAgICAgICBmaWNoZXMsXG4gICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgR01PU19QT1JUX1NZTkM6IFN0cmluZyhzeW5jKSxcbiAgICAgICAgICAgIEdNT1NfUE9SVF9GSUNIRVM6IFN0cmluZyhmaWNoZXMpLFxuICAgICAgICB9LFxuICAgIH07XG59XG5cbi8qKlxuICogTGEgZmVuw6p0cmUgZGUgbCdhcHBsaWNhdGlvbiwgZXQgbm9uIGxlcyBEZXZUb29scy5cbiAqXG4gKiDim5QgKipgbWFpbi50c2AgYSBsb25ndGVtcHMgb3V2ZXJ0IGxlcyBEZXZUb29scyBlbiBmZW7DqnRyZSBEw4lUQUNIw4lFIMOgIGNoYXF1ZVxuICogZMOpbWFycmFnZSoqIChgb3BlbkRldlRvb2xzKHsgbW9kZTogJ2RldGFjaCcgfSlgLCByZXRpcsOpIGxlIDIwMjYtMDktMzAgw6AgbGFcbiAqIGRlbWFuZGUgZGUgRGF2aWQpLiBDJ8OpdGFpdCB1bmUgdnJhaWUgZmVuw6p0cmUgZGUgcGx1cywgZXQgYGZpcnN0V2luZG93KClgXG4gKiB0b21iYWl0IGRlc3N1cyA6IGxlIHRlc3QgY2hlcmNoYWl0IGxlcyBvbmdsZXRzIGRlIGwnYWlkZSBkYW5zIGwnaW5zcGVjdGV1clxuICogZGUgQ2hyb21pdW0uIExhIGdhcmRlIHJlc3RlIDogZGVzIERldlRvb2xzIG91dmVydHMgw6AgbGEgbWFpbiBmb250IHBhcmVpbC5cbiAqXG4gKiBPbiBjaG9pc2l0IGRvbmMgcGFyIGwnYWRyZXNzZSBwbHV0w7R0IHF1ZSBwYXIgbCdvcmRyZSBkJ2Fycml2w6llLiAqTCdvcmRyZSBkZXNcbiAqIGZlbsOqdHJlcyBlc3QgdW4gZMOpdGFpbCBkJ2ltcGzDqW1lbnRhdGlvbiA7IGNlIHF1J29uIHZldXQsIGMnZXN0IGNlbGxlIHF1aSBwb3J0ZVxuICogbCdhcHBsaWNhdGlvbi4qXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGZlbmV0cmVEdU1lbmV1cihhcHBsaWNhdGlvbjogRWxlY3Ryb25BcHBsaWNhdGlvbik6IFByb21pc2U8UGFnZT4ge1xuICAgIGNvbnN0IGxpbWl0ZSA9IERhdGUubm93KCkgKyAzMF8wMDA7XG5cbiAgICB3aGlsZSAoRGF0ZS5ub3coKSA8IGxpbWl0ZSkge1xuICAgICAgICBmb3IgKGNvbnN0IGZlbmV0cmUgb2YgYXBwbGljYXRpb24ud2luZG93cygpKSB7XG4gICAgICAgICAgICBpZiAoIWZlbmV0cmUudXJsKCkuc3RhcnRzV2l0aCgnZGV2dG9vbHM6Ly8nKSkgcmV0dXJuIGZlbmV0cmU7XG4gICAgICAgIH1cbiAgICAgICAgLyogVW5lIGZlbsOqdHJlIHBldXQgZW5jb3JlIGFycml2ZXIgOiBvbiBhdHRlbmQgbGEgc3VpdmFudGUgcGx1dMO0dCBxdWUgZGVcbiAgICAgICAgICAgYm91Y2xlciDDoCB2aWRlIHN1ciBjZWxsZXMgcXUnb24gYSBkw6lqw6Agw6ljYXJ0w6llcy4gKi9cbiAgICAgICAgYXdhaXQgYXBwbGljYXRpb24ud2FpdEZvckV2ZW50KCd3aW5kb3cnLCB7IHRpbWVvdXQ6IDJfMDAwIH0pLmNhdGNoKCgpID0+IHVuZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIltFMkVdIEF1Y3VuZSBmZW7DqnRyZSBkJ2FwcGxpY2F0aW9uIHRyb3V2w6llIOKAlCBzZXVsZXMgZGVzIERldlRvb2xzIHNlIHNvbnQgb3V2ZXJ0ZXMuXCIsXG4gICAgKTtcbn1cblxuLyoqXG4gKiBMJ2Vudmlyb25uZW1lbnQgZHUgcHJvY2Vzc3VzIGxhbmPDqSwgZMOpYmFycmFzc8OpIGRlIGNlIHF1aSBsZSBmZXJhaXQgZMOpcmFpbGxlci5cbiAqXG4gKiDim5QgKipgRUxFQ1RST05fUlVOX0FTX05PREVgIGZhaXQgZMOpbWFycmVyIEVsZWN0cm9uIGTDqWd1aXPDqSBlbiBOb2RlLioqIElsIHJlamV0dGVcbiAqIGFsb3JzIGxlcyBjb21tdXRhdGV1cnMgZGUgQ2hyb21pdW0g4oCUIFBsYXl3cmlnaHQgZW4gcGFzc2UgZGV1eCDigJQgZXQgbWV1cnQgc3VyXG4gKiDCqyBiYWQgb3B0aW9uOiAtLXJlbW90ZS1kZWJ1Z2dpbmctcG9ydD0wIMK7LCB1biBtZXNzYWdlIHF1aSBuZSBkaXQgcmllbiBkZSBsYVxuICogY2F1c2UuXG4gKlxuICogQ2UgZMOpcMO0dCBjb25uYcOudCBkw6lqw6AgY2UgcGnDqGdlIDogbGFuY2VyIGwnYXBwbGljYXRpb24gZGVwdWlzIHVuIHRlcm1pbmFsIHF1aVxuICogcG9ydGUgY2V0dGUgdmFyaWFibGUgZXhpZ2UgYGVudiAtdSBFTEVDVFJPTl9SVU5fQVNfTk9ERWAuIE9uIGxhIHJldGlyZSBkb25jXG4gKiBpY2kgcGx1dMO0dCBxdWUgZCdleGlnZXIgdW4gdGVybWluYWwgcGFydGljdWxpZXIg4oCUICp1bmUgcHLDqWNhdXRpb24gcXVpIGTDqXBlbmRcbiAqIGRlIHF1aSBsYW5jZSBsYSBjb21tYW5kZSBuJ2VzdCBwYXMgdW5lIHByw6ljYXV0aW9uLipcbiAqXG4gKiDim5QgKipFdCB0b3V0ZXMgbGVzIGBHTU9TXypgIGjDqXJpdMOpZXMgcGFydGVudCBhdmVjIGVsbGUuKiogTGUgcMOpcmltw6h0cmUgZCd1bmVcbiAqIGluc3RhbmNlIGRlIHRlc3QgZXN0IGTDqWNsYXLDqSBpY2ksIGVuIGVudGllciwganVzdGUgYXUtZGVzc3VzIDsgdW5lIHZhcmlhYmxlXG4gKiB2ZW51ZSBkdSB0ZXJtaW5hbCBzJ3kgYWpvdXRlcmFpdCBzYW5zIHF1ZSBwZXJzb25uZSBuZSBsJ2FpdCB2b3VsdS4gTGUgY2FzXG4gKiBjb25jcmV0IDogYEdNT1NfU0VNRU5DRWAsIHBvc8OpZSDDoCBsYSBtYWluIHBvdXIgdW5lIHLDqXDDqXRpdGlvbiwgZmVyYWl0IGTDqW1hcnJlclxuICogbGVzIHRlc3RzIHN1ciBsZXMgdnJhaWVzIGNhbXBhZ25lcyBkdSBtZW5ldXIuIEVsbGUgbmUgZMOpdHJ1aXJhaXQgcmllbiDigJQgbGFcbiAqIHNlbWVuY2UgbGl0IHVuIGZpY2hpZXIg4oCUIG1haXMgdW4gdGVzdCB2ZXJ0IG91IHJvdWdlIHNlbG9uIGxlIHNoZWxsIG5lIHByb3V2ZVxuICogcGx1cyByaWVuLiAqTGUgbcOqbWUgcmFpc29ubmVtZW50IHF1ZSBsYSBsaWduZSBkdSBkZXNzdXMsIGFwcGxpcXXDqSDDoCBub3NcbiAqIHByb3ByZXMgdmFyaWFibGVzLipcbiAqL1xuZnVuY3Rpb24gZW52aXJvbm5lbWVudFByb3ByZSgpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcbiAgICBjb25zdCBwcm9wcmU6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtjbGUsIHZhbGV1cl0gb2YgT2JqZWN0LmVudHJpZXMocHJvY2Vzcy5lbnYpKSB7XG4gICAgICAgIGlmIChjbGUgPT09ICdFTEVDVFJPTl9SVU5fQVNfTk9ERScpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoY2xlLnN0YXJ0c1dpdGgoJ0dNT1NfJykpIGNvbnRpbnVlO1xuICAgICAgICBpZiAodmFsZXVyICE9PSB1bmRlZmluZWQpIHByb3ByZVtjbGVdID0gdmFsZXVyO1xuICAgIH1cbiAgICAvKiBTYW5zIGVsbGUsIGBtYWluLnRzYCBjaGFyZ2VyYWl0IGxlIHNlcnZldXIgZGUgZGV2IGF1IGxpZXUgZGUgYGRpc3QvYC4gKi9cbiAgICBwcm9wcmUuVklURV9ERVZfU0VSVkVSX1VSTCA9ICcnO1xuICAgIHJldHVybiBwcm9wcmU7XG59XG5cbi8qKlxuICogUmVmdXNlIGRlIGNvbnRpbnVlciBzaSBsJ2FwcGxpY2F0aW9uIG4nw6ljcml0IHBhcyBkYW5zIGxlIHByb2ZpbCBqZXRhYmxlLlxuICpcbiAqIEVsbGUgaW50ZXJyb2dlIGxlICoqcHJvY2Vzc3VzIHByaW5jaXBhbCoqIOKAlCBzZXVsIGVuZHJvaXQgcXVpIGNvbm5haXNzZSBsYVxuICogdsOpcml0w6kg4oCUIHBsdXTDtHQgcXVlIGRlIHN1cHBvc2VyIHF1ZSBsZSBjb21tdXRhdGV1ciBhIMOpdMOpIHByaXMgZW4gY29tcHRlLlxuICovXG5hc3luYyBmdW5jdGlvbiB2ZXJpZmllckxJc29sYXRpb24oYXBwbGljYXRpb246IEVsZWN0cm9uQXBwbGljYXRpb24sIHByb2ZpbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcmV0ZW51ID0gYXdhaXQgYXBwbGljYXRpb24uZXZhbHVhdGUoKHsgYXBwIH0pID0+IGFwcC5nZXRQYXRoKCd1c2VyRGF0YScpKTtcblxuICAgIGNvbnN0IG5vcm1hbGlzZXIgPSAocDogc3RyaW5nKSA9PiBwYXRoLnJlc29sdmUocCkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIW5vcm1hbGlzZXIocmV0ZW51KS5zdGFydHNXaXRoKG5vcm1hbGlzZXIocHJvZmlsKSkpIHtcbiAgICAgICAgYXdhaXQgYXBwbGljYXRpb24uY2xvc2UoKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYFtFMkVdIOKblCBBUlLDilQgOiBsJ2FwcGxpY2F0aW9uIMOpY3JpdCBkYW5zIMKrICR7cmV0ZW51fSDCuyBldCBub24gZGFucyBsZSBwcm9maWwgamV0YWJsZSBgICtcbiAgICAgICAgICAgIGDCqyAke3Byb2ZpbH0gwrsuIEF1Y3VuIHRlc3QgbmUgZG9pdCB0b3VybmVyIHN1ciBsZXMgZG9ubsOpZXMgcsOpZWxsZXMuYCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKiBFdCBsZSBkb3NzaWVyIGRlcyBzYXV2ZWdhcmRlcywgcXVpIG4nZXN0IHBhcyBzb3VzIGB1c2VyRGF0YWAg4oCUIHZvaXIgbGVcbiAgICAgICBjb21tZW50YWlyZSBkZSBsYSB2YXJpYWJsZSBhdSBsYW5jZW1lbnQuICovXG4gICAgY29uc3Qgc2F1dmVnYXJkZXMgPSBhd2FpdCBhcHBsaWNhdGlvbi5ldmFsdWF0ZShcbiAgICAgICAgKCkgPT4gcHJvY2Vzcy5lbnYuR01PU19ET1NTSUVSX1NBVVZFR0FSREVTID8/ICcobm9uIHBvc8OpZSknLFxuICAgICk7XG4gICAgaWYgKCFub3JtYWxpc2VyKHNhdXZlZ2FyZGVzKS5zdGFydHNXaXRoKG5vcm1hbGlzZXIocHJvZmlsKSkpIHtcbiAgICAgICAgYXdhaXQgYXBwbGljYXRpb24uY2xvc2UoKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYFtFMkVdIOKblCBBUlLDilQgOiBsZXMgc2F1dmVnYXJkZXMgaXJhaWVudCBkYW5zIMKrICR7c2F1dmVnYXJkZXN9IMK7LCBob3JzIGR1IHByb2ZpbCBqZXRhYmxlLiBgICtcbiAgICAgICAgICAgIGBFbGxlcyB0b3VybmVudCA6IHVuIHRlc3Qgw6l2aW5jZXJhaXQgZGUgdnJhaWVzIHNhdXZlZ2FyZGVzLmAsXG4gICAgICAgICk7XG4gICAgfVxufVxuXG4vKipcbiAqIExlcyBsaWJlbGzDqXMgZXhhY3RzIGRlcyBib3V0b25zLCByZWxldsOpcyBkYW5zIGwnYXBwbGljYXRpb24uXG4gKlxuICog4pqg77iPICoqw4ljcml0cyBlbiBkdXIsIGV0IGMnZXN0IHZvdWx1LioqIExlcyBkw6lyaXZlciBkZSBsJ2FwcGxpY2F0aW9uIGxlcyBmZXJhaXRcbiAqIHMnYWNjb3JkZXIgYXZlYyBlbGxlIHF1b2kgcXUnZWxsZSBkZXZpZW5uZSDigJQgdW4gbW9kdWxlIHJlbm9tbcOpIG91IGRpc3BhcnUgbmVcbiAqIGZlcmFpdCBhbG9ycyBwbHVzIHJvdWdpciBwZXJzb25uZS4gKlVuZSBsaXN0ZSBhdHRlbmR1ZSBuJ2EgZGUgdmFsZXVyIHF1ZSBzaVxuICogZWxsZSBwZXV0IGNvbnRyZWRpcmUgbGUgY29kZS4qXG4gKi9cbmV4cG9ydCBjb25zdCBMRVNfUEFOTkVBVVggPSBbXG4gICAgJ1RhYmxlYXUgZGUgQm9yZCcsXG4gICAgJ0pvdXJuYWwgZGUgSmV1JyxcbiAgICAnRm9yZ2UnLFxuICAgICdNdXNpcXVlJyxcbiAgICAnRWZmZXRzIFNvbm9yZXMnLFxuICAgICdBbWJpYW5jZXMnLFxuICAgICdWb2ljZS1PUycsXG4gICAgJ0Zhdm9yaXMnLFxuICAgICdOZXh1cyBXaWtpJyxcbiAgICAnQ29ydGV4IElBJyxcbiAgICAnQ29tYmF0LU9TJyxcbiAgICAnRGljZS1PUycsXG4gICAgJ0fDqW7DqXJhdGV1ciBQTkonLFxuICAgICdDYXJ0b2dyYXBoaWUnLFxuICAgICdJbWFnZS1PUycsXG4gICAgJ0hvcmxvZ2UgJiBUZW1wcycsXG4gICAgJ0xpZ2h0LU9TJyxcbiAgICAnVGFibGVzIEFsw6lhdG9pcmVzJyxcbiAgICAnTmF2aWdhdGV1ciBXZWInLFxuICAgICdUYWJsZWF1IEJsYW5jJyxcbl0gYXMgY29uc3Q7XG5cbi8qKlxuICogKipVbmUgdGFibGV0dGUgZGUgcmVjZXR0ZSBxdWkgcmV2aWVudCwgYXZlYyBzb24gamV0b24gZGUgcmVwcmlzZSoqIOKAlCBjb21tZSB1bmVcbiAqIHZyYWllIHRhYmxldHRlIHJlY2hhcmfDqWUgKDIwMjYtMTAtMjIpLlxuICpcbiAqIERlcHVpcyBsZSB0cmFuc3BvcnQgcHJpdsOpIGRlcyBtb2R1bGVzIChgYTEyOGM3YWZgKSwgbGUgc2VydmV1ciByZWZ1c2UgdW5cbiAqIGlkZW50aWZpYW50IGNvbm51IHF1aSByZXZpZW50ICoqc2FucyoqIHNvbiBqZXRvbiAoYHJlcHJpc2VfcmVmdXNlZWApIDogYydlc3RcbiAqIGNlIHF1aSBlbXDDqmNoZSB1bmUgYXV0cmUgdGFibGV0dGUgZGUgc2UgZmFpcmUgcGFzc2VyIHBvdXIgY2VsbGUtY2kuIExlc1xuICogcmVjZXR0ZXMgVDAvVDQgcmVwcmVuYWllbnQgbGUgbcOqbWUgaWRlbnRpZmlhbnQgZGFucyB1biBzdG9ja2FnZSBuZXVmIMOgIGNoYXF1ZVxuICogZXNzYWkgOiBzZXVsIGxlIHByZW1pZXIgcGFzc2FpdCwgbGVzIHN1aXZhbnRzIHJlc3RhaWVudCBzdXIgwqsgQXVjdW4gUEpcbiAqIGTDqXRlY3TDqSDCuywgc2FucyBsJ8OpdGF0IGR1IG1lbmV1ci5cbiAqL1xuY29uc3QgSkVUT05TX0RFX1JFUFJJU0UgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJlc2VudGVyTGFUYWJsZXR0ZShjaWJsZTogUGFnZSB8IEJyb3dzZXJDb250ZXh0LCBpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgY2libGUuYWRkSW5pdFNjcmlwdCgoW2FwcGFyZWlsLCBqZXRvbl0pID0+IHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2dtb3MtdGFibGV0LXV1aWQnLCBhcHBhcmVpbCk7XG4gICAgICAgIGlmIChqZXRvbikgbG9jYWxTdG9yYWdlLnNldEl0ZW0oYGdtb3M6cmVwcmlzZS1tb2R1bGVzOiR7YXBwYXJlaWx9YCwgamV0b24pO1xuICAgIH0sIFtpZCwgSkVUT05TX0RFX1JFUFJJU0UuZ2V0KGlkKSA/PyAnJ10gYXMgW3N0cmluZywgc3RyaW5nXSk7XG59XG5cbi8qKiBSZXRpZW50IGxlIGpldG9uIHF1ZSBsZSBzZXJ2ZXVyIHZpZW50IGRlIHJlbWV0dHJlIMOgIGNldHRlIHRhYmxldHRlLCBwb3VyIHNvbiBwcm9jaGFpbiByZXRvdXIuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmV0ZW5pckxhVGFibGV0dGUocGFnZTogUGFnZSwgaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGpldG9uID0gYXdhaXQgcGFnZS53YWl0Rm9yRnVuY3Rpb24oXG4gICAgICAgIGFwcGFyZWlsID0+IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGBnbW9zOnJlcHJpc2UtbW9kdWxlczoke2FwcGFyZWlsfWApLCBpZCwgeyB0aW1lb3V0OiAxMF8wMDAgfSxcbiAgICApLnRoZW4oaCA9PiBoLmpzb25WYWx1ZSgpIGFzIFByb21pc2U8c3RyaW5nIHwgbnVsbD4pLmNhdGNoKCgpID0+IG51bGwpO1xuICAgIGlmIChqZXRvbikgSkVUT05TX0RFX1JFUFJJU0Uuc2V0KGlkLCBqZXRvbik7XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLFNBQVNBLFNBQVMsSUFBSUMsUUFBUSxRQUFnRixrQkFBa0I7QUFDaEksT0FBT0MsRUFBRSxNQUFNLFNBQVM7QUFDeEIsT0FBT0MsRUFBRSxNQUFNLFNBQVM7QUFDeEIsT0FBT0MsSUFBSSxNQUFNLFdBQVc7QUFDNUIsU0FBU0MsYUFBYSxRQUFRLFVBQVU7O0FBRXhDO0FBQ0EsTUFBTUMsR0FBRyxHQUFHRixJQUFJLENBQUNHLE9BQU8sQ0FBQ0YsYUFBYSxDQUFDRyxNQUFNLENBQUNDLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUM7O0FBRXhEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxNQUFNQyxhQUFhLEdBQUcsdUJBQXVCOztBQUU3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sTUFBTUMsZUFBZSxHQUFHUixJQUFJLENBQUNTLElBQUksQ0FBQ1AsR0FBRyxFQUFFLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQztBQWdDaEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLGVBQWVRLFVBQVVBLENBQUNDLE9BQTJCLEdBQUcsQ0FBQyxDQUFDLEVBQXNCO0VBQUEsSUFBQUMscUJBQUEsRUFBQUMsaUJB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