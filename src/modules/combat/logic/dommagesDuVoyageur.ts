import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { armesDuVoyageur, type ArmeDuVoyageur } from './armesDuVoyageur';

/*
  **Le +dom d'une attaque de Rêve de Dragon** — registre § 267, T15 (23/11/2026), livre 2.3.1, pages
  imprimées (PDF = imprimée + 1).

  - Les dommages : 2d10 + (+dom total) − (protection) ; un +dom entre parenthèses (corps à corps, gourdin,
    fouet) passe par la table des Coups non mortels (p. 128).
  - Tir : le +dom de l'arme seul, ni +dom personnel ni condition (p. 128). Lancer : l'arme et le +dom
    personnel, sans dépasser le double du +dom de l'arme, sans condition (p. 128-129). Mêlée : l'arme et le
    +dom personnel, sans limite, et les bonus de condition (p. 129).
  - Une particulière en force ajoute +5 si la défense est manquée ; au tir et au lancer, elle est toujours en
    force (p. 125-126).
  - Les conditions de la table (p. 129) : surprise +10, demi-surprise +1, charge +2, feinte +1.

  Ce fichier ne lance rien : le jet d'encaissement reste celui du suivi de santé de la cible
  (`proposerEncaissement`), qui tire ses 2d10 et lit la table.
*/

export type ConditionDuVoyageur = 'aucune' | 'surprise' | 'demi-surprise' | 'charge' | 'feinte';
export const CONDITIONS_DU_VOYAGEUR: readonly { cle: ConditionDuVoyageur; libelle: string; bonus: number }[] = [
    { cle: 'aucune', libelle: 'Aucune condition', bonus: 0 },
    { cle: 'surprise', libelle: 'Surprise (+10)', bonus: 10 },
    { cle: 'demi-surprise', libelle: 'Demi-surprise (+1)', bonus: 1 },
    { cle: 'charge', libelle: 'Charge (+2)', bonus: 2 },
    { cle: 'feinte', libelle: 'Feinte (+1)', bonus: 1 },
];

export interface ArmeDOffense extends ArmeDuVoyageur {
    /** Le +dom de l'arme, lu sur la ligne de combat de la fiche ; `undefined` s'il n'y est pas. */
    dom?: number;
    /** Un +dom écrit entre parenthèses : la table des Coups non mortels (p. 128). */
    nonMortel: boolean;
}

/** Les armes offensives de la fiche, avec le +dom de leur ligne (`combat_<i>_damage`). */
export function armesDOffense(valeurs: Record<string, unknown>, fiche: SheetTemplate): ArmeDOffense[] {
    const champs = fiche.sections.find(s => s.id === 'combat')?.fields ?? [];
    return armesDuVoyageur(valeurs, fiche).map(a => {
        const i = champs.findIndex(c => c.id === a.cle);
        const brut = String(valeurs[`combat_${i}_damage`] ?? '').trim();
        const lu = /[+-]?\d+/.exec(brut);
        return { ...a, ...(lu ? { dom: Number(lu[0]) } : {}), nonMortel: brut.includes('(') };
    });
}

/** L'attaque proposée : la caractéristique dérivée et la compétence de la première arme offensive. */
export function attaqueDuVoyageur(valeurs: Record<string, unknown>, fiche: SheetTemplate): Record<string, string> | null {
    const arme = armesDuVoyageur(valeurs, fiche)[0];
    return arme ? { caracteristique: arme.categorie, competences_gen: arme.cle } : null;
}

/** Le +dom total d'une attaque, et son calcul dit. */
export function domTotal(p: {
    categorie: ArmeDuVoyageur['categorie']; domArme: number; domPersonnel: number; enForce: boolean; condition: ConditionDuVoyageur;
}): { total: number; calcul: string } {
    const arme = Math.trunc(p.domArme), perso = Math.trunc(p.domPersonnel);
    const parties = [`arme ${arme >= 0 ? '+' : ''}${arme}`];
    let total = arme;
    if (p.categorie !== 'tir') {
        let ajout = perso;
        // Au lancer, le total ne dépasse pas le double du +dom de l'arme (p. 129).
        if (p.categorie === 'lancer' && arme + perso > 2 * arme) ajout = Math.max(0, 2 * arme - arme);
        total += ajout;
        parties.push(`personnel ${perso >= 0 ? '+' : ''}${perso}${ajout !== perso ? ` (limité à +${ajout}, double de l’arme)` : ''}`);
    }
    if (p.enForce) { total += 5; parties.push('particulière en force +5'); }
    const condition = CONDITIONS_DU_VOYAGEUR.find(c => c.cle === p.condition);
    if (p.categorie === 'melee' && condition && condition.bonus) { total += condition.bonus; parties.push(`${condition.libelle.replace(/ \(.*/, '').toLowerCase()} +${condition.bonus}`); }
    return { total, calcul: `${parties.join(', ')} = +dom ${total >= 0 ? '+' : ''}${total}` };
}

/** La protection de la cible : la meilleure de ses armures portées (`equipment_armor_<i>_protection`). */
export function protectionDuVoyageur(valeurs: Record<string, unknown>): number {
    return Math.max(0, ...[0, 1, 2].map(i => Number(valeurs[`equipment_armor_${i}_protection`])).filter(Number.isFinite));
}
