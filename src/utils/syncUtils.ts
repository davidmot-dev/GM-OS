/**
 * Performs a deep comparison between two objects to determine equality.
 * optimized for JSON-serializable store segments (Object, Array, string, number, boolean, null).
 */
export function isDeepEqual(obj1: unknown, obj2: unknown): boolean {
    if (obj1 === obj2) return true;

    if (obj1 instanceof Date && obj2 instanceof Date) {
        return obj1.getTime() === obj2.getTime();
    }

    if (
        typeof obj1 !== "object" || 
        obj1 === null || 
        typeof obj2 !== "object" || 
        obj2 === null
    ) {
        return false;
    }

    // Object.keys(['x']) vaut ['0'], tout comme Object.keys({ 0: 'x' }) : sans
    // cette garde, un champ passant de {} à [] serait vu comme inchangé, et la
    // modification ne serait jamais diffusée.
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key) || !isDeepEqual((obj1 as any)[key], (obj2 as any)[key])) {
            return false;
        }
    }

    return true;
}

export interface DifferentialOptions {
    /**
     * Segments à comparer un niveau plus bas, champ par champ.
     *
     * Un segment agrégé — `session` regroupe campagnes, entités, lieux, indices,
     * favoris — repart en entier dès qu'un seul de ses champs bouge. Renommer un
     * personnage retransmet alors tous les autres. Les destinataires appliquent
     * déjà ces champs individuellement, donc n'envoyer que ceux qui ont changé
     * ne demande rien de plus de leur côté.
     */
    deepSegments?: readonly string[];
}

/** Vrai pour un objet simple, celui qu'on peut comparer champ par champ. */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

/**
 * Compares top-level segments of two synchronization states and returns only the modified ones.
 *
 * Les segments listés dans `deepSegments` sont comparés champ par champ : le
 * segment n'est présent dans le résultat que s'il a changé, et il ne contient
 * alors que ses champs modifiés.
 */
export function getDifferentialPayload(
    current: Record<string, unknown>,
    previous: Record<string, unknown>,
    options: DifferentialOptions = {}
): Record<string, unknown> {
    const deepSegments = options.deepSegments ?? [];
    const diff: Record<string, unknown> = {};
    const keys = Object.keys(current);

    for (const key of keys) {
        if (isDeepEqual(current[key], previous[key])) continue;

        const currentSegment = current[key];
        const previousSegment = previous[key];

        // Comparaison fine réservée aux segments demandés, et seulement quand les
        // deux côtés sont des objets simples : sinon on retombe sur le segment
        // entier, qui reste toujours correct.
        if (deepSegments.includes(key) && isPlainRecord(currentSegment) && isPlainRecord(previousSegment)) {
            const innerDiff: Record<string, unknown> = {};
            for (const field of Object.keys(currentSegment)) {
                if (!isDeepEqual(currentSegment[field], previousSegment[field])) {
                    innerDiff[field] = currentSegment[field];
                }
            }
            // isDeepEqual a signalé une différence : si aucun champ de `current`
            // ne bouge, c'est que `previous` en avait un de plus. On renvoie le
            // segment entier plutôt qu'un objet vide, qui ne dirait rien.
            diff[key] = Object.keys(innerDiff).length > 0 ? innerDiff : currentSegment;
            continue;
        }

        diff[key] = currentSegment;
    }

    return diff;
}
