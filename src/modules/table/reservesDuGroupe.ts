import type { Campaign } from '../../types/campaign.types';
import type { ApportDuGroupe, GameDriver } from '../../types/drivers';
import type { RessourceDeTable } from './RessourcesDeTable';

/**
 * **Les réserves que le groupe tient pour la table** — la Cabale de NOC,
 * 2026-10-13.
 *
 * Les apports `scenario` (les dés d'un Domaine, les points d'un Atout) ont un
 * plafond — le niveau écrit sur la feuille du groupe — et un reste, qui baisse
 * à chaque jet et revient à « Nouveau scénario ». **C'est exactement une
 * réserve de table** : on la dérive donc, plutôt que d'écrire une seconde
 * mécanique. Elle hérite ainsi de tout ce que les réserves savent déjà — la
 * tablette (`table:ajuster`), le journal, le geste du scénario.
 *
 * Les apports `piste` (l'Espoir, le Vécu) n'en ont pas besoin : la piste de la
 * feuille EST le stock, et elle descend directement.
 *
 * ⛔ **Une seule liste pour toute la table.** Le bandeau, le panneau de jet, la
 * tablette et l'action du meneur doivent voir les mêmes réserves, sans quoi une
 * dépense faite sur la tablette serait refusée chez le meneur faute d'y
 * connaître la réserve. D'où `ressourcesDeLaTable`, que tous appellent.
 */

/** L'identifiant de la réserve qui tient un stock du groupe. */
export const idDeReserveDuGroupe = (champ: string) => `groupe:${champ}`;

/** Un niveau lu sur la feuille du groupe — zéro pour ce qui n'est pas un nombre. */
export function niveauDuGroupe(sheetData: Record<string, unknown> | undefined, champ: string): number {
    const brut = sheetData?.[champ];
    const n = typeof brut === 'number' ? brut : typeof brut === 'string' ? Number(brut) : NaN;
    return Number.isFinite(n) ? Math.floor(n) : 0;
}

/** Les réserves dérivées des apports `scenario` du groupe de cette campagne. */
export function reservesDuGroupe(
    pilote: Pick<GameDriver, 'ficheDeGroupe'> | null | undefined,
    campagne: Pick<Campaign, 'groupe'> | undefined,
): RessourceDeTable[] {
    const apports = pilote?.ficheDeGroupe?.apports ?? [];
    const sheetData = campagne?.groupe?.sheetData;
    const vus = new Set<string>();
    const reserves: RessourceDeTable[] = [];

    for (const apport of apports) {
        if (apport.epuisement !== 'scenario') continue;
        for (const stock of apport.stocks) {
            const id = idDeReserveDuGroupe(stock.champ);
            if (vus.has(id)) continue;
            vus.add(id);
            // Une Faille (Atout à −1) ne fournit rien : le plancher reste zéro.
            const niveau = Math.max(0, niveauDuGroupe(sheetData, stock.champ));
            reserves.push({
                id,
                label: `${apport.label} — ${stock.label}`,
                proprietaire: 'joueurs',
                depart: niveau,
                min: 0,
                max: niveau,
                remiseAuDepartParScenario: true,
                visibleAuxJoueurs: true,
                manipulableParLesJoueurs: true,
                horsDuBandeau: true,
            });
        }
    }
    return reserves;
}

/** Les réserves du pilote, puis celles du groupe — la liste unique de la table. */
export function ressourcesDeLaTable(
    pilote: Pick<GameDriver, 'ressourcesDeTable' | 'ficheDeGroupe'> | null | undefined,
    campagne: Pick<Campaign, 'groupe'> | undefined,
): RessourceDeTable[] {
    return [...(pilote?.ressourcesDeTable ?? []), ...reservesDuGroupe(pilote, campagne)];
}

/**
 * **Le stock qu'un apport vise pour ce jet.**
 *
 * Un stock unique s'applique d'office. Sinon la composante du jet décide — le
 * Domaine retenu par le Héros —, et à défaut le joueur choisit (un Atout).
 */
export function stockRetenu(
    apport: ApportDuGroupe,
    choixDuJet: Record<string, string>,
    choixDuJoueur?: string,
): ApportDuGroupe['stocks'][number] | undefined {
    if (apport.stocks.length === 1) return apport.stocks[0];
    if (apport.composante) {
        const retenu = choixDuJet[apport.composante];
        return retenu ? apport.stocks.find(s => s.pour === retenu) : undefined;
    }
    return choixDuJoueur ? apport.stocks.find(s => s.champ === choixDuJoueur) : undefined;
}

/** Ce que les points engagés rapportent au jet. */
export function effetDesApports(
    engagements: { apport: Pick<ApportDuGroupe, 'effet' | 'parPoint'>; points: number }[],
): { des: number; bonus: number } {
    let des = 0;
    let bonus = 0;
    for (const { apport, points } of engagements) {
        const n = Math.max(0, Math.floor(points)) * Math.max(0, apport.parPoint);
        if (apport.effet === 'des') des += n;
        else bonus += n;
    }
    return { des, bonus };
}

/** Un apport tel que le panneau de jet le présente : son stock, ce qui reste, ce qu'on engage. */
export interface ApportDisponible {
    apport: ApportDuGroupe;
    stock: ApportDuGroupe['stocks'][number] | undefined;
    /** Ce qu'on peut encore y prendre. */
    dispo: number;
    /** Ce que le joueur engage, ramené à ce qui reste. */
    points: number;
}

/**
 * **Ce que chaque apport peut donner à ce jet.**
 *
 * `piste` : le reste se lit sur la feuille du groupe. `scenario` : dans la
 * réserve de table dérivée, qui vaut le niveau tant qu'on n'y a pas puisé.
 * L'engagement est ramené à ce qui reste — l'écran ne promet pas un dé qu'il
 * ne pourra pas prendre.
 */
export function apportsDisponibles(
    apports: ApportDuGroupe[],
    choixDuJet: Record<string, string>,
    choixDuJoueur: Record<string, string>,
    engages: Record<string, number>,
    sheetData: Record<string, unknown> | undefined,
    etatDesReserves: Record<string, number>,
): ApportDisponible[] {
    return apports.map(apport => {
        const stock = stockRetenu(apport, choixDuJet, choixDuJoueur[apport.id]);
        const dispo = !stock ? 0 : Math.max(0, apport.epuisement === 'piste'
            ? niveauDuGroupe(sheetData, stock.champ)
            : (etatDesReserves[idDeReserveDuGroupe(stock.champ)] ?? 0));
        return { apport, stock, dispo, points: Math.min(Math.max(0, engages[apport.id] ?? 0), dispo) };
    });
}
