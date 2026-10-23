/**
 * Les ressources qui appartiennent à la table, et non aux personnages.
 *
 * **Le mur qu'elles abattent.** Un pilote ne connaissait que des champs de
 * fiche, donc individuels. Or les ressources les plus manipulées d'une partie de
 * Dune ne le sont pas : l'Impulsion est une réserve **commune aux joueurs**,
 * bornée de 0 à 6, qui perd un point en fin de scène ; la Menace appartient au
 * meneur et n'a pas de plafond (`docs/systems/dune/rules/monnaie-de-table.md`).
 * Les mettre sur la fiche aurait été faux dans les deux sens — six joueurs
 * auraient eu six Impulsions, et la Menace serait devenue la propriété d'un
 * personnage.
 *
 * **Ce que le modèle porte, et rien de plus** : combien il y en a, entre quelles
 * bornes, à qui elles sont, ce qu'elles perdent en fin de scène ou en début de
 * séance, si elles reviennent à leur départ à chaque scénario, où va ce qu'on
 * ne peut pas payer et où va ce qui déborde (le Fiel de NOC, qui se vide en
 * Menace). Il ne dit pas *à quoi* on les dépense — acheter un
 * dé, annuler une complication, hausser une difficulté sont des décisions de
 * table, et elles restent dans les fiches de règles que le meneur lit.
 *
 * Tout ici est pur : ces fonctions ne lisent aucun état global et ne lèvent
 * jamais. C'est le store qui applique, et c'est ce qui les rend vérifiables.
 */

/** À qui la réserve appartient. Détermine qui la manipule, pas comment. */
export type ProprietaireDeRessource = 'joueurs' | 'meneur';

export interface RessourceDeTable {
    /** `impulsion`, `menace`. Sert de clé dans l'état. */
    id: string;
    label: string;
    proprietaire: ProprietaireDeRessource;
    /** Valeur au début d'une chronique. */
    depart: number;
    min: number;
    /**
     * Plafond. **Absent = sans plafond** — c'est le cas de la Menace, et c'est
     * une différence de nature, pas un oubli : mettre un très grand nombre
     * aurait rendu les deux cas indistinguables.
     */
    max?: number;
    /**
     * **Le plafond est la valeur d'une autre réserve** — Nephilim, 2026-10-17 :
     * la Jauge de Traque plafonne au **Seuil RK** du lieu, de 2 à 9, que le
     * meneur change en changeant de lieu. Présent, il l'emporte sur `max` ;
     * lu par `plafondDe`, seule lecture du plafond.
     */
    maxSur?: string;
    /**
     * **Une valeur se lit par son nom** — Nephilim, 2026-10-23 : le lieu magique
     * (0 aucun, 1 Plexus de Feu… 6 Nexus) et la conjonction du jour. Le premier
     * libellé est celui de `min`. Le bandeau montre le nom au lieu des segments.
     */
    libelles?: string[];
    /** Ce que la réserve perd à la fin de chaque scène. L'Impulsion : un point. */
    erosionFinDeScene?: number;
    /**
     * Où va ce que la réserve ne peut pas payer.
     *
     * **La règle que rien d'autre ne saurait exprimer** : à zéro d'Impulsion,
     * l'achat d'un dé se paie en Menace — le manque ne bloque pas la dépense, il
     * **alimente la réserve adverse**. Une jauge individuelle serait simplement
     * tombée à zéro et aurait refusé.
     */
    reportSurEpuisement?: string;
    /**
     * **Payer sur le report par choix, pas seulement par manque** — Dune,
     * 2026-10-22 (lot D2 de l'audit, p. 149–152) : les dés achetés se paient
     * en Impulsion, en Menace ou en mélangeant les deux, même quand l'Impulsion
     * suffirait. Le panneau de jet propose alors « dont en Menace ». Sans
     * `reportSurEpuisement`, il n'y a rien à choisir : ignoré, et la Forge le
     * dit.
     */
    paiementAuChoix?: boolean;
    /**
     * Où va ce qui **déborde** — le contraire du report, qui porte le manque.
     *
     * **NOC, 2026-10-13** : « à cinq gouttes, la jauge de Fiel se vide pour
     * augmenter la Menace de plus un » (`docs/systems/noc/rules/monnaie-de-table.md`).
     * Le plafond n'y refuse rien : l'atteindre **vide** la réserve jusqu'à son
     * plancher et fait gagner `gain` (un par défaut) à la réserve `vers`.
     *
     * **Un gain qui franchit le seuil continue de remplir la jauge vidée** : à
     * quatre gouttes, en recevoir trois la vide une fois et en laisse deux. Les
     * sources ne tranchent pas (« Non couvert » de la fiche) ; on suit le geste
     * qu'elles décrivent, des marqueurs posés un à un au milieu de la table.
     *
     * Sans `max`, il n'y a pas de seuil : la déclaration est ignorée, et la
     * Forge le signale.
     */
    debordement?: { vers: string; gain?: number };
    /**
     * Ce que la réserve perd au **début de chaque séance** — la soirée de jeu,
     * pas le temps du récit. La Menace de NOC : un point.
     */
    erosionDebutDeSeance?: number;
    /**
     * La réserve revient-elle à son **départ** à chaque nouveau scénario ? La
     * Menace de NOC, « remise à zéro au début de chaque nouvelle aventure ».
     */
    remiseAuDepartParScenario?: boolean;
    /**
     * Tenue par la table mais **pas dessinée dans le bandeau** — les réserves de
     * la Cabale (`reservesDuGroupe`), trente-cinq stocks qui se lisent dans le
     * panneau de jet, là où l'on puise. Les gestes de séance et de scénario les
     * touchent comme les autres.
     */
    horsDuBandeau?: boolean;
    description?: string;
    /**
     * La réserve est-elle **montrée aux joueurs**, sur leur tablette ?
     *
     * **Distincte du propriétaire, et ce n'est pas un détail.** `proprietaire`
     * dit à qui la réserve appartient ; la voir est une autre question. Chez
     * Dune la Menace est celle du meneur et pourtant **publique** — elle monte
     * quand les joueurs prennent des risques, et c'est justement de la voir
     * monter qui fait pression. Une table qui la joue à couvert existe aussi.
     * L'outil suit l'état : c'est le pilote qui tranche, pas nous.
     *
     * **Absent, on suit la propriété** — ce que les joueurs possèdent, ils le
     * voient. C'est le défaut le moins surprenant, et il rend l'Impulsion de
     * Dune visible sans qu'il faille reforger quoi que ce soit.
     */
    visibleAuxJoueurs?: boolean;
    /**
     * Les joueurs peuvent-ils la faire bouger eux-mêmes ?
     *
     * **La demande de David, le 2026-08-15 :** *« Impulsion est une jauge gérée
     * par les joueurs et cela fait partie du Gameplay, cette gestion commune de
     * la ressource. »* C'est juste, et c'est une règle du jeu, pas un réglage
     * d'interface : chez Dune la réserve commune se dépense par décision
     * collective, à la table, sans passer par le meneur.
     *
     * Voir et manipuler restent séparés : une Menace publique se regarde monter
     * sans qu'on y touche. **Manipuler suppose voir** — on ne fait pas bouger
     * ce qu'on ne lit pas —, et cette implication est tenue par
     * `visiblePourUnJoueur`, jamais par les appelants.
     *
     * Absent, on suit encore la propriété.
     */
    manipulableParLesJoueurs?: boolean;
}

/**
 * Cette réserve est-elle montrée aux joueurs ?
 *
 * Une fonction plutôt qu'une lecture directe, parce que le défaut n'est pas
 * `false` mais **« ce que dit la propriété »**, et qu'un `?? false` dispersé
 * dans les écrans aurait caché l'Impulsion de tous les pilotes déjà forgés.
 */
export function visiblePourUnJoueur(ressource: RessourceDeTable): boolean {
    return ressource.visibleAuxJoueurs ?? ressource.proprietaire === 'joueurs';
}

/**
 * Ce joueur peut-il la faire bouger ?
 *
 * **Voir est une condition, pas une conséquence.** Une réserve déclarée
 * manipulable mais cachée serait un bouton sur un nombre qu'on ne lit pas :
 * le joueur dépenserait à l'aveugle. On refuse ici plutôt que d'espérer que
 * chaque écran y pense.
 */
export function manipulableParUnJoueur(ressource: RessourceDeTable): boolean {
    if (!visiblePourUnJoueur(ressource)) return false;
    return ressource.manipulableParLesJoueurs ?? ressource.proprietaire === 'joueurs';
}

/** Ce que chaque réserve contient, à un instant donné. */
export type EtatDesRessources = Record<string, number>;

/** Un mouvement sur une réserve, tel qu'on peut l'afficher. */
export interface MouvementDeReserve {
    ressourceId: string;
    /** Négatif pour une dépense, positif pour un gain. */
    delta: number;
}

export interface ResultatDeMouvement {
    etat: EtatDesRessources;
    mouvements: MouvementDeReserve[];
    /**
     * Ce qui n'a pas pu entrer parce que la réserve plafonnait.
     *
     * « À six points, tout gain est perdu. » Le dire plutôt que de le taire :
     * un joueur qui gagne trois points et n'en voit arriver qu'un doit savoir
     * pourquoi.
     */
    perdu: number;
    avertissements: string[];
}

/** Chaque réserve à sa valeur de départ. */
export function etatInitial(ressources: RessourceDeTable[]): EtatDesRessources {
    const etat: EtatDesRessources = {};
    for (const r of ressources) etat[r.id] = r.depart;
    return etat;
}

/** La valeur d'une réserve, ou son départ si l'état ne la connaît pas encore. */
export function valeurDe(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    id: string,
): number {
    const courante = etat[id];
    if (typeof courante === 'number' && Number.isFinite(courante)) return courante;
    return ressources.find(r => r.id === id)?.depart ?? 0;
}

/**
 * **Le plafond d'une réserve**, `max` ou la valeur de la réserve `maxSur`. Une
 * réserve désignée qui n'existe pas laisse `max` : un pilote mal écrit ne doit
 * pas faire disparaître un plafond (la Forge le signale).
 */
export function plafondDe(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    ressource: RessourceDeTable,
): number | undefined {
    if (ressource.maxSur && ressource.maxSur !== ressource.id && ressources.some(r => r.id === ressource.maxSur)) {
        return valeurDe(ressources, etat, ressource.maxSur);
    }
    return ressource.max;
}

/** Comment une dépense se répartit — **sans rien appliquer**. */
export interface VentilationDeDepense {
    /** Ce que la réserve elle-même peut payer. */
    surLaReserve: number;
    /** Le manque, qui part ailleurs. Zéro si la réserve suffit. */
    reporte: number;
    /** Sur quelle réserve part le manque. Absent si rien n'est reporté. */
    ressourceDeReport?: string;
    /** Le manque, quand aucun report n'est déclaré : la dépense sera partielle. */
    impaye: number;
    /** La part du report payée **par choix** (`paiementAuChoix`), comprise dans `reporte`. */
    choisi?: number;
}

/**
 * Ce qu'une dépense coûterait, avant de la faire.
 *
 * Séparée de `depenser` pour la même raison que `preparerLeJet` l'est du
 * lancer : le panneau doit pouvoir **annoncer** « 3 points — 2 d'Impulsion,
 * 1 de Menace » avant que le joueur ne s'engage. Une dépense qui alimente la
 * réserve du meneur ne doit jamais être une surprise.
 */
export function ventilerLaDepense(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    id: string,
    montant: number,
    /**
     * Ce que le joueur **choisit** de payer sur le report (`paiementAuChoix`,
     * Dune 2026-10-22) : la Menace d'abord pour cette part, l'Impulsion pour le
     * reste — et son manque, comme toujours, en Menace. Ignoré sans report.
     */
    enReport = 0,
): VentilationDeDepense {
    const demande = Math.max(0, Math.floor(montant));
    const ressource = ressources.find(r => r.id === id);
    if (!ressource) return { surLaReserve: 0, reporte: 0, impaye: demande };

    const choisi = ressource.reportSurEpuisement ? Math.min(demande, Math.max(0, Math.floor(enReport))) : 0;
    const disponible = Math.max(0, valeurDe(ressources, etat, id) - ressource.min);
    const surLaReserve = Math.min(disponible, demande - choisi);
    const manque = demande - choisi - surLaReserve;

    if (manque === 0 && choisi === 0) return { surLaReserve, reporte: 0, impaye: 0 };
    if (ressource.reportSurEpuisement) {
        return { surLaReserve, reporte: choisi + manque, ressourceDeReport: ressource.reportSurEpuisement, impaye: 0, ...(choisi ? { choisi } : {}) };
    }
    return { surLaReserve, reporte: 0, impaye: manque };
}

/**
 * Dépense sur une réserve, en reportant ce qu'elle ne peut pas payer.
 *
 * **N'échoue pas.** Une réserve trop basse rend un avertissement, pas un refus :
 * arbitrer si la dépense a lieu est le rôle du meneur, pas de l'outil. On suit
 * l'état ; on ne le défend pas contre la table.
 */
export function depenser(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    id: string,
    montant: number,
    /** La part payée sur le report par choix — voir `ventilerLaDepense`. */
    enReport = 0,
): ResultatDeMouvement {
    const ventilation = ventilerLaDepense(ressources, etat, id, montant, enReport);
    const suivant = { ...etat };
    const mouvements: MouvementDeReserve[] = [];
    const avertissements: string[] = [];

    const ressource = ressources.find(r => r.id === id);
    if (!ressource) {
        return {
            etat: suivant,
            mouvements: [],
            perdu: 0,
            avertissements: [`« ${id} » n'est pas une ressource de ce système.`],
        };
    }

    if (ventilation.surLaReserve > 0) {
        suivant[id] = valeurDe(ressources, etat, id) - ventilation.surLaReserve;
        mouvements.push({ ressourceId: id, delta: -ventilation.surLaReserve });
    }

    if (ventilation.reporte > 0 && ventilation.ressourceDeReport) {
        // Le report est un **gain** sur l'autre réserve : ce qu'on ne paie pas
        // en Impulsion, le meneur l'encaisse en Menace.
        const report = gagner(ressources, suivant, ventilation.ressourceDeReport, ventilation.reporte);
        const cible = ressources.find(r => r.id === ventilation.ressourceDeReport);
        const nomDuReport = cible?.label ?? ventilation.ressourceDeReport;
        const choisi = ventilation.choisi ?? 0;
        const manque = ventilation.reporte - choisi;
        const pts = (n: number) => `${n} point${n > 1 ? 's' : ''}`;
        // « d'Impulsion », pas « de Impulsion ».
        const deLa = /^[aeiouyhàâéèêëîïôöùûü]/i.test(ressource.label) ? `d'${ressource.label}` : `de ${ressource.label}`;
        avertissements.push(choisi > 0
            ? `${pts(choisi)} payé${choisi > 1 ? 's' : ''} en ${nomDuReport} par choix${manque > 0 ? `, ${pts(manque)} ${deLa} manquant${manque > 1 ? 's' : ''}` : ''} : ${nomDuReport} augmente de ${ventilation.reporte}.`
            : `${pts(ventilation.reporte)} ${deLa} manquant${ventilation.reporte > 1 ? 's' : ''} : ${nomDuReport} augmente d'autant.`);
        return {
            etat: report.etat,
            mouvements: [...mouvements, ...report.mouvements],
            perdu: report.perdu,
            avertissements: [...avertissements, ...report.avertissements],
        };
    }

    if (ventilation.impaye > 0) {
        avertissements.push(
            `${ressource.label} : ${ventilation.impaye} point${ventilation.impaye > 1 ? 's' : ''} non payé${ventilation.impaye > 1 ? 's' : ''}, la réserve est au plancher.`,
        );
    }

    return { etat: suivant, mouvements, perdu: 0, avertissements };
}

/**
 * Ajoute à une réserve, en signalant ce que le plafond refuse — ou en la
 * faisant déborder, si elle le déclare.
 */
export function gagner(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    id: string,
    montant: number,
): ResultatDeMouvement {
    return gagnerEnCascade(ressources, etat, id, montant, []);
}

/**
 * `traversees` : les réserves qui ont déjà débordé dans cette cascade. Une
 * boucle déclarée (A déborde dans B, B dans A) s'arrête là où elle revient —
 * la réserve plafonne alors normalement — au lieu de tourner sans fin.
 */
function gagnerEnCascade(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    id: string,
    montant: number,
    traversees: string[],
): ResultatDeMouvement {
    const demande = Math.max(0, Math.floor(montant));
    const ressource = ressources.find(r => r.id === id);
    if (!ressource) {
        return {
            etat: { ...etat },
            mouvements: [],
            perdu: 0,
            avertissements: [`« ${id} » n'est pas une ressource de ce système.`],
        };
    }

    const avant = valeurDe(ressources, etat, id);

    const { debordement } = ressource;
    const max = plafondDe(ressources, etat, ressource);
    if (debordement && max !== undefined && max > ressource.min && !traversees.includes(id)) {
        // Goutte à goutte : chaque fois que la jauge touche son seuil, elle se
        // vide, et ce qui reste du gain continue de la remplir.
        let valeur = avant;
        let restant = demande;
        let fois = 0;
        while (restant > 0) {
            if (valeur >= max) {
                valeur = ressource.min;
                fois++;
                continue;
            }
            const pris = Math.min(max - valeur, restant);
            valeur += pris;
            restant -= pris;
            if (valeur >= max) {
                valeur = ressource.min;
                fois++;
            }
        }

        const suivant = { ...etat, [id]: valeur };
        const mouvements: MouvementDeReserve[] = valeur === avant ? [] : [{ ressourceId: id, delta: valeur - avant }];
        if (fois === 0) return { etat: suivant, mouvements, perdu: 0, avertissements: [] };

        const gain = fois * Math.max(1, Math.floor(debordement.gain ?? 1));
        const suite = gagnerEnCascade(ressources, suivant, debordement.vers, gain, [...traversees, id]);
        const cible = ressources.find(r => r.id === debordement.vers);
        const dit = `${ressource.label} atteint ${max}${fois > 1 ? ` ${fois} fois` : ''} : la jauge se vide, `
            + `${cible?.label ?? debordement.vers} +${gain} → ${valeurDe(ressources, suite.etat, debordement.vers)}.`;
        return {
            etat: suite.etat,
            mouvements: [...mouvements, ...suite.mouvements],
            perdu: suite.perdu,
            avertissements: [dit, ...suite.avertissements],
        };
    }

    const apres = max === undefined ? avant + demande : Math.min(max, avant + demande);
    const gagne = apres - avant;
    const perdu = demande - gagne;

    const avertissements: string[] = [];
    if (perdu > 0) {
        avertissements.push(
            `${ressource.label} plafonne à ${max} : ${perdu} point${perdu > 1 ? 's' : ''} perdu${perdu > 1 ? 's' : ''}.`,
        );
    }

    return {
        etat: { ...etat, [id]: apres },
        mouvements: gagne > 0 ? [{ ressourceId: id, delta: gagne }] : [],
        perdu,
        avertissements,
    };
}

/** Pose une réserve à une valeur choisie, en la ramenant dans ses bornes. */
export function fixer(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    id: string,
    valeur: number,
): ResultatDeMouvement {
    const ressource = ressources.find(r => r.id === id);
    if (!ressource) {
        return {
            etat: { ...etat },
            mouvements: [],
            perdu: 0,
            avertissements: [`« ${id} » n'est pas une ressource de ce système.`],
        };
    }
    const avant = valeurDe(ressources, etat, id);
    const plafond = plafondDe(ressources, etat, ressource);
    const borne = Math.max(ressource.min, plafond === undefined ? valeur : Math.min(plafond, valeur));
    return {
        etat: { ...etat, [id]: borne },
        mouvements: borne === avant ? [] : [{ ressourceId: id, delta: borne - avant }],
        perdu: 0,
        avertissements: [],
    };
}

/**
 * L'érosion de fin de scène, sur toutes les réserves qui en déclarent une.
 *
 * **Pourquoi c'est un geste et pas un effet de bord.** « À la fin de la scène
 * active, le groupe doit retirer un point d'Impulsion. » Rien dans
 * l'application ne sait quand une scène se termine — c'est le meneur qui le
 * décide. On lui donne le bouton plutôt que de deviner.
 */
export function finDeScene(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
): ResultatDeMouvement {
    return eroder(ressources, etat, r => r.erosionFinDeScene);
}

/**
 * L'érosion de début de séance — la Menace de NOC perd un point « lors d'une
 * nouvelle soirée de jeu autour de la table, et non in-game ». Un geste du
 * meneur, pour la même raison que la fin de scène : rien ici ne sait qu'une
 * soirée commence.
 */
export function debutDeSeance(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
): ResultatDeMouvement {
    return eroder(ressources, etat, r => r.erosionDebutDeSeance);
}

/** Les réserves qui le déclarent reviennent à leur départ — un nouveau scénario commence. */
export function nouveauScenario(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
): ResultatDeMouvement {
    let courant = { ...etat };
    const mouvements: MouvementDeReserve[] = [];

    for (const r of ressources) {
        if (!r.remiseAuDepartParScenario) continue;
        const avant = valeurDe(ressources, courant, r.id);
        if (avant === r.depart) continue;
        courant = { ...courant, [r.id]: r.depart };
        mouvements.push({ ressourceId: r.id, delta: r.depart - avant });
    }

    return { etat: courant, mouvements, perdu: 0, avertissements: [] };
}

function eroder(
    ressources: RessourceDeTable[],
    etat: EtatDesRessources,
    perte: (r: RessourceDeTable) => number | undefined,
): ResultatDeMouvement {
    let courant = { ...etat };
    const mouvements: MouvementDeReserve[] = [];

    for (const r of ressources) {
        const p = perte(r);
        if (!p) continue;
        const avant = valeurDe(ressources, courant, r.id);
        const apres = Math.max(r.min, avant - p);
        if (apres === avant) continue;
        courant = { ...courant, [r.id]: apres };
        mouvements.push({ ressourceId: r.id, delta: apres - avant });
    }

    return { etat: courant, mouvements, perdu: 0, avertissements: [] };
}
