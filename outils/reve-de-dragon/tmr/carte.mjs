import { CASES } from './cases.mjs';
export { CASES };
export const GENRES = {
    cite: 'Cité', sanctuaire: 'Sanctuaire', plaines: 'Plaines', collines: 'Collines', foret: 'Forêt', monts: 'Monts',
    desert: 'Désert', gouffre: 'Gouffre', necropole: 'Nécropole', desolation: 'Désolation', pont: 'Pont', marais: 'Marais', lac: 'Lac', fleuve: 'Fleuve',
};
const index = new Map(CASES.map(c => [c.id, c]));
export const caseDe = id => index.get(id);
export const libelleCase = id => { const c = caseDe(id); return c ? `${c.id} · ${GENRES[c.genre]} ${c.nom}`.trim() : 'Position à choisir'; };
// Coordonnées axiales d'une grille à colonnes impaires décalées vers le bas.
// Géométrie écrite pour GM-OS, sans reprise du moteur Hexagon.js.
export function distance(a, b) {
    const x = caseDe(a), y = caseDe(b);
    if (!x || !y) throw new Error('Case TMR inconnue.');
    const q = x.col - y.col;
    const r = (x.ligne - Math.floor(x.col / 2)) - (y.ligne - Math.floor(y.col / 2));
    return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}
export const voisines = id => CASES.filter(c => distance(id, c.id) === 1).map(c => c.id);
export const humide = id => ['fleuve', 'lac', 'marais'].includes(caseDe(id)?.genre);
