import { aiService } from '../../ai/AIService';
import { CATALOGUE_DES_EFFETS, CATEGORIES } from './catalogueDesEffets';
import { SCHEMA_DE_L_AMBIANCE, type AmbianceProposee } from './ambianceProposee';
import type { HueLight } from '../useLightStore';

/** Ce que l'IA doit savoir de la scène pour proposer quelque chose de juste. */
export interface ScenePourLAmbiance {
    titre: string;
    resume?: string;
    /** Le lieu, tel que l'Atlas le nomme. */
    lieu?: string;
    /** Le jeu de la campagne — une taverne de Rêves de Dragons n'éclaire pas comme un sas d'Alien. */
    jeu?: string;
}

/**
 * **Les effets offerts au modèle, groupés par famille.**
 *
 * ⛔ **On ne lui donne que les identifiants, jamais les noms traduits.** Deux
 * chaînes pour une même chose, et il rendra la mauvaise — *« Bougie » au lieu
 * de `candle`*, que le moteur ne reconnaîtrait pas. Les identifiants sont
 * parlants (`foret-profonde`, `crepuscule`, `chute-de-tension`) : ils suffisent.
 */
const catalogueEnTexte = (): string =>
    CATEGORIES.map(famille => {
        const ids = CATALOGUE_DES_EFFETS
            .filter(e => e.categorie === famille)
            .map(e => e.valeur)
            .join(', ');
        return `- ${famille} : ${ids}`;
    }).join('\n');

/**
 * **L'invite — et son ordre n'est pas décoratif.**
 *
 * ⭐ *Ce qui décide du COMPTE s'énonce avant ce qui décide du CONTENU.* Leçon
 * payée à la Forge Système : une consigne de cardinalité noyée au milieu d'une
 * invite est perdue, et le modèle rend trois lampes quand il y en a six. Le
 * nombre d'entrées est donc la **première** phrase.
 *
 * ⚠️ **Et une consigne remontée en tête doit encore dire vrai** : la liste des
 * lampes est construite à partir des vraies lampes du pont, pas d'un exemple.
 */
const inviteSysteme = (lampes: HueLight[]): string => {
    const noms = lampes.map(l => `« ${l.name} »`).join(', ');

    return `Tu composes un éclairage de table de jeu de rôle à partir de lampes connectées.

RÈGLE DE COMPTE — la plus importante :
Le tableau "lampes" contient EXACTEMENT ${lampes.length} entrées, une par lampe, dans cet ordre : ${noms}.
Tu recopies le champ "lampe" mot pour mot depuis cette liste. N'invente aucune lampe, n'en omets aucune.

POUR CHAQUE LAMPE :
- "couleur" : un hexadécimal, et rien d'autre — "#ff9a3c". Jamais un nom de couleur.
- "brillance" : un entier de 0 à 100. 0 éteint la lampe, ce qui est un choix légitime pour créer un contraste.
- "effet" : un identifiant EXACT de la liste ci-dessous, ou "none" pour une lumière fixe.

EFFETS DISPONIBLES — recopie l'identifiant tel quel :
${catalogueEnTexte()}
- aucun effet : none

COMMENT COMPOSER :
- Une pièce éclairée uniformément n'est pas une ambiance. Varie les brillances : une lampe dominante, une ou deux en appoint, parfois une éteinte.
- Les effets coûtent cher au pont : n'en mets au plus que sur deux lampes, et laisse les autres fixes.
- La couleur porte le lieu et l'heure ; l'effet porte ce qui bouge (une flamme, un orage, une alarme). Une scène calme n'a pas besoin d'effet.

ENFIN :
- "nom" : deux à quatre mots, le nom qu'aura la tuile. Pas le titre de la scène recopié.
- "justification" : UNE phrase, en français, qui dit ce que cet éclairage fait à la table.

Réponds en JSON strict, sans commentaire.`;
};

/** Le contexte de la scène, mis en forme pour le modèle. */
const inviteDeLaScene = (scene: ScenePourLAmbiance): string => {
    const lignes = [`SCÈNE : ${scene.titre}`];
    if (scene.jeu) lignes.push(`JEU : ${scene.jeu}`);
    if (scene.lieu) lignes.push(`LIEU : ${scene.lieu}`);
    if (scene.resume?.trim()) lignes.push(`CE QUI S'Y JOUE :\n${scene.resume.trim()}`);
    return lignes.join('\n');
};

/**
 * **Demander une ambiance à l'IA pour une scène de la trame.**
 *
 * `sansPersona` : c'est une **composition structurée**, pas une prise de parole
 * de meneur. La voix de la campagne active et le RAG n'ont rien à y faire — et
 * le schéma est imposé au décodeur, ce qui garantit la forme, pas le contenu.
 * *La forme est garantie ici ; le contenu est vérifié par `ambianceProposee`.*
 *
 * ⚠️ **Rien n'est appliqué, rien n'est écrit.** La fonction rend une
 * proposition ; c'est le meneur qui l'essaie, l'enregistre ou la refuse. C'est
 * la règle déjà suivie par la conversion de butin — *une regex sur de la prose
 * se trompe, et un contrôle qui se trompe est pire qu'un contrôle absent.*
 *
 * @throws si le modèle est injoignable ou rend une réponse illisible. L'appelant
 *         le dit à l'écran : *un geste sans effet passe pour une panne.*
 */
export async function proposerUneAmbiance(
    scene: ScenePourLAmbiance,
    lampes: HueLight[],
): Promise<AmbianceProposee> {
    if (lampes.length === 0) {
        throw new Error('AUCUNE_LAMPE');
    }

    return aiService.generateJSON<AmbianceProposee>(
        inviteDeLaScene(scene),
        inviteSysteme(lampes),
        undefined,
        {
            sansPersona: true,
            schema: SCHEMA_DE_L_AMBIANCE as unknown as Record<string, unknown>,
            libelle: `Ambiance lumineuse — ${scene.titre}`,
        },
    );
}
