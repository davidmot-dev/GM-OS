import type { CatalogueDEquipement, LootEntry, LootTable, ObjetDuCatalogue } from '../../types/drivers';
import type { InventoryItem } from '../../types/player.types';
import { objetsContenus } from './catalogue';
import { objetPourLeSac } from './equiperLaFiche';

/**
 * **Un objet du catalogue qui entre au butin** — registre § 264, 19/11/2026.
 *
 * David : « je voudrais faire le lien entre les équipements qui sont définis dans
 * un drivers et loot-os afin de pouvoir constituer des tables de loot plus
 * facilement ». Une seule fabrique, servie au tirage d'une table
 * (`LootGenerator`, ligne « Objet du catalogue ») et au geste de séance
 * « Depuis le catalogue » : *un écran qui réimplémente la lecture d'un moteur
 * finit par en diverger* (registre § 10).
 *
 * Elle part d'`objetPourLeSac`, la règle de l'objet de Sac à dos : même nom, même
 * famille, même poids, et surtout `properties.catalogueId` — c'est lui qui fait
 * reconnaître l'objet reçu comme **porté** (`objetsPortes`), effets rappelés au jet.
 */

/**
 * La valeur d'un objet, lue dans son coût quand il commence par un nombre
 * (décision Q5 de David, 19/11) : « 1 200 $ » → 1200, « 2 » → 2, « 1,5 » → 1,5.
 * Un coût qui n'est pas un nombre — « Spécial », la catégorie de prix « Courant »
 * de Delta Green — vaut 0 : on ne devine pas un prix.
 */
export function valeurDuCout(cout: string | undefined): number {
    const m = (cout ?? '').trim().match(/^(\d{1,3}(?:[\s\u00a0\u202f]\d{3})+|\d+)(?:,(\d+)|\.(\d+))?/);
    if (!m) return 0;
    const entier = m[1].replace(/[\s\u00a0\u202f]/g, '');
    const decimales = m[2] ?? m[3];
    return Number(decimales ? `${entier}.${decimales}` : entier);
}

export interface OptionsDuButin {
    /** Le palier de rareté réglé sur la ligne de la table. */
    rarete?: string;
    quantite?: number;
}

/**
 * L'objet, prêt pour le pool, **suivi des objets qu'il contient** (décision Q5 :
 * le véhicule arrive avec ses armes), chacun relié au catalogue. Un objet n'est
 * versé qu'une fois, même si deux contenus le désignent ou s'ils se désignent en
 * cercle (le contrôle du catalogue signale les cercles ; ici, on ne boucle pas).
 */
export function objetsDuButin(
    catalogue: CatalogueDEquipement,
    objet: ObjetDuCatalogue,
    { rarete = 'common', quantite = 1 }: OptionsDuButin = {},
): InventoryItem[] {
    const vus = new Set<string>();
    const sortie: InventoryItem[] = [];
    const verser = (o: ObjetDuCatalogue) => {
        if (vus.has(o.id)) return;
        vus.add(o.id);
        const sac = objetPourLeSac(o);
        sortie.push({
            ...sac,
            id: `it-${crypto.randomUUID()}`,
            rarity: rarete,
            quantity: quantite,
            value: valeurDuCout(o.cout),
        });
        for (const contenu of objetsContenus(catalogue, o)) verser(contenu);
    };
    verser(objet);
    return sortie;
}

/**
 * **Les lignes d'une table de butin, une par objet choisi** (§ 264, T4-T5) : chacune
 * désigne son objet (`type: 'catalogue'`, décision « Lien vivant ») et garde son nom
 * pour l'affichage ; poids 1, quantité 1, rareté au premier palier du jeu.
 */
export function lignesDepuisLeCatalogue(objets: readonly ObjetDuCatalogue[], rarete: string): LootEntry[] {
    return objets.map(o => ({
        name: o.nom,
        type: 'catalogue' as const,
        weight: 1,
        minAmount: '1',
        metadata: { catalogueId: o.id, rarity: rarete },
    }));
}

/**
 * **Le nom d'une table créée depuis le catalogue** (C10) : la catégorie quand tous
 * les objets choisis la partagent (« Pistolets »), sinon « Sélection du catalogue ».
 */
export function nomDUneTableDuCatalogue(objets: readonly ObjetDuCatalogue[]): string {
    const categories = new Set(objets.map(o => o.categorie?.trim() || ''));
    const [seule] = [...categories];
    return categories.size === 1 && seule ? seule : 'Sélection du catalogue';
}

/**
 * **« Nouvelle table depuis le catalogue »** (décision Q2 de David, 19/11) : une ligne
 * par objet, poids égaux, un seul tirage parmi la liste ; David règle les poids ensuite.
 */
export function tableDepuisLeCatalogue(objets: readonly ObjetDuCatalogue[], rarete: string, id: string): LootTable {
    return {
        id,
        name: nomDUneTableDuCatalogue(objets),
        rolls: '1',
        rollMode: 'weighted',
        entries: lignesDepuisLeCatalogue(objets, rarete),
    };
}
