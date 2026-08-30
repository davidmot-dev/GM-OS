/**
 * **Les dés échelonnés de la famille Year Zero — la lettre décide de la taille.**
 *
 * *Le mur du 2026-08-29, signalé par David à l'écran :* le panneau annonçait
 * « agilite est absent de la fiche » sur un personnage dont le menu affichait
 * « Agilité (B (D10)) ». Le champ était là ; c'est le **pilote** qui composait un
 * seuil là où ce jeu lance deux dés de tailles différentes. Ni `seuil` (une
 * addition) ni `reserve` (des dés tous identiques) ne pouvaient l'exprimer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LES SOURCES DISENT, ET RIEN DE PLUS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `docs/systems/srd-yze/rules/resolution-des-jets.md` et
 * `docs/systems/blade-runner/rules/resolution-des-jets.md`, qui concordent :
 *
 * - **Deux dés de base** : un pour l'attribut, un pour la compétence.
 * - **Six ou plus** sur un dé : une réussite (l'œil).
 * - **Dix ou plus** : deux réussites — *possible seulement sur un D10 ou un D12*,
 *   donc la taille du dé décide de ce qu'il peut rapporter.
 * - L'échelle : **A → D12, B → D10, C → D8, D → D6**.
 * - Bornes : **au plus deux D12**, **au moins un D6**.
 * - Avantage : un troisième dé identique **au plus petit**. Désavantage : on
 *   retire le plus petit. Un seul des deux, jamais les deux.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI L'ÉCHELLE VIT ICI ET PAS DANS LE PILOTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * C'est la leçon de Rêves de Dragons, payée le 2026-08-22 : **aucun nombre du
 * livre n'entre dans un pilote**. Un pilote est forgé par un modèle de langage à
 * partir de fiches de règles ; une table qu'il recopie est une table qu'il peut
 * recopier de travers, sans que rien ne le dise. Le pilote **nomme** l'échelle,
 * elle est transcrite ici, et elle a ses tests.
 */

/** Le nom d'une échelle connue, tel qu'un pilote la désigne. */
export type NomDEchelle = 'yze-lettres';

/**
 * A → D12, B → D10, C → D8, D → D6.
 *
 * Transcrite du SRD (« Dés (de A à D) ») et confirmée mot pour mot par le corpus
 * Blade Runner (« Niveau A : dé à douze faces… »).
 */
const YZE_LETTRES: Record<string, number> = { A: 12, B: 10, C: 8, D: 6 };

const ECHELLES: Record<NomDEchelle, Record<string, number>> = {
    'yze-lettres': YZE_LETTRES,
};

/** Les tailles de dés d'une échelle, de la meilleure à la pire. */
export function taillesDe(echelle: NomDEchelle): number[] {
    return [...new Set(Object.values(ECHELLES[echelle] ?? {}))].sort((a, b) => b - a);
}

/**
 * Le nombre de faces que vaut une valeur de fiche, ou `null`.
 *
 * **Tolérante sur la forme, stricte sur le fond.** La fiche porte `"C (D8)"`,
 * mais elle est saisie à la main et le gabarit de GM-OS accepte du texte libre :
 * `"C"`, `"c"`, `" B (D10) "` disent tous la même chose. On lit **la lettre**,
 * qui est la vérité — le dé écrit à côté n'est que sa conséquence, et une fiche
 * où quelqu'un a tapé « B (D8) » est corrigée au passage plutôt que propagée.
 *
 * *C'est la même décision que pour la table de correspondance des fiches, prise
 * pour la même raison : la règle du jeu fait foi contre la saisie.*
 */
export function facesDuNiveau(valeur: unknown, echelle: NomDEchelle = 'yze-lettres'): number | null {
    const table = ECHELLES[echelle];
    if (!table) return null;

    const brut = String(valeur ?? '').trim().toUpperCase();
    if (!brut) return null;

    const lettre = brut[0];
    return table[lettre] ?? null;
}

/** Un dé de base composé : d'où il vient, et combien de faces il porte. */
export interface DeEchelonne {
    /** Ce que la composante s'appelle — « Attribut », « Compétence ». */
    label: string;
    /** Le champ de la fiche retenu par le joueur. */
    champ: string;
    /** La valeur lue, telle qu'elle est écrite sur la fiche : `"B (D10)"`. */
    niveau: string;
    faces: number;
}

/** Ce que le modificateur du joueur fait à la poignée de dés. */
export type ModificateurDeDes = 'aucun' | 'avantage' | 'desavantage';

/**
 * Applique l'avantage, le désavantage, puis les bornes du livre.
 *
 * **L'ordre compte, et il n'est pas interchangeable.** Le désavantage retire le
 * plus petit dé ; les bornes disent qu'on lance toujours **au moins un dé**.
 * Borner d'abord laisserait un désavantage vider la poignée d'un personnage qui
 * n'a qu'un dé — *et un jet sans dé n'échoue pas, il ne se lance pas.*
 */
export function appliquerLeModificateur(
    des: DeEchelonne[],
    modificateur: ModificateurDeDes,
): DeEchelonne[] {
    if (des.length === 0) return des;

    const trie = [...des].sort((a, b) => a.faces - b.faces);
    const plusPetit = trie[0];

    if (modificateur === 'avantage') {
        // « Ajout d'un troisième dé de base identique au plus faible des deux. »
        return [...des, { ...plusPetit, label: `${plusPetit.label} (avantage)` }];
    }

    if (modificateur === 'desavantage' && des.length > 1) {
        // « Retrait du dé de base le plus faible » — jamais le dernier.
        const rang = des.indexOf(plusPetit);
        return des.filter((_, i) => i !== rang);
    }

    return des;
}

/** Le plafond du livre : au plus deux dés à douze faces. */
export const MAX_D12 = 2;

/**
 * Ramène la poignée dans les bornes, et dit ce qui a été corrigé.
 *
 * *Une correction muette est une règle perdue.* Un joueur qui voit trois D12 sur
 * sa fiche et n'en lance que deux doit savoir pourquoi — sinon il croit à un bug
 * et compte lui-même, ce qui est la pire des issues.
 */
export function bornerLaPoignee(des: DeEchelonne[]): { des: DeEchelonne[]; remarques: string[] } {
    const remarques: string[] = [];
    const douze = des.filter(d => d.faces === 12);

    if (douze.length <= MAX_D12) return { des, remarques };

    /*
      On dégrade les D12 en trop d'un cran plutôt que de les retirer : le livre
      plafonne la TAILLE, il ne réduit pas le nombre de dés lancés.
    */
    const aDegrader = new Set(douze.slice(MAX_D12));
    const bornes = des.map(d => (aDegrader.has(d) ? { ...d, faces: 10 } : d));

    remarques.push(
        `Au plus ${MAX_D12} dés à douze faces : ${aDegrader.size} dé(s) ramené(s) à dix faces.`,
    );
    return { des: bornes, remarques };
}

/**
 * **La poignée finale : le modificateur, puis les bornes. Dans cet ordre.**
 *
 * Ces deux appels vivaient dans `preparerLeJet`, au milieu d'une fonction qui a
 * besoin d'une fiche de personnage. Dice-OS n'en a pas — le meneur y saisit les
 * lettres à la main — et aurait donc dû réécrire la même séquence.
 *
 * *Deux endroits qui appliquent la même règle finissent par ne plus l'appliquer
 * pareil,* et l'écart ne se verrait qu'à un désavantage ou à un troisième D12 :
 * deux cas assez rares pour n'être découverts qu'en séance.
 *
 * L'ordre n'est pas interchangeable. Borner d'abord laisserait un désavantage
 * vider la poignée d'un personnage qui n'a qu'un dé — *et un jet sans dé
 * n'échoue pas, il ne se lance pas.*
 */
export function composerLaPoignee(
    des: DeEchelonne[],
    modificateur: ModificateurDeDes = 'aucun',
): { des: DeEchelonne[]; remarques: string[] } {
    return bornerLaPoignee(appliquerLeModificateur(des, modificateur));
}

/**
 * Une poignée composée à partir de **lettres saisies à la main**, pour un
 * pupitre qui n'a pas de fiche à lire.
 *
 * *Demandé par David le 2026-08-30 : « le système Blade Runner ne se retrouve
 * pas dans Dice-OS ».* Il s'y retrouvait à moitié — le moteur savait résoudre
 * les dés échelonnés, mais faute de fiche, le pupitre lui passait une poignée
 * de **d6**, le plus petit dé de l'échelle. Des réussites plausibles, et le dé
 * à douze faces nulle part. Le meneur nomme désormais les niveaux lui-même.
 *
 * Une lettre inconnue est **écartée en le disant** : une poignée silencieusement
 * amputée lancerait un dé de moins sans que personne ne s'en aperçoive.
 */
export function poigneeDepuisLesLettres(
    niveaux: { label: string; lettre: string }[],
    modificateur: ModificateurDeDes = 'aucun',
    echelle: NomDEchelle = 'yze-lettres',
): { des: DeEchelonne[]; remarques: string[] } {
    const remarques: string[] = [];
    const des: DeEchelonne[] = [];

    for (const { label, lettre } of niveaux) {
        const faces = facesDuNiveau(lettre, echelle);
        if (faces === null) {
            remarques.push(`${label} : « ${lettre} » ne désigne aucun niveau connu (A, B, C ou D).`);
            continue;
        }
        des.push({ label, champ: label, niveau: String(lettre).trim().toUpperCase(), faces });
    }

    const poignee = composerLaPoignee(des, modificateur);
    return { des: poignee.des, remarques: [...remarques, ...poignee.remarques] };
}
