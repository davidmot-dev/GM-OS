import type { BestiaireDuJeu, LigneDAttaque, ObjetDuCatalogue } from '../../../types/drivers';
import { equipementsAlien, type RegleDesJetsAlien } from '../../dice/systemes/jetsAlien';
import type { ArmureAlien, CombatAlien } from '../../dice/systemes/combatAlien';
import { entreesDesLignes } from '../../dice/systemes/xenomorphesAlien';
import { ajouterALaFormule, degatsNets, lireLaFormule, valeurFixe, type FormuleDeDes, type RegleDeSymbaroum } from '../../dice/systemes/symbaroumRegles';

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
    pilote: { jet?: { bladeRunner?: unknown; alien?: { competence: string }; dune?: { competences: string[]; principes: string[] }; vampire?: unknown;
        coc?: { dommages?: { armes: readonly { attaque: string; nom: string }[] } }; deltaGreen?: unknown; barbarians?: unknown; starTrek?: unknown; argyropee?: unknown } } | null | undefined,
    armes: readonly ArmeProposee[],
    valeurs: Record<string, unknown>,
): Record<string, string> | null {
    // Barbarians of Lemuria (§ 267, T4) : Vigueur + Mêlée, ou Agilité + Tir pour une arme de jet.
    if (pilote?.jet?.barbarians) return attaqueDeBarbarians(valeurs);
    // Star Trek (§ 267, T5) : Maîtrise ou Audace, + Sécurité (p. 290).
    if (pilote?.jet?.starTrek) return attaqueDeStarTrek(valeurs).champs;
    // Argyropée (§ 267, T7) : Combat rapproché, Combat à distance ou Rixe, selon l'arme (p. 48).
    if (pilote?.jet?.argyropee) return attaqueDArgyropee(valeurs).champs;
    // Delta Green (§ 267, T3) : la compétence de la première arme nommée, sinon le combat à mains nues.
    if (pilote?.jet?.deltaGreen) return attaqueDeDeltaGreen(valeurs)?.champs ?? null;
    /*
      COC (§ 267, T2) : l'attaque de la première arme nommée sur la fiche, sinon l'attaque au contact —
      seulement si la fiche porte la valeur : un PNJ sans profil préparé se compose à la main (p. 110-111).
    */
    const coc = pilote?.jet?.coc;
    if (coc) {
        const porte = (champ: string) => valeurs[champ] !== undefined && String(valeurs[champ]).trim() !== '';
        const arme = coc.dommages?.armes.find(a => String(valeurs[a.nom] ?? '').trim() !== '' && porte(a.attaque));
        const champ = arme?.attaque ?? (porte('attaque_au_contact') ? 'attaque_au_contact' : porte('attaque_a_distance') ? 'attaque_a_distance' : null);
        return champ ? { caracteristique: champ } : null;
    }
    // Vampire (§ 267, T1) : le groupement d'attaque d'un antagoniste, ou attribut + compétence.
    if (pilote?.jet?.vampire) return attaqueDeVampire(valeurs)?.champs ?? null;
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
 * **Les armes du catalogue de Vampire** (§ 267, T1, 22/11/2026) : les 18 armes du pilote 2.2.0 et leur
 * « Valeur de dégâts », « +2 » (p. 303-304). Le bestiaire de Vampire ne donne pas d'armes à ses
 * adversaires : toutes sont proposées, rangées selon l'attaque — les armes à feu d'abord pour un tir.
 */
export function armesDuCatalogue(
    pilote: { catalogue?: { objets?: readonly ObjetDuCatalogue[] } } | null | undefined,
    tir = false,
): ArmeProposee[] {
    const armes = (pilote?.catalogue?.objets ?? []).flatMap(o => {
        if (o.famille !== 'arme') return [];
        const brut = String(o.valeurs?.['valeur-de-degats'] ?? o.valeurs?.degats ?? '').trim();
        const d = Number(brut.replace('+', ''));
        return brut !== '' && Number.isFinite(d) ? [{ libelle: o.nom, degats: d, ...(o.categorie ? { categorie: o.categorie } : {}) }] : [];
    });
    const aFeu = (a: ArmeProposee) => /à feu|a feu/i.test(a.libelle);
    return [...armes.filter(a => aFeu(a) === tir), ...armes.filter(a => aFeu(a) !== tir)];
}

/**
 * **L'attaque proposée à un adversaire de Vampire** (§ 267, T1) : son meilleur groupement d'attaque
 * (« Armes à feu 5 », « Mêlée », « Bagarre » — antagonistes simplifiés, p. 370), sinon Dextérité + Armes à
 * feu, Force + Mêlée ou Force + Bagarre, s'il a la compétence. `null` : rien d'offensif sur sa fiche.
 */
export function attaqueDeVampire(valeurs: Record<string, unknown>): { champs: Record<string, string>; tir: boolean } | null {
    const sansAccents = (t: string) => t.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();
    const groupements = Array.from({ length: 9 }, (_, i) => i + 1).flatMap(i => {
        const nom = sansAccents(String(valeurs[`groupement_${i}_nom`] ?? ''));
        const v = Number(valeurs[`groupement_${i}`]);
        if (!(v > 0)) return [];
        const tir = /armes? a feu|\btir\b/.test(nom);
        return tir || /melee|bagarre|combat|griffe|crocs/.test(nom) ? [{ champ: `groupement_${i}`, v, tir }] : [];
    }).sort((a, b) => b.v - a.v);
    if (groupements[0]) return { champs: { attribut: groupements[0].champ }, tir: groupements[0].tir };
    const a = (champ: string) => Number(valeurs[champ]) > 0;
    if (a('armes_a_feu')) return { champs: { attribut: 'dexterite', competence: 'armes_a_feu' }, tir: true };
    if (a('melee')) return { champs: { attribut: 'force', competence: 'melee' }, tir: false };
    if (a('bagarre')) return { champs: { attribut: 'force', competence: 'bagarre' }, tir: false };
    return null;
}

/**
 * **L'attaque proposée à un adversaire de Delta Green** (§ 267, T3, 23/11/2026) : la compétence de la
 * première arme nommée sur sa fiche (`armeN_competence`, « Armes à feu »), et le numéro de cette arme
 * pour la carte de dégâts ; sans arme, « Combat à mains nues » s'il le pratique. `null` : rien à proposer.
 */
export function attaqueDeDeltaGreen(valeurs: Record<string, unknown>): { champs: Record<string, string>; arme?: string } | null {
    const identifiant = (t: string) => t.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    for (let i = 1; i <= 7; i++) {
        const nom = String(valeurs[`arme${i}`] ?? '').trim();
        const competence = identifiant(String(valeurs[`arme${i}_competence`] ?? ''));
        if (nom && competence && valeurs[competence] !== undefined && String(valeurs[competence]).trim() !== '') {
            return { champs: { competence }, arme: String(i) };
        }
    }
    return Number(valeurs.combat_a_mains_nues) > 0 ? { champs: { competence: 'combat_a_mains_nues' } } : null;
}

/** Une arme de la fiche d'Argyropée : son nom, sa formule de dégâts, la compétence qui l'emploie. */
export interface ArmeDArgyropee { index: number; libelle: string; formule: string; competence: 'combat_rapproche' | 'combat_a_distance' | 'rixe' }

const A_DISTANCE_ARGYROPEE = /\barc\b|arbal|arquebus|mousquet|pistolet|fusil|fronde|javel|couteau de lancer/i;
const A_MAINS_NUES = /poing|pied|mains? nues?|tabouret|tesson|improvis|bouteille|chaise|pot de/i;

/**
 * **Les armes d'un adversaire d'Argyropée** (§ 267, T7, 23/11/2026), lues sur les cinq lignes « Arme » de sa
 * fiche. La compétence suit le livre (p. 48) : une arme de jet, de trait ou à feu, Combat à distance — au
 * meneur de passer au Combat rapproché à moins de 3 mètres ; les poings, les pieds et l'improvisé, Rixe ;
 * le reste, Combat rapproché. Sans dégâts écrits, l'improvisé fait 1d4 (p. 48).
 */
export function armesDArgyropee(valeurs: Record<string, unknown>): ArmeDArgyropee[] {
    const armes: ArmeDArgyropee[] = [];
    for (let i = 1; i <= 5; i++) {
        const libelle = String(valeurs[`arme${i}_nom`] ?? '').trim();
        if (!libelle) continue;
        const rixe = A_MAINS_NUES.test(libelle);
        const ecrit = String(valeurs[`arme${i}_degats`] ?? '').trim();
        const formule = lireLaFormule(ecrit) ? ecrit : rixe ? '1d4' : '';
        if (!formule) continue;
        armes.push({ index: i, libelle, formule, competence: rixe ? 'rixe' : A_DISTANCE_ARGYROPEE.test(libelle) ? 'combat_a_distance' : 'combat_rapproche' });
    }
    return armes;
}

/** **L'attaque proposée à un adversaire d'Argyropée** (§ 267, T7) : la compétence de sa première arme ; sans arme, la Rixe (p. 48). */
export function attaqueDArgyropee(valeurs: Record<string, unknown>): { champs: Record<string, string>; arme?: ArmeDArgyropee } {
    const arme = armesDArgyropee(valeurs)[0];
    return { champs: { competence: arme?.competence ?? 'rixe' }, ...(arme ? { arme } : {}) };
}

/** Une pièce de protection d'Argyropée, « X/Y » sur la fiche : X absorbé par coup, Y de résistance restante (p. 52). */
export interface PieceDArgyropee { index: number; nom: string; x: number; y: number; bouclier: boolean }

/** Les protections de la fiche qui portent un « X/Y » ; le casque, sans valeur, ne protège pas des dégâts (p. 52). */
export function protectionsDArgyropee(valeurs: Record<string, unknown>): PieceDArgyropee[] {
    const pieces: PieceDArgyropee[] = [];
    for (let i = 1; i <= 3; i++) {
        const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(String(valeurs[`protection${i}_valeur`] ?? ''));
        if (!m) continue;
        const nom = String(valeurs[`protection${i}_nom`] ?? '').trim() || `Protection ${i}`;
        pieces.push({ index: i, nom, x: Number(m[1]), y: Number(m[2]), bouclier: /bouclier|rondache|targe|pavois|écu\b/i.test(nom) });
    }
    return pieces;
}

/**
 * **Un coup reçu à travers la protection d'Argyropée** (§ 267, T7 ; p. 52). Le bouclier absorbe d'abord, puis
 * l'armure ce qui reste ; chaque pièce atteinte perd 1 de résistance Y, quel que soit le dé ; à 0 elle est
 * hors d'usage et n'absorbe plus. Les dégâts qui ne sont pas d'une arme solide (feu, acide…) passent X mais
 * usent Y ; un coup de poing ou de pied n'use jamais Y. `usures` : les pièces à réécrire, avec leur Y.
 */
export function coupDArgyropee(degats: number, pieces: readonly PieceDArgyropee[], options: { solide: boolean; naturel: boolean }) {
    let reste = Math.max(0, Math.trunc(degats));
    const usures: { index: number; x: number; y: number; nom: string }[] = [];
    const morceaux: string[] = [];
    for (const p of [...pieces].filter(p => p.y > 0).sort((a, b) => Number(b.bouclier) - Number(a.bouclier))) {
        const atteinte = p.bouclier || reste > 0 || usures.length === 0;
        if (!atteinte) break;
        const absorbe = options.solide ? Math.min(reste, p.x) : 0;
        reste -= absorbe;
        if (absorbe) morceaux.push(`− ${p.nom} ${absorbe}`);
        if (!options.naturel) usures.push({ index: p.index, x: p.x, y: p.y - 1, nom: p.nom });
        if (reste <= 0) break;
    }
    return { nets: reste, usures, calcul: morceaux.join(' ') };
}

/** Une arme d'un PNJ de Symbaroum : son nom, ses dégâts écrits, et la valeur fixe qu'il inflige. */
export interface AttaqueDeSymbaroum { libelle: string; formule: string; fixes: number }

/**
 * **Les attaques d'un PNJ de Symbaroum** (§ 267, T6, 23/11/2026), lues sur sa fiche : chaque arme et ses
 * dégâts. Un PNJ ne lance pas : il inflige la **valeur fixe** de la formule, la moitié de la plus haute face
 * de chaque dé (« 1D8 » vaut 4, p. 178) ; un nombre écrit fait foi. La qualité Éventreur ajoute 1 (p. 156).
 */
export function attaquesDeSymbaroum(regle: RegleDeSymbaroum | undefined, valeurs: Record<string, unknown>): AttaqueDeSymbaroum[] {
    return (regle?.armes ?? []).flatMap(a => {
        const libelle = String(valeurs[a.nom] ?? '').trim();
        const ecrit = String(valeurs[a.degats] ?? '').trim();
        const f = lireLaFormule(ecrit);
        if (!libelle || !f) return [];
        const eventreur = /[ée]ventreur/i.test(`${a.qualites ? String(valeurs[a.qualites] ?? '') : ''} ${ecrit}`);
        return [{ libelle, formule: f.texte, fixes: valeurFixe(f) + (eventreur ? 1 : 0) }];
    });
}

/** [Défense ← Précision] : la Défense du PJ, modifiée de 10 moins la Précision du PNJ (p. 164, 174). */
export const defenseContreLePNJ = (defense: number, precisionDuPNJ: number) => Math.trunc(defense) + 10 - Math.trunc(precisionDuPNJ);

/**
 * **La protection qu'un PJ de Symbaroum lance** (§ 267, T6) : les formules de ses armures, additionnées
 * (« 1D6 » pour une armure moyenne). `formule` nulle : rien de lisible sur sa fiche.
 */
export function protectionDeSymbaroum(regle: RegleDeSymbaroum | undefined, valeurs: Record<string, unknown>): { formule: FormuleDeDes | null; libelle: string } {
    let formule: FormuleDeDes | null = null;
    const noms: string[] = [];
    for (const a of regle?.armures ?? []) {
        const ecrit = String(valeurs[a.protection] ?? '').trim();
        if (!lireLaFormule(ecrit)) continue;
        formule = ajouterALaFormule(formule, ecrit);
        noms.push(`${String(valeurs[a.nom] ?? '').trim() || 'Armure'} ${ecrit}`);
    }
    return { formule, libelle: noms.join(', ') };
}

/** Les dégâts d'une riposte de Symbaroum : fixes, +3 sur un 20 en Défense (option, p. 184), moins la protection lancée (p. 167). */
export const riposteDeSymbaroum = (fixes: number, protection: number, echecCritique: boolean) =>
    degatsNets(Math.max(0, Math.trunc(fixes)) + (echecCritique ? 3 : 0), Math.max(0, Math.trunc(protection)));

/**
 * **L'attaque proposée à un PNJ de Star Trek** (§ 267, T5, 23/11/2026) : à distance, Maîtrise + Sécurité,
 * difficulté 2 ; au corps à corps, Audace + Sécurité, difficulté 1 (p. 290). La nature se lit dans le champ
 * « attaques » de sa fiche — une arme à distance (phaseur, disrupteur, fusil, pistolet) l'emporte, puisque
 * le PNJ s'en sert d'abord ; une arme de contact seule fait le corps à corps ; rien d'écrit, le phaseur.
 * La gravité, quand la ligne de l'arme la porte (« Phaseur de type 2 (Distance, 3, …) »), se propose.
 */
export function attaqueDeStarTrek(valeurs: Record<string, unknown>): {
    champs: Record<string, string>; nature: 'melee' | 'distance'; difficulte: number; gravite?: number;
} {
    const texte = String(valeurs.attaques ?? '');
    const distance = /phas|disrupt|fusil|pistolet|distance|tir\b/i.test(texte)
        || !/m[êe]l[ée]e|corps à corps|mains nues|poing|lame|couteau|bat.?leth|[ée]p[ée]e|dague|lirpa/i.test(texte);
    const motif = distance ? /distance\s*[,;:]\s*(\d)/i : /(?:m[êe]l[ée]e|corps à corps)\s*[,;:]\s*(\d)/i;
    const g = motif.exec(texte);
    return {
        champs: { attribut: distance ? 'maitrise' : 'audace', fonction: 'securite' },
        nature: distance ? 'distance' : 'melee', difficulte: distance ? 2 : 1,
        ...(g ? { gravite: Number(g[1]) } : {}),
    };
}

/** Une arme de Barbarians of Lemuria : son nom, ses dégâts écrits (« d6B », « d6+3 »), à distance ou non. */
export interface ArmeDeBarbarians { libelle: string; formule: string; distance: boolean }

const FORMULE_BARBARIANS = /\bd(3|6)\s*([bm])?\s*([+-]\s*\d+)?\s*(?:[x×]\s*(\d+))?\s*$/i;
const A_DISTANCE = /\barc\b|arbal|fronde|javel|jet|lancer|sarbacane/i;

/**
 * **Les armes d'un adversaire de Barbarians** (§ 267, T4, 23/11/2026) : les quatre lignes « Arme » et
 * « Dégâts » de sa fiche, puis un champ « armes » écrit comme la colonne du bestiaire (« Arc long de
 * Tyrus d6, Coutelas d6M+1 »), si une fiche le porte — le bestiaire n'est pas relié à la fiche (Q3).
 * Une arme de jet ou de tir est « à distance ».
 */
export function armesDeBarbarians(valeurs: Record<string, unknown>): ArmeDeBarbarians[] {
    const armes: ArmeDeBarbarians[] = [];
    for (let i = 1; i <= 4; i++) {
        const libelle = String(valeurs[`arme${i}`] ?? '').trim();
        const formule = String(valeurs[`arme${i}_degats`] ?? '').trim();
        if (libelle && FORMULE_BARBARIANS.test(formule)) armes.push({ libelle, formule, distance: A_DISTANCE.test(libelle) });
    }
    for (const morceau of String(valeurs.armes ?? '').split(',')) {
        const m = FORMULE_BARBARIANS.exec(morceau.trim());
        if (!m) continue;
        const libelle = morceau.trim().slice(0, m.index).trim();
        if (libelle) armes.push({ libelle, formule: morceau.trim().slice(m.index).trim(), distance: A_DISTANCE.test(libelle) });
    }
    return armes;
}

/**
 * **L'attaque proposée à un adversaire de Barbarians** (§ 267, T4) : Agilité + Tir pour une première arme
 * de jet ou de tir, Vigueur + Mêlée sinon (p. 62) ; sans arme, l'aptitude la plus haute de sa fiche.
 */
export function attaqueDeBarbarians(valeurs: Record<string, unknown>): Record<string, string> | null {
    const melee = { attribut: 'vigueur', action: 'melee' };
    const tir = { attribut: 'agilite', action: 'tir' };
    const premiere = armesDeBarbarians(valeurs)[0];
    if (premiere) return premiere.distance ? tir : melee;
    const n = (c: string) => (valeurs[c] === undefined || String(valeurs[c]).trim() === '' ? null : Number(valeurs[c]));
    if (n('melee') === null && n('tir') === null) return null;
    return (n('tir') ?? -9) > (n('melee') ?? -9) ? tir : melee;
}

/**
 * **Les dégâts d'un coup de Barbarians** (§ 267, T4) : le dé de l'arme — d3 ; d6 ; d6B, deux d6 dont on
 * garde le meilleur ; d6M, le pire —, son bonus écrit, plus la Vigueur en mêlée ou sa moitié arrondie
 * à l'inférieur à distance et à mains nues, plus 6 pour un Coup dévastateur (p. 49-53, 56-60, 62-63).
 * Les PNJ du livre écrivent leur Vigueur dans le bonus (le barbare tribal, Vigueur 2 : « d6B+2 »,
 * p. 133) et les créatures n'y ajoutent rien, leur « x2 » multipliant le dé (p. 108) : l'appelant
 * décide d'ajouter la Vigueur ou non. `de` rend un d6. `null` : une formule que le livre ne connaît pas.
 */
export function lancerLesDegatsDeBarbarians(
    formule: string, options: { vigueur: number; moitie: boolean; ajouterLaVigueur: boolean; devastateur: boolean }, de: () => number,
): { total: number; calcul: string } | null {
    const m = FORMULE_BARBARIANS.exec(formule.trim());
    if (!m) return null;
    let base: number; let detail: string;
    if (m[1] === '3') { const d = de(); base = Math.ceil(d / 2); detail = `d3 (${base})`; }
    else if (m[2]) {
        const a = de(), b = de();
        base = m[2].toLowerCase() === 'b' ? Math.max(a, b) : Math.min(a, b);
        detail = `d6${m[2].toUpperCase()} (${a}, ${b} → ${base})`;
    } else { base = de(); detail = `d6 (${base})`; }
    const ecrit = m[3] ? Number(m[3].replace(/\s+/g, '')) : 0;
    const fois = m[4] ? Math.max(1, Number(m[4])) : 1;
    const vigueur = options.ajouterLaVigueur ? (options.moitie ? Math.floor(options.vigueur / 2) : options.vigueur) : 0;
    const total = Math.max(0, (base + ecrit) * fois + vigueur + (options.devastateur ? 6 : 0));
    const morceaux = [detail, ecrit ? `${ecrit > 0 ? '+' : '−'} ${Math.abs(ecrit)}` : '', fois > 1 ? `× ${fois}` : '',
        options.ajouterLaVigueur && vigueur ? `${vigueur > 0 ? '+' : '−'} ${options.moitie ? 'moitié de la ' : ''}Vigueur ${Math.abs(vigueur)}` : '',
        options.devastateur ? '+ 6 Coup dévastateur' : ''].filter(Boolean);
    return { total, calcul: `${morceaux.join(' ')} = ${total}` };
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
    regle?: 'arme-plus-succes' | 'marge-plus-arme' | 'de-de-l-arme' | 'porte-du-jeu' | 'montant';
    degatsDeLArme?: number;
    /** Vampire : la marge de réussites du jet (`JetDeVampire.vampire.marge`), 0 sur un échec. */
    marge?: number;
    montantSaisi?: number;
    protection?: number;
}): CoupAAppliquer {
    const { resultat, degatsDeLArme, montantSaisi } = params;
    /*
      **Vampire V5 (§ 267, T1, 22/11/2026)** : « le vainqueur inflige des dégâts égaux à sa marge de
      réussites, plus le bonus d'arme » (p. 126, 303). L'armure ne retire rien : elle change un dégât
      aggravé de lame ou de balle en superficiel — c'est le type choisi à l'application, que
      l'encaissement de Vampire divise ou non (`pistesDeVampire.ts`).
    */
    if (params.regle === 'marge-plus-arme') {
        const marge = Number.isFinite(params.marge) ? Math.trunc(params.marge!) : 0;
        if (marge < 1) return { montant: 0, calcul: 'aucune marge : le coup ne porte pas', raison: 'rate' };
        if (degatsDeLArme === undefined || !Number.isFinite(degatsDeLArme) || degatsDeLArme < 0) {
            return { montant: null, calcul: `marge ${marge} + bonus de l’arme`, raison: 'arme-inconnue' };
        }
        const bonus = Math.trunc(degatsDeLArme);
        return { montant: marge + bonus, calcul: `marge ${marge} + arme ${bonus} = ${marge + bonus}` };
    }
    const protection = Number.isFinite(params.protection) ? Math.max(0, Math.trunc(params.protection!)) : 0;
    const moins = (brut: number, debut: string): CoupAAppliquer => protection > 0
        ? { montant: Math.max(0, brut - protection), calcul: `${debut}, − protection ${protection} = ${Math.max(0, brut - protection)}` }
        : { montant: brut, calcul: debut };

    /*
      **Barbarians of Lemuria (§ 267, T4, 23/11/2026)** : un jet d'attaque raté ne blesse pas ; réussi, le
      dé de l'arme se lance à part (`lancerLesDegatsDeBarbarians`) et son total arrive en montant saisi,
      dont l'armure de la cible se retire (p. 62-63).
    */
    if (params.regle === 'de-de-l-arme' && !((resultat.successes ?? 0) >= 1)) {
        return { montant: 0, calcul: 'attaque manquée : pas de dégâts', raison: 'rate' };
    }
    if (params.regle === 'de-de-l-arme' && (montantSaisi === undefined || !Number.isFinite(montantSaisi))) {
        return { montant: null, calcul: 'lancer les dégâts de l’arme', raison: 'arme-inconnue' };
    }
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
