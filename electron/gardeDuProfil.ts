import path from 'node:path';

/**
 * **La garde d'exécution sur le chemin de données.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI ELLE EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le 2026-09-11, GM-OS a verrouillé le profil `gm-os-v6` au lieu de
 * `gm-os-v5` : un singleton exporté appelait `app.getPath` à l'import, donc
 * avant que `main.ts` ne pose `app.name`. L'application a démarré **sans rien
 * dire**, sur un profil vide, et David a trouvé une campagne de démonstration à
 * la place de ses sept.
 *
 * ⛔ **Rien n'était perdu — tout était ailleurs, et rien ne le disait.** C'est
 * ce silence-là que ce module supprime : le profil réellement verrouillé est
 * **écrit au journal à chaque démarrage**, et s'il n'est pas celui qu'on
 * attend, l'application **refuse de continuer** au lieu d'écrire à côté.
 *
 * Le test de source [`verrouDuCheminDeDonnees.test.ts`] interdit les deux formes
 * connues du défaut. Il ne peut pas interdire les autres : *un module peut
 * toujours résoudre le chemin depuis une fonction appelée au niveau module.*
 * Celui-ci ne lit pas le code, il regarde le résultat — il attrape donc les
 * formes qu'on n'a pas prévues.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE, ET POURQUOI ELLE A DEUX SENS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `npm run repetition` et les tests de bout en bout passent `--user-data-dir` :
 * leur profil **n'est légitimement pas** celui du meneur. Une garde qui exigerait
 * `gm-os-v5` sans distinguer les empêcherait tous de démarrer.
 *
 * D'où une seule comparaison, lue dans les deux sens :
 *
 * > **Le verrou doit porter sur le vrai profil exactement quand aucune isolation
 * > n'a été demandée.**
 *
 * | `--user-data-dir` | Profil verrouillé | Verdict |
 * | --- | --- | --- |
 * | absent | le vrai | ✅ démarrage ordinaire |
 * | absent | un autre | ⛔ **le défaut du 11/09** — on écrirait à côté |
 * | présent | un autre | ✅ répétition ou test, bien isolé |
 * | présent | **le vrai** | ⛔ isolation ratée — *un essai s'apprête à écrire dans les vraies données* |
 *
 * ⚠️ La dernière ligne n'est pas une symétrie gratuite. `lancerGmOs.ts` vérifie
 * l'isolation **depuis Playwright** ; `scripts/repetition.mjs` ne la vérifie pas
 * du tout. Posée ici, la vérification vaut pour tout ce qui démarre GM-OS,
 * présent et à venir — *un contrôle placé dans l'appelant ne couvre que cet
 * appelant.*
 */

/** Le nom du profil du meneur — celui que `main.ts` pose dans `app.name`. */
export const PROFIL_ATTENDU = 'gm-os-v5';

export type VerdictDuProfil = {
    /** Faux : l'application doit s'arrêter avant d'écrire quoi que ce soit. */
    accepte: boolean;
    /** Une isolation a-t-elle été demandée en ligne de commande ? */
    isole: boolean;
    /** Ce qui part au journal — accepté ou non. Il nomme toujours le profil. */
    motif: string;
};

/**
 * `--user-data-dir` a-t-il été passé ?
 *
 * Les deux écritures sont acceptées (`--user-data-dir=X` et `--user-data-dir X`)
 * parce que Chromium accepte les deux : *reconnaître une seule forme rendrait la
 * garde fausse pour l'autre, et une garde fausse arrête les essais.*
 */
export function isolationDemandee(argv: readonly string[]): boolean {
    return argv.some(a => a === '--user-data-dir' || a.startsWith('--user-data-dir='));
}

/**
 * Deux chemins désignent-ils le même dossier ?
 *
 * ⚠️ La casse n'est ignorée que là où le système de fichiers l'ignore. Sur un
 * disque sensible à la casse, replier les deux chemins ferait passer deux
 * dossiers distincts pour un seul — et cette égalité-là **autorise ou refuse un
 * démarrage**.
 */
function memeChemin(a: string, b: string): boolean {
    const resolu = (p: string) => (path.sep === path.win32.sep ? path.resolve(p).toLowerCase() : path.resolve(p));
    return resolu(a) === resolu(b);
}

export function verdictDuProfil(entree: {
    /** Ce que `app.getPath('userData')` vient de verrouiller. */
    profilVerrouille: string;
    /** Là où vivent les données du meneur : `appData` + `PROFIL_ATTENDU`. */
    profilReel: string;
    argv: readonly string[];
}): VerdictDuProfil {
    const { profilVerrouille, profilReel, argv } = entree;
    const isole = isolationDemandee(argv);
    const surLeVrai = memeChemin(profilVerrouille, profilReel);

    if (isole) {
        return surLeVrai
            ? {
                accepte: false,
                isole,
                motif:
                    `⛔ ISOLATION RATÉE : --user-data-dir a été passé, mais le profil verrouillé est ` +
                    `le VRAI profil du meneur (« ${profilVerrouille} »). Une instance d'essai ` +
                    `écrirait dans les vraies données. Arrêt.`,
            }
            : {
                accepte: true,
                isole,
                motif: `Profil isolé verrouillé : « ${profilVerrouille} » (--user-data-dir).`,
            };
    }

    return surLeVrai
        ? {
            accepte: true,
            isole,
            motif: `Profil verrouillé : « ${profilVerrouille} ».`,
        }
        : {
            accepte: false,
            isole,
            motif:
                `⛔ PROFIL INATTENDU : GM-OS a verrouillé « ${profilVerrouille} » alors que les ` +
                `données du meneur vivent dans « ${profilReel} ». C'est le défaut du 2026-09-11 : ` +
                `un appel à app.getPath avant que app.name ne soit posé. Arrêt avant d'écrire — ` +
                `rien n'est perdu, tout est dans le vrai profil.`,
        };
}
