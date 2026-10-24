import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { facteurDInitiative, type CategorieDAction } from '../../dice/systemes/roundDeReveDeDragon';

/**
 * Les armes d'un Voyageur, lues sur sa fiche, avec leur facteur d'initiative
 * (Livre des Voyageurs 2.3.1, p. 120). Les trois premières lignes du tableau
 * Combat portent leur nom ; les suivantes sont nommées par le joueur
 * (`combat_3_name`…) — on devine alors la famille au nom, et le meneur corrige.
 */
export interface ArmeDuVoyageur {
    cle: string;
    nom: string;
    categorie: Extract<CategorieDAction, 'tir' | 'lancer' | 'melee'>;
    niveau: number;
    /** La caractéristique dérivée qui la porte : Mêlée, Tir ou Lancer. */
    derivee: number;
    facteur: number;
}

/** La famille d'une arme d'après son nom ; `null` pour une défense (esquive, bouclier). */
export function familleDeLArme(nom: string): ArmeDuVoyageur['categorie'] | null {
    const n = nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (/esquive|bouclier/.test(n)) return null;
    if (/\barc\b|arbalete|fronde/.test(n)) return 'tir';
    if (/jet|javelot|javeline|fouet|lancer/.test(n)) return 'lancer';
    return 'melee';
}

export function armesDuVoyageur(d: Record<string, unknown>, fiche: SheetTemplate): ArmeDuVoyageur[] {
    const champs = fiche.sections.find(s => s.id === 'combat')?.fields ?? [];
    return champs.flatMap((champ, i) => {
        const nom = String(d[`combat_${i}_name`] ?? '').trim() || champ.label;
        const categorie = familleDeLArme(nom);
        if (!categorie) return [];
        const niveau = Number(d[champ.id] ?? 0) || 0, derivee = Number(d[categorie] ?? 0) || 0;
        return [{ cle: champ.id, nom, categorie, niveau, derivee, facteur: facteurDInitiative(derivee, niveau) }];
    });
}
