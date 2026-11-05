import type { SheetField } from '../../../data/defaultSheetTemplates';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import type { HealthSystem } from '../../../types/entity.types';
import type { BestiaireDuJeu, CasesDeSante, CreatureDuBestiaire } from '../../../types/drivers';
import { ficheDePlateau } from '../../bestiaire/bestiaire';
import { ficheAlienDeLaCreature } from '../../bestiaire/rolesDuBestiaire';
import type { RegleDeCombatAlien } from '../../dice/systemes/combatAlien';
import type { Entity } from '../../../types/entity.types';
import type { CampDeRencontre, LigneDeRencontre, RencontrePreparee } from '../../../types/rencontres.types';
import { HealthInterpreter } from '../../session/logic/HealthInterpreter';
import type { Combatant } from '../types';
import type { GabaritDAdversaire } from '../useBestiaireStore';
import { archetypeParId, type PropositionDeChamps } from './archetypes';
import { fabriquer, hasardDeGraine, nommerLExemplaire } from './fabriqueDAdversaire';

/**
 * **Fabriquer et invoquer — une seule fois, pour l'atelier et les rencontres.**
 *
 * Posé le 2026-10-12 (rencontres préparées, R1). La fabrication vivait dans le
 * composant `AtelierDesAdversaires` ; l'invocation d'une rencontre en avait
 * besoin. *Ce qu'on recopie finit par diverger* : elle est sortie ici avant
 * d'être appelée une seconde fois.
 */

type NouveauCombattant = Omit<Combatant, 'id'>;

/** Les champs de la fiche du jeu — la seule source des échelles. */
export function champsDuPilote(
    templateId: string | undefined,
    modelesPersonnalises: readonly { id: string; sections: { fields: SheetField[] }[] }[] | undefined,
): SheetField[] {
    const tous = [...DEFAULT_SHEET_TEMPLATES, ...(modelesPersonnalises ?? [])];
    const modele = tous.find(t => t.id === templateId);
    return modele ? modele.sections.flatMap(s => s.fields) : [];
}

export interface DemandeDExemplaires {
    champs: SheetField[];
    repartition: PropositionDeChamps;
    archetypeId: string;
    rangId: string;
    /** Le gabarit du bestiaire : ses valeurs passent par-dessus le tirage. */
    gabarit?: GabaritDAdversaire;
    nomDeBase: string;
    nombre: number;
    graine: number;
    typeDeSante: HealthSystem['type'];
    /** Les cases du jeu, quand son modèle de santé en compte (NOC). */
    casesDeSante?: CasesDeSante;
    faction?: CampDeRencontre;
    /** Les notes de jeu ; à défaut, celles du gabarit, sinon le résumé de l'archétype. */
    notes?: string;
}

/** Les valeurs d'UN exemplaire — l'aperçu de l'atelier en a besoin seul. */
export function ficheDUnExemplaire(demande: Omit<DemandeDExemplaires, 'nomDeBase' | 'nombre' | 'typeDeSante' | 'casesDeSante'>, index: number) {
    const fabrique = fabriquer({
        champs: demande.champs, repartition: demande.repartition,
        archetypeId: demande.archetypeId, rangId: demande.rangId,
        hasard: hasardDeGraine(demande.graine + index * 7919),
    });
    /*
      **Le gabarit passe par-dessus la fabrique, champ par champ.** Ce que le
      meneur a saisi est une décision, ce que la fabrique tire est un
      remplissage. *Une décision passe devant un tirage* — et les champs qu'il
      n'a pas renseignés sont quand même remplis, au lieu de rester à zéro.
    */
    const sheetData = demande.gabarit ? { ...fabrique.sheetData, ...demande.gabarit.sheetData } : fabrique.sheetData;
    return { sheetData, fabrique };
}

/** N exemplaires prêts pour l'ordre du tour. La santé est déduite par `addCombatant`. */
export function fabriquerLesExemplaires(demande: DemandeDExemplaires): NouveauCombattant[] {
    const archetype = archetypeParId(demande.archetypeId);
    // La règle de l'atelier : les notes du gabarit (même vides), sinon le résumé de l'archétype.
    const notes = demande.notes ?? (demande.gabarit ? demande.gabarit.notes ?? '' : archetype.resume);
    return Array.from({ length: demande.nombre }, (_, i) => ({
        name: nommerLExemplaire(demande.nomDeBase, i, demande.nombre),
        init: 0,
        isPlayer: false,
        faction: demande.faction ?? 'enemy',
        statuses: [],
        sheetData: ficheDUnExemplaire(demande, i).sheetData,
        healthSystem: HealthInterpreter.createDefault(demande.typeDeSante, { cases: demande.casesDeSante }),
        /* Pour que sa fiche sache le ranger au bestiaire plus tard. */
        origineFabriquee: { archetypeId: archetype.id, rangId: demande.rangId },
        roleplayingNotes: notes,
    }));
}

/**
 * **Ce que le meneur lit d'une créature du livre en combat** : sa description, ses particularités,
 * ses attaques. Les colonnes qui ne remplissent aucun champ y sont rappelées : sans cela, la Vitesse
 * d'un xénomorphe disparaîtrait du plateau.
 */
export function notesDeLaCreature(bestiaire: BestiaireDuJeu, creature: CreatureDuBestiaire): string {
    const horsFiche = bestiaire.colonnes
        .filter(c => !c.champ && creature.valeurs[c.id] !== undefined && String(creature.valeurs[c.id]).trim() !== '')
        .map(c => `${c.libelle} ${creature.valeurs[c.id]}`);
    const attaques = creature.attaques;
    const lignes = [
        creature.description?.trim(),
        horsFiche.length ? horsFiche.join(' · ') : '',
        creature.particularites?.length ? creature.particularites.join(' ; ') : '',
        attaques?.table?.table ? `Attaques : table ${attaques.table.univers} / ${attaques.table.table}` : '',
        ...(attaques?.lignes ?? []).map(l => `${l.de} — ${l.nom}${l.effet ? ` : ${l.effet}` : ''}`),
        creature.source ? `${creature.source.livre}${creature.source.page ? `, p. ${creature.source.page}` : ''}` : '',
    ];
    return lignes.filter(Boolean).join('\n');
}

/**
 * **Une créature du livre, posée en N exemplaires** (§ 210, étape D, 05/11/2026). Sa fiche de
 * plateau est celle que ses colonnes remplissent (`ficheDePlateau`), sans rien tirer : ce sont les
 * chiffres du livre. La santé est déduite par `addCombatant`, comme pour l'atelier.
 */
export function exemplairesDeLaCreature(demande: {
    bestiaire: BestiaireDuJeu; creature: CreatureDuBestiaire; nombre: number;
    typeDeSante: HealthSystem['type']; casesDeSante?: CasesDeSante; faction?: CampDeRencontre;
    /** Alien (étape E) : la créature entre déclarée xénomorphe, son profil tiré des rôles des colonnes. */
    alien?: RegleDeCombatAlien;
}): NouveauCombattant[] {
    const { bestiaire, creature } = demande;
    const nombre = Math.max(1, Math.trunc(demande.nombre));
    const propreAuJeu = ficheAlienDeLaCreature(demande.alien, bestiaire, creature);
    return Array.from({ length: nombre }, (_, i) => ({
        name: nommerLExemplaire(creature.nom, i, nombre),
        init: 0,
        isPlayer: false,
        faction: demande.faction ?? 'enemy',
        statuses: [],
        sheetData: { ...ficheDePlateau(bestiaire, creature), ...propreAuJeu },
        healthSystem: HealthInterpreter.createDefault(demande.typeDeSante, { cases: demande.casesDeSante }),
        origineDuLivre: { creatureId: creature.id },
        roleplayingNotes: notesDeLaCreature(bestiaire, creature),
    }));
}

/**
 * **« Décliner » une créature du livre** : une variante pour le bestiaire du meneur, qui COPIE les
 * valeurs de sa fiche de plateau et garde la trace de son modèle. L'archétype « quelconque »
 * remplit seulement les champs que le livre ne donne pas, quand on la fabrique ensuite.
 */
export function varianteDeLaCreature(jeuId: string, bestiaire: BestiaireDuJeu, creature: CreatureDuBestiaire, nom = `${creature.nom} (variante)`) {
    return {
        jeuId, nom, archetypeId: 'quelconque', rangId: 'pietaille',
        sheetData: ficheDePlateau(bestiaire, creature) as Record<string, number | string | boolean>,
        notes: notesDeLaCreature(bestiaire, creature),
        depuis: { creatureId: creature.id, nom: creature.nom },
    };
}

/**
 * **Un PNJ de la campagne, tel qu'il entre au combat.** Le camp suit son rôle,
 * sauf quand la rencontre en décide autrement.
 */
export function combattantDeLEntite(entite: Entity, faction?: CampDeRencontre): NouveauCombattant {
    return {
        name: entite.name,
        init: entite.initiative ?? 0,
        hp: entite.hp,
        hpMax: entite.maxHp,
        avatar: entite.avatar,
        isPlayer: false,
        faction: faction ?? (entite.role === 'ally' ? 'ally'
            : (entite.role === 'hostile' || entite.role === 'boss') ? 'enemy' : 'neutral'),
        sourceEntityId: entite.id,
        statuses: [],
        roleplayingNotes: entite.roleplayingNotes,
        gmSecretInfo: entite.gmSecretInfo,
    };
}

/** Ce dont l'invocation a besoin, lu dans les magasins par l'appelant. */
export interface ContexteDInvocation {
    champs: SheetField[];
    typeDeSante: HealthSystem['type'];
    casesDeSante?: CasesDeSante;
    gabarits: readonly GabaritDAdversaire[];
    entites: readonly Entity[];
    /** Le bestiaire du pilote : les lignes « créature du livre » s'y lisent (§ 210, étape D). */
    bestiaire?: BestiaireDuJeu;
    /** La règle de combat d'Alien : la créature entre déclarée xénomorphe (§ 210, étape E). */
    alien?: RegleDeCombatAlien;
    /** La répartition retenue par le meneur pour un archétype, sinon la proposition. */
    repartitionDe: (archetypeId: string) => PropositionDeChamps;
    graine: number;
}

export interface AdversairesInvoques {
    combattants: NouveauCombattant[];
    /** Ce qui n'a pas pu entrer tel que prévu — à dire au meneur, jamais à taire. */
    avertissements: string[];
}

/**
 * **Les adversaires d'une rencontre**, fabriqués à neuf.
 *
 * Un gabarit absent (campagne emportée sur une autre machine) retombe sur son
 * archétype, et le dit ; un PNJ supprimé depuis est sauté, et le dit aussi.
 */
export function adversairesDeLaRencontre(rencontre: RencontrePreparee, ctx: ContexteDInvocation): AdversairesInvoques {
    const combattants: NouveauCombattant[] = [];
    const avertissements: string[] = [];

    rencontre.lignes.forEach((ligne: LigneDeRencontre, rang) => {
        const graine = ctx.graine + rang * 104729;
        if (ligne.genre === 'entite') {
            const entite = ctx.entites.find(e => e.id === ligne.entiteId);
            if (!entite) {
                avertissements.push('Un PNJ de cette rencontre n’existe plus : il n’entre pas.');
                return;
            }
            combattants.push(combattantDeLEntite(entite, ligne.faction));
            return;
        }
        if (ligne.genre === 'creature') {
            const creature = ctx.bestiaire?.creatures.find(c => c.id === ligne.creatureId);
            if (!ctx.bestiaire || !creature) {
                avertissements.push(`« ${ligne.nom} » n’est plus au bestiaire du livre de ce jeu : elle n’entre pas.`);
                return;
            }
            combattants.push(...exemplairesDeLaCreature({
                bestiaire: ctx.bestiaire, creature, nombre: ligne.nombre,
                typeDeSante: ctx.typeDeSante, casesDeSante: ctx.casesDeSante, faction: ligne.faction, alien: ctx.alien,
            }));
            return;
        }

        const gabarit = ligne.genre === 'gabarit' ? ctx.gabarits.find(g => g.id === ligne.gabaritId) : undefined;
        if (ligne.genre === 'gabarit' && !gabarit) {
            avertissements.push(`« ${ligne.nom} » n’est pas dans le bestiaire de cette machine : fabriqué depuis son archétype.`);
        }
        const archetypeId = gabarit?.archetypeId ?? ligne.archetypeId;
        const rangId = gabarit?.rangId ?? ligne.rangId;
        const archetype = archetypeParId(archetypeId);
        const nomDeBase = (ligne.genre === 'gabarit' ? (gabarit?.nom ?? ligne.nom) : ligne.nom)?.trim()
            || archetype.nom;

        combattants.push(...fabriquerLesExemplaires({
            champs: ctx.champs,
            repartition: ctx.repartitionDe(archetype.id),
            archetypeId: archetype.id,
            rangId,
            gabarit,
            nomDeBase,
            nombre: Math.max(1, ligne.nombre),
            graine,
            typeDeSante: ctx.typeDeSante,
            casesDeSante: ctx.casesDeSante,
            faction: ligne.faction,
        }));
    });

    return { combattants, avertissements };
}

/**
 * **Où la rencontre se joue.** Sa scène, si elle en a une ; sinon là où le
 * combat est déjà ; sinon la seule scène en cours. Plusieurs scènes en cours et
 * rien de rattaché : on ne choisit pas — le bandeau de la scène pose déjà la
 * question.
 */
export function sceneDeLInvocation(
    rencontre: Pick<RencontrePreparee, 'sceneId'>,
    sceneDuCombat: string | null,
    scenesEnCours: readonly string[],
): string | null {
    if (rencontre.sceneId) return rencontre.sceneId;
    if (sceneDuCombat) return sceneDuCombat;
    return scenesEnCours.length === 1 ? scenesEnCours[0] : null;
}

/** Un PJ que l'on peut faire entrer. */
export interface PJCandidat {
    id: string;
    name: string;
    portraitUrl?: string;
    /** Coché d'avance : la scène le déclare présent. */
    present: boolean;
    /** Déjà sur le plateau (des renforts) : il garde ses points de vie et son initiative. */
    dejaEngage: boolean;
}

/**
 * **« Qui entre ? »** — les PJ de la campagne, cochés d'avance quand la scène
 * les déclare présents. Une rencontre libre sans scène n'en coche aucun : rien
 * ne dit qui est là (décision du 12/10 : le meneur coche).
 */
export function pjsCandidats(
    personnages: readonly { id: string; name: string; campaignId?: string | null; portraitUrl?: string }[],
    campagneId: string | null,
    presents: readonly string[],
    engages: readonly string[],
): PJCandidat[] {
    return personnages
        .filter(p => campagneId && p.campaignId === campagneId)
        .map(p => ({
            id: p.id, name: p.name, portraitUrl: p.portraitUrl,
            present: presents.includes(p.id),
            dejaEngage: engages.includes(p.id),
        }));
}
