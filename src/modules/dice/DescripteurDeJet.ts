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

/** Un choix que le joueur fait sur sa fiche au moment de lancer. */
export interface ComposanteDeJet {
    /** Identifiant de la composante — `competence`, `principe`, `attribut`. */
    id: string;
    label: string;
    /**
     * Section de la fiche où choisir. Le joueur retient **un** champ de cette
     * section, et c'est sa valeur qui entre dans le calcul.
     */
    sectionId: string;
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
    nombreDeDes: number;
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

/** Sans accents, sans casse, sans ponctuation — deux façons d'écrire le même mot. */
function normaliser(texte: string): string {
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

/** La section où choisir cette composante, si la fiche en tient une. */
export function sectionDeLaComposante(
    sections: readonly SheetSection[] | undefined,
    composante: ComposanteDeJet,
): SectionRetenue {
    const toutes = sections ?? [];

    const parIdentifiant = toutes.find(s => s.id === composante.sectionId);
    if (parIdentifiant) return { section: parIdentifiant, par: 'id', ambigues: [] };

    // L'intitulé de la composante compte autant que l'identifiant qu'elle vise :
    // un pilote qui demande « Compétence » cherche la section des compétences,
    // quel que soit le mot qu'il a mis dans `sectionId`.
    const noms = [composante.sectionId, composante.label].map(normaliser).filter(Boolean);
    const repondent = toutes.filter(s => noms.some(nom =>
        memeNom(nom, normaliser(s.id)) || memeNom(nom, normaliser(s.label ?? ''))));

    if (repondent.length === 1) return { section: repondent[0], par: 'label', ambigues: [] };
    return { section: null, par: null, ambigues: repondent.map(s => s.label || s.id) };
}

/** Le nombre lu sur la fiche, ou zéro si le champ n'y est pas. */
function valeurDuChamp(valeurs: Record<string, unknown>, champ: string): number | null {
    const brut = valeurs[champ];
    if (brut === undefined || brut === null || brut === '') return null;
    const n = typeof brut === 'number' ? brut : Number(brut);
    return Number.isFinite(n) ? n : null;
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
                const { section, par, ambigues } = sectionDeLaComposante(sections, composante);
                if (!section) {
                    avertissements.push(ambigues.length > 1
                        ? `${composante.label} : le pilote désigne la section « ${composante.sectionId} », `
                            + `absente de cette fiche, et ${ambigues.length} sections pourraient y répondre `
                            + `(${ambigues.join(', ')}). Au pilote de dire laquelle.`
                        : `${composante.label} : le pilote désigne la section « ${composante.sectionId} », `
                            + "qui n'existe pas dans cette fiche — il n'y a rien à y choisir.");
                    continue;
                }
                if (par === 'label') {
                    remarques.push(
                        `${composante.label} : le pilote désigne la section « ${composante.sectionId} », `
                        + `que cette fiche nomme « ${section.label || section.id} » (${section.id}).`,
                    );
                }
            }

            const champ = choix.champs[composante.id];
            if (!champ) {
                avertissements.push(`${composante.label} : aucun champ retenu.`);
                continue;
            }
            const valeur = valeurDuChamp(valeursDeLaFiche, champ);
            if (valeur === null) {
                // Le cas exact que le contrôle de cohérence attrape sur le
                // pilote : un identifiant qui ne correspond à aucun champ.
                avertissements.push(`${composante.label} : « ${champ} » est absent de la fiche.`);
                continue;
            }
            total += valeur;
            retenues.push({ label: composante.label, champ, valeur });
        }

        return { total, retenues };
    };

    /*
      Un jeu à réserve ne compose aucun seuil depuis la fiche : la boucle ne
      tourne simplement pas, et le seuil reste à zéro. C'est le cas d'Alien, où
      chaque six est une réussite quelle que soit la valeur du personnage — mais
      où le NOMBRE de dés, lui, vient de la fiche.
    */
    const additionnees = additionner(descripteur.seuil ?? []);
    let seuil = additionnees.total;
    let composantes = additionnees.retenues;
    let explicationDuSeuil: string | undefined;

    /*
      **La cible calculée l'emporte sur le seuil additionné**, et les deux ne
      cohabitent pas : elles répondent à la même question. Un pilote qui
      déclarerait les deux verrait la mécanique gagner, ce que le contrôle du
      pilote signale à la revue.

      Les composantes restent celles qu'on a lues sur la fiche — le joueur doit
      voir d'où sortent les nombres, même quand ils ne s'additionnent pas.
    */
    if (descripteur.cible) {
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
    if (!reserve) {
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
        nombreDeDes,
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
        */
        reussitesRequises: bornes ? difficulte : 1,
        faces: reserve?.faces ?? 0,
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
