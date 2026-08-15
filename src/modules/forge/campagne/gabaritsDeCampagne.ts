import { CANEVAS_DE_CAMPAGNE, enonceDuSujet, type SujetDeCampagne } from './canevasDeCampagne';

/**
 * Les gabarits de l'Atelier de campagne — les invites réellement envoyées au
 * carnet.
 *
 * **Trois lignes valent plus que tout le reste**, et ce sont les mêmes que pour
 * les règles, parce que les trois défauts qu'elles corrigent n'ont rien à voir
 * avec le sujet traité :
 *
 * 1. **L'interdiction d'inventer.** Sans elle, un sujet absent produit du
 *    générique plausible — et un PNJ plausible se joue en séance comme un vrai.
 * 2. **L'obligation de rendre une fiche même sur un sujet non couvert.** Sans
 *    elle, l'absence est invisible, et *invisible vaut faux*.
 * 3. **Les symboles en toutes lettres.** La v1 d'Alien y a perdu quarante-neuf
 *    symboles de réussite rendus en glyphes.
 *
 * **On ne demande PAS l'enregistrement dans le studio.** Mesuré le 2026-08-10 :
 * la consigne détourne le livrable vers le studio du carnet et ne renvoie qu'un
 * compte rendu en prose. À travers MCP, la réponse est tout ce qu'on reçoit.
 *
 * **On ne demande AUCUN numéro de page** — on demande des titres de section. Les
 * pages rendues par le carnet sont fabriquées : neuf fiches Dune sur dix-sept
 * citaient au-delà de la dernière page du livre. Un titre est littéralement dans
 * le texte, et `electron/bookIndex.ts` le résout en page localement.
 *
 * ---
 *
 * **CE QUI CHANGE PAR RAPPORT AUX GABARITS DE RÈGLES, et pourquoi.**
 *
 * **Les fiches ne sont PAS scindées en deux moitiés.** La scission existe côté
 * règles parce que le gabarit entier dépassait le délai de lecture du serveur —
 * 356 secondes puis « the read operation timed out ». Une fiche de campagne est
 * plus courte : elle décrit ce qu'un module contient, pas une mécanique avec sa
 * clause par jauge. On part donc en une requête et **on scindera si la mesure le
 * demande** — on ne paie pas d'avance un coût qu'on n'a pas constaté.
 *
 * **Les exclusions sont inversées.** Le gabarit des règles écarte le bestiaire
 * et les scénarios inclus ; ici, c'est exactement ce qu'on veut, et ce sont les
 * mécaniques qu'on écarte. *Le pilote appartient au jeu, pas à la campagne.*
 *
 * **On demande d'énumérer sans résumer.** C'est la leçon du groupe `fiche` de la
 * Forge Système, payée en réel le 2026-08-13 : dérivée d'Alien, elle avait rendu
 * « Attributs » et « Compétences » **vides l'une comme l'autre**, parce que la
 * cible réclamait nommément les jauges et se taisait sur le reste. *Le modèle
 * fait ce qu'on lui montre.* Une liste de PNJ à moitié rendue ne se voit pas.
 */

/** Les dix sujets numérotés, tels qu'ils sont posés au carnet. */
function listeDesSujets(): string {
    return CANEVAS_DE_CAMPAGNE.map((sujet, i) => `${i + 1}. ${sujet.enonce}`).join('\n');
}

/** Ce qu'on ne veut pas voir remonter, quel que soit le gabarit. */
const EXCLUSIONS = `N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.`;

/** Les consignes de rédaction, communes à tous les gabarits de fiche. */
const REGLES_COMMUNES = `- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « La Chute de Carthag ») ». N'indique JAMAIS de numéro de page, ni
  de numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône,
  nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\\. » ni « \\+ ».
- Garde les NOMS PROPRES exactement tels que le livre les écrit — personnages,
  lieux, factions. Ce sont eux qui relieront les fiches entre elles, et une
  variante orthographique casse le lien sans que rien ne le signale.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  du livre.`;

/**
 * Gabarit 1 — l'inventaire. Une requête, une fois par campagne.
 *
 * Il borne le travail, rend la couverture mesurable, et engendre la liste des
 * requêtes suivantes. Côté règles, c'est lui qui a révélé que *Poursuites* n'est
 * pas couvert par le livre de base de Dune — ce qu'aucune fiche prise seule
 * n'aurait dit.
 */
export function gabaritInventaireDeCampagne(): string {
    return `Tu analyses UNIQUEMENT les sources de ce carnet. Ne complète jamais avec des
connaissances extérieures.

Réponds DIRECTEMENT par le tableau demandé, dans ta réponse elle-même. Ne dépose
rien ailleurs et ne réponds pas par un compte rendu de ce que tu aurais produit :
ta réponse est le livrable.

Ces sources décrivent une CAMPAGNE ou un SCÉNARIO de jeu de rôle — une histoire
à jouer, avec ses lieux, ses personnages et ses intrigues. Pour chacun des sujets
ci-dessous, indique si les sources le traitent, et résume-le en une à deux
phrases :

${listeDesSujets()}

Réponds par un TABLEAU MARKDOWN (avec des barres verticales), colonnes :
Sujet | Traité (oui/partiellement/non) | Contenu | Sections.

La colonne « Contenu » doit être CONCRÈTE : des noms propres, des nombres, des
lieux. « La campagne comporte plusieurs factions » est une réponse inutile ;
« trois maisons : les Atréides, les Harkonnen, les Corrino » en est une.

La colonne « Sections » donne les TITRES EXACTS des chapitres ou sections où se
trouve la matière, tels qu'ils y sont écrits. Aucun numéro de page.

Si un sujet n'est pas couvert par les sources, écris « non couvert par les
sources » — n'invente rien, ne comble pas par analogie avec d'autres campagnes.

${EXCLUSIONS}

Ajoute ensuite une section « Hors catégories » listant ce que cette campagne
contient d'important et qui n'entre dans aucun des ${CANEVAS_DE_CAMPAGNE.length}
sujets.`;
}

/**
 * Gabarit 2 — la structure en actes. **Le second appel, toujours.**
 *
 * Sa réponse découpe les deux sujets qui s'interrogent acte par acte : sans
 * elle, il n'y a rien à border, et « énumère tous les PNJ du module » repart
 * dans une réponse unique qui ne tiendra pas.
 *
 * **On demande la structure telle que le livre la nomme.** Un module qui parle
 * de « chapitres » ne doit pas être forcé de dire « actes » : le modèle
 * reformulerait au lieu de recopier, et on perdrait le titre exact — celui-là
 * même qui bornera les requêtes suivantes.
 */
export function gabaritStructureDeCampagne(): string {
    return `Tu analyses UNIQUEMENT les sources de ce carnet. N'invente rien.

Réponds DIRECTEMENT, dans ta réponse elle-même. Ne dépose rien ailleurs.

Donne la STRUCTURE de cette campagne : la liste ORDONNÉE de ses grandes parties,
telles que le livre les nomme — actes, chapitres, épisodes, parties. N'invente
pas un découpage que les sources ne donnent pas : si la campagne n'est pas
découpée, dis-le et décris son déroulement en une liste d'étapes.

Réponds par un TABLEAU MARKDOWN, colonnes :
Ordre | Titre exact | Enjeu | Sections.

- « Titre exact » : le titre TEL QUE LE LIVRE L'ÉCRIT, sans le traduire, sans le
  raccourcir et sans le renuméroter. C'est ce titre qui servira à interroger
  chaque partie séparément : une variante le rendrait introuvable.
- « Enjeu » : ce qui s'y joue, en deux phrases. Pas le détail des scènes.
- « Sections » : les titres exacts des chapitres correspondants. N'indique
  JAMAIS de numéro de page, ni de numéro de référence interne du carnet : les
  uns comme les autres sont faux une fois sortis d'ici.

Numérote la colonne « Ordre » en chiffres arabes : 1, 2, 3.

${EXCLUSIONS}`;
}

/**
 * Gabarit 3 — une fiche de campagne, sur un sujet du canevas.
 *
 * Une requête par sujet, et pour les deux sujets `parActe`, une requête par acte.
 * **Une seule requête pour plusieurs sujets donne des paragraphes, pas des
 * fiches** — leçon du 2026-08-10, qui tient toujours.
 */
export function gabaritFicheDeCampagne(sujet: SujetDeCampagne, acte?: string): string {
    const titre = acte ? `${sujet.clef} — ${acte}` : sujet.clef;

    return `Tu rédiges une fiche de campagne sur le sujet :
« ${titre} ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Réponds DIRECTEMENT par les sections ci-dessous, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le
livrable.

Format : Markdown, exactement les sections ci-dessous et rien d'autre. N'emploie
aucune ligne de tirets « --- » et aucun bloc de métadonnées en en-tête : commence
directement par « ## Métadonnées ».

## Métadonnées
- sujet : ${sujet.clef}${acte ? `\n- partie : ${acte}` : ''}
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres dont la matière est tirée

## Contenu
${enonceDuSujet(sujet, acte)}

ÉNUMÈRE TOUT ce que les sources donnent sur ce sujet, sans en omettre et sans
résumer. Si les sources nomment douze personnages, la fiche en porte douze. Une
liste à moitié rendue ne se voit pas : personne ne peut deviner ce qui manque.

Donne à chaque élément un TITRE EN GRAS suivi de sa description, un par
paragraphe. N'écris pas un texte suivi.

## Non couvert
Ce que ce sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie JAMAIS une réponse vide : une absence annoncée est une
  information, une absence muette est un trou qu'on découvrira en séance.
${REGLES_COMMUNES}

${EXCLUSIONS}`;
}

/**
 * Toutes les invites d'une campagne, dans l'ordre où l'atelier les posera.
 *
 * **Exporté pour être LU, pas seulement exécuté.** Une invite qu'on ne peut pas
 * relire est une invite qu'on ne corrige jamais — et le 2026-08-14 a montré que
 * *le levier est l'invite, pas le modèle* : les groupes dont on a corrigé
 * l'énoncé ont cessé de se tromper, les autres ont recopié leur erreur au
 * caractère près.
 *
 * `actes` est vide tant que la structure n'est pas connue : les sujets par acte
 * sont alors annoncés sans être développés, ce qui est exactement l'état réel de
 * l'atelier avant son deuxième appel.
 */
export function toutesLesInvites(actes: readonly string[] = []): { titre: string; invite: string }[] {
    const invites = [
        { titre: '1. Inventaire', invite: gabaritInventaireDeCampagne() },
        { titre: '2. Structure en actes', invite: gabaritStructureDeCampagne() },
    ];

    for (const sujet of CANEVAS_DE_CAMPAGNE) {
        // La structure a son gabarit propre : elle n'est pas une fiche.
        if (sujet.clef === 'Structure en actes') continue;

        if (!sujet.parActe) {
            invites.push({ titre: sujet.clef, invite: gabaritFicheDeCampagne(sujet) });
            continue;
        }
        for (const acte of actes) {
            invites.push({ titre: `${sujet.clef} — ${acte}`, invite: gabaritFicheDeCampagne(sujet, acte) });
        }
    }

    return invites;
}
