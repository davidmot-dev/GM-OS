import type { BestiaireDuJeu } from '../../../types/drivers';

/*
  **Les affrontements de Pénombre**, en logique pure — registre § 267, T17 (22/11/2026). David :
  « consigne les affrontements dans la révision de combat-os », puis « oui mets pénombre avant le
  lot 1 » ; réponses du jour : le bestiaire relié (la résilience devient la santé), et quatre gestes
  sur la carte — encaisser une attaque, l'action adverse, la dissonance, l'opéra harmonique.

  Le Psycholune ne lance jamais (livre de base, p. 40-45) : les Éminences grises lancent contre
  l'**adversité** de l'adversaire, chaque succès d'une attaque retire 1 point de **résilience** ; ses
  **actions adverses** réussissent d'office. Ce fichier ne lance rien et n'écrit rien : il dit ce que
  vaut un geste. La santé s'écrit par `applyDamage`, comme ailleurs.
*/

/** Le suivi d'un adversaire de Pénombre, sur sa fiche de combattant. */
export const CLE_AFFRONTEMENT_PENOMBRE = '_gmos_affrontement_penombre';

export interface SuiviDAffrontement {
    /** Les jetons de dissonance qui restent ; absent : ceux du livre. */
    dissonance?: number;
    /** Un opéra harmonique a réussi : la dissonance est annulée, temporairement (p. 45). */
    opera?: boolean;
    /** L'adversité saisie pour un adversaire que le bestiaire ne connaît pas. */
    adversite?: number;
}

/** Ce que le bestiaire dit d'un adversaire. */
export interface ProfilDAdversaire {
    /** Le nombre d'informations de sa description (p. 40-41) ; `null` : à saisir. */
    adversite: number | null;
    /** 5 fois l'adversité (p. 41) ; `null` : inconnue. */
    resilience: number | null;
    /** Fable 1, mythe 2, muse 3, mortel 1 ou 2 (p. 43) ; 0 : un adversaire qui n'est pas dissonant. */
    dissonance: number;
    /** Ses actions adverses et de dissonance, « Nom : effet » (p. 42-43). */
    actions: { nom: string; effet: string }[];
    depuisLeLivre: boolean;
}

const clef = (texte: string) => texte.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const entier = (v: unknown): number | null => {
    const n = Math.trunc(Number(String(v ?? '').replace(',', '.')));
    return Number.isFinite(n) && String(v ?? '').trim() !== '' ? n : null;
};

/** Le profil d'un adversaire posé depuis le bestiaire (`origineDuLivre`), ou un profil vide. */
export function profilDeLAdversaire(
    pilote: { bestiaire?: BestiaireDuJeu } | null | undefined,
    combattant: { origineDuLivre?: { creatureId: string } },
): ProfilDAdversaire {
    const bestiaire = pilote?.bestiaire;
    const creature = combattant.origineDuLivre ? bestiaire?.creatures.find(c => c.id === combattant.origineDuLivre!.creatureId) : undefined;
    if (!bestiaire || !creature) return { adversite: null, resilience: null, dissonance: 0, actions: [], depuisLeLivre: false };
    const colonne = (nom: string) => bestiaire.colonnes.find(c => clef(c.id) === nom || clef(c.libelle) === nom);
    const lire = (nom: string) => { const c = colonne(nom); return c ? entier(creature.valeurs[c.id]) : null; };
    const adversite = lire('adversite');
    const actions = (creature.particularites ?? []).flatMap(p => {
        const i = p.indexOf(':');
        return i > 0 ? [{ nom: p.slice(0, i).trim(), effet: p.slice(i + 1).trim() }] : [];
    });
    return {
        adversite,
        resilience: lire('resilience') ?? (adversite !== null ? adversite * 5 : null),
        dissonance: Math.max(0, lire('dissonance') ?? 0),
        actions,
        depuisLeLivre: true,
    };
}

/** Le suivi lu sur la fiche du combattant. */
export function lireLeSuiviDAffrontement(valeurs: Record<string, unknown> | undefined): SuiviDAffrontement {
    const brut = valeurs?.[CLE_AFFRONTEMENT_PENOMBRE];
    return brut && typeof brut === 'object' ? brut as SuiviDAffrontement : {};
}

/** L'adversité qui vaut : celle du livre, sinon celle saisie. */
export function adversiteDe(profil: ProfilDAdversaire, suivi: SuiviDAffrontement): number | null {
    return profil.adversite ?? (suivi.adversite !== undefined && suivi.adversite > 0 ? suivi.adversite : null);
}

/** Les jetons de dissonance qui restent ; aucun quand un opéra a réussi (p. 45). */
export function dissonanceRestante(profil: ProfilDAdversaire, suivi: SuiviDAffrontement): number {
    if (suivi.opera) return 0;
    return Math.max(0, suivi.dissonance ?? profil.dissonance);
}

/**
 * **La perte d'une action adverse calibrée par défaut** (p. 42) : une Éminence grise perd autant de
 * jetons que l'adversité, ou toutes la moitié arrondie au supérieur. Chaque succès d'une défense en
 * annule un (p. 44).
 */
export function perteDeLActionAdverse(adversite: number, toutes: boolean, annulesParLaDefense = 0): number {
    const base = toutes ? Math.ceil(Math.max(0, adversite) / 2) : Math.max(0, adversite);
    return Math.max(0, base - Math.max(0, Math.trunc(annulesParLaDefense)));
}

/**
 * **Ce que dit l'effet d'une action adverse** : « 1 Éminence grise perd 3 jetons conscience », « toutes
 * perdent 2 jetons conscience », « Toutes les cibles perdent 1 jeton conscience par tour ». Rend la
 * perte écrite et si elle frappe tout le monde ; une perte que l'effet ne chiffre pas reste à régler.
 */
export function lireLActionAdverse(effet: string): { perte?: number; toutes: boolean } {
    const t = effet.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();
    const perte = /perd(?:ent)?\s+(?:chacune\s+)?(\d+)\s+jetons?/.exec(t)?.[1];
    return { ...(perte ? { perte: Number(perte) } : {}), toutes: /^\s*toutes\b|\btoutes les\b/.test(t) };
}

/**
 * **Ce qui suit une résilience tombée à 0** (p. 43, 45) : tant qu'il reste des jetons de dissonance,
 * l'adversaire joue gratuitement une action de dissonance, revient à sa résilience maximale et perd
 * un jeton ; sinon il est vaincu.
 */
export function apresLaChute(resilience: number, profil: ProfilDAdversaire, suivi: SuiviDAffrontement): 'debout' | 'dissonance' | 'vaincu' {
    if (resilience > 0) return 'debout';
    return dissonanceRestante(profil, suivi) > 0 ? 'dissonance' : 'vaincu';
}
