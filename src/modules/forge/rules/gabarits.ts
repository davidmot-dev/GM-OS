/**
 * Les quatre gabarits v3, en toutes lettres.
 *
 * Deux pour le corpus de règles (inventaire, fiche), deux pour les personas
 * (fiche de voix, puis les huit gemmes). Transcrits depuis
 * `documentation/Planning/2026-08-09-procedure-corpus-notebooklm.md` § 8 — les
 * prompts A et B sont ceux de David, ils ont produit les personas d'Alien et de
 * Dune.
 *
 * **Ce que la v3 change, et pourquoi c'est le seul changement qui comptait.**
 * On ne demande plus de numéros de page, on demande des **titres de section**.
 * Les pages rendues par le carnet sont fabriquées — neuf fiches Dune sur dix-sept
 * citaient au-delà de la dernière page du livre. Un titre, lui, est littéralement
 * dans le texte : le carnet le rapporte fidèlement, et `electron/bookIndex.ts`
 * le résout en page localement, contre l'index du livre.
 *
 * **Trois lignes de ces gabarits valent plus que tout le reste** : l'interdiction
 * d'inventer, l'obligation de rendre une fiche même sur un sujet non couvert, et
 * les symboles en toutes lettres. Sans la première, un sujet absent produit du
 * générique plausible. Sans la deuxième, l'absence est invisible — et invisible
 * vaut faux. Sans la troisième, la v1 d'Alien perd quarante-neuf symboles de
 * réussite rendus en glyphes.
 */

import { CANEVAS } from './canevas';

/** Les treize sujets numérotés, tels qu'ils sont posés au carnet. */
function listeDesSujets(): string {
  return CANEVAS.map((sujet, i) => `${i + 1}. ${sujet.enonce}`).join('\n');
}

/**
 * Gabarit 1 — inventaire. Une requête, une fois par système.
 *
 * Il borne le travail, rend la couverture mesurable, et engendre la liste des
 * requêtes du gabarit 2. Sur Dune, il a révélé que *Poursuites* n'est pas couvert
 * par le livre de base — ce qu'aucune fiche prise seule n'aurait dit.
 */
export function gabaritInventaire(): string {
  return `Tu analyses UNIQUEMENT les sources de ce carnet. Ne complète jamais avec des
connaissances extérieures.

Génère un Markdown que tu sauveras dans le studio.

Pour chacun des sujets ci-dessous, indique si ce jeu le traite, et résume sa
mécanique en une à deux phrases maximum :

${listeDesSujets()}

Réponds par un TABLEAU MARKDOWN (avec des barres verticales), colonnes :
Sujet | Traité (oui/partiellement/non) | Mécanique | Sections.

La colonne « Mécanique » doit contenir les éléments CONCRETS : dés employés et
leur taille, seuils chiffrés, nombre de niveaux d'une échelle. « On lance des
dés et on compare à un seuil » est une réponse inutile.

La colonne « Sections » donne les TITRES EXACTS des chapitres ou sections du
livre où se trouve la règle, tels qu'ils y sont écrits. N'indique aucun numéro
de page et aucun numéro de référence interne du carnet.

Si un sujet n'est pas couvert par les sources, écris « non couvert par les
sources » — n'invente rien, ne comble pas par analogie avec d'autres jeux.

Ajoute ensuite une section « Hors catégories » listant les mécaniques CENTRALES
de ce jeu qui n'entrent dans aucun des 13 sujets. Uniquement les mécaniques
centrales.

Écris tous les symboles en toutes lettres. Si le livre utilise une icône (par
exemple pour marquer une réussite), nomme-la au lieu de la reproduire.

N'aborde PAS : création de personnage, progression, équipement et matériel,
historique et background, bestiaire, scénarios inclus.`;
}

/**
 * Gabarit 2 — fiche détaillée. À rejouer par sujet, treize fois au minimum.
 *
 * **Une seule requête pour toutes les fiches donne des paragraphes, pas des
 * fiches.** C'est la première correction apportée à la proposition initiale, et
 * elle tient toujours.
 */
export function gabaritFiche(sujet: string): string {
  return `Tu rédiges une fiche de règle sur le sujet : « ${sujet} ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Génère un Markdown que tu sauveras dans le studio, nommé d'après le sujet.

Format de sortie : Markdown, 3 000 à 5 000 caractères, structuré exactement
selon les six sections ci-dessous. N'emploie aucune ligne de tirets « --- » et
aucun bloc de métadonnées en en-tête : commence directement par la section
« Métadonnées ».

## Métadonnées
- sujet : ${sujet}
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres ou sections dont la règle est tirée

## Règle
L'énoncé de la règle telle que le livre la pose.

## Valeurs
Toutes les valeurs chiffrées en clair, sous forme de liste : seuils, échelles
ordonnées, durées, modificateurs, nombres de dés. Une échelle se donne dans
l'ordre, du meilleur état au pire.

## À la table
Comment cela se joue concrètement, tour par tour si pertinent.

## Cas limites
Ce que le livre précise sur les situations ambiguës.

## Non couvert
Ce que le sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même la fiche
  avec « couverture : absente » et explique en une phrase ce que tu as cherché.
  Ne renvoie jamais une réponse vide.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « Forcer le test ») ». N'indique JAMAIS de numéro de page, ni de
  numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône
  (par exemple pour marquer une réussite), nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\\. » ni « \\+ ».
- Reste dans ton sujet. Si une règle appartient à un autre sujet de la liste,
  mentionne-la en une phrase et renvoie vers lui au lieu de la détailler.
- Si le sujet porte sur des jauges ou des ressources, traite CHAQUE jauge
  séparément et donne pour chacune : ce qu'elle mesure, sa valeur de départ,
  ses bornes minimale et maximale, si elle monte ou descend quand la situation
  empire, ce qui la fait bouger dans chaque sens, CE QUI SE PRODUIT À CHAQUE
  SEUIL, et si elle se dépense (on la consomme volontairement) ou si elle
  s'accumule (elle subit les événements).
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  exact du jeu.`;
}

/**
 * Prompt A — la fiche de voix. Une fois par système.
 *
 * Elle décrit la VOIX du jeu, pas ses règles. Le prompt B s'appuie dessus : les
 * deux s'enchaînent **dans la même conversation**.
 */
export function promptVoix(): string {
  return `Tu analyses UNIQUEMENT les sources de ce carnet. N'invente rien.

Je cherche à décrire la VOIX de ce jeu, pas ses règles. Ignore complètement les
mécaniques chiffrées.

Génère un Markdown que tu sauveras dans le studio, avec ces sections :

## Vocabulaire de la table
- Comment le livre nomme le meneur de jeu (terme exact).
- Comment il nomme les joueurs et leurs personnages.
- Les dix à vingt termes propres au jeu qu'un meneur emploie à voix haute,
  avec en une ligne ce que chacun désigne. Mélange termes de mécanique et
  termes d'univers.
- Les termes génériques de jeu de rôle que ce jeu REMPLACE par les siens.

## Registre
Le ton du livre lui-même : son rythme, son niveau de langue, ce qu'il montre et
ce qu'il tait. Cite deux ou trois formulations caractéristiques du texte.

## Ce que le jeu veut faire ressentir
En trois phrases : l'émotion visée à la table, et par quels moyens le livre dit
qu'on l'obtient.

## Interdits
Ce qu'un meneur de ce jeu ne fait jamais — de ton, de posture ou de traitement
des personnages. Uniquement ce que les sources affirment ou impliquent
clairement.

## Non couvert
Ce que tu n'as pas trouvé dans les sources. Écris « rien » si tout est couvert.

Cite tes sources par titre de section, jamais par numéro de page. Écris les
symboles en toutes lettres. N'échappe pas la ponctuation. N'emploie aucune
ligne de tirets « --- ».`;
}

/**
 * Prompt B — les huit personas. À enchaîner dans la même conversation que A.
 *
 * **Une persona porte une voix, jamais des règles.** Le RAG fournit déjà les
 * règles ; une persona qui les affirme finira par les contredire. Démontré au
 * premier essai : le Stratège d'Alien v1 énonçait « la mort est toujours
 * instantanée et inéluctable », que `sante-et-blessures.md`, tirée du même livre,
 * contredit.
 *
 * Les huit clés ne sont pas négociables : `AIService` indexe par `gemId`, et une
 * clé inconnue est du travail perdu. Elles sont définies dans
 * `src/stores/useGemStore.ts` et verrouillées par `electron/systemPersonas.test.ts`.
 */
export function promptPersonas(): string {
  return `À partir de la fiche de voix que tu viens de produire et des sources du carnet,
rédige HUIT personas d'assistant IA spécialisées pour ce jeu.

Chaque persona sera placée en tête du prompt d'un assistant. Elle doit donc :

- être AUTOSUFFISANTE : énoncer le rôle de l'assistant ET la voix du jeu, car
  elle remplace intégralement l'instruction générique ;
- faire entre 400 et 700 caractères. Pas davantage : elle est envoyée à chaque
  question, sa longueur se paie à chaque fois ;
- porter du VOCABULAIRE et de la POSTURE, jamais des règles chiffrées. Aucun
  seuil, aucune formule, aucune table : les règles sont fournies séparément à
  l'assistant, et une persona qui les répète finira par les contredire ;
- employer le terme exact par lequel ce jeu désigne le meneur de jeu ;
- inclure une interdiction concrète, tirée de la section « Interdits ».
- L'interdit doit porter sur ce que L'ASSISTANT ne doit pas faire dans son rôle
  précis, et non sur ce que le livre interdit au meneur de jeu. Inspire-t'en,
  mais transpose : un assistant qui résume des séances passées ne peut pas se
  voir interdire d'en planifier la fin.
- N'énonce AUCUNE règle chiffrée ni aucun fait de règle, même en passant, même
  sous forme d'ambiance ("la mort est toujours instantanée"). Les règles sont
  fournies séparément et une persona qui les affirme finira par les contredire.

Ne dis pas « réponds en français » ni « cite tes sources » : ces consignes sont
déjà ajoutées ailleurs.

Les huit rôles :
- sage : les règles, les statistiques, la mécanique. Précis et technique.
- scribe : consigner l'histoire, résumer les séances, organiser les notes.
- oracle : improvisation narrative, ambiance, rebondissements dramatiques.
- bard : enrichir l'univers, lore, détails et textes d'ambiance.
- alchemist : génération technique d'objets et de caractéristiques de PNJ.
- actor : interpréter les PNJ — voix, tics de langage, motivations, dialogues.
- cartographer : décrire les lieux, les paysages, l'architecture.
- strategist : analyser une situation de combat et suggérer des manœuvres.

Réponds UNIQUEMENT par un objet JSON valide, sans commentaire ni bloc de code
autour, exactement de cette forme :

{
  "sage": "…",
  "scribe": "…",
  "oracle": "…",
  "bard": "…",
  "alchemist": "…",
  "actor": "…",
  "cartographer": "…",
  "strategist": "…"
}

Génère le fichier JSON dans le studio sous le nom "gems.json"`;
}
