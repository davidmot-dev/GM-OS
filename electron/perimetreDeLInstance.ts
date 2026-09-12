import path from 'node:path';

/**
 * **Ce que cette instance de GM-OS a le droit de toucher.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE MODULE EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `--user-data-dir` isole **ce qui vit dans le profil** — base, stockage local,
 * coffre des clés, médias. Trois choses lui échappaient, et ce sont justement
 * celles qui touchent au travail du meneur ou à sa pièce :
 *
 * | Quoi | Où ça allait |
 * | --- | --- |
 * | le corpus de règles | `APP_ROOT/docs` — **le dépôt lui-même** |
 * | le coffre Obsidian | le dossier personnel du meneur |
 * | le pont Hue, l'afficheur Ulanzi | le réseau, donc **le salon** |
 *
 * Une instance de répétition — ou un test de bout en bout — doit pouvoir les
 * déplacer ou les taire. *Un environnement d'essai qui écrit dans le vrai corpus
 * n'est pas un environnement d'essai.*
 *
 * ⚠️ **Sans variable, rien ne change.** Les valeurs par défaut sont celles
 * d'aujourd'hui, exactement. *Rendre réglable ne doit jamais vouloir dire
 * déplacer.*
 */

export const VARIABLE_RACINE_DOCS = 'GMOS_RACINE_DOCS';
export const VARIABLE_COFFRE_OBSIDIAN = 'GMOS_COFFRE_OBSIDIAN';
export const VARIABLE_SANS_APPAREILS = 'GMOS_SANS_APPAREILS';
export const VARIABLE_SEMENCE = 'GMOS_SEMENCE';

/** Le coffre Obsidian du meneur, quand rien ne le déplace. */
export const COFFRE_OBSIDIAN_PAR_DEFAUT = 'C:\\Users\\david\\OneDrive\\Obsidian Vault';

type Environnement = Record<string, string | undefined>;

/** Une valeur d'environnement utilisable, ou `undefined` — le vide n'est pas un choix. */
function posee(valeur: string | undefined): string | undefined {
    return valeur !== undefined && valeur.trim() !== '' ? valeur.trim() : undefined;
}

/**
 * La racine du corpus de règles.
 *
 * ⚠️ C'est elle que lisent **l'Oracle, la Forge et le serveur des fiches** — et
 * c'est elle qu'écrivent `ai:write-doc` et `ai:delete-doc`. La déplacer met donc
 * tout le corpus ailleurs, lecture comprise : une instance d'essai ne verra pas
 * les fiches du meneur, et c'est voulu.
 */
export function racineDuCorpus(env: Environnement, appRoot: string): string {
    return posee(env[VARIABLE_RACINE_DOCS]) ?? path.join(appRoot, 'docs');
}

/** La racine du coffre Obsidian. */
export function coffreObsidian(env: Environnement): string {
    return posee(env[VARIABLE_COFFRE_OBSIDIAN]) ?? COFFRE_OBSIDIAN_PAR_DEFAUT;
}

/**
 * Les appareils sont-ils muets ?
 *
 * ⛔ **Le seul interrupteur qui protège une pièce.** Sans lui, un test qui passe
 * sur Light-OS allume les lampes du salon, et un test d'Ulanzi écrit sur
 * l'afficheur — *des effets qu'aucune assertion ne peut annuler.*
 *
 * ⚠️ **Seuls `1`, `true` et `oui` valent vrai.** Tout le reste — y compris `0`,
 * `false` et une faute de frappe — laisse les appareils répondre. C'est le sens
 * prudent : *un interrupteur de sécurité qu'on croit armé sur un malentendu est
 * pire qu'un interrupteur absent*, et mieux vaut qu'une variable mal écrite se
 * remarque (les lampes s'allument) plutôt qu'elle ne se cache (le test passe en
 * silence sans rien avoir piloté).
 */
export function appareilsMuets(env: Environnement): boolean {
    const valeur = posee(env[VARIABLE_SANS_APPAREILS])?.toLowerCase();
    return valeur === '1' || valeur === 'true' || valeur === 'oui';
}

/**
 * Le fichier de sauvegarde dont cette instance doit partir, s'il y en a un.
 *
 * ⛔ **Rien ne sème sans cette variable.** Une instance ordinaire rend
 * `undefined` et ne lit aucun fichier : *un mecanisme qui peut remplacer l'etat
 * du meneur doit demander a exister, pas demander a etre desactive.*
 *
 * ⚠️ Et ce n'est que la moitie de la garde. L'autre est cote ecran : la semence
 * n'est appliquee **qu'apres l'hydratation** et **que si aucune campagne n'est
 * presente**. Semer par-dessus des donnees existantes serait exactement la perte
 * qu'on passe le mois a empecher.
 */
export function fichierDeSemence(env: Environnement): string | undefined {
    return posee(env[VARIABLE_SEMENCE]);
}
