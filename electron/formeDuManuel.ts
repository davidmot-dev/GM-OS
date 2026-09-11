/**
 * **La forme du manuel — partagée par le processus principal et les écrans.**
 *
 * ⛔ **Ce fichier n'importe RIEN**, et surtout pas `node:path` ni `fs-extra`.
 * C'est sa raison d'être : `AideDashboard` a besoin des familles et du nom du
 * dossier, et il tourne dans le navigateur. Les prendre dans `guidesDuManuel.ts`
 * y ferait entrer `fs-extra` par la porte des imports.
 *
 * Le bundle survivait — Vite élaguait les imports inutilisés — mais *une
 * correction qui ne tient que par l'élagage d'un outil est une correction qu'on
 * casse sans le voir*. Le jour où ce module de lecture gagne un effet de bord au
 * niveau module, l'écran d'aide cesse de se construire, et le message parlera de
 * `graceful-fs`.
 *
 * Même parti pris que `mcpActivity.ts` : *c'est le contrat qu'on partage, pas du
 * code.*
 */

/**
 * Le dossier du manuel, relatif à la racine de l'application.
 *
 * ⚠️ Écrit avec des barres obliques, pas avec `path.join` : il sert aussi à
 * construire une URL `gmos://`, et un antislash n'y a rien à faire.
 */
export const DOSSIER_DU_MANUEL = 'documentation/User Guides';

/**
 * **Les familles, déduites du numéro de fichier.**
 *
 * L'index du manuel énonce lui-même la convention : « `0x` pour démarrer, `1x`
 * la préparation, `2x` le monde… ». On la lit donc au lieu de la recopier dans
 * une seconde liste que personne ne tiendrait à jour.
 *
 * ⚠️ Un guide dont le nom ne commence pas par un chiffre tombe dans `autres` :
 * c'est un fait à afficher, pas une erreur à taire.
 */
export const FAMILLES_DU_MANUEL: Record<string, string> = {
    '0': 'Commencer',
    '1': 'Préparer la campagne',
    '2': 'Le monde et ce qu’on montre',
    '3': 'Le jeu à la table',
    '4': 'Tables et butin',
    '5': 'Les règles',
    '6': 'Les tablettes',
    '7': 'L’ambiance',
    '8': 'L’IA',
    '9': 'Transporter et régler',
    autres: 'Autres',
};

export interface GuideDuManuel {
    /** Le nom de fichier, qui sert d'identifiant stable. */
    nom: string;
    /** Le titre affiché — le premier `#` du fichier, ou le nom à défaut. */
    titre: string;
    /** La clé de famille, tirée du premier chiffre du nom. */
    famille: string;
    /** Le markdown entier. */
    contenu: string;
}
