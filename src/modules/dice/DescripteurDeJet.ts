/**
 * De quoi un jet se compose — le chaînon manquant entre la fiche et les dés.
 *
 * **Le mur qu'il abat.** Un pilote savait dire « 2d20, compte les réussites,
 * seuil 8 ». Mais chez Dune le seuil n'est pas 8 : il vaut **une compétence plus
 * un principe**, choisis test par test, de 8 à 16. `successThreshold` étant un
 * nombre fixe, on y inscrivait le minimum — et lancer avec cette valeur
 * sous-estimait systématiquement le personnage, sans que rien ne le dise.
 *
 * Le pilote ne pouvait pas mieux faire : rien, dans son modèle, ne reliait un
 * jet aux **champs de la fiche**. Cliquer sur « Combat » ne suffisait pas — il
 * fallait aussi savoir quel Principe le joueur invoque, et que les deux
 * s'additionnent.
 *
 * **Ce que le descripteur ajoute, et rien de plus** : la liste des composantes
 * que le joueur choisit, la façon dont elles forment le seuil, et le sens de la
 * comparaison. Il ne décrit ni les modificateurs de situation, ni les cas
 * particuliers — ceux-là restent dans les fiches de règles, que le meneur lit.
 * L'outil calcule ce qui est mécanique ; il n'arbitre pas.
 */

import type { SheetSection } from '../../data/defaultSheetTemplates';
import { MECANIQUES_DE_CIBLE, type NomDeMecanique } from './systemes';
import type { EchelleDuJet } from './degresDeReussite';
import {
    facesDuNiveau, appliquerLeModificateur, bornerLaPoignee,
    type NomDEchelle, type DeEchelonne, type ModificateurDeDes,
} from './desEchelonnes';

/** Un choix que le joueur fait sur sa fiche au moment de lancer. */
export interface ComposanteDeJet {
    /** Identifiant de la composante — `competence`, `principe`, `attribut`. */
    id: string;
    label: string;
    /**
     * Section de la fiche où choisir. Le joueur retient **un** champ, et c'est
     * sa valeur qui entre dans le calcul.
     */
    sectionId: string;
    /**
     * **Les autres sections où la même composante peut se choisir.**
     *
     * *Le mur du 2026-08-23, signalé par David sur Rêves de Dragons.* Les
     * compétences y sont découpées en sous-groupes — et un sous-groupe **est**
     * une section de la fiche. Une composante qui n'en nomme qu'une seule ne
     * peut donc offrir qu'un sous-groupe : les autres compétences du personnage
     * sont sur sa fiche, visibles, et le menu du jet ne les propose pas. Même
     * chose pour les caractéristiques quand elles sont réparties.
     *
     * **Pourquoi un champ de plus plutôt qu'un `sectionId` devenu pluriel.**
     * Renommer aurait fait repartir tous les pilotes existants d'une composante
     * vide, sans que personne comprenne pourquoi — c'est exactement ce que
     * l'axe N a évité en gardant `layoutConfig`. Ici `sectionId` reste la
     * section principale, celle qu'un pilote d'avant continue de nommer seule.
     *
     * **Ce n'est pas un « ou » entre jeux de composantes.** Le meneur ne choisit
     * pas un attelage caractéristique+compétence parmi plusieurs : il choisit
     * une caractéristique, puis une compétence, chacune pouvant venir de
     * plusieurs sous-groupes. Énumérer les attelages aurait multiplié les cas là
     * où le produit croisé les donne tous.
     */
    sectionsSupplementaires?: string[];
}

export type SensDuJet = 'sous-ou-egal' | 'superieur-ou-egal';

/**
 * **Aucun champ de ce descripteur n'est garanti à l'exécution.**
 *
 * C'est la leçon du 2026-08-15, apprise deux fois de suite en ouvrant une fiche
 * d'Alien : `difficulte` manquait, puis `seuil`. Un pilote est **forgé par un
 * modèle de langage** à partir de fiches de règles — le type dit ce qu'on
 * espère, jamais ce qu'on reçoit. Et c'est même la règle du projet : *si les
 * fiches ne disent pas comment fonctionne une mécanique, OMETS le champ.*
 *
 * Tout lecteur doit donc se protéger, y compris de ce que le type déclare
 * obligatoire. Les valeurs de repli sont choisies pour **ne rien inventer** :
 * une réserve absente ne lance rien et le dit, plutôt que de fabriquer des dés
 * que le jeu n'a pas.
 */
export interface DescripteurDeJet {
    /**
     * Composantes additionnées pour former le seuil. Chez Dune : une compétence
     * et un principe. Chez un jeu à compétence seule : une seule composante.
     *
     * **Facultatif** : un jeu à réserve — Alien, où chaque six est une réussite
     * — ne compose aucun seuil depuis la fiche. Son absence faisait planter
     * `PanneauDeJet` (« descripteur.seuil is not iterable »).
     */
    seuil?: ComposanteDeJet[];
    /**
     * **La cible se CALCULE, au lieu de s'additionner.**
     *
     * *Le mur du 2026-08-22.* Chez Rêves de Dragons, la compétence n'est pas
     * dans l'ordonnée de la table de Résolution, elle est dans l'**abscisse** :
     * elle ne s'ajoute pas au pourcentage, elle déplace la colonne, **donc elle
     * multiplie**. Agilité 12 avec +3 vaut 78 % et non 15 — et le descripteur ne
     * savait qu'additionner. *Facteur cinq, dans le sens qui fait échouer les
     * personnages compétents, et rien ne le disait : un résultat faux a l'air
     * d'un résultat.*
     *
     * **Exclusif de `seuil`** : les deux répondent à la même question, et un
     * pilote qui déclarerait les deux dirait deux fois la cible. Quand `cible`
     * est là, c'est elle qui décide.
     *
     * **Aucun nombre de la table n'entre ici.** Le pilote nomme une mécanique,
     * qui vit dans `systemes/` avec ses tables transcrites du livre et ses
     * tests.
     */
    cible?: {
        /** Le nom de la mécanique, tel que le registre `systemes/` le connaît. */
        mecanique: NomDeMecanique;
        /** Ce qui se lit en ordonnée : la caractéristique. Une seule composante. */
        caracteristique: ComposanteDeJet;
        /**
         * Ce qui compose l'abscisse depuis la fiche — la compétence, le malus
         * d'état général. **Additionnées entre elles**, puis servies comme un
         * tout à la mécanique, qui seule sait ce qu'elle en fait.
         */
        ajustement?: ComposanteDeJet[];
    };
    /**
     * Réserve de dés : combien on en lance de base, jusqu'à combien, et à
     * combien de faces.
     *
     * `cout` donne le prix de chaque dé supplémentaire, dans l'ordre — chez
     * Dune, un, deux puis trois points. Le prix n'est pas constant, donc un
     * seul nombre n'aurait pas suffi. `ressource` désigne la réserve de table
     * qui paie ; sans elle, les dés sont gratuits et le panneau ne demande
     * rien.
     */
    reserve?: {
        /** Dés lancés d'office, avant toute composante et tout achat. */
        base: number;
        /**
         * Composantes **additionnées à la base**, choisies sur la fiche.
         *
         * **Le dernier mur, abattu le 2026-08-15.** Chez Alien la réserve vaut
         * un **attribut plus une compétence** — « lance autant de dés que la
         * somme de ton attribut et de ta compétence » — et le descripteur ne
         * savait composer que des *seuils*. Le pilote n'avait donc qu'un nombre
         * fixe à offrir : tous les jets partaient avec la même poignée de dés,
         * quel que soit le personnage, et rien ne le disait.
         *
         * La preuve que le modèle avait compris la règle est dans le journal :
         * dérivé le 2026-08-12, il a rendu `base: "attribut+comp_level"` — la
         * bonne mécanique, écrite là où le panneau attendait un entier. Et
         * l'invite lui commandait ensuite d'y renoncer : *« en NOMBRES et jamais
         * en formule »*. **C'est l'outil qui ordonnait de perdre la règle**, la
         * même faute que la consigne du zigzag sur les portées.
         *
         * Même forme que `seuil`, à dessein : le joueur retient un champ par
         * composante, et les valeurs s'additionnent. **Les identifiants partagent
         * un seul espace de noms avec ceux du seuil** — `choix.champs` est une
         * carte unique, et deux composantes homonymes désigneraient le même
         * choix.
         */
        composantes?: ComposanteDeJet[];
        max: number;
        faces: number;
        cout?: number[];
        ressource?: string;
        /**
         * **Une seconde réserve, lancée avec la première mais comptée à part.**
         *
         * **Pourquoi elle ne peut pas être une composante ordinaire.** Chez
         * Alien, la réserve reçoit « un nombre de dés de stress égal au Niveau
         * de Stress actuel » — et sur ces dés-là, **un 1 déclenche la Panique**,
         * ce qu'un dé de base ne fait jamais. Les additionner à la première
         * réserve donnerait le bon *nombre* de dés et perdrait la *mécanique* :
         * le compte des réussites serait juste, et la Panique ne se
         * déclencherait jamais. *Un jet qui rend le bon total en perdant sa
         * règle est le pire des deux mondes — il a l'air juste.*
         *
         * `DiceEngine.rollYZE` distingue déjà les deux poules et compte les 1 de
         * la seconde comme des « fléaux » : le moteur savait faire, personne ne
         * lui passait le nombre. C'est la même forme dans toute la famille Year
         * Zero — dés d'équipement ailleurs, dés de stress chez Alien.
         *
         * **Elle n'entre pas dans le plafond de la première.** Le stress
         * s'ajoute par-dessus : le borner reviendrait à effacer la pression que
         * le jeu met précisément là.
         */
        secondaire?: {
            /** Ce que le jeu appelle cette poule — « Stress », « Équipement ». */
            label: string;
            /** Dés lancés d'office dans cette poule. */
            base?: number;
            /** Ce qui s'y ajoute, lu sur la fiche — le Niveau de Stress. */
            composantes?: ComposanteDeJet[];
            /** Ce qu'un 1 déclenche, tel que le jeu le nomme — « Panique ». */
            libelleDuUn?: string;
        };
    };
    /**
     * **Chaque composante donne UN dé, dont la TAILLE se lit sur la fiche.**
     *
     * *Le mur du 2026-08-29, signalé par David à l'écran sur Blade Runner.* Ni
     * `seuil` ni `reserve` ne pouvaient exprimer ce jeu : le premier additionne
     * des nombres — or un attribut y vaut `"B (D10)"` —, le second lance des dés
     * **tous de la même taille**. Le panneau annonçait donc « agilite est absent
     * de la fiche » sur un champ parfaitement rempli.
     *
     * **Exclusif de `seuil` et de `cible`** : il n'y a aucun seuil dans cette
     * famille de jeux. On lance, et on compte les six.
     *
     * L'échelle est **nommée, jamais transcrite ici** — même règle que `cible`,
     * et pour la même raison : un pilote est forgé par un modèle de langage, et
     * une table qu'il recopie est une table qu'il peut recopier de travers.
     */
    desEchelonnes?: {
        /** L'échelle qui traduit la valeur de la fiche en nombre de faces. */
        echelle: NomDEchelle;
        /** Une composante, un dé. Chez Blade Runner : l'attribut et la compétence. */
        composantes: ComposanteDeJet[];
        /**
         * Dés comptés à part, dont les 1 usent le matériel — équipement,
         * artefact. Même rôle que `reserve.secondaire`, autre variante.
         */
        secondaire?: { label: string; libelleDuUn?: string };
    };
    /** Chaque dé est-il une réussite en dessous ou au-dessus du seuil ? */
    sens: SensDuJet;
    /** Un dé à cette valeur ou en deçà compte double. Chez Dune, le 1 naturel. */
    critique?: number;
    /** Un dé à cette valeur ou au-delà déclenche une complication. Chez Dune, le 20. */
    complication?: number;
    /**
     * Bornes de la difficulté que le meneur fixe, et sa valeur usuelle.
     *
     * **Facultative depuis le 2026-08-15, et elle aurait dû l'être d'emblée.**
     * Tous les jeux ne fixent pas un nombre de réussites à atteindre : Alien
     * compte les six et réussir n'en demande **qu'un**. Son pilote n'a donc pas
     * de `difficulte` — le modèle l'a omise à juste titre —, et
     * `PanneauDeJet` plantait à l'ouverture de la fiche :
     * *« Cannot read properties of undefined (reading 'defaut') »*.
     *
     * L'obligation venait de Dune, où la difficulté va de 0 à 5. Encore un
     * champ tenu pour universel parce qu'un seul jeu s'en servait.
     */
    difficulte?: { min: number; max: number; defaut: number };
}

/** Ce que le joueur a retenu sur sa fiche pour ce jet précis. */
export interface ChoixDuJoueur {
    /** Composante → identifiant du champ retenu. `{ competence: 'combat' }`. */
    champs: Record<string, string>;
    /** Dés supplémentaires achetés, au-delà de la réserve de base. */
    desSupplementaires?: number;
    /** Difficulté fixée par le meneur. */
    difficulte?: number;
    /**
     * **La difficulté qui déplace la colonne — et surtout pas `difficulte`.**
     *
     * Les deux se traduiraient par « la difficulté fixée par le meneur », et
     * elles n'ont aucun rapport : `difficulte` est un **nombre de réussites à
     * atteindre**, hérité de Dune ; celle-ci est un **ajustement** qui change le
     * pourcentage, de la tâche chimérique à la très facile.
     *
     * *Même mot, mécanique sans rapport* — c'est exactement le piège relevé en
     * ouvrant ce chantier, et les faire partager un champ l'aurait scellé. Un
     * meneur qui règle « difficulté 2 » sur un jeu en pourcentage doit obtenir
     * une colonne déplacée, jamais deux réussites exigées.
     */
    ajustementDeDifficulte?: number;
    /**
     * Valeur sous laquelle un dé compte double, quand elle diffère du critique
     * ordinaire — chez Dune, la compétence seule avec la spécialisation.
     */
    critiqueEtendu?: number;
    /**
     * Avantage ou désavantage, sur un jeu à dés échelonnés.
     *
     * Distinct de `desSupplementaires`, qui achète des dés identiques : ici on
     * ajoute une copie du **plus petit** dé, ou on le retire. *Même mot d'usage,
     * mécanique sans rapport* — le piège relevé sur `difficulte`.
     */
    modificateurDeDes?: ModificateurDeDes;
}

/** Un jet prêt à partir, et de quoi expliquer d'où il sort. */
export interface JetPrepare {
    seuil: number;
    /** Le détail du seuil, pour l'afficher : `[{ label: 'Combat', valeur: 6 }, …]`. */
    composantes: { label: string; champ: string; valeur: number }[];
    /**
     * Comment le seuil a été obtenu, quand ce n'est pas une addition.
     *
     * **Absent sur les jeux qui additionnent** : le panneau montre alors les
     * valeurs jointes par « + », ce qui dit vrai chez eux. Sur un jeu qui
     * multiplie, ce même affichage montrerait « 12 + 3 » sous un seuil de 78 —
     * *un écran qui explique faux est pire qu'un écran qui n'explique rien.*
     */
    explicationDuSeuil?: string;
    /**
     * Les bornes des six degrés, quand le jeu gradue ses réussites.
     *
     * **Absente sur les jeux qui ne graduent pas**, et c'est voulu : le moteur
     * rend alors une réussite normale ou un échec normal. *Fabriquer les quatre
     * degrés extrêmes ferait dire au journal qu'un jet fut spectaculaire alors
     * que le jeu ne le sait pas.*
     */
    echelle?: EchelleDuJet;
    nombreDeDes: number;
    /**
     * **Les dés de base quand ils n'ont pas tous la même taille.**
     *
     * Vide sur tous les autres jeux, et c'est la façon de savoir : quand il est
     * rempli, `faces` et `nombreDeDes` ne suffisent plus à décrire le lancer, et
     * c'est cette liste qui fait foi. Elle vaut détail affichable aussi — le
     * joueur voit d'où vient chacun de ses dés.
     */
    desEchelonnes: DeEchelonne[];
    /**
     * Le détail de la réserve, quand elle se compose depuis la fiche.
     *
     * Séparé des composantes du seuil parce qu'ils ne disent pas la même chose :
     * l'un forme un nombre à comparer, l'autre un nombre de dés. Les afficher
     * ensemble donnerait « 4 + 3 » sans qu'on sache si ce sont des dés ou un
     * seuil — c'est justement ce que le panneau doit rendre lisible.
     */
    composantesDeLaReserve: { label: string; champ: string; valeur: number }[];
    /**
     * Les dés de la seconde poule — le Stress chez Alien.
     *
     * Zéro quand le pilote n'en déclare pas : le moteur reçoit alors zéro, et
     * son comportement est exactement celui d'avant.
     */
    desSecondaires: number;
    /** Le détail de cette seconde poule, pour l'afficher comme la première. */
    composantesDeLaSecondeReserve: { label: string; champ: string; valeur: number }[];
    /** Dés effectivement achetés, plafond appliqué. */
    desAchetes: number;
    /**
     * Ce que ces dés coûtent, et sur quelle réserve de table.
     *
     * Le coût est **annoncé, jamais prélevé ici** : cette fonction est pure et
     * ne connaît pas l'état de la table. C'est l'appelant qui dépense, et
     * seulement s'il lance.
     */
    cout: { total: number; ressource?: string };
    faces: number;
    sens: SensDuJet;
    doubleSous: number;
    difficulte: number;
    /**
     * Combien de réussites il faut réellement pour que le jet passe.
     *
     * **Ce n'est pas toujours la difficulté, et c'est le défaut relevé par
     * David le 2026-08-15** : sur un jet d'Alien à deux six, l'écran annonçait
     * *« 2 réussites / difficulté 0 »* et **deux excédents**. Il n'y en a qu'un.
     *
     * Alien ne gradue pas ses tests : son pilote ne déclare **aucune**
     * difficulté, et `difficulte` retombait donc à zéro. Or zéro n'est pas la
     * règle du jeu — la fiche dit *« réussir exige d'obtenir au moins un six »*.
     * Le premier six **est** la réussite ; les suivants sont le surplus.
     *
     * Le défaut jumeau était plus grave et invisible : `verdict(0, 0)` rend
     * `reussi: true`. **Un jet d'Alien sans aucun six s'affichait « RÉUSSITE ».**
     *
     * *Zéro déclaré et zéro par absence ne sont pas la même valeur* — c'est la
     * règle du projet : l'absence n'est pas un zéro. Quand le pilote déclare des
     * bornes, on suit ce que le meneur a fixé, jusqu'à la difficulté 0 de Dune,
     * qui signifie une tâche automatiquement réussie. Sinon, il en faut une.
     */
    reussitesRequises: number;
    /**
     * Ce qui n'a pas pu être résolu.
     *
     * **Jamais une exception.** Un champ absent de la fiche est une erreur de
     * configuration, pas une raison d'empêcher un joueur de lancer en pleine
     * partie. On lance avec ce qu'on a, et on dit ce qui manquait — l'inverse
     * de la jauge à zéro qui se tait.
     */
    avertissements: string[];
    /**
     * Ce qui s'est raccordé tout seul, et qu'il faut dire quand même.
     *
     * **Séparé des avertissements parce que le panneau refuse de lancer tant
     * qu'il en reste un.** Une section reconnue à son intitulé plutôt qu'à son
     * identifiant est un vrai défaut du pilote, qu'il faut corriger — mais le
     * jet, lui, est juste. Bloquer le joueur en pleine séance pour un nom de
     * section serait lui faire payer une rigueur qui ne le concerne pas.
     */
    remarques: string[];
}

/**
 * Où le joueur choisit sa composante — **et le pilote peut se tromper de nom**.
 *
 * **Le défaut, relevé par David le 2026-08-15 sur sa fiche de Dune** : les deux
 * menus « Compétence » et « Principe » étaient vides, et le panneau lui répondait
 * *« aucun champ retenu »*, comme s'il avait négligé de choisir. Il n'y avait
 * rien à choisir.
 *
 * Son pilote Dune réclame les sections `competences` et `principes` — les
 * identifiants du gabarit **de référence** livré dans le code. Mais il est
 * attaché à **sa** fiche à lui, où les mêmes sections s'appellent `stats`
 * (« Compétences ») et `principles` (« Principes & Maximes »). Un pilote écrit
 * contre un gabarit, branché sur un autre.
 *
 * `controlerLePilote` attrape exactement cela depuis le 2026-08-11 — mais il ne
 * tourne qu'à la Forge, au moment de la dérivation. *Un pilote écrit à la main,
 * importé, ou dont on renomme les sections après coup ne repasse jamais devant
 * lui.* La vérification existait ; elle n'avait simplement jamais vu ce couple.
 *
 * **Ce qu'on s'autorise, et pourquoi ce n'est pas arbitrer.** Une section porte
 * deux noms : son identifiant et son intitulé. Quand l'identifiant annoncé ne
 * répond pas et qu'**une seule** section répond à ce nom-là, la retenir, c'est
 * suivre l'état — la fiche dit « Compétences », le pilote demande les
 * compétences. On le dit à l'écran, et on ne tranche jamais entre plusieurs :
 * deux sections qui répondent au même nom sont une question pour un humain.
 */
export interface SectionRetenue {
    section: SheetSection | null;
    /** `id` quand la section porte le nom annoncé, `label` quand il a fallu la reconnaître. */
    par: 'id' | 'label' | null;
    /** Les sections qui répondaient toutes au même nom, quand plusieurs le faisaient. */
    ambigues: string[];
}

/**
 * Sans accents, sans casse, sans ponctuation — deux façons d'écrire le même mot.
 *
 * **Elle accepte l'absence, et ce n'est pas de la coquetterie.** Un pilote est
 * forgé par un modèle de langage : `sectionId` peut tout simplement manquer, et
 * `undefined.normalize()` a fait tomber toute la Revue du Pilote le 2026-08-22 —
 * *l'écran qui existe précisément pour signaler ce genre de défaut.* C'est la
 * règle posée en tête de ce fichier, enfreinte dans ce fichier même : aucun
 * champ d'un pilote n'est garanti à l'exécution.
 */
function normaliser(texte: string | undefined): string {
    if (!texte) return '';
    return texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Deux noms désignent-ils la même chose ?
 *
 * Le plus court doit préfixer le plus long : « competence » répond à
 * « Compétences », « principes » à « Principes & Maximes ». En dessous de cinq
 * lettres on exige l'égalité — sur trois caractères, un préfixe ne prouve rien.
 */
function memeNom(a: string, b: string): boolean {
    if (!a || !b) return false;
    const [court, long] = a.length <= b.length ? [a, b] : [b, a];
    return court.length < 5 ? court === long : long.startsWith(court);
}

/**
 * Résout **un** nom de section contre la fiche.
 *
 * Extraite de `sectionDeLaComposante` le 2026-08-23 : une composante peut
 * désormais en nommer plusieurs, et une section supplémentaire n'a pas
 * d'intitulé de composante à offrir en secours. La règle de reconnaissance,
 * elle, ne change pas — *deux façons de nommer la même chose ne peuvent pas se
 * résoudre différemment selon l'appelant.*
 */
function resoudreUneSection(
    toutes: readonly SheetSection[],
    demande: string | undefined,
    /** L'intitulé de la composante, quand il peut servir de second nom. */
    labelDeSecours?: string,
): SectionRetenue {
    const parIdentifiant = toutes.find(s => s.id === demande);
    if (parIdentifiant) return { section: parIdentifiant, par: 'id', ambigues: [] };

    // L'intitulé de la composante compte autant que l'identifiant qu'elle vise :
    // un pilote qui demande « Compétence » cherche la section des compétences,
    // quel que soit le mot qu'il a mis dans `sectionId`.
    const noms = [demande, labelDeSecours].map(normaliser).filter(Boolean);
    if (noms.length === 0) return { section: null, par: null, ambigues: [] };

    const repondent = toutes.filter(s => noms.some(nom =>
        memeNom(nom, normaliser(s.id)) || memeNom(nom, normaliser(s.label ?? ''))));

    if (repondent.length === 1) return { section: repondent[0], par: 'label', ambigues: [] };
    return { section: null, par: null, ambigues: repondent.map(s => s.label || s.id) };
}

/**
 * La section **principale** où choisir cette composante.
 *
 * Conservée telle quelle : elle répond à « quelle section ce pilote
 * désigne-t-il ? », question qui garde un sens même quand la composante en
 * nomme plusieurs. Qui veut *toutes* les sections où le joueur peut choisir
 * appelle `sectionsDeLaComposante`.
 */
export function sectionDeLaComposante(
    sections: readonly SheetSection[] | undefined,
    composante: ComposanteDeJet | undefined,
): SectionRetenue {
    /*
      **Une composante peut manquer entièrement.** Le type la déclare
      obligatoire ; le pilote, lui, vient d'un modèle. On rend « introuvable »
      plutôt que de lever : l'appelant sait déjà dire qu'une section ne répond
      pas, et c'est exactement ce qu'il faut annoncer.
    */
    if (!composante) return { section: null, par: null, ambigues: [] };
    return resoudreUneSection(sections ?? [], composante.sectionId, composante.label);
}

/**
 * **Toutes** les sections où le joueur peut choisir cette composante.
 *
 * Une par nom déclaré — `sectionId` d'abord, puis `sectionsSupplementaires`
 * dans leur ordre — dédoublonnées, et **dans l'ordre du pilote** : c'est lui qui
 * sait quel sous-groupe le meneur regarde en premier.
 *
 * Ce qui n'a pas répondu est rendu **nommément**, jamais compté en bloc :
 * « trois sections introuvables » n'aide personne, « la section *combat* est
 * introuvable » se corrige.
 */
export interface SectionsRetenues {
    /** Les sections où choisir, dans l'ordre déclaré, sans doublon. */
    sections: SheetSection[];
    /** Les noms déclarés auxquels aucune section ne répond. */
    introuvables: string[];
    /** Ce qui a été reconnu à l'intitulé plutôt qu'à l'identifiant. */
    reconnues: { demande: string; section: SheetSection }[];
    /** Les noms auxquels PLUSIEURS sections répondaient — une question pour un humain. */
    ambigues: { demande: string; candidates: string[] }[];
}

export function sectionsDeLaComposante(
    sections: readonly SheetSection[] | undefined,
    composante: ComposanteDeJet | undefined,
): SectionsRetenues {
    const vide: SectionsRetenues = { sections: [], introuvables: [], reconnues: [], ambigues: [] };
    if (!composante) return vide;

    const toutes = sections ?? [];
    const resultat: SectionsRetenues = { sections: [], introuvables: [], reconnues: [], ambigues: [] };
    const deja = new Set<string>();

    /*
      **La section principale garde son secours par l'intitulé, les autres non.**
      « Compétence » peut désigner la section des compétences ; mais une section
      supplémentaire est nommée exprès, et lui prêter l'intitulé de la composante
      la ferait répondre au même endroit que la principale — *un doublon qui se
      présenterait comme un second sous-groupe.*
    */
    const demandes: Array<{ nom: string | undefined; secours?: string }> = [
        { nom: composante.sectionId, secours: composante.label },
        ...(composante.sectionsSupplementaires ?? []).map(nom => ({ nom })),
    ];

    for (const { nom, secours } of demandes) {
        // Un nom vide n'est pas une section introuvable : c'est un nom qu'on n'a
        // pas. Le signaler comme un manque accuserait le pilote d'un tort qu'il
        // n'a pas — et `sectionsSupplementaires` est facultatif par nature.
        if (!nom) continue;

        const { section, par, ambigues } = resoudreUneSection(toutes, nom, secours);
        if (!section) {
            if (ambigues.length > 1) resultat.ambigues.push({ demande: nom, candidates: ambigues });
            else resultat.introuvables.push(nom);
            continue;
        }
        if (deja.has(section.id)) continue;
        deja.add(section.id);
        resultat.sections.push(section);
        if (par === 'label') resultat.reconnues.push({ demande: nom, section });
    }

    return resultat;
}

/**
 * Ce que la fiche porte pour ce champ, et **pourquoi** ça n'est pas un nombre.
 *
 * *Deux causes que le message confondait, signalées en réel par David le
 * 2026-08-29 sur Blade Runner.* La fiche affichait « Agilité (B (D10)) » dans le
 * menu, et le panneau répondait **« agilite est absent de la fiche »** : il
 * envoie chercher un champ manquant alors que le champ est là, rempli, et que
 * c'est sa **forme** qui ne convient pas.
 *
 * Chez Blade Runner un attribut vaut une lettre et un dé — `"B (D10)"` — jamais
 * un nombre : rien à corriger sur la fiche, c'est le pilote qui compose un seuil
 * là où le jeu lance une réserve de dés. *Un message qui désigne le mauvais
 * fautif coûte plus cher qu'un message absent.*
 */
type LectureDuChamp =
    | { valeur: number }
    | { valeur: null; cause: 'absent' }
    | { valeur: null; cause: 'pas-un-nombre'; brut: string };

function lireLeChamp(valeurs: Record<string, unknown>, champ: string): LectureDuChamp {
    const brut = valeurs[champ];
    if (brut === undefined || brut === null || brut === '') return { valeur: null, cause: 'absent' };

    const n = typeof brut === 'number' ? brut : Number(brut);
    if (Number.isFinite(n)) return { valeur: n };

    return { valeur: null, cause: 'pas-un-nombre', brut: String(brut) };
}

/**
 * Compose un jet à partir du descripteur, de la fiche et des choix du joueur.
 *
 * Fonction pure : elle ne lance aucun dé et ne lit aucun état global. C'est ce
 * qui la rend vérifiable — et c'est `DiceEngine` qui lance ensuite, avec les
 * paramètres qu'elle rend.
 */
export function preparerLeJet(
    descripteur: DescripteurDeJet,
    valeursDeLaFiche: Record<string, unknown>,
    choix: ChoixDuJoueur,
    /**
     * Les sections de la fiche ouverte, quand l'appelant les connaît.
     *
     * Facultatives : le seuil se compose à partir des **valeurs**, et n'en a
     * pas besoin. Elles servent à dire la vérité sur ce qui manque — sans
     * elles, une section introuvable se présentait au joueur comme un oubli de
     * sa part.
     */
    sections?: readonly SheetSection[],
): JetPrepare {
    const avertissements: string[] = [];
    const remarques: string[] = [];

    /**
     * Additionne une liste de composantes lues sur la fiche.
     *
     * **Une seule fonction pour le seuil et pour la réserve**, parce que la
     * règle est identique : le joueur retient un champ par composante, on lit sa
     * valeur, on additionne, et **tout ce qui manque se dit sans empêcher de
     * lancer**. Deux boucles jumelles auraient fini par diverger — l'une
     * apprenant à reconnaître une section renommée, l'autre non.
     */
    const additionner = (liste: readonly ComposanteDeJet[]) => {
        const retenues: JetPrepare['composantes'] = [];
        let total = 0;

        for (const composante of liste) {
            /*
              **Où le joueur aurait dû pouvoir choisir.** Quand la section
              annoncée n'existe pas, il n'a rien eu à se reprocher : le menu
              était vide. Le dire ainsi désigne le pilote, qui est le fautif,
              plutôt que lui.
            */
            if (sections) {
                const trouvees = sectionsDeLaComposante(sections, composante);

                const direIntrouvable = (nom: string) =>
                    `${composante.label} : le pilote désigne la section « ${nom} », `
                    + "qui n'existe pas dans cette fiche — il n'y a rien à y choisir.";
                const direAmbigue = (nom: string, candidates: string[]) =>
                    `${composante.label} : le pilote désigne la section « ${nom} », `
                    + `absente de cette fiche, et ${candidates.length} sections pourraient y répondre `
                    + `(${candidates.join(', ')}). Au pilote de dire laquelle.`;

                /*
                  **Aucune section ne répond : il n'y a nulle part où choisir**, et
                  c'est ce qui empêche la composante d'entrer dans le calcul. Le
                  message désigne le pilote, qui est le fautif, plutôt que le
                  joueur — qui n'a rien eu à se reprocher, son menu était vide.
                */
                if (trouvees.sections.length === 0) {
                    for (const { demande, candidates } of trouvees.ambigues) {
                        avertissements.push(direAmbigue(demande, candidates));
                    }
                    for (const nom of trouvees.introuvables) avertissements.push(direIntrouvable(nom));
                    continue;
                }

                /*
                  **Une section manquante PARMI plusieurs ne bloque pas, et se dit
                  quand même.** Le joueur peut choisir dans les sous-groupes qui
                  répondent — mais les compétences de celui qui manque sont sur sa
                  fiche et n'apparaissent nulle part dans le menu. *Un menu plus
                  court qu'il ne devrait est indiscernable d'un menu complet.*
                */
                for (const { demande, candidates } of trouvees.ambigues) {
                    avertissements.push(direAmbigue(demande, candidates));
                }
                for (const nom of trouvees.introuvables) avertissements.push(direIntrouvable(nom));

                for (const { demande, section } of trouvees.reconnues) {
                    remarques.push(
                        `${composante.label} : le pilote désigne la section « ${demande} », `
                        + `que cette fiche nomme « ${section.label || section.id} » (${section.id}).`,
                    );
                }
            }

            const champ = choix.champs[composante.id];
            if (!champ) {
                avertissements.push(`${composante.label} : aucun champ retenu.`);
                continue;
            }
            const lu = lireLeChamp(valeursDeLaFiche, champ);
            if (lu.valeur === null) {
                if (lu.cause === 'absent') {
                    // Le cas exact que le contrôle de cohérence attrape sur le
                    // pilote : un identifiant qui ne correspond à aucun champ.
                    avertissements.push(`${composante.label} : « ${champ} » est absent de la fiche.`);
                } else {
                    /*
                      Le champ est là et rempli : c'est le pilote qui se trompe de
                      mécanique, pas le joueur qui a oublié une case. Le message
                      doit donc désigner le pilote — et montrer la valeur, qui dit
                      à elle seule de quelle mécanique il s'agit.
                    */
                    avertissements.push(
                        `${composante.label} : « ${champ} » vaut « ${lu.brut} » sur la fiche, `
                        + "qui n'est pas un nombre — ce pilote compose un seuil, ce jeu n'en compose pas.",
                    );
                }
                continue;
            }
            total += lu.valeur;
            retenues.push({ label: composante.label, champ, valeur: lu.valeur });
        }

        return { total, retenues };
    };

    /*
      Un jeu à réserve ne compose aucun seuil depuis la fiche : la boucle ne
      tourne simplement pas, et le seuil reste à zéro. C'est le cas d'Alien, où
      chaque six est une réussite quelle que soit la valeur du personnage — mais
      où le NOMBRE de dés, lui, vient de la fiche.
    */
    /*
      **Les dés échelonnés l'emportent sur le seuil, et ce n'est pas un détail
      de préséance : c'est ce qui rend le correctif applicable.**

      *Trouvé le 2026-08-29 en répondant à David.* La Forge **enrichit** — « on
      remplit ce qui est vide, on ne remplace jamais ce qui est rempli ». Un
      pilote qui portait déjà `jet.seuil` le gardera donc **après** une nouvelle
      dérivation, même parfaite : `desEchelonnes` s'ajoute à côté.

      Sans cette ligne, le seuil continuerait de composer, de crier « ce n'est
      pas un nombre » sur chaque attribut, et le bouton resterait gris — *une
      dérivation juste qui ne change rien à l'écran est le pire des cas, parce
      qu'on croit que la correction a échoué.* Le contrôle du pilote demande
      quand même le retrait du champ mort.
    */
    const additionnees = additionner(descripteur.desEchelonnes ? [] : descripteur.seuil ?? []);
    let seuil = additionnees.total;
    let composantes = additionnees.retenues;
    let explicationDuSeuil: string | undefined;
    let echelle: EchelleDuJet | undefined;

    /*
      **La cible calculée l'emporte sur le seuil additionné**, et les deux ne
      cohabitent pas : elles répondent à la même question. Un pilote qui
      déclarerait les deux verrait la mécanique gagner, ce que le contrôle du
      pilote signale à la revue.

      Les composantes restent celles qu'on a lues sur la fiche — le joueur doit
      voir d'où sortent les nombres, même quand ils ne s'additionnent pas.
    */
    if (descripteur.cible && !descripteur.desEchelonnes) {
        const caracteristique = additionner([descripteur.cible.caracteristique]);
        const depuisLaFiche = additionner(descripteur.cible.ajustement ?? []);
        const ajustement = depuisLaFiche.total + (choix.ajustementDeDifficulte ?? 0);

        const mecanique = MECANIQUES_DE_CIBLE[descripteur.cible.mecanique];
        if (!mecanique) {
            /*
              Un pilote vient d'un modèle de langage : il peut nommer une
              mécanique qui n'existe pas. On le dit et on retombe sur zéro
              plutôt que d'inventer un pourcentage — *un jet qui a l'air d'un
              jet est le pire des deux mondes.*
            */
            avertissements.push(
                `Le pilote demande la mécanique de cible « ${descripteur.cible.mecanique} », `
                + 'que cette version ne connaît pas : aucune cible n\'a pu être calculée.',
            );
        } else {
            const cible = mecanique(caracteristique.total, ajustement);
            seuil = cible.chances;
            composantes = [...caracteristique.retenues, ...depuisLaFiche.retenues];
            explicationDuSeuil = cible.explication;
            echelle = cible.echelle;
            // Des remarques, jamais des avertissements : elles disent ce que le
            // calcul a supposé, elles n'empêchent pas de lancer.
            remarques.push(...cible.remarques);
        }
    }

    const deLaReserve = additionner(descripteur.reserve?.composantes ?? []);
    const deLaSeconde = additionner(descripteur.reserve?.secondaire?.composantes ?? []);

    /*
      **Sans réserve déclarée, on ne fabrique pas de dés.** Un pilote peut
      l'omettre — il vient d'un modèle de langage —, et inventer « un d6 » pour
      que l'écran fonctionne donnerait un jet qui a l'air d'un jet. On rend zéro
      dé et on le dit : le panneau montrera qu'il n'a rien à lancer, ce que le
      contrôle du pilote signale déjà à la revue.
    */
    const reserve = descripteur.reserve;
    /*
      **Un jeu à dés échelonnés n'a pas de réserve, et n'en manque pas.** Sa
      poignée se compose autrement — une composante, un dé. Réclamer une réserve
      qu'il n'aura jamais ferait crier l'écran sur le cas normal, et *un
      avertissement qui se déclenche sur le cas normal apprend à ignorer les
      avertissements.*
    */
    if (!reserve && !descripteur.desEchelonnes) {
        avertissements.push('Le pilote ne décrit aucune réserve de dés : rien à lancer.');
    }

    /*
      **La réserve du personnage, et non celle du système.**

      Chez Alien elle vaut un attribut plus une compétence : deux personnages
      n'entrent pas dans la même scène avec la même poignée de dés. `base` reste
      ce qui est lancé d'office — souvent zéro dès que des composantes existent,
      un pour les jeux qui garantissent un dé.
    */
    const reserveDeDepart = (reserve?.base ?? 0) + deLaReserve.total;

    // Les dés achetés ne franchissent pas le plafond du système : chez Dune,
    // cinq dés au total, quoi qu'on dépense.
    const demandes = reserveDeDepart + Math.max(0, choix.desSupplementaires ?? 0);
    const nombreDeDes = Math.min(demandes, reserve?.max ?? 0);
    if (reserve && demandes > reserve.max) {
        avertissements.push(`Réserve plafonnée à ${reserve.max} dés.`);
    }

    // Le prix croît dé après dé : on additionne les échelons réellement
    // franchis, pas le nombre de dés fois un prix moyen.
    const desAchetes = nombreDeDes - reserveDeDepart;
    const echelons = reserve?.cout ?? [];
    const total = echelons.slice(0, Math.max(0, desAchetes)).reduce((s, c) => s + c, 0);

    /*
      **Les dés échelonnés : une composante, un dé, une taille lue sur la fiche.**

      Ils ne passent ni par `seuil` — qui additionne des nombres, et un attribut
      de Blade Runner vaut « B (D10) » — ni par `reserve`, qui lance des dés tous
      identiques. Les sections se résolvent exactement comme ailleurs : c'est la
      **valeur** qui se lit autrement, pas l'endroit où on la choisit.
    */
    const desEchelonnes: DeEchelonne[] = [];
    if (descripteur.desEchelonnes) {
        for (const composante of descripteur.desEchelonnes.composantes) {
            const champ = choix.champs[composante.id];
            if (!champ) {
                avertissements.push(`${composante.label} : aucun champ retenu.`);
                continue;
            }

            const brut = valeursDeLaFiche[champ];
            const faces = facesDuNiveau(brut, descripteur.desEchelonnes.echelle);
            if (faces === null) {
                avertissements.push(
                    brut === undefined || brut === null || brut === ''
                        ? `${composante.label} : « ${champ} » est absent de la fiche.`
                        : `${composante.label} : « ${champ} » vaut « ${String(brut)} », `
                          + "qui ne désigne aucun niveau connu (A, B, C ou D).",
                );
                continue;
            }

            desEchelonnes.push({ label: composante.label, champ, niveau: String(brut), faces });
        }
    }

    /*
      L'ordre n'est pas interchangeable : le modificateur d'abord, les bornes
      ensuite. Borner avant laisserait un désavantage vider la poignée — et un
      jet sans dé n'échoue pas, il ne se lance pas.
    */
    const apresModificateur = appliquerLeModificateur(
        desEchelonnes,
        choix.modificateurDeDes ?? 'aucun',
    );
    const poignee = bornerLaPoignee(apresModificateur);
    remarques.push(...poignee.remarques);

    /*
      Sans bornes déclarées, il n'y a rien à borner : la difficulté vaut ce que
      le meneur demande, et zéro à défaut. Un jeu qui compte les réussites sans
      seuil — Alien, où un seul six suffit — n'a pas à se voir imposer celui de
      Dune.
    */
    const bornes = descripteur.difficulte;
    const difficulteDemandee = choix.difficulte ?? bornes?.defaut ?? 0;
    const difficulte = bornes
        ? Math.min(bornes.max, Math.max(bornes.min, difficulteDemandee))
        : difficulteDemandee;
    if (bornes && difficulte !== difficulteDemandee) {
        avertissements.push(`Difficulté ramenée entre ${bornes.min} et ${bornes.max}.`);
    }

    return {
        seuil,
        composantes,
        explicationDuSeuil,
        echelle,
        /*
          Quand les dés sont échelonnés, c'est leur nombre qui fait foi : ils ne
          passent pas par la réserve, et `reserve.max` vaut zéro faute de réserve
          déclarée — un `Math.min` avec zéro aurait rendu « 0 dé » sur un jet
          parfaitement composé.
        */
        nombreDeDes: descripteur.desEchelonnes ? poignee.des.length : nombreDeDes,
        desEchelonnes: poignee.des,
        composantesDeLaReserve: deLaReserve.retenues,
        /*
          La seconde poule échappe au plafond de la première : chez Alien le
          stress s'ajoute par-dessus, et le borner effacerait la pression que le
          jeu met précisément là.
        */
        desSecondaires: Math.max(0, (descripteur.reserve?.secondaire?.base ?? 0) + deLaSeconde.total),
        composantesDeLaSecondeReserve: deLaSeconde.retenues,
        desAchetes: Math.max(0, desAchetes),
        cout: { total, ressource: reserve?.ressource },
        /*
          Un jeu qui gradue ses tests dit combien de réussites il exige, jusqu'à
          zéro — la difficulté 0 de Dune est une tâche automatiquement réussie.
          Un jeu qui ne les gradue pas en demande une : c'est la définition d'un
          compte de réussites.

          **Sauf quand une cible est calculée, et le 2026-08-23 l'a montré sur
          l'écran de David.** `cible` et `difficulte` portent le même mot et
          n'ont aucun rapport : l'une déplace la colonne d'une table, l'autre
          compte des réussites à atteindre. Son pilote de Rêves de Dragons
          déclarait **les deux**, et le panneau affichait donc *deux réglages
          nommés « difficulté » côte à côte* — le piège qu'un commentaire de
          `PanneauDeJet` affirmait pourtant avoir défait. *Un commentaire qui
          déclare un piège fermé est plus dangereux que pas de commentaire : il
          dispense de vérifier.*

          Le compte de réussites n'a aucun sens sur un d100 comparé à un
          pourcentage — en exiger deux d'un seul dé condamnerait tous les jets.
          Quand la cible décide, on en demande **une**, et le contrôle du pilote
          réclame le retrait du champ inutile.
        */
        reussitesRequises: descripteur.cible ? 1 : bornes ? difficulte : 1,
        /*
          Une poignée échelonnée n'a pas UNE taille. On rend celle du plus gros
          dé, pour que les écrans qui écrivent « 2d10 » disent quelque chose de
          vrai plutôt que « 2d0 » — le détail exact vit dans `desEchelonnes`,
          qui est le seul endroit où la poignée est décrite fidèlement.
        */
        faces: descripteur.desEchelonnes
            ? Math.max(0, ...poignee.des.map(d => d.faces))
            : reserve?.faces ?? 0,
        sens: descripteur.sens,
        // La spécialisation élargit le critique ; sans elle, le critique ordinaire.
        doubleSous: Math.max(choix.critiqueEtendu ?? 0, descripteur.critique ?? 0),
        difficulte,
        avertissements,
        remarques,
    };
}

/**
 * Le jet a-t-il réussi ?
 *
 * Séparé du lancer parce que la difficulté est fixée par le meneur, souvent
 * après coup, et que le même jet peut donc changer de verdict sans être relancé.
 */
export function verdict(reussites: number, difficulte: number): {
    reussi: boolean;
    /** Réussites au-delà du nécessaire — l'Impulsion, chez Dune. */
    excedent: number;
} {
    return { reussi: reussites >= difficulte, excedent: Math.max(0, reussites - difficulte) };
}
