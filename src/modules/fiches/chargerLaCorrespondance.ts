import {
    cheminDeLaCorrespondance, lireLaCorrespondance, verifierLaCorrespondance,
    type CorrespondanceDeFiche,
} from './correspondanceDeFiche';
import { origineDesFiches } from './pontDeLaFiche';

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
    const chemin = cheminDeLaCorrespondance(racine);

    // Le type vient de `types/window.d.ts` : si la signature du pont change, ce
    // fichier cesse de compiler au lieu de rendre `null` en silence.
    const lire = typeof window === 'undefined' ? undefined : window.appBridge?.ai?.readDoc;

    try {
        const json = lire ? await lire(chemin) : await lireParLeReseau(chemin);
        if (!json) return null;
        return lireLaCorrespondance(json, `docs/${chemin}`);
    } catch (err) {
        console.error(`[Correspondance] Lecture de « docs/${chemin} » impossible :`, err);
        return null;
    }
}

/**
 * **Le même fichier, vu depuis une tablette.**
 *
 * Elle n'a pas `readDoc` — pas de pont Electron du tout. Le serveur des fiches
 * sert la table à côté du moteur, sur son port à lui.
 *
 * Un 404 rend `null` **sans crier** : un jeu sans table est le cas normal, et
 * c'est la réponse que le serveur donne alors. Seule une vraie panne parle.
 */
async function lireParLeReseau(chemin: string): Promise<string | null> {
    const reponse = await fetch(`${origineDesFiches()}/${chemin}`);
    if (reponse.status === 404) return null;
    if (!reponse.ok) throw new Error(`Le serveur des fiches a répondu ${reponse.status}.`);
    return reponse.text();
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
