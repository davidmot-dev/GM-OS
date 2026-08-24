import {
    extraireJetons, cheminDuTheme, extraireImportsDePolice, premiereFamille,
    type JetonsDuJeu,
} from './jetonsDeTheme';

export {
    extraireJetons, pontVersLInterface, cheminDuTheme,
    extraireImportsDePolice, premiereFamille,
} from './jetonsDeTheme';
export type { JetonsDuJeu } from './jetonsDeTheme';

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
        return { ...releve, polices: extraireImportsDePolice(css) };
    } catch (err) {
        console.error(`[ThèmeDuJeu] Lecture de « ${cheminDuTheme(racine)} » impossible :`, err);
        return null;
    }
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
export async function verifierLesPolices(jetons: Record<string, string>): Promise<string[]> {
    if (typeof document === 'undefined' || !document.fonts) return [];

    try {
        await document.fonts.ready;
    } catch {
        return [];
    }

    const manquantes: string[] = [];
    for (const jeton of ['font-display', 'font-body', 'font-ui', 'font-mono']) {
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
