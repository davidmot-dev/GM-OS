import type { BestiaireDuJeu, CatalogueDEquipement } from '../../../types/drivers';
import type { Combatant } from '../types';
import { lireLesDegats, lireLesTraits, type DesDeDegats, type TraitsDeLArme } from '../../dice/systemes/degatsDeTraveller';
import { mdDeCaracteristique } from '../../dice/systemes/traveller';

/**
 * **Ce que Combat-OS lit d'un combattant de Traveller pour une attaque** — TRV-A2, 27/11/2026
 * (spécification `2026-11-27-traveller-jets-demandes-et-degats.md`, T4, C8 et C10).
 *
 * - les **armes** de la fiche (lignes « Arme N », « dégâts », « portée ») ; leurs **traits**, que la
 *   fiche imprimée n'a pas, se retrouvent au catalogue du pilote par le nom ;
 * - la **protection** de la cible : la meilleure de ses armures (décision de David du 27/11 : « la
 *   meilleure, modifiable »), ou le trait « Armure (+X) » d'un animal (p. 81) ;
 * - l'**attaque d'un animal** : « Attaques : Morsure (4D) » (p. 81), lancée avec sa compétence
 *   Mêlée (naturelles), dont le livre donne le MD.
 */

/** Une arme de la fiche, prête pour la carte des dégâts. */
export interface ArmeDeTraveller {
    /** Rang sur la fiche (1 à 6), ou 0 pour une attaque d'animal. */
    index: number;
    libelle: string;
    degats: DesDeDegats;
    /** Le texte écrit, « 3D-3 », pour l'afficher tel quel. */
    texteDesDegats: string;
    /** Mêlée : le MD de FOR s'ajoute (p. 74). */
    melee: boolean;
    traits: TraitsDeLArme;
}

const MELEE = /m[êe]l[ée]e|contact|corps\s*à\s*corps/i;
/** « Bâton incapacitant » et « baton-incapacitant » sont la même arme. */
const normaliser = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** L'arme du catalogue qui porte ce nom, s'il y en a une. */
function auCatalogue(nom: string, catalogue: CatalogueDEquipement | undefined) {
    const cle = normaliser(nom);
    return catalogue?.objets.find(o => o.famille === 'arme' && normaliser(o.nom) === cle);
}

/** **Les armes de la fiche.** Une ligne sans dégâts lisibles (ni sur la fiche, ni au catalogue) ne se propose pas. */
export function armesDeTraveller(valeurs: Record<string, unknown>, catalogue?: CatalogueDEquipement): ArmeDeTraveller[] {
    const armes: ArmeDeTraveller[] = [];
    for (let i = 1; i <= 6; i++) {
        const libelle = String(valeurs[`arme_${i}`] ?? '').trim();
        if (!libelle) continue;
        const objet = auCatalogue(libelle, catalogue);
        const ecrit = String(valeurs[`arme_${i}_degats`] ?? '').trim();
        const texteDesDegats = lireLesDegats(ecrit) ? ecrit : String(objet?.valeurs?.degats ?? '').trim();
        const degats = lireLesDegats(texteDesDegats);
        if (!degats) continue;
        const portee = String(valeurs[`arme_${i}_portee`] ?? '').trim() || String(objet?.valeurs?.portee ?? '');
        armes.push({
            index: i, libelle, degats, texteDesDegats, melee: MELEE.test(portee),
            traits: lireLesTraits(objet?.valeurs?.traits),
        });
    }
    return armes;
}

/** Le premier nombre d'un texte de protection : « +3 », « 8 », « 5 (+6 vs lasers) ». */
const nombreDe = (v: unknown): number | null => {
    const m = /[+-]?\d+/.exec(String(v ?? ''));
    return m ? Math.max(0, Number(m[0])) : null;
};

/** La protection d'une cible et d'où elle vient, pour la dire au meneur. */
export interface ProtectionDeTraveller {
    protection: number;
    source: string;
}

/**
 * **La protection de la cible.** La meilleure des armures de la fiche (« Armure 1 » à « Armure 4 ») ;
 * à défaut, le trait « Armure (+X) » d'un animal lu dans ses notes ; sinon 0. Le meneur la change
 * avant d'appliquer (la Reflec n'arrête que les lasers, p. 75 : c'est à lui de le dire).
 */
export function protectionDeTraveller(valeurs: Record<string, unknown>, notes?: string): ProtectionDeTraveller {
    let meilleure: ProtectionDeTraveller | null = null;
    for (let i = 1; i <= 4; i++) {
        const n = nombreDe(valeurs[`armure_${i}_protection`]);
        if (n === null) continue;
        if (!meilleure || n > meilleure.protection) {
            meilleure = { protection: n, source: String(valeurs[`armure_${i}`] ?? '').trim() || `Armure ${i}` };
        }
    }
    if (meilleure) return meilleure;
    const trait = /Armure\s*\(\s*\+?\s*(\d+)\s*\)/i.exec(notes ?? '');
    if (trait) return { protection: Number(trait[1]), source: `Armure (+${trait[1]})` };
    return { protection: 0, source: 'aucune armure' };
}

/**
 * **Les attaques d'un animal** : « Attaques : Cornes (2D), Piétinement (3D) » (p. 81), lues dans ses
 * notes de combat (le bestiaire les y écrit, `notesDeLaCreature`). Toutes au contact — le livre ne
 * donne pas de MD de FOR à un animal : il n'en a pas.
 */
export function attaquesDUnAnimal(notes: string | undefined): ArmeDeTraveller[] {
    const ligne = /Attaques?\s*:\s*([^\n;]+)/i.exec(notes ?? '');
    if (!ligne) return [];
    const attaques: ArmeDeTraveller[] = [];
    for (const m of ligne[1].matchAll(/([^,()]+?)\s*\(\s*([^)]+)\)/g)) {
        const degats = lireLesDegats(m[2]);
        if (!degats) continue;
        attaques.push({
            index: 0, libelle: m[1].trim(), degats, texteDesDegats: m[2].trim(), melee: false,
            traits: { ap: 0, auto: 0, incapacitante: false, autres: [] },
        });
    }
    return attaques;
}

/**
 * **Le test d'attaque proposé à un adversaire** : l'arme de mêlée se lance sous la FOR et la Mêlée,
 * une arme à distance sous la DEX et le Combat Arme (p. 72-74). La première ligne de compétence
 * remplie est proposée ; sans elle, la compétence reste vide (MD−3, p. 58). Le meneur change tout.
 */
export function attaqueDeTraveller(valeurs: Record<string, unknown>, arme: ArmeDeTraveller | undefined): Record<string, string> {
    const melee = arme?.melee ?? false;
    const domaine = melee ? 'melee' : 'combat_arme';
    const competence = [1, 2, 3].map(n => `${domaine}_${n}`).find(id => String(valeurs[id] ?? '').trim() !== '');
    return { caracteristique: melee ? 'force' : 'dexterite', ...(competence ? { competence } : {}) };
}

/** Le MD de FOR de l'attaquant : celui de sa fiche, sinon lu sur sa FOR (table p. 9) ; 0 sans FOR. */
export function mdDeForceDe(valeurs: Record<string, unknown>): number {
    const ecrit = valeurs.force_md;
    if (ecrit !== undefined && ecrit !== '' && Number.isFinite(Number(ecrit))) return Math.trunc(Number(ecrit));
    const force = valeurs.force;
    return force !== undefined && force !== '' && Number.isFinite(Number(force)) ? mdDeCaracteristique(Number(force)) : 0;
}

/** Ce qu'un animal de Traveller apporte à son attaque. */
export interface AnimalDeTraveller {
    attaques: ArmeDeTraveller[];
    /** Le MD de sa Mêlée (naturelles) — le livre donne les compétences d'un animal « avec leur MD » (p. 81). */
    mdDeMelee: number;
}

/**
 * **Un animal du bestiaire, au combat** (TRV-A2, T8, C10). Il n'a pas de caractéristiques : son test
 * d'attaque est 2D + sa Mêlée (naturelles), ses dégâts sont ceux de son attaque (« Morsure (4D) »),
 * tout va à ses PdV (p. 81). Lu au bestiaire du pilote par son origine ; à défaut, dans ses notes.
 * `null` pour un combattant qui n'est pas un animal (un PNJ à fiche de Voyageur, un joueur).
 */
export function animalDeTraveller(
    combattant: Pick<Combatant, 'isPlayer' | 'roleplayingNotes' | 'origineDuLivre'>,
    bestiaire: BestiaireDuJeu | undefined,
): AnimalDeTraveller | null {
    if (combattant.isPlayer) return null;
    const creature = combattant.origineDuLivre ? bestiaire?.creatures.find(c => c.id === combattant.origineDuLivre!.creatureId) : undefined;
    const texte = creature ? (creature.particularites ?? []).join(' ; ') : combattant.roleplayingNotes;
    const attaques = attaquesDUnAnimal(texte);
    if (attaques.length === 0) return null;
    const ecrit = creature ? creature.valeurs['melee-naturelles']
        : /M[êe]l[ée]e\s*\(naturelles\)\s*([+-]?\d+)/i.exec(combattant.roleplayingNotes ?? '')?.[1];
    const md = Number(ecrit);
    return { attaques, mdDeMelee: Number.isFinite(md) && String(ecrit ?? '').trim() !== '' ? Math.trunc(md) : 0 };
}
