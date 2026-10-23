/**
 * **Création et progression de Crimes** — C8 (2026-10-23), livre p. 324-334 et 404-405.
 *
 * Ce qui se calcule : le tempérament (les trois choix de Jung) et ce qu'il
 * fixe ; le budget des compétences ; les potentiels de départ ; les
 * spécialisations ; le coût d'une amélioration. Rien ne s'écrit ici : la carte
 * montre, le meneur ou le joueur décide.
 */

export interface Temperament {
    nom: string;
    angoisse: number;
    psychose: number;
    seuilNevrose: number;
}

/** Les huit tempéraments (p. 328) et leurs totaux de départ (p. 334). */
const TEMPERAMENTS: Record<string, Temperament> = {
    'oui-oui-primaire': { nom: 'Colérique', angoisse: 2, psychose: 1, seuilNevrose: 6 },
    'non-oui-primaire': { nom: 'Sanguin', angoisse: 2, psychose: 1, seuilNevrose: 6 },
    'oui-non-primaire': { nom: 'Nerveux', angoisse: 2, psychose: 1, seuilNevrose: 6 },
    'non-non-primaire': { nom: 'Amorphe', angoisse: 0, psychose: 3, seuilNevrose: 8 },
    'oui-oui-secondaire': { nom: 'Passionné', angoisse: 1, psychose: 2, seuilNevrose: 7 },
    'non-oui-secondaire': { nom: 'Flegmatique', angoisse: 1, psychose: 2, seuilNevrose: 7 },
    'oui-non-secondaire': { nom: 'Sentimental', angoisse: 1, psychose: 2, seuilNevrose: 7 },
    'non-non-secondaire': { nom: 'Apathique', angoisse: 0, psychose: 3, seuilNevrose: 8 },
};

const cle = (v: unknown) => String(v ?? '').trim().toLowerCase();

/** Émotif ? Actif ? Primaire ou secondaire ? — les trois choix de la fiche ; incomplets, rien. */
export function temperamentDe(emotivite: unknown, activite: unknown, reactivite: unknown): Temperament | undefined {
    return TEMPERAMENTS[`${cle(emotivite)}-${cle(activite)}-${cle(reactivite)}`];
}

/** Le coût d'un rang à la création : novice 3, pratiquant 9, maître 18 (p. 324). */
export const COUT_DU_RANG = [0, 3, 9, 18] as const;

/** L'âge lu dans un texte libre (« Homme, 34 ans ») ; absent, l'adulte. */
export function ageDe(texte: unknown): number | undefined {
    const m = String(texte ?? '').match(/\b(\d{1,3})\b/);
    const n = m ? Number(m[1]) : NaN;
    return n > 0 && n < 130 ? n : undefined;
}

/** 45 points ; un enfant, 24 avant 12 ans et 35 ensuite (p. 324). L'enfant a moins de 18 ans (tableau p. 324). */
export const budgetDeCreation = (age?: number) => (age === undefined || age >= 18 ? 45 : age < 12 ? 24 : 35);

export interface Constat {
    ok: boolean;
    ligne: string;
}

export interface FicheACreer {
    potentiels: { label: string; valeur: number }[];
    competences: { label: string; niveau: number; specialisations: number }[];
    age?: number;
    seuilInnocence?: number;
}

/** Ce que la fiche respecte des règles de création, ligne par ligne. */
export function verifierLaCreation(f: FicheACreer): Constat[] {
    const enfant = f.age !== undefined && f.age < 18;
    const constats: Constat[] = [];

    const valeurs = f.potentiels.map(p => p.valeur);
    if (enfant) {
        const total = valeurs.reduce((a, b) => a + b, 0) + (f.seuilInnocence ?? 0);
        constats.push({ ok: total === 12, ligne: `Potentiels et seuil d'Innocence : ${total} / 12 points (enfant, p. 324)` });
    } else {
        const tries = [...valeurs].sort((a, b) => a - b).join(', ');
        constats.push({ ok: tries === '3, 4, 5', ligne: `Potentiels : ${valeurs.join(', ')} — un à 3, un à 4, un à 5 (p. 323)` });
    }

    const budget = budgetDeCreation(f.age);
    const depense = f.competences.reduce((s, c) => s + (COUT_DU_RANG[Math.min(3, Math.max(0, c.niveau))] ?? 0), 0);
    constats.push({ ok: depense <= budget, ligne: `Compétences : ${depense} / ${budget} points (novice 3, pratiquant 9, maître 18, p. 324)` });
    if (enfant) {
        const maitres = f.competences.filter(c => c.niveau > 2).map(c => c.label);
        if (maitres.length) constats.push({ ok: false, ligne: `Un enfant n'a que novice et pratiquant : ${maitres.join(', ')} (p. 324)` });
    }

    const specialisees = f.competences.filter(c => c.specialisations > 0);
    const horsDeMaitrise = specialisees.filter(c => (enfant ? c.niveau < 2 : c.niveau < 3)).map(c => c.label);
    if (horsDeMaitrise.length) {
        constats.push({
            ok: false,
            ligne: enfant
                ? `Spécialisation sans le rang de pratiquant : ${horsDeMaitrise.join(', ')} (p. 324)`
                : `Spécialisation sans être maître : ${horsDeMaitrise.join(', ')} (p. 324)`,
        });
    }
    const total = specialisees.reduce((s, c) => s + c.specialisations, 0);
    if (enfant) {
        if (total) constats.push({ ok: total <= 2, ligne: `Spécialisations : ${total} / 2 au rang de pratiquant (enfant, p. 324)` });
    } else {
        const gratuites = f.competences.filter(c => c.niveau >= 3).length;
        if (total) {
            const aAcheter = Math.max(0, total - gratuites);
            constats.push({
                ok: true,
                ligne: `Spécialisations : ${total}, ${gratuites === 0 ? 'aucune offerte' : `dont ${Math.min(total, gratuites)} offerte${Math.min(total, gratuites) > 1 ? 's' : ''}`} par la maîtrise`
                    + (aAcheter ? ` ; ${aAcheter} à acheter (le livre n'en chiffre pas le coût, p. 324)` : ''),
            });
        }
    }
    return constats;
}

/**
 * Le coût d'une amélioration avec les points de développement (p. 405) : un
 * potentiel coûte son nouveau niveau (« pour passer de 4 à 5, il faut 5
 * points ») ; une compétence, 3 points par degré visé — 3, 6, 9, ce qui retrouve
 * les 3, 9, 18 de la création.
 */
export const coutDuPotentiel = (cible: number) => cible;
export const coutDeLaCompetence = (cible: number) => 3 * cible;
export const MAX_DU_POTENTIEL = 5;
export const MAX_DE_LA_COMPETENCE = 3;
