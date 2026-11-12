import type { SheetSection } from '../../data/defaultSheetTemplates';
import { sectionsDeLaComposante, type ComposanteDeJet, type DescripteurDeJet } from './DescripteurDeJet';
import type { ModificateurDeSauvegarde } from './DiceEngine';
import { decrireLeJetDuPilote, estUneSauvegarde } from './lectureDuPilote';

/**
 * **Le meneur demande un jet à un joueur** — repris de GM Codex, plan
 * `documentation/Planning/2026-11-11-jets-demandes-et-caches.md`, T1.
 *
 * Le meneur compose le jet sur la fiche — « Agilité + Mobilité », difficulté —
 * et, au lieu de lancer, l'envoie à la tablette du personnage. Le joueur trouve
 * « Lancer un test » déjà composé, ajoute ce que son jeu lui permet (dés
 * achetés, Panache, avantage…) et lance : **c'est le joueur qui lance**
 * (décision de David, 11/11). La demande ne porte donc que ce que le meneur
 * décide — la composition —, jamais une valeur ni un résultat.
 *
 * ⭐ **Une seule règle pour tous les jeux.** Toutes les familles de jet —
 * seuil composé, réserve (Alien), cible calculée (Rêve de Dragon), dés
 * échelonnés (Blade Runner), garde (Crimes) — se composent dans le même `choix`
 * du panneau : composante → champ de la fiche. La demande transporte ce `choix`,
 * et c'est ce module qui dit, pour le panneau comme pour la demande, quelles
 * composantes se retiennent et quels champs chacune propose. *Deux copies de
 * cette règle finiraient par proposer au joueur un champ que la demande refuse.*
 */

/** Ce que le meneur fixe d'un jet de fiche. Le reste appartient au joueur. */
export interface CompositionDemandee {
    /** Composante → identifiant du champ retenu — le `choix` du panneau. */
    champs: Record<string, string>;
    /** Réussites exigées (Dune, réserves). */
    difficulte?: number;
    /** La difficulté qui déplace la colonne (jets en pourcentage) — jamais `difficulte`. */
    ajustementDeDifficulte?: number;
    /** Le modificateur de situation ajouté au seuil. */
    modificateurDuSeuil?: number;
}

interface DemandeCommune {
    /** Identifiant unique, rendu avec le résultat pour clore la demande. */
    id: string;
    /** Le personnage visé — et lui seul. */
    characterId: string;
    /** Ce que la tablette annonce : « Agilité + Mobilité ». */
    titre: string;
    /** Horodatage de l'émission, en millisecondes. */
    emiseLe: number;
}

/** Un test composé depuis la fiche — tous les jeux. */
export interface DemandeDeTest extends DemandeCommune {
    genre: 'test';
    composition: CompositionDemandee;
}

/** Une Sauvegarde de Cthulhu Hack — la tablette demande, le meneur résout (`fiche:jet`). */
export interface DemandeDeSauvegarde extends DemandeCommune {
    genre: 'sauvegarde';
    champ: string;
    modificateur?: ModificateurDeSauvegarde;
}

export type DemandeDeJet = DemandeDeTest | DemandeDeSauvegarde;

/**
 * **Les composantes que le joueur retient pour ce jet**, dans l'ordre du panneau.
 *
 * Ce que les dés échelonnés décident, ils le décident seuls : un pilote qui
 * porte encore un `seuil` après une nouvelle dérivation ne le fait pas choisir
 * deux fois (`preparerLeJet` applique la même préséance). Les composantes de la
 * réserve comptent autant que celles du seuil — chez Alien, le nombre de dés
 * vaut un attribut plus une compétence. Crimes : la compétence dit combien de
 * dés se gardent.
 */
export function composantesARetenir(descripteur: DescripteurDeJet | null | undefined): ComposanteDeJet[] {
    if (!descripteur) return [];
    return [
        ...(descripteur.desEchelonnes
            ? descripteur.desEchelonnes.composantes
            : [
                ...(descripteur.cible ? [descripteur.cible.caracteristique] : []),
                ...(descripteur.cible?.ajustement ?? []),
                ...(descripteur.seuil ?? []),
            ]),
        ...(descripteur.reserve?.composantes ?? []),
        ...(descripteur.reserve?.secondaire?.composantes ?? []),
        ...(descripteur.garde ? [descripteur.garde.competence] : []),
    ];
}

/** Un champ que la composante propose, avec ce que le menu affiche. */
export interface ChampPropose {
    id: string;
    /** Le nom saisi (`libelleSur`) quand le champ en a un, sinon son intitulé. */
    label: string;
    /** La section où il se trouve — un sous-groupe chez Rêve de Dragon. */
    sectionId: string;
}

/**
 * Ce que le menu affiche d'un champ : le nom saisi à la place de l'intitulé (un Vécu de
 * Nephilim, une arme), ou à sa suite quand il n'est qu'une précision (`libelleEnPrecision` :
 * « Pilotage — Hélicoptère », Delta Green, 12/11/2026).
 */
export function libelleDuChampPropose(
    f: { id: string; label?: string; libelleSur?: string; libelleEnPrecision?: boolean },
    valeurs: Record<string, unknown>,
): string {
    const intitule = f.label || f.id;
    const saisi = f.libelleSur ? String(valeurs[f.libelleSur] ?? '').trim() : '';
    if (!saisi) return intitule;
    return f.libelleEnPrecision ? `${intitule} — ${saisi}` : saisi;
}

/**
 * **Les champs qu'une composante propose sur cette fiche.**
 *
 * Quatre règles, celles du menu du panneau :
 * - toutes les sections de la composante (`sectionsSupplementaires` comprises) ;
 * - **un nom n'est pas une valeur** : le champ qu'un autre désigne par
 *   `libelleSur` le nomme, il ne se lance pas (Nephilim, 17/10) ;
 * - le `motif` de la composante filtre les identifiants (le degré d'une
 *   formule, pas son aire) ;
 * - une ligne nommée par un champ vide n'a rien à proposer (un Vécu vide) —
 *   sauf si le nom n'est qu'une précision (`libelleEnPrecision`, Delta Green).
 */
export function champsProposes(
    composante: ComposanteDeJet,
    sections: readonly SheetSection[] | undefined,
    valeurs: Record<string, unknown>,
): ChampPropose[] {
    let motif: RegExp | null = null;
    try { motif = composante.motif ? new RegExp(composante.motif) : null; } catch { motif = null; }

    return sectionsDeLaComposante(sections, composante).sections.flatMap(section => {
        const noms = new Set(section.fields.map(f => f.libelleSur).filter(Boolean));
        return section.fields
            .filter(f => !noms.has(f.id))
            .filter(f => !motif || motif.test(f.id))
            .filter(f => !f.libelleSur || f.libelleEnPrecision || String(valeurs[f.libelleSur] ?? '').trim() !== '')
            .map(f => ({
                id: f.id,
                label: libelleDuChampPropose(f, valeurs),
                sectionId: section.id,
            }));
    });
}

/**
 * **La composition valable sur CETTE fiche**, ou `null` si elle ne l'est pas.
 *
 * Ne garde que les composantes du jet et, pour chacune, un champ que la fiche
 * propose vraiment ; refuse si une composante obligatoire reste sans champ —
 * la même règle que le bouton « Lancer » du panneau. Sert deux fois : chez le
 * meneur, avant d'envoyer ; sur la tablette, à l'arrivée, contre **sa** fiche
 * — *on ne précompose jamais un champ que le menu ne saurait montrer.*
 */
export function compositionValable(
    composition: CompositionDemandee,
    descripteur: DescripteurDeJet | null | undefined,
    sections: readonly SheetSection[] | undefined,
    valeurs: Record<string, unknown>,
): CompositionDemandee | null {
    const composantes = composantesARetenir(descripteur);
    const champs: Record<string, string> = {};
    for (const composante of composantes) {
        const voulu = composition.champs[composante.id];
        if (voulu && champsProposes(composante, sections, valeurs).some(c => c.id === voulu)) {
            champs[composante.id] = voulu;
        } else if (!composante.facultative) {
            return null;
        }
    }
    /*
      Un jeu qui ne compose rien depuis la fiche (aucune composante) n'a rien à
      demander : « lance », sans dire quoi, n'est pas une demande de test.
    */
    if (composantes.length === 0) return null;
    return {
        champs,
        ...(composition.difficulte !== undefined ? { difficulte: composition.difficulte } : {}),
        ...(composition.ajustementDeDifficulte !== undefined ? { ajustementDeDifficulte: composition.ajustementDeDifficulte } : {}),
        ...(composition.modificateurDuSeuil !== undefined ? { modificateurDuSeuil: composition.modificateurDuSeuil } : {}),
    };
}

/**
 * « Agilité + Mobilité » — les champs retenus, dans l'ordre des composantes.
 * Les libellés sont rognés : la fiche de Rêve de Dragon porte « Bricolage␣ »,
 * et `lireLaDemande` rogne le titre à l'arrivée — sans cela, le meneur et la
 * tablette tiendraient deux titres différents pour la même demande (11/11).
 */
export function titreDeLaComposition(
    composition: CompositionDemandee,
    descripteur: DescripteurDeJet | null | undefined,
    sections: readonly SheetSection[] | undefined,
    valeurs: Record<string, unknown>,
): string {
    return composantesARetenir(descripteur)
        .map(c => {
            const id = composition.champs[c.id];
            return id ? (champsProposes(c, sections, valeurs).find(p => p.id === id)?.label ?? id).trim() : null;
        })
        .filter((l): l is string => !!l)
        .join(' + ');
}

/**
 * **Composer la demande chez le meneur.** `null` quand la composition ne tient
 * pas sur la fiche : le bouton « Demander » reste alors indisponible, comme
 * « Lancer ».
 */
export function composerLaDemande(entree: {
    id: string;
    characterId: string;
    emiseLe: number;
    descripteur: DescripteurDeJet | null | undefined;
    sections: readonly SheetSection[] | undefined;
    valeurs: Record<string, unknown>;
    composition: CompositionDemandee;
}): DemandeDeTest | null {
    const composition = compositionValable(entree.composition, entree.descripteur, entree.sections, entree.valeurs);
    if (!composition || !entree.id || !entree.characterId) return null;
    return {
        genre: 'test',
        id: entree.id,
        characterId: entree.characterId,
        emiseLe: entree.emiseLe,
        titre: titreDeLaComposition(composition, entree.descripteur, entree.sections, entree.valeurs),
        composition,
    };
}

/**
 * **Ce que la tablette saura ouvrir** (T8, 11/11). Pour un jeu à Sauvegarde
 * (Cthulhu Hack), la tablette n'a pas « Lancer un test » : elle n'offre que ses
 * boutons de Sauvegarde, et c'est le meneur qui résout (`fiche:jet`). La règle
 * est **celle de la tablette**, `HubCharacterSheet` : `estUneSauvegarde` sur la
 * description du pilote. Le meneur compose donc une demande de Sauvegarde là où
 * la tablette ne lance pas elle-même — sinon il enverrait un test qu'elle ne
 * saurait pas ouvrir.
 */
export function composerPourLaTablette(entree: Parameters<typeof composerLaDemande>[0] & {
    /** Les dés du pilote — `pilote.dice`, comme la tablette les lit. */
    dice: { engine?: string; defaultDice?: string } | undefined;
    /** L'avantage choisi au panneau, pour une Sauvegarde. */
    modificateur?: ModificateurDeSauvegarde;
}): DemandeDeJet | null {
    const sauvegarde = estUneSauvegarde(decrireLeJetDuPilote({ dice: entree.dice, jet: entree.descripteur ?? undefined }));
    if (!sauvegarde) return composerLaDemande(entree);

    const composition = compositionValable(entree.composition, entree.descripteur, entree.sections, entree.valeurs);
    const champ = composition ? Object.values(composition.champs)[0] : undefined;
    if (!champ || !entree.id || !entree.characterId) return null;
    const libelle = titreDeLaComposition(composition!, entree.descripteur, entree.sections, entree.valeurs) || champ;
    const modificateur = entree.modificateur && entree.modificateur !== 'aucun' ? entree.modificateur : undefined;
    return {
        genre: 'sauvegarde',
        id: entree.id,
        characterId: entree.characterId,
        emiseLe: entree.emiseLe,
        titre: `Sauvegarde de ${libelle}${modificateur === 'avantage' ? ' · avantage' : modificateur === 'desavantage' ? ' · désavantage' : ''}`,
        champ,
        ...(modificateur ? { modificateur } : {}),
    };
}

// ─── Relecture de ce qui arrive du réseau ───────────────────────────────────

const LONGUEUR_D_IDENTIFIANT = 200;
const LONGUEUR_DE_TITRE = 200;
/** Une difficulté ou un modificateur au-delà ne décrit aucun jet réel. */
const BORNE = 1000;
/** Plus de composantes qu'aucun pilote n'en déclare : une forme inattendue. */
const COMPOSANTES_AU_PLUS = 16;

const identifiant = (v: unknown): string | null =>
    typeof v === 'string' && v.trim() && v.length <= LONGUEUR_D_IDENTIFIANT ? v : null;
const entier = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isInteger(v) && Math.abs(v) <= BORNE ? v : undefined;

/**
 * **Relire une demande venue du réseau**, champ par champ ; tout le reste est
 * jeté. `null` quand l'essentiel manque. Même parti que
 * `lireLeResultatDeLaTablette` : *on ne croit que la forme qu'on attend.*
 *
 * La relecture ne dit pas si la demande tient sur la fiche — c'est
 * `compositionValable`, contre la fiche de la tablette, qui le dit.
 */
export function lireLaDemande(v: unknown): DemandeDeJet | null {
    if (!v || typeof v !== 'object') return null;
    const d = v as Record<string, unknown>;
    const id = identifiant(d.id);
    const characterId = identifiant(d.characterId);
    const emiseLe = typeof d.emiseLe === 'number' && Number.isFinite(d.emiseLe) ? d.emiseLe : null;
    if (!id || !characterId || emiseLe === null) return null;
    const titre = typeof d.titre === 'string' ? d.titre.trim().slice(0, LONGUEUR_DE_TITRE) : '';

    if (d.genre === 'sauvegarde') {
        const champ = identifiant(d.champ);
        if (!champ) return null;
        const modificateur = d.modificateur === 'avantage' || d.modificateur === 'desavantage' || d.modificateur === 'aucun'
            ? d.modificateur : undefined;
        return { genre: 'sauvegarde', id, characterId, emiseLe, titre, champ, ...(modificateur ? { modificateur } : {}) };
    }

    if (d.genre !== 'test' || !d.composition || typeof d.composition !== 'object') return null;
    const c = d.composition as Record<string, unknown>;
    if (!c.champs || typeof c.champs !== 'object' || Array.isArray(c.champs)) return null;
    const paires = Object.entries(c.champs as Record<string, unknown>);
    if (paires.length === 0 || paires.length > COMPOSANTES_AU_PLUS) return null;
    const champs: Record<string, string> = {};
    for (const [composante, champ] of paires) {
        const cle = identifiant(composante);
        const valeur = identifiant(champ);
        if (!cle || !valeur) return null;
        champs[cle] = valeur;
    }
    const difficulte = entier(c.difficulte);
    const ajustementDeDifficulte = entier(c.ajustementDeDifficulte);
    const modificateurDuSeuil = entier(c.modificateurDuSeuil);
    return {
        genre: 'test', id, characterId, emiseLe, titre,
        composition: {
            champs,
            ...(difficulte !== undefined ? { difficulte } : {}),
            ...(ajustementDeDifficulte !== undefined ? { ajustementDeDifficulte } : {}),
            ...(modificateurDuSeuil !== undefined ? { modificateurDuSeuil } : {}),
        },
    };
}

/**
 * **Le résultat dit à quelle demande il répond** (T4) : les panneaux de jet
 * enveloppent chaque `fiche:resultat` avec ceci. Sans demande, le résultat part
 * tel qu'hier. Le meneur ne clôt que la demande ouverte qu'il reconnaît —
 * un second jet dans le même panneau, qui porte encore l'identifiant, ne
 * rouvre rien.
 */
export function joindreLaDemande(demandeId: string | undefined) {
    return <T extends { detail: Record<string, unknown> }>(init: T): T =>
        demandeId ? { ...init, detail: { ...init.detail, demandeId } } : init;
}
