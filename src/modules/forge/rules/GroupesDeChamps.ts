import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { normaliser } from './canevas';

/**
 * Le pilote, dérivé du corpus, un groupe de champs à la fois.
 *
 * **Pourquoi ne pas lire le livre.** L'Atelier l'a déjà lu, a vérifié ses pages
 * et a produit dix-sept fiches v3. Le pilote n'est pas une extraction du livre :
 * c'est une **projection des fiches** dans les champs que l'application
 * consomme. Chaque valeur devient alors traçable jusqu'à une page vérifiée, et
 * la règle tient — *dériver du corpus, pas produire en parallèle*, parce que
 * deux productions indépendantes des mêmes faits divergeront et que rien ne les
 * comparera jamais.
 *
 * **Pourquoi par groupes, et non d'un seul appel.** Mesuré le 2026-08-12 :
 * le budget d'invite réel est d'environ 8 000 tokens. Tout le corpus de Dune en
 * fait 34 500 — l'envoyer entier ne vaut pas mieux que d'envoyer le livre, on
 * en perdrait les trois quarts en silence. Deux fiches font 3 800 tokens, soit
 * la moitié du budget.
 *
 * Le découpage vaut aussi **pour la sortie** : le décodage tourne à 7,7 tok/s,
 * donc cent tokens de JSON coûtent treize secondes. Six petites réponses
 * coûtent moins qu'une grosse, à contenu égal, parce qu'aucune ne dérape.
 */

/** Une fiche du corpus, telle qu'on la lit sur le disque. */
export interface FicheDuCorpus {
    /** Le `sujet:` du frontmatter — c'est par lui qu'on rattache au canevas. */
    sujet: string;
    contenu: string;
}

export interface GroupeDeChamps {
    id: string;
    label: string;
    /** Clés du canevas dont les fiches nourrissent ce groupe. */
    sujets: string[];
    /**
     * Ce groupe vise-t-il des identifiants qu'un autre groupe a produits ?
     *
     * **Le défaut du 2026-08-12, et il était total.** Les huit groupes étaient
     * forgés dans l'ignorance les uns des autres, alors que cinq d'entre eux
     * désignent des sections, des champs ou des réserves que seuls les groupes
     * `fiche` et `ressources` inventent. Sur la première dérivation de Dune,
     * **aucune de ces références n'a abouti** : le modèle ne pouvait que
     * fabriquer un identifiant plausible ou recopier ce qu'il avait sous les
     * yeux — c'est-à-dire les titres de chapitre du livre.
     */
    dependDuVocabulaire?: boolean;
    /** Ce que le modèle doit rendre, décrit en une phrase. */
    cible: string;
    /**
     * Le fragment correspondant du pilote Dune, en JSON compact.
     *
     * **Il montre la forme, jamais les valeurs.** C'est la leçon de l'exemple
     * précédent, qui codait `"isMainHP": true` et enseignait ainsi que tout jeu
     * a des points de vie.
     */
    exemple: string;
}

/**
 * Les huit groupes, **dans l'ordre de leurs dépendances**.
 *
 * Chaque champ que l'application consomme correspond à un sujet — ce n'est pas
 * un hasard : le canevas avait été dérivé de ce que le code exploite.
 *
 * **L'ordre n'est pas cosmétique.** `fiche` et `ressources` *inventent* le
 * vocabulaire — les sections, les champs, les réserves — que cinq autres
 * groupes ne font que *désigner*. Ils passent donc en premier, et ce qu'ils ont
 * produit est injecté dans les invites suivantes. Sans cela, aucune référence
 * croisée ne peut aboutir autrement que par chance.
 */
export const GROUPES: readonly GroupeDeChamps[] = [
    {
        id: 'fiche',
        label: 'Fiche de personnage',
        sujets: ['Composition de la fiche de personnage', 'Jauges et ressources individuelles'],
        cible:
            '"template" avec name, emoji et sections. Chaque champ porte un "type" pris parmi ' +
            'number, text, checkbox, gauge, select, textarea, rating. **Prévois une section pour ' +
            'les jauges individuelles** (stress, détermination, santé mentale…) si le jeu en a : ' +
            'elles se suivent en combat et doivent exister comme champs de la fiche',
        exemple: '{"template":{"name":"Fiche de Personnage","emoji":"📜","sections":[{"id":"competences","label":"Compétences","fields":[{"id":"combat","label":"Combat","type":"number","defaultValue":4,"max":8}]},{"id":"jauges","label":"Jauges","fields":[{"id":"determination","label":"Détermination","type":"gauge","defaultValue":0,"max":5}]}]}}',
    },
    {
        id: 'ressources',
        label: 'Monnaie de table',
        sujets: ['Monnaie de table'],
        cible: '"driver" avec seulement ressourcesDeTable',
        exemple: '{"driver":{"ressourcesDeTable":[{"id":"impulsion","label":"Impulsion","proprietaire":"joueurs","depart":0,"min":0,"max":6,"erosionFinDeScene":1,"reportSurEpuisement":"menace"},{"id":"menace","label":"Menace","proprietaire":"meneur","depart":0,"min":0}]}}',
    },
    {
        id: 'identite',
        label: 'Identité et ambiance',
        sujets: ['Ton, registre et ambiance'],
        cible: '"driver" avec seulement name, description, emoji et ui_config.themeColor',
        exemple: '{"driver":{"name":"Dune : Aventures dans l\'Imperium","description":"Système 2d20 de Modiphius.","emoji":"🏜️","ui_config":{"themeColor":"#d97706"}}}',
    },
    {
        id: 'jet',
        label: 'Dés et composition du jet',
        sujets: ['Résolution des jets', 'Degrés de réussite et critiques'],
        dependDuVocabulaire: true,
        cible: '"driver" avec seulement dice et jet',
        exemple: '{"driver":{"dice":{"defaultDice":"2d20","logic":"count-success","engine":"2d20"},"jet":{"seuil":[{"id":"competence","label":"Compétence","sectionId":"competences"},{"id":"principe","label":"Principe","sectionId":"principes"}],"reserve":{"base":2,"max":5,"faces":20,"cout":[1,2,3],"ressource":"impulsion"},"sens":"sous-ou-egal","critique":1,"complication":20,"difficulte":{"min":0,"max":5,"defaut":1}}}}',
    },
    {
        id: 'initiative',
        label: 'Ordre d\'action',
        sujets: ['Initiative et déroulement du tour'],
        dependDuVocabulaire: true,
        cible: '"driver" avec seulement combat.initiative, combat.initiativeFormula et combat.initiativeSort',
        exemple: '{"driver":{"combat":{"initiativeFormula":"","initiative":{"mode":"alternance","coutDeRetention":{"montant":2,"ressource":"impulsion"},"coutDOuverture":{"montant":2,"ressource":"impulsion"},"activationsConsecutivesMax":2}}}}',
    },
    {
        id: 'defaite',
        label: 'Santé et mise hors de combat',
        sujets: ['Santé et blessures', 'Dégâts et types de dégâts'],
        dependDuVocabulaire: true,
        cible: '"driver" avec seulement combat.defaultHealthType, combat.tacheDeDefaite et combat.damageTypes',
        exemple: '{"driver":{"combat":{"defaultHealthType":"clocks","tacheDeDefaite":{"sectionDuSeuil":"competences","champParDefaut":"combat","seuil":{"min":4,"max":8},"progressionDeBase":2,"qualiteMax":4,"label":"Défaite"}}}}',
    },
    {
        id: 'jauges',
        label: 'Jauges suivies en combat',
        sujets: ['Jauges et ressources individuelles'],
        dependDuVocabulaire: true,
        cible: '"driver" avec seulement combat.statsToTrack et ui_config.gauges',
        exemple: '{"driver":{"combat":{"statsToTrack":[{"fieldId":"determination","label":"Détermination","isMainHP":false,"isResource":true}]},"ui_config":{"gauges":[{"fieldId":"determination","label":"Détermination","color":"#d97706","style":"segmented"}]}}}',
    },
    {
        id: 'portees',
        label: 'Distances et portées',
        sujets: ['Distances et portées'],
        cible: '"driver" avec seulement tactical',
        exemple: '{"driver":{"tactical":{"ranges":{"contact":{"label":"Même zone","maxUnits":1,"modifier":0},"courte":{"label":"Zone adjacente","maxUnits":2,"modifier":1},"moyenne":{"label":"Zone éloignée","maxUnits":3,"modifier":2},"longue":{"label":"Hors de portée","maxUnits":4,"modifier":3},"extreme":{"label":"Hors de portée","maxUnits":5,"modifier":4}},"useTacticalAI":false}}}',
    },
] as const;

/** Les identifiants qu'un groupe peut désigner, parce qu'un autre les a créés. */
export interface VocabulaireDuPilote {
    sections: { id: string; label: string; champs: { id: string; label: string }[] }[];
    ressources: { id: string; label: string }[];
}

/** Ce que les groupes déjà forgés mettent à disposition des suivants. */
export function vocabulaireAcquis(fragment: FragmentDePilote): VocabulaireDuPilote {
    return {
        sections: (fragment.template?.sections ?? []).map(section => ({
            id: section.id,
            label: section.label,
            champs: (section.fields ?? []).map(champ => ({ id: champ.id, label: champ.label })),
        })),
        ressources: (fragment.driver?.ressourcesDeTable ?? []).map(r => ({ id: r.id, label: r.label })),
    };
}

/**
 * Le bloc qui dit au modèle **quels identifiants existent**, et lesquels n'en
 * sont pas.
 *
 * **Les deux erreurs qu'il vise, relevées sur la dérivation de Dune du
 * 2026-08-12.** `jet.seuil[0].sectionId` valait « les compétences » et
 * `tacheDeDefaite.sectionDuSeuil` valait « Attaques réussies » : deux **titres
 * de chapitre du livre**, que les fiches v3 citent en toutes lettres dans leur
 * prose — et c'est voulu, puisque c'est ce qui permet de résoudre les pages.
 *
 * Le mot « section » avait donc deux sens dans notre propre invite, et le
 * modèle n'avait aucun moyen de les distinguer : il recopiait le seul qu'il
 * avait sous les yeux. On lève l'ambiguïté au lieu de la lui reprocher.
 */
export function blocDuVocabulaire(vocabulaire: VocabulaireDuPilote): string {
    if (vocabulaire.sections.length === 0 && vocabulaire.ressources.length === 0) {
        return [
            "AUCUN IDENTIFIANT N'EST DISPONIBLE : la fiche de personnage de ce jeu n'a pas pu être",
            'établie. OMETS donc tout champ qui devrait désigner une section, un champ de fiche ou',
            "une réserve — n'en invente aucun.",
        ].join('\n');
    }

    const lignes = ['IDENTIFIANTS DISPONIBLES — tu ne peux en désigner aucun autre.', ''];

    if (vocabulaire.sections.length > 0) {
        lignes.push('La fiche de personnage de ce jeu porte exactement ces sections et ces champs :');
        for (const section of vocabulaire.sections) {
            const champs = section.champs.length > 0
                ? section.champs.map(c => `"${c.id}" (${c.label})`).join(', ')
                : 'aucun champ';
            lignes.push(`- section "${section.id}" (${section.label}) : ${champs}`);
        }
        lignes.push('');
    }

    if (vocabulaire.ressources.length > 0) {
        lignes.push(
            'Réserves de table déclarées : ' +
            vocabulaire.ressources.map(r => `"${r.id}" (${r.label})`).join(', '),
            '',
        );
    }

    lignes.push(
        'Un "sectionId" est l\'identifiant d\'une SECTION DE LA FICHE ci-dessus.',
        'Un "fieldId" est l\'identifiant d\'un CHAMP ci-dessus.',
        'Une "ressource" est l\'identifiant d\'une RÉSERVE ci-dessus.',
        '',
        'Les titres de chapitre du LIVRE cités dans les fiches de règles — « Attaques réussies »,',
        '« Les compétences » — ne sont PAS des identifiants. Ne les recopie jamais dans un',
        'sectionId, un fieldId ou une ressource.',
        '',
        "Si aucun identifiant disponible ne convient, OMETS le champ plutôt que d'en inventer un.",
    );

    return lignes.join('\n');
}

/**
 * Les fiches qui nourrissent un groupe.
 *
 * La comparaison passe par `normaliser` : le carnet rend « Monnaie de table ou
 * ressource partagée » là où le canevas dit « Monnaie de table », et les fiches
 * portent l'une ou l'autre forme selon leur génération.
 */
export function fichesDuGroupe(groupe: GroupeDeChamps, fiches: FicheDuCorpus[]): FicheDuCorpus[] {
    const voulus = groupe.sujets.map(normaliser);
    return fiches.filter(f => {
        const sujet = normaliser(f.sujet);
        return voulus.some(v => sujet === v || sujet.startsWith(v) || v.startsWith(sujet));
    });
}

/**
 * L'invite d'un groupe : les fiches, la cible, et l'interdiction d'inventer.
 *
 * **Compact par nécessité, pas par goût.** Chaque token de sortie coûte treize
 * centièmes de seconde ; demander du JSON indenté et commenté se paierait en
 * minutes.
 */
export function promptDuGroupe(
    groupe: GroupeDeChamps,
    fiches: FicheDuCorpus[],
    vocabulaire?: VocabulaireDuPilote,
): string {
    const retenues = fichesDuGroupe(groupe, fiches);
    const corps = retenues.map(f => `### ${f.sujet}\n${f.contenu}`).join('\n\n');

    return [
        `Voici les fiches de règles vérifiées d'un jeu de rôle, pour le sujet « ${groupe.label} ».`,
        '',
        corps || '(aucune fiche disponible sur ce sujet)',
        '',
        `TÂCHE : rends un JSON compact contenant ${groupe.cible}. Rien d'autre.`,
        '',
        // Le vocabulaire vient juste après la tâche, et avant les interdits :
        // c'est la contrainte la plus dure, elle ne doit pas se noyer.
        ...(groupe.dependDuVocabulaire && vocabulaire ? [blocDuVocabulaire(vocabulaire), ''] : []),
        "N'INVENTE RIEN. Si les fiches ne disent pas comment fonctionne une mécanique,",
        'OMETS le champ. Un champ absent se corrige ; un champ inventé s\'applique en',
        'séance sans que personne ne l\'ait choisi, et rien ne le signale. Ne comble',
        'jamais par analogie avec un autre jeu.',
        '',
        'Si le jeu n\'a pas de points de vie, n\'invente pas de champ "hp" et ne marque',
        'aucune stat "isMainHP". Si l\'initiative n\'ordonne pas les combattants, ne',
        'fabrique pas de formule.',
        '',
        'FORME ATTENDUE (la forme seulement, pas les valeurs — ce jeu-ci est différent) :',
        groupe.exemple,
        '',
        'Réponds par le JSON seul, sans indentation, sans commentaire, sans texte autour.',
    ].join('\n');
}

/** Ce qu'un groupe a produit. */
export interface FragmentDePilote {
    driver?: Partial<GameDriver>;
    template?: Partial<SheetTemplate>;
}

/**
 * Assemble les fragments en un pilote et une fiche.
 *
 * **La fusion est explicite, jamais récursive à l'aveugle.** `combat` et
 * `ui_config` sont les deux seuls objets que plusieurs groupes alimentent ; les
 * fusionner nommément évite qu'un `Object.assign` profond n'écrase une clé qu'on
 * n'avait pas prévue — le genre de perte qui ne se voit qu'en séance.
 */
export function fusionnerFragments(fragments: FragmentDePilote[]): FragmentDePilote {
    const driver: Record<string, unknown> = {};
    const combat: Record<string, unknown> = {};
    const uiConfig: Record<string, unknown> = {};
    let template: Partial<SheetTemplate> | undefined;

    for (const fragment of fragments) {
        const d = fragment.driver as Record<string, unknown> | undefined;
        if (d) {
            for (const [clef, valeur] of Object.entries(d)) {
                if (valeur === undefined) continue;
                if (clef === 'combat') Object.assign(combat, valeur);
                else if (clef === 'ui_config') Object.assign(uiConfig, valeur);
                else driver[clef] = valeur;
            }
        }
        if (fragment.template) {
            template = {
                ...template,
                ...fragment.template,
                sections: [...(template?.sections ?? []), ...(fragment.template.sections ?? [])],
            };
        }
    }

    if (Object.keys(combat).length > 0) driver.combat = combat;
    if (Object.keys(uiConfig).length > 0) driver.ui_config = uiConfig;

    const resultat: FragmentDePilote = {};
    if (Object.keys(driver).length > 0) resultat.driver = driver as Partial<GameDriver>;
    if (template) resultat.template = template;
    return resultat;
}
