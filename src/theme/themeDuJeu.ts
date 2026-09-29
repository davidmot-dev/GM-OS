import {
    extraireJetons, cheminDuTheme, extraireImportsDePolice, premiereFamille,
    POLICES_APPLIQUEES, type JetonsDuJeu,
} from './jetonsDeTheme';

export {
    extraireJetons, pontVersLInterface, cheminDuTheme,
    extraireImportsDePolice, premiereFamille,
} from './jetonsDeTheme';
export type { JetonsDuJeu } from './jetonsDeTheme';
import { chargerLesOrnements, type Ornements } from './ornements';

/**
 * Charge le thème d'un système, s'il en a un.
 *
 * Rend `null` quand le jeu n'a pas de thème : **c'est le cas normal**, pas une
 * erreur. La plupart des jeux n'en auront jamais, et l'interface garde alors
 * son thème d'atelier. *Un absent silencieux, un incident bruyant.*
 *
 * Passe par `readDoc`, qui lit n'importe quel fichier sous `docs/` — aucun IPC
 * nouveau n'a été nécessaire.
 */
/** Ce que le chargeur rend : le relevé du thème, plus ses feuilles de police. */
export interface ThemeDuJeuCharge extends JetonsDuJeu {
    /** Les `@import` de polices retenus, à poser avec `poserLesPolices`. */
    polices: string[];
    /** Les ornements du § 8, vérifiés et incorporés — `{}` quand le jeu n'en a pas. */
    ornements: Ornements;
}

export async function chargerLeThemeDuJeu(racine: string): Promise<ThemeDuJeuCharge | null> {
    // Le type vient de `types/window.d.ts` : si la signature du pont change, ce
    // fichier cesse de compiler au lieu de rendre `null` en silence.
    const lire = typeof window === 'undefined' ? undefined : window.appBridge?.ai?.readDoc;
    if (!lire) return null;

    try {
        const css = await lire(cheminDuTheme(racine));
        if (!css) return null;

        const releve = extraireJetons(css);
        if (Object.keys(releve.jetons).length === 0) {
            console.warn(
                `[ThèmeDuJeu] « ${cheminDuTheme(racine)} » ne déclare aucun jeton --rpg-*. ` +
                'Vérifier que les variables sont dans un bloc `:root` ou `:root[data-theme="…"]`.',
            );
            return null;
        }
        /*
          Les polices voyagent avec le relevé : le hook ne doit pas avoir à
          relire le fichier pour les trouver, et surtout pas à savoir qu'un
          thème s'exprime en CSS.
        */
        const jetons = await incorporerLesMatieres(releve.jetons, lire, racine);
        const ornements = await chargerLesOrnements(lire, racine);
        return { ...releve, jetons, polices: extraireImportsDePolice(css), ornements };
    } catch (err) {
        console.error(`[ThèmeDuJeu] Lecture de « ${cheminDuTheme(racine)} » impossible :`, err);
        return null;
    }
}


/** Une matière du dossier du thème, en SVG : `url('matieres/grain.svg')`. */
const MATIERE_SVG = /^url\(\s*['"]?matieres\/([\w.-]+\.svg)['"]?\s*\)$/i;

/**
 * **Les matières du jeu, rendues lisibles depuis la page** — contrat v1.4,
 * P1.6, 2026-09-29.
 *
 * `url('matieres/grain.svg')` est relative au dossier du thème. Posée telle
 * quelle en variable sur le document, elle se résoudrait depuis la page et ne
 * trouverait rien — sans erreur visible. On lit donc le SVG par `readDoc`,
 * comme le thème lui-même, et on l'incorpore en adresse `data:`.
 *
 * Un dégradé ou `none` passent tels quels. Une image PNG ou WebP, permise par
 * le cahier, ne se lit pas en texte : écartée, et dite. *Un absent silencieux,
 * un incident bruyant.*
 */
export async function incorporerLesMatieres(
    jetons: Record<string, string>,
    lire: (chemin: string) => Promise<string | null | undefined>,
    racine: string,
): Promise<Record<string, string>> {
    const resultat = { ...jetons };
    for (const cle of ['texture-bg', 'texture-panel']) {
        const valeur = resultat[cle]?.trim();
        if (!valeur || !/^url\(/i.test(valeur)) continue;

        const m = MATIERE_SVG.exec(valeur);
        const svg = m ? await lire(`${racine}/theme/matieres/${m[1]}`).catch(() => null) : null;
        if (!svg) {
            console.warn(
                `[ThèmeDuJeu] Matière --rpg-${cle} écartée : ${valeur}. ` +
                'GM-OS sait incorporer un SVG du dossier `matieres/` ; une image PNG ou WebP, pas encore.',
            );
            delete resultat[cle];
            continue;
        }
        resultat[cle] = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    }
    return resultat;
}

/** L'attribut qui marque les feuilles de police posées par un thème de jeu. */
const MARQUE_POLICES = 'data-polices-du-jeu';

/**
 * **Pose les feuilles de police du thème, et retire celles du précédent.**
 *
 * Sans ça, la variable `--font-display` désigne une police que le navigateur
 * n'a jamais téléchargée : il retombe **en silence** sur le premier repli de la
 * pile. C'est ce que David a vu — les couleurs changeaient, la police non.
 *
 * On retire d'abord : deux campagnes successives laisseraient sinon leurs
 * feuilles s'empiler, et la page finirait par charger les polices de tous les
 * jeux jamais ouverts.
 */
export function poserLesPolices(urls: string[]): void {
    if (typeof document === 'undefined') return;

    document.head.querySelectorAll(`link[${MARQUE_POLICES}]`).forEach(l => l.remove());

    for (const href of urls) {
        const lien = document.createElement('link');
        lien.rel = 'stylesheet';
        lien.href = href;
        lien.setAttribute(MARQUE_POLICES, '');
        document.head.appendChild(lien);
    }
}

/**
 * **Rend bruyant un repli qui était muet.**
 *
 * Une police absente ne lève pas et ne se voit pas dans le code : le navigateur
 * substitue le repli suivant, et on croit le thème appliqué. Hors ligne — le
 * cas d'Electron en séance — Google Fonts ne répondra pas du tout.
 *
 * On attend `document.fonts.ready` : interroger avant que le chargement soit
 * fini rendrait un faux négatif à tous les coups.
 */
export async function verifierLesPolices(
    jetons: Record<string, string>,
    { personnalites = false }: { personnalites?: boolean } = {},
): Promise<string[]> {
    if (typeof document === 'undefined' || !document.fonts) return [];

    try {
        await document.fonts.ready;
    } catch {
        return [];
    }

    /*
      **On ne vérifie QUE les polices que le pont applique.**

      Signalé par David le 2026-08-24 : le thème Torg déclarait Libre Baskerville
      absente, alors qu'elle était correctement importée. Elle est affectée à
      `font-body`, que le pont ne transporte pas — donc **rien dans l'interface
      ne l'emploie, donc le navigateur ne la télécharge jamais**, et `check()`
      la déclarait manquante. Oswald, du même import mais affectée à
      `font-display`, ne posait aucun problème.

      Vérifier les quatre revenait à crier sur le cas normal, pour les cinq
      thèmes. *Un avertissement qui se déclenche sur le cas normal apprend à
      ignorer les avertissements* — la leçon du `GridEngine`, réapprise le même
      jour sur mon propre contrôle.
    */
    const manquantes: string[] = [];
    // Sous les personnalités, la police du corps est appliquée aussi (contrat v1.4) : elle se vérifie.
    const appliquees = personnalites ? [...POLICES_APPLIQUEES, 'font-body'] : POLICES_APPLIQUEES;
    for (const jeton of appliquees) {
        const famille = premiereFamille(jetons[jeton]);
        if (!famille) continue;
        // `check` veut une police complète ; la taille n'a aucune importance.
        if (!document.fonts.check(`16px "${famille}"`)) manquantes.push(famille);
    }

    if (manquantes.length > 0) {
        console.warn(
            `[ThèmeDuJeu] Polices non disponibles : ${manquantes.join(', ')}. ` +
            'Le navigateur emploie les replis de la pile — le thème paraîtra appliqué ' +
            'alors que sa typographie ne l’est pas. Hors ligne, héberger les polices ' +
            'localement (voir docs/ui/rpg-theme-sdk/README.md).',
        );
    }
    return manquantes;
}
