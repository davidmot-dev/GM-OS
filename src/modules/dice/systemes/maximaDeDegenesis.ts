/**
 * **Les maxima de Degenesis, calculés et expliqués** — DEG-A3, 04/11/2026, à la demande de
 * David (« on commence DEG-A3 et DEG-A4 »), carte « Maxima » choisie le même jour. Livre de
 * base français Katharsys, pages **imprimées** (PDF − 1).
 *
 * - **Égo maximal** = (INT + Concentration) × 2 **ou** (INS + Pulsions) × 2 (p. 26, 94).
 *   Concentration et Pulsions s'excluent : le personnage n'en apprend qu'une, l'autre
 *   « s'étiole » (p. 26).
 * - **Sporulations maximales** = (PSY + Foi) × 2 **ou** (PSY + Volonté) × 2 (p. 26, 94) ;
 *   Foi et Volonté s'excluent de même.
 * - **Blessures superficielles** = (PHY + Résistance) × 2 ; **Traumatismes** = PHY + PSY (p. 94).
 *
 * La branche se **déduit** de la compétence remplie ; si les deux le sont (ou aucune), le
 * meneur la **déclare**, et elle se garde dans la fiche sous une clé cachée. Seul l'Égo
 * maximal est un champ de la fiche : les trois autres sont des formules du pilote, que la
 * carte explique et compare sans les écrire. Un maximum qui change **ne remplit pas** la
 * jauge d'Égo : elle est seulement ramenée au nouveau maximum si elle le dépasse ; les
 * Sporulations subies ne bougent jamais.
 *
 * Tout ici est pur : des valeurs de fiche entrent, des lignes et des corrections sortent.
 */

const entier = (n: unknown) => Math.trunc(Number(n) || 0);

/** Une branche : l'attribut et la compétence dont la somme, doublée, donne le maximum. */
export interface BrancheDuMaximum {
    cle: string;
    libelle: string;
    attribut: string;
    competence: string;
}

/** Ce que le pilote nomme (`jet.degenesis.maxima`, pilote 2.2.0) : des champs, jamais des valeurs. */
export interface RegleDesMaximaDeDegenesis {
    ego: { champ: string; jauge?: string; branches: BrancheDuMaximum[] };
    sporulations?: { jauge: string; branches: BrancheDuMaximum[] };
    blessures?: { jauge: string; champs: string[] };
    traumatismes?: { jauge: string; champs: string[] };
    /** Les abréviations des champs, pour le détail : `{ intellect: 'INT' }`. */
    abreviations?: Record<string, string>;
}

/** Ce que la fiche garde, sous une clé que le gabarit HTML ignore. */
export const CLE_DEGENESIS = '_gmos_degenesis';

export interface EtatDegenesisDeLaFiche {
    version: 1;
    brancheEgo?: string;
    brancheSporulations?: string;
}

export function lireLEtatDegenesis(valeurs: Record<string, unknown>): EtatDegenesisDeLaFiche {
    const e = valeurs[CLE_DEGENESIS] as Partial<EtatDegenesisDeLaFiche> | undefined;
    return e && e.version === 1 ? { ...e, version: 1 } : { version: 1 };
}

export const ecrireLEtatDegenesis = (e: EtatDegenesisDeLaFiche): Record<string, unknown> => ({ [CLE_DEGENESIS]: e });

/** La branche retenue, et ce qui contredit l'exclusivité. */
export interface ChoixDeLaBranche {
    branches: BrancheDuMaximum[];
    retenue?: BrancheDuMaximum;
    /** Retenue sans déclaration : une seule compétence de la paire est remplie. */
    deduite: boolean;
    /** Les autres branches dont la compétence est remplie : l'exclusivité est contredite (p. 26). */
    contradictoires: BrancheDuMaximum[];
}

export function choisirLaBranche(branches: BrancheDuMaximum[], valeurs: Record<string, unknown>, declaree?: string): ChoixDeLaBranche {
    const remplies = branches.filter(b => entier(valeurs[b.competence]) > 0);
    const parDeclaration = branches.find(b => b.cle === declaree);
    const retenue = parDeclaration ?? (remplies.length === 1 ? remplies[0] : undefined);
    return {
        branches,
        retenue,
        deduite: !parDeclaration && !!retenue,
        contradictoires: remplies.length > 1 ? remplies.filter(b => b !== retenue) : [],
    };
}

export type CleDuMaximum = 'ego' | 'sporulations' | 'blessures' | 'traumatismes';

export interface LigneDuMaximum {
    cle: CleDuMaximum;
    libelle: string;
    /** Ce que la fiche porte aujourd'hui : le champ pour l'Égo, la formule du pilote sinon. */
    surLaFiche: number | null;
    /** `null` : la branche reste à choisir. */
    calcule: number | null;
    detail: string;
    /** Seul l'Égo maximal s'écrit : les autres sont des formules du pilote. */
    ecrivable: boolean;
    identique: boolean;
    note?: string;
}

export interface MaximaDeDegenesis {
    ego: ChoixDeLaBranche;
    sporulations?: ChoixDeLaBranche;
    lignes: LigneDuMaximum[];
}

const PAGE_DE = (cle: CleDuMaximum) => (cle === 'ego' ? 'p. 26, 94' : cle === 'sporulations' ? 'p. 26, 94' : 'p. 94');

/**
 * Calcule les quatre maxima. `maxDuPilote` rend ce que la formule du pilote donne à une
 * jauge (`statsToTrack[].max`) : la carte compare, elle n'écrit pas ces trois-là.
 */
export function calculerLesMaxima(
    regle: RegleDesMaximaDeDegenesis,
    valeurs: Record<string, unknown>,
    maxDuPilote: (jauge: string) => number | null = () => null,
): MaximaDeDegenesis {
    const etat = lireLEtatDegenesis(valeurs);
    const abr = (champ: string) => regle.abreviations?.[champ] ?? champ;
    const v = (champ: string) => entier(valeurs[champ]);
    const lignes: LigneDuMaximum[] = [];

    const parBranche = (cle: 'ego' | 'sporulations', libelle: string, choix: ChoixDeLaBranche, surLaFiche: number | null, ecrivable: boolean) => {
        const b = choix.retenue;
        const calcule = b ? (v(b.attribut) + v(b.competence)) * 2 : null;
        const detail = b
            ? `(${abr(b.attribut)} ${v(b.attribut)} + ${b.libelle} ${v(b.competence)}) × 2 (${PAGE_DE(cle)})`
            : `Choisissez la branche : ${choix.branches.map(x => x.libelle).join(' ou ')} (${PAGE_DE(cle)})`;
        let note: string | undefined;
        if (cle === 'sporulations' && calcule !== null && surLaFiche !== null && surLaFiche !== calcule) {
            note = `La jauge du pilote compte ${surLaFiche} : elle additionne ${choix.branches.map(x => x.libelle).join(' et ')}. `
                + `Mettez ${choix.contradictoires.map(x => x.libelle).join(', ') || 'l’autre compétence'} à 0 pour qu’elle suive la branche.`;
        }
        lignes.push({
            cle, libelle, surLaFiche, calcule, detail, ecrivable, note,
            identique: calcule !== null && surLaFiche === calcule,
        });
    };

    const ego = choisirLaBranche(regle.ego.branches, valeurs, etat.brancheEgo);
    const egoSurLaFiche = valeurs[regle.ego.champ] === undefined || valeurs[regle.ego.champ] === '' ? null : v(regle.ego.champ);
    parBranche('ego', 'Égo maximal', ego, egoSurLaFiche, true);

    let sporulations: ChoixDeLaBranche | undefined;
    if (regle.sporulations) {
        sporulations = choisirLaBranche(regle.sporulations.branches, valeurs, etat.brancheSporulations);
        parBranche('sporulations', 'Sporulations maximales', sporulations, maxDuPilote(regle.sporulations.jauge), false);
    }
    if (regle.blessures) {
        const [a, c] = regle.blessures.champs;
        const calcule = regle.blessures.champs.reduce((s, x) => s + v(x), 0) * 2;
        const surLaFiche = maxDuPilote(regle.blessures.jauge);
        lignes.push({
            cle: 'blessures', libelle: 'Blessures superficielles max.', surLaFiche, calcule, ecrivable: false,
            detail: `(${abr(a)} ${v(a)} + ${abr(c)} ${v(c)}) × 2 (p. 94)`, identique: surLaFiche === calcule,
        });
    }
    if (regle.traumatismes) {
        const [a, c] = regle.traumatismes.champs;
        const calcule = regle.traumatismes.champs.reduce((s, x) => s + v(x), 0);
        const surLaFiche = maxDuPilote(regle.traumatismes.jauge);
        lignes.push({
            cle: 'traumatismes', libelle: 'Traumatismes max.', surLaFiche, calcule, ecrivable: false,
            detail: `${abr(a)} ${v(a)} + ${abr(c)} ${v(c)} (p. 94)`, identique: surLaFiche === calcule,
        });
    }
    return { ego, sporulations, lignes };
}

/**
 * Ce qu'« Appliquer » écrit pour l'Égo : le nouveau maximum, et la jauge **seulement** si
 * elle le dépasse. Jamais un remplissage gratuit (DEG-A3, critère de la synthèse).
 */
export function appliquerLEgoMaximal(regle: RegleDesMaximaDeDegenesis, valeurs: Record<string, unknown>, maxima: MaximaDeDegenesis): Record<string, unknown> {
    const ligne = maxima.lignes.find(l => l.cle === 'ego');
    if (!ligne || ligne.calcule === null || ligne.identique) return {};
    const maj: Record<string, unknown> = { [regle.ego.champ]: ligne.calcule };
    if (regle.ego.jauge) {
        const actuel = entier(valeurs[regle.ego.jauge]);
        if (actuel > ligne.calcule) maj[regle.ego.jauge] = ligne.calcule;
    }
    return maj;
}

/** Déclarer une branche : elle se garde dans la fiche, rien d'autre ne change. */
export function declarerLaBranche(valeurs: Record<string, unknown>, paire: 'ego' | 'sporulations', cle: string): Record<string, unknown> {
    const e = lireLEtatDegenesis(valeurs);
    return ecrireLEtatDegenesis(paire === 'ego' ? { ...e, brancheEgo: cle } : { ...e, brancheSporulations: cle });
}
