import type { GameDriver, DiceRollLogic } from '../../../types/drivers';
import type { HealthSystemType } from '../../../types/entity.types';
import type { SheetTemplate, SheetFieldType } from '../../../data/defaultSheetTemplates';
import type { SensDuJet } from '../../dice/DescripteurDeJet';
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

    (driver.jet?.seuil ?? []).forEach((composante, i) => {
        if (!idsDeSections.has(composante.sectionId)) {
            erreur(
                `jet.seuil[${i}].sectionId`,
                `« ${composante.sectionId} » n'est pas une section de la fiche : le joueur n'aurait ` +
                'nulle part où choisir sa ' + composante.label.toLowerCase() + '.',
            );
        }
    });

    const reserve = driver.jet?.reserve;
    /*
      Une réserve se compte en nombres, jamais en formule.

      Relevé sur Alien le 2026-08-12 : `base: "attribut+comp_level"`. Le modèle
      voulait dire « la réserve vaut attribut plus compétence » — ce que le
      descripteur ne sait pas exprimer —, et l'a écrit là où le panneau de jet
      attend un entier. Il n'aurait rien lancé.
    */
    for (const borne of ['base', 'max', 'faces'] as const) {
        const valeur = reserve?.[borne] as unknown;
        if (reserve && valeur !== undefined && typeof valeur !== 'number') {
            erreur(
                `jet.reserve.${borne}`,
                `« ${String(valeur)} » n'est pas un nombre. La réserve se compte en dés ; une ` +
                'composition tirée de la fiche ne peut pas y être écrite en toutes lettres.',
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
        if (!idsDeSections.has(tache.sectionDuSeuil)) {
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

      **Mais une progression ne se retourne pas en chemin.** Relevé sur la
      dérivation d'Alien du 2026-08-13 : `contact −3, courte 0, moyenne −1,
      longue −2, extreme −3`. Les libellés étaient décalés d'un rang — « dans la
      même zone » était rangé sous `courte`, « zone adjacente » sous `moyenne` —
      et `contact` avait hérité du −3 d'`extreme`. Un personnage au contact
      aurait tiré avec la pénalité maximale, et rien ne l'aurait dit.

      Le zigzag est la signature de ce décalage, et il se voit sans connaître le
      jeu : la difficulté ne peut pas empirer, s'améliorer, puis empirer encore
      en s'éloignant d'un pas à chaque fois.
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

        const modificateurs = bandes
            .map(b => b.bande.modifier)
            .filter((m): m is number => typeof m === 'number');
        let monte = false;
        let descend = false;
        for (let i = 1; i < modificateurs.length; i++) {
            if (modificateurs[i] > modificateurs[i - 1]) monte = true;
            if (modificateurs[i] < modificateurs[i - 1]) descend = true;
        }
        if (monte && descend) {
            erreur(
                'tactical.ranges',
                `Les modificateurs ne progressent pas dans un seul sens (${modificateurs.join(', ')}) : ` +
                "ils s'aggravent puis s'allègent en s'éloignant. C'est la signature d'un décalage " +
                "d'un rang entre les bandes — vérifiez que le libellé de chaque portée décrit bien " +
                'la distance sous laquelle il est rangé.',
            );
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
