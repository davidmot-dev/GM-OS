import type { DeclarationDeButin, TableEntry } from '../../tables/types';
import type { InventoryItem } from '../store/types';
import { resoudreUneQuantite } from './quantiteDeButin';

/**
 * **Le seul pont entre un oracle et le butin de séance.**
 *
 * Table-OS et Loot-OS ne font pas le même geste : l'un *consulte* — un dé, une
 * plage, un résultat qu'on lit —, l'autre *compose* — plusieurs tirages, des
 * imbrications, des quantités, et un résultat qu'on manipule jusqu'à
 * l'inventaire d'un joueur. Les brancher ne veut pas dire les confondre : le
 * point de rencontre est **le pool de butin**, jamais le personnage.
 *
 * Avant le 2026-09-04, Table-OS court-circuitait Loot-OS et écrivait droit chez
 * le joueur, en texte, dans un champ que l'onglet Inventaire de la tablette ne
 * regarde même pas. *L'objet donné n'apparaissait nulle part où le joueur cherche
 * ses affaires.*
 */
export function objetsDepuisDeclaration(
    declarations: DeclarationDeButin[] | undefined,
    origine: { table: string; entree: string },
): InventoryItem[] {
    if (!Array.isArray(declarations) || declarations.length === 0) return [];

    return declarations.map(decl => {
        const type = decl.type || 'item';
        return {
            id: `it-${crypto.randomUUID()}`,
            name: decl.name,
            type,
            rarity: decl.rarity || 'common',
            weight: Number(decl.weight) || 0,
            quantity: resoudreUneQuantite(decl.quantite),
            description: decl.description || '',
            // La monnaie vaut un par unité tant que la table n'en dit rien : la
            // somme du panneau ne peut pas compter des pièces qui valent zéro.
            value: Number(decl.value) || (type === 'currency' ? 1 : 0),
            properties: {
                /*
                  D'où vient cet objet, écrit sur l'objet lui-même.

                  Un butin versé perd sinon sa trace dès qu'il est dans le pool,
                  mêlé à ceux d'une table du pilote et à ceux de l'IA. Le meneur
                  qui se demande « ça sort d'où, ça ? » n'avait rien à lire.
                */
                oracleTable: origine.table,
                oracleEntree: origine.entree,
            },
        } satisfies InventoryItem;
    });
}

/** Est-ce que cette entrée d'oracle a quelque chose à verser ? */
export function laDeclarationEstVide(entree: TableEntry | undefined): boolean {
    return !entree || !Array.isArray(entree.butin) || entree.butin.length === 0;
}
