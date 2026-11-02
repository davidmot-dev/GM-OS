/**
 * Les suppléments d'un jeu, et les sujets que David en retient.
 *
 * **§ 185 du registre, repris le 01/11/2026.** David : *« je veux pouvoir
 * enrichir mes drivers avec des suppléments à part, je dois pouvoir indiquer à
 * la forge que c'est un supplément et donc que les sujets doivent être plus
 * libres et moins cadrés »*. Ses quatre décisions du même jour : un sous-dossier
 * dédié (`corpusDeSupplement`), le corpus d'abord, **le carnet propose et David
 * choisit**, la langue du corpus du jeu.
 *
 * Deux fichiers JSON, que l'Oracle n'indexe pas :
 * - `systems/<jeu>/supplements/supplements.json` — les suppléments déclarés et
 *   leur titre (`cheminDesSupplements`) ;
 * - `systems/<jeu>/supplements/<slug>/sujets.json` — les sujets retenus, une
 *   fois cochés, renommés ou ajoutés. Sans lui, rouvrir l'atelier rendrait la
 *   liste brute du carnet et défairait les choix de David.
 */

import { slug } from '../../../../electron/corpusSysteme';
import { slugFiche, type SujetCanevas } from './canevas';
import type { BrainstormCandidate } from './types';
import type { EntreeInventaire } from './inventaire';

export interface SupplementDeclare {
  /** Le dossier — `colonial-marines`. */
  slug: string;
  /** Le titre du livre, tel que David l'a tapé. */
  titre: string;
}

/** Un JSON illisible vaut une liste vide : on ne bloque pas l'atelier sur lui. */
function lireJson(brut: string | null | undefined): unknown {
  if (!brut) return null;
  try { return JSON.parse(brut); } catch { return null; }
}

export function lireLesSupplements(brut: string | null | undefined): SupplementDeclare[] {
  const donnees = lireJson(brut);
  if (!Array.isArray(donnees)) return [];
  return donnees.flatMap((d): SupplementDeclare[] => {
    const titre = typeof d?.titre === 'string' ? d.titre.trim() : '';
    const dossier = slug(typeof d?.slug === 'string' && d.slug ? d.slug : titre);
    return titre && dossier ? [{ slug: dossier, titre }] : [];
  });
}

/**
 * Ajoute un supplément à la liste. Un titre qui retombe sur un slug connu
 * désigne le même dossier : on garde l'entrée existante plutôt que d'en créer
 * une jumelle qui écrirait au même endroit.
 */
export function ajouterUnSupplement(
  liste: readonly SupplementDeclare[],
  titre: string,
): { liste: SupplementDeclare[]; supplement: SupplementDeclare | null } {
  const propre = titre.trim();
  const dossier = slug(propre);
  if (!dossier) return { liste: [...liste], supplement: null };
  const connu = liste.find(s => s.slug === dossier);
  if (connu) return { liste: [...liste], supplement: connu };
  const supplement = { slug: dossier, titre: propre };
  return { liste: [...liste, supplement], supplement };
}

/** Un sujet retenu : ce qu'il faut pour le reproposer et le forger. */
export interface SujetRetenu {
  titre: string;
  mecanique: string;
  sections: string[];
}

export function lireLesSujets(brut: string | null | undefined): SujetRetenu[] | null {
  const donnees = lireJson(brut);
  if (!Array.isArray(donnees)) return null;
  return donnees.flatMap((d): SujetRetenu[] => {
    const titre = typeof d?.titre === 'string' ? d.titre.trim() : '';
    if (!titre) return [];
    return [{
      titre,
      mecanique: typeof d?.mecanique === 'string' ? d.mecanique : '',
      sections: Array.isArray(d?.sections) ? d.sections.filter((x: unknown) => typeof x === 'string') : [],
    }];
  });
}

/** Le marqueur qui dit, sur une carte, qu'elle vient d'un supplément. */
export const MARQUE_SUPPLEMENT = 'supplement';

export function candidatsDesSujets(sujets: readonly SujetRetenu[]): BrainstormCandidate[] {
  const vus = new Set<string>();
  return sujets.flatMap(s => {
    const id = slugFiche(s.titre);
    if (vus.has(id)) return [];
    vus.add(id);
    return [{
      id,
      title: s.titre,
      category: 'rule' as const,
      summary: s.mecanique,
      tags: ['oui', MARQUE_SUPPLEMENT, ...s.sections],
    }];
  });
}

export function sujetsDeLInventaire(entrees: readonly EntreeInventaire[]): SujetRetenu[] {
  return entrees.map(e => ({ titre: e.sujet, mecanique: e.mecanique, sections: e.sections }));
}

/** Le chemin inverse : ce qu'on écrit dans `sujets.json` après un choix. */
export function sujetsDesCandidats(candidats: readonly BrainstormCandidate[]): SujetRetenu[] {
  return candidats.map(c => ({
    titre: c.title,
    mecanique: c.summary,
    sections: c.tags.filter(t => t !== 'oui' && t !== MARQUE_SUPPLEMENT),
  }));
}

/**
 * Le canevas d'un supplément : les sujets retenus.
 *
 * `convertirFiche` rabat le sujet rendu par le carnet sur ce canevas. Le titre
 * demandé y figure, donc une fiche bien rendue tombe sur son slug ; une fiche
 * qui change de sujet est dite hors canevas, comme pour un livre de base.
 */
export function canevasDesCandidats(candidats: readonly BrainstormCandidate[]): SujetCanevas[] {
  return candidats.map(c => ({ clef: c.title, enonce: c.title }));
}

/**
 * Renommer, écarter, ajouter : les trois gestes du choix de David.
 * Rendent une liste neuve ; un renommage vers un sujet déjà présent est refusé,
 * il écrirait le même fichier.
 */
export function renommerLeSujet(
  candidats: readonly BrainstormCandidate[], id: string, titre: string,
): BrainstormCandidate[] {
  const propre = titre.trim();
  const nouvelId = slugFiche(propre);
  if (!propre || candidats.some(c => c.id === nouvelId && c.id !== id)) return [...candidats];
  return candidats.map(c => (c.id === id ? { ...c, id: nouvelId, title: propre } : c));
}

export function ecarterLeSujet(candidats: readonly BrainstormCandidate[], id: string): BrainstormCandidate[] {
  return candidats.filter(c => c.id !== id);
}

export function ajouterLeSujet(candidats: readonly BrainstormCandidate[], titre: string): BrainstormCandidate[] {
  const propre = titre.trim();
  const id = slugFiche(propre);
  if (!propre || candidats.some(c => c.id === id)) return [...candidats];
  return [...candidats, { id, title: propre, category: 'rule', summary: '', tags: ['oui', MARQUE_SUPPLEMENT] }];
}
