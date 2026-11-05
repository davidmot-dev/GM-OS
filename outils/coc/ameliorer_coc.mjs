/** COC-A1/A2/A3 — David, 04/11/2026 ; livre p. 71–73, 88–92, 108–111.
 * node outils/coc/ameliorer_coc.mjs <pilote-2.0> <sortie-2.1>
 * Identifiants, variantes d20/3d6 et anciennes clés conservés.
 */
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
const [entree, sortie] = process.argv.slice(2);
if (!entree || !sortie || path.resolve(entree) === path.resolve(sortie)) throw new Error('Deux chemins distincts sont requis.');
const zip = new AdmZip(entree), etat = JSON.parse(zip.readAsText('state.json'));
const p = etat.gameDriver, t = etat.sheetTemplate;
if (p.corpusId !== 'coc' || !p.jet?.coc || !p.combat?.encaissement) throw new Error('Pilote COC 2.0 corrigé requis.');
const armes = t.sections.find(s => s.id === 'armes');
for (let n = 1; n <= 3; n++) if (!armes.fields.some(f => f.id === `arme${n}_type`)) armes.fields.push({
    id: `arme${n}_type`, label: `Arme ${n} — type pour les DM`, type: 'select',
    options: ['', 'contact', 'lancer', 'distance', 'mains-nues', 'explosif'], defaultValue: '',
});
p.jet.coc.dommages = { force: 'force', armes: Array.from({ length: 3 }, (_, i) => {
    const a = `arme${i + 1}`; return { attaque: `${a}_attaque`, nom: a, dm: `${a}_dm`, critique: `${a}_bc`, type: `${a}_type` };
}) };
p.jet.coc.suivi = { defense: 'defense', constitution: 'constitution', initiative: 'initiative' };
p.jet.coc.pnj = true;
p.combat.encaissement.suivi = true;
p.version = '2.1.0';
zip.updateFile('state.json', Buffer.from(JSON.stringify(etat, null, 2)));
fs.mkdirSync(path.dirname(sortie), { recursive: true }); zip.writeZip(sortie);
console.log(`COC ${p.version} (${p.jet.coc.des}) → ${sortie}`);
