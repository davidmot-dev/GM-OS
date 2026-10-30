import { ECHELLE_D_USURE } from '../../dice/desDUsure';
import type { GameDriver, DiceRollLogic, DiceConfig, MouvementDeFiche } from '../../../types/drivers';
import { modulesDuPilote } from '../../modulesDuJeu/catalogue';
import type { HealthSystemType } from '../../../types/entity.types';
import type { SheetTemplate, SheetSection, SheetFieldType } from '../../../data/defaultSheetTemplates';
import { sectionDeLaComposante, type SensDuJet } from '../../dice/DescripteurDeJet';
import { MECANIQUES_DE_CIBLE } from '../../dice/systemes';
import { LOCALISATIONS } from '../../dice/systemes/runequest';
import { GROUPES } from './GroupesDeChamps';
import { champsDUneFormule, clefDeChamp } from '../../combat/logic/SanteDuCombattant';

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
    'disadvantage', 'exploding', 'fate', 'rolemaster', 'yze', 'yze-echelonne', '2d20',
    // Cthulhu Hack, 2026-09-30 : un d20 SOUS la caractéristique.
    'sauvegarde',
];

/**
 * Les seules familles dont le nom dit déjà les faces qu'elles lancent.
 *
 * Les autres — `pool`, `threshold`, `exploding`… — décrivent une façon de
 * compter, pas un dé : rien à confronter, donc rien à contrôler.
 */
const FACES_DU_MOTEUR: Readonly<Record<string, number>> = { '2d20': 20, yze: 6, 'year-zero': 6, sauvegarde: 20 };

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

/**
 * Les types de champ qu'une formule peut additionner.
 *
 * `rating` en fait partie — c'est un entier borné. `text`, `textarea`, `select`
 * et `checkbox` non : un « dé de vie » rangé dans un `text` vaut `d8`, et
 * `"d8" + 8` n'est pas une addition.
 */
export const TYPES_NUMERIQUES = new Set(['number', 'gauge', 'rating']);

/** Tout ce que les exemples de l'invite montrent — donc tout ce qui peut en être recopié. */
const TEXTE_DES_EXEMPLES = GROUPES.map(g => g.exemple).join(' ');

/**
 * Les identifiants qu'une formule invoque.
 *
 * La notation de dés est retirée d'abord : `1d10` n'est pas un champ de fiche,
 * et le lire comme tel ferait crier le contrôle sur une formule parfaitement
 * valide — un faux positif est le plus sûr moyen de faire ignorer les vrais.
 *
 * **L'EXTRACTION EST DÉLÉGUÉE À L'ÉVALUATEUR, et il a fallu une capture pour
 * voir pourquoi.** Le 2026-08-17, la revue de Cthulhu Hack affichait DEUX
 * erreurs pour une seule formule, « dé_de_vie + 8 » : elle reprochait au pilote
 * d'invoquer « d », puis « _de_vie ». Ni l'un ni l'autre n'existait — c'était le
 * `[a-zA-Z_]` d'ici qui coupait le mot sur son « é », pendant que
 * `SanteDuCombattant`, qui joue vraiment la formule en séance, la lisait
 * correctement.
 *
 * Deux analyseurs pour la même question, dont un seul avait raison. *Un contrôle
 * qui se trompe est pire qu'un contrôle absent* : il envoie corriger ce qui n'a
 * rien, et il apprend à ne plus être lu. On ne garde donc que celui qui fait
 * foi — l'évaluateur.
 */
export function champsInvoques(formule: string): string[] {
    return champsDUneFormule(formule.replace(/\b\d*d\d+\b/gi, ' '));
}

/**
 * Cette « formule » est-elle en réalité **une phrase** ?
 *
 * **Le défaut qu'elle corrige, relevé par David le 2026-08-21 sur Rêves de
 * Dragons.** La dérivation a rendu `initiativeFormula` sous forme de règle
 * rédigée : *« (une demi-caractéristique concernée (arrondie à l'inférieur) plus
 * le niveau de la compétence) + un dé à six faces - malus d'état général »*. Le
 * contrôle a fait son travail — aucun de ces mots n'est un champ — mais il a
 * crié **une fois par mot** : vingt lignes rouges pour un seul défaut, sur un
 * écran qui en comptait vingt-cinq en tout.
 *
 * *Un contrôle qui répète vingt fois la même chose ne se lit pas mieux qu'un
 * contrôle absent* — corollaire de la règle du 2026-08-17. Le meneur qui déroule
 * cette liste n'y trouve pas le seul reproche qui compte : **ce n'est pas une
 * formule.**
 *
 * **Le test est structurel, pas lexical.** On ne cherche pas des mots français :
 * on cherche **deux identifiants côte à côte sans opérateur entre eux**, ce
 * qu'aucune expression arithmétique ne peut contenir. `agilite / 2 + melee` n'en
 * a pas ; « une demi-caractéristique » en a un dès son deuxième mot. Une liste
 * de mots vides aurait vieilli avec la langue du corpus ; celui-ci vaut pour
 * toutes.
 *
 * La notation de dés part d'abord, pour la raison qui vaut déjà dans
 * `champsInvoques` : `1d10` n'est pas un champ, et le lire comme tel ferait
 * crier sur une formule valide.
 */
export function estUnePhrase(formule: string): boolean {
    const sansDes = formule.replace(/\b\d*d\d+\b/gi, ' ');
    return /[\p{L}_][\p{L}\p{N}_]*\s+[\p{L}_]/u.test(sansDes);
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
    const modules = modulesDuPilote({ id: driver.id || '', name: driver.name || '', corpusId: driver.corpusId, ragPath: driver.ragPath, modulesDuJeu: driver.modulesDuJeu });
    for (const message of modules.erreurs) erreur('modulesDuJeu', message);
    for (const module of modules.modules) {
        if (module.disponibilite === 'inconnu' || module.disponibilite === 'incompatible') avertir('modulesDuJeu', `${module.libelle} : module ${module.disponibilite === 'inconnu' ? 'absent du catalogue' : 'incompatible avec le jeu'}.`);
    }

    const sections = template.sections ?? [];
    const idsDeSections = new Set(sections.map(s => s.id));
    const champsParSection = new Map(sections.map(s => [s.id, new Set((s.fields ?? []).map(f => f.id))]));
    const tousLesChamps = new Set(sections.flatMap(s => (s.fields ?? []).map(f => f.id)));
    /**
     * Les champs **tels que le moteur les reconnaît** — sans casse, sans accents.
     *
     * **Le contrôle était plus sévère que le jeu**, relevé le 2026-08-21 sur
     * Rêves de Dragons : il reprochait à `(Taille + Constitution) / 2` d'invoquer
     * « Taille », que `valeurDuChamp` retrouve pourtant sans hésiter sur un champ
     * `taille`. *Un contrôle qui condamne ce qui marche apprend à ne plus être
     * lu* — c'est la règle du 2026-08-17, appliquée cette fois à la casse et non
     * à la découpe.
     */
    const champsReconnus = new Map(
        sections.flatMap(s => (s.fields ?? []).map(f => [clefDeChamp(f.id), f.id])),
    );
    /**
     * Les champs retrouvés par leur LIBELLÉ, pour pouvoir nommer le bon.
     *
     * Quand rien ne correspond, le message disait seulement « n'est un champ
     * d'aucune section » — et le meneur devait deviner par quoi remplacer. Or
     * l'outil le sait : une fiche qui porte un champ `carac_taille` intitulé
     * « Taille » répond exactement à la question posée. Même geste que la
     * suggestion déjà rendue sur les `sectionId`.
     */
    const champsParLibelle = new Map(
        sections.flatMap(s => (s.fields ?? []).map(f => [clefDeChamp(f.label ?? ''), f.id])),
    );
    /** Le type déclaré de chaque champ — une formule ne s'évalue que sur des nombres. */
    const typeDuChamp = new Map(sections.flatMap(s => (s.fields ?? []).map(f => [f.id, f.type as string])));

    /** L'identifiant réel derrière un nom invoqué, ou `null`. */
    const champInvoque = (nom: string): string | null =>
        champsReconnus.get(clefDeChamp(nom)) ?? null;

    /** Ce que la fiche propose de plus proche, quand elle propose quelque chose. */
    const suggestionDeChamp = (nom: string): string => {
        const parLibelle = champsParLibelle.get(clefDeChamp(nom));
        return parLibelle ? ` La fiche porte « ${nom} » sous l'identifiant « ${parLibelle} ».` : '';
    };
    const ressources = new Set((driver.ressourcesDeTable ?? []).map(r => r.id));

    /*
      ---- Le moteur de dés, avant tout le reste -------------------------------

      **Ces deux contrôles viennent de la dérivation de Cthulhu Hack du
      2026-08-16, et ils auraient chacun évité une table faussée.**

      Le pilote est ressorti avec `engine: '2d20'` et `logic: 'd100-low'` sur un
      jeu qui lance **un seul d20 sous une Sauvegarde**. Ce que le moteur en
      aurait fait : `rollFromConfig` intercepte `2d20` avant toute logique et
      lance une réserve de deux d20 à la Modiphius ; `d100-low`, lui, lance un
      d100 quoi que dise `defaultDice`.

      Aucun des deux ne plante. Ils rendent des réussites plausibles et fausses —
      *un jet résolu à l'envers ne se voit jamais en séance.* C'est exactement ce
      qu'une revue doit attraper.
    */
    const des = driver.dice?.defaultDice ?? '';
    const faces = /\d*d(\d+)/i.exec(des)?.[1];

    if (driver.dice?.engine === '2d20' && /^1?d/i.test(des.trim())) {
        erreur(
            'dice.engine',
            `« 2d20 » désigne la FAMILLE Modiphius — Dune, Star Trek, Conan —, où l'on lance ` +
            `plusieurs d20 et où l'on compte les réussites. Ce pilote ne lance qu'un dé (« ${des} ») : ` +
            'le pupitre ignorerait sa logique et lancerait une réserve de deux d20. ' +
            'Un jeu qui jette un seul d20 prend « standard ».',
        );
    }

    if ((driver.dice?.logic === 'd100-low' || driver.dice?.logic === 'd100-high') && faces && faces !== '100') {
        erreur(
            'dice.logic',
            `« ${driver.dice.logic} » lance un d100, quoi que dise « defaultDice » (« ${des} » ici). ` +
            'Ces deux logiques ne valent que pour les systèmes en pourcentage. Pour un seul dé ' +
            'sous une valeur de la fiche, c\'est « count-success » avec « jet.sens » à ' +
            '« sous-ou-egal ».',
        );
    }

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
            // Le nom d'un Vécu (Nephilim) : écrit dans un autre champ, de la même section.
            if (champ.libelleSur !== undefined && !(section.fields ?? []).some(f => f.id === champ.libelleSur)) {
                erreur(
                    `template.sections[${section.id}].fields[${champ.id}].libelleSur`,
                    `« ${champ.label} » prend son nom sur « ${champ.libelleSur} », qui n'est pas un champ de la même section : `
                    + 'le menu du jet ne le proposerait jamais.',
                );
            }
            // Un plafond lu sur un autre champ (la Stase au Ka dominant) : ce champ doit exister.
            if (champ.maxSur !== undefined && !tousLesChamps.has(champ.maxSur)) {
                avertir(
                    `template.sections[${section.id}].fields[${champ.id}].maxSur`,
                    `« ${champ.label} » prend son plafond sur « ${champ.maxSur} », absent de la fiche : il ne sera pas borné.`,
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

    /*
      **Les dés d'usure** (Cthulhu Hack, 2026-09-30) : le champ doit exister —
      c'est lui qui porte le dé courant —, et le plafond doit être un cran de
      l'échelle. Un « d7 » ne descendrait nulle part.
    */
    (driver.desDUsure ?? []).forEach((de, i) => {
        if (!tousLesChamps.has(de.fieldId)) {
            erreur(
                `desDUsure[${i}].fieldId`,
                `« ${de.fieldId} » (${de.label}) n'est un champ d'aucune section de la fiche : ` +
                'le dé de cette ressource n\'aurait nulle part où s\'inscrire.',
            );
        }
        if (de.plafond !== undefined && !(ECHELLE_D_USURE as readonly number[]).includes(de.plafond)) {
            erreur(
                `desDUsure[${i}].plafond`,
                `« d${de.plafond} » n'est pas un cran de l'échelle d'usure (${ECHELLE_D_USURE.map(f => `d${f}`).join(', ')}).`,
            );
        }
        // Le Matériel : son nom se lit sur la fiche ; un champ absent laisse l'emplacement muet.
        if (de.nomSur && !tousLesChamps.has(de.nomSur)) {
            avertir(`desDUsure[${i}].nomSur`, `« ${de.label} » lit son nom dans « ${de.nomSur} », absent de la fiche : l'emplacement ne se proposera jamais.`);
        }
        // La Folie passagère, le Choc : chaque bouton nomme une table de Table-OS.
        (de.auDeclin ?? []).forEach((suite, j) => {
            if (!suite.label?.trim() || !suite.table?.univers?.trim() || !suite.table?.table?.trim()) {
                erreur(`desDUsure[${i}].auDeclin[${j}]`, `La suite du déclin de « ${de.label} » doit nommer un bouton et une table (univers et table de Table-OS).`);
            }
        });
    });

    // Le Hors Jeu (Cthulhu Hack) : une table à tirer, et une récupération écrite en dés.
    const horsJeu = driver.combat?.horsJeu;
    if (horsJeu) {
        const tableValide = (t: { univers?: string; table?: string } | undefined) => !!t?.univers?.trim() && !!t?.table?.trim();
        if (horsJeu.tables?.length) {
            horsJeu.tables.forEach((t, i) => {
                if (!t.label?.trim() || !tableValide(t.table)) erreur(`combat.horsJeu.tables[${i}]`, 'Chaque table au choix porte un nom et une table de Table-OS (univers et table).');
            });
        } else if (!tableValide(horsJeu.table)) {
            erreur('combat.horsJeu.table', 'Le Hors Jeu doit nommer sa table (univers et table de Table-OS), ou des tables au choix.');
        }
        if ((horsJeu.desAuChoix ?? []).some(f => !(ECHELLE_D_USURE as readonly number[]).includes(f) && f !== 20)) {
            erreur('combat.horsJeu.desAuChoix', 'Les dés au choix sont des dés ordinaires (D4, D6, D8, D10, D12, D20).');
        }
        if (horsJeu.noterDans && !tousLesChamps.has(horsJeu.noterDans)) {
            avertir('combat.horsJeu.noterDans', `Les résultats se notent dans « ${horsJeu.noterDans} », absent de la fiche : ils ne se garderont pas.`);
        }
        if (horsJeu.recuperation !== undefined && !/^\s*\d*d\d+\s*$/i.test(horsJeu.recuperation)) {
            erreur('combat.horsJeu.recuperation', `La récupération « ${horsJeu.recuperation} » doit s'écrire en dés (« 1d4 »).`);
        }
    }

    // La protection de Blade Runner : un niveau lu sur la fiche, des dés en nombre entier.
    const protection = driver.combat?.protection;
    if (protection) {
        if (!tousLesChamps.has(protection.champ)) {
            erreur('combat.protection.champ', `Le niveau de protection se lit dans « ${protection.champ} », absent de la fiche : le bouton ne paraîtrait jamais.`);
        }
        if (protection.des !== undefined && !(Number.isInteger(protection.des) && protection.des > 0)) {
            erreur('combat.protection.des', 'La protection lance un nombre entier positif de dés.');
        }
        if (protection.nomSur && !tousLesChamps.has(protection.nomSur)) {
            avertir('combat.protection.nomSur', `Le nom de la protection se lit dans « ${protection.nomSur} », absent de la fiche.`);
        }
    }
    (driver.jet?.brise ?? []).forEach((b, i) => {
        if (b.noterDans && !tousLesChamps.has(b.noterDans)) {
            avertir(`jet.brise[${i}].noterDans`, `« ${b.label} » note son effet dans « ${b.noterDans} », absent de la fiche.`);
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

    /*
      **Une cible calculée et un compte de réussites ne cohabitent pas.**

      Les deux portent le mot « difficulté » et n'ont aucun rapport : `cible`
      déplace la colonne d'une table et change le pourcentage, `difficulte`
      compte des réussites à atteindre — un héritage de Dune. Un pilote qui
      déclare les deux fait s'afficher **deux réglages nommés « difficulté »
      côte à côte** dans le panneau de jet.

      *Constaté sur une capture d'écran de David le 2026-08-23*, sur le pilote de
      Rêves de Dragons qu'il venait de redériver. Le moteur ignore désormais le
      compte quand une cible décide, et le panneau ne l'affiche plus — mais le
      champ reste dans le pilote, et **un champ mort qu'on laisse finit par être
      rempli**. On demande donc son retrait.

      Avertissement et non erreur : le pilote fonctionne, il est seulement
      encombré. *On ne refuse pas un pilote jouable pour un champ inerte.*
    */
    /*
      **Un seuil composé de valeurs qui ne sont pas des nombres.**

      *Le défaut vu à l'écran par David le 2026-08-29*, sur Blade Runner : le
      pilote déclarait un `seuil` — donc une addition — alors qu'un attribut y
      vaut `"B (D10)"`. Le panneau annonçait « agilite est absent de la fiche »
      sur un champ parfaitement rempli, et le bouton restait gris sans que rien
      n'explique pourquoi.

      On ne peut pas le détecter ici sans la fiche d'un personnage. Ce qu'on
      **peut** dire, c'est qu'un pilote de la famille Year Zero à dés échelonnés
      n'a rien à faire d'un seuil : ces jeux ne composent aucune valeur à
      atteindre, ils comptent les six. *Déclarer les deux, c'est déclarer deux
      mécaniques dont une seule s'appliquera.*
    */
    /*
      **Le panneau de fiche et le pupitre lisent DEUX champs différents.**

      *La question de David, le 2026-08-29 : « qui d'autre lance ce jet ? »* Le
      panneau lit `jet.desEchelonnes` ; Dice-OS et la tablette ne connaissent que
      `dice.engine`. Un pilote qui déclare l'un sans l'autre marche depuis la
      fiche d'un personnage et rend une poignée de d6 depuis le pupitre — *des
      réussites plausibles, et le dé à douze faces du personnage nulle part.*

      ⚠️ **Ce n'est plus vrai depuis le 2026-09-30**, et le contrôle criait à
      tort (relevé le 2026-10-13 sur Blade Runner, en évaluant les onze
      pilotes) : `DiceBoard` passe en dés échelonnés dès que `jet.desEchelonnes`
      existe, et `RemoteDicePad` les lance de même. Le jet est juste quel que
      soit le moteur. Il ne reste qu'une trace : la tablette affiche l'aide du
      Year Zero à réserve quand le moteur vaut `yze`. D'où un avertissement,
      qui dit le nom exact, et plus une erreur. *Un contrôle qui crie à tort
      apprend à ne plus être lu.*
    */
    if (driver.jet?.desEchelonnes && driver.dice && driver.dice.engine !== 'yze-echelonne') {
        avertir(
            'dice.engine',
            `Ce pilote lance des dés échelonnés, et son moteur se nomme « ${driver.dice.engine ?? 'absent'} ». `
            + 'Le jet reste juste — Dice-OS et la tablette suivent « jet.desEchelonnes » — mais la '
            + 'tablette affichera l\'aide d\'un autre moteur. Le nom exact est « yze-echelonne ».',
        );
    }

    if (driver.jet?.desEchelonnes && (driver.jet?.seuil?.length || driver.jet?.cible)) {
        avertir(
            'jet.seuil',
            'Ce pilote lance des dés échelonnés ET compose un seuil. Un jeu à dés échelonnés ' +
            'ne compose aucune valeur à atteindre : il compte les six. Retirer « jet.seuil » ' +
            '(et « jet.cible ») évite un calcul mort à côté de celui qui compte.',
        );
    }

    if (driver.jet?.cible && driver.jet?.difficulte) {
        avertir(
            'jet.difficulte',
            'Ce pilote déclare une cible calculée ET un compte de réussites. Les deux se nomment ' +
            '« difficulté » et n’ont aucun rapport : la cible décide, le compte est ignoré. ' +
            'Retirer « jet.difficulte » évite un réglage mort à côté de celui qui compte.',
        );
    }

    /*
      **Un compte de réussites que la réserve ne peut pas produire.**

      *Le défaut de Symbaroum, trouvé le 2026-10-21 en écrivant sa page du
      manuel : chaque test réussissait, un 20 compris.* La Forge avait rangé le
      modificateur du livre dans `jet.difficulte` — qui compte des réussites à
      atteindre — sur un jeu qui lance **un seul** d20 sous un seuil. Un dé ne
      donne qu'une réussite : à zéro, tout réussit ; à deux, tout échoue. Le
      pilote se chargeait, le panneau affichait son curseur, et le verdict était
      faux sans qu'un écran le dise. Crimes, audité le 2026-10-19, en est l'autre
      visage : un seuil par dé de 9 rangé là, sur une réserve plafonnée à zéro
      dé — neuf réussites exigées de rien.

      Le plafond se lit sur `reserve.max` ; un dé critique compte double. Torg,
      NOC et les cibles calculées n'y entrent pas : ils comparent un total ou un
      pourcentage, ils ne comptent pas de réussites. *Erreur et non avertissement :
      ce pilote est jouable, et c'est bien le problème — il rend des verdicts.*
    */
    const jetCompte = driver.jet;
    const reserveDuJet = jetCompte?.reserve;
    if (jetCompte && reserveDuJet && !reserveDuJet.sansPlafond && !jetCompte.desEchelonnes && !jetCompte.tableDeBonus && !jetCompte.destin && !jetCompte.cible) {
        // La réserve vide elle-même est signalée plus bas, en avertissement.
        const difficulte = jetCompte.difficulte;
        if (difficulte) {
            const plafond = Math.max(0, reserveDuJet.max ?? 0) * (jetCompte.critique ? 2 : 1);
            if (reserveDuJet.max === 1 && (difficulte.min < 1 || difficulte.defaut !== 1 || difficulte.max > plafond)) {
                erreur(
                    'jet.difficulte',
                    `« jet.difficulte » compte des réussites à atteindre, et ce jet ne lance qu'un dé : ` +
                    'à zéro, tous les jets réussissent ; au-delà d\'un, ils échouent tous. Un modificateur ' +
                    'ou une opposition qui déplace le seuil va dans « jet.modificateurDuSeuil ». Retirer « jet.difficulte ».',
                );
            } else if (reserveDuJet.max === 1) {
                avertir(
                    'jet.difficulte',
                    'Ce jet ne lance qu\'un dé et exige toujours une réussite : « jet.difficulte » ne règle ' +
                    'rien, et un réglage inutile finit par être rempli. Le retirer.',
                );
            } else if (difficulte.defaut > plafond) {
                erreur(
                    'jet.difficulte',
                    `La difficulté par défaut exige ${difficulte.defaut} réussites, et la réserve n'en produit ` +
                    `jamais plus de ${plafond} : tous les jets échoueront. « jet.difficulte » compte des ` +
                    'réussites ; la valeur que chaque dé doit atteindre se déclare dans « dice.successThreshold ».',
                );
            } else if (difficulte.max > plafond) {
                avertir(
                    'jet.difficulte',
                    `La difficulté monte jusqu'à ${difficulte.max} réussites, et la réserve n'en produit jamais ` +
                    `plus de ${plafond} : le haut du curseur condamne le jet d'avance.`,
                );
            }
        }
    }

    /*
      **Le seuil que le meneur déplace** (Symbaroum, 2026-10-22) : des bornes en
      nombres, et seulement là où il s'applique — un seuil additionné qu'on jette
      dessous. Ailleurs le moteur l'ignore : un réglage mort, qu'on signale.
    */
    const deplace = driver.jet?.modificateurDuSeuil;
    if (deplace) {
        const { min, max, defaut } = deplace;
        if (![min, max, defaut].every(n => typeof n === 'number' && Number.isFinite(n)) || min > defaut || defaut > max) {
            erreur(
                'jet.modificateurDuSeuil',
                'Le modificateur du seuil demande trois nombres, « min » ≤ « defaut » ≤ « max » — chez ' +
                'Symbaroum, de −5 à +5, défaut 0.',
            );
        }
        if (deplace.avantage && !(typeof deplace.avantage.seuil === 'number' && Number.isFinite(deplace.avantage.seuil))) {
            erreur('jet.modificateurDuSeuil.avantage', 'L’Avantage tactique ajoute un nombre au seuil : +2 chez Symbaroum.');
        }
        if (deplace.opposition && !(typeof deplace.opposition.reference === 'number' && Number.isFinite(deplace.opposition.reference))) {
            erreur('jet.modificateurDuSeuil.opposition', 'L’opposition retire la valeur adverse d’une « reference » : un nombre, 10 chez Symbaroum.');
        }
        const jet = driver.jet!;
        if (jet.sens !== 'sous-ou-egal' || !jet.seuil?.length || jet.cible || jet.desEchelonnes || jet.tableDeBonus || jet.destin) {
            avertir(
                'jet.modificateurDuSeuil',
                'Le modificateur du seuil ne s’applique qu’à un seuil additionné qu’on jette dessous ' +
                '(« sous-ou-egal ») : ici, le moteur l’ignore. Le retirer.',
            );
        }
    }

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
    /*
      **Une cible calculée EST une valeur à comparer**, même si elle ne se
      compose pas par addition. Sans cette exception, tout pilote en pourcentage
      — Rêves de Dragons le premier — se serait vu reprocher de jeter « sous »
      quelque chose qu'il porte pourtant. *Un contrôle qui se trompe est pire
      qu'un contrôle absent.*
    */
    if (driver.jet && driver.jet.sens === 'sous-ou-egal'
        && (driver.jet.seuil ?? []).length === 0 && !driver.jet.cible) {
        erreur(
            'jet.sens',
            '« sous-ou-egal » compte les dés qui restent SOUS un seuil, mais aucun seuil n\'est ' +
            'composé depuis la fiche. Si le jeu compte les dés qui atteignent une valeur — « chaque ' +
            'six est une réussite » —, c\'est « superieur-ou-egal », et l\'inverse ne se verrait ' +
            'jamais en séance.',
        );
    }

    /*
      **Une mécanique de cible se NOMME, et le nom doit exister.**

      Le pilote vient d'un modèle de langage : il peut écrire « runequest » ou
      « percentile » avec l'aplomb de ce qui existe. Le panneau ne calculerait
      alors aucune cible et afficherait zéro — *un jet qui a l'air d'un jet.*
      C'est une erreur et non un avertissement : sans cible, le pilote n'a plus
      rien à comparer.
    */
    /*
      **La Table des Bonus de Torg** (2026-10-13) : un nom, comme la cible. Elle
      convertit le dé en bonus ajouté au NIVEAU — le seuil additionné — et compare
      le total à la difficulté. Sans l'un ou l'autre, le jet n'a rien à comparer.
    */
    if (driver.jet?.tableDeBonus !== undefined) {
        if (driver.jet.tableDeBonus !== 'torg') {
            erreur('jet.tableDeBonus', `« ${String(driver.jet.tableDeBonus)} » n'est pas une table connue. La seule admise est : torg.`);
        }
        if (!driver.jet.seuil?.length) {
            erreur('jet.seuil', 'La Table des Bonus ajoute son bonus au niveau : le jet doit déclarer les composantes qui le forment (attribut, compétence).');
        }
        if (!driver.jet.difficulte) {
            erreur('jet.difficulte', 'La Table des Bonus compare le total d’action au Niveau de Difficulté : le jet doit déclarer sa difficulté.');
        }
        for (const [cle, quoi] of [['blessures', 'Blessures'], ['possibilites', 'Possibilités']] as const) {
            const champ = driver.jet.torg?.[cle];
            if (champ && !tousLesChamps.has(champ)) {
                avertir(`jet.torg.${cle}`, `Les ${quoi} se lisent dans « ${champ} », absent de la fiche : elles resteront à zéro.`);
            }
        }
        const annulation = driver.jet.torg?.annulation;
        for (const champ of annulation ? [annulation.attribut, annulation.competence] : []) {
            if (!tousLesChamps.has(champ)) {
                avertir('jet.torg.annulation', `Le test d'Annulation lit « ${champ} », absent de la fiche : il partira d'un niveau trop bas.`);
            }
        }
    }

    /*
      **Le jet gardé** (Crimes, C1, 2026-10-22) : Potentiel GARDE Compétence. La
      réserve donne les dés, la compétence le nombre gardé ; le seuil se règle
      par dé. Un seuil additionné ou une difficulté posés à côté seraient des
      réglages morts — c'était le défaut du pilote de Crimes, qui lançait zéro dé.
    */
    const garde = driver.jet?.garde;
    if (garde) {
        if (!garde.competence) {
            erreur('jet.garde.competence', 'Le jet gardé lit sur la fiche combien de dés se gardent : il lui faut une compétence.');
        }
        const nombres = [garde.seuil, garde.competent ?? 1, garde.specialise ?? 2];
        if (!nombres.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0)) {
            erreur('jet.garde', 'Le seuil par dé et ce qu’en retirent compétence et spécialisation sont des nombres : 9, 1 et 2 chez Crimes.');
        }
        if (!driver.jet?.reserve?.composantes?.length) {
            erreur('jet.reserve.composantes', 'Le jet gardé lance autant de dés que le Potentiel : la réserve doit le lire sur la fiche.');
        }
        if (driver.jet?.seuil?.length || driver.jet?.difficulte) {
            avertir('jet.garde', 'Le jet gardé ne compose pas de seuil et ne compte pas de réussites contre une difficulté : retirer « jet.seuil » et « jet.difficulte ».');
        }
        // C6 : une table d'armes se nomme, comme la Table des Bonus ; le nom doit exister.
        if (garde.armes !== undefined && garde.armes !== 'crimes') {
            erreur('jet.garde.armes', `« ${String(garde.armes)} » n'est pas une table d'armes connue. La seule admise est : crimes.`);
        }
        // C2 et C3 : les marques et le compteur de dépassement sont des champs de la fiche.
        for (const [potentiel, marques] of Object.entries(garde.atteintes?.parPotentiel ?? {})) {
            const absents = [potentiel, marques.fatigue, marques.epuisement, marques.blessures].filter(c => !tousLesChamps.has(c));
            if (absents.length) {
                avertir('jet.garde.atteintes', `${potentiel} : ${absents.map(c => `« ${c} »`).join(', ')} absent${absents.length > 1 ? 's' : ''} de la fiche — ses marques ne compteront pas.`);
            }
        }
        if (garde.atteintes?.incapacite && !garde.atteintes.parPotentiel[garde.atteintes.incapacite]) {
            avertir('jet.garde.atteintes.incapacite', `« ${garde.atteintes.incapacite} » n'a pas de marques déclarées : l'incapacité ne se dira jamais.`);
        }
        if (garde.depassement) {
            if (!tousLesChamps.has(garde.depassement.champ)) {
                avertir('jet.garde.depassement', `Le dépassement se compte dans « ${garde.depassement.champ} », absent de la fiche : il resterait permis à chaque jet.`);
            }
            if (!garde.atteintes) {
                avertir('jet.garde.depassement', 'Le dépassement coûte une fatigue par réussite : sans « atteintes », il ne pourrait pas la noter.');
            }
        }
        for (const [competence, prefixe] of Object.entries(garde.specialisations?.parCompetence ?? {})) {
            if (!tousLesChamps.has(competence)) {
                avertir('jet.garde.specialisations', `« ${competence} » n'est pas un champ de la fiche : ses spécialisations ne seront jamais proposées.`);
            } else if (![...tousLesChamps].some(id => id.startsWith(prefixe))) {
                avertir('jet.garde.specialisations', `Aucune case de la fiche ne commence par « ${prefixe} » : la compétence « ${competence} » n'offrira aucune spécialisation.`);
            }
        }
        /*
          Les champs que lisent les circonstances, les compétences hermétiques, la
          psychologie, les munitions, les contacts, la fortune et la création
          (Crimes C0.1 à C8, 2026-10-23) : un champ absent ne casse rien, il se tait.
        */
        const lus: [string, string | undefined][] = [
            ['jet.garde.circonstances.angoisse', garde.circonstances?.angoisse],
            ...(garde.hermetiques ?? []).map(c => ['jet.garde.hermetiques', c] as [string, string]),
            ...Object.entries(garde.psychologie ?? {}).flatMap(([cle, v]) => (typeof v === 'string'
                ? [[`jet.garde.psychologie.${cle}`, v]] : [['jet.garde.psychologie.innocence', v.score], ['jet.garde.psychologie.innocence', v.seuil]]) as [string, string][]),
            ['jet.garde.munitions', garde.munitions],
            ...(garde.contacts ?? []).flatMap(c => [c.nom, c.loyaute, c.appels, c.influence].map(v => ['jet.garde.contacts', v] as [string, string | undefined])),
            ['jet.garde.fortune', garde.fortune?.niveau], ['jet.garde.fortune', garde.fortune?.jauge],
            ...(garde.creation?.potentiels ?? []).map(p => ['jet.garde.creation.potentiels', p] as [string, string]),
            ...Object.values(garde.creation?.temperament ?? {}).map(v => ['jet.garde.creation.temperament', v] as [string, string]),
            ['jet.garde.creation.age', garde.creation?.age], ['jet.garde.creation.developpement', garde.creation?.developpement],
        ];
        for (const [chemin, champ] of lus) {
            if (champ && !tousLesChamps.has(champ)) avertir(chemin, `« ${champ} » n'est pas un champ de la fiche : ce qu'il porte ne se lira pas.`);
        }
    }

    /*
      **Les styles d'enquêteur** (Crimes, C5, 2026-10-22) : deux champs de fiche
      chacun, le niveau et les points. Un champ absent : un style qui ne
      gagnerait jamais rien, ou n'ouvrirait aucun indice.
    */
    (driver.enquete?.styles ?? []).forEach((style, i) => {
        const absents = [style.niveau, style.points].filter(c => !tousLesChamps.has(c));
        if (absents.length) {
            avertir(`enquete.styles[${i}]`, `${style.label} : ${absents.map(c => `« ${c} »`).join(' et ')} absent${absents.length > 1 ? 's' : ''} de la fiche — ses points d'enquête ne se compteront pas.`);
        }
    });

    /*
      **Provoquer le destin** (NOC, 2026-10-13) : le Fiel est une réserve de table,
      les jauges de péril et les réserves du Héros des champs de sa fiche. Un nom
      qui ne désigne rien ferait un jet qui a l'air juste — sans Fiel, sans malus.
    */
    const destin = driver.jet?.destin;
    if (destin) {
        if (destin.singularite && !tousLesChamps.has(destin.singularite)) erreur('jet.destin.singularite', `Le bénéficiaire de Singularité n'a pas de champ « ${destin.singularite} » sur sa fiche.`);
        if (destin.desSurDixAuChoix && driver.dice?.engine === 'pool_explode') erreur('dice.engine', 'Les 10 sont au choix : utilisez pool, sinon le pupitre lance les dés supplémentaires avant le choix.');
        if (destin.fiel && !ressources.has(destin.fiel)) {
            erreur('jet.destin.fiel', `Les 1 doivent verser dans « ${destin.fiel} », qui n'est pas une réserve de table du jeu.`);
        }
        if (!driver.jet?.seuil?.length || !driver.jet?.reserve?.composantes?.length) {
            erreur('jet.destin', 'Provoquer le destin demande un niveau (« seuil » : le Talent) et un plafond de dés (« reserve.composantes » : le Domaine).');
        }
        const composantes = new Set([...(driver.jet?.seuil ?? []), ...(driver.jet?.reserve?.composantes ?? [])].map(c => c.id));
        (destin.peril ?? []).forEach((jauge, i) => {
            if (!tousLesChamps.has(jauge.champ)) {
                avertir(`jet.destin.peril[${i}].champ`, `La jauge de péril « ${jauge.label} » vise le champ « ${jauge.champ} », absent de la fiche : ses malus ne s'appliqueront jamais.`);
            }
            // Le Bouleversement administratif : un malus réservé aux jets du Domaine Statut.
            jauge.seuils.forEach((s, j) => {
                if (s.seulementSi && !composantes.has(s.seulementSi.composante)) {
                    erreur(`jet.destin.peril[${i}].seuils[${j}].seulementSi`, `« ${s.label} » ne vaut que pour la composante « ${s.seulementSi.composante} », que le jet ne déclare pas : il ne s'appliquera jamais.`);
                }
            });
        });
    }
    (driver.jet?.reservesDuPersonnage ?? []).forEach((reserve, i) => {
        if (reserve.parPointSelon && (!tousLesChamps.has(reserve.parPointSelon.champ) || !Number.isInteger(reserve.parPointSelon.aPartirDe) || reserve.parPointSelon.aPartirDe < 1)) {
            erreur(`jet.reservesDuPersonnage[${i}].parPointSelon`, 'Le rendement variable demande un Talent existant et un seuil entier positif.');
        }
        for (const stock of reserve.stocks ?? []) {
            if (!tousLesChamps.has(stock.champ)) {
                avertir(`jet.reservesDuPersonnage[${i}]`, `La réserve « ${reserve.label} » se lit dans « ${stock.champ} », absent de la fiche : elle restera à zéro.`);
            }
        }
        // Des degrés ajoutés à une cible que le jeu ne calcule pas : ils ne compteraient pour rien.
        if (reserve.effet === 'degres' && !driver.jet?.cible) {
            erreur(`jet.reservesDuPersonnage[${i}].effet`, `« ${reserve.label} » ajoute des degrés à la cible, mais le jet n'en calcule pas (« jet.cible ») : ils ne compteraient pour rien.`);
        }
        for (const section of reserve.si?.sections ?? []) {
            if (!idsDeSections.has(section)) avertir(`jet.reservesDuPersonnage[${i}].si.sections`, `« ${reserve.label} » ne sert qu'aux jets de la section « ${section} », absente de la fiche : elle ne sera jamais proposée.`);
        }
        for (const champ of reserve.si?.champs ?? []) {
            if (!tousLesChamps.has(champ)) avertir(`jet.reservesDuPersonnage[${i}].si.champs`, `« ${reserve.label} » ne sert qu'aux jets du champ « ${champ} », absent de la fiche : elle ne sera jamais proposée.`);
        }
    });

    /*
      **Forcer le jet** (Year Zero, 2026-10-14). Il relance une réserve ou des dés
      échelonnés, rien d'autre ; le Stress monté vit dans la seconde réserve ; les
      champs nommés doivent exister — sinon le forçage écrit dans le vide, ou une
      condition (« réplicant ») ne s'applique jamais.
    */
    const forcer = driver.jet?.forcer;
    if (forcer) {
        if (!driver.jet?.reserve && !driver.jet?.desEchelonnes) {
            erreur('jet.forcer', 'Forcer relance une réserve de dés ou des dés échelonnés : le jet ne déclare ni « reserve » ni « desEchelonnes ».');
        }
        if (forcer.garde !== 'reussites' && forcer.garde !== 'reussites-et-uns') {
            erreur('jet.forcer.garde', `« ${String(forcer.garde)} » n'est pas admis. Les seuls sont : reussites, reussites-et-uns.`);
        }
        if ((forcer.monteeDeLaSeconde || forcer.bloqueParLaSeconde) && !driver.jet?.reserve?.secondaire?.composantes?.length) {
            erreur('jet.forcer', 'Le forçage monte ou lit la seconde réserve (le Stress), mais « reserve.secondaire.composantes » ne dit pas où la lire.');
        }
        const composantes = new Set([
            ...(driver.jet?.reserve?.composantes ?? []), ...(driver.jet?.desEchelonnes?.composantes ?? []),
            ...(driver.jet?.seuil ?? []), ...(driver.jet?.reserve?.secondaire?.composantes ?? []),
        ].map(c => c.id));
        const conditions = [
            ...(forcer.foisSi ?? []).map((f, i) => [`jet.forcer.foisSi[${i}]`, f.si] as const),
            ...(forcer.interdit ?? []).map((f, i) => [`jet.forcer.interdit[${i}]`, f.si] as const),
            ...(forcer.prixDesUns?.si ?? []).map((f, i) => [`jet.forcer.prixDesUns.si[${i}]`, f.si] as const),
        ];
        for (const [chemin, si] of conditions) {
            if (si.champ && !tousLesChamps.has(si.champ)) {
                avertir(chemin, `La condition lit « ${si.champ} », absent de la fiche : elle ne s'appliquera jamais.`);
            }
            if (si.composante && !composantes.has(si.composante)) {
                avertir(chemin, `La condition lit la composante « ${si.composante} », que le jet ne déclare pas : elle ne s'appliquera jamais.`);
            }
        }
        for (const champ of [forcer.prixDesUns?.champ, ...(forcer.prixDesUns?.si ?? []).map(r => r.champ)]) {
            if (champ && !tousLesChamps.has(champ)) {
                erreur('jet.forcer.prixDesUns', `Le forçage se paie sur « ${champ} », absent de la fiche : il ne coûterait rien.`);
            }
        }
    }
    /*
      **La spécialisation** (2d20, 2026-10-14) : elle borne le critique par la
      valeur d'une composante du SEUIL. Une composante qui n'y est pas ne borne
      rien, et la case cochée ne changerait aucun dé.
    */
    const specialisation = driver.jet?.specialisation;
    if (specialisation && !(driver.jet?.seuil ?? []).some(c => c.id === specialisation.composante)) {
        erreur('jet.specialisation.composante', `La spécialisation lit la composante « ${specialisation.composante} », qui n'est pas dans « jet.seuil » : la case ne changerait aucun dé.`);
    }
    if (driver.jet?.cthulhuHack) {
        const ch=driver.jet.cthulhuHack;
        for(const champ of [ch.pv,ch.fortune,...ch.physique,...ch.personnalite,...ch.armures.flatMap(a=>[a.de,a.nom,a.protection])]) {
            if(!tousLesChamps.has(champ)) erreur('jet.cthulhuHack',`Le suivi Cthulhu Hack lit « ${champ} », absent de la fiche.`);
        }
        if(ch.physique.length!==3||ch.personnalite.length!==3||new Set([...ch.physique,...ch.personnalite]).size!==6) erreur('jet.cthulhuHack','Déclarer les trois Sauvegardes physiques et les trois de personnalité, sans doublon.');
        if(driver.jet.sens!=='sous-ou-egal'||facesLancees(driver)!==20) erreur('jet.cthulhuHack','Le suivi Cthulhu Hack exige une Sauvegarde au D20 sous le seuil.');
    }
    // Blade Runner (B3–B7, 2026-10-24) : le suivi des blessures lit ces champs, et lance des dés échelonnés.
    if (driver.jet?.bladeRunner) {
        const br = driver.jet.bladeRunner;
        for (const champ of [...br.endurance, ...br.assistanceMedicale, ...br.manipulation, br.sante, br.santeMax, br.sangFroid, br.sangFroidMax,
            ...[br.blessures, br.souvenirCle, br.objetFetiche].filter((c): c is string => !!c)]) {
            if (!tousLesChamps.has(champ)) erreur('jet.bladeRunner', `Le suivi Blade Runner lit « ${champ} », absent de la fiche.`);
        }
        if (!driver.jet.desEchelonnes) erreur('jet.bladeRunner', 'Le suivi Blade Runner lance des dés échelonnés : déclarer « jet.desEchelonnes ».');
    }
    if (driver.jet?.alien) {
        const alien = driver.jet.alien;
        if (!driver.jet.panique?.suites || driver.dice?.engine !== 'yze') erreur('jet.alien', 'Les jets Alien exigent le moteur YZE et les suites de Panique A1.');
        if (!driver.jet.reserve?.sansPlafond) erreur('jet.reserve.sansPlafond', 'Les bonus Alien ne doivent pas être perdus dans le plafond de la réserve.');
        if (!driver.jet.reserve?.composantes?.some(c => c.id === alien.competence)) erreur('jet.alien.competence', 'La composante de compétence est absente de la réserve.');
        for (const champ of [...Object.keys(alien.competences), ...Object.values(alien.equipement)]) {
            if (!tousLesChamps.has(champ)) erreur('jet.alien', `Les jets Alien lisent « ${champ} », absent de la fiche.`);
        }
        if (alien.combat) {
            const champsCombat=Object.entries(alien.combat).flatMap(([cle,v])=>cle==='actions'?[]:v&&typeof v==='object'?Object.values(v).flat():[v]);
            for (const champ of champsCombat) if (typeof champ!=='string'||!tousLesChamps.has(champ)) erreur('jet.alien.combat', `Le combat Alien lit « ${champ} », absent de la fiche.`);
            if(alien.combat.survie)for(const reserve of ['air','eau','nourriture','energie'])if(!driver.ressourcesDeTable?.some(r=>r.id===`alien-survie-${reserve}`))erreur('combat.alien.survie',`Réserve collective Alien absente : ${reserve}.`);
            if (JSON.stringify(alien.combat) !== JSON.stringify(driver.combat?.alien)) erreur('combat.alien', 'La fiche et le combat doivent partager la même configuration Alien.');
        }
    }
    if (driver.jet?.panique) {
        if (!driver.jet.reserve?.secondaire) {
            erreur('jet.panique', 'La Panique se déclenche sur un 1 de la seconde réserve, que le jet ne déclare pas.');
        }
        if (!(driver.jet.panique.faces > 1)) {
            erreur('jet.panique.faces', 'Le test de Panique doit nommer le dé qu’il lance (6 pour Alien).');
        }
        const champ = driver.jet.panique.champ;
        if (champ && !tousLesChamps.has(champ)) {
            erreur('jet.panique.champ', `La panique en cours se garde dans « ${champ} », absent de la fiche : le cumul ne se ferait jamais.`);
        }
        const suites = driver.jet.panique.suites;
        if (suites) {
            if (suites.mecanique !== 'alien') erreur('jet.panique.suites.mecanique', 'Mécanique de conséquences de Panique inconnue.');
            for (const [nom, field] of Object.entries(suites)) {
                if (nom !== 'mecanique' && field && !tousLesChamps.has(field)) erreur(`jet.panique.suites.${nom}`, `Le suivi de Panique lit « ${field} », absent de la fiche.`);
            }
            if (!champ) erreur('jet.panique.champ', 'Les conséquences de Panique exigent le champ qui garde la panique en cours.');
        }
    }
    /* Brisé (Blade Runner) : les champs qu'il lit et écrit doivent exister. */
    (driver.jet?.brise ?? []).forEach((b, i) => {
        for (const [quoi, champ] of [['champ', b.champ], ['de', b.de], ['perteDuMaximum', b.perteDuMaximum]] as const) {
            if (champ && !tousLesChamps.has(champ)) {
                avertir(`jet.brise[${i}].${quoi}`, `« ${b.label} » lit « ${champ} », absent de la fiche.`);
            }
        }
    });
    const reussiteDepensee = driver.jet?.reussiteDepensee;
    if (reussiteDepensee && !tousLesChamps.has(reussiteDepensee.champ)) {
        erreur('jet.reussiteDepensee.champ', `« ${reussiteDepensee.label} » se décompte dans « ${reussiteDepensee.champ} », absent de la fiche : le bouton n'aurait rien à dépenser.`);
    }
    const composantesDuDescripteur = new Set([
        ...(driver.jet?.seuil ?? []),
        ...(driver.jet?.reserve?.composantes ?? []),
        ...(driver.jet?.cible ? [driver.jet.cible.caracteristique, ...(driver.jet.cible.ajustement ?? [])] : []),
    ].filter(Boolean).map(c => c.id));
    // Les suites d'une maladresse ou d'un critique (Nephilim) : la jauge à monter, et ce qui la déclenche.
    (driver.jet?.suitesDesCritiques ?? []).forEach((suite, i) => {
        const ou = `jet.suitesDesCritiques[${i}]`;
        if (suite.quand !== 'maladresse' && suite.quand !== 'critique') {
            erreur(`${ou}.quand`, `« ${suite.label} » se déclenche sur « ${suite.quand} » : seules « maladresse » et « critique » existent.`);
        }
        if (suite.ajouter?.champ !== undefined && !tousLesChamps.has(suite.ajouter.champ)) {
            erreur(`${ou}.ajouter.champ`, `« ${suite.label} » s'inscrit dans « ${suite.ajouter.champ} », absent de la fiche : le bouton n'aurait rien à écrire.`);
        }
        if (suite.ajouter && suite.ajouter.champ === undefined && !suite.ajouter.composante) {
            erreur(`${ou}.ajouter`, `« ${suite.label} » ne dit ni le champ à écrire, ni la composante du jet qui le désigne.`);
        }
        if (suite.ajouter?.composante && !composantesDuDescripteur.has(suite.ajouter.composante)) {
            erreur(`${ou}.ajouter.composante`, `« ${suite.label} » écrit dans le champ retenu pour « ${suite.ajouter.composante} », que le jet ne déclare pas : le bouton ne paraîtra jamais.`);
        }
        for (const section of suite.sections ?? []) {
            if (!idsDeSections.has(section)) avertir(`${ou}.sections`, `« ${suite.label} » vise la section « ${section} », absente de la fiche : aucun jet n'en viendra.`);
        }
        for (const champ of suite.champs ?? []) {
            if (!tousLesChamps.has(champ)) avertir(`${ou}.champs`, `« ${suite.label} » vise le champ « ${champ} », absent de la fiche : aucun jet n'en viendra.`);
        }
    });
    // Ce que le jet consomme (les Materiae Primae de Nephilim) : une composante, une jauge par élément.
    const consommation = driver.jet?.consommation;
    if (consommation) {
        if (!composantesDuDescripteur.has(consommation.composante)) {
            erreur('jet.consommation.composante', `« ${consommation.label} » se mesure sur la composante « ${consommation.composante} », que le jet ne déclare pas : rien ne sera consommé.`);
        }
        try { new RegExp(consommation.elementSur?.remplacer ?? ''); } catch {
            erreur('jet.consommation.elementSur', `« ${consommation.label} » : « ${consommation.elementSur?.remplacer} » n'est pas une expression valable.`);
        }
        try { new RegExp(consommation.elementSecondSur?.remplacer ?? ''); } catch {
            erreur('jet.consommation.elementSecondSur', `« ${consommation.label} » : « ${consommation.elementSecondSur?.remplacer} » n'est pas une expression valable.`);
        }
        for (const [element, champ] of Object.entries(consommation.champs ?? {})) {
            if (!tousLesChamps.has(champ)) erreur('jet.consommation.champs', `« ${consommation.label} » ${element} se retire de « ${champ} », absent de la fiche.`);
        }
    }
    // Nephilim jusqu'au bout (2026-10-23) : chaque champ, section, composante et réserve que `jet.nephilim` nomme.
    const neph = driver.jet?.nephilim;
    if (neph) {
        if (driver.jet?.cible?.mecanique !== 'nephilim') {
            avertir('jet.nephilim', 'Le bloc Nephilim ne sert qu’avec la cible de mécanique « nephilim » : il sera ignoré.');
        }
        const pistes = [['physique', neph.sante?.physique], ['magique', neph.sante?.magique]] as const;
        const champsNommes: [string, string | undefined][] = [
            ['kaDominant.choix', neph.kaDominant?.choix], ['kaDominant.degre', neph.kaDominant?.degre], ['kaTerre', neph.kaTerre],
            ...Object.entries(neph.pentacle ?? {}).map(([k, v]) => [`pentacle.${k}`, v] as [string, string]),
            ['sapience', neph.sapience], ['stase', neph.stase], ['vecuContemporain', neph.vecuContemporain],
            ['chutes.khaiba', neph.chutes?.khaiba], ['chutes.ombre', neph.chutes?.ombre], ['chutes.narcose', neph.chutes?.narcose],
            ['chutes.forme', neph.chutes?.forme], ['chutes.sapienceDeChute', neph.chutes?.sapienceDeChute],
            ...Object.entries(neph.chutes?.misesEnJeu ?? {}).map(([k, v]) => [`chutes.misesEnJeu.${k}`, v] as [string, string]),
            ['metamorphe.degre', neph.metamorphe?.degre], ['metamorphe.visibles', neph.metamorphe?.visibles],
            ...(neph.metamorphe?.permanentes ?? []).map(c => ['metamorphe.permanentes', c] as [string, string]),
            ['pacte.ordonnances', neph.pacte?.ordonnances],
            ...Object.entries(neph.alchimie?.assemblage ?? {}).map(([k, v]) => [`alchimie.assemblage.${k}`, v] as [string, string]),
            ...Object.keys(neph.alchimie?.oeuvres ?? {}).map(k => [`alchimie.oeuvres`, k] as [string, string]),
            ...pistes.flatMap(([nom, p]) => [
                ...(p?.cases ?? []).map(c => [`sante.${nom}.cases`, c.champ] as [string, string]),
                ...(p?.consequences ?? []).map(c => [`sante.${nom}.consequences`, c.champ] as [string, string]),
                [`sante.${nom}.compte`, p?.compte] as [string, string | undefined],
            ]),
        ];
        for (const [ou, champ] of champsNommes) {
            if (champ && !tousLesChamps.has(champ)) erreur(`jet.nephilim.${ou}`, `Nephilim lit « ${champ} », absent de la fiche.`);
        }
        for (const [ou, liste] of [['arts.magie', neph.arts?.magie], ['arts.kabbale', neph.arts?.kabbale], ['arts.alchimie', neph.arts?.alchimie], ['vecusPasses', neph.vecusPasses]] as const) {
            for (const section of liste ?? []) {
                if (!idsDeSections.has(section)) avertir(`jet.nephilim.${ou}`, `Nephilim range la section « ${section} », absente de la fiche : aucun jet n’en viendra.`);
            }
        }
        for (const [nom, id] of Object.entries(neph.composantes ?? {})) {
            if (id && !composantesDuDescripteur.has(id)) erreur(`jet.nephilim.composantes.${nom}`, `Nephilim lit la composante « ${id} », que le jet ne déclare pas.`);
        }
        for (const [nom, id] of Object.entries(neph.table ?? {})) {
            if (id && !ressources.has(id)) erreur(`jet.nephilim.table.${nom}`, `Nephilim lit la réserve de table « ${id} », que le pilote ne déclare pas.`);
        }
        for (const [ou, motif] of [['pacte.motif', neph.pacte?.motif], ['alchimie.secondElement.remplacer', neph.alchimie?.secondElement?.remplacer]] as const) {
            if (!motif) continue;
            try { new RegExp(motif); } catch { erreur(`jet.nephilim.${ou}`, `« ${motif} » n'est pas une expression valable.`); }
        }
    }
    // Symbaroum jusqu'au bout (2026-10-23) : chaque champ que `jet.symbaroum` nomme, et le jet qu'il suppose.
    const symb = driver.jet?.symbaroum;
    if (symb) {
        if (driver.jet?.sens !== 'sous-ou-egal' || driver.jet?.cible || facesLancees(driver) !== 20) {
            avertir('jet.symbaroum', 'Le bloc Symbaroum suppose un d20 sous un Attribut additionné (p. 103) : il sera ignoré.');
        }
        const champsNommes: [string, string | undefined][] = [
            ...(symb.attributs ?? []).map(c => ['attributs', c] as [string, string]),
            ['force', symb.force], ['volonte', symb.volonte], ['agilite', symb.agilite],
            ['endurance.courante', symb.endurance?.courante], ['endurance.maximum', symb.endurance?.maximum],
            ['douleur', symb.douleur], ['defense', symb.defense], ['seuilDeCorruption', symb.seuilDeCorruption],
            ['corruption.temporaire', symb.corruption?.temporaire], ['corruption.permanente', symb.corruption?.permanente],
            ...(symb.armes ?? []).flatMap(a => [['armes.nom', a.nom], ['armes.degats', a.degats], ['armes.qualites', a.qualites]] as [string, string | undefined][]),
            ...(symb.armures ?? []).flatMap(a => [['armures.nom', a.nom], ['armures.protection', a.protection], ['armures.qualites', a.qualites]] as [string, string | undefined][]),
            ['experience.total', symb.experience?.total], ['experience.disponible', symb.experience?.disponible],
            ...(symb.talents ?? []).flatMap(t => [['talents.nom', t.nom], ['talents.niveau', t.niveau]] as [string, string][]),
            ['argent.champ', symb.argent?.champ], ['argent.ecrit', symb.argent?.ecrit],
        ];
        for (const [ou, champ] of champsNommes) {
            if (champ && !tousLesChamps.has(champ)) erreur(`jet.symbaroum.${ou}`, `Symbaroum lit « ${champ} », absent de la fiche.`);
        }
        /*
          La Défense se jette depuis la fiche (p. 164) : la composante du jet doit
          pouvoir la retenir, sinon le parcours de Défense reste muet.
        */
        if (symb.defense && tousLesChamps.has(symb.defense)) {
            const section = sections.find(sec => champsParSection.get(sec.id)?.has(symb.defense!))?.id;
            const atteinte = (driver.jet?.seuil ?? []).some(c => {
                if (![c.sectionId, ...(c.sectionsSupplementaires ?? [])].includes(section ?? '')) return false;
                try { return !c.motif || new RegExp(c.motif).test(symb.defense!); } catch { return false; }
            });
            if (!atteinte) avertir('jet.symbaroum.defense', `La Défense « ${symb.defense} » ne se choisit pas dans le jet : ajouter sa section aux composantes du seuil.`);
        }
    }
    /*
      Barbarians of Lemuria (2026-10-27) : la somme de 2d6 et du seuil composé contre 9.
      Une difficulté en réussites ou un seuil déplaçable n'y ont pas de sens — le pilote
      forgé déclarait les deux, et chaque jet réussissait d'office.
    */
    const bol = driver.jet?.barbarians;
    if (bol) {
        if (driver.jet?.sens !== 'superieur-ou-egal' || driver.jet?.cible || facesLancees(driver) !== 6 || !(driver.jet?.seuil ?? []).length) {
            avertir('jet.barbarians', 'Le bloc Barbarians suppose des d6 additionnés à un seuil composé (p. 10) : déclarer « seuil » et « sens: superieur-ou-egal ».');
        }
        if (driver.jet?.difficulte) avertir('jet.difficulte', 'Barbarians compare une somme à 9 : la difficulté en réussites est ignorée, la difficulté du livre se règle au jet (p. 57).');
        if (driver.jet?.modificateurDuSeuil) avertir('jet.modificateurDuSeuil', 'Barbarians règle la difficulté au jet (p. 57) : ce modificateur est ignoré.');
        if (bol.heroisme && !tousLesChamps.has(bol.heroisme)) erreur('jet.barbarians.heroisme', `Barbarians lit les points d'héroïsme dans « ${bol.heroisme} », absent de la fiche.`);
    }
    /*
      RuneQuest (2026-10-30) : un d100 sous l'aptitude retenue, gradué sur les chances
      modifiées. Une seule composante, puisque l'aptitude EST le score ; les
      caractéristiques et les localisations nommées doivent exister sur la fiche.
    */
    const rq = driver.jet?.runequest;
    if (rq) {
        if (driver.jet?.sens !== 'sous-ou-egal' || driver.jet?.cible || facesLancees(driver) !== 100) {
            avertir('jet.runequest', 'Le bloc RuneQuest suppose un d100 sous l’aptitude (p. 142) : déclarer « sens: sous-ou-egal », sans cible.');
        }
        if ((driver.jet?.seuil ?? []).length !== 1) {
            avertir('jet.seuil', 'RuneQuest lance une aptitude à la fois — compétence, Rune, Passion ou caractéristique (p. 141) : le seuil doit avoir une seule composante.');
        }
        if (driver.jet?.difficulte) avertir('jet.difficulte', 'RuneQuest ne compte pas de réussites : la difficulté se règle en pourcentage au jet (p. 142).');
        if (driver.jet?.modificateurDuSeuil) avertir('jet.modificateurDuSeuil', 'RuneQuest règle la situation au jet, en pourcentage : ce modificateur est ignoré.');
        for (const champ of rq.caracteristiques ?? []) {
            if (!tousLesChamps.has(champ)) erreur('jet.runequest.caracteristiques', `RuneQuest teste la caractéristique « ${champ} », absente de la fiche.`);
        }
        for (const [zone, champ] of Object.entries(rq.localisations ?? {})) {
            if (champ && !tousLesChamps.has(champ)) erreur('jet.runequest.localisations', `La localisation ${zone} lit ses points de vie dans « ${champ} », absent de la fiche.`);
        }
    }
    // Star Trek jusqu'au bout (2026-10-23) : chaque champ que `jet.starTrek` nomme, et le 2d20 qu'il suppose.
    const st = driver.jet?.starTrek;
    if (st) {
        if (driver.jet?.sens !== 'sous-ou-egal' || driver.jet?.cible || facesLancees(driver) !== 20) {
            avertir('jet.starTrek', 'Le bloc Star Trek suppose des d20 sous un attribut + une fonction (p. 257) : il sera ignoré.');
        }
        const nommes: [string, string | undefined][] = [
            ...(st.attributs ?? []).map(c => ['attributs', c] as [string, string]),
            ...(st.fonctions ?? []).map(c => ['fonctions', c] as [string, string]),
            ['forme', st.forme], ['stress.courant', st.stress?.courant], ['stress.maximum', st.stress?.maximum],
            ['protection', st.protection], ['determination', st.determination], ['reputation', st.reputation],
        ];
        for (const [ou, champ] of nommes) {
            if (champ && !tousLesChamps.has(champ)) erreur(`jet.starTrek.${ou}`, `Star Trek lit « ${champ} », absent de la fiche.`);
        }
        if (st.stress && !st.forme && !st.stress.maximum) avertir('jet.starTrek.forme', 'Sans Forme ni maximum écrit, le Stress n’a pas de plafond (p. 277).');
    }
    // Dune, 25/10/2026 : l'export conserve ses clés ; une référence absente ne doit jamais se taire.
    const dune = driver.jet?.dune;
    if (dune) {
        if (driver.jet?.sens !== 'sous-ou-egal' || driver.jet?.cible || facesLancees(driver) !== 20) erreur('jet.dune', 'Dune exige une réserve de d20 sous Compétence + Principe.');
        for (const champ of [...(dune.competences ?? []), ...(dune.principes ?? []), dune.determination, dune.progression, dune.specialisations, dune.talents, dune.traits, dune.atouts]) {
            if (!champ || !tousLesChamps.has(champ)) erreur('jet.dune', `Dune lit « ${champ ?? '(absent)'} », absent de la fiche.`);
        }
        if (dune.competences?.length !== 5 || dune.principes?.length !== 5) erreur('jet.dune', 'Dune doit désigner cinq compétences et cinq principes.');
    }
    // Les départages de l'initiative (Symbaroum, S6) : des formules sur des champs de la fiche.
    for (const formule of driver.combat?.departages ?? []) {
        for (const champ of champsInvoques(formule)) {
            if (!champInvoque(champ)) erreur('combat.departages', `Le départage « ${formule} » invoque « ${champ} », qui n'est un champ d'aucune section.`);
        }
    }
    // Une composante filtrée par un motif : il doit être une expression valable.
    for (const composante of [...(driver.jet?.seuil ?? []), ...(driver.jet?.cible ? [driver.jet.cible.caracteristique, ...(driver.jet.cible.ajustement ?? [])] : [])]) {
        if (!composante?.motif) continue;
        try { new RegExp(composante.motif); } catch {
            erreur(`jet.${composante.id}.motif`, `« ${composante.label} » : le motif « ${composante.motif} » n'est pas une expression valable — le menu resterait vide.`);
        }
    }
    // Le stress subi de Blade Runner : un champ qui encaisse, et des dés lus sur la fiche.
    const stress = driver.jet?.stressSubi;
    if (stress) {
        if (!tousLesChamps.has(stress.champ)) {
            erreur('jet.stressSubi.champ', `Le stress se retire de « ${stress.champ} », absent de la fiche : le geste n'aurait rien à écrire.`);
        }
        if (!stress.jet?.length) {
            erreur('jet.stressSubi.jet', 'Le stress subi nomme les dés de la fiche qui le réduisent (l’Empathie et la Psychologie).');
        }
        for (const champ of stress.jet ?? []) {
            if (!tousLesChamps.has(champ)) avertir('jet.stressSubi.jet', `Le stress se réduit avec « ${champ} », absent de la fiche : ce dé ne sera pas lancé.`);
        }
    }
    // Relancer un D10/D12 à une réussite n'a de sens qu'avec des dés échelonnés.
    if (driver.jet?.forcer?.relancerUneReussite && !driver.jet.desEchelonnes) {
        avertir('jet.forcer.relancerUneReussite', 'Relancer un dé à une seule réussite ne vaut que pour des dés échelonnés (D10, D12) : sans eux, l’option ne paraîtra jamais.');
    }

    // La Fortune de Cthulhu Hack : des jetons placés sur la fiche, jamais plus que le maximum.
    const fortune = driver.jet?.fortune;
    if (fortune) {
        const nom = fortune.label ?? 'Fortune';
        if (!tousLesChamps.has(fortune.champ)) {
            erreur('jet.fortune.champ', `« ${nom} » se place dans « ${fortune.champ} », absent de la fiche : les boutons n'auraient rien à compter.`);
        }
        const entiers = [fortune.max, fortune.relance, fortune.reussite].every(n => Number.isInteger(n) && n > 0);
        if (!entiers) {
            erreur('jet.fortune', `« ${nom} » : le maximum, le prix de la relance et celui de la réussite sont des nombres entiers positifs.`);
        } else if (fortune.relance > fortune.max || fortune.reussite > fortune.max) {
            avertir('jet.fortune', `« ${nom} » coûte plus que son maximum : un des deux boutons ne s'offrira jamais.`);
        }
    }

    if (driver.jet?.cible && !(driver.jet.cible.mecanique in MECANIQUES_DE_CIBLE)) {
        erreur(
            'jet.cible.mecanique',
            `« ${driver.jet.cible.mecanique} » n'est pas une mécanique connue. Les seules ` +
            `admises sont : ${Object.keys(MECANIQUES_DE_CIBLE).join(', ')}. Une mécanique porte ` +
            'une table transcrite d\'un livre ; elle ne s\'invente pas depuis un nom.',
        );
    }

    /*
      **Une cible sans caractéristique ne calcule rien.**

      Relevé le 2026-08-22, à la première dérivation qui ait produit une cible :
      le pilote portait `jet.cible` avec sa mécanique et son ajustement, et
      AUCUNE caractéristique — l'ordonnée de la table. Le panneau aurait lu zéro,
      multiplié zéro, et annoncé 0 % de chances sur chaque jet. *Un pourcentage
      faux ne se plaint de rien.*

      C'est une erreur et non un avertissement : sans ordonnée, la mécanique n'a
      littéralement rien à croiser.
    */
    if (driver.jet?.cible && !driver.jet.cible.caracteristique?.sectionId) {
        erreur(
            'jet.cible.caracteristique',
            'La cible se calcule en croisant une caractéristique et un ajustement, et le pilote '
            + 'ne dit pas où lire la caractéristique. Le jet vaudrait zéro pour cent, quel que '
            + 'soit le personnage.',
        );
    }

    /*
      **Les deux façons de dire la cible ne cohabitent pas.** Elles répondent à
      la même question, et le panneau fait gagner la mécanique — donc un seuil
      déclaré à côté serait un travail perdu, silencieusement. On avertit plutôt
      qu'on interdit : le pilote reste jouable, et c'est la revue qui tranche.
    */
    if (driver.jet?.cible && (driver.jet.seuil ?? []).length > 0) {
        avertir(
            'jet.seuil',
            'Le pilote déclare une cible calculée ET un seuil additionné. C\'est la cible qui ' +
            'décide, et le seuil ne sera jamais lu : si le jeu croise ses valeurs sur une table, ' +
            'vide « jet.seuil » ; s\'il les additionne, retire « jet.cible ».',
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

    /*
      Les dés échelonnés n'ont pas de faces de moteur : chaque dé prend celles
      de sa lettre sur la fiche. Comparer `yze` (d6) à la réserve d'un tel
      pilote reprochait une incohérence qui ne se lance nulle part (2026-10-13).
    */
    const facesAttendues = moteur && !driver.jet?.desEchelonnes ? FACES_DU_MOTEUR[moteur] : undefined;
    const facesObservees = facesLancees(driver);
    if (facesAttendues !== undefined && facesObservees !== undefined
        && facesObservees !== facesAttendues) {
        erreur(
            'dice.engine',
            `Le moteur « ${moteur} » lance des dés à ${facesAttendues} faces, mais le jet en ` +
            `compose à ${facesObservees}. L'un des deux est recopié de l'exemple.`,
        );
    }

    /*
      **Une Sauvegarde se lance SOUS la caractéristique**, par définition
      (2026-09-30). Un pilote qui la dit « supérieur ou égal » se contredit : le
      pupitre suivrait le moteur, la fiche suivrait le sens, et les deux
      rendraient des verdicts inverses sur le même jet.
    */
    if (moteur === 'sauvegarde' && driver.jet?.sens === 'superieur-ou-egal') {
        erreur(
            'jet.sens',
            'Le moteur « sauvegarde » lance un d20 SOUS la caractéristique, mais le jet est déclaré '
            + '« superieur-ou-egal ». Le sens doit valoir « sous-ou-egal ».',
        );
    }

    if (driver.jet?.reserve && driver.jet.reserve.max < 1) {
        /*
          **Une réserve vide ne veut pas dire la même chose partout.**

          *Relevé sur la revue de David le 2026-08-29.* Un jeu à dés échelonnés
          n'a pas de réserve : sa poignée vient des composantes, une par dé. Une
          réserve à zéro y est un **champ mort**, pas une panne — et lui dire
          « le panneau n'aurait rien à lancer » est faux, il a exactement ses
          deux dés. *Un contrôle qui se trompe est pire qu'un contrôle absent* :
          il envoie corriger ce qui marche.
        */
        avertir(
            'jet.reserve',
            driver.jet.desEchelonnes
                ? 'Réserve vide à côté de dés échelonnés : ces jeux n\'ont pas de réserve, leur '
                  + 'poignée vient des composantes. Le jet fonctionne ; retirer « jet.reserve » '
                  + 'évite un champ mort — et un champ mort qu\'on laisse finit par être rempli.'
                : `Réserve de ${driver.jet.reserve.base} à ${driver.jet.reserve.max} dés : le panneau de `
                  + 'jet n\'aurait rien à lancer.',
        );
    }

    /*
      **Aucune voie de résolution : le panneau ne saura pas quoi faire.**

      Les trois voies — additionner un seuil, croiser une table, lancer des dés
      échelonnés — plus la réserve pure d'Alien : un pilote qui n'en déclare
      aucune n'a rien à lancer, et l'écran le montrera vide sans dire pourquoi.
      *C'est le contrôle qui manquait pour répondre « la dérivation a-t-elle
      pris ? » d'un coup d'œil, au lieu d'ouvrir une fiche de personnage.*
    */
    if (driver.jet && !driver.jet.seuil?.length && !driver.jet.cible
        && !driver.jet.desEchelonnes && !driver.jet.reserve) {
        erreur(
            'jet',
            'Ce pilote ne dit pas COMMENT un jet se résout : ni seuil additionné, ni cible '
            + 'calculée, ni dés échelonnés, ni réserve. Le panneau de jet n\'aura rien à composer.',
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
        /*
          **La cible calculée hérite des deux contrôles, et ce n'est pas un
          hasard.** Son ajustement se lit sur la fiche exactement comme un
          seuil : il peut désigner une section absente, et il peut en désigner
          douze fois la même — ce qui est précisément le défaut sorti de la
          dérivation de Rêves de Dragons, « Compétence 1 » à « Compétence 12 ».
          Verser la liste ici plutôt que d'écrire un contrôle jumeau, c'est
          garantir qu'ils ne divergeront pas.
        */
        ['jet.cible.caracteristique', driver.jet?.cible?.caracteristique ? [driver.jet.cible.caracteristique] : []],
        ['jet.cible.ajustement', driver.jet?.cible?.ajustement],
        // Même contrôle sur la réserve depuis le 2026-08-15 : elle se compose
        // désormais depuis la fiche, donc elle peut la manquer de la même façon.
        ['jet.reserve.composantes', driver.jet?.reserve?.composantes],
        // La seconde poule — les dés de stress d'Alien — se lit sur la fiche
        // comme les autres, donc elle peut la manquer comme les autres.
        ['jet.reserve.secondaire.composantes', driver.jet?.reserve?.secondaire?.composantes],
        // La compétence d'un jet gardé (Crimes) se retient sur la fiche, comme les autres.
        ['jet.garde.competence', driver.jet?.garde?.competence ? [driver.jet.garde.competence] : []],
    ];
    composantesDuJet.forEach(([ou, liste]) => (liste ?? []).forEach((composante, i) => {
        /*
          **Une entrée peut être vide, ou n'être pas une composante du tout.**
          Le type promet un objet avec un `sectionId` ; le pilote vient d'un
          modèle de langage, et le 2026-08-22 il a rendu une cible sans
          caractéristique. `undefined.sectionId` a fait tomber TOUTE la Revue du
          Pilote — *l'écran qui existe pour signaler ce genre de défaut, mis hors
          service par le défaut qu'il devait nommer.*

          On le dit et on continue : les autres constats de la revue valent
          toujours, et c'est justement quand un pilote est mauvais qu'on a le
          plus besoin de les lire.
        */
        if (!composante || typeof composante !== 'object' || !composante.sectionId) {
            erreur(
                `${ou}[${i}]`,
                'Cette entrée ne désigne aucune section de la fiche : le panneau de jet ne pourrait '
                + 'rien proposer au joueur. Elle se retire, ou elle se complète.',
            );
            return;
        }
        /*
          **Chaque section déclarée se vérifie, pas seulement la première.**
          Depuis le 2026-08-23 une composante peut nommer plusieurs sous-groupes
          — chez Rêves de Dragons les compétences y sont découpées. Ne contrôler
          que `sectionId` laisserait un sous-groupe fantôme passer sans un mot :
          le menu serait simplement plus court, et *un menu plus court qu'il ne
          devrait est indiscernable d'un menu complet.*
        */
        (composante.sectionsSupplementaires ?? []).forEach((nom, j) => {
            if (!nom) {
                erreur(
                    `${ou}[${i}].sectionsSupplementaires[${j}]`,
                    "Cette entrée supplémentaire est vide : elle ne désigne aucun sous-groupe. "
                    + 'Elle se retire, ou elle se nomme.',
                );
                return;
            }
            if (idsDeSections.has(nom)) return;
            const trouvee = sectionDeLaComposante(
                sections as SheetSection[], { ...composante, sectionId: nom, label: nom },
            ).section;
            erreur(
                `${ou}[${i}].sectionsSupplementaires[${j}]`,
                `« ${nom} » n'est pas une section de la fiche : ce sous-groupe de `
                + `« ${composante.label} » n'apparaîtra pas dans le menu du joueur.`
                + (trouvee
                    ? ` La fiche nomme « ${trouvee.label || trouvee.id} » (${trouvee.id}) — c'est sans doute elle.`
                    : ' Aucune section ne lui ressemble.'),
            );
        });

        if (idsDeSections.has(composante.sectionId)) return;

        const { section } = sectionDeLaComposante(sections as SheetSection[], composante);
        erreur(
            `${ou}[${i}].sectionId`,
            /*
              **Le label se cite, il ne se décline pas.** Le message écrivait
              « nulle part où choisir sa » suivi du label en minuscules, ce qui
              donnait *« nulle part où choisir sa état général »* sur Rêves de
              Dragons le 2026-08-21. Un accord grammatical demande un genre que
              rien ici ne connaît ; le citer entre guillemets n'en demande aucun,
              et rend au passage le label tel que le pilote le porte.
            */
            `« ${composante.sectionId} » n'est pas une section de la fiche : le joueur n'aurait `
            + `nulle part où choisir « ${composante.label} ».`
            + (section
                ? ` La fiche nomme « ${section.label || section.id} » (${section.id}) — c'est `
                  + 'sans doute elle.'
                /*
                  **Quand RIEN ne ressemble, le remède n'est pas de chercher
                  mieux : c'est souvent qu'il ne fallait pas d'entrée du tout.**

                  Relevé sur Rêves de Dragons le 2026-08-21. Le modèle a créé une
                  composante « Les difficultés » et une « Fonctionnement » —
                  deux titres de chapitre du livre — parce que la règle du jeu
                  fait bel et bien s'ajouter une difficulté et un malus d'état
                  général. Ce sont des valeurs qui s'additionnent, mais **aucune
                  des deux ne se lit sur la fiche du joueur** : la difficulté est
                  fixée par le meneur (`jet.difficulte`), le malus se calcule sur
                  les jauges. Sans cette phrase, le meneur part chercher une
                  section qui n'a aucune raison d'exister.
                */
                : ' Aucune section ne lui ressemble. Si cette valeur ne se lit pas sur la fiche '
                  + "du joueur — une difficulté que le meneur fixe, un malus qui se calcule —, "
                  + "c'est l'entrée elle-même qui est de trop."),
        );
    }));

    /*
      **Plusieurs composantes sur la MÊME section : une somme là où le jeu
      offre un choix.**

      Relevé sur Cthulhu Hack le 2026-08-17, et c'est l'invite qui l'avait
      commandé — elle exigeait que les six Sauvegardes figurent dans
      `jet.seuil`. Or une composante est un TERME D'UNE SOMME, et l'alternative
      se joue dans sa section : *« le joueur retient un champ de cette
      section »*. Les six y étaient donc additionnées — le panneau réclamait les
      six menus, `LANCER` restait mort, et un joueur patient aurait obtenu un
      seuil de 60 pour un d20.

      Deux termes pris sur la même section restent concevables — un jeu peut
      demander la somme de deux attributs — donc on avertit, on n'interdit pas.
      *Un contrôle qui se trompe est pire qu'un contrôle absent.*

      Le vrai signe, c'est la répétition : deux composantes visant la même
      section décrivent presque toujours des valeurs entre lesquelles on
      choisit, jamais des valeurs qu'on ajoute.
    */
    composantesDuJet.forEach(([ou, liste]) => {
        const parSection = new Map<string, string[]>();
        for (const composante of liste ?? []) {
            // Même garde que la boucle précédente, et pour la même raison : une
            // entrée peut être vide. Elle y est déjà signalée — ici, on passe.
            if (!composante?.sectionId) continue;
            /*
              **Toutes les sections déclarées comptent, pas seulement la
              principale.** Deux composantes qui se recouvrent sur un
              sous-groupe portent exactement le même défaut : le joueur pourrait
              y prendre deux fois la même compétence, et elles s'ADDITIONNENT.
            */
            const declarees = [composante.sectionId, ...(composante.sectionsSupplementaires ?? [])];
            for (const nom of new Set(declarees.filter(Boolean))) {
                parSection.set(nom, [...(parSection.get(nom) ?? []), composante.label || composante.id]);
            }
        }
        for (const [sectionId, labels] of parSection) {
            if (labels.length < 2) continue;
            const nom = sections.find(s => s.id === sectionId)?.label || sectionId;
            avertir(
                ou,
                `${labels.length} composantes lisent la même section « ${nom} » — ` +
                `${labels.join(', ')} — et elles s'ADDITIONNENT. Si le joueur n'en jette qu'une à ` +
                'la fois, il en faut UNE SEULE : c\'est la section qui offre le choix, et le menu ' +
                'proposera tous ses champs. Six Sauvegardes additionnées donneraient un seuil que ' +
                'le jeu n\'a jamais eu, et le panneau exigerait les six avant de lancer.',
            );
        }
    });

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

    const modeDInitiative = typeof driver.combat?.initiative === 'object' ? driver.combat.initiative?.mode : undefined;
    if (modeDInitiative !== undefined && !['formule', 'alternance', 'paquet', 'phases'].includes(modeDInitiative)) {
        erreur('combat.initiative.mode', `« ${String(modeDInitiative)} » n'est pas un ordre d'action connu : formule, alternance (Dune), paquet (Torg) ou phases (Rêve de Dragon).`);
    }
    // Torg : Inspiration et Fatigués de la carte d'Action ajoutent ou retirent du Choc.
    if (modeDInitiative === 'paquet' && !driver.combat?.dommages?.choc) {
        avertir('combat.initiative.mode', "Le Paquet d'Action applique Inspiration et Fatigués au Choc, mais le pilote ne déclare pas où il vit (`combat.dommages.choc`) : ces deux boutons ne feront rien.");
    }

    // Torg : la main de Cartes du Destin que « Fin de scène » complète.
    const mainDuDestin = driver.cartesDuDestin;
    if (mainDuDestin !== undefined && !(Number.isInteger(mainDuDestin?.taille) && mainDuDestin.taille > 0)) {
        erreur('cartesDuDestin.taille', `« ${String(mainDuDestin?.taille)} » n'est pas une taille de main : un entier positif (4 chez Torg, 5 sous la Loi de l'Héroïsme).`);
    }

    /*
      **Les cosms et leurs Lois** (Torg, 2026-10-14). Un identifiant sert de clé
      à la scène et à la campagne : deux pareils, et l'un des deux ne se choisit
      plus. Une mécanique se NOMME dans une liste fermée ; la Loi de la Magie dit
      quelles compétences elle touche, et où s'écrit le Choc.
    */
    const MECANIQUES_DE_LOI = ['heroisme', 'action', 'perseverance', 'magie', 'tenacite', 'souffrance'];
    const vus = new Set<string>();
    (driver.cosms ?? []).forEach((cosm, i) => {
        if (!cosm.id || vus.has(cosm.id)) erreur(`cosms[${i}].id`, `« ${cosm.id} » : chaque cosm a un identifiant, et un seul cosm le porte.`);
        vus.add(cosm.id);
        (cosm.lois ?? []).forEach((loi, j) => {
            const ou = `cosms[${i}].lois[${j}]`;
            if (loi.mecanique !== undefined && !MECANIQUES_DE_LOI.includes(loi.mecanique)) {
                erreur(`${ou}.mecanique`, `« ${String(loi.mecanique)} » n'est pas une mécanique connue. Les seules sont : ${MECANIQUES_DE_LOI.join(', ')}.`);
            }
            if (loi.mecanique === 'magie') {
                if (!loi.competences?.length) erreur(`${ou}.competences`, 'La Loi de la Magie doit nommer les compétences magiques de la fiche.');
                for (const champ of loi.competences ?? []) {
                    if (!tousLesChamps.has(champ)) avertir(`${ou}.competences`, `« ${champ} » est absent de la fiche : la Loi ne s'y appliquera jamais.`);
                }
                if (!driver.jet?.torg?.choc) avertir(`${ou}.mecanique`, 'La Loi de la Magie écrit le Choc sur la fiche : « jet.torg.choc » doit dire où.');
            }
        });
    });
    /* Les limites de Blessures des adversaires recoupent les cases du jeu : sans cases, rien à recouper. */
    (driver.combat?.limitesDeBlessures ?? []).forEach((limite, i) => {
        if (!(Number.isInteger(limite.blessures) && limite.blessures >= 0)) {
            erreur(`combat.limitesDeBlessures[${i}].blessures`, `« ${String(limite.blessures)} » n'est pas un nombre de Blessures : un entier, 0 pour un sbire (« — »).`);
        }
    });
    if (driver.combat?.limitesDeBlessures?.length && !driver.combat.casesDeSante) {
        erreur('combat.limitesDeBlessures', 'Les limites de Blessures recoupent « combat.casesDeSante », que le pilote ne déclare pas.');
    }
    if (driver.jet?.torg?.choc && !tousLesChamps.has(driver.jet.torg.choc)) {
        avertir('jet.torg.choc', `Le Choc se lit dans « ${driver.jet.torg.choc} », absent de la fiche.`);
    }

    const tri = driver.combat?.initiativeSort;
    if (tri !== undefined && tri !== 'asc' && tri !== 'desc') {
        erreur('combat.initiativeSort', `« ${String(tri)} » n'est ni « asc » ni « desc ».`);
    }

    /*
      **Une phrase se reproche UNE FOIS.** Sans ce garde, une règle rédigée
      produit un reproche par mot : vingt lignes rouges pour un seul défaut,
      relevé sur Rêves de Dragons le 2026-08-21. Et le reproche par mot est
      trompeur autant que long — il envoie chercher un champ nommé « une »,
      alors que le défaut est que rien ici n'est une formule.
    */
    const formule = driver.combat?.initiativeFormula ?? '';
    if (formule.trim() && estUnePhrase(formule)) {
        erreur(
            'combat.initiativeFormula',
            `« ${formule} » est une phrase, pas une formule. Attendu une expression sur les `
            + 'identifiants de champs de la fiche — « agilite / 2 + melee + 1d6 ». Telle quelle, le '
            + "bouton « Jet Système » s'affiche et le jet part quand même, sur des valeurs que "
            + 'personne ne peut fournir.',
        );
    } else {
        for (const champ of champsInvoques(formule)) {
            if (champInvoque(champ)) continue;
            erreur(
                'combat.initiativeFormula',
                `La formule « ${formule} » invoque « ${champ} », qui n'est un champ d'aucune `
                + `section.${suggestionDeChamp(champ)}`,
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
    // Même garde que l'initiative : une règle rédigée crierait ici autant de
    // fois qu'elle a de mots, et pour la même raison inutile.
    const santeEstUnePhrase = !!formuleDeSante.trim() && estUnePhrase(formuleDeSante);
    if (santeEstUnePhrase) {
        erreur(
            'combat.santeDeDepart',
            `« ${formuleDeSante} » est une phrase, pas une formule. Attendu une expression sur `
            + "les identifiants de champs de la fiche — « (taille + constitution) / 2 ». Telle "
            + "quelle, elle ne s'évaluera jamais et la santé de départ restera sans effet.",
        );
    }
    for (const champ of santeEstUnePhrase ? [] : champsInvoques(formuleDeSante)) {
        const reel = champInvoque(champ);
        if (!reel) {
            erreur(
                'combat.santeDeDepart',
                `La santé de départ « ${formuleDeSante} » invoque « ${champ} », qui n'est un champ `
                + "d'aucune section de la fiche : chaque personnage naîtrait au minimum."
                + suggestionDeChamp(champ),
            );
            continue;
        }
        /*
          **Un champ existant ne suffit pas : il faut qu'il porte un NOMBRE.**

          Relevé sur Cthulhu Hack le 2026-08-17. La dérivation a proposé
          `santeDeDepart: "dé_de_vie + 8"` — et le « dé de vie » de ce jeu est
          une taille de dé, `d6` ou `d8`, pas un entier. `"d8" + 8` n'est pas une
          addition.

          Ce que ça coûte : rien de visible. `santeDeDepart` refuse un champ
          illisible et rend `null`, l'appelant garde son comportement — donc la
          santé de départ ne s'applique **jamais**, sans un mot. C'est le pire
          endroit où poser une valeur fausse : celui où elle ne fait rien.

          Le type se lit sur la fiche, donc le contrôle peut trancher ici plutôt
          que d'attendre la première création de personnage.
        */
        const type = typeDuChamp.get(reel);
        if (type && !TYPES_NUMERIQUES.has(type)) {
            erreur(
                'combat.santeDeDepart',
                `La santé de départ « ${formuleDeSante} » invoque « ${champ} », qui est un champ ` +
                `« ${type} » et non un nombre. La formule ne s'évaluera jamais, et la santé de ` +
                'départ restera sans effet — silencieusement.',
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

        /*
          **Ce que la séance lit, c'est le champ par défaut — pas la section.**

          `seuilDeDefaite` lit `champChoisi || champParDefaut`, et aucun écran
          ne propose encore de choisir : `sectionDuSeuil` n'est lue **nulle
          part** en séance. Le contrôle en faisait pourtant une erreur, et
          laissait passer le seul vrai défaut — un champ par défaut absent ou
          introuvable, qui met le seuil au minimum pour tout le monde. Relevé
          le 2026-10-13 : Dune, le pilote de référence, recevait une fausse
          erreur (`competences` au lieu de `stats`) alors que son champ
          `combat` se lit très bien.
        */
        const champDuSeuil = tache.champParDefaut;
        if (!champDuSeuil) {
            erreur(
                'combat.tacheDeDefaite.champParDefaut',
                'La tâche de défaite ne nomme pas le champ où lire son seuil : aucun écran ne propose ' +
                'encore de le choisir en séance, il retomberait donc sur son minimum pour tout le ' +
                "monde. Si le jeu n'a pas de tâche étendue de défaite, il faut l'omettre.",
            );
        } else if (!tousLesChamps.has(champDuSeuil)) {
            erreur(
                'combat.tacheDeDefaite.champParDefaut',
                `« ${champDuSeuil} » n'est un champ d'aucune section : le seuil de défaite retomberait ` +
                'sur son minimum pour tout le monde.',
            );
        }
        if (tache.sectionDuSeuil && !idsDeSections.has(tache.sectionDuSeuil)) {
            avertir(
                'combat.tacheDeDefaite.sectionDuSeuil',
                `« ${tache.sectionDuSeuil} » n'est pas une section de la fiche. Sans effet aujourd'hui ` +
                '— la séance lit le champ par défaut —, mais c\'est là que le meneur choisira la ' +
                'compétence défensive quand l\'écran le proposera.',
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
        if (champDuSeuil && tousLesChamps.has(champDuSeuil) && idsDeSections.has(tache.sectionDuSeuil)
            && !champsParSection.get(tache.sectionDuSeuil)?.has(champDuSeuil)) {
            // Même raison : la section ne servira qu'au choix à venir.
            avertir(
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

    // ---- Les dommages selon la règle du jeu (Torg) --------------------------
    const dommages = driver.combat?.dommages;
    if (dommages) {
        if (dommages.mecanique !== 'torg') {
            erreur('combat.dommages.mecanique', `« ${String(dommages.mecanique)} » n'est pas une règle de dommages connue. La seule admise est : torg.`);
        }
        for (const [cle, quoi] of [['resistance', 'la Résistance'], ['choc', 'le Choc']] as const) {
            if (!tousLesChamps.has(dommages[cle])) {
                erreur(`combat.dommages.${cle}`, `Les dommages lisent ${quoi} dans « ${dommages[cle]} », absent de la fiche : chaque coup partirait de zéro.`);
            }
        }
    }

    // ---- Les coups localisés (RuneQuest, 2026-10-30) ------------------------
    const localises = driver.combat?.coupsLocalises;
    if (localises) {
        if (localises.mecanique !== 'runequest') {
            erreur('combat.coupsLocalises.mecanique', `« ${String(localises.mecanique)} » n'est pas une règle de coups localisés connue. La seule admise est : runequest.`);
        }
        const zones = Object.entries(localises.zones ?? {});
        if (zones.length === 0) erreur('combat.coupsLocalises.zones', "Aucune zone n'est déclarée : le panneau des coups localisés ne paraîtrait pas.");
        for (const [zone, champs] of zones) {
            if (!LOCALISATIONS.some(l => l.cle === zone)) {
                erreur(`combat.coupsLocalises.zones.${zone}`, `« ${zone} » n'est pas une localisation de la table du livre (${LOCALISATIONS.map(l => l.cle).join(', ')}).`);
            }
            for (const [cle, quoi] of [['pv', 'ses points de vie'], ['armure', 'son armure'], ['degats', 'ses dégâts reçus']] as const) {
                const champ = champs?.[cle];
                if (champ === undefined) {
                    if (cle !== 'armure') erreur(`combat.coupsLocalises.zones.${zone}.${cle}`, `La zone « ${zone} » ne dit pas où vivent ${quoi}.`);
                } else if (!tousLesChamps.has(champ)) {
                    erreur(`combat.coupsLocalises.zones.${zone}.${cle}`, `La zone « ${zone} » lit ${quoi} dans « ${champ} », absent de la fiche.`);
                }
            }
        }
    }

    // ---- Degenesis : deux pistes de santé, l'initiative en succès (2026-10-30) ----
    const pistes = driver.combat?.pistesDeSante;
    if (pistes) {
        if (pistes.mecanique !== 'degenesis') {
            erreur('combat.pistesDeSante.mecanique', `« ${String(pistes.mecanique)} » n'est pas une règle de pistes de santé connue. La seule admise est : degenesis.`);
        }
        for (const [cle, quoi] of [['blessures', 'les Blessures superficielles'], ['traumatismes', 'les Traumatismes'], ['ego', "l'Égo"]] as const) {
            const champ = pistes[cle];
            if (champ !== undefined && !tousLesChamps.has(champ)) {
                erreur(`combat.pistesDeSante.${cle}`, `Les pistes de santé lisent ${quoi} dans « ${champ} », absent de la fiche.`);
            }
        }
        for (const cle of ['blessures', 'traumatismes'] as const) {
            if (!driver.combat?.statsToTrack?.find(s => s.fieldId === pistes[cle])?.max) {
                avertir(`combat.pistesDeSante.${cle}`, `« ${pistes[cle]} » n'a pas de maximum (statsToTrack[].max) : sans lui, la frontière entre les pistes ne se lit pas, et les dégâts suivent la jauge seule.`);
            }
        }
    }
    if (driver.combat?.initiativeEnReserve && !driver.combat.initiativeFormula?.trim()) {
        erreur('combat.initiativeEnReserve', "L'initiative en réserve lance autant de d6 que la formule d'initiative : elle est vide.");
    }
    const deg = driver.jet?.degenesis;
    if (deg) {
        if (driver.jet?.sens !== 'superieur-ou-egal' || !driver.jet?.reserve || facesLancees(driver) !== 6 || (driver.jet?.seuil ?? []).length) {
            avertir('jet.degenesis', 'Le bloc Degenesis suppose une réserve de d6 (attribut + compétence) réussis sur 4 ou plus, sans seuil composé (p. 18) : déclarer « reserve.composantes » et « sens: superieur-ou-egal ».');
        }
        if (driver.dice?.successThreshold !== 4) {
            avertir('dice.successThreshold', 'Chaque d6 de Degenesis réussit sur 4, 5 ou 6 (p. 18) : `dice.successThreshold` doit valoir 4.');
        }
        for (const [cle, quoi] of [['traumatismes', 'les Traumatismes'], ['ego', "l'Égo"]] as const) {
            const champ = deg[cle];
            if (champ !== undefined && !tousLesChamps.has(champ)) erreur(`jet.degenesis.${cle}`, `Degenesis lit ${quoi} dans « ${champ} », absent de la fiche.`);
        }
    }
    (driver.combat?.statsToTrack ?? []).forEach((stat, i) => {
        // Les gestes de la règle (le Choc de Torg) : un nom, et un effet chiffré.
        (stat.gestes ?? []).forEach((geste, j) => {
            const ou = `combat.statsToTrack[${i}].gestes[${j}]`;
            if (!geste.libelle?.trim()) erreur(ou, `Un geste de « ${stat.label} » n'a pas de nom : son bouton serait vide.`);
            const aUnEffet = (geste.valeur !== undefined && Number.isFinite(geste.valeur))
                || (geste.delta !== undefined && Number.isFinite(geste.delta) && geste.delta !== 0);
            if (!aUnEffet) erreur(ou, `Le geste « ${geste.libelle ?? '?'} » de « ${stat.label} » ne dit ni ce qu'il ajoute (delta) ni ce qu'il pose (valeur) : le bouton ne ferait rien.`);
        });
        if (!stat.max) return;
        const absents = champsDUneFormule(stat.max).filter(c => !tousLesChamps.has(c));
        if (absents.length > 0) {
            avertir(`combat.statsToTrack[${i}].max`, `Le maximum de « ${stat.label} » lit ${absents.map(c => `« ${c} »`).join(', ')}, absent de la fiche.`);
        }
    });

    // ---- Les cases de santé (NOC : dix cases Blessures) ----------------------
    const cases = driver.combat?.casesDeSante;
    if (cases) {
        if (!(Number.isInteger(cases.nombre) && cases.nombre > 0)) {
            erreur('combat.casesDeSante.nombre', 'Les cases de santé doivent être un nombre entier positif.');
        }
        (cases.seuils ?? []).forEach((s, i) => {
            if (!(Number.isInteger(s.aPartirDe) && s.aPartirDe >= 1 && s.aPartirDe <= cases.nombre)) {
                erreur(`combat.casesDeSante.seuils[${i}].aPartirDe`, `Le seuil « ${s.label} » doit tomber sur une case, de 1 à ${cases.nombre}.`);
            }
        });
        if (driver.combat?.defaultHealthType !== 'boxes') {
            avertir('combat.casesDeSante', 'Des cases de santé sont déclarées, mais le modèle de santé n’est pas « boxes » : elles ne serviront qu’en changeant de moteur sur la fiche.');
        }
        if (cases.champ && !tousLesChamps.has(cases.champ)) {
            avertir('combat.casesDeSante.champ', `Les cases doivent suivre le champ « ${cases.champ} », absent de la fiche : la jauge de la fiche ne bougera pas.`);
        }
    }

    // ---- La fiche du groupe (la Cabale de NOC) ------------------------------
    const groupe = driver.ficheDeGroupe;
    if (groupe) {
        if (!groupe.libelle?.trim()) {
            erreur('ficheDeGroupe.libelle', 'La fiche de groupe doit dire comment le jeu appelle son groupe (« Cabale »).');
        }
        if (!groupe.gabaritDeLaFiche?.trim()) {
            erreur('ficheDeGroupe.gabaritDeLaFiche', 'La fiche de groupe doit nommer son gabarit dans le moteur de fiches (« noc-cabale »).');
        } else if (groupe.gabaritDeLaFiche === driver.templateId) {
            avertir(
                'ficheDeGroupe.gabaritDeLaFiche',
                'La fiche de groupe vise le gabarit des personnages : le groupe porterait la feuille d’un Héros.',
            );
        }

        // Ce que le groupe apporte aux jets — les dés, l'Espoir, les Atouts de la Cabale.
        const composantesDuJet = new Set([
            ...(driver.jet?.seuil ?? []),
            ...(driver.jet?.reserve?.composantes ?? []),
        ].map(c => c.id));
        (groupe.apports ?? []).forEach((apport, i) => {
            const ou = `ficheDeGroupe.apports[${i}]`;
            const nom = apport.label || apport.id || `n° ${i + 1}`;
            if (apport.effet !== 'des' && apport.effet !== 'bonus' && apport.effet !== 'annuleLesUns' && apport.effet !== 'degres') {
                erreur(`${ou}.effet`, `« ${nom} » doit donner des dés (« des »), un bonus (« bonus »), des degrés à la cible (« degres ») ou annuler des 1 (« annuleLesUns »).`);
            }
            if (!(Number.isInteger(apport.parPoint) && apport.parPoint > 0)) {
                erreur(`${ou}.parPoint`, `« ${nom} » doit rapporter un nombre entier positif par point.`);
            }
            if (apport.epuisement !== 'piste' && apport.epuisement !== 'scenario') {
                erreur(`${ou}.epuisement`, `« ${nom} » s'épuise sur sa piste (« piste ») ou par scénario (« scenario »).`);
            }
            if (!apport.stocks?.length) {
                erreur(`${ou}.stocks`, `« ${nom} » ne dit pas où se lit son stock.`);
                return;
            }
            if (apport.composante) {
                if (!composantesDuJet.has(apport.composante)) {
                    erreur(`${ou}.composante`, `« ${nom} » suit la composante « ${apport.composante} », que le jet ne déclare pas.`);
                }
                if (apport.stocks.some(s => !s.pour)) {
                    avertir(`${ou}.stocks`, `« ${nom} » suit une composante, mais certains stocks ne disent pas pour quel champ : ils ne seront jamais retenus.`);
                }
            }
            // L'Atout Capital : libéré du plafond par un champ que le jet doit pouvoir retenir.
            apport.stocks.forEach((stock, j) => {
                const libere = stock.horsPlafondSi;
                if (!libere) return;
                if (!composantesDuJet.has(libere.composante)) {
                    erreur(`${ou}.stocks[${j}].horsPlafondSi`, `« ${stock.label} » est libéré par la composante « ${libere.composante} », que le jet ne déclare pas.`);
                } else if (!tousLesChamps.has(libere.champ)) {
                    avertir(`${ou}.stocks[${j}].horsPlafondSi`, `« ${stock.label} » est libéré par « ${libere.champ} », absent de la fiche : il restera plafonné.`);
                }
                if (apport.maxParJet === undefined) {
                    avertir(`${ou}.stocks[${j}].horsPlafondSi`, `« ${nom} » n'a pas de plafond par jet : libérer « ${stock.label} » ne change rien.`);
                }
            });
        });
    }

    // Ce que la feuille du groupe regagne au nouveau scénario — les pistes de la Cabale.
    (driver.ficheDeGroupe?.nouveauScenario ?? []).forEach((m, i) => {
        const ou = `ficheDeGroupe.nouveauScenario[${i}]`;
        const nom = m.label ?? m.champ;
        if (!m.champ?.trim()) erreur(`${ou}.champ`, 'Une recharge du groupe nomme la piste qu’elle remplit.');
        if (m.delta !== 'plein' && !(Number.isInteger(m.delta) && m.delta !== 0)) {
            erreur(`${ou}.delta`, `« ${nom} » doit bouger d'un nombre entier non nul, ou revenir « plein ».`);
        }
        if (m.delta === 'plein' && m.max === undefined) {
            erreur(`${ou}.max`, `« ${nom} » revient « plein » sans plafond : elle ne bougerait jamais.`);
        }
    });

    // ---- Les réserves de table ---------------------------------------------
    (driver.ressourcesDeTable ?? []).forEach((ressource, i) => {
        // Le départ par personnage joueur (Star Trek, 2026-10-23) : un nombre, et lu seulement à « Nouveau scénario ».
        if (ressource.departParPersonnage !== undefined) {
            if (!Number.isFinite(ressource.departParPersonnage) || ressource.departParPersonnage < 0) {
                erreur(`ressourcesDeTable[${i}].departParPersonnage`, `« ${ressource.label} » : le départ par personnage est un nombre positif — 2 pour la Menace de Star Trek.`);
            } else if (!ressource.remiseAuDepartParScenario) {
                avertir(`ressourcesDeTable[${i}].departParPersonnage`, `« ${ressource.label} » : le départ par personnage ne sert qu'avec « Nouveau scénario » (remiseAuDepartParScenario).`);
            }
        }
        // Une réserve qui se lit par son nom (Nephilim, 2026-10-23) : un libellé par valeur, de min à max.
        if (ressource.libelles && (ressource.max === undefined || ressource.libelles.length !== ressource.max - ressource.min + 1)) {
            avertir(`ressourcesDeTable[${i}].libelles`, `« ${ressource.label} » a ${ressource.libelles.length} libellés pour ${ressource.max === undefined ? 'aucun plafond' : `${ressource.max - ressource.min + 1} valeurs`} : une valeur sans nom s'affichera en chiffre.`);
        }
        const report = ressource.reportSurEpuisement;
        if (report && !ressources.has(report)) {
            erreur(
                `ressourcesDeTable[${i}].reportSurEpuisement`,
                `« ${ressource.label} » reporte son manque sur « ${report} », qui n'existe pas.`,
            );
        }
        if (report && report === ressource.id) {
            erreur(
                `ressourcesDeTable[${i}].reportSurEpuisement`,
                `« ${ressource.label} » se déverse dans elle-même.`,
            );
        }
        // Payer sur le report par choix (Dune, 2026-10-22) suppose un report.
        if (ressource.paiementAuChoix && !report) {
            avertir(
                `ressourcesDeTable[${i}].paiementAuChoix`,
                `« ${ressource.label} » laisse choisir de payer sur son report, mais n'en déclare aucun : il n'y a rien à choisir.`,
            );
        }

        /*
          **Un plafond est un nombre** (Nephilim, 2026-10-17) : le pilote livré
          portait `max: "Seuil RK"`. Comparé à un nombre, un texte rend toujours
          faux — la jauge n'aurait jamais débordé, sans un mot.
        */
        if (ressource.max !== undefined && !(typeof ressource.max === 'number' && Number.isFinite(ressource.max))) {
            erreur(
                `ressourcesDeTable[${i}].max`,
                `Le plafond de « ${ressource.label} » vaut « ${String(ressource.max)} », qui n'est pas un nombre. `
                + "Un plafond qui dépend d'une autre réserve se déclare par « maxSur ».",
            );
        }
        // Le plafond lu sur une autre réserve — la Traque de Nephilim, au Seuil RK du lieu.
        if (ressource.maxSur !== undefined) {
            if (ressource.maxSur === ressource.id) {
                erreur(`ressourcesDeTable[${i}].maxSur`, `« ${ressource.label} » prend son plafond sur elle-même.`);
            } else if (!ressources.has(ressource.maxSur)) {
                erreur(`ressourcesDeTable[${i}].maxSur`, `« ${ressource.label} » prend son plafond sur « ${ressource.maxSur} », qui n'est pas une réserve de table du jeu.`);
            }
        }

        // Le débordement — le Fiel de NOC qui, à cinq, se vide en Menace.
        const debordement = ressource.debordement;
        if (debordement) {
            const ou = `ressourcesDeTable[${i}].debordement`;
            if (!debordement.vers || !ressources.has(debordement.vers)) {
                erreur(ou, `« ${ressource.label} » déborde dans « ${debordement.vers ?? ''} », qui n'existe pas.`);
            } else if (debordement.vers === ressource.id) {
                erreur(ou, `« ${ressource.label} » déborde dans elle-même.`);
            }
            if (!ressource.maxSur && (ressource.max === undefined || ressource.max <= ressource.min)) {
                // Ignoré à l'exécution, pas refusé : la réserve plafonne simplement.
                avertir(
                    ou,
                    `« ${ressource.label} » déclare un débordement sans plafond au-dessus de son plancher : `
                    + "sans seuil, elle ne débordera jamais.",
                );
            }
            if (debordement.gain !== undefined && !(Number.isInteger(debordement.gain) && debordement.gain > 0)) {
                erreur(`${ou}.gain`, `Le débordement de « ${ressource.label} » doit faire gagner un nombre entier positif.`);
            }
        }
        if (ressource.erosionDebutDeSeance !== undefined
            && !(Number.isInteger(ressource.erosionDebutDeSeance) && ressource.erosionDebutDeSeance > 0)) {
            erreur(
                `ressourcesDeTable[${i}].erosionDebutDeSeance`,
                `L'érosion de début de séance de « ${ressource.label} » doit être un nombre entier positif.`,
            );
        }
    });

    // ---- Les gestes qui touchent chaque Héros (NOC, 2026-10-16) ------------
    /*
      Un geste qui vise un champ absent ne fait rien en silence : le meneur
      croit avoir rendu l'Espoir, aucune fiche n'a bougé. Un champ manquant est
      donc dit ; une réserve de table manquante est une erreur.
    */
    const gestes = driver.gestesDesHeros;
    const controlerLesMouvements = (mouvements: MouvementDeFiche[] | undefined, ou: string) => {
        (mouvements ?? []).forEach((m, i) => {
            const ici = `${ou}[${i}]`;
            const nom = m.label ?? m.champ;
            if (m.delta !== 'plein' && m.delta !== 'vide' && m.delta !== 'moitie' && !(Number.isInteger(m.delta) && m.delta !== 0)) {
                erreur(`${ici}.delta`, `« ${nom} » doit bouger d'un nombre entier non nul, ou revenir « plein », « vide » ou à la « moitie ».`);
            }
            if (m.delta === 'plein' && m.max === undefined) {
                erreur(`${ici}.max`, `« ${nom} » revient « plein » sans plafond : il ne bougerait jamais.`);
            }
            const lus = [m.champ, m.plus, m.resistance, m.plancher, m.aVideCoche,
                typeof m.max === 'object' ? m.max.champ : undefined].filter((c): c is string => !!c);
            for (const champ of lus) {
                if (!tousLesChamps.has(champ)) avertir(ici, `« ${nom} » lit ou écrit « ${champ} », absent de la fiche.`);
            }
        });
    };
    if (gestes) {
        const calme = gestes.momentDeCalme;
        if (calme) {
            controlerLesMouvements(calme.heros, 'gestesDesHeros.momentDeCalme.heros');
            (calme.table ?? []).forEach((t, i) => {
                if (!ressources.has(t.ressource)) {
                    erreur(`gestesDesHeros.momentDeCalme.table[${i}]`, `Le moment de calme fait bouger « ${t.ressource} », qui n'est pas une réserve de table du jeu.`);
                }
            });
            for (const champ of [...(calme.leve ?? []), ...(calme.amputation ? [calme.amputation.champ] : [])]) {
                if (!tousLesChamps.has(champ)) avertir('gestesDesHeros.momentDeCalme', `Le moment de calme lit « ${champ} », absent de la fiche.`);
            }
        }
        controlerLesMouvements(gestes.finDeScene, 'gestesDesHeros.finDeScene');
        controlerLesMouvements(gestes.bonneNuit, 'gestesDesHeros.bonneNuit');
        controlerLesMouvements(gestes.debutDeSeance, 'gestesDesHeros.debutDeSeance');
        controlerLesMouvements(gestes.nouveauScenario, 'gestesDesHeros.nouveauScenario');
        const effets = gestes.effetsDuDebordement;
        if (effets) {
            const ou = 'gestesDesHeros.effetsDuDebordement';
            const source = (driver.ressourcesDeTable ?? []).find(r => r.id === effets.ressource);
            if (!source) {
                erreur(`${ou}.ressource`, `Les effets suivent « ${effets.ressource} », qui n'est pas une réserve de table du jeu.`);
            } else if (!source.debordement) {
                avertir(`${ou}.ressource`, `« ${source.label} » ne déclare pas de débordement : ses effets n'auront jamais de moment.`);
            }
            if (!ressources.has(effets.nombreSelon)) {
                erreur(`${ou}.nombreSelon`, `Le nombre d'effets se lit dans « ${effets.nombreSelon} », qui n'est pas une réserve de table du jeu.`);
            }
            const ids = new Set<string>();
            effets.effets.forEach((e, i) => {
                if (ids.has(e.id)) erreur(`${ou}.effets[${i}].id`, `Deux effets portent l'identifiant « ${e.id} ».`);
                ids.add(e.id);
                controlerLesMouvements(e.heros, `${ou}.effets[${i}].heros`);
                if (e.coche && !tousLesChamps.has(e.coche)) avertir(`${ou}.effets[${i}].coche`, `« ${e.label} » coche « ${e.coche} », absent de la fiche.`);
                if (!e.heros?.length && !e.coche && !e.aDire) avertir(`${ou}.effets[${i}]`, `« ${e.label} » ne fait rien aux Héros et ne dit rien.`);
            });
        }
    }

    /*
      **Une santé en points de vie que la fiche ne porte pas** (S2 de l'audit de
      Symbaroum, 2026-10-22). Le pilote dit d'où part la santé (`santeDeDepart`)
      mais ne désigne aucun champ pour sa valeur courante (`isMainHP`) : le coup
      porté au combat ne s'écrit pas sur la fiche, et une fiche blessée se lit
      pleine au combat. Avertissement : le jeu se joue, la santé vit à part.
    */
    const combatDuPilote = driver.combat;
    // Une santé de départ rédigée en phrase est déjà reprochée plus haut : un constat suffit.
    if (combatDuPilote?.santeDeDepart && !estUnePhrase(combatDuPilote.santeDeDepart)
        && (combatDuPilote.defaultHealthType ?? 'hp') === 'hp'
        && !combatDuPilote.tacheDeDefaite && !combatDuPilote.casesDeSante
        && !(combatDuPilote.statsToTrack ?? []).some(s => s.isMainHP)) {
        avertir(
            'combat.statsToTrack',
            `La santé part de « ${combatDuPilote.santeDeDepart} », mais aucun champ de la fiche n'en porte la valeur ` +
            'courante (« isMainHP ») : les coups du combat ne s’écrivent pas sur la fiche. Marquer le champ ' +
            'de santé actuelle comme jauge principale.',
        );
    }

    /*
      **Les seuils qui laissent une trace** (la Séquelle de NOC, 2026-10-22). Un
      identifiant en double ferait traiter deux seuils d'un seul geste ; une jauge
      absente ne franchirait jamais rien.
    */
    const seuilsVus = new Set<string>();
    (driver.franchissements ?? []).forEach((f, i) => {
        const ou = `franchissements[${i}]`;
        if (!f.id || seuilsVus.has(f.id)) erreur(`${ou}.id`, `Chaque seuil porte un identifiant unique (« ${f.id ?? ''} »).`);
        seuilsVus.add(f.id);
        const seuil = f.aPartirDe;
        if (typeof seuil === 'object' && seuil !== null) {
            if (!tousLesChamps.has(seuil.champ)) avertir(`${ou}.aPartirDe`, `Le seuil de « ${f.label ?? f.champ} » se lit dans « ${seuil.champ} », absent de la fiche : il ne sera jamais franchi.`);
        } else if (!(typeof seuil === 'number' && Number.isFinite(seuil))) {
            erreur(`${ou}.aPartirDe`, `Le seuil de « ${f.label ?? f.champ} » doit être un nombre, ou un champ de la fiche.`);
        }
        for (const champ of [f.champ, ...(f.ajouter ?? [])]) {
            if (!tousLesChamps.has(champ)) avertir(`${ou}.champ`, `Le seuil surveille « ${champ} », absent de la fiche : il ne sera jamais franchi.`);
        }
        if (f.jet && !(Number.isInteger(f.jet.faces) && f.jet.faces > 1)) erreur(`${ou}.jet`, `Le dé de « ${f.label ?? f.champ} » doit avoir un nombre de faces.`);
        if (f.jet && !tousLesChamps.has(f.jet.champ)) avertir(`${ou}.jet`, `Le dé de « ${f.label ?? f.champ} » s'ajoute à « ${f.jet.champ} », absent de la fiche.`);
        // « Noter » sans mouvement consigne le rappel (l'Abomination) : il lui faut au moins de quoi dire.
        if (!f.mouvements?.length && !f.jet && !f.rappel && !f.variantes?.length) erreur(`${ou}.mouvements`, `« ${f.label ?? f.champ} » ne propose rien à noter ni à dire.`);
        controlerLesMouvements(f.mouvements, `${ou}.mouvements`);
        // Les issues au choix (Crimes, C4) : un identifiant, un libellé, des mouvements contrôlés comme les autres.
        (f.variantes ?? []).forEach((v, j) => {
            if (!v.id || !v.label) erreur(`${ou}.variantes[${j}]`, `Chaque issue de « ${f.label ?? f.champ} » porte un identifiant et un libellé.`);
            controlerLesMouvements(v.mouvements, `${ou}.variantes[${j}].mouvements`);
        });
    });

    return constats;
}
