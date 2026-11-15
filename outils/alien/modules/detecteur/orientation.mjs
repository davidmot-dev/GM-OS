/** Cap du plan : nord en haut, degrés horaires. Le cône est un réglage de mise en scène. */
export const OUVERTURES = Object.freeze([45, 90, 180, 360]);
export function anglesDuChamp({ cap, ouverture }) {
  return { debut: (cap - 90 - ouverture / 2) * Math.PI / 180,
    fin: (cap - 90 + ouverture / 2) * Math.PI / 180 };
}
export function dansLeChamp({ x, y }, { cap, ouverture }) {
  if (ouverture === 360 || (x === 0 && y === 0)) return true;
  const direction = Math.atan2(x, -y) * 180 / Math.PI;
  const ecart = Math.abs(((direction - cap + 540) % 360 + 360) % 360 - 180);
  return ecart <= ouverture / 2 + 1e-7;
}
/**
 * **Les échos de la zone du porteur** (David, 15/11/2026) : un écho de même zone tombait au centre exact,
 * caché sous le marqueur du porteur. On le montre en points tout proches du centre — un par pion,
 * six au plus — répartis dans le cône, pour qu'ils se voient sans mentir sur la distance.
 */
export const RAYON_DE_MEME_ZONE = 0.07;
export function pointsDeMemeZone(nombre, { cap, ouverture }) {
  const n = Math.max(1, Math.min(6, Math.floor(nombre)));
  const etendue = ouverture >= 360 ? 360 : Math.max(0, ouverture - 10);
  return Array.from({ length: n }, (_, i) => {
    const angle = ouverture >= 360 ? cap + i * 360 / n : cap + (n === 1 ? 0 : -etendue / 2 + i * etendue / (n - 1));
    const rayon = RAYON_DE_MEME_ZONE * (i % 2 ? 0.8 : 1);
    return { x: rayon * Math.sin(angle * Math.PI / 180), y: -rayon * Math.cos(angle * Math.PI / 180) };
  });
}
