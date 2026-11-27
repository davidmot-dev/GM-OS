/**
 * **Les dépenses et les durées de Traveller** — TRV-A6, 27/11/2026 (spécification
 * `2026-11-27-traveller-depenses-et-durees.md` ; décisions de David du 27/11 : « Les cinq »,
 * « Écrire « 26/30 » », « Heures saisies », « Oui, pilote 2.2.0 »). Livre de règles v2.2 :
 *
 * - **munitions** (p. 74-76) : le chargeur dit combien de coups partent avant de recharger ; une
 *   rafale en consomme autant que le niveau Auto, l'auto complet trois fois le niveau Auto ;
 * - **PSI** (p. 224-225) : le coût d'un pouvoir réussi, un point pour un échec ; ce qui passe sous
 *   zéro s'applique en dégâts ; sans point, pas de tentative ; récupération d'un point par heure,
 *   à partir de trois heures après la dernière utilisation ;
 * - **neutralisation** (Incapacitante, p. 76) : à 0 END, dégâts − END rounds sans agir ; guéri
 *   entièrement après une heure de repos ;
 * - **inconscience** (p. 80) : un test d'END par minute, MD+1 cumulatif par échec.
 *
 * Rien ici n'écrit : les cartes proposent, le meneur clique.
 */

const entier = (n: unknown) => Math.max(0, Math.trunc(Number(n) || 0));

// ─── Munitions ───────────────────────────────────────────────────────────────

export type ModeDeTir = 'simple' | 'rafale' | 'auto';

/** Les coups qu'un tir consomme : 1, le niveau Auto (rafale), trois fois le niveau Auto (auto complet). */
export function munitionsConsommees(mode: ModeDeTir, auto: number): number {
    const a = entier(auto);
    if (mode === 'rafale' && a > 0) return a;
    if (mode === 'auto' && a > 0) return 3 * a;
    return 1;
}

export interface Munitions { restants: number; capacite: number }

/**
 * **Le champ « munitions » de la fiche** (décision de David : « 26/30 »). « 26/30 » : 26 coups sur
 * un chargeur de 30 ; un nombre seul, tel qu'on l'écrit en recopiant le livre : un chargeur plein ;
 * vide : la capacité du catalogue, s'il la donne. Sinon `null` : on ne décompte pas ce qu'on ne lit pas.
 */
export function lireLesMunitions(texte: unknown, chargeurDuCatalogue?: unknown): Munitions | null {
    const t = String(texte ?? '').trim();
    const paire = /^(\d+)\s*\/\s*(\d+)/.exec(t);
    if (paire) {
        const capacite = Number(paire[2]);
        return capacite > 0 ? { restants: Math.min(Number(paire[1]), capacite), capacite } : null;
    }
    const seul = /^(\d+)/.exec(t);
    if (seul && Number(seul[1]) > 0) return { restants: Number(seul[1]), capacite: Number(seul[1]) };
    const c = entier(chargeurDuCatalogue);
    return !t && c > 0 ? { restants: c, capacite: c } : null;
}

export const ecrireLesMunitions = (m: Munitions) => `${m.restants}/${m.capacite}`;

/** Un tir : ce qui reste, et les coups qui manquaient (un chargeur trop court pour la rafale). */
export function tirer(m: Munitions, coups: number): Munitions & { manque: number } {
    const n = entier(coups);
    return { restants: Math.max(0, m.restants - n), capacite: m.capacite, manque: Math.max(0, n - m.restants) };
}

// ─── PSI ─────────────────────────────────────────────────────────────────────

/**
 * **Ce qu'un pouvoir coûte, une fois lancé** (p. 225) : `cout` sur une réussite, 1 sur un échec ;
 * ce qui passe sous zéro devient des dégâts. `null` sans point de PSI : la tentative est refusée.
 */
export function depenseDePsi({ cout, reussie, psi }: { cout: number; reussie: boolean; psi: number }):
    { depense: number; psiApres: number; degats: number } | null {
    const reste = entier(psi);
    if (reste <= 0) return null;
    const depense = reussie ? Math.max(1, entier(cout)) : 1;
    return { depense, psiApres: Math.max(0, reste - depense), degats: Math.max(0, depense - reste) };
}

/**
 * **La PSI qui revient** (p. 224) : un point par heure, à partir de trois heures après la dernière
 * utilisation — au bout de quatre heures, un point ; jamais au-delà de la PSI sans dépense.
 */
export function psiRecuperee({ psi, maximum, heures }: { psi: number; maximum: number; heures: number }): { psiApres: number; rendus: number } {
    const avant = entier(psi);
    const plafond = Math.max(avant, entier(maximum));
    const psiApres = Math.min(plafond, avant + Math.max(0, entier(heures) - 3));
    return { psiApres, rendus: psiApres - avant };
}

// ─── Neutralisation et inconscience ──────────────────────────────────────────

/** Un coup incapacitant (p. 76) : l'END après, et les rounds sans agir quand elle tombe à 0. */
export function neutralisation(degats: number, endurance: number): { enduranceApres: number; neutralise: boolean; rounds: number } {
    const d = entier(degats), e = entier(endurance);
    return { enduranceApres: Math.max(0, e - d), neutralise: d >= e && d > 0, rounds: Math.max(0, d - e) };
}

/**
 * **Une heure de repos** (p. 76) : les dégâts incapacitants retenus reviennent à l'END, sans
 * dépasser l'END sans blessure ; le compteur revient à zéro.
 */
export function uneHeureDeRepos({ endurance, maximum, incapacitants }: { endurance: number; maximum: number; incapacitants: number }): { enduranceApres: number; rendus: number } {
    const e = entier(endurance);
    const enduranceApres = Math.min(Math.max(e, entier(maximum)), e + entier(incapacitants));
    return { enduranceApres, rendus: enduranceApres - e };
}

/** **Le test de réveil** (p. 80) : 2D + MD END + 1 par échec précédent, 8+ pour reprendre conscience. */
export function testDeReveil(des: readonly number[], mdEndurance: number, echecsPrecedents: number): { total: number; md: number; reveille: boolean } {
    const md = Math.trunc(mdEndurance) + entier(echecsPrecedents);
    const total = des.reduce((t, v) => t + v, 0) + md;
    return { total, md, reveille: total >= 8 };
}
