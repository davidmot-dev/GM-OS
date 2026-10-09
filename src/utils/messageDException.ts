/**
 * Une exception du pont peut être un objet structuré plutôt qu'une Error.
 * Garder le choix historique du message et le repli paresseux des écrans, sans accéder à
 * null.message ni laisser un message non textuel casser leur diagnostic.
 */
export function messageDException(exception: unknown, repli: () => string): string {
    const message = exception && (typeof exception === 'object' || typeof exception === 'function') && 'message' in exception
        ? exception.message : undefined;
    return message ? String(message) : repli();
}
