#!/usr/bin/env node
/**
 * **`npm run repetition` — GM-OS avec tes données, et rien à perdre.**
 *
 * Ouvre une instance **jetable** : profil neuf, semé depuis ta dernière
 * sauvegarde automatique, appareils muets, ports décalés. Tu peux donc ouvrir
 * une campagne, cliquer partout, casser ce que tu veux — et fermer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ RECRÉÉE À CHAQUE FOIS, JAMAIS ENTRETENUE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le profil est créé au lancement et **supprimé à la fermeture**. C'est
 * délibéré : *un environnement parallèle qu'on garde dérive — d'autres réglages,
 * d'autres données, d'autres pilotes — et finit par donner une confiance qu'il
 * ne mérite pas.* Repartir de la sauvegarde du jour coûte trois secondes et ne
 * ment jamais.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI EST ISOLÉ, ET CE QUI NE PEUT PAS L'ÊTRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Isolé : la base, le stockage local, le coffre des clés, les médias, les
 * sauvegardes, le corpus de règles, le coffre Obsidian, les lampes et
 * l'afficheur, les deux ports.
 *
 * ⚠️ **Pas isolé — et il faut le savoir** : les tablettes déjà appairées
 * pourraient joindre cette instance si elles cherchent son port ; un envoi vers
 * un service externe partirait pour de vrai si une clé se trouvait dans le
 * profil (il est vide, donc non). *L'inventaire vaut pour ce qui a été cherché.*
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/*
  ⚠️ **Ce chemin est le même que celui de `electron/sauvegardeAutomatique.ts`**,
  et c'est une duplication assumée : un script `.mjs` ne peut pas importer du
  TypeScript sans outillage. `GMOS_DOSSIER_SAUVEGARDES` le déplace des deux
  côtés, et un argument sur la ligne de commande a le dernier mot.
*/
const DOSSIER_DES_SAUVEGARDES =
    process.env.GMOS_DOSSIER_SAUVEGARDES || 'C:\\Projet_David\\Security_Backup_GMOS';

/** Ports décalés : une répétition ne doit pas voler les tablettes du vrai GM-OS. */
const PORT_SYNC = '4200';
const PORT_FICHES = '4201';

function derniereSauvegarde(dossier) {
    if (!fs.existsSync(dossier)) return null;
    const fichiers = fs.readdirSync(dossier)
        .filter(n => /^gmos-auto-.*\.json$/.test(n))
        .sort();
    return fichiers.length ? path.join(dossier, fichiers[fichiers.length - 1]) : null;
}

function principal() {
    const entree = path.join(RACINE, 'dist-electron', 'main.js');
    if (!fs.existsSync(entree)) {
        console.error('⛔ dist-electron/main.js est absent. Lance `npm run build` d’abord.');
        process.exit(1);
    }

    const semence = process.argv[2] ?? derniereSauvegarde(DOSSIER_DES_SAUVEGARDES);
    if (semence && !fs.existsSync(semence)) {
        console.error(`⛔ Semence introuvable : ${semence}`);
        process.exit(1);
    }

    const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-repetition-'));

    console.log('🎭 Répétition — instance jetable');
    console.log(`   profil   : ${profil}`);
    console.log(`   semence  : ${semence ?? '(aucune — base vide)'}`);
    console.log(`   ports    : ${PORT_SYNC} / ${PORT_FICHES}`);
    console.log('   appareils: muets\n');

    const env = { ...process.env };
    /* Sinon Electron démarre déguisé en Node et meurt sur un commutateur de
       Chromium, avec un message qui ne dit rien de la cause. */
    delete env.ELECTRON_RUN_AS_NODE;
    /* Sans ça, `main.ts` chargerait le serveur de dev au lieu de `dist/`. */
    env.VITE_DEV_SERVER_URL = '';
    /*
      La console de l'écran arrive dans ce terminal.

      ⛔ Sans elle, une répétition qui échoue est **muette** : la première
      tentative du 11/09 a rendu un journal principal où seule la lecture de la
      semence apparaissait, sans une ligne de l'écran pour dire ce qu'il en
      avait fait. *Un environnement d'essai qu'on ne peut pas interroger ne
      vaut pas mieux que pas d'environnement du tout.*
    */
    env.ELECTRON_ENABLE_LOGGING = '1';

    Object.assign(env, {
        GMOS_PORT_SYNC: PORT_SYNC,
        GMOS_PORT_FICHES: PORT_FICHES,
        GMOS_DOSSIER_SAUVEGARDES: path.join(profil, 'sauvegardes'),
        GMOS_RACINE_DOCS: path.join(profil, 'corpus'),
        GMOS_COFFRE_OBSIDIAN: path.join(profil, 'coffre'),
        GMOS_SANS_APPAREILS: '1',
    });
    if (semence) env.GMOS_SEMENCE = semence;

    const enfant = spawn(require('electron'), [entree, `--user-data-dir=${profil}`], {
        cwd: RACINE,
        env,
        stdio: 'inherit',
    });

    const nettoyer = () => {
        try {
            fs.rmSync(profil, { recursive: true, force: true });
            console.log(`\n🧹 Profil jeté : ${profil}`);
        } catch (err) {
            console.warn(`⚠️ Profil non supprimé (${profil}) :`, err.message);
        }
    };

    enfant.on('exit', code => { nettoyer(); process.exit(code ?? 0); });
    /* Ctrl+C doit jeter le profil lui aussi, sinon le temporaire se remplit. */
    process.on('SIGINT', () => enfant.kill());
}

principal();
