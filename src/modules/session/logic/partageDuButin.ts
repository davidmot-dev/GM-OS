/**
 * **Partager une monnaie du butin entre les personnages présents** — retenu
 * par David le 2026-09-29, réglé le 2026-10-02.
 *
 * Chacun reçoit une **part entière** ; le reste de la division ne se coupe pas
 * en morceaux, il **reste dans le pool**, où le meneur le donne à la main. 450
 * crédits entre quatre : 112 chacun, et 2 qui attendent.
 *
 * Rend `null` quand il n'y a rien à partager : personne de présent, ou moins
 * d'une unité par personne. *Un partage où chacun reçoit zéro n'est pas un
 * partage, c'est un bouton qui ment.*
 */
export function partagerEquitablement(
    quantite: number,
    nombreDeBeneficiaires: number,
): { part: number; reste: number } | null {
    if (!Number.isFinite(quantite) || nombreDeBeneficiaires < 1) return null;
    const total = Math.floor(quantite);
    const part = Math.floor(total / nombreDeBeneficiaires);
    if (part < 1) return null;
    return { part, reste: total - part * nombreDeBeneficiaires };
}

/** Le type d'objet qui se partage : la monnaie, et elle seule. */
export const estUneMonnaie = (type: string | undefined): boolean => type === 'currency';
