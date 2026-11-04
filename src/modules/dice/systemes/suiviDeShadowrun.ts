import { encaisserShadowrun, CAPACITES_DU_MONITEUR, type Gravite, type Moniteur, type Complication, type RegleDuMoniteurShadowrun as RegleDuMoniteur } from './shadowrun';

/** SR-A1, 04/11/2026 : les compteurs restent lisibles par la fiche HTML ; l'origine ne se devine jamais. */
export const CLE_SUIVI_SHADOWRUN = '__shadowrun';
export type OrigineDeBlessure = 'drain' | 'physique' | 'mental' | 'biofeedback' | 'inconnue';
export type SoinShadowrun = 'premiers-soins' | 'magie' | 'repos';
export interface BlessureShadowrun {
    id: string; gravite: Gravite; origine: OrigineDeBlessure;
    tentatives: ('premiers-soins' | 'magie')[];
    nature?: 'letal' | 'etourdissant';
}
export interface SuiviShadowrun {
    version: 1;
    blessures: BlessureShadowrun[];
    legereRecente: boolean;
    drainMineur: boolean;
    effetsAppliques: string[];
    essenceMortConfirmee: boolean;
}
const CLES = { legere: 'legeres', grave: 'graves', incapacitante: 'incapacitantes' } as const;
const GRAVITES: Gravite[] = ['incapacitante', 'grave', 'legere'];
const nombre = (v: unknown) => Number.isFinite(Number(v)) ? Math.max(0, Math.trunc(Number(v))) : 0;

export function lireSuiviShadowrun(fiche: Record<string, unknown>): SuiviShadowrun {
    const s = fiche[CLE_SUIVI_SHADOWRUN] as Partial<SuiviShadowrun> | undefined;
    return {
        version: 1, blessures: Array.isArray(s?.blessures) ? s.blessures.filter(b => b && GRAVITES.includes(b.gravite)
            && ['drain', 'physique', 'mental', 'biofeedback', 'inconnue'].includes(b.origine)).map(b => ({ ...b, tentatives: b.tentatives ?? [] })) : [],
        legereRecente: s?.legereRecente === true, drainMineur: s?.drainMineur === true,
        effetsAppliques: Array.isArray(s?.effetsAppliques) ? s.effetsAppliques : [],
        essenceMortConfirmee: s?.essenceMortConfirmee === true,
    };
}

/** Une ancienne case n'est pas déclarée soignable : son origine devra être renseignée. */
export function suivreLesCompteurs(r: RegleDuMoniteur, fiche: Record<string, unknown>): SuiviShadowrun {
    const s = lireSuiviShadowrun(fiche);
    const blessures = GRAVITES.flatMap(g => {
        const compte = nombre(fiche[r[CLES[g]]]);
        const existantes = s.blessures.filter(b => b.gravite === g);
        // Une correction manuelle conserve d'abord les origines connues, dont le drain.
        const gardees = [...existantes].sort((a, b) => Number(b.origine === 'drain') - Number(a.origine === 'drain')).slice(0, compte);
        let numero = 0;
        const ajout: BlessureShadowrun[] = [];
        while (gardees.length + ajout.length < compte) {
            const id = `ancienne-${g}-${numero++}`;
            if (!gardees.some(b => b.id === id)) ajout.push({ id, gravite: g, origine: 'inconnue', tentatives: [] });
        }
        return [...gardees, ...ajout];
    });
    return { ...s, blessures };
}

export function compteursShadowrun(s: SuiviShadowrun): Moniteur {
    return Object.fromEntries(Object.entries(CLES).map(([g, cle]) => [cle, s.blessures.filter(b => b.gravite === g).length])) as unknown as Moniteur;
}

export function ecrireSuiviShadowrun(r: RegleDuMoniteur, s: SuiviShadowrun, position = false): Record<string, unknown> {
    const m = compteursShadowrun(s);
    return { [CLE_SUIVI_SHADOWRUN]: s, [r.legeres]: m.legeres, [r.graves]: m.graves, [r.incapacitantes]: m.incapacitantes,
        ...(position && r.sante ? { [r.sante]: positionShadowrun(r, s, {}) } : {}) };
}

export function positionShadowrun(r: RegleDuMoniteur, s: SuiviShadowrun, fiche: Record<string, unknown>): number {
    const m = compteursShadowrun(s), c = capacitesShadowrun(r, fiche);
    return m.incapacitantes ? c.legeres + c.graves + 1 : m.graves ? c.legeres + m.graves : m.legeres;
}
export function capacitesShadowrun(r: RegleDuMoniteur, fiche: Record<string, unknown>): Moniteur {
    return { legeres: nombre(fiche[r.capacites?.legeres ?? '']) || CAPACITES_DU_MONITEUR.legeres,
        graves: nombre(fiche[r.capacites?.graves ?? '']) || CAPACITES_DU_MONITEUR.graves, incapacitantes: 1 };
}
export function ajouterBlessureShadowrun(r: RegleDuMoniteur, fiche: Record<string, unknown>, gravite: Gravite,
    origine: OrigineDeBlessure, id: string, nature?: BlessureShadowrun['nature']): SuiviShadowrun {
    const s = suivreLesCompteurs(r, fiche);
    if (s.effetsAppliques.includes(id)) return s;
    const avant = compteursShadowrun(s), e = encaisserShadowrun(gravite, avant, capacitesShadowrun(r, fiche));
    return { ...s, effetsAppliques: [...s.effetsAppliques, id],
        legereRecente: s.legereRecente || e.cochee === 'legere',
        blessures: e.moniteur[CLES[e.cochee]] === avant[CLES[e.cochee]] ? s.blessures
            : [...s.blessures, { id, gravite: e.cochee, origine, tentatives: [], ...(nature ? { nature } : {}) }] };
}
export function appliquerDrainShadowrun(r: RegleDuMoniteur, fiche: Record<string, unknown>, complication: Complication, id: string): Record<string, unknown> {
    let s = suivreLesCompteurs(r, fiche);
    if (s.effetsAppliques.includes(id) || complication === 'aucune') return {};
    if (complication === 'mineure') s = { ...s, drainMineur: true, effetsAppliques: [...s.effetsAppliques, id] };
    else s = ajouterBlessureShadowrun(r, fiche, complication === 'critique' ? 'legere' : 'incapacitante', 'drain', id);
    return { ...ecrireSuiviShadowrun(r, s, false), ...(r.sante ? { [r.sante]: positionShadowrun(r, s, fiche) } : {}) };
}

export const HEURES_DE_REPOS: Record<Gravite, number> = { legere: 8, grave: 24, incapacitante: 72 };
export function refusDuSoinShadowrun(b: BlessureShadowrun, soin: SoinShadowrun): string | undefined {
    if (soin !== 'repos' && b.origine === 'inconnue') return 'Renseignez l’origine de cette ancienne blessure avant les soins.';
    if (soin !== 'repos' && b.origine === 'drain') return 'Drain : seuls le repos et la guérison naturelle sont permis (p. 69).';
    if (soin !== 'repos' && b.tentatives.includes(soin)) return 'Cette tentative a déjà été utilisée sur cette case (p. 69).';
}

export interface RegleDesDerivesShadowrun {
    attributs?: string[];
    competences: { indice: string; attribut: string; reserve: string; reference?: string }[];
    seuils: { resistance: string; protection?: string; legere: string; grave: string; incapacitante: string }[];
}
export function derivesShadowrun(r: RegleDesDerivesShadowrun, fiche: Record<string, unknown>) {
    const lire = (cle: string) => fiche[cle] !== '' && fiche[cle] != null && Number.isFinite(Number(fiche[cle])) ? Number(fiche[cle]) : undefined;
    const lignes: { champ: string; valeur: number; actuelle: unknown; detail: string }[] = [];
    for (const c of r.competences) {
        const reference = c.reference ? fiche[c.reference] : undefined;
        const lie = typeof reference === 'string' && r.attributs?.includes(reference) ? reference : undefined;
        const indice = lire(c.indice), attribut = lire(lie ?? c.attribut);
        if (lie && attribut !== undefined) lignes.push({ champ: c.attribut, valeur: attribut, actuelle: fiche[c.attribut], detail: `${lie} ${attribut}` });
        if (indice !== undefined && attribut !== undefined) lignes.push({ champ: c.reserve, valeur: indice + attribut,
            actuelle: fiche[c.reserve], detail: `${indice} + ${attribut}` });
    }
    for (const c of r.seuils) {
        const resistance = lire(c.resistance), protection = c.protection ? lire(c.protection) : 0;
        // Une armure nommée n'est jamais interprétée comme un indice de protection.
        if (resistance === undefined || protection === undefined) continue;
        for (const [champ, ajout] of [[c.legere, 0], [c.grave, 3], [c.incapacitante, 6]] as const)
            lignes.push({ champ, valeur: resistance + protection + ajout, actuelle: fiche[champ], detail: `${resistance} + ${protection} + ${ajout}` });
    }
    return lignes;
}
