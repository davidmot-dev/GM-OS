import type { PointDeTrame, StyleDeLienDeTrame, TrajetDeTrame } from '../../../types/campaign.types';
import { JONCTIONS_DES_LIENS } from './stylesDesLiensDeTrame';

export const pointDeTrameValide = (p: PointDeTrame | undefined): p is PointDeTrame =>
    !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
export const memePositionDeTrame = (a: PointDeTrame | undefined, b: PointDeTrame | undefined) =>
    pointDeTrameValide(a) && pointDeTrameValide(b) && Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;

/** Après un déplacement ou une nouvelle jonction, seul le trajet devenu périmé est écarté. */
export function trajetDeTrameValide(trajet: TrajetDeTrame | undefined, depart: PointDeTrame, arrivee: PointDeTrame,
    style?: StyleDeLienDeTrame): trajet is TrajetDeTrame {
    return !!trajet && Array.isArray(trajet.points) && trajet.points.length >= 2 && trajet.points.length <= 500
        && trajet.points.every(pointDeTrameValide)
        && Object.hasOwn(JONCTIONS_DES_LIENS, trajet.depart) && Object.hasOwn(JONCTIONS_DES_LIENS, trajet.arrivee)
        && memePositionDeTrame(trajet.positionDepart, depart) && memePositionDeTrame(trajet.positionArrivee, arrivee)
        && (!style?.depart || trajet.depart === style.depart) && (!style?.arrivee || trajet.arrivee === style.arrivee);
}

/** Les extrémités React Flow sont au bord extérieur des accroches, six pixels hors carte. */
export function cheminDuTrajet(points: PointDeTrame[], depart: PointDeTrame, arrivee: PointDeTrame): string {
    const chemin = [depart, ...points.slice(1, -1), arrivee];
    return chemin.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
}

export function milieuDuTrajet(points: PointDeTrame[]): PointDeTrame {
    const longueurs = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
    let reste = longueurs.reduce((s, l) => s + l, 0) / 2;
    for (let i = 0; i < longueurs.length; i++) {
        if (reste <= longueurs[i]) {
            const t = longueurs[i] ? reste / longueurs[i] : 0;
            return { x: points[i].x + (points[i + 1].x - points[i].x) * t, y: points[i].y + (points[i + 1].y - points[i].y) * t };
        }
        reste -= longueurs[i];
    }
    return points[0];
}
