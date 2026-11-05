/** COC-A4/A5/A6 — David, 04/11/2026 : livre p. 29, 36–37, 60–61, 77–82.
 * node outils/coc/etendre_coc.mjs <pilote-2.1> <sortie-2.2>
 * Active les trois parcours ; ne modifie aucune valeur de personnage.
 */
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
const [entree, sortie] = process.argv.slice(2);
if (!entree || !sortie || path.resolve(entree) === path.resolve(sortie)) throw new Error('Deux chemins distincts sont requis.');
const zip = new AdmZip(entree), etat = JSON.parse(zip.readAsText('state.json'));
const p = etat.gameDriver, t = etat.sheetTemplate;
if (p.corpusId !== 'coc' || !p.jet?.coc?.suivi || !p.combat?.encaissement) throw new Error('Pilote COC 2.1 corrigé requis.');
const champs = t.sections.flatMap(s => s.fields);
p.jet.coc.heroisme = true; p.jet.coc.psychisme = true;
p.jet.coc.voies = { emplacements: Array.from({ length: 6 }, (_, i) => {
    const n = i + 1, reference = `voie${n}_reference`;
    if (!champs.some(f => f.id === reference)) t.sections.find(s => s.id === `voie_${n}`).fields.push({ id: reference,
        label: `Voie ${n} — référence des capacités proposées`, type: 'select', defaultValue: '', options: ['', 'contact', 'furtivite', 'investigation'] });
    return { nom: `voie${n}`, reference, rangs: Array.from({ length: 5 }, (_, r) => `voie${n}_rang${r + 1}`) };
}) };
p.combat.encaissement.heroisme = true;
p.version = '2.2.0';
zip.updateFile('state.json', Buffer.from(JSON.stringify(etat, null, 2)));
fs.mkdirSync(path.dirname(sortie), { recursive: true }); zip.writeZip(sortie);
console.log(`COC ${p.version} (${p.jet.coc.des}) → ${sortie}`);
