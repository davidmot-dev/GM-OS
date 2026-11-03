import type { SheetField, SheetTemplate } from '../../../data/defaultSheetTemplates';
import type { GameDriver } from '../../../types/drivers';
import type { PlayerCharacter } from '../../../types/player.types';
import { ficheNeuve } from './ficheNeuve';

type ChampsRepris = Pick<PlayerCharacter, 'sheetData' | 'systemId' | 'templateId' | 'ficheId' | 'referenceDeFiche'>;
export interface LiaisonDeReprise { source: string; cible: string }
export interface SauvegardeDeReprise {
    format: 'gmos-reprise-fiche';
    version: 1;
    joueurId: string;
    personnageId: string;
    avant: ChampsRepris;
    apres: ChampsRepris;
}
const possede = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const clesInterdites = new Set(['__proto__', 'prototype', 'constructor']);

/** Comparaison exacte du schéma utile, sans prétendre retrouver une version historique. */
export function referenceDeFiche(pilote: GameDriver, gabarit: Pick<SheetTemplate, 'id' | 'sections'>): NonNullable<PlayerCharacter['referenceDeFiche']> {
    return {
        piloteId: pilote.id, version: pilote.version, gabaritId: gabarit.id,
        structure: JSON.stringify(gabarit.sections.map(s => [s.id, s.fields])),
    };
}

function champsRepris(p: ChampsRepris): ChampsRepris {
    return structuredClone({ sheetData: p.sheetData, templateId: p.templateId, systemId: p.systemId,
        ficheId: p.ficheId, referenceDeFiche: p.referenceDeFiche });
}

function canonique(v: unknown): string {
    if (Array.isArray(v)) return '[' + v.map(canonique).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.entries(v).filter(([, valeur]) => valeur !== undefined)
        .sort(([a], [b]) => a.localeCompare(b)).map(([k, valeur]) => JSON.stringify(k) + ':' + canonique(valeur)).join(',') + '}';
    return JSON.stringify(v) ?? 'undefined';
}

function valeurPour(champ: SheetField, valeur: unknown): string | number | boolean {
    if (['number', 'gauge', 'rating'].includes(champ.type)) {
        const nombre = typeof valeur === 'number' ? valeur
            : typeof valeur === 'string' && valeur.trim() ? Number(valeur) : NaN;
        if (Number.isFinite(nombre)) return nombre;
    } else if (champ.type === 'checkbox') {
        if (typeof valeur === 'boolean') return valeur;
    } else if (champ.type !== 'formula' && typeof valeur === 'string'
        && (champ.type !== 'select' || champ.options?.includes(valeur))) return valeur;
    throw new Error(`Valeur incompatible avec « ${champ.label} ». La saisie d'origine est conservée.`);
}

/** NP-C2 : seules des liaisons choisies explicitement peuvent renommer une valeur.
 * Toutes les anciennes clés restent présentes, y compris zéro, faux, notes et objets.
 * La santé, le narratif et l'inventaire du personnage ne sont jamais réinitialisés. */
export function preparerRepriseDeFiche(
    personnage: PlayerCharacter, pilote: GameDriver, gabarit: SheetTemplate,
    liaisons: readonly LiaisonDeReprise[] = [],
) {
    if (gabarit.id !== pilote.templateId || (personnage.systemId && personnage.systemId !== pilote.id)) {
        throw new Error('Cette reprise doit rester dans le jeu du personnage.');
    }
    const champs = gabarit.sections.flatMap(s => s.fields);
    if (new Set(champs.map(c => c.id)).size !== champs.length || champs.some(c => clesInterdites.has(c.id))) {
        throw new Error('Le gabarit contient des identifiants ambigus.');
    }
    const ancienne = personnage.sheetData ?? {};
    const valeurs = structuredClone(ancienne);
    const ajoutes = champs.filter(c => !possede(ancienne, c.id));
    const defauts = ficheNeuve(gabarit);
    for (const c of ajoutes) valeurs[c.id] = defauts[c.id];
    const dejaLiees = new Set<string>();
    for (const liaison of liaisons) {
        const cible = champs.find(c => c.id === liaison.cible);
        if (!cible || !possede(ancienne, liaison.source) || clesInterdites.has(liaison.source)
            || dejaLiees.has(liaison.cible)) throw new Error('Liaison absente ou plusieurs sources pour la même cible.');
        valeurs[cible.id] = valeurPour(cible, ancienne[liaison.source]);
        dejaLiees.add(cible.id);
    }
    const reference = referenceDeFiche(pilote, gabarit);
    const avant = champsRepris(personnage);
    const apres = champsRepris({ ...avant, sheetData: valeurs, systemId: pilote.id, templateId: gabarit.id,
        referenceDeFiche: reference,
        // Une fiche HTML d'un autre gabarit ne doit pas réimposer ses valeurs.
        ficheId: personnage.templateId === gabarit.id ? personnage.ficheId : undefined });
    return {
        avant, apres, ajoutes,
        horsGabarit: Object.keys(ancienne).filter(k => !champs.some(c => c.id === k)),
        incompatibles: champs.filter(c => {
            if (!possede(ancienne, c.id) || c.type === 'formula') return false;
            try { valeurPour(c, ancienne[c.id]); return false; } catch { return true; }
        }),
        versionConnue: personnage.referenceDeFiche?.version,
        referenceConforme: canonique(personnage.referenceDeFiche) === canonique(reference),
        changements: champs.filter(c => !possede(ancienne, c.id) || canonique(ancienne[c.id]) !== canonique(valeurs[c.id]))
            .map(c => ({ id: c.id, label: c.label, avant: ancienne[c.id], apres: valeurs[c.id] })),
    };
}

export function sauvegarderReprise(joueurId: string, personnageId: string,
    plan: Pick<ReturnType<typeof preparerRepriseDeFiche>, 'avant' | 'apres'>): SauvegardeDeReprise {
    return structuredClone({ format: 'gmos-reprise-fiche', version: 1, joueurId, personnageId, avant: plan.avant, apres: plan.apres });
}

/** Le fichier n'est pas un import de personnage : seules les rubriques reprises sont lues. */
export function lireSauvegardeDeReprise(texte: string): SauvegardeDeReprise {
    const v: unknown = JSON.parse(texte);
    const objet = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
    const valide = (x: unknown) => objet(x) && objet(x.sheetData) && typeof x.templateId === 'string'
        && (x.systemId === undefined || typeof x.systemId === 'string')
        && (x.ficheId === undefined || typeof x.ficheId === 'string')
        && (x.referenceDeFiche === undefined || (objet(x.referenceDeFiche)
            && ['piloteId', 'version', 'gabaritId', 'structure'].every(k => typeof x.referenceDeFiche === 'object'
                && typeof (x.referenceDeFiche as Record<string, unknown>)[k] === 'string')));
    if (!objet(v) || v.format !== 'gmos-reprise-fiche' || v.version !== 1 || typeof v.joueurId !== 'string'
        || typeof v.personnageId !== 'string' || !valide(v.avant) || !valide(v.apres)) {
        throw new Error('Ce fichier n’est pas une sauvegarde de reprise de fiche valide.');
    }
    const sauvegarde = v as unknown as SauvegardeDeReprise;
    return { format: 'gmos-reprise-fiche', version: 1, joueurId: sauvegarde.joueurId, personnageId: sauvegarde.personnageId,
        avant: champsRepris(sauvegarde.avant), apres: champsRepris(sauvegarde.apres) };
}

export function appliquerRepriseSauvegardee(sauvegarde: SauvegardeDeReprise, joueurId: string,
    personnage: PlayerCharacter, restaurer = false): ChampsRepris {
    if (sauvegarde.joueurId !== joueurId || sauvegarde.personnageId !== personnage.id) {
        throw new Error('Cette sauvegarde appartient à un autre personnage.');
    }
    if (canonique(champsRepris(personnage)) !== canonique(restaurer ? sauvegarde.apres : sauvegarde.avant)) {
        throw new Error('La fiche a changé depuis la sauvegarde. Préparez un nouvel aperçu avant toute reprise.');
    }
    return champsRepris(restaurer ? sauvegarde.avant : sauvegarde.apres);
}
