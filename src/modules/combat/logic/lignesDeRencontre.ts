import type { LigneDeRencontre, RencontrePreparee } from '../../../types/rencontres.types';
import type { GabaritDAdversaire } from '../useBestiaireStore';
import { archetypeParId, rangParId } from './archetypes';
import { NOMBRE_MAX, NOMBRE_MIN } from './nombreDExemplaires';

/**
 * **Écrire une rencontre ligne à ligne** — pour la Trame (R3, 2026-10-12) et
 * pour le panneau de Combat-OS, qui la lisent de la même façon.
 *
 * Le nombre proposé est celui du rang (`nombreSuggere`), comme dans l'Atelier :
 * quatre piétailles, un boss.
 */

/** Une ligne depuis un gabarit du bestiaire, avec son repli pour une autre machine. */
export const ligneDuGabarit = (g: GabaritDAdversaire): LigneDeRencontre => ({
    genre: 'gabarit', gabaritId: g.id, nombre: rangParId(g.rangId).nombreSuggere,
    nom: g.nom, archetypeId: g.archetypeId, rangId: g.rangId,
});

/** Une ligne depuis un archétype, au rang de piétaille par défaut. */
export const ligneDeLArchetype = (archetypeId: string, rangId = 'pietaille'): LigneDeRencontre => ({
    genre: 'archetype', archetypeId: archetypeParId(archetypeId).id, rangId,
    nombre: rangParId(rangId).nombreSuggere,
});

/** Un PNJ de la campagne. */
export const ligneDuPNJ = (entiteId: string): LigneDeRencontre => ({ genre: 'entite', entiteId });

/** Le nombre, borné comme dans l'Atelier. Un PNJ n'a pas de nombre. */
export function avecLeNombre(ligne: LigneDeRencontre, nombre: number): LigneDeRencontre {
    if (ligne.genre === 'entite') return ligne;
    const borne = Math.max(NOMBRE_MIN, Math.min(NOMBRE_MAX, Math.round(Number.isFinite(nombre) ? nombre : NOMBRE_MIN)));
    return { ...ligne, nombre: borne };
}

/** Ce qu'une ligne dit à l'écran : « 3 × Pillard », « Luv ». */
export function libelleDeLaLigne(ligne: LigneDeRencontre, nomDuPNJ: (id: string) => string | undefined): string {
    if (ligne.genre === 'entite') return nomDuPNJ(ligne.entiteId) ?? 'PNJ disparu';
    const nom = ligne.genre === 'gabarit' ? ligne.nom : (ligne.nom?.trim() || archetypeParId(ligne.archetypeId).nom);
    return ligne.nombre > 1 ? `${ligne.nombre} × ${nom}` : nom;
}

/** Toute la rencontre en une ligne de texte. */
export const resumeDeLaRencontre = (r: Pick<RencontrePreparee, 'lignes'>, nomDuPNJ: (id: string) => string | undefined) =>
    r.lignes.map(l => libelleDeLaLigne(l, nomDuPNJ)).join(', ');
