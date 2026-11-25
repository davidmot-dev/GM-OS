import { caviarderObjectifsAlien } from '../../dice/systemes/progressionAlien';
import { indicesPourLeLecteur } from '../../session/logic/indicesDuLecteur';

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
/**
 * Notes et secrets du meneur, à toute profondeur. GM-05, 01/11/2026 : les séances
 * prévues et passées partent aussi dans la synchronisation ; leur gmSecrets doit
 * rester sur le MJ, même si la tablette n'affiche que le résumé public.
 */
const VIDES = new Set(['gmNotes', 'notesDuMeneur', 'gmSecrets']);
/** Ce qui ne part pas du tout, à la racine de la charge. */
const RETIRES_A_LA_RACINE = new Set(['messages', 'lectureDuMeneur']);
/**
 * **Ce qui ne part pas du tout, à toute profondeur** — CRI-A01, 24/11/2026 (David : « fais le 1 »).
 * La loyauté des contacts de Crimes et ses appels du scénario : « Variation de leur loyauté — ce
 * point relève de la gestion du meneur pour que les PJ n'en soient pas conscients » (livre p. 430).
 * Le panneau des contacts ne s'affichait déjà qu'au meneur (`ContactsEtFortune`), mais les valeurs
 * étaient déposées sur chaque tablette avec la fiche. Le nom et l'influence du contact restent :
 * le joueur sait qui il connaît.
 *
 * La clé est **retirée**, pas vidée : une fiche renvoyée par la tablette se fusionne à celle du
 * meneur (`sessionActions.updateCharacterSheetData`), une clé absente n'y efface rien. Ces clés
 * sont celles du pilote Crimes (`jet.garde.contacts`, fiche HTML `contacts.N.rating`) ; aucun autre
 * pilote exporté ne les porte (relevé du 24/11). Un jeu dont la loyauté serait publique sous le
 * même nom demanderait de lire la déclaration du pilote, que la charge ne transporte pas.
 */
const RETIRES_PARTOUT = /^contacts_\d+_(rating|appels)$/;

export const MASQUE = '•••••';

function caviarder(valeur: unknown): unknown {
    if (Array.isArray(valeur)) return valeur.map(caviarder);
    if (!valeur || typeof valeur !== 'object') return valeur;
    const prototype = Object.getPrototypeOf(valeur);
    if (prototype !== Object.prototype && prototype !== null) return valeur;
    return Object.fromEntries(Object.entries(valeur).filter(([cle]) => !RETIRES_PARTOUT.test(cle)).map(([cle, v]) => [
        cle,
        MASQUES.has(cle) && typeof v === 'string' ? MASQUE
            : VIDES.has(cle) && typeof v === 'string' ? ''
                : caviarder(v),
    ]));
}

/** Les statuts qui cachent un combattant aux joueurs — la liste de `ecranDeTable.ts` et de `HubCombatTracker`. */
const STATUTS_QUI_CACHENT = ['invisible', 'invisibilité', 'caché', 'hidden'];

interface CombattantLu { isPlayer?: boolean; statuses?: { name?: unknown }[] }

/** Un PNJ marqué invisible ou caché : le meneur le voit, la table non. */
export const estCacheAuxJoueurs = (c: CombattantLu): boolean =>
    !c?.isPlayer && !!c?.statuses?.some(s => typeof s?.name === 'string' && STATUTS_QUI_CACHENT.includes(s.name.toLowerCase()));

/**
 * **Le combat vu par la table : sans les cachés, et avec le bon combattant actif** — essai T15 sur la
 * Fire, 25/11/2026 (registre § 1 bis). Le filtre vivait dans la synchronisation complète, qui retirait
 * les cachés mais gardait l'indice du tour **de la liste complète** : un rôdeur caché avant Wilson, et
 * la tablette surlignait Wilson quand le rôdeur jouait. La voie rapide (`segment 'combat'`), elle,
 * partait sans aucun filtre. L'indice est recalculé dans la liste filtrée ; quand c'est un caché qui
 * joue, il vaut `-1` : la table ne voit personne d'actif, comme l'écran de table montre « ? ».
 */
function combatPourLesJoueurs(combat: unknown): unknown {
    if (!combat || typeof combat !== 'object') return combat;
    const { combatants, currentTurnIdx } = combat as { combatants?: unknown; currentTurnIdx?: unknown };
    if (!Array.isArray(combatants)) return combat;
    const visibles = combatants.filter(c => !estCacheAuxJoueurs(c as CombattantLu));
    const suite: Record<string, unknown> = { ...combat, combatants: visibles };
    if (typeof currentTurnIdx === 'number') {
        const actif = combatants[currentTurnIdx];
        suite.currentTurnIdx = actif === undefined ? currentTurnIdx : visibles.indexOf(actif);
    }
    return suite;
}

/**
 * `lecteur` : le personnage de la tablette qui recevra la charge — un indice
 * qu'il connaît seul lui parvient (Crimes, C5). Absent, à l'émission : les
 * indices connus d'un seul restent, et le serveur resserre ensuite tablette
 * par tablette. `null` : une fenêtre publique, ou une tablette sans personnage.
 */
export function caviarderPourLesJoueurs<T>(charge: T, lecteur?: string | null): T {
    if (!charge || typeof charge !== 'object' || Array.isArray(charge)) return charge;
    const racine = Object.fromEntries(
        Object.entries(charge).filter(([cle]) => !RETIRES_A_LA_RACINE.has(cle)),
    ) as Record<string, unknown>;

    // Les notes privées du meneur gardent leur place, pas leur texte.
    const notes = racine.notes as { private?: unknown } | undefined;
    if (notes && typeof notes === 'object' && typeof notes.private === 'string') {
        racine.notes = { ...notes, private: MASQUE };
    }

    if ('combat' in racine) racine.combat = combatPourLesJoueurs(racine.combat);

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
            suivante.clues = indicesPourLeLecteur(session.clues as { isRevealed?: unknown; connuDe?: unknown }[], lecteur);
        }
        racine.session = suivante;
    }

    return caviarderObjectifsAlien(caviarder(racine)) as T;
}
