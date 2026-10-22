/** Secondes laissées pour lire un bilan sans alerte avant que l'écran se ferme seul. */
export const DELAI_DE_LECTURE_DU_BILAN = 8;

/**
 * Un bilan qui signale un manque — média introuvable, échec, import sans
 * sauvegarde préalable — se lit jusqu'au bout : l'écran ne se ferme pas seul.
 *
 * David, le 2026-10-22 : *« l'écran ne se referme plus automatiquement comme
 * avant »*. Le lot E6 gardait ouvert TOUT bilan, or un import en a toujours un
 * (la ligne de la sauvegarde préalable) : la fermeture automatique ne jouait
 * plus jamais. Un bilan sans histoire se ferme donc seul après un délai, et
 * reste de toute façon dans le journal (`consignerLeBilan`).
 */
export function bilanQuiAlerte(bilan: readonly string[] | undefined): boolean {
    return !!bilan?.some(ligne =>
        ligne.includes('⚠️')
        || ligne.includes('en échec')
        || ligne.startsWith('Aucune sauvegarde préalable'));
}
