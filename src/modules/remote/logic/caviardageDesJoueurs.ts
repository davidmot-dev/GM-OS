import { caviarderObjectifsAlien } from '../../dice/systemes/progressionAlien';

/**
 * **Ce que la table des joueurs ne reçoit jamais** — S1, S2, S3, S5 de l'audit
 * du 2026-10-22 (`documentation/Planning/2026-10-22-audit-fiches-tablettes-journal.md`).
 *
 * Le caviardage vivait en ligne dans `useNexusSynchronizer`, clé par clé, et il
 * en manquait : la trame du meneur (`lectureDuMeneur` — notes des actes et des
 * scènes, wiki, indices non révélés), les `gmNotes` des lieux, des campagnes et
 * des personnages, les indices non révélés de la séance, partaient sur chaque
 * tablette. La diffusion rapide du combat
 * partait sans rôle, donc sans aucun filtre. Et la fenêtre Hub et les
 * projecteurs locaux recevaient même la copie destinée au meneur.
 *
 * **Une seule fonction, appliquée partout où une charge part vers la table** :
 * à l'émission (`useNexusSynchronizer`), au serveur pour chaque tablette de
 * joueur (`SyncServer.broadcastAction`), et dans `electron/main.ts` pour les
 * fenêtres locales. *Un secret caviardé à l'affichage est déjà déposé sur
 * l'appareil.*
 *
 * Les clés secrètes se cherchent **à toute profondeur** : une entité, un
 * combattant, un lieu ou un personnage les portent sous le même nom, et un
 * nouvel endroit qui en porterait ne doit pas fuir parce qu'on l'a oublié ici.
 *
 * Pure : ne modifie jamais la charge reçue. L'astrologie de Rêve de Dragon se
 * filtre à part, joueur par joueur (`filtrerAstrologieDistante`) : elle dépend
 * du personnage qui lit.
 */

/** Ce qui est masqué, à toute profondeur : le texte devient `•••••`. */
const MASQUES = new Set(['gmSecretInfo', 'roleplayingNotes']);
/** Ce qui est vidé, à toute profondeur : les notes du meneur, sur un lieu, une campagne, un personnage, une scène. */
const VIDES = new Set(['gmNotes', 'notesDuMeneur']);
/** Ce qui ne part pas du tout, à la racine de la charge. */
const RETIRES_A_LA_RACINE = new Set(['messages', 'lectureDuMeneur']);

export const MASQUE = '•••••';

function caviarder(valeur: unknown): unknown {
    if (Array.isArray(valeur)) return valeur.map(caviarder);
    if (!valeur || typeof valeur !== 'object') return valeur;
    const prototype = Object.getPrototypeOf(valeur);
    if (prototype !== Object.prototype && prototype !== null) return valeur;
    return Object.fromEntries(Object.entries(valeur).map(([cle, v]) => [
        cle,
        MASQUES.has(cle) && typeof v === 'string' ? MASQUE
            : VIDES.has(cle) && typeof v === 'string' ? ''
                : caviarder(v),
    ]));
}

export function caviarderPourLesJoueurs<T>(charge: T): T {
    if (!charge || typeof charge !== 'object' || Array.isArray(charge)) return charge;
    const racine = Object.fromEntries(
        Object.entries(charge).filter(([cle]) => !RETIRES_A_LA_RACINE.has(cle)),
    ) as Record<string, unknown>;

    // Les notes privées du meneur gardent leur place, pas leur texte.
    const notes = racine.notes as { private?: unknown } | undefined;
    if (notes && typeof notes === 'object' && typeof notes.private === 'string') {
        racine.notes = { ...notes, private: MASQUE };
    }

    const session = racine.session as { sessions?: unknown; clues?: unknown } | undefined;
    if (session && typeof session === 'object') {
        const suivante: Record<string, unknown> = { ...session };
        // Les avis de séance laissés par les joueurs ne repartent pas vers les autres.
        if (Array.isArray(session.sessions)) {
            suivante.sessions = session.sessions.map(s => {
                if (!s || typeof s !== 'object') return s;
                const { feedbacks: _avis, ...reste } = s as Record<string, unknown>;
                return reste;
            });
        }
        /*
          **Seuls les indices révélés partent** (S3, 2026-10-22). La tablette ne
          les filtrait qu'à l'affichage (`HubArchives`) : l'indice que le meneur
          garde pour l'acte trois était déjà sur l'appareil de chaque joueur.
        */
        if (Array.isArray(session.clues)) {
            suivante.clues = session.clues.filter(c => !!c && typeof c === 'object' && (c as { isRevealed?: unknown }).isRevealed === true);
        }
        racine.session = suivante;
    }

    return caviarderObjectifsAlien(caviarder(racine)) as T;
}
