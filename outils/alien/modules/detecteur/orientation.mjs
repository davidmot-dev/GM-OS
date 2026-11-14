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
