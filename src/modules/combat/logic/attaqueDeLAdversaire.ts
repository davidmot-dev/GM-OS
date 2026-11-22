import type { BestiaireDuJeu, LigneDAttaque, ObjetDuCatalogue } from '../../../types/drivers';
import { equipementsAlien, type RegleDesJetsAlien } from '../../dice/systemes/jetsAlien';
import type { ArmureAlien, CombatAlien } from '../../dice/systemes/combatAlien';
import { entreesDesLignes } from '../../dice/systemes/xenomorphesAlien';

/*
  L'attaque d'un adversaire, en logique pure — chantier § 263 du registre, T3 (19/11/2026),
  spécification `documentation/Planning/2026-11-19-combat-jets-des-adversaires-et-degats.md`.

  Ce fichier ne lance aucun dé et n'écrit aucune santé : il reçoit le dé tiré et rend ce qu'il
  vaut. Les écrivains de la santé restent ceux qui existent (`applyDamage`, `storeApplyImpact`,
  critère C9). Ce qui se tirait déjà est réutilisé : les fourchettes « 1-2 » des lignes du
  bestiaire passent par `entreesDesLignes`, comme le tirage de `XenomorpheAlien.tsx`.
*/

/** Une attaque tirée : le résultat du dé, le nom, ce qu'elle fait. */
export interface AttaqueTiree {
    code: number;
    nom: string;
    effet: string;
}

/** Une entrée de table au format du disque (`pontDesTables`) ou des lignes du bestiaire. */
interface EntreeDAttaque {
    min: number;
    max: number;
    title: string;
    description?: string;
    effect?: string;
}

/**
 * L'entrée qui couvre **exactement** ce dé (C3). Contrairement à `entreeDeLaTable`, qui ramène
 * un total hors bornes sur la première ou la dernière ligne (utile pour la Panique, « 15+ »), une
 * attaque au d6 qu'aucune ligne ne couvre est un trou dans les données : on rend `null` pour que
 * l'écran le dise, au lieu de tirer en silence une autre attaque.
 */
export function attaqueDesEntrees(entrees: readonly EntreeDAttaque[], de: number): AttaqueTiree | null {
    const e = entrees.find(x => de >= x.min && de <= x.max);
    if (!e) return null;
    return { code: de, nom: e.title, effet: [e.description, e.effect].filter(Boolean).join(' — ') };
}

/** Les lignes d'attaques d'une créature du bestiaire (« 1-2 », « 3 », « 5–6 »), tirées au dé. */
export function tirerLAttaque(lignes: readonly LigneDAttaque[], de: number): AttaqueTiree | null {
    return attaqueDesEntrees(entreesDesLignes(lignes), de);
}

/** Ce que l'effet d'une attaque dit de son jet : la réserve, les dégâts s'ils sont écrits. */
export interface ReserveDeLAttaque {
    /** Les dés de base lancés — « huit dés de base ». */
    des: number;
    /** Les dégâts de l'arme — « Dégâts 1 », « Dégâts de 2 ». Absent quand le texte n'en donne pas. */
    degats?: number;
    /** « perforant », « perce-armure » : l'écran le rappelle, la protection reste à arbitrer. */
    perforant: boolean;
    /** « test opposé », « jet opposé » : la cible oppose son jet, ce n'est pas une attaque simple. */
    oppose: boolean;
}

const NOMBRES: Record<string, number> = {
    un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10,
    onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
    'dix-sept': 17, 'dix-huit': 18, 'dix-neuf': 19, vingt: 20,
};
// Les plus longs d'abord : « dix-sept » ne doit pas se lire « dix ».
const NOMBRE = `(\\d+|${Object.keys(NOMBRES).sort((a, b) => b.length - a.length).join('|')})`;
const valeur = (mot: string) => (/^\d+$/.test(mot) ? Number(mot) : NOMBRES[mot]);

/**
 * Lit « N dés de base, Dégâts M » dans l'effet d'une attaque (C3, T11), tel que l'écrivent les
 * bestiaires d'Alien : « neuf dés de base, Dégâts 2 », « Attaque avec dix dés de base, Dégâts de
 * 1 », « Dix dés de base. Si réussi… » (sans dégâts).
 *
 * Seule **la première attaque** de l'effet compte : « huit dés de base, Dégâts 1, contre une
 * victime, puis six dés de base, Dégâts 1, perforant » donne 8 dés, Dégâts 1, non perforant. Les
 * dégâts ne se cherchent qu'avant la réserve suivante, pour qu'une attaque bonus ne prête pas les
 * siens à la première. Rend `null` quand l'effet ne parle d'aucune réserve (« Test d'Esprit pur »).
 */
export function lireLaReserveDeLAttaque(effet: string): ReserveDeLAttaque | null {
    const t = effet.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const m = new RegExp(`\\b${NOMBRE}\\s+des\\s+de\\s+base\\b`).exec(t);
    if (!m) return null;
    const des = valeur(m[1]);
    if (!des) return null;
    const apres = t.slice(m.index + m[0].length);
    const suivante = new RegExp(`\\b${NOMBRE}\\s+des\\b`).exec(apres);
    const segment = suivante ? apres.slice(0, suivante.index) : apres;
    const d = /\bdegats\s+(?:de\s+)?(\d+)/.exec(segment);
    return {
        des,
        ...(d ? { degats: Number(d[1]) } : {}),
        perforant: /perfor|perce-armure|perce armure/.test(segment),
        oppose: /\b(?:test|jet)\s+oppose/.test(t.slice(0, m.index + m[0].length)),
    };
}

/**
 * **Les dégâts d'un coup** au jet à réserve (C2) : les dégâts de l'arme, plus un par réussite au
 * delà de la première. Blade Runner, « RÉUSSITES MULTIPLES » (corpus
 * `degres-de-reussite-et-critiques.md`) ; Alien, « dégâts de base de l'arme plus un par réussite
 * supplémentaire » (corpus `degats-et-types-de-degats.md`).
 *
 * Aucune réussite : le coup manque, 0. Arme inconnue : `null` — on ne devine pas les dégâts, et
 * l'écran dit pourquoi il ne propose rien. Les réussites reçues sont celles qui comptent : au
 * corps à corps de Blade Runner, l'opposition du défenseur reste à l'appelant.
 */
export function degatsDuCoup(degatsDeLArme: number | undefined, reussites: number): number | null {
    if (degatsDeLArme === undefined || !Number.isFinite(degatsDeLArme) || degatsDeLArme < 0) return null;
    if (!Number.isFinite(reussites) || reussites < 1) return 0;
    return Math.trunc(degatsDeLArme) + Math.trunc(reussites) - 1;
}

/** Une arme proposée à « Appliquer à [cible] » : son nom (et sa munition), ses dégâts. */
export interface ArmeProposee {
    libelle: string;
    degats: number;
    /** La catégorie de l'arme au catalogue — « Armes de combat rapproché » ; sa portée chez Alien. */
    categorie?: string;
    /** Alien : ce que l'arme fait de la protection — perce-armure, protection doublée. */
    armure?: ArmureAlien;
    /** Alien : son identifiant parmi les armes de la fiche, pour la choisir au panneau de jet. */
    id?: string;
}

/**
 * **Les armes d'un humain d'Alien, lues sur sa fiche** (T12, 19/11/2026) : les lignes « Armes »,
 * « Dégâts », « Portée » et « Propriétés » que le panneau de jet lit déjà (`equipementsAlien`). Une
 * arme sans dégâts écrits ne se propose pas.
 */
export function armesDeLaFicheAlien(
    pilote: { jet?: { alien?: RegleDesJetsAlien } } | null | undefined,
    valeurs: Record<string, unknown>,
): ArmeProposee[] {
    const regle = pilote?.jet?.alien;
    if (!regle) return [];
    return equipementsAlien(regle, valeurs).flatMap(e => e.degats === undefined ? [] : [{
        id: e.id, libelle: e.nom, degats: e.degats, categorie: e.portee, ...(e.proprietes ? { armure: e.proprietes.armure } : {}),
    }]);
}

/**
 * **Le jet d'attaque proposé à un adversaire de Blade Runner** (T9) quand il n'a pas encore attaqué
 * (sinon c'est sa dernière attaque, T6) : Vigueur + Corps à corps avec une arme de combat
 * rapproché, Agilité + Armes à feu sinon. Sans arme connue, la compétence que porte sa fiche
 * décide (Armes à feu d'abord). `null` : ni arme ni compétence d'attaque — rien de proposé. Le
 * meneur peut toujours changer ; la composition est relue contre la fiche avant d'être proposée.
 */
export function attaqueParDefaut(
    pilote: { jet?: { bladeRunner?: unknown; alien?: { competence: string }; dune?: { competences: string[]; principes: string[] } } } | null | undefined,
    armes: readonly ArmeProposee[],
    valeurs: Record<string, unknown>,
): Record<string, string> | null {
    /*
      Dune (T18) : Combat, plus le principe le plus haut de la fiche. Un PNJ mineur n'a qu'une valeur
      de principe, qui s'ajoute à chaque test (livre, p. 327) : c'est elle. Sans principe chiffré,
      rien n'est proposé — le meneur compose.
    */
    const dune = pilote?.jet?.dune;
    if (dune) {
        if (!dune.competences.includes('combat')) return null;
        const principe = dune.principes
            .map(p => ({ p, v: Number(valeurs[p]) }))
            .filter(x => Number.isFinite(x.v) && x.v > 0)
            .sort((a, b) => b.v - a.v)[0]?.p;
        return principe ? { competence: 'combat', principe } : null;
    }
    /*
      Alien (T12) : Force + Combat rapproché pour une arme au Contact, Agilité + Combat à distance
      sinon ; sans arme, la compétence que l'humain possède (un niveau au-dessus de zéro).
    */
    const alien = pilote?.jet?.alien;
    if (alien) {
        const melee = { attribut: 'force', [alien.competence]: 'combat_rapproche' };
        const tir = { attribut: 'agilite', [alien.competence]: 'combat_a_distance' };
        const premiere = armes[0];
        if (premiere) return /^\s*(contact|engag)/i.test(premiere.categorie ?? '') ? melee : tir;
        if (Number(valeurs.combat_a_distance) > 0) return tir;
        if (Number(valeurs.combat_rapproche) > 0) return melee;
        return null;
    }
    if (!pilote?.jet?.bladeRunner) return null;
    const melee = { attribut: 'vigueur', competence: 'corpsACorps' };
    const tir = { attribut: 'agilite', competence: 'armesAFeu' };
    const premiere = armes[0];
    if (premiere) return /rapproch/i.test(premiere.categorie ?? '') ? melee : tir;
    if (valeurs.armesAFeu !== undefined && valeurs.armesAFeu !== '') return tir;
    if (valeurs.corpsACorps !== undefined && valeurs.corpsACorps !== '') return melee;
    return null;
}

/**
 * **Les armes d'un adversaire du livre, lues au catalogue** (T9, 19/11/2026). La colonne « Armes
 * (catalogue) » du bestiaire (pilote Blade Runner 2.1.0, T8) nomme les objets du catalogue,
 * séparés par « ; ». Une arme qui ne porte pas ses dégâts elle-même (le Blaster PK-D 5223 : ce
 * sont ses munitions qui les portent, rangées sous la même catégorie) propose ses munitions — « Blaster
 * PK-D 5223 — .44 Special », 2. Un nom absent du catalogue, ou sans dégâts, ne propose rien :
 * le meneur saisit.
 */
export function armesDeLAdversaire(
    pilote: { bestiaire?: BestiaireDuJeu; catalogue?: { objets?: readonly ObjetDuCatalogue[] } } | null | undefined,
    creatureId: string | undefined,
): ArmeProposee[] {
    const creature = creatureId ? pilote?.bestiaire?.creatures.find(c => c.id === creatureId) : undefined;
    const noms = String(creature?.valeurs?.armes ?? '').split(';').map(n => n.trim()).filter(Boolean);
    const objets = pilote?.catalogue?.objets ?? [];
    const degatsDe = (o: ObjetDuCatalogue) => {
        const d = Number(o.valeurs?.degats);
        return Number.isFinite(d) && String(o.valeurs?.degats ?? '').trim() !== '' ? d : null;
    };
    return noms.flatMap(nom => {
        const arme = objets.find(o => o.famille === 'arme' && o.nom === nom);
        if (!arme) return [];
        const propres = degatsDe(arme);
        if (propres !== null) return [{ libelle: nom, degats: propres, categorie: arme.categorie }];
        return objets
            .filter(o => o.id !== arme.id && o.famille === 'arme' && !!arme.categorie && o.categorie === arme.categorie && degatsDe(o) !== null)
            .map(o => ({ libelle: `${nom} — ${o.nom}`, degats: degatsDe(o)!, categorie: arme.categorie }));
    });
}

/**
 * **Le coup d'Alien préparé sur la cible** (T12, 19/11/2026). Alien n'applique pas un coup d'un
 * trait : la cible lance d'abord sa Protection (des D6, la moitié contre un perce-armure), puis les
 * dégâts restants s'appliquent (`SanteAlien`, « Préparer ce coup » → « Lancer la Protection » →
 * « Appliquer les dégâts restants »). « Appliquer à [cible] » prépare donc le même `CoupAlien` — la
 * protection lue comme le fait `SanteAlien` (celle du xénomorphe, sinon le champ de la fiche) — et
 * le meneur finit sur la carte de la cible. `null` : un coup y attend déjà, on ne l'écrase pas.
 */
export function preparerLeCoupAlien(
    suivi: CombatAlien,
    coup: { id: string; degats: number; protectionDeLaFiche: number; type: ArmureAlien; origine?: string },
): CombatAlien | null {
    if (suivi.coup && !suivi.coup.applique) return null;
    const protection = suivi.xenomorphe?.protection ?? (Number.isFinite(coup.protectionDeLaFiche) ? Math.max(0, Math.trunc(coup.protectionDeLaFiche)) : 0);
    return {
        ...suivi,
        coup: { id: coup.id, degats: Math.max(0, Math.trunc(coup.degats)), protection, type: coup.type, ...(coup.origine ? { origine: coup.origine } : {}) },
    };
}

/** Ce que « Appliquer à [cible] » enverra, et pourquoi (T7). */
export interface CoupAAppliquer {
    /** Le montant à envoyer ; `null` : rien à envoyer tant qu'il manque une donnée. */
    montant: number | null;
    /** Le calcul, en mots — « arme 2 + 3 succès − 1 = 4, − protection 1 = 3 ». */
    calcul: string;
    /** Ce qui manque ou ce qui s'est passé, quand `montant` ne vaut rien d'utile. */
    raison?: 'rate' | 'arme-inconnue' | 'montant-a-saisir';
}

/**
 * **Le coup qu'un jet d'adversaire inflige à sa cible** (T7, C2, C4). Dans un jeu qui déclare la
 * règle de Year Zero (`regle: 'arme-plus-succes'`, Blade Runner et Alien), un jet à réserve
 * (`compte: 'reussites'`) vaut les dégâts de l'arme plus un par succès au-delà du premier
 * (`degatsDuCoup`) ; aucun succès, le coup manque. Partout ailleurs le jet ne dit pas ses dégâts : le
 * meneur les saisit. Dans les deux cas, la protection de la cible se retire ensuite (le jet de
 * protection de Blade Runner, l'armure d'Alien), sans descendre sous zéro.
 *
 * **§ 267, T0 (22/11/2026)** : la règle vient du jeu (`regleDesDegats`), plus du seul compte en
 * réussites — un jet de Vampire ou de Shadowrun recevait sinon des dégâts de Year Zero, faux.
 */
export function coupAAppliquer(params: {
    resultat: { total: number; successes?: number; compte?: 'reussites' };
    /** La règle des dégâts du jeu (`regleDesDegats`) ; absente, le montant se saisit. */
    regle?: 'arme-plus-succes' | 'porte-du-jeu' | 'montant';
    degatsDeLArme?: number;
    montantSaisi?: number;
    protection?: number;
}): CoupAAppliquer {
    const { resultat, degatsDeLArme, montantSaisi } = params;
    const protection = Number.isFinite(params.protection) ? Math.max(0, Math.trunc(params.protection!)) : 0;
    const moins = (brut: number, debut: string): CoupAAppliquer => protection > 0
        ? { montant: Math.max(0, brut - protection), calcul: `${debut}, − protection ${protection} = ${Math.max(0, brut - protection)}` }
        : { montant: brut, calcul: debut };

    if (params.regle === 'arme-plus-succes' && resultat.compte === 'reussites') {
        const reussites = resultat.successes ?? resultat.total;
        if (!(reussites >= 1)) return { montant: 0, calcul: 'aucun succès : le coup manque', raison: 'rate' };
        const coup = degatsDuCoup(degatsDeLArme, reussites);
        if (coup === null) return { montant: null, calcul: `${reussites} succès : dégâts de l’arme + ${reussites - 1}`, raison: 'arme-inconnue' };
        return moins(coup, `arme ${degatsDeLArme} + ${reussites} succès − 1 = ${coup}`);
    }
    if (montantSaisi === undefined || !Number.isFinite(montantSaisi) || montantSaisi < 0) {
        return { montant: null, calcul: 'ce jet ne dit pas ses dégâts', raison: 'montant-a-saisir' };
    }
    return moins(Math.trunc(montantSaisi), `montant ${Math.trunc(montantSaisi)}`);
}

/**
 * **L'Armure d'un investigateur de Cthulhu Hack, lue sur sa fiche** (T16, 19/11/2026) : les Points
 * d'Armure de chaque pièce de Matériel que le pilote déclare (`jet.cthulhuHack.armures`, champ
 * `materiel_N_pa`), additionnés ; la pièce est nommée par son champ de nom. Une pièce sans PA ne
 * compte pas. « L'Armure réduit les dégâts » (livre, p. 51).
 */
export function armureDeLInvestigateur(
    armures: readonly { nom: string; protection: string }[] | undefined,
    valeurs: Record<string, unknown>,
): { total: number; pieces: { nom: string; pa: number }[] } {
    const pieces = (armures ?? []).flatMap(a => {
        const pa = Math.trunc(Number(valeurs[a.protection]));
        return Number.isFinite(pa) && pa > 0 ? [{ nom: String(valeurs[a.nom] ?? '').trim() || a.protection, pa }] : [];
    });
    return { total: pieces.reduce((n, p) => n + p.pa, 0), pieces };
}

/**
 * **L'Armure d'un adversaire du livre** (T17, C7, 19/11/2026) : la colonne du bestiaire qui joue le
 * rôle `protection` (pilote Cthulhu Hack 1.2.0 : « Points d'Armure »), pour la créature dont le
 * combattant est issu (`origineDuLivre`). « Pour calculer les dégâts infligés, jetez les dés de
 * dégâts et déduisez la valeur des points d'Armure » (livre, p. 51 : la goule à 1 PA perd 5 sur un
 * 6). 0 : un adversaire fabriqué, une créature sans Armure, un bestiaire qui ne la déclare pas.
 */
export function armureDeLAdversaire(
    pilote: { bestiaire?: BestiaireDuJeu } | null | undefined,
    combattant: { origineDuLivre?: { creatureId: string } },
): number {
    const bestiaire = pilote?.bestiaire;
    const colonne = bestiaire?.colonnes.find(c => c.role === 'protection' && c.nature === 'nombre');
    const creature = combattant.origineDuLivre ? bestiaire?.creatures.find(c => c.id === combattant.origineDuLivre!.creatureId) : undefined;
    const pa = colonne && creature ? Math.trunc(Number(creature.valeurs[colonne.id])) : 0;
    return Number.isFinite(pa) && pa > 0 ? pa : 0;
}

/**
 * **La riposte d'un adversaire de Cthulhu Hack** (C6) : le meneur ne lance pas. Le PJ a raté sa
 * Sauvegarde, il subit les dégâts fixes du profil, moins son Armure (et son Couvert). Sur un 20
 * naturel, « il subit deux fois les dégâts de son adversaire, le Couvert et l'Armure s'appliquent
 * normalement » (livre, p. 48) : **les dégâts sont doublés, puis la protection se retire** — décision
 * D5 de David du 19/11/2026, « c'est d'abord les dégâts puis l'armure » (Revolver 4 contre 1 PA :
 * 7). T3 doublait après l'Armure, d'après la fiche de corpus, corrigée depuis.
 *
 * Le 20 naturel ne double rien quand l'adversaire n'attaquait pas (« Absence de riposte ») : c'est
 * à l'appelant de ne pas appeler la riposte dans ce cas.
 */
export function riposteDeCthulhuHack(degatsFixes: number, protection: number, vingtNaturel: boolean): number {
    const fixes = Number.isFinite(degatsFixes) ? Math.max(0, Math.trunc(degatsFixes)) : 0;
    const pare = Number.isFinite(protection) ? Math.max(0, Math.trunc(protection)) : 0;
    return Math.max(0, fixes * (vingtNaturel ? 2 : 1) - pare);
}
