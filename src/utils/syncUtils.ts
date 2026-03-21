/**
 * Performs a deep comparison between two objects to determine equality.
 * optimized for JSON-serializable store segments (Object, Array, string, number, boolean, null).
 */
export function isDeepEqual(obj1: unknown, obj2: unknown): boolean {
    if (obj1 === obj2) return true;

    if (
        typeof obj1 !== "object" || 
        obj1 === null || 
        typeof obj2 !== "object" || 
        obj2 === null
    ) {
        return false;
    }

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

/**
 * Compares top-level segments of two synchronization states and returns only the modified ones.
 */
export function getDifferentialPayload(
    current: Record<string, unknown>, 
    previous: Record<string, unknown>
): Record<string, unknown> {
    const diff: Record<string, unknown> = {};
    const keys = Object.keys(current);

    for (const key of keys) {
        if (!isDeepEqual(current[key], previous[key])) {
            diff[key] = current[key];
        }
    }

    return diff;
}
