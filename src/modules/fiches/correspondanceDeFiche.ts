import type { InventoryItem } from '../../types/player.types';

/**
 * **La table de correspondance entre le gabarit de GM-OS et celui de la fiche.**
 *
 * Analyse et conversion pures, sans aucune entrée/sortie : ce module ne connaît
 * ni le pont Electron ni `window`. C'est ce qui permet à
 * `electron/correspondanceDesFiches.test.ts` de le charger dans un programme
 * Node pour éprouver les **vraies** tables du dépôt contre le **vrai** moteur de
 * fiches. Le chargement depuis le disque vit dans `chargerLaCorrespondance.ts`.
 *
 * **Déposer un fichier suffit.**
 *
 * Un jeu qui veut brancher sa fiche pose un `correspondance.json` dans
 * `docs/systems/<jeu>/fiche/`. Même motif que les thèmes, et pour la même
 * raison : `resoudreCorpus` rapproche déjà le dossier du système et le pilote,
 * y compris quand l'identifiant du pilote est un horodatage de la Forge.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UNE TABLE PLATE ET PAS UNE COUCHE D'ABSTRACTION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La mesure du 2026-08-24, faite à la main sur Blade Runner : **48 % de
 * renommages, 52 % d'un seul motif répété dix-sept fois, zéro champ orphelin
 * côté GM-OS**. Un vocabulaire pivot ferait passer de N tables à 2N pour deux
 * consommateurs ; il ne se justifierait qu'à partir d'un troisième.
 *
 * Il manquait exactement **trois capacités**, et elles sont ici :
 *
 * 1. **Composer / décomposer** — `"C (D8)"` d'un côté, `level` + `base_die` de
 *    l'autre. Une transformation, déclarée par son nom, utilisée dix-sept fois.
 * 2. **Traduire une valeur** — `human` ↔ `Humain`. La fiche pose des
 *    identifiants, le gabarit de GM-OS pose des libellés français.
 * 3. **Viser une autre destination que `sheetData`** — les dix-huit champs
 *    d'armes de Blade Runner, qui n'ont aucun équivalent dans `sheetData` parce
 *    que GM-OS tient les armes dans `inventoryItems`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * UNE TABLE EST UNE DEUXIÈME DÉCLARATION DE LA MÊME VÉRITÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Donc une occasion de diverger, en silence. Le GPT régénère une fiche, renomme
 * une clé, et la table pointe dans le vide sans que rien ne le dise — c'est
 * exactement ce qui vient d'arriver au typage des dix-sept `.level`, corrigé le
 * 24/08 dans la fiche autonome et **jamais** dans le moteur.
 *
 * `verifierLaCorrespondance` existe pour ça, et elle regarde **dans les deux
 * sens** : aucune clé citée qui n'existe pas, et aucune clé de la fiche qui ne
 * soit pas citée. Le second sens est celui qui attrape un champ **ajouté**.
 */

/** Les quatre niveaux de Blade Runner et leur dé. C'est la règle du jeu. */
const DES_PAR_NIVEAU: Record<string, string> = { A: 'D12', B: 'D10', C: 'D8', D: 'D6' };
const NIVEAUX_PAR_DE: Record<string, string> = Object.fromEntries(
    Object.entries(DES_PAR_NIVEAU).map(([niveau, de]) => [de, niveau]),
);

/**
 * Une transformation entre **une** valeur de GM-OS et **deux** clés de la fiche.
 *
 * Les deux sens sont déclarés ensemble, dans le même objet : séparés, ils
 * auraient fini par ne plus décrire la même règle.
 */
export interface Transformation {
    /** GM-OS → fiche. */
    decomposer(valeur: unknown): [unknown, unknown];
    /** Fiche → GM-OS. */
    composer(premiere: unknown, seconde: unknown): unknown;
}

/**
 * `"C (D8)"` ↔ `level: "C"` + `base_die: "D8"`.
 *
 * **La lettre détermine le dé**, et c'est la règle du jeu, pas une convention de
 * fiche : on ne recopie donc jamais un dé, on le dérive. Une fiche où quelqu'un
 * aurait tapé « B (D8) » est corrigée au passage plutôt que propagée.
 *
 * Le dé sert quand même de repli dans l'autre sens : une fiche à moitié remplie
 * — le dé coché, la lettre oubliée — rend tout de même un niveau.
 */
export const NIVEAU_ET_DE: Transformation = {
    decomposer(valeur) {
        const niveau = lireLeNiveau(valeur);
        if (!niveau) return ['', ''];
        return [niveau, DES_PAR_NIVEAU[niveau]];
    },
    composer(premiere, seconde) {
        const niveau = lireLeNiveau(premiere) ?? NIVEAUX_PAR_DE[String(seconde ?? '').trim().toUpperCase()];
        if (!niveau) return '';
        return `${niveau} (${DES_PAR_NIVEAU[niveau]})`;
    },
};

/**
 * La lettre d'une valeur de niveau, quelle que soit la forme reçue.
 *
 * On accepte `"C (D8)"`, `"C(D8)"` et `"C"` : la fiche est saisie à la main, et
 * refuser une forme lisible par un humain n'aurait servi personne.
 */
function lireLeNiveau(valeur: unknown): string | null {
    const brut = String(valeur ?? '').trim().toUpperCase();
    if (!brut) return null;
    const lettre = brut[0];
    return lettre in DES_PAR_NIVEAU ? lettre : null;
}

/** Les transformations que le format connaît, par le nom qu'une table emploie. */
export const TRANSFORMATIONS: Record<string, Transformation> = {
    niveauEtDe: NIVEAU_ET_DE,
};

/**
 * **Les champs du personnage qu'une table a le droit de viser.**
 *
 * Tout ce que GM-OS sait d'un PJ ne vit pas dans `sheetData` : la Description,
 * les notes et l'inventaire en texte libre sont posés **sur le personnage
 * lui-même**. Une fiche qui porte « Apparence » doit pouvoir y descendre.
 *
 * **C'est une liste close, et ce n'est pas de la prudence décorative.** Sans
 * elle, un `correspondance.json` — un fichier de données, pas du code relu —
 * pourrait écrire dans `id`, `hp` ou `campaignId` et rendre un personnage
 * incohérent sans qu'aucune erreur ne soit levée. Ces quatre-là sont du texte
 * libre : les écraser est réparable, pas les autres.
 */
export const CHAMPS_DU_PERSONNAGE = ['description', 'gmNotes', 'playerNotes', 'inventory'] as const;

/** Où GM-OS range la valeur : dans la fiche, ou sur le personnage. */
export type DestinationGmOs = 'sheetData' | 'personnage';

/** Une correspondance de champ à champ. */
export interface ChampCorrespondu {
    /** L'identifiant du champ dans le gabarit de GM-OS. */
    gmos: string;
    /** La clé de la fiche, ou **deux** clés quand une transformation les compose. */
    fiche: string | [string, string];
    /**
     * `sheetData` par défaut — un champ du gabarit. `personnage` vise un des
     * `CHAMPS_DU_PERSONNAGE`, qui vivent en dehors de la fiche.
     */
    destination?: DestinationGmOs;
    /** Le nom d'une entrée de `TRANSFORMATIONS`. Obligatoire si `fiche` est une paire. */
    transforme?: string;
    /** Traduction des valeurs, **de la fiche vers GM-OS**. Inversée pour l'autre sens. */
    valeurs?: Record<string, string>;
}

/**
 * Un groupe de champs de la fiche qui devient une **liste d'objets** côté GM-OS.
 *
 * La fiche imprime des emplacements numérotés — `weapons.0`, `weapons.1`… — et
 * GM-OS tient ces objets dans `inventoryItems`. La règle est celle de l'ordre :
 * l'emplacement *n* de la fiche est le *n*-ième objet du `type` déclaré.
 * *Pour ces objets-là, la fiche fait foi.*
 *
 * Ce qui n'est pas de ce type, et ce qui dépasse le nombre d'emplacements
 * imprimés, n'est jamais touché : une quatrième arme ramassée dans GM-OS ne
 * disparaît pas parce que la fiche n'a que trois lignes.
 */
export interface ObjetsCorrespondus {
    /** La seule destination connue à ce jour. */
    destination: 'inventoryItems';
    /** Le préfixe des clés de la fiche : `weapons`, pour `weapons.0.name`. */
    prefixe: string;
    /** Les emplacements que la fiche imprime. */
    emplacements: number[];
    /** Le `type` posé sur les objets, et celui qu'on relit pour les retrouver. */
    type: string;
    /** Le champ de la fiche qui **nomme** l'objet. */
    nom: string;
    /** Les autres champs : clé de la fiche → nom dans `properties`. */
    proprietes: Record<string, string>;
}

/** Une clé de la fiche que GM-OS ignore, et la raison — pas un oubli, une décision. */
export interface ChampAbsent {
    fiche: string;
    pourquoi: string;
}

/** La table entière, telle qu'un `correspondance.json` la déclare. */
export interface CorrespondanceDeFiche {
    version: number;
    /** L'identifiant du gabarit côté moteur — c'est lui que le contrôle vérifie. */
    gabaritDeLaFiche: string;
    champs: ChampCorrespondu[];
    objets?: ObjetsCorrespondus[];
    absents?: ChampAbsent[];
}

/** Le chemin, relatif à `docs/`, de la correspondance d'un système. */
export function cheminDeLaCorrespondance(racine: string): string {
    return `${racine}/fiche/correspondance.json`;
}

/**
 * Lit une table depuis son texte.
 *
 * Rend `null` et **dit pourquoi** : une table illisible n'est pas le cas normal,
 * contrairement à un jeu sans thème. *Un absent silencieux, un incident
 * bruyant* — ici c'est un incident.
 */
export function lireLaCorrespondance(json: string, quoi = 'correspondance'): CorrespondanceDeFiche | null {
    try {
        const table = JSON.parse(json) as CorrespondanceDeFiche;
        if (!table || typeof table !== 'object' || !Array.isArray(table.champs)) {
            console.error(`[Correspondance] « ${quoi} » ne déclare pas de tableau « champs ».`);
            return null;
        }
        if (table.version !== 1) {
            console.error(`[Correspondance] « ${quoi} » est en version ${table.version}, attendue 1.`);
            return null;
        }
        return table;
    } catch (err) {
        console.error(`[Correspondance] « ${quoi} » illisible :`, err);
        return null;
    }
}

/** Toutes les clés de la fiche qu'une entrée de champ cite. */
export function clesDeLaFiche(champ: ChampCorrespondu): string[] {
    return Array.isArray(champ.fiche) ? [...champ.fiche] : [champ.fiche];
}

/** Toutes les clés de la fiche qu'un groupe d'objets cite, emplacement par emplacement. */
export function clesDesObjets(groupe: ObjetsCorrespondus): string[] {
    const suffixes = [groupe.nom, ...Object.keys(groupe.proprietes)];
    return groupe.emplacements.flatMap(n => suffixes.map(s => `${groupe.prefixe}.${n}.${s}`));
}

/** Un défaut relevé sur une table. */
export interface DefautDeCorrespondance {
    gravite: 'erreur' | 'avertissement';
    message: string;
}

/**
 * **Le contrôle qui garde la table vraie.**
 *
 * Il regarde dans les deux sens, et le second est celui qui compte :
 *
 * - aucune clé citée qui n'existe pas dans la fiche — sinon la table écrit dans
 *   le vide, et l'écran ne montre rien sans qu'aucune erreur ne soit levée ;
 * - **aucune clé de la fiche qui ne soit citée** — ni en champ, ni en objet, ni
 *   en absent motivé. C'est ce sens-là qui attrape un champ *ajouté* par une
 *   régénération, le cas qu'on ne peut pas voir autrement.
 *
 * Les identifiants de GM-OS sont facultatifs parce qu'ils ne sont **pas sur le
 * disque** : le gabarit Blade Runner vient de la Forge et vit dans la base de
 * session. Le contrôle du dépôt ne peut donc vérifier que le côté fiche ; le
 * côté GM-OS se vérifie à l'exécution, contre le gabarit résolu — et en
 * avertissement, parce qu'un gabarit en cours d'enrichissement n'est pas une
 * panne.
 */
export function verifierLaCorrespondance(
    table: CorrespondanceDeFiche,
    clesConnues: Iterable<string>,
    idsGmOsConnus?: Iterable<string>,
): DefautDeCorrespondance[] {
    const defauts: DefautDeCorrespondance[] = [];
    const erreur = (message: string) => defauts.push({ gravite: 'erreur', message });
    const avertir = (message: string) => defauts.push({ gravite: 'avertissement', message });

    const dansLaFiche = new Set(clesConnues);
    const citees = new Set<string>();
    const vues = new Set<string>();

    const citer = (cle: string, ou: string) => {
        if (!dansLaFiche.has(cle)) erreur(`${ou} : la clé « ${cle} » n'existe pas dans le gabarit de la fiche.`);
        if (citees.has(cle)) erreur(`${ou} : la clé « ${cle} » est citée deux fois.`);
        citees.add(cle);
    };

    for (const champ of table.champs) {
        const ou = `champ « ${champ.gmos} »`;
        const destination = champ.destination ?? 'sheetData';

        if (!champ.gmos) erreur(`${ou} : identifiant GM-OS manquant.`);
        // Deux destinations différentes peuvent porter le même nom sans se gêner.
        const signature = `${destination}:${champ.gmos}`;
        if (vues.has(signature)) erreur(`${ou} : cet identifiant GM-OS est déclaré deux fois.`);
        vues.add(signature);

        if (destination !== 'sheetData' && destination !== 'personnage') {
            erreur(`${ou} : destination « ${destination} » inconnue.`);
        }
        if (destination === 'personnage' && !(CHAMPS_DU_PERSONNAGE as readonly string[]).includes(champ.gmos)) {
            erreur(
                `${ou} : « ${champ.gmos} » n'est pas un champ du personnage. `
                + `Les seuls autorisés sont ${CHAMPS_DU_PERSONNAGE.join(', ')}.`,
            );
        }

        const paire = Array.isArray(champ.fiche);
        if (paire && !champ.transforme) erreur(`${ou} : deux clés de fiche sans transformation.`);
        if (champ.transforme && !paire) erreur(`${ou} : une transformation demande deux clés de fiche.`);
        if (champ.transforme && !TRANSFORMATIONS[champ.transforme]) {
            erreur(`${ou} : transformation « ${champ.transforme} » inconnue.`);
        }

        if (champ.valeurs) {
            // Une traduction qui n'est pas inversible rendrait l'aller-retour
            // ambigu : deux valeurs de fiche pour une seule valeur de GM-OS.
            const arrivees = Object.values(champ.valeurs);
            if (new Set(arrivees).size !== arrivees.length) {
                erreur(`${ou} : la traduction de valeurs n'est pas inversible.`);
            }
        }

        for (const cle of clesDeLaFiche(champ)) citer(cle, ou);
    }

    for (const groupe of table.objets ?? []) {
        const ou = `objets « ${groupe.prefixe} »`;
        if (groupe.destination !== 'inventoryItems') erreur(`${ou} : destination « ${groupe.destination} » inconnue.`);
        for (const cle of clesDesObjets(groupe)) citer(cle, ou);
    }

    for (const absent of table.absents ?? []) {
        citer(absent.fiche, 'absents');
        if (!absent.pourquoi?.trim()) erreur(`absents : « ${absent.fiche} » ne dit pas pourquoi.`);
    }

    for (const cle of dansLaFiche) {
        if (!citees.has(cle)) {
            erreur(`la fiche porte « ${cle} », que la table ne cite nulle part — ni champ, ni objet, ni absent motivé.`);
        }
    }

    if (idsGmOsConnus) {
        const dansGmOs = new Set(idsGmOsConnus);
        for (const champ of table.champs) {
            if (!dansGmOs.has(champ.gmos)) {
                avertir(`le gabarit de GM-OS n'a pas de champ « ${champ.gmos} » ; la table le cite.`);
            }
        }
    }

    return defauts;
}

/** Ce qu'une conversion lit et écrit côté GM-OS. */
export interface CotesGmOs {
    sheetData: Record<string, unknown>;
    /** Les `CHAMPS_DU_PERSONNAGE` — Description, notes, inventaire en texte. */
    narratif?: Record<string, unknown>;
    inventoryItems?: InventoryItem[];
}

/** L'inverse d'une traduction de valeurs, GM-OS → fiche. */
function inverser(valeurs: Record<string, string>): Record<string, string> {
    return Object.fromEntries(Object.entries(valeurs).map(([fiche, gmos]) => [gmos, fiche]));
}

/**
 * **GM-OS → la fiche.** Rend le lot à envoyer par `set`.
 *
 * Une valeur absente est écrite vide plutôt qu'omise : sans ça, effacer un champ
 * dans GM-OS laisserait l'ancienne valeur affichée sur la fiche — la donnée
 * juste et l'écran menteur, une fois de plus.
 */
export function versLaFiche(personnage: CotesGmOs, table: CorrespondanceDeFiche): Record<string, unknown> {
    const lot: Record<string, unknown> = {};

    for (const champ of table.champs) {
        const source = champ.destination === 'personnage' ? personnage.narratif : personnage.sheetData;
        let valeur = source?.[champ.gmos];
        if (champ.valeurs) {
            const versFiche = inverser(champ.valeurs);
            valeur = versFiche[String(valeur ?? '')] ?? valeur;
        }

        if (Array.isArray(champ.fiche)) {
            const transformation = TRANSFORMATIONS[champ.transforme ?? ''];
            if (!transformation) continue;
            const [a, b] = transformation.decomposer(valeur);
            lot[champ.fiche[0]] = a;
            lot[champ.fiche[1]] = b;
        } else {
            lot[champ.fiche] = valeur ?? '';
        }
    }

    for (const groupe of table.objets ?? []) {
        const objets = (personnage.inventoryItems ?? []).filter(o => o.type === groupe.type);
        groupe.emplacements.forEach((n, rang) => {
            const objet = objets[rang];
            lot[`${groupe.prefixe}.${n}.${groupe.nom}`] = objet?.name ?? '';
            for (const [cleFiche, propriete] of Object.entries(groupe.proprietes)) {
                lot[`${groupe.prefixe}.${n}.${cleFiche}`] = objet?.properties?.[propriete] ?? '';
            }
        });
    }

    return lot;
}

/**
 * **La fiche → GM-OS.** Rend ce qu'il faut écrire, et rien d'autre.
 *
 * `inventoryItems` n'est rendu que si la table déclare des objets : sans ça, une
 * table sans bloc `objets` **effacerait** l'inventaire du personnage à chaque
 * remontée. L'appelant doit pouvoir distinguer « rien à dire » de « liste vide ».
 */
export function versGmOs(
    donnees: Record<string, unknown>,
    table: CorrespondanceDeFiche,
    inventaireActuel: InventoryItem[] = [],
): CotesGmOs {
    const sheetData: Record<string, unknown> = {};
    const narratif: Record<string, unknown> = {};
    let ilYADuNarratif = false;

    for (const champ of table.champs) {
        let valeur: unknown;

        if (Array.isArray(champ.fiche)) {
            const transformation = TRANSFORMATIONS[champ.transforme ?? ''];
            if (!transformation) continue;
            valeur = transformation.composer(donnees[champ.fiche[0]], donnees[champ.fiche[1]]);
        } else {
            valeur = donnees[champ.fiche];
        }

        if (champ.valeurs) valeur = champ.valeurs[String(valeur ?? '')] ?? valeur;

        if (champ.destination === 'personnage') {
            narratif[champ.gmos] = valeur ?? '';
            ilYADuNarratif = true;
        } else {
            sheetData[champ.gmos] = valeur ?? '';
        }
    }

    /*
      `narratif` n'est rendu que si la table en parle — même règle que
      `inventoryItems`, et pour la même raison : l'appelant doit pouvoir
      distinguer « rien à dire » de « tout est vide ».
    */
    const cote: CotesGmOs = ilYADuNarratif ? { sheetData, narratif } : { sheetData };

    const groupes = table.objets ?? [];
    if (groupes.length === 0) return cote;

    /*
      On reconstruit **par type**, en place. Les objets d'un autre type ne
      bougent pas, et ceux qui dépassent le nombre d'emplacements imprimés
      restent : la fiche de Blade Runner a trois lignes d'armes, ce n'est pas une
      raison pour perdre la quatrième ramassée en jeu.

      L'identifiant du n-ième objet existant est conservé — c'est lui qui rend
      l'aller-retour stable, et qui évite qu'un transfert d'objet vise un
      identifiant disparu entre deux frappes.
    */
    let inventaire = [...inventaireActuel];

    for (const groupe of groupes) {
        const anciens = inventaire.filter(o => o.type === groupe.type);
        const refaits: InventoryItem[] = [];

        groupe.emplacements.forEach((n, rang) => {
            const nom = String(donnees[`${groupe.prefixe}.${n}.${groupe.nom}`] ?? '').trim();
            const ancien = anciens[rang];
            if (!nom) return;

            const properties: InventoryItem['properties'] = { ...(ancien?.properties ?? {}) };
            for (const [cleFiche, propriete] of Object.entries(groupe.proprietes)) {
                properties[propriete] = String(donnees[`${groupe.prefixe}.${n}.${cleFiche}`] ?? '');
            }

            refaits.push({
                ...(ancien ?? {
                    rarity: 'common', weight: 0, quantity: 1, description: '',
                }),
                id: ancien?.id ?? `${groupe.prefixe}-${n}-${Date.now()}-${rang}`,
                name: nom,
                type: groupe.type,
                properties,
            } as InventoryItem);
        });

        // Ce que la fiche n'imprime pas survit, à la fin de son propre type.
        const survivants = anciens.slice(groupe.emplacements.length);
        const autres = inventaire.filter(o => o.type !== groupe.type);
        inventaire = [...autres, ...refaits, ...survivants];
    }

    return { ...cote, inventoryItems: inventaire };
}
