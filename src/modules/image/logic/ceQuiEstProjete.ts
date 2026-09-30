import type { ImageMedia, ProjectedEntity } from '../types';

/**
 * **Ce qui occupe un écran, et les écrans qu'occupe un média** — phase 4, L1,
 * étape 2 d'Image-OS, 2026-09-30.
 *
 * ⛔ **Un pad porte DEUX identifiants** : `id`, le sien, et `path`, celui du
 * fichier au Media Hub. La projection inscrit `path` comme occupant de l'écran
 * (`ImageService.projectMedia`, sa `marque` par défaut) ; la vignette, elle,
 * comparait `id` — **le badge de l'écran ne s'allumait donc jamais**, sur
 * aucune vignette projetée. Le même piège que la boucle des vidéos
 * (`ImagePad`, 2026-09-21), un étage plus haut.
 *
 * On accepte les deux : `path` est ce qu'écrit la projection d'aujourd'hui,
 * `id` ce qu'un instantané plus ancien a pu garder.
 */
export function estLOccupant(occupant: string | null | undefined, media: Pick<ImageMedia, 'id' | 'path'>): boolean {
    return !!occupant && (occupant === media.path || occupant === media.id);
}

/** Les écrans sur lesquels ce média est projeté. */
export function ecransDuMedia(
    projections: Record<string, string | null>,
    media: Pick<ImageMedia, 'id' | 'path'>,
): string[] {
    return Object.entries(projections)
        .filter(([, occupant]) => estLOccupant(occupant, media))
        .map(([ecran]) => ecran);
}

/** Les marqueurs : ils disent QUOI afficher, pas où le trouver. */
const MARQUEURS: Record<string, string> = {
    '__whiteboard__': 'Tableau blanc',
    '__tactical_map__': 'Carte tactique',
};

export type Occupant =
    | { genre: 'media'; media: ImageMedia }
    | { genre: 'fiche'; fiche: ProjectedEntity }
    | { genre: 'marqueur'; libelle: string }
    | { genre: 'adresse'; adresse: string };

/**
 * **Ce qui est sur cet écran**, pour le bloc « En direct ». `null` : rien —
 * l'écran montre son décor, ou le noir.
 */
export function occupantDeLEcran(
    projections: Record<string, string | null>,
    ecran: string,
    mediaList: ImageMedia[],
    ficheProjetee: ProjectedEntity | null,
): Occupant | null {
    const occupant = projections[ecran];
    if (!occupant) return null;

    if (ficheProjetee && occupant === ficheProjetee.id) return { genre: 'fiche', fiche: ficheProjetee };

    const media = mediaList.find(m => estLOccupant(occupant, m));
    if (media) return { genre: 'media', media };

    if (MARQUEURS[occupant]) return { genre: 'marqueur', libelle: MARQUEURS[occupant] };
    if (occupant.startsWith('__youtube__')) return { genre: 'marqueur', libelle: 'YouTube' };

    return { genre: 'adresse', adresse: occupant };
}
