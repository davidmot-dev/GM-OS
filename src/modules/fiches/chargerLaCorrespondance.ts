import {
    cheminDeLaCorrespondance, lireLaCorrespondance, verifierLaCorrespondance,
    type CorrespondanceDeFiche,
} from './correspondanceDeFiche';

export * from './correspondanceDeFiche';

/**
 * **Charge la correspondance d'un système, s'il en a une.**
 *
 * Rend `null` quand le jeu n'en a pas : **c'est le cas normal**, pas une erreur.
 * La plupart des jeux n'auront jamais de fiche HTML, et le gabarit dessiné par
 * GM-OS reste alors le seul écran. *Un absent silencieux, un incident bruyant* —
 * une table **illisible**, elle, est un incident, et `lireLaCorrespondance` le
 * dit.
 *
 * Passe par `readDoc`, qui lit n'importe quel fichier sous `docs/` : aucun IPC
 * nouveau, comme pour les thèmes.
 */
export async function chargerLaCorrespondance(racine: string): Promise<CorrespondanceDeFiche | null> {
    // Le type vient de `types/window.d.ts` : si la signature du pont change, ce
    // fichier cesse de compiler au lieu de rendre `null` en silence.
    const lire = typeof window === 'undefined' ? undefined : window.appBridge?.ai?.readDoc;
    if (!lire) return null;

    const chemin = cheminDeLaCorrespondance(racine);

    try {
        const json = await lire(chemin);
        if (!json) return null;
        return lireLaCorrespondance(json, `docs/${chemin}`);
    } catch (err) {
        console.error(`[Correspondance] Lecture de « docs/${chemin} » impossible :`, err);
        return null;
    }
}

/**
 * **Le second contrôle, celui que le dépôt ne peut pas faire.**
 *
 * Le gabarit de GM-OS n'est pas sur le disque : il vient de la Forge et vit dans
 * la base de session. Le contrôle du dépôt ne vérifie donc que le côté fiche ;
 * celui-ci ferme la boucle à l'exécution, quand les deux gabarits sont là.
 *
 * Il **avertit** au lieu d'échouer : un gabarit qu'on est en train d'enrichir —
 * `humanite` par exemple, qui doit revenir par la Forge — n'est pas une panne, et
 * refuser d'afficher la fiche pour ça la rendrait inutilisable pendant le
 * chantier. Mais il parle, parce qu'une table qui pointe dans le vide ne se voit
 * jamais autrement.
 */
export function annoncerLesDefauts(
    table: CorrespondanceDeFiche,
    clesDeLaFiche: Iterable<string>,
    idsGmOs: Iterable<string>,
): void {
    const defauts = verifierLaCorrespondance(table, clesDeLaFiche, idsGmOs);
    if (defauts.length === 0) return;

    for (const { gravite, message } of defauts) {
        const ligne = `[Correspondance] ${table.gabaritDeLaFiche} — ${message}`;
        if (gravite === 'erreur') console.error(ligne);
        else console.warn(ligne);
    }
}
