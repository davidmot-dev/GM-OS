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
 * **L'enregistrement dans le studio est retiré de la version employée par la
 * Forge.** Mesuré le 2026-08-10 : la consigne « Génère un Markdown que tu
 * sauveras dans le studio » fait déposer le livrable dans le studio du carnet,
 * et ne renvoyer dans la réponse qu'un compte rendu en prose — zéro ligne de
 * tableau, donc zéro fiche exploitable. À la main, David ouvrait le fichier du
 * studio ; à travers MCP, la réponse est tout ce qu'on reçoit.
 *
 * L'archive reste précieuse — c'est la seule mémoire du carnet, qui ne conserve
 * pas les conversations — d'où l'option {@link OptionsGabarit.studio}, à
 * n'activer que pour un usage manuel.
 *
 * **Trois lignes de ces gabarits valent plus que tout le reste** : l'interdiction
 * d'inventer, l'obligation de rendre une fiche même sur un sujet non couvert, et
 * les symboles en toutes lettres. Sans la première, un sujet absent produit du
 * générique plausible. Sans la deuxième, l'absence est invisible — et invisible
 * vaut faux. Sans la troisième, la v1 d'Alien perd quarante-neuf symboles de
 * réussite rendus en glyphes.
 */

import { CANEVAS } from './canevas';
import { nomDeLaLangue } from './langueDeForge';

export interface OptionsGabarit {
  /**
   * Demander l'enregistrement dans le studio du carnet.
   *
   * **Faux par défaut, et ce défaut compte** : la consigne détourne le livrable
   * vers le studio et ne laisse qu'un résumé dans la réponse. Ne l'activer que
   * pour un prompt destiné à être copié à la main.
   */
  studio?: boolean;
  /**
   * Titre du **supplément** dont la fiche est tirée — § 185, 01/11/2026.
   * Absent pour le livre de base, dont les gabarits ne changent pas d'un mot.
   */
  supplement?: string;
  /**
   * Langue de la prose (`fr`, `en`…). Seul le mode supplément la pose : le
   * livre de Colonial Marines est anglais, le corpus d'Alien français.
   */
  langue?: string;
}

/** La ligne d'archive, ajoutée seulement pour un usage manuel. */
function consigneStudio(options: OptionsGabarit | undefined, texte: string): string {
  return options?.studio ? `${texte}

` : '';
}

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
export function gabaritInventaire(options?: OptionsGabarit): string {
  return `Tu analyses UNIQUEMENT les sources de ce carnet. Ne complète jamais avec des
connaissances extérieures.

${consigneStudio(options, 'Génère un Markdown que tu sauveras dans le studio.')}Réponds DIRECTEMENT par le tableau demandé, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu de ce que tu aurais
produit : ta réponse est le livrable.

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
de ce jeu qui n'entrent dans aucun des ${CANEVAS.length} sujets. Uniquement les
mécaniques centrales.

Écris tous les symboles en toutes lettres. Si le livre utilise une icône (par
exemple pour marquer une réussite), nomme-la au lieu de la reproduire.

N'aborde PAS : la PROCÉDURE de création de personnage, la progression,
l'équipement et le matériel, l'historique et le background, le bestiaire, les
scénarios inclus.

Le sujet « Composition de la fiche de personnage » fait exception à la première
de ces exclusions, et à elle seule : on veut la LISTE de ce qu'une fiche finie
porte comme valeurs chiffrées, jamais la manière de les choisir.`;
}

/**
 * La consigne de langue d'une fiche de supplément.
 *
 * **Les titres de section restent dans la langue du livre**, et c'est la ligne
 * qui compte : ils sont confrontés à l'index du supplément, écrit dans sa
 * langue. Un titre traduit s'y lirait comme un titre inventé.
 *
 * Le nom original entre parenthèses, décision de David du 01/11 : c'est lui que
 * le meneur retrouve dans le livre, et l'Oracle avec lui.
 */
function consigneDeLangueDuSupplement(langue: string | undefined): string {
  const nom = nomDeLaLangue(langue);
  if (!nom) return '';
  return `- Écris toute la prose en ${nom}, même si le livre est dans une autre
  langue. Donne entre parenthèses le nom ORIGINAL de chaque terme de jeu la
  première fois qu'il paraît — spécialité, talent, arme, véhicule, grade —, par
  exemple « Fusilier (Rifleman) ». Les titres de section des métadonnées, eux,
  restent RECOPIÉS dans la langue du livre.
`;
}

/**
 * Gabarit 1 bis — l'inventaire d'un **supplément** — § 185, 01/11/2026.
 *
 * David : *« je dois pouvoir indiquer à la forge que c'est un supplément et donc
 * que les sujets doivent être plus libres et moins cadrés »*. Le canevas des
 * quatorze sujets est fait pour un livre de base ; un supplément ajoute
 * justement ce que le gabarit 1 exclut — spécialités, talents, armes et
 * véhicules chiffrés, créatures, procédures de campagne (le *Colonial Marines
 * Operations Manual* d'Alien n'est presque que cela). Le carnet propose donc ses
 * sujets, et David choisit lesquels forger.
 *
 * Ce qui reste exclu : l'histoire et l'univers, le texte des scénarios — ni
 * l'un ni l'autre n'est une règle, et la campagne relève de la Forge de campagne.
 */
export function gabaritInventaireDeSupplement(titre: string, options?: OptionsGabarit): string {
  return `Tu analyses UNIQUEMENT les sources de ce carnet, qui sont le SUPPLÉMENT
« ${titre} » d'un jeu de rôle. Ne complète jamais avec des connaissances
extérieures, ni avec le livre de base.

${consigneStudio(options, 'Génère un Markdown que tu sauveras dans le studio.')}Réponds DIRECTEMENT par le tableau demandé, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu de ce que tu aurais
produit : ta réponse est le livrable.

Dresse la liste des RÈGLES que ce supplément apporte, un sujet par ligne, pour
en tirer ensuite une fiche par sujet. Retiens tout ce qui se joue avec des
valeurs ou une procédure : options de création (carrières, spécialités,
talents, grades), équipement chiffré (armes, armures, véhicules, vaisseaux),
créatures et menaces avec leurs caractéristiques, règles de combat, de campagne
ou d'unité, tables aléatoires, règles optionnelles. Regroupe ce qui va
ensemble : « Armes de poing » est un sujet, chaque pistolet n'en est pas un.
Entre dix et vingt-cinq sujets, dans l'ordre du livre.

N'en fais PAS un sujet : l'histoire et l'univers, la géographie, les factions
décrites sans règle, le texte des scénarios et des missions. Si une règle
modifie une règle du livre de base, garde-la et dis ce qu'elle change.

Réponds par un TABLEAU MARKDOWN (avec des barres verticales), colonnes :
Sujet | Mécanique | Sections.

La colonne « Sujet » nomme le sujet en quelques mots${options?.langue && nomDeLaLangue(options.langue) ? `, en ${nomDeLaLangue(options.langue)}, avec le nom original entre parenthèses s'il diffère` : ''}.
La colonne « Mécanique » résume en une à deux phrases les éléments CONCRETS :
valeurs, dés, nombre d'entrées d'une liste.
La colonne « Sections » donne les TITRES EXACTS des chapitres ou sections du
livre, RECOPIÉS dans la langue du livre, tels qu'ils y sont écrits. N'indique
aucun numéro de page et aucun numéro de référence interne du carnet.

N'invente rien. Écris tous les symboles en toutes lettres.`;
}

/**
 * Ce que le mode supplément ajoute aux consignes d'une fiche. Vide pour le
 * livre de base.
 *
 * **Le tableau se recopie, et la longueur suit.** La fiche d'un supplément est
 * souvent une liste chiffrée — dix armes de poing et leurs cinq colonnes. La
 * borne des 2 500 caractères la tronquerait ; on l'élève pour ce cas seul, en
 * sachant qu'une réponse plus longue approche le délai du serveur (356 s mesurées
 * sur le gabarit entier, le 2026-08-10).
 */
function consignesDuSupplement(options: OptionsGabarit | undefined): string {
  if (!options?.supplement) return '';
  return `- Ce sujet vient du SUPPLÉMENT « ${options.supplement} ». Appuie-toi sur
  lui seul. Si la règle modifie une règle du livre de base, dis ce qui change.
- Un tableau du livre (armes, véhicules, spécialités, grades) se recopie en
  TABLEAU MARKDOWN, toutes ses lignes et toutes ses colonnes, sans rien omettre ;
  la fiche peut alors atteindre 4 000 caractères.
- Si le sujet décrit des créatures ou des adversaires chiffrés, « ## Valeurs »
  commence par un TABLEAU DE PROFIL : première colonne « Créature », puis une
  colonne par caractéristique chiffrée telle que le livre la nomme (Vitesse,
  Santé, Protection…) et une par compétence chiffrée ; une ligne par créature ;
  une précision suit le nombre entre parenthèses (« 8 (4 contre le feu) ») ;
  une colonne « Particularités » réunit le reste, séparé par des points-virgules.
  Une table d'attaques tirée au dé se recopie à part, titrée « Tableau des
  attaques de <créature> », colonnes « D6 | Attaque », chaque attaque écrite
  « **Nom** : effet ».
${consigneDeLangueDuSupplement(options.langue)}`;
}

/**
 * Gabarit 2, scindé en deux moitiés.
 *
 * **Pourquoi la scission.** Mesuré le 2026-08-10 : le gabarit entier dépasse le
 * délai de lecture du serveur NotebookLM — 356 secondes, puis « Query failed:
 * The read operation timed out ». L'inventaire, deux fois plus léger, revient en
 * 72 secondes. Ce n'est pas le nombre de sources qui coince mais le volume
 * demandé : trois à cinq mille caractères, six sections, une clause détaillée
 * par jauge.
 *
 * **Pourquoi la moitié et pas l'abrègement.** Raccourcir la fiche aurait coûté
 * du détail — or c'est le détail qui fait la valeur d'une fiche en séance, et
 * David l'a tranché en ces termes. Deux requêtes coûtent du temps, jamais de la
 * qualité.
 *
 * **La coupure passe où le sujet change de nature.** La première moitié dit ce
 * que le livre pose — la règle et ses valeurs, la partie vérifiable ; la seconde
 * dit comment ça se joue et ce qui manque — la partie de jugement. Couper là
 * garde chaque requête cohérente, et chaque moitié reste lisible seule si
 * l'autre échoue.
 *
 * **Une seule requête pour toutes les fiches donne des paragraphes, pas des
 * fiches.** Cette leçon-ci tient toujours : on scinde une fiche, on ne groupe
 * jamais plusieurs sujets.
 */

/** Les consignes de rédaction, communes aux deux moitiés. */
const REGLES_COMMUNES = `- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « Forcer le test ») ». N'indique JAMAIS de numéro de page, ni de
  numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône
  (par exemple pour marquer une réussite), nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\\. » ni « \\+ ».
- Reste dans ton sujet. Si une règle appartient à un autre sujet de la liste,
  mentionne-la en une phrase et renvoie vers lui au lieu de la détailler.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  exact du jeu.`;

/**
 * Première moitié : ce que le livre pose.
 *
 * Porte les métadonnées, parce que c'est d'elles que dépend le classement de la
 * fiche — et qu'une moitié orpheline doit rester rangeable.
 */
export function gabaritFicheRegle(sujet: string, options?: OptionsGabarit): string {
  return `Tu rédiges la PREMIÈRE MOITIÉ d'une fiche de règle sur le sujet :
« ${sujet} ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

${consigneStudio(options, "Génère un Markdown que tu sauveras dans le studio, nommé d'après le sujet.")}Réponds DIRECTEMENT par ces trois sections, dans ta réponse elle-même. Ne dépose
rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le livrable.

Format : Markdown, 1 500 à 2 500 caractères, exactement les trois sections
ci-dessous et rien d'autre. N'emploie aucune ligne de tirets « --- » et aucun
bloc de métadonnées en en-tête : commence directement par « ## Métadonnées ».

## Métadonnées
- sujet : ${sujet}
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres des chapitres ou sections dont la règle est tirée, RECOPIÉS
  MOT POUR MOT tels qu'ils sont imprimés dans le livre — article compris. Ces
  titres sont ensuite CONFRONTÉS À L'INDEX DU LIVRE : un titre approché s'y lit
  comme un titre inventé. Donc jamais de reformulation thématique (« Périls
  Magiques » pour un chapitre qui s'appelle « Queues, souffles et têtes de
  Dragon »), jamais deux titres fondus en un (« Lancement et Réserve » pour
  « Lancer un sort » et « Mise en réserve », qui sont deux sections distinctes),
  jamais un titre que tu formes toi-même à partir du contenu. Si tu ne retrouves
  pas le titre exact, OMETS-LE : une section de moins vaut mieux qu'un titre qui
  ne renvoie à rien.

## Règle
L'énoncé de la règle telle que le livre la pose.

## Valeurs
Toutes les valeurs chiffrées en clair, sous forme de liste : seuils, échelles
ordonnées, durées, modificateurs, nombres de dés. Une échelle se donne dans
l'ordre, du meilleur état au pire.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie jamais une réponse vide.
- Si le sujet porte sur des jauges ou des ressources, traite CHAQUE jauge
  séparément et donne pour chacune : ce qu'elle mesure, sa valeur de départ,
  ses bornes minimale et maximale, si elle monte ou descend quand la situation
  empire, ce qui la fait bouger dans chaque sens, CE QUI SE PRODUIT À CHAQUE
  SEUIL, et si elle se dépense (on la consomme volontairement) ou si elle
  s'accumule (elle subit les événements).
${REGLES_COMMUNES}
${consignesDuSupplement(options)}- N'écris PAS les sections « À la table », « Cas limites » ni « Non couvert » :
  elles font l'objet d'une seconde demande.`;
}

/**
 * **Première moitié d'un sujet d'équipement ou de créatures : les tableaux** — étape F2 du plan
 * `documentation/Planning/2026-11-06-forge-tableaux-equipement-bestiaire.md` (06/11/2026).
 *
 * David, sur COC : *« malgré le fait que j'ai une fiche, rien ne se remplit »* — la fiche du livre
 * de base était en prose, parce que la consigne de tableau n'existait qu'en mode supplément. Ce
 * gabarit la donne à tout livre, avec le format exact des deux lecteurs (« Remplir depuis le
 * corpus ») : première colonne `Arme`/`Protection`/`Véhicule`/`Objet` ou `Créature`, un titre par
 * tableau. Le titre est **celui de la section du livre**, jamais une page : l'index du livre le
 * résout en page, et le carnet donne des pages fausses.
 *
 * Il remplace la première moitié ordinaire au lieu de s'y ajouter : l'invite doit tenir sous la
 * limite de NotebookLM (3 594 caractères acceptés, `questionAuCarnet.test.ts`). La consigne des
 * jauges n'a rien à faire ici.
 */
export function gabaritFicheTableaux(sujet: string, nature: 'equipement' | 'creatures', options?: OptionsGabarit): string {
  const valeurs = nature === 'equipement'
    ? `Recopie CHAQUE tableau du livre sur ce sujet en TABLEAU MARKDOWN (barres
verticales), TOUTES ses lignes et TOUTES ses colonnes, sans résumer :
- avant chaque tableau, une ligne « ### Tableau des <titre exact de sa section> » ;
- sa PREMIÈRE colonne s'intitule exactement « Arme », « Protection », « Véhicule »
  ou « Objet », selon ce qu'il décrit ;
  un tableau qui ne liste pas des objets (une échelle, un couvert, une règle)
  garde la première colonne que lui donne le livre ;
- les autres colonnes gardent les noms du livre ; le prix va dans « Coût », le
  poids dans « Poids » ; une dernière colonne « Spécial » reçoit les notes de bas
  de tableau et les effets propres à la ligne ;
- le nom de chaque objet en gras ; « N/A » ou une case vide s'écrit « – » ;
- si le livre donne les prix dans un autre tableau, par époque, ajoute à l'objet
  une colonne « Prix <année> » par époque quand le nom concorde.`
    : `Commence par un TABLEAU DE PROFIL : première colonne « Créature », puis une
colonne par caractéristique chiffrée telle que le livre la nomme et une par
compétence chiffrée ; une ligne par créature, son nom en gras ; une précision
suit le nombre entre parenthèses (« 8 (4 contre le feu) ») ; une colonne
« Particularités » réunit le reste, séparé par des points-virgules. Une table
d'attaques tirée au dé se recopie à part, titrée « ### Tableau des attaques de
<créature> », colonnes « D6 | Attaque », chaque attaque écrite « **Nom** : effet ».`;
  const supplement = options?.supplement
    ? `- Ce sujet vient du SUPPLÉMENT « ${options.supplement} ». Appuie-toi sur lui seul.
${consigneDeLangueDuSupplement(options.langue)}`
    : '';
  return `Tu rédiges la PREMIÈRE MOITIÉ d'une fiche sur le sujet :
« ${sujet} ». C'est un sujet ${nature === 'equipement' ? "d'ÉQUIPEMENT" : 'de CRÉATURES'} : ses tableaux seront lus ligne à
ligne par un programme.

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

${consigneStudio(options, "Génère un Markdown que tu sauveras dans le studio, nommé d'après le sujet.")}Réponds DIRECTEMENT par ces trois sections, dans ta réponse elle-même : ta
réponse est le livrable. Markdown, jusqu'à 6 000 caractères : un tableau ne se
tronque pas. Aucune ligne « --- » : commence par « ## Métadonnées ».

## Métadonnées
- sujet : ${sujet}
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres des sections d'où viennent les tableaux, RECOPIÉS MOT POUR
  MOT tels qu'imprimés — ils sont confrontés à l'index du livre. Omets un titre
  dont tu n'es pas sûr.

## Règle
En quelques phrases, ce que le livre dit de ${nature === 'equipement' ? 'ces objets' : 'ces créatures'} et comment lire ses tableaux.

## Valeurs
${valeurs}

Règles de rédaction :
${REGLES_COMMUNES}
${supplement}- N'écris PAS « À la table », « Cas limites » ni « Non couvert » : elles font
  l'objet d'une seconde demande.`;
}

/**
 * **F3 — un tableau par requête** (plan des tableaux, 06/11/2026). Le titre de la liste que rend
 * `gabaritEnteteDesTableaux` : la forge la lit, découpe en lots, puis la retire de la fiche.
 */
export const TITRE_DES_TABLEAUX_ANNONCES = 'Tableaux du livre';

/**
 * F3, première requête : métadonnées, règle, et la **liste** des tableaux (équipement) ou des
 * créatures (bestiaire) que le livre donne sur le sujet, avec le nombre de lignes. Courte à rendre :
 * c'est elle qui fait tenir un long chapitre en plusieurs réponses, et le nombre annoncé devient le
 * contrôle « 15 armes attendues, 12 recopiées ».
 */
export function gabaritEnteteDesTableaux(sujet: string, nature: 'equipement' | 'creatures', options?: OptionsGabarit): string {
  const liste = nature === 'equipement'
    ? `Un TABLEAU MARKDOWN de deux colonnes, « Tableau | Lignes » : une ligne par
tableau du livre sur ce sujet (armes, protections, véhicules, matériel, prix) ;
« Tableau » = le titre exact de sa section, tel qu'imprimé ; « Lignes » = le
nombre d'objets qu'il décrit, en chiffres. Ne recopie PAS les tableaux eux-mêmes.`
    : `Un TABLEAU MARKDOWN de deux colonnes, « Créature | Section » : une ligne par
créature ou adversaire dont le livre donne un profil chiffré ; « Section » = le
titre exact de la section où figure son profil. Ne recopie PAS les profils.`;
  const supplement = options?.supplement
    ? `- Ce sujet vient du SUPPLÉMENT « ${options.supplement} ». Appuie-toi sur lui seul.
${consigneDeLangueDuSupplement(options.langue)}`
    : '';
  return `Tu prépares une fiche sur le sujet : « ${sujet} ». C'est un sujet
${nature === 'equipement' ? "d'ÉQUIPEMENT" : 'de CRÉATURES'} : ses tableaux seront recopiés ensuite, un à un.

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

${consigneStudio(options, "Génère un Markdown que tu sauveras dans le studio, nommé d'après le sujet.")}Réponds DIRECTEMENT par ces trois sections, dans ta réponse elle-même : ta
réponse est le livrable. Markdown, 800 à 2 000 caractères. Aucune ligne « --- » :
commence par « ## Métadonnées ».

## Métadonnées
- sujet : ${sujet}
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres des sections d'où viennent les tableaux, RECOPIÉS MOT POUR
  MOT tels qu'imprimés — ils sont confrontés à l'index du livre. Omets un titre
  dont tu n'es pas sûr.

## Règle
En quelques phrases, ce que le livre dit de ${nature === 'equipement' ? 'ces objets' : 'ces créatures'} et comment lire ses tableaux.

## ${TITRE_DES_TABLEAUX_ANNONCES}
${liste}

Règles de rédaction :
${REGLES_COMMUNES}
${supplement}- N'écris rien d'autre : ni valeurs, ni « À la table ».`;
}

/**
 * F3, les requêtes suivantes : **un lot** de tableaux (ou de créatures), au format exact des
 * lecteurs — le même que `gabaritFicheTableaux`, restreint au lot, avec le nombre de lignes attendu.
 */
export function gabaritDesTableaux(
  sujet: string,
  nature: 'equipement' | 'creatures',
  lot: readonly { titre: string; attendu: number | null }[],
  options?: OptionsGabarit,
): string {
  const noms = lot.map(p => `« ${p.titre} »${p.attendu ? ` (${p.attendu} lignes)` : ''}`).join(', ');
  const consigne = nature === 'equipement'
    ? `Recopie SEULEMENT ces tableaux du livre : ${noms}. Pour chacun, en TABLEAU
MARKDOWN (barres verticales), TOUTES ses lignes et TOUTES ses colonnes, sans
résumer :
- avant le tableau, une ligne « ### Tableau des <titre exact de sa section> » ;
- sa PREMIÈRE colonne s'intitule exactement « Arme », « Protection », « Véhicule »
  ou « Objet », selon ce qu'il décrit ;
  un tableau qui ne liste pas des objets (une échelle, un couvert, une règle)
  garde la première colonne que lui donne le livre ;
- les autres colonnes gardent les noms du livre ; le prix va dans « Coût », le
  poids dans « Poids » ; une dernière colonne « Spécial » reçoit les notes de bas
  de tableau et les effets propres à la ligne ;
- le nom de chaque objet en gras ; « N/A » ou une case vide s'écrit « – » ;
- si le livre donne les prix dans un autre tableau, par époque, ajoute à l'objet
  une colonne « Prix <année> » par époque quand le nom concorde.`
    : `Recopie SEULEMENT les profils de ces créatures : ${noms}. Un TABLEAU DE
PROFIL, précédé de « ### Tableau des profils » : première colonne « Créature »,
puis une colonne par caractéristique chiffrée telle que le livre la nomme et une
par compétence chiffrée ; une ligne par créature, son nom en gras ; une précision
suit le nombre entre parenthèses (« 8 (4 contre le feu) ») ; une colonne
« Particularités » réunit le reste, séparé par des points-virgules. Une table
d'attaques tirée au dé se recopie à part, titrée « ### Tableau des attaques de
<créature> », colonnes « D6 | Attaque », chaque attaque écrite « **Nom** : effet ».`;
  const supplement = options?.supplement
    ? `- Ce sujet vient du SUPPLÉMENT « ${options.supplement} ». Appuie-toi sur lui seul.
${consigneDeLangueDuSupplement(options.langue)}`
    : '';
  return `Fiche sur le sujet « ${sujet} » : ses tableaux seront lus ligne à ligne par un
programme.

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si un tableau n'y est pas,
écris « Absent des sources : <titre> » plutôt que de le compléter.

${consigneStudio(options, "Génère un Markdown que tu sauveras dans le studio, nommé d'après le sujet.")}Réponds DIRECTEMENT par les tableaux, dans ta réponse elle-même, et rien d'autre :
ni titre « ## », ni introduction, ni « À la table ». Aucune ligne « --- ».
Jusqu'à 6 000 caractères : un tableau ne se tronque pas.

${consigne}

Règles :
- Recopie les chiffres tels qu'imprimés ; n'invente aucune ligne.
${supplement}`;
}

/**
 * Seconde moitié : comment ça se joue, et ce qui manque.
 *
 * Le sujet est rappelé en toutes lettres : rien ne garantit que le carnet garde
 * le fil d'une requête à l'autre, et une seconde moitié qui parlerait d'autre
 * chose que la première serait pire qu'une moitié absente.
 */
export function gabaritFichePratique(sujet: string, options?: OptionsGabarit): string {
  return `Tu rédiges la SECONDE MOITIÉ d'une fiche de règle sur le sujet :
« ${sujet} ». La première moitié — la règle et ses valeurs chiffrées — a déjà
été rédigée : ne la répète pas.

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

${consigneStudio(options, "Génère un Markdown que tu sauveras dans le studio, nommé d'après le sujet.")}Réponds DIRECTEMENT par ces trois sections, dans ta réponse elle-même. Ne dépose
rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le livrable.

Format : Markdown, 1 500 à 2 500 caractères, exactement les trois sections
ci-dessous et rien d'autre. N'emploie aucune ligne de tirets « --- ». Commence
directement par « ## À la table ».

## À la table
Comment cela se joue concrètement, tour par tour si pertinent.

## Cas limites
Ce que le livre précise sur les situations ambiguës.

## Non couvert
Ce que le sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas ce sujet, écris-le dans « Non couvert » et
  garde les deux autres sections courtes. Ne renvoie jamais une réponse vide.
- Ne réécris ni la règle ni les valeurs chiffrées : elles sont déjà posées.
${REGLES_COMMUNES}
${consignesDuSupplement(options)}`.trimEnd();
}

/**
 * Prompt A — la fiche de voix. Une fois par système.
 *
 * Elle décrit la VOIX du jeu, pas ses règles. Le prompt B s'appuie dessus : les
 * deux s'enchaînent **dans la même conversation**.
 */
export function promptVoix(options?: OptionsGabarit): string {
  return `Tu analyses UNIQUEMENT les sources de ce carnet. N'invente rien.

Je cherche à décrire la VOIX de ce jeu, pas ses règles. Ignore complètement les
mécaniques chiffrées.

${consigneStudio(options, 'Génère un Markdown que tu sauveras dans le studio.')}Réponds DIRECTEMENT par le document, dans ta réponse elle-même, avec ces
sections :

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
export function promptPersonas(options?: OptionsGabarit): string {
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

Ta réponse doit être cet objet JSON et rien d'autre : ne le dépose pas
ailleurs, ne le commente pas, ne le résume pas.${options?.studio ? `\nEnregistre-le également dans le studio sous le nom "gems.json".` : ''}`;
}
