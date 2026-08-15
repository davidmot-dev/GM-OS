import { rabattreSurLeCanevas, slugFiche, type SujetCanevas } from '../rules/canevas';

/**
 * Le canevas des dix sujets d'une campagne.
 *
 * **Pourquoi une liste fournie, et jamais demandée.** C'est la leçon du canevas
 * des règles, et elle vaut ici pour la même raison : demander au carnet quels
 * sujets traiter fait dériver la taxonomie d'un module à l'autre, chaque livre
 * invente la sienne, et deux campagnes cessent d'être comparables. La liste est
 * donc *fournie* ; ce sont les **réponses** qui varient — y compris le nombre
 * d'actes, qui se lit dans le livre.
 *
 * **Pourquoi ces dix sujets et pas d'autres : ils sont dérivés de ce que le code
 * consomme.** Le canevas des règles l'avait été des champs du pilote ; celui-ci
 * l'est des sept destinations d'une campagne — `Campaign`, `Acte`, `Scene`,
 * `Entity`, `AtlasMap`, `WikiEntry`, `Clue`. Un sujet qui ne remplirait rien
 * ferait payer des minutes de carnet pour du texte que personne n'ouvrirait.
 *
 * **LES RÈGLES NE SONT PAS UN SUJET DE CAMPAGNE.** Décision de David, 2026-08-15 :
 * *« dans une campagne tu ne dois pas extraire les règles ; à la rigueur s'il y
 * a des règles spécifiques, il faut les extraire pour les mettre dans le RAG. »*
 * Ce n'est pas une question de périmètre mais de portée : **le pilote appartient
 * au jeu, pas à la campagne**. Une horloge de corruption écrite pour un module
 * et glissée dans le `GameDriver` contaminerait toutes les autres campagnes du
 * même jeu, sans que rien ne le dise. Le sujet existe donc — un module en
 * contient parfois — mais sa fiche ne nourrit **aucun champ de pilote** : elle
 * ne sert qu'à l'Oracle, depuis `campaignPath`.
 *
 * **Deux sujets se demandent acte par acte** (`parActe`). C'est le second axe de
 * découpage, celui que le canevas des règles n'a jamais eu à résoudre : un appel
 * par sujet suffit à des règles bornées — un jeu a un seul système
 * d'initiative — mais « énumère tous les PNJ du module » ne rentre dans aucune
 * réponse. On demande la colonne vertébrale d'abord, puis on interroge acte par
 * acte, et chaque appel retrouve la taille d'un appel de la Forge Système.
 */

export interface SujetDeCampagne extends SujetCanevas {
    /**
     * Ce sujet se demande **une fois par acte**, l'énoncé portant le titre de
     * l'acte. Il n'est donc pas interrogeable tant que la structure n'est pas
     * connue — d'où sa place après elle dans la liste.
     */
    parActe?: boolean;
}

export const CANEVAS_DE_CAMPAGNE: readonly SujetDeCampagne[] = [
    {
        clef: 'Pitch et ton',
        enonce:
            'Pitch de la campagne : de quoi parle-t-elle, ce que les personnages y font,\n'
            + '   et le ton recherché (registre, ambiance, rythme)',
    },
    {
        /**
         * **Posé en deuxième, et c'est structurel.** Sa réponse découpe les deux
         * sujets `parActe` qui suivent. Le demander plus tard obligerait à
         * relancer le carnet sur ce qu'on aurait déjà lu.
         *
         * On demande **la structure telle que le livre la donne** — actes,
         * chapitres, parties, épisodes — sans imposer notre vocabulaire : un
         * module qui parle de « chapitres » ne doit pas être forcé de les
         * appeler autrement, sinon le modèle reformule au lieu de recopier.
         */
        clef: 'Structure en actes',
        enonce:
            "Structure de la campagne : la LISTE ORDONNÉE de ses grandes parties, telles que\n"
            + '   le livre les nomme (actes, chapitres, épisodes…). Pour chacune : son titre exact\n'
            + "   et l'enjeu qui s'y joue, en deux phrases. PAS le détail des scènes.",
    },
    {
        clef: 'Factions et organisations',
        enonce:
            'Factions, maisons, organisations et groupes en présence : leur nom, ce qu\'ils\n'
            + '   veulent, et ce qui les oppose',
    },
    {
        clef: 'Lieux majeurs',
        enonce:
            'Lieux majeurs où la campagne se déroule : leur nom, ce que les personnages y\n'
            + '   voient, et ce que seul le meneur en sait',
    },
    {
        clef: 'Personnages non joueurs',
        parActe: true,
        enonce:
            'Personnages non joueurs qui comptent : leur nom, ce qu\'ils veulent, comment les\n'
            + '   jouer, leur faction, et leurs liens entre eux.\n'
            + '   PAS leurs caractéristiques chiffrées : le meneur les règle lui-même.',
    },
    {
        /**
         * Distinct des scènes, et le rester : un indice a un porteur, un lieu et
         * un moment de révélation — c'est ce que `Clue` sait porter — là où une
         * scène ne fait que l'offrir. Les mêler aurait rendu les indices
         * invisibles hors de la scène où on les a rangés.
         */
        clef: 'Secrets et révélations',
        enonce:
            'Secrets, révélations et indices : ce qui est caché, qui le sait, où cela peut se\n'
            + '   découvrir, et ce que la découverte change',
    },
    {
        clef: 'Amorces et accroches',
        enonce:
            'Amorces : comment les personnages joueurs entrent dans cette histoire, et ce qui\n'
            + '   les y retient',
    },
    {
        clef: 'Menaces et progression',
        enonce:
            "Menaces qui progressent d'elles-mêmes si les personnages n'agissent pas :\n"
            + '   ce qui avance, à quel rythme, et ce qui se produit au bout',
    },
    {
        clef: 'Scènes prévues',
        parActe: true,
        enonce:
            'Scènes prévues : pour chacune, son titre, ce qui s\'y joue, le lieu, les\n'
            + '   personnages présents et les indices qu\'elle peut livrer',
    },
    {
        /**
         * **Le sujet qui ne nourrit aucun champ.** Sa fiche part au corpus de la
         * campagne et n'est lue que par l'Oracle. On le demande quand même :
         * *une lacune peut être une réponse*, et savoir qu'un module n'ajoute
         * aucune règle vaut mieux que de ne pas avoir posé la question.
         */
        clef: 'Règles propres à cette campagne',
        enonce:
            'Règles que CETTE campagne ajoute ou modifie par rapport au jeu de base\n'
            + '   (sous-systèmes, horloges, procédures particulières).\n'
            + "   Si la campagne n'en ajoute aucune, dis-le : c'est une réponse.",
    },
] as const;

/** Les dix clés seules, pour piloter la boucle de l'atelier. */
export const CLEFS_DE_CAMPAGNE: readonly string[] = CANEVAS_DE_CAMPAGNE.map(s => s.clef);

/** Les sujets qui se demandent une fois par acte. */
export const SUJETS_PAR_ACTE: readonly SujetDeCampagne[] = CANEVAS_DE_CAMPAGNE.filter(s => s.parActe);

/**
 * Le sujet dont la fiche ne doit **jamais** alimenter un pilote.
 *
 * Exporté plutôt que laissé implicite : la Forge de campagne s'en servira pour
 * écarter cette fiche de ses groupes, et un contrôle qui repose sur une chaîne
 * recopiée finit par viser un libellé qui a changé.
 */
export const CLEF_DES_REGLES_PROPRES = 'Règles propres à cette campagne';

/** Ramène le libellé rendu par le carnet à la clé canonique du canevas de campagne. */
export function clefCanoniqueDeCampagne(libelle: string): string | null {
    return rabattreSurLeCanevas(libelle, CANEVAS_DE_CAMPAGNE);
}

/**
 * L'énoncé à envoyer au carnet, l'acte injecté quand le sujet le demande.
 *
 * **Le titre de l'acte est repris tel que le livre le nomme**, et l'énoncé
 * ordonne de s'y tenir. Sans cette borne, le carnet répond sur toute la
 * campagne : on paierait dix fois le même appel pour dix réponses identiques,
 * et le second axe de découpage n'existerait que sur le papier.
 */
export function enonceDuSujet(sujet: SujetDeCampagne, acte?: string): string {
    if (!sujet.parActe || !acte) return sujet.enonce;
    return (
        `${sujet.enonce}\n`
        + `   UNIQUEMENT pour la partie intitulée « ${acte} ». Ignore le reste de la campagne :\n`
        + '   les autres parties font l\'objet de demandes séparées.'
    );
}

/** Nom de fichier d'une fiche de campagne. Même convention que les fiches de règles. */
export function slugFicheDeCampagne(sujet: string, acte?: string): string {
    return acte ? `${slugFiche(sujet)}--${slugFiche(acte)}` : slugFiche(sujet);
}
