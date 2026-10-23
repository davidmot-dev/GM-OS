// Sans import : le caviardage des tablettes, que le serveur d'Electron charge aussi, le lit.
/**
 * **Ce qu'une tablette reçoit des indices** (C5) : ceux que la table connaît,
 * et ceux que **son** personnage connaît seul. `lecteur` absent : la copie
 * n'a pas encore de destinataire (à l'émission) — elle garde les indices
 * privés, que le serveur resserre ensuite tablette par tablette ; `null` :
 * une fenêtre publique, les indices révélés seulement.
 */
export function indicesPourLeLecteur<T extends { isRevealed?: unknown; connuDe?: unknown }>(
    indices: T[], lecteur?: string | null,
): T[] {
    return indices.filter(c => {
        if (!c || typeof c !== 'object') return false;
        if (c.isRevealed === true) return true;
        const connus = Array.isArray(c.connuDe) ? c.connuDe : [];
        if (lecteur === undefined) return connus.length > 0;
        return lecteur !== null && connus.includes(lecteur);
    });
}
