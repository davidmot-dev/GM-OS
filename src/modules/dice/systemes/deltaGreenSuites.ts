import type { DegreDeReussite } from '../degresDeReussite';
import { degreDuDe, estUneReussite } from '../degresDeReussite';
import { echelleDeDeltaGreen, type RegleDeDeltaGreen } from './deltaGreen';

/** Manuel de l’Agent p. 29, 45, 57, 66–74 ; David, 13/11/2026 : les améliorations du pilote. */
export const CLE_DELTA_GREEN = '__deltaGreen';
export type TraumatismeDG = 'violence' | 'impuissance' | 'inconcevable';
export interface SuiviDeltaGreen {
    pertesTraitees: string[];
    violence: number;
    impuissance: number;
    troubles: number;
    folieTemporaire?: boolean;
    foliePermanente?: boolean;
}
type Fiche = Record<string, unknown>;
const entier = (v: unknown, repli = 0) => Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : repli;
export function lireSuiviDG(fiche: Fiche): SuiviDeltaGreen {
    const brut = fiche[CLE_DELTA_GREEN];
    const s = brut && typeof brut === 'object' ? brut as Partial<SuiviDeltaGreen> : {};
    return { pertesTraitees: Array.isArray(s.pertesTraitees) ? s.pertesTraitees.filter(x => typeof x === 'string') : [],
        violence: fiche.accoutumance_violence === true ? 3 : Math.max(0, Math.min(3, entier(fiche.progression_violence ?? s.violence))),
        impuissance: fiche.accoutumance_impuissance === true ? 3 : Math.max(0, Math.min(3, entier(fiche.progression_impuissance ?? s.impuissance))),
        troubles: Math.max(0, entier(s.troubles)), folieTemporaire: !!s.folieTemporaire, foliePermanente: !!s.foliePermanente };
}

/** Grammaire fermée : un entier ou NdM, éventuellement +K ; jamais d’évaluation de texte. */
export function perteDeSAN(expression: string, mode: 'normal' | 'minimum' | 'maximum', lancer: (faces: number) => number): number | null {
    const m = /^(?:(\d{1,2})?d(4|6|8|10|12|20|100)|(\d{1,3}))(?:\s*\+\s*(\d{1,2}))?$/i.exec(expression.trim());
    if (!m) return null;
    const bonus = Number(m[4] ?? 0);
    if (m[3] !== undefined) return Number(m[3]) + bonus;
    const nombre = Number(m[1] ?? 1), faces = Number(m[2]);
    if (nombre < 1 || nombre > 20) return null;
    return bonus + Array.from({ length: nombre }, () => mode === 'minimum' ? 1 : mode === 'maximum' ? faces : lancer(faces)).reduce((a, b) => a + b, 0);
}
export function calculerPerteSAN(formule: string, degre: DegreDeReussite, lancer: (faces: number) => number): number | null {
    const parties = formule.split('/');
    // David, 13/11/2026 : « SAN 60 SR 48 POU 12 Perte -5 ». Le champ est une
    // perte : 5 et −5 retirent cinq points ; le signe ne doit pas devenir un soin.
    if (parties.length === 1) {
        const expression = formule.trim().replace(/^[−+-]\s*/, '');
        return perteDeSAN(expression, degre === 'reussite-particuliere' ? 'minimum' : degre === 'echec-total' ? 'maximum' : 'normal', lancer);
    }
    if (parties.length !== 2) return null;
    // Valider les deux branches avant de tirer le moindre dé.
    if (parties.some(p => perteDeSAN(p, 'minimum', lancer) === null)) return null;
    return perteDeSAN(parties[estUneReussite(degre) ? 0 : 1], degre === 'reussite-particuliere' ? 'minimum' : degre === 'echec-total' ? 'maximum' : 'normal', lancer);
}

/** Une transaction de fiche : perte effective, rupture et accoutumance, avec identité du jet. */
export function refusDePerteSAN(regle: RegleDeDeltaGreen, fiche: Fiche, perte: number, nature: TraumatismeDG, jetId: string): string | null {
    if (!regle.san || !regle.seuilRupture || !regle.pouvoir) return 'Le pilote ne déclare pas tous les champs de Santé Mentale : réimporter le pilote Delta Green 2.1.0 avec Remplacer.';
    if (!Number.isInteger(perte) || perte < 0) return 'La perte de SAN doit être un entier positif ou nul.';
    if (!jetId) return 'Lancer un test de SAN avant d’appliquer sa perte.';
    if (lireSuiviDG(fiche).pertesTraitees.includes(jetId)) return 'La perte de ce test de SAN est déjà appliquée.';
    const nombre = (champ: string) => {
        const v = fiche[champ];
        return typeof v === 'number' || typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
    };
    const san = nombre(regle.san), sr = nombre(regle.seuilRupture), pou = nombre(regle.pouvoir);
    if (!Number.isFinite(san)) return 'La Santé Mentale (SAN) n’est pas renseignée sur cette fiche.';
    if (san <= 0) return 'La SAN est déjà à 0 : aucune perte supplémentaire à retirer.';
    if (!Number.isFinite(sr)) return 'Le Seuil de rupture (SR) n’est pas renseigné sur cette fiche.';
    if (!Number.isFinite(pou) || pou <= 0) return 'Le Pouvoir (POU) doit être renseigné et supérieur à 0 sur cette fiche.';
    const suivi = lireSuiviDG(fiche);
    const apres = Math.max(0, san - perte);
    const accoutumance = nature !== 'inconcevable' && fiche[`accoutumance_${nature}`] !== true
        && perte > 0 && perte < 5 && apres > sr && suivi[nature] >= 2;
    if (accoutumance && nature === 'violence' && (!regle.charisme || !Number.isFinite(nombre(regle.charisme)))) return 'Le Charisme (CHA) est nécessaire pour appliquer le coût de l’accoutumance à la violence.';
    return null;
}

export function subirPerteSAN(regle: RegleDeDeltaGreen, fiche: Fiche, perte: number, nature: TraumatismeDG, jetId: string,
    lancer: (faces: number) => number): { maj: Fiche; texte: string } | null {
    if (refusDePerteSAN(regle, fiche, perte, nature, jetId)) return null;
    if (!regle.san || !regle.seuilRupture || !regle.pouvoir || !Number.isInteger(perte) || perte < 0 || !jetId) return null;
    const suivi = lireSuiviDG(fiche);
    if (suivi.pertesTraitees.includes(jetId)) return null;
    const avant = Number(fiche[regle.san]), sr = Number(fiche[regle.seuilRupture]), pou = Number(fiche[regle.pouvoir]);
    if (![avant, sr, pou].every(Number.isFinite) || avant <= 0 || pou <= 0) return null;
    const apres = Math.max(0, avant - perte);
    const effective = avant - apres;
    const rupture = effective > 0 && apres <= sr;
    const temporaire = perte >= 5;
    const permanent = apres === 0;
    const maj: Fiche = { [regle.san]: apres };
    const dits = [`SAN ${avant} → ${apres} (perte ${perte}, ${nature})`];
    const nouveau: SuiviDeltaGreen = { ...suivi, pertesTraitees: [...suivi.pertesTraitees, jetId],
        troubles: suivi.troubles + (rupture ? 1 : 0), folieTemporaire: suivi.folieTemporaire || temporaire, foliePermanente: suivi.foliePermanente || permanent };
    if (rupture) {
        maj[regle.seuilRupture] = apres - pou;
        dits.push(`Seuil de rupture atteint : nouveau seuil ${apres - pou} ; un trouble à choisir avec l’Officier Traitant, à la place d’une motivation`);
    }
    if (temporaire) dits.push('Folie temporaire : choisir fuite, lutte ou soumission avec l’Officier Traitant');
    if (permanent) dits.push('0 SAN : folie permanente ; retrait de l’Agent à décider avec l’Officier Traitant');
    if (nature !== 'inconcevable' && fiche[`accoutumance_${nature}`] !== true) {
        nouveau[nature] = temporaire || rupture || permanent ? 0 : Math.min(3, suivi[nature] + (effective > 0 ? 1 : 0));
        if (nouveau[nature] === 3) {
            const cout = lancer(6);
            maj[`accoutumance_${nature}`] = true;
            const champ = nature === 'violence' ? regle.charisme : regle.pouvoir;
            if (!champ || !Number.isFinite(Number(fiche[champ]))) return null;
            // Les caractéristiques à 0 ont leurs propres conséquences (p. 18) : aucun plancher fictif à 3.
            maj[champ] = Math.max(0, entier(fiche[champ]) - cout);
            if (nature === 'violence') for (let i = 1; i <= 5; i++) {
                if (fiche[`attache${i}`] !== undefined) maj[`attache${i}`] = Math.max(0, entier(fiche[`attache${i}`]) - cout);
            }
            dits.push(`Accoutumance à ${nature === 'violence' ? 'la violence' : 'l’impuissance'} : −${cout} ${nature === 'violence' ? 'CHA et à chaque Attache' : 'POU'}`);
            if (nature === 'impuissance' && fiche.VOL !== undefined) maj.VOL = Math.min(entier(fiche.VOL), Number(maj[champ]));
        }
        maj[`progression_${nature}`] = nouveau[nature];
    }
    maj[CLE_DELTA_GREEN] = nouveau;
    return { maj, texte: dits.join(' — ') };
}

export function cocherExperienceDG(regle: RegleDeDeltaGreen, fiche: Fiche, champ: string, degre: DegreDeReussite | undefined): Fiche {
    const caseId = regle.experience?.[champ];
    return caseId && champ !== regle.inconcevable && Number(fiche[champ]) > 0 && degre && !estUneReussite(degre) && fiche[caseId] !== true ? { [caseId]: true } : {};
}
export function ameliorerCompetencesDG(regle: RegleDeDeltaGreen, fiche: Fiche, lancer: (faces: number) => number): { maj: Fiche; texte: string } {
    const maj: Fiche = {}, dits: string[] = [];
    for (const [champ, caseId] of Object.entries(regle.experience ?? {})) {
        if (champ === regle.inconcevable || fiche[caseId] !== true || Number(fiche[champ]) <= 0) continue;
        const gain = lancer(4), avant = Number(fiche[champ]), apres = Math.min(99, avant + gain);
        maj[champ] = apres; maj[caseId] = false;
        dits.push(`${champ} ${avant} → ${apres} (1D4 = ${gain})`);
    }
    return { maj, texte: dits.join(' ; ') };
}

export function opposerDeltaGreen(joueur: { de: number; chances: number }, adversaire: { de: number; chances: number }, poursuite = false): string {
    if (![joueur, adversaire].every(j => Number.isInteger(j.de) && j.de >= 1 && j.de <= 100 && Number.isFinite(j.chances) && j.chances >= 1 && j.chances <= 99)) return 'Jet adverse invalide';
    const a = degreDuDe(joueur.de, echelleDeDeltaGreen(joueur.chances)), b = degreDuDe(adversaire.de, echelleDeDeltaGreen(adversaire.chances));
    const ra = estUneReussite(a), rb = estUneReussite(b);
    if (!ra && !rb && !poursuite) return 'Deux échecs : personne ne réussit (l’Officier Traitant peut retenir le plus petit résultat)';
    if (joueur.de === adversaire.de && ra === rb) return 'Égalité : à départager par l’Officier Traitant';
    const gagne = ra !== rb ? ra : ra
        ? (a === 'reussite-particuliere') !== (b === 'reussite-particuliere') ? a === 'reussite-particuliere' : joueur.de > adversaire.de
        : (a === 'echec-total') !== (b === 'echec-total') ? b === 'echec-total' : joueur.de < adversaire.de;
    const double = poursuite && (gagne ? a === 'reussite-particuliere' || b === 'echec-total' : b === 'reussite-particuliere' || a === 'echec-total');
    return `${gagne ? 'L’Agent' : 'L’adversaire'} l’emporte${double ? ' — compte double en poursuite' : ''}`;
}

export function resoudreLetalite(valeur: number, de: number, critique = false): { tue: boolean; degats: number; seuil: number } | null {
    if (!Number.isFinite(valeur) || valeur <= 0 || valeur > 100 || !Number.isInteger(de) || de < 1 || de > 100) return null;
    const seuil = Math.min(100, valeur * (critique ? 2 : 1));
    const chiffres = de === 100 ? [0, 0] : [Math.floor(de / 10), de % 10];
    return { tue: de <= seuil, degats: chiffres.reduce((s, c) => s + (c || 10), 0) * (critique ? 2 : 1), seuil };
}
