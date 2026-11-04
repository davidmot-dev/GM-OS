/** SR-A4/A5/A6, David, 04/11/2026 : p. 64-67, 78, 81-82, 127, 233.
 * Résistance retenue explicitement : tableau p. 69, Structure ×1/×2/×3 + Blindage.
 * node outils/shadowrun-anarchy/etendre_shadowrun.mjs <pilote 2.1.0> <sortie>
 */
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
const [entree, sortie] = process.argv.slice(2);
if (!entree || !sortie || path.resolve(entree) === path.resolve(sortie)) throw new Error('Deux chemins distincts sont requis.');
const z = new AdmZip(entree), etat = JSON.parse(z.readAsText('state.json')), d = etat.gameDriver;
if (d.corpusId !== 'shadowrun-anarchy' || !d.jet?.shadowrun?.suivi) throw new Error('Partir du pilote Shadowrun 2.1.0 corrigé.');
const ressources = d.ressourcesDeTable ?? [];
// Identifiants du pilote livré ; aucune reconnaissance par son libellé traduit.
const plan = ressources.find(r => r.id === 'reserveDePlanification'), menace = ressources.find(r => r.id === 'reserveDeMenace');
if (!plan || !menace) throw new Error('Réserves natives Planification et Menace introuvables.');
d.jet.shadowrun.table = { planification: plan.id, menace: menace.id };
d.jet.shadowrun.opposition = true;
d.jet.shadowrun.rigging = { resistance: 'tableau-blessures' };
d.version = '2.2.0';
z.updateFile('state.json', Buffer.from(JSON.stringify(etat, null, 2)));
fs.mkdirSync(path.dirname(sortie), { recursive: true }); z.writeZip(sortie);
console.log(`Shadowrun Anarchy 2.2.0 → ${sortie}`);
