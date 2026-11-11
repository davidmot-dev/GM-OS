import { estCritique, elleSeVide, type JaugeOrientee } from './sensDeLaJauge';

/**
 * **Le rappel d'un jet dû, porté par une jauge** — idées reprises de GM Codex,
 * lot 2 (`documentation/Planning/2026-11-11-rappel-de-jet-du.md`, registre § 244).
 *
 * Le meneur écrit sur une jauge **ce qu'il faudra lancer quand elle arrivera au
 * bout** — « Jet d'Endurance, tout le monde ». Au bout, le rappel paraît au
 * cockpit ; « Fait » ou « Écarter » l'éteignent. Décisions de David (11/11) :
 * **au bout seulement** (la règle commune `estCritique` : le plein pour une
 * jauge qui monte, le vide pour une qui s'épuise), **un texte libre**, et rien
 * à la table.
 *
 * ⭐ **Une fois par passage.** `traite` retient qu'on y a répondu ; la jauge
 * repartie du bout, le rappel se **réarme** (`rearmerLesRappels`) et reviendra
 * au prochain passage. Le réarmement vit dans un seul abonnement au magasin, qui
 * voit tous les écrivains des jauges — voir `useClockStore`.
 *
 * Tout ici est pur : le magasin écrit, les écrans lisent.
 */

/** Ce que le meneur a écrit sur la jauge, et s'il y a déjà répondu à ce passage. */
export interface RappelDeJauge {
    texte: string;
    traite?: boolean;
}

/** Le plus long rappel retenu : une consigne, pas une page. */
export const LONGUEUR_DU_RAPPEL = 200;

type JaugeARappel = JaugeOrientee & { id: string; name: string; rappel?: RappelDeJauge };

/** Le texte tel qu'il se garde : rogné, borné ; vide = pas de rappel. */
export function texteDuRappel(brut: string | null | undefined): string {
    return (brut ?? '').trim().slice(0, LONGUEUR_DU_RAPPEL);
}

/** Cette jauge porte-t-elle un rappel ? Un texte vide n'en est pas un. */
export function aUnRappel(jauge: { rappel?: RappelDeJauge }): boolean {
    return texteDuRappel(jauge.rappel?.texte) !== '';
}

/** Un rappel qui attend le meneur : la jauge, et ce qu'il faut lancer. */
export interface RappelEnAttente {
    jaugeId: string;
    nom: string;
    texte: string;
    /** Le bout atteint : `vide` pour une jauge qui s'épuise, `plein` sinon. */
    bout: 'plein' | 'vide';
}

/** **Les rappels à montrer** : au bout, avec un texte, pas encore traités. */
export function rappelsEnAttente(tensions: readonly JaugeARappel[] | undefined): RappelEnAttente[] {
    return (tensions ?? [])
        .filter(j => aUnRappel(j) && !j.rappel!.traite && estCritique(j))
        .map(j => ({ jaugeId: j.id, nom: j.name, texte: texteDuRappel(j.rappel!.texte), bout: elleSeVide(j) ? 'vide' : 'plein' }));
}

/**
 * **Réarme ce qui a quitté le bout.** Un rappel traité dont la jauge n'est plus
 * au bout redevient prêt pour le prochain passage.
 *
 * ⛔ **Rend le même tableau quand rien ne change** : l'abonnement qui l'appelle
 * écrit dans le magasin qu'il écoute ; un tableau neuf à chaque appel le ferait
 * tourner sans fin.
 */
export function rearmerLesRappels<T extends JaugeARappel>(tensions: T[]): T[] {
    if (!tensions.some(j => j.rappel?.traite && !estCritique(j))) return tensions;
    return tensions.map(j => (j.rappel?.traite && !estCritique(j) ? { ...j, rappel: { texte: j.rappel.texte } } : j));
}

/** Le rappel tel qu'il s'écrit après un réglage : `undefined` l'efface. */
export function rappelRegle(ancien: RappelDeJauge | undefined, brut: string | null): RappelDeJauge | undefined {
    const texte = texteDuRappel(brut);
    if (!texte) return undefined;
    // Changer le texte ne rouvre pas un passage déjà traité : on a répondu à ce bout-là.
    return { texte, ...(ancien?.traite ? { traite: true } : {}) };
}
