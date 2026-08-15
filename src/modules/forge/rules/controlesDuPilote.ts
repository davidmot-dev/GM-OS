import type { GameDriver, DiceRollLogic, DiceConfig } from '../../../types/drivers';
import type { HealthSystemType } from '../../../types/entity.types';
import type { SheetTemplate, SheetSection, SheetFieldType } from '../../../data/defaultSheetTemplates';
import { sectionDeLaComposante, type SensDuJet } from '../../dice/DescripteurDeJet';
import { GROUPES } from './GroupesDeChamps';

/**
 * Le pilote se vérifie — axe 4 du plan du 2026-08-11.
 *
 * **Le défaut que ces contrôles attrapent, et il est toujours le même.**
 * `CombatCard` va chercher la valeur d'un personnage **par son identifiant**, en
 * pleine séance. Un `fieldId` qui ne correspond à aucun champ de la fiche
 * n'émet ni erreur ni champ en rouge : il affiche **une jauge à zéro**, qui
 * ressemble à un personnage en pleine forme. Le même silence vaut pour un
 * `sectionId` de jet, pour la section d'une tâche de défaite, et pour la
 * réserve censée payer les dés supplémentaires.
 *
 * **Pourquoi c'est ici et pas dans les tests.** Les contrôles existaient déjà,
 * mais seulement pour Dune, et seulement au moment de lancer la suite
 * (`src/data/duneReference.test.ts`). Un pilote **forgé** naît après la
 * compilation : rien ne le regardait. *Une vérification qu'il faut lancer à la
 * main n'est pas une vérification, c'est une intention.*
 *
 * **Ils ne refusent rien.** Ils nomment, et un humain tranche — un champ
 * introuvable peut être une fiche incomplète autant qu'une invention du modèle.
 * C'est la règle du projet : ne rien refuser sans motif écrit, et ne jamais
 * remplacer un motif écrit par un bouton grisé.
 */

export type GraviteDuConstat = 'erreur' | 'avertissement';

export interface ConstatDuPilote {
    gravite: GraviteDuConstat;
    /** Où, dans le pilote — `combat.statsToTrack[0].fieldId`. */
    ou: string;
    message: string;
}

const LOGIQUES_CONNUES: readonly DiceRollLogic[] = [
    'sum', 'highest', 'lowest', 'count-success', 'd100-low', 'd100-high',
];

/** Les types que `SheetField` accepte — `src/data/defaultSheetTemplates.ts`. */
const TYPES_DE_CHAMP: readonly SheetFieldType[] = [
    'number', 'text', 'checkbox', 'gauge', 'select', 'textarea', 'rating', 'formula',
];

/** Les deux sens que `preparerLeJet` sait lire. */
const SENS_CONNUS: readonly SensDuJet[] = ['sous-ou-egal', 'superieur-ou-egal'];

/**
 * Les cinq modèles que `HealthInterpreter` sait interpréter — `entity.types.ts`.
 *
 * **Relevé sur la dérivation d'Alien du 2026-08-13 :** `defaultHealthType`
 * valait « Santé », le titre de la section de la fiche. Aucun des cinq. Le
 * modèle n'inventait pas : il recopiait le seul mot qu'il avait sous les yeux
 * pour dire « la santé », faute de connaître l'énumération.
 *
 * Une valeur hors énumération ne fait rien planter — c'est bien le problème.
 * `HealthInterpreter` retombe sur son cas par défaut, et la mise hors de combat
 * se joue alors sur un modèle que personne n'a choisi.
 */
const MODELES_DE_SANTE: readonly HealthSystemType[] = ['hp', 'clocks', 'anatomy', 'wounds', 'boxes'];

/** Les douze familles de moteur que `DiceBoard` et `RemoteDicePad` savent choisir. */
type MoteurDeDes = NonNullable<DiceConfig['engine']>;
const MOTEURS_CONNUS: readonly MoteurDeDes[] = [
    'standard', 'formula', 'pool', 'pool_explode', 'threshold', 'advantage',
    'disadvantage', 'exploding', 'fate', 'rolemaster', 'yze', '2d20',
];

/**
 * Les seules familles dont le nom dit déjà les faces qu'elles lancent.
 *
 * Les autres — `pool`, `threshold`, `exploding`… — décrivent une façon de
 * compter, pas un dé : rien à confronter, donc rien à contrôler.
 */
const FACES_DU_MOTEUR: Readonly<Record<string, number>> = { '2d20': 20, yze: 6, 'year-zero': 6 };

/**
 * Deux noms que le type ne déclare pas et que les trois lecteurs acceptent
 * pourtant — `DiceEngine`, `DiceBoard` et `RemoteDicePad` reconnaissent tous
 * `year-zero` à côté de `yze`, et `d100` à côté de `rolemaster`.
 *
 * On les tolère parce qu'ils **marchent** : condamner une valeur qui bascule
 * réellement le pupitre dans le bon mode serait un faux positif, et le message
 * inviterait à « corriger » un pilote qui n'a rien.
 */
const ALIAS_DE_MOTEUR: readonly string[] = ['year-zero', 'd100'];

/**
 * Les faces que ce pilote lance réellement, si elles se lisent quelque part.
 *
 * La réserve fait foi quand elle en déclare, sinon la notation de `defaultDice`.
 * Rend `undefined` plutôt que de deviner : un contrôle qui invente sa mesure
 * crie sur des pilotes justes, et un contrôle qui crie à tort finit ignoré.
 */
function facesLancees(driver: Partial<GameDriver>): number | undefined {
    const deLaReserve = driver.jet?.reserve?.faces;
    if (typeof deLaReserve === 'number') return deLaReserve;
    const notation = driver.dice?.defaultDice?.match(/d(\d+)/i);
    return notation ? Number(notation[1]) : undefined;
}

/** Les cinq bandes de portée, de la plus proche à la plus lointaine. */
const ORDRE_DES_PORTEES = ['contact', 'courte', 'moyenne', 'longue', 'extreme'] as const;

/** Tout ce que les exemples de l'invite montrent — donc tout ce qui peut en être recopié. */
const TEXTE_DES_EXEMPLES = GROUPES.map(g => g.exemple).join(' ');

/**
 * Les identifiants qu'une formule d'initiative invoque.
 *
 * La notation de dés est retirée d'abord : `1d10` n'est pas un champ de fiche,
 * et le lire comme tel ferait crier le contrôle sur une formule parfaitement
 * valide — un faux positif est le plus sûr moyen de faire ignorer les vrais.
 */
export function champsInvoques(formule: string): string[] {
    return (formule.replace(/\b\d*d\d+\b/gi, ' ').match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? [])
        .filter((mot, i, tous) => tous.indexOf(mot) === i);
}

/**
 * Tout ce qui, dans ce pilote, ne se raccorde à rien.
 *
 * Rend une liste vide quand tout se tient. N'exige **pas** que le pilote soit
 * complet : un jeu sans réserve de table, sans tâche de défaite ou sans
 * initiative ordonnée est un jeu ordinaire, pas un pilote fautif.
 */
export function controlerLePilote(
    driver: Partial<GameDriver>,
    template: Partial<SheetTemplate>,
): ConstatDuPilote[] {
    const constats: ConstatDuPilote[] = [];
    const erreur = (ou: string, message: string) => constats.push({ gravite: 'erreur', ou, message });
    const avertir = (ou: string, message: string) => constats.push({ gravite: 'avertissement', ou, message });

    const sections = template.sections ?? [];
    const idsDeSections = new Set(sections.map(s => s.id));
    const champsParSection = new Map(sections.map(s => [s.id, new Set((s.fields ?? []).map(f => f.id))]));
    const tousLesChamps = new Set(sections.flatMap(s => (s.fields ?? []).map(f => f.id)));
    const ressources = new Set((driver.ressourcesDeTable ?? []).map(r => r.id));

    // ---- La fiche, socle de tout le reste -----------------------------------
    if (sections.length === 0) {
        avertir(
            'template.sections',
            "La fiche de personnage n'a aucune section : tout identifiant du pilote qui la vise " +
            'restera introuvable.',
        );
    }
    for (const section of sections) {
        if ((section.fields ?? []).length === 0) {
            avertir(`template.sections[${section.id}]`, 'Section sans aucun champ.');
        }
        for (const champ of section.fields ?? []) {
            /*
              Relevé le 2026-08-12 : le modèle a rendu `type: "string"`, qui
              n'existe pas. Le rendu d'un type inconnu retombe sur le cas par
              défaut du composant de fiche — un champ qui ne se saisit pas,
              ou qui se saisit mal, sans que rien ne l'annonce.
            */
            if (!TYPES_DE_CHAMP.includes(champ.type)) {
                erreur(
                    `template.sections[${section.id}].fields[${champ.id}].type`,
                    `« ${champ.type} » n'est pas un type de champ connu (${TYPES_DE_CHAMP.join(', ')}).`,
                );
            }
        }
    }

    // ---- Les jauges suivies en combat ---------------------------------------
    (driver.combat?.statsToTrack ?? []).forEach((stat, i) => {
        if (!tousLesChamps.has(stat.fieldId)) {
            erreur(
                `combat.statsToTrack[${i}].fieldId`,
                `« ${stat.fieldId} » (${stat.label}) n'est un champ d'aucune section de la fiche : ` +
                'la jauge affichera zéro en séance, sans rien signaler.',
            );
        }
    });

    (driver.ui_config?.gauges ?? []).forEach((jauge, i) => {
        if (!tousLesChamps.has(jauge.fieldId)) {
            erreur(
                `ui_config.gauges[${i}].fieldId`,
                `« ${jauge.fieldId} » (${jauge.label}) n'est un champ d'aucune section de la fiche.`,
            );
        }
    });

    // ---- Ce qui a été recopié de l'exemple ----------------------------------
    /*
      **L'exemple est le seul modèle que le modèle ait sous les yeux, et il le
      copie.** Dérivée d'Alien le 2026-08-12, la Forge a rendu « Dune :
      Aventures dans l'Imperium » et `#d97706` — l'exemple d'identité au
      caractère près, sur un corpus qui ne mentionne Dune nulle part. Le
      décodage glouton y est pour beaucoup : la continuation la plus probable
      d'un champ `name`, c'est le nom qu'on vient de montrer.

      L'exemple d'identité a été rendu muet depuis. Ce contrôle veille sur tous
      les autres, dont les valeurs restent concrètes à dessein.

      **Le nom et la description seulement, et pas la couleur.** La première
      version surveillait aussi `themeColor` — et condamnait aussitôt l'étalon,
      dont le `#d97706` figure légitimement dans l'exemple des jauges, puisque
      c'est de lui qu'il a été tiré. Sept caractères hexadécimaux se
      rencontrent ; une phrase entière, non. On ne surveille que ce qui ne peut
      pas coïncider par hasard.
    */
    const emprunts: [string, string | undefined][] = [
        ['name', driver.name],
        ['description', driver.description],
    ];
    for (const [ou, valeur] of emprunts) {
        if (valeur && valeur.length > 8 && TEXTE_DES_EXEMPLES.includes(valeur)) {
            erreur(ou, `« ${valeur} » est recopié mot pour mot d'un exemple de l'invite : ` +
                'cette valeur ne vient pas des fiches.');
        }
    }

    // ---- Le jet -------------------------------------------------------------
    if (driver.jet?.sens && !SENS_CONNUS.includes(driver.jet.sens)) {
        erreur(
            'jet.sens',
            `« ${driver.jet.sens} » n'est pas un sens de comparaison : le moteur ne saurait pas ` +
            'si un dé sous le seuil est une réussite ou un échec.',
        );
    }

    /*
      **« Sous un seuil » sans seuil n'a pas de sens — et l'inversion est le
      défaut le plus silencieux qui soit.**

      Dérivé d'Alien le 2026-08-12, le pilote portait `sens: 'sous-ou-egal'`
      avec un `seuil` vide, alors que la fiche dit « réussir exige d'obtenir au
      moins un six ». Tous les jets se seraient résolus à l'envers, sans qu'un
      seul écran ne s'en aperçoive — exactement le défaut du moteur 2d20 relevé
      le 2026-08-10, qui rendait « précisément les réussites qu'il fallait
      rejeter ».

      On ne sait pas lire les règles à la place du meneur ; on sait en revanche
      qu'un « sous-ou-egal » suppose une valeur à comparer, et qu'un jeu à
      réserve de dés n'en a pas.
    */
    if (driver.jet && driver.jet.sens === 'sous-ou-egal' && (driver.jet.seuil ?? []).length === 0) {
        erreur(
            'jet.sens',
            '« sous-ou-egal » compte les dés qui restent SOUS un seuil, mais aucun seuil n\'est ' +
            'composé depuis la fiche. Si le jeu compte les dés qui atteignent une valeur — « chaque ' +
            'six est une réussite » —, c\'est « superieur-ou-egal », et l\'inverse ne se verrait ' +
            'jamais en séance.',
        );
    }

    if (driver.dice?.defaultDice && /^0+d/i.test(driver.dice.defaultDice)) {
        erreur('dice.defaultDice', `« ${driver.dice.defaultDice} » ne lance aucun dé.`);
    }

    /*
      **Le moteur de dés, et les deux façons de le manquer.**

      `DiceBoard` et `RemoteDicePad` lisent `dice.engine` pour choisir leur
      mode, et retombent sur `standard` quand il ne dit rien. La dérivation
      d'Alien du 2026-08-13 l'a laissé vide : `DiceEngine.rollYZE`, qui compte
      les six et distingue les dés d'équipement, n'aurait jamais été appelé, et
      la table aurait lancé des dés génériques toute une séance sans un mot.

      L'autre façon est pire, et l'exemple de l'invite la rend probable : y
      recopier le `2d20` de Dune sur un jeu qui lance des d6. Un moteur faux ne
      se signale pas davantage qu'un moteur absent — mais lui, on peut le
      confondre, parce que la famille du moteur dit les faces qu'elle lance.
    */
    const moteur = driver.dice?.engine as string | undefined;
    if (moteur !== undefined && !MOTEURS_CONNUS.includes(moteur as MoteurDeDes)
        && !ALIAS_DE_MOTEUR.includes(moteur)) {
        erreur(
            'dice.engine',
            `« ${moteur} » n'est pas un moteur connu (${MOTEURS_CONNUS.join(', ')}). ` +
            'Le pupitre de dés retombera sur son mode standard.',
        );
    } else if (moteur === undefined && driver.jet?.reserve) {
        /*
          **On n'avertit que là où l'absence est forcément un manque.**

          `standard` est le défaut, et pour un jeu qui lance un d20 contre une
          difficulté, il est juste : un pilote sans `engine` n'est pas un
          pilote fautif. Mais **un jeu qui compose une réserve n'est jamais
          standard** — c'est précisément ce que `standard` ne sait pas faire.
          Le déclencheur est donc la réserve, pas l'absence toute seule.

          La première version avertissait dès que `dice` existait, et deux
          contrôles justes se sont mis à crier sur des pilotes d'essai qui ne
          demandaient rien. Un contrôle qui crie à tort finit ignoré, et
          emporte les vrais avec lui.
        */
        avertir(
            'dice.engine',
            'Le jet compose une réserve de dés, mais aucune famille de moteur n\'est nommée : le ' +
            'pupitre de dés et la tablette retomberont sur leur mode standard, qui ne sait pas ' +
            'lancer de réserve. Un jeu à réserve de d6 dont on compte les six se dit « yze ».',
        );
    }

    const facesAttendues = moteur ? FACES_DU_MOTEUR[moteur] : undefined;
    const facesObservees = facesLancees(driver);
    if (facesAttendues !== undefined && facesObservees !== undefined
        && facesObservees !== facesAttendues) {
        erreur(
            'dice.engine',
            `Le moteur « ${moteur} » lance des dés à ${facesAttendues} faces, mais le jet en ` +
            `compose à ${facesObservees}. L'un des deux est recopié de l'exemple.`,
        );
    }

    if (driver.jet?.reserve && driver.jet.reserve.max < 1) {
        avertir(
            'jet.reserve',
            `Réserve de ${driver.jet.reserve.base} à ${driver.jet.reserve.max} dés : le panneau de ` +
            'jet n\'aurait rien à lancer.',
        );
    }

    if (driver.dice?.logic && !LOGIQUES_CONNUES.includes(driver.dice.logic)) {
        erreur(
            'dice.logic',
            `« ${driver.dice.logic} » n'est pas une logique connue du moteur ` +
            `(${LOGIQUES_CONNUES.join(', ')}).`,
        );
    }

    /*
      **Ce contrôle avait raison et n'avait jamais été lancé sur le bon couple.**

      Relevé le 2026-08-15 sur l'état réel de David : son pilote Dune vise les
      sections `competences` et `principes` — les identifiants du gabarit de
      référence livré dans le code — alors qu'il est attaché à *sa* fiche à lui,
      où elles s'appellent `stats` et `principles`. Les deux menus du panneau de
      jet étaient vides, et l'écran lui reprochait de n'avoir rien choisi.

      Un pilote écrit à la main, importé, ou dont on renomme les sections après
      coup ne repasse jamais devant la Forge : *une vérification qui ne tourne
      qu'à la naissance ne protège que du premier jour.* Le panneau de jet
      résout donc lui aussi, à l'exécution.

      Le message, lui, nomme désormais la section qui répond — corriger un
      pilote suppose de savoir par quoi remplacer, et c'est l'outil qui le sait.
    */
    const composantesDuJet: [string, NonNullable<GameDriver['jet']>['seuil']][] = [
        ['jet.seuil', driver.jet?.seuil],
        // Même contrôle sur la réserve depuis le 2026-08-15 : elle se compose
        // désormais depuis la fiche, donc elle peut la manquer de la même façon.
        ['jet.reserve.composantes', driver.jet?.reserve?.composantes],
    ];
    composantesDuJet.forEach(([ou, liste]) => (liste ?? []).forEach((composante, i) => {
        if (idsDeSections.has(composante.sectionId)) return;

        const { section } = sectionDeLaComposante(sections as SheetSection[], composante);
        erreur(
            `${ou}[${i}].sectionId`,
            `« ${composante.sectionId} » n'est pas une section de la fiche : le joueur n'aurait ` +
            'nulle part où choisir sa ' + composante.label.toLowerCase() + '.'
            + (section
                ? ` La fiche nomme « ${section.label || section.id} » (${section.id}) — c'est `
                  + 'sans doute elle.'
                : ''),
        );
    }));

    const reserve = driver.jet?.reserve;
    /*
      **Les bornes de la réserve se comptent en nombres ; sa composition, elle,
      a désormais un endroit pour vivre.**

      Relevé sur Alien le 2026-08-12 : `base: "attribut+comp_level"`. Le modèle
      voulait dire « la réserve vaut attribut plus compétence » — la bonne
      mécanique, écrite là où le panneau attendait un entier, faute de champ
      pour l'exprimer. L'invite lui commandait ensuite d'y renoncer : *« en
      NOMBRES et jamais en formule »*. **C'est l'outil qui ordonnait de perdre
      la règle**, comme la consigne du zigzag sur les portées.

      Depuis le 2026-08-15, `jet.reserve.composantes` porte cette composition,
      exactement comme `jet.seuil` porte celle du seuil. Le contrôle reste — une
      formule dans `base` ne lancerait toujours rien — mais son message dit
      maintenant où écrire la règle au lieu de la condamner.
    */
    for (const borne of ['base', 'max', 'faces'] as const) {
        const valeur = reserve?.[borne] as unknown;
        if (reserve && valeur !== undefined && typeof valeur !== 'number') {
            erreur(
                `jet.reserve.${borne}`,
                `« ${String(valeur)} » n'est pas un nombre. Les bornes de la réserve se comptent ` +
                "en dés. Si le jeu compose sa réserve depuis la fiche — « autant de dés que " +
                "l'attribut plus la compétence » —, cela s'écrit dans " +
                '`jet.reserve.composantes`, une par valeur invoquée, comme pour le seuil.',
            );
        }
    }
    if (reserve?.ressource && !ressources.has(reserve.ressource)) {
        erreur(
            'jet.reserve.ressource',
            `« ${reserve.ressource} » paie les dés supplémentaires mais n'est déclarée dans aucune ` +
            'ressource de table : le panneau de jet ne saurait rien débiter.',
        );
    }

    // ---- L'ordre d'action ---------------------------------------------------
    /*
      Relevé sur Alien le 2026-08-12 :

          "initiative": "ordre croissant des numéros", "initiativeSort": "croissant"

      Le premier doit être un **objet** — `OrdreDuTour` y lit un mode, un prix
      de rétention, un plafond d'activations —, et le second n'accepte que deux
      valeurs. Une phrase à la place d'un descripteur ne fait pas planter
      l'écran de combat : elle le fait retomber sur son comportement par
      défaut, sans rien dire. Alien tire des cartes numérotées, et le pilote a
      un `initiativeCards` pour ça.
    */
    if (driver.combat?.initiative !== undefined && typeof driver.combat.initiative !== 'object') {
        erreur(
            'combat.initiative',
            `« ${String(driver.combat.initiative)} » est une phrase, pas un descripteur d'ordre ` +
            "d'action. Un jeu qui tire des cartes numérotées se décrit par `initiativeCards`.",
        );
    }

    const tri = driver.combat?.initiativeSort;
    if (tri !== undefined && tri !== 'asc' && tri !== 'desc') {
        erreur('combat.initiativeSort', `« ${String(tri)} » n'est ni « asc » ni « desc ».`);
    }

    const formule = driver.combat?.initiativeFormula ?? '';
    for (const champ of champsInvoques(formule)) {
        if (!tousLesChamps.has(champ)) {
            erreur(
                'combat.initiativeFormula',
                `La formule « ${formule} » invoque « ${champ} », qui n'est un champ d'aucune section.`,
            );
        }
    }

    /*
      **La santé de départ se lit sur la fiche, donc elle peut la manquer.**
      Une formule qui invoque un champ inexistant vaut zéro à l'évaluation, et
      chaque personnage naîtrait avec le minimum — un mourant à la création,
      sans qu'aucun écran ne le signale. Même contrôle que pour l'initiative,
      et pour la même raison.
    */
    const formuleDeSante = driver.combat?.santeDeDepart ?? '';
    for (const champ of champsInvoques(formuleDeSante)) {
        if (!tousLesChamps.has(champ)) {
            erreur(
                'combat.santeDeDepart',
                `La santé de départ « ${formuleDeSante} » invoque « ${champ} », qui n'est un champ ` +
                "d'aucune section de la fiche : chaque personnage naîtrait au minimum.",
            );
        }
    }

    // ---- La mise hors de combat --------------------------------------------
    const modele = driver.combat?.defaultHealthType as string | undefined;
    if (modele !== undefined && !MODELES_DE_SANTE.includes(modele as HealthSystemType)) {
        erreur(
            'combat.defaultHealthType',
            `« ${modele} » n'est pas un modèle de santé connu (${MODELES_DE_SANTE.join(', ')}). ` +
            "Le nom que la fiche donne à sa section de santé n'en est pas un : c'est la façon dont " +
            'les dégâts se comptent qu\'il faut nommer ici — des points, une horloge, des cases, ' +
            'des blessures, une anatomie.',
        );
    }

    const tache = driver.combat?.tacheDeDefaite;
    if (tache) {
        /*
          **La tâche de défaite l'emporte en séance, quoi que dise le modèle de
          santé.** `santeSelonLeSysteme` la consulte dès qu'un combattant a une
          fiche et rend alors `horlogeDeDefaite`, c'est-à-dire une horloge —
          `type: 'clocks'` en dur. Un pilote qui déclare `hp` *et* une tâche ne
          fait donc pas ce qu'il annonce : la jauge de la fiche n'est jamais
          lue, et personne ne le dit.

          Relevé sur Alien le 2026-08-14 : `defaultHealthType: "hp"` avec
          `tacheDeDefaite: {seuil:{min:0,max:0}}`, un objet croupion sans
          section ni progression. Chaque personnage serait entré en combat avec
          une horloge à **zéro segment**.

          La tâche est le mécanisme des jeux qui n'ont PAS de points de vie —
          Dune remplace sa jauge par une tâche étendue, et déclare `clocks` en
          conséquence. Un jeu qui compte des points de vie l'omet.
        */
        const modeleDeSante = driver.combat?.defaultHealthType;
        if (modeleDeSante && modeleDeSante !== 'clocks') {
            erreur(
                'combat.tacheDeDefaite',
                `Le pilote déclare le modèle de santé « ${modeleDeSante} » mais porte aussi une ` +
                "tâche de défaite, qui impose une horloge dès qu'un combattant a une fiche. C'est " +
                "la tâche qui l'emportera, et la jauge de la fiche ne sera jamais lue. La tâche de " +
                "défaite est le mécanisme des jeux SANS points de vie : un jeu qui en compte " +
                "l'omet entièrement.",
            );
        }

        if (!tache.sectionDuSeuil) {
            erreur(
                'combat.tacheDeDefaite.sectionDuSeuil',
                "La tâche de défaite ne dit pas dans quelle section lire son seuil : il retomberait " +
                'sur son minimum pour tout le monde. Un objet incomplet est plus dangereux ' +
                "qu'absent — si le jeu n'a pas de tâche étendue de défaite, il faut l'omettre.",
            );
        } else if (!idsDeSections.has(tache.sectionDuSeuil)) {
            erreur(
                'combat.tacheDeDefaite.sectionDuSeuil',
                `« ${tache.sectionDuSeuil} » n'est pas une section de la fiche : le seuil de défaite ` +
                'retomberait sur son minimum pour tout le monde.',
            );
        }
        // Un seuil de 0 à 0 met tout le monde hors de combat au premier coup.
        if (tache.seuil && tache.seuil.max < 1) {
            avertir(
                'combat.tacheDeDefaite.seuil',
                `Seuil de défaite de ${tache.seuil.min} à ${tache.seuil.max} : toute attaque ` +
                'réussie mettrait sa cible hors de combat.',
            );
        }
        if (tache.champParDefaut && idsDeSections.has(tache.sectionDuSeuil)
            && !champsParSection.get(tache.sectionDuSeuil)?.has(tache.champParDefaut)) {
            erreur(
                'combat.tacheDeDefaite.champParDefaut',
                `« ${tache.champParDefaut} » n'appartient pas à la section « ${tache.sectionDuSeuil} ».`,
            );
        }
    }

    // ---- Les portées --------------------------------------------------------
    /*
      **Ce qu'on contrôle, et surtout ce qu'on ne contrôle pas.**

      Le signe du modificateur n'est pas arbitrable : Dune fait *monter* une
      difficulté avec la distance (0 → 4), Alien fait *descendre* un bonus de
      tir (0 → −3). Les deux sont justes, et l'outil suit l'état, il n'arbitre
      pas. On ne surveille donc ni le sens, ni les valeurs.

      **Et pas davantage la monotonie — c'est une erreur qu'on a faite.** Un
      contrôle posé le 2026-08-13 criait au « zigzag » sur `contact −3,
      courte 0, moyenne −1, longue −2, extreme −3`, en y voyant la signature
      d'un décalage d'un rang entre les bandes. Deux dérivations d'Alien ont été
      accusées ainsi. **Elles avaient raison toutes les deux** : la fiche des
      portées écrit exactement ces cinq valeurs, et le livre les justifie —
      tirer sur une cible collée à soi est difficile, tirer à un kilomètre
      aussi. La courbe en U est une forme de règle parfaitement ordinaire.

      Le contrôle a donc été retiré. Il condamnait un pilote juste, et la
      consigne jumelle ajoutée à l'invite aurait poussé le modèle à falsifier le
      jeu pour satisfaire l'outil. *Un contrôle qui crie à tort ne coûte pas
      seulement sa propre crédibilité : ici, il commandait de casser la règle.*

      Reste ce qui est vraiment invariant : une bande plus lointaine ne peut pas
      porter moins loin qu'une plus proche. Celui-là ne dépend d'aucun jeu.
    */
    const portees = driver.tactical?.ranges;
    if (portees) {
        const bandes = ORDRE_DES_PORTEES
            .map(nom => ({ nom, bande: portees[nom] }))
            .filter((b): b is { nom: typeof ORDRE_DES_PORTEES[number]; bande: NonNullable<typeof b.bande> } => !!b.bande);

        for (let i = 1; i < bandes.length; i++) {
            const avant = bandes[i - 1];
            const apres = bandes[i];
            if (typeof avant.bande.maxUnits === 'number' && typeof apres.bande.maxUnits === 'number'
                && apres.bande.maxUnits < avant.bande.maxUnits) {
                erreur(
                    `tactical.ranges.${apres.nom}.maxUnits`,
                    `« ${apres.nom} » couvre ${apres.bande.maxUnits} unités quand « ${avant.nom} », ` +
                    `plus proche, en couvre ${avant.bande.maxUnits} : une bande plus lointaine ne ` +
                    'peut pas porter moins loin.',
                );
            }
        }

    }

    // ---- Les réserves de table ---------------------------------------------
    (driver.ressourcesDeTable ?? []).forEach((ressource, i) => {
        const report = ressource.reportSurEpuisement;
        if (report && !ressources.has(report)) {
            erreur(
                `ressourcesDeTable[${i}].reportSurEpuisement`,
                `« ${ressource.label} » déverse son trop-plein dans « ${report} », qui n'existe pas.`,
            );
        }
        if (report && report === ressource.id) {
            erreur(
                `ressourcesDeTable[${i}].reportSurEpuisement`,
                `« ${ressource.label} » se déverse dans elle-même.`,
            );
        }
    });

    return constats;
}
