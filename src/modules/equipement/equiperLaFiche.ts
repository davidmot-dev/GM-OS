import type { CatalogueDEquipement, EffetDObjet, FamilleDObjet, GameDriver, ObjetDuCatalogue } from '../../types/drivers';
import type { InventoryItem } from '../../types/player.types';
import { objetsContenus } from './catalogue';

/**
 * « Prendre dans le catalogue » sur la fiche d'un personnage — registre § 203,
 * étape D (02/11/2026). Écran dessiné dans Stitch :
 * `documentation/Planning/stitch/equipement/equipement-fiche.png`.
 *
 * **On écrit dans les champs que le jet lit déjà**, sans en créer : pour Alien,
 * les lignes que relit `equipementsAlien` (`jet.alien.equipement` : noms,
 * bonus, dégâts, portées), les propriétés de `combat.alien.proprietesArmes`, la
 * Protection de `combat.alien.protection`. Le pilote dit quels champs ce sont ;
 * un jeu qui ne les déclare pas n'a pas le bouton.
 *
 * Une arme ajoute **une ligne à chaque champ, au même rang** : `equipementsAlien`
 * apparie les lignes par leur numéro, et un champ plus court que la liste des
 * noms décalerait le bonus d'une arme sur la suivante. Les champs trop courts
 * sont donc complétés de lignes vides avant l'ajout.
 */

/** Les champs de la fiche qu'une famille d'objets remplit, selon le pilote. */
export interface ChampsDEquipement {
    arme?: { noms: string; bonus?: string; degats?: string; portees?: string; proprietes?: string };
    protection?: { valeur: string };
}

export function champsDEquipement(driver: Pick<GameDriver, 'jet' | 'combat'> | undefined): ChampsDEquipement {
    const regle = driver?.jet?.alien;
    const combat = driver?.combat?.alien;
    const champs: ChampsDEquipement = {};
    if (regle?.equipement?.noms) {
        const { noms, bonus, degats, portees } = regle.equipement;
        champs.arme = { noms, bonus, degats, portees, ...(combat?.proprietesArmes ? { proprietes: combat.proprietesArmes } : {}) };
    }
    if (combat?.protection) champs.protection = { valeur: combat.protection };
    return champs;
}

/**
 * La section de la fiche qui reçoit le bouton : celle qui porte le champ des
 * armes, ou de la protection, que le pilote déclare — jamais une section
 * nommée en dur. `null` sans catalogue ou sans ces champs : pas de bouton.
 */
export function sectionDuCatalogue(
    driver: Pick<GameDriver, 'jet' | 'combat' | 'catalogue'> | null | undefined,
    sections: readonly { id: string; fields: readonly { id: string }[] }[] | undefined,
): string | null {
    if (!driver?.catalogue?.objets.length) return null;
    const champs = champsDEquipement(driver);
    const vises = [champs.arme?.noms, champs.protection?.valeur].filter(Boolean);
    return sections?.find(s => s.fields.some(f => vises.includes(f.id)))?.id ?? null;
}

/**
 * Les familles que la fiche sait recevoir — les onglets de la fenêtre. Le
 * matériel n'a pas de champ : il va dans le Sac à dos, quand l'écran sait l'y
 * ranger (étape E, décision de David du 02/11 : *« Sac à dos »*).
 */
export const famillesEquipables = (champs: ChampsDEquipement, avecLeSac = false): FamilleDObjet[] =>
    (['arme', 'protection', 'materiel'] as const).filter(f => (f === 'materiel' ? avecLeSac : champs[f]));

/** Une écriture sur un champ : ce qui est ajouté (une ligne) ou remplacé (une valeur). */
export interface EcritureSurLaFiche {
    champ: string;
    /** « Armes », « Bonus »… : pour l'encadré « Ce qui sera écrit sur la fiche ». */
    role: 'Armes' | 'Bonus' | 'Dégâts' | 'Portée' | 'Propriétés' | 'Protection' | 'Sac à dos';
    /** `sac` : l'objet entre dans le Sac à dos (`champ` y est vide). */
    mode: 'ligne' | 'valeur' | 'sac';
    texte: string;
    /** Pour une valeur remplacée : ce que le champ portait. */
    avant?: string;
    /** Pour le Sac à dos : l'objet y est déjà, on ne le double pas. */
    dejaLa?: boolean;
}

const clef = (texte: string) => texte.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** La valeur d'une colonne repérée par son libellé — « Dégâts » se lit `degats` quel que soit l'identifiant. */
function valeurDeLaColonne(catalogue: CatalogueDEquipement, objet: ObjetDuCatalogue, libelle: string): string {
    const colonne = (catalogue.colonnes[objet.famille] ?? []).find(c => clef(c.libelle) === clef(libelle) || clef(c.id) === clef(libelle));
    const v = colonne ? objet.valeurs[colonne.id] : undefined;
    return v === undefined ? '' : String(v).trim();
}

/** L'objet est-il déjà dans le Sac à dos ? On le reconnaît à sa référence au catalogue. */
const dansLeSac = (sac: readonly InventoryItem[], objet: ObjetDuCatalogue) => sac.some(i => i.properties?.catalogueId === objet.id);

/**
 * Ce que l'objet écrira sur la fiche, sans rien écrire. `fiche` sert à dire ce
 * qu'une Protection remplace. Avec `sac`, la protection et le matériel entrent
 * aussi dans le Sac à dos : c'est là que le jet retrouve ce qui est porté.
 */
export function ecrituresDeLObjet(
    champs: ChampsDEquipement, catalogue: CatalogueDEquipement, objet: ObjetDuCatalogue, fiche: Record<string, unknown>,
    sac?: readonly InventoryItem[],
): EcritureSurLaFiche[] {
    const auSac: EcritureSurLaFiche[] = sac && (objet.famille === 'protection' || objet.famille === 'materiel')
        ? [{ champ: '', role: 'Sac à dos', mode: 'sac', texte: objet.nom, ...(dansLeSac(sac, objet) ? { dejaLa: true } : {}) }]
        : [];
    return [...ecrituresDesChamps(champs, catalogue, objet, fiche), ...auSac];
}

function ecrituresDesChamps(
    champs: ChampsDEquipement, catalogue: CatalogueDEquipement, objet: ObjetDuCatalogue, fiche: Record<string, unknown>,
): EcritureSurLaFiche[] {
    if (objet.famille === 'arme' && champs.arme) {
        const a = champs.arme;
        const bonus = valeurDeLaColonne(catalogue, objet, 'bonus');
        const ecritures: EcritureSurLaFiche[] = [{ champ: a.noms, role: 'Armes', mode: 'ligne', texte: objet.nom }];
        // Un bonus absent s'écrit 0 : c'est ce que le livre veut dire par « – », et ce que lit le jet.
        if (a.bonus) ecritures.push({ champ: a.bonus, role: 'Bonus', mode: 'ligne', texte: bonus || '0' });
        if (a.degats) ecritures.push({ champ: a.degats, role: 'Dégâts', mode: 'ligne', texte: valeurDeLaColonne(catalogue, objet, 'degats') });
        if (a.portees) ecritures.push({ champ: a.portees, role: 'Portée', mode: 'ligne', texte: valeurDeLaColonne(catalogue, objet, 'portee') });
        if (a.proprietes) ecritures.push({ champ: a.proprietes, role: 'Propriétés', mode: 'ligne', texte: (objet.proprietes ?? []).join(', ') });
        return ecritures;
    }
    if (objet.famille === 'protection' && champs.protection) {
        const avant = String(fiche[champs.protection.valeur] ?? '').trim();
        return [{ champ: champs.protection.valeur, role: 'Protection', mode: 'valeur', texte: valeurDeLaColonne(catalogue, objet, 'protection') || '0', avant }];
    }
    return [];
}

const lignes = (v: unknown) => {
    const l = String(v ?? '').split(/\r?\n/);
    while (l.length && !l[l.length - 1].trim()) l.pop();
    return l;
};

/**
 * Applique les écritures et rend **les seuls champs modifiés**, à verser dans
 * les valeurs locales de l'éditeur.
 *
 * Chaque arme (une écriture « Armes » et celles qui la suivent) prend le rang
 * qui suit **le plus long** de ses champs : si le bonus porte déjà une ligne de
 * plus que les noms, l'arme vient après elle. On n'écrase jamais une ligne, et
 * les lignes d'une même arme restent au même rang.
 */
export function appliquerLesEcritures(fiche: Record<string, unknown>, ecritures: readonly EcritureSurLaFiche[]): Record<string, string> {
    const modifies: Record<string, string> = {};
    const lire = (champ: string) => (champ in modifies ? modifies[champ] : fiche[champ]);
    const armes: EcritureSurLaFiche[][] = [];
    for (const e of ecritures) {
        if (e.mode === 'sac') continue;
        if (e.mode === 'valeur') modifies[e.champ] = e.texte;
        else if (e.role === 'Armes' || !armes.length) armes.push([e]);
        else armes[armes.length - 1].push(e);
    }
    for (const arme of armes) {
        const rang = Math.max(...arme.map(e => lignes(lire(e.champ)).length));
        for (const e of arme) {
            const actuelles = lignes(lire(e.champ));
            while (actuelles.length < rang) actuelles.push('');
            actuelles.push(e.texte);
            modifies[e.champ] = actuelles.join('\n');
        }
    }
    return modifies;
}

/** Les objets que l'objet emporte et que la fiche sait recevoir — la CCC5 et son canon. */
export function emportesEquipables(champs: ChampsDEquipement, catalogue: CatalogueDEquipement, objet: ObjetDuCatalogue, avecLeSac = false): ObjetDuCatalogue[] {
    return objetsContenus(catalogue, objet).filter(o => famillesEquipables(champs, avecLeSac).includes(o.famille));
}

/** « ½ » → 0,5 : le poids du livre, en nombre pour le Sac à dos ; 0 quand il ne se lit pas. */
function poidsEnNombre(poids: string | undefined): number {
    const p = (poids ?? '').trim().replace(',', '.');
    const fractions: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75 };
    if (p in fractions) return fractions[p];
    return /^\d+(\.\d+)?$/.test(p) ? Number(p) : 0;
}

/** L'objet tel qu'il entre dans le Sac à dos, relié au catalogue par `properties.catalogueId`. */
export function objetPourLeSac(objet: ObjetDuCatalogue): Omit<InventoryItem, 'id'> {
    return {
        name: objet.nom,
        type: objet.famille === 'protection' ? 'protection' : objet.famille === 'arme' ? 'arme' : 'matériel',
        rarity: 'commun',
        quantity: 1,
        weight: poidsEnNombre(objet.poids),
        description: objet.description ?? '',
        properties: { catalogueId: objet.id },
    };
}

/* ── Étape E : ce que le personnage porte, et ce que le jet en rappelle ───── */

/**
 * Les objets du catalogue que le personnage porte : ceux du Sac à dos reliés au
 * catalogue, et les armes nommées sur la fiche (rapprochées par leur nom, sans
 * accents ni casse). Chaque objet une fois.
 */
export function objetsPortes(
    catalogue: CatalogueDEquipement | undefined, sac: readonly InventoryItem[], champs: ChampsDEquipement, fiche: Record<string, unknown>,
): ObjetDuCatalogue[] {
    if (!catalogue) return [];
    const parId = new Map(catalogue.objets.map(o => [o.id, o]));
    const portes = new Map<string, ObjetDuCatalogue>();
    for (const item of sac) {
        const o = parId.get(String(item.properties?.catalogueId ?? ''));
        if (o) portes.set(o.id, o);
    }
    if (champs.arme) {
        const noms = new Set(lignes(fiche[champs.arme.noms]).map(n => clef(n)).filter(Boolean));
        for (const o of catalogue.objets) if (o.famille === 'arme' && noms.has(clef(o.nom))) portes.set(o.id, o);
    }
    return [...portes.values()];
}

/** Un effet à rappeler au jet : d'où il vient, et une clé stable pour sa case. */
export interface EffetAuJet { cle: string; objet: string; effet: EffetDObjet }

/**
 * Les effets des objets portés qui visent un champ du jet — la compétence ou
 * l'attribut lancés. **Rappelés, jamais appliqués d'office** (décision de David
 * du 02/11) : leur condition se juge à la table.
 */
export function effetsAuJet(portes: readonly ObjetDuCatalogue[], champsDuJet: readonly string[]): EffetAuJet[] {
    const vises = new Set(champsDuJet.filter(Boolean));
    return portes.flatMap(o => (o.effets ?? []).flatMap((effet, i) => (vises.has(effet.cible) ? [{ cle: `${o.id}#${i}`, objet: o.nom, effet }] : [])));
}

/** La somme des effets cochés, pour la réserve de dés. */
export const valeurDesEffetsCoches = (effets: readonly EffetAuJet[], coches: ReadonlySet<string>) =>
    effets.reduce((somme, e) => somme + (coches.has(e.cle) ? e.effet.valeur ?? 0 : 0), 0);
