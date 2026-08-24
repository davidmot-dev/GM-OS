import { extraireJetons, cheminDuTheme, type JetonsDuJeu } from './jetonsDeTheme';

export { extraireJetons, pontVersLInterface, cheminDuTheme } from './jetonsDeTheme';
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
export async function chargerLeThemeDuJeu(racine: string): Promise<JetonsDuJeu | null> {
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
        return releve;
    } catch (err) {
        console.error(`[ThèmeDuJeu] Lecture de « ${cheminDuTheme(racine)} » impossible :`, err);
        return null;
    }
}
