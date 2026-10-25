/** État partagé des conflits de Dune. Seul le MJ écrit ; les projections excluent les secrets. */
import { entierDune, type AtoutDune } from './duneRegles';
export const ARENES_DUNE = ['duel', 'escarmouche', 'espionnage', 'guerre', 'intrigue'] as const;
export interface ZoneDune { id: string; nom: string; liens: string[]; visible: boolean; traits: string; disposition: string; desir: string; desirRevele: boolean; decouverte: number; discipline: number }
export interface AtoutDuConflit extends AtoutDune { proprietaire: string; visible: boolean; militaire: boolean }
export interface MaisonDune { nom: string; type: number; monde: string; domaines: string; roles: string; allies: string; ennemis: string; atouts: string }
export interface ConflitDune {
    version: 1; scene: string; arene: typeof ARENES_DUNE[number]; mode: 'agent' | 'architecte';
    zones: ZoneDune[]; atouts: AtoutDuConflit[]; maison: MaisonDune; journal: string[];
}
type Lecteur = { role: 'mj' | 'joueur' };
type Commande = { id: string; charge?: unknown };
const objet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const texte = (v: unknown, max = 2000) => { if (typeof v !== 'string' || v.length > max) throw new Error('Texte invalide.'); return v.trim(); };
const identifiant = (v: unknown) => { const s = texte(v, 128); if (!/^[\w:-]+$/.test(s)) throw new Error('Identifiant invalide.'); return s; };
const nombre = (v: unknown, min: number, max: number) => { if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < min || v > max) throw new Error('Nombre invalide.'); return v; };
export function creerConflitDune(): ConflitDune {
    return { version: 1, scene: '', arene: 'duel', mode: 'agent', zones: [], atouts: [], journal: [], maison: { nom: '', type: 1, monde: '', domaines: '', roles: '', allies: '', ennemis: '', atouts: '' } };
}
export function validerConflitDune(v: unknown): asserts v is ConflitDune {
    if (!objet(v) || v.version !== 1 || !ARENE(v.arene) || !['agent', 'architecte'].includes(String(v.mode)) || !Array.isArray(v.zones) || !Array.isArray(v.atouts)
        || v.zones.length > 100 || v.atouts.length > 500 || !Array.isArray(v.journal) || v.journal.length > 200 || !objet(v.maison)) throw new Error('Conflit Dune illisible.');
    texte(v.scene); v.journal.forEach(x => texte(x));
    if (Object.keys(v).some(k => !['version', 'scene', 'arene', 'mode', 'zones', 'atouts', 'maison', 'journal'].includes(k))) throw new Error('Champ Dune inconnu.');
    for (const z of v.zones) {
        if (!objet(z) || !Array.isArray(z.liens) || z.liens.length > 100 || typeof z.visible !== 'boolean' || typeof z.desirRevele !== 'boolean') throw new Error('Zone invalide.');
        identifiant(z.id); texte(z.nom); texte(z.traits); texte(z.disposition); texte(z.desir); nombre(z.discipline, 4, 8); nombre(z.decouverte, 0, 1000); z.liens.forEach(identifiant);
        if (Object.keys(z).some(k => !['id', 'nom', 'liens', 'visible', 'traits', 'disposition', 'desir', 'desirRevele', 'decouverte', 'discipline'].includes(k))) throw new Error('Champ de zone inconnu.');
    }
    for (const a of v.atouts) {
        if (!objet(a) || ['tangible', 'permanent', 'neutralise', 'visible', 'militaire'].some(k => typeof a[k] !== 'boolean') || !['offensif', 'defensif', 'autre'].includes(String(a.usage))) throw new Error('Atout invalide.');
        identifiant(a.id); texte(a.nom); texte(a.proprietaire); texte(a.zone); nombre(a.qualite, 0, 4);
        if (Object.keys(a).some(k => !['id', 'nom', 'proprietaire', 'qualite', 'tangible', 'permanent', 'visible', 'militaire', 'usage', 'zone', 'neutralise'].includes(k))) throw new Error('Champ d’atout inconnu.');
    }
    for (const k of ['nom', 'monde', 'domaines', 'roles', 'allies', 'ennemis', 'atouts']) texte(v.maison[k]);
    nombre(v.maison.type, 0, 3);
    const ids = v.zones.map(z => z.id), atouts = v.atouts.map(a => a.id);
    if (new Set(ids).size !== ids.length || new Set(atouts).size !== atouts.length) throw new Error('Identifiants dupliqués.');
    if (v.zones.some(z => z.liens.some((l: string) => !ids.includes(l))) || v.atouts.some(a => a.zone && !ids.includes(a.zone))) throw new Error('Zone liée absente.');
}
function ARENE(v: unknown): v is ConflitDune['arene'] { return ARENES_DUNE.includes(v as ConflitDune['arene']); }
export function migrerConflitDune(v: unknown, version: number) { if (version !== 1) throw new Error('Version Dune inconnue.'); validerConflitDune(v); return structuredClone(v); }
export function commanderConflitDune(etat: unknown, commande: Commande, lecteur: Lecteur): ConflitDune {
    validerConflitDune(etat);
    if (lecteur.role !== 'mj') throw new Error('Le meneur seul prépare et résout le conflit.');
    if (!objet(commande.charge)) throw new Error('Commande Dune illisible.');
    const e = structuredClone(etat), c = commande.charge;
    const zone = () => { const z = e.zones.find(z => z.id === c.zoneId); if (!z) throw new Error('Zone absente.'); return z; };
    const atout = () => { const a = e.atouts.find(a => a.id === c.atoutId); if (!a) throw new Error('Atout absent.'); return a; };
    switch (commande.id) {
        case 'cadre': if (!ARENE(c.arene) || !['agent', 'architecte'].includes(String(c.mode))) throw new Error('Cadre invalide.'); e.arene = c.arene; e.mode = c.mode as ConflitDune['mode']; break;
        case 'zone': {
            const id = identifiant(c.id), ancienne = e.zones.find(z => z.id === id);
            const z: ZoneDune = { id, nom: texte(c.nom), liens: ancienne?.liens ?? [], visible: c.visible === true, traits: texte(c.traits ?? ''),
                disposition: texte(c.disposition ?? ''), desir: texte(c.desir ?? ''), desirRevele: c.desirRevele === true, decouverte: ancienne?.decouverte ?? 0, discipline: nombre(c.discipline ?? 4, 4, 8) };
            e.zones = [...e.zones.filter(z => z.id !== id), z]; break;
        }
        case 'lier': {
            const a = zone(), b = e.zones.find(z => z.id === c.autreId); if (!b || a.id === b.id) throw new Error('Deux zones différentes sont nécessaires.');
            a.liens = [...new Set([...a.liens, b.id])]; b.liens = [...new Set([...b.liens, a.id])]; break;
        }
        case 'atout': {
            const a: AtoutDuConflit = { id: identifiant(c.id), nom: texte(c.nom), proprietaire: texte(c.proprietaire ?? ''), qualite: nombre(c.qualite ?? 0, 0, 4),
                tangible: c.tangible === true, permanent: c.permanent === true, visible: c.visible === true, militaire: c.militaire === true,
                usage: c.usage === 'offensif' || c.usage === 'defensif' ? c.usage : 'autre', zone: texte(c.zone ?? ''), neutralise: false };
            e.atouts = [...e.atouts.filter(x => x.id !== a.id), a]; break;
        }
        case 'deplacer': {
            const a = atout(), z = zone();
            if (a.neutralise) throw new Error('Cet atout est neutralisé.');
            const origine = e.zones.find(z => z.id === a.zone);
            if (origine && !origine.liens.includes(z.id)) throw new Error('Reliez les zones adjacentes avant le déplacement.');
            a.zone = z.id; break;
        }
        case 'neutraliser': { const a = atout(); if (a.tangible) a.neutralise = true; else e.atouts = e.atouts.filter(x => x.id !== a.id); break; }
        case 'recuperer': { const a = atout(); if (!a.tangible) throw new Error('Un atout intangible détruit ne se récupère pas.'); a.neutralise = false; break; }
        case 'desir': {
            const z = zone();
            if (c.reussi !== true) break;
            z.decouverte += Math.max(0, nombre(c.analyse, 4, 8) - 2) + entierDune(c.bonus, 0, 1);
            if (z.decouverte >= z.discipline) z.desirRevele = true;
            break;
        }
        case 'maison': {
            for (const k of ['nom', 'monde', 'domaines', 'roles', 'allies', 'ennemis', 'atouts'] as const) if (c[k] !== undefined) e.maison[k] = texte(c[k]);
            if (c.type !== undefined) e.maison.type = nombre(c.type, 0, 3); break;
        }
        case 'scene': e.scene = texte(c.nom); e.atouts = e.atouts.filter(a => a.permanent).map(a => ({ ...a, neutralise: false })); break;
        default: throw new Error('Commande Dune inconnue.');
    }
    // Le journal partagé ne contient jamais les charges privées des commandes.
    e.journal = [...e.journal, `Mise à jour : ${commande.id}`].slice(-200); validerConflitDune(e); return e;
}
export function vueConflitDune(etat: unknown, lecteur: Lecteur): ConflitDune {
    validerConflitDune(etat); const e = structuredClone(etat);
    if (lecteur.role === 'mj') return e;
    const visibles = new Set(e.zones.filter(z => z.visible).map(z => z.id));
    e.zones = e.zones.filter(z => z.visible).map(z => ({ ...z, liens: z.liens.filter(l => visibles.has(l)), desir: z.desirRevele ? z.desir : '', decouverte: z.desirRevele ? z.discipline : 0 }));
    e.atouts = e.atouts.filter(a => a.visible && (!a.zone || visibles.has(a.zone)));
    e.journal = []; return e;
}
