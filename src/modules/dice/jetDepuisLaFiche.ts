import { DiceEngine, type RollResult, type ModificateurDeSauvegarde } from './DiceEngine';
import { estUneSauvegarde, decrireLeJetDuPilote } from './lectureDuPilote';
import { deCourant, ecrireLeDe, ressourcesDUsure } from './ressourcesDUsure';

/**
 * **Un jet demandé depuis la fiche d'un joueur, résolu chez le meneur** —
 * Cthulhu Hack, 2026-09-30.
 *
 * La tablette dit **ce qu'elle veut lancer** — « ma Sauvegarde de Force, à
 * l'avantage », « ma Torche » — et rien d'autre : ni la valeur, ni le dé, ni le
 * résultat. C'est ici, chez le meneur, qu'on lit la fiche **qu'il détient**,
 * qu'on lance, et qu'on dit quel dé la ressource devient. *La vérité reste
 * chez le meneur ; la tablette demande.* Même parti que les dés échelonnés, qui
 * voyagent en lettres et jamais en faces.
 *
 * Rend `null` pour toute demande que la fiche ne soutient pas — un champ qui
 * n'est pas une Sauvegarde du jeu, une ressource épuisée, une valeur illisible :
 * **on ne lance jamais un dé inventé.**
 */
export interface DemandeDeJetDeFiche {
    playerId: string;
    characterId: string;
    genre: 'sauvegarde' | 'ressource';
    /** Le champ de la fiche : la caractéristique, ou la ressource. */
    champ: string;
    modificateur?: ModificateurDeSauvegarde;
}

export interface JetDeFicheResolu {
    resultat: RollResult;
    titre: string;
    /** Ce que la fiche doit devenir — une ressource qui a descendu. */
    ecrire?: { champ: string; valeur: string };
}

interface PersonnageLu {
    name: string;
    sheetData?: Record<string, unknown>;
}

interface PiloteLu {
    dice?: { engine?: string; defaultDice?: string };
    jet?: {
        sens?: string;
        reserve?: { max?: number; faces?: number };
        desEchelonnes?: unknown;
        seuil?: { sectionId: string; sectionsSupplementaires?: string[] }[];
    };
    desDUsure?: { fieldId: string; label: string; plafond?: number }[];
    combat?: { statsToTrack?: { fieldId: string; label: string; isMainHP?: boolean; isResource?: boolean }[] };
}

interface GabaritLu {
    sections: { id: string; fields: { id: string; label: string }[] }[];
}

const DIT: Record<ModificateurDeSauvegarde, string> = { aucun: '', avantage: ' · avantage', desavantage: ' · désavantage' };

/** Les caractéristiques qu'une Sauvegarde peut viser : les champs des sections du seuil. */
export function caracteristiquesDeSauvegarde(pilote: PiloteLu | null | undefined, gabarit: GabaritLu | null | undefined) {
    if (!pilote || !gabarit || !estUneSauvegarde(decrireLeJetDuPilote(pilote))) return [];
    const sections = new Set((pilote.jet?.seuil ?? []).flatMap(s => [s.sectionId, ...(s.sectionsSupplementaires ?? [])]));
    return gabarit.sections
        .filter(s => sections.has(s.id))
        .flatMap(s => s.fields.map(f => ({ fieldId: f.id, label: f.label })));
}

export function resoudreLeJetDeFiche(
    demande: DemandeDeJetDeFiche,
    personnage: PersonnageLu,
    pilote: PiloteLu | null | undefined,
    gabarit: GabaritLu | null | undefined,
): JetDeFicheResolu | null {
    const fiche = personnage.sheetData ?? {};

    if (demande.genre === 'sauvegarde') {
        const caracteristique = caracteristiquesDeSauvegarde(pilote, gabarit).find(c => c.fieldId === demande.champ);
        if (!caracteristique) return null;
        const valeur = Number(fiche[demande.champ]);
        if (!Number.isFinite(valeur)) return null;
        const modificateur = demande.modificateur ?? 'aucun';
        return {
            resultat: DiceEngine.rollSauvegarde(valeur, modificateur),
            titre: `${personnage.name} — Sauvegarde de ${caracteristique.label}${DIT[modificateur]}`,
        };
    }

    const ressource = ressourcesDUsure(pilote, fiche).find(r => r.fieldId === demande.champ);
    if (!ressource) return null;
    const de = deCourant(fiche[demande.champ]);
    if (typeof de !== 'number') return null;
    const resultat = DiceEngine.rollUsure(de);
    const apres = resultat.usure!.apres;
    return {
        resultat,
        titre: `${personnage.name} — ${ressource.label} d${de}`,
        ...(apres !== de ? { ecrire: { champ: demande.champ, valeur: ecrireLeDe(apres) } } : {}),
    };
}
