/**
 * **La santé qui passe sous zéro** — Argyropée, 12/11/2026 (écart SAN-02 de la
 * campagne de recette, registre § 240).
 *
 * Le livre 2, *Règles & Bestiaire*, p. 52-53 : les dégâts se retirent des Points
 * de Santé ; **strictement sous zéro, l'avatar sombre dans l'inconscience** — il
 * ne meurt pas. À zéro, il reste conscient mais ne fait que se traîner, parler
 * faiblement ou tenter un soin. La mort vient d'un coup d'achèvement, d'un coup
 * porté pour tuer ou d'un péril absolu : **le Conteur la déclare**, aucun total ne
 * la décide. Le livre ne fixe aucun plancher sous zéro.
 *
 * GM-OS bornait les points de vie à 0 et y écrivait l'état `dead` pour tous les
 * jeux : santé 4, coup de 5, le personnage passait à 0 « K.O » au lieu de −1
 * inconscient — et l'Exubérance, qui se refuse sous zéro (p. 86,
 * `obstacleALExuberance`), ne voyait jamais un total négatif.
 *
 * **Une seule règle, plusieurs lecteurs.** Le moteur de santé (`handleHP`), la
 * santé lue sur la fiche (`santePrincipaleDeLaFiche`), la synchronisation des PV
 * (`syncHealthSystem`, `updateCharacterHP`, `updateEntityHP`) et Combat-OS
 * (`pointsDeVieApres`, `estHorsDeCombat`) lisent tous ce module. La santé porte le
 * drapeau `data.sousZero`, posé là où l'on connaît le pilote : le moteur de santé,
 * qui ne le connaît pas, le lit sur la santé elle-même.
 */

/** Ce qu'il faut savoir du pilote — la forme minimale, pour ne fermer aucun cycle d'import. */
interface PiloteDeLaSante {
    jet?: { argyropee?: { sante?: string } };
    combat?: { statsToTrack?: readonly { fieldId: string; isMainHP?: boolean }[] };
}

/**
 * Le jeu laisse-t-il la santé principale passer sous zéro ? Aujourd'hui, Argyropée :
 * `jet.argyropee.sante` désigne les Points de Santé (p. 52). Si le pilote nomme une
 * autre santé principale, la règle ne s'applique pas à celle-ci.
 */
export function laSantePasseSousZero(pilote: PiloteDeLaSante | null | undefined): boolean {
    const champ = pilote?.jet?.argyropee?.sante;
    if (!champ) return false;
    const principale = pilote?.combat?.statsToTrack?.find(s => s.isMainHP)?.fieldId;
    return !principale || principale === champ;
}

/** La santé porte-t-elle la règle ? Le drapeau voyage avec elle, jusque sur le plateau. */
export function santeSousZero(sante: { type?: string; data?: Record<string, unknown> } | null | undefined): boolean {
    return sante?.type === 'hp' && sante.data?.sousZero === true;
}

/** Poser la règle sur une santé en points de vie, si le pilote la déclare. Sinon, rien ne change. */
export function marquerSousZero<S extends { type: string; data: Record<string, unknown> }>(
    sante: S,
    pilote: PiloteDeLaSante | null | undefined,
): S {
    if (sante.type !== 'hp' || sante.data.sousZero === true || !laSantePasseSousZero(pilote)) return sante;
    return { ...sante, data: { ...sante.data, sousZero: true } };
}

/**
 * Les points de vie bornés : au maximum toujours, à zéro seulement si le jeu ne
 * laisse pas passer dessous.
 */
export function bornerLesPointsDeVie(courant: number, max: number, sousZero: boolean): number {
    const plafond = Math.min(max, courant);
    return sousZero ? plafond : Math.max(0, plafond);
}

/**
 * Le mot de l'état quand la règle s'applique : sous zéro, **inconscient** ; à zéro,
 * **à terre** (p. 52). `null` au-dessus de zéro ou sans la règle : l'écran garde son mot.
 */
export function motDeLaSanteSousZero(sante: { type?: string; data?: Record<string, unknown> } | null | undefined): string | null {
    if (!santeSousZero(sante)) return null;
    const courant = Number(sante!.data!.current);
    if (!Number.isFinite(courant) || courant > 0) return null;
    return courant < 0 ? 'Inconscient' : 'À terre';
}

/** Inconscient : la règle s'applique et la santé est strictement sous zéro. */
export function estInconscient(sante: { type?: string; data?: Record<string, unknown> } | null | undefined): boolean {
    return motDeLaSanteSousZero(sante) === 'Inconscient';
}
