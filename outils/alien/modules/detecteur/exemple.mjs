/**
 * Préréglage d'exemple du mode discret — 23/10/2026, demandé par David. Un relais à sept salles et
 * un hangar hors de portée : la créature passe par la gaine, la vermine n'est pas détectable, le
 * synthétique immobile ne se voit pas, le chien du hangar est trop loin (125 m, cinq zones).
 */
const zone = (id, nom, x, y, liens) => ({ id, nom, x, y, liens });
const pion = (id, nom, zoneId, humain, limite, mobile, detectable) => ({ id, nom, zoneId, humain, limite, depense: 0, mobile, detectable });

export const EXEMPLE_DU_RELAIS = Object.freeze({
  id: 'exemple-relais',
  nom: 'Exemple — relais à sept salles',
  reglages: { intensity: 25, volume: 25, contacts: 3, proximity: 45, noise: 10 },
  config: { crt: true, glitches: true },
  discret: {
    actif: true, tour: 1, terrain: 'interieur', energie: 5, porteurId: 'pj-rye', dernierScan: null,
    zones: [
      zone('sas', 'Sas principal', 0, 0, ['coursive-a']),
      zone('coursive-a', 'Coursive A', 25, 0, ['sas', 'mess', 'gaine']),
      zone('mess', 'Mess', 50, 0, ['coursive-a', 'infirmerie', 'coursive-b']),
      zone('infirmerie', 'Infirmerie', 50, 25, ['mess']),
      zone('gaine', 'Gaine technique', 50, -25, ['coursive-a', 'coursive-b']),
      zone('coursive-b', 'Coursive B', 75, 0, ['mess', 'gaine', 'labo']),
      zone('labo', 'Laboratoire', 100, 0, ['coursive-b', 'hangar']),
      zone('hangar', 'Hangar', 125, 0, ['labo']),
    ],
    pions: [
      pion('pj-rye', 'Rye (PJ, porteur)', 'sas', true, 2, false, true),
      pion('pj-davis', 'Davis (PJ)', 'sas', true, 2, false, true),
      pion('xeno', 'Xénomorphe', 'labo', false, 3, false, true),
      pion('synth', 'Synthétique caché', 'infirmerie', true, 2, false, true),
      pion('vermine', 'Vermine des gaines', 'gaine', false, 1, true, false),
      pion('chien', 'Chien de garde', 'hangar', false, 2, true, true),
    ],
  },
});
