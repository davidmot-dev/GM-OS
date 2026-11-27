/**
 * **Les dégâts d'une attaque de Traveller** — TRV-A2, 27/11/2026. David : « commence TRV-A1 et
 * TRV-A2 », puis ses choix du même jour (spécification `2026-11-27-traveller-jets-demandes-et-degats.md`) :
 * AP, armes destructrices, Incapacitante **et** la rafale.
 *
 * Relu dans le livre de règles français v2.2 (page imprimée) :
 * - les dés de l'arme, plus l'**Effet** du jet d'attaque ; en mêlée, plus le **MD de FOR** de
 *   l'attaquant « en plus de l'Effet » (p. 74) ;
 * - l'**armure** retranche son niveau de protection ; une arme **AP** en ignore autant que son
 *   niveau ; une attaque d'**Effet 6+** inflige toujours **au moins un point** (p. 75) ;
 * - une arme **destructrice** (« 3DD ») lance ses dés et « multiplie le total des dégâts obtenus
 *   par 10 » (p. 75) : le ×10 porte sur les dés lancés (et le bonus de l'arme), avant l'Effet ;
 * - **Rafale** : « ajouter le niveau Auto aux dégâts », et autant de munitions consommées (p. 76).
 *
 * Calcul pur : la carte (`DegatsDeTraveller.tsx`) lance, montre et applique par la porte des dégâts
 * (§ 278), qui répartit END → FOR/DEX et garde Incapacitante sur l'END.
 */

/** « 3D-3 », « 1D+2 », « 2D », « 1DD » : le nombre de dés, le bonus fixe, et si l'arme est destructrice. */
export interface DesDeDegats {
    des: number;
    bonus: number;
    destructrice: boolean;
}

/** Lit la colonne « Dégâts » d'une arme (fiche ou catalogue). `null` pour un texte qui n'en est pas. */
export function lireLesDegats(texte: unknown): DesDeDegats | null {
    const t = String(texte ?? '').replace(/\s+/g, '').replace(/[−–]/g, '-').toUpperCase();
    const m = /^(\d{1,2})D(D?)(?:([+-])(\d{1,3}))?$/.exec(t);
    if (!m) return null;
    const des = Number(m[1]);
    if (des < 1) return null;
    return { des, bonus: m[3] ? (m[3] === '-' ? -1 : 1) * Number(m[4]) : 0, destructrice: m[2] === 'D' };
}

/** Ce que les traits d'une arme changent aux dégâts ; les autres sont rappelés au meneur. */
export interface TraitsDeLArme {
    /** Arme Perforante : protection ignorée (p. 75). */
    ap: number;
    /** Niveau Auto : la rafale l'ajoute aux dégâts (p. 76). */
    auto: number;
    /** Dégâts sur l'END seule (p. 76) — la porte des dégâts le sait déjà. */
    incapacitante: boolean;
    /** Les traits que le calcul n'applique pas : Explosion, Rayonnement, Viseur, Encombrante… */
    autres: string[];
}

/** Lit « AP 3, Auto 2 », « Incapacitante », « Explosion 9, Rayonnement ». */
export function lireLesTraits(texte: unknown): TraitsDeLArme {
    const traits: TraitsDeLArme = { ap: 0, auto: 0, incapacitante: false, autres: [] };
    for (const brut of String(texte ?? '').split(/[,;]/)) {
        const trait = brut.trim();
        if (!trait || trait === '—' || trait === '-') continue;
        const ap = /^AP\s*(\d+)$/i.exec(trait);
        const auto = /^Auto\s*(\d+)$/i.exec(trait);
        if (ap) traits.ap = Number(ap[1]);
        else if (auto) traits.auto = Number(auto[1]);
        else if (/^incapacitante?$/i.test(trait)) traits.incapacitante = true;
        else traits.autres.push(trait);
    }
    return traits;
}

/** Une ligne du calcul, telle que la carte la montre. */
export interface DetailDesDegats {
    /** Les dés lancés et leur somme. */
    lances: number[];
    /** Dés + bonus de l'arme, ×10 pour une arme destructrice. */
    deLArme: number;
    effet: number;
    /** Le MD de FOR, en mêlée seulement. */
    force: number;
    /** Le niveau Auto, en rafale seulement. */
    rafale: number;
    /** Avant l'armure. */
    brut: number;
    /** Protection de la cible, moins l'AP de l'arme, jamais sous 0. */
    protection: number;
    /** Ce que la cible perd. */
    net: number;
    /** Vrai quand le minimum d'un point (Effet 6+) a joué. */
    minimum: boolean;
}

/**
 * **Le calcul.** `lances` sont les dés déjà tirés (un par dé de l'arme). L'Effet est celui du jet
 * d'attaque réussi (0 ou plus) : une attaque ratée n'inflige rien, et la carte ne s'ouvre pas.
 */
export function calculerLesDegats(entree: {
    degats: DesDeDegats;
    lances: readonly number[];
    effet: number;
    /** MD de FOR de l'attaquant, si l'attaque est de mêlée. */
    mdDeForceEnMelee?: number;
    /** Niveau Auto, si le tireur fait une rafale. */
    rafale?: number;
    /** Protection de la cible (son armure, ou le trait Armure d'un animal). */
    protection: number;
    ap?: number;
}): DetailDesDegats {
    const { degats, lances } = entree;
    const somme = lances.reduce((t, v) => t + v, 0);
    const deLArme = (somme + degats.bonus) * (degats.destructrice ? 10 : 1);
    const effet = Math.max(0, Math.trunc(entree.effet));
    const force = Math.trunc(entree.mdDeForceEnMelee ?? 0);
    const rafale = Math.max(0, Math.trunc(entree.rafale ?? 0));
    const brut = Math.max(0, deLArme + effet + force + rafale);
    const protection = Math.max(0, Math.trunc(entree.protection) - Math.max(0, Math.trunc(entree.ap ?? 0)));
    const apresArmure = Math.max(0, brut - protection);
    const minimum = effet >= 6 && apresArmure < 1;
    return { lances: [...lances], deLArme, effet, force, rafale, brut, protection, net: minimum ? 1 : apresArmure, minimum };
}

/** Lance les dés de l'arme (`de` rend un d6 ; la carte lui passe le moteur). */
export function lancerLesDesDeLArme(degats: DesDeDegats, de: () => number): number[] {
    return Array.from({ length: degats.des }, de);
}

/** « 3 + 2 (Effet) + 1 (FOR) − 4 (armure) = 2 » — la ligne que la carte et le journal disent. */
export function decrireLesDegats(d: DetailDesDegats, degats: DesDeDegats): string {
    const parts = [`${d.deLArme}${degats.destructrice ? ' (×10)' : ''}`];
    if (d.effet) parts.push(`${d.effet} (Effet)`);
    if (d.force) parts.push(`${d.force < 0 ? '−' : ''}${Math.abs(d.force)} (FOR)`);
    if (d.rafale) parts.push(`${d.rafale} (rafale)`);
    const somme = parts.join(' + ').replace(/\+ −/g, '− ');
    const armure = d.protection ? ` − ${d.protection} (armure)` : '';
    return `${somme}${armure} = ${d.net}${d.minimum ? ' (Effet 6+ : au moins 1)' : ''}`;
}
