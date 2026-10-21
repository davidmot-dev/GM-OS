// Usage : node outils/alien/ameliorer-pilote-a2.mjs "Export Dirvers/corriges/Alien_driver_gmos_a0_a1.gmos-driver"
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
const source = process.argv[2];
assert.ok(source, 'Indiquer l’export A0/A1 à conserver.');
const original = fs.readFileSync(source), archive = new AdmZip(original);
const state = JSON.parse(archive.readAsText('state.json'));
const p = state.gameDriver, fiche = state.sheetTemplate;
assert.equal(p.corpusId, 'alien'); assert.equal(p.jet.panique.suites.mecanique, 'alien');
const ids = [p.id, fiche.id], avant = fiche.sections.flatMap(s => s.fields.map(f => f.id));
const section = fiche.sections.find(s => s.fields.some(f => f.id === 'field-1786783108730'));
assert.ok(section, 'Section des armes réelles requise.');
const colonnes = { noms: 'field-1786783108730', bonus: 'armes_bonus', degats: 'armes_degats', portees: 'armes_portees' };
section.fields.find(f => f.id === colonnes.noms).label = 'Armes — un nom par ligne (ancien texte conservé)';
for (const [id, label] of [[colonnes.bonus, 'Bonus des armes — un entier signé par ligne'], [colonnes.degats, 'Dégâts des armes — une valeur par ligne'], [colonnes.portees, 'Portée des armes — une portée par ligne']]) {
    if (!section.fields.some(f => f.id === id)) section.fields.push({ id, label, type: 'textarea', defaultValue: '' });
}
p.jet.alien = { competence: p.jet.reserve.composantes.find(c => c.sectionId === 'competences').id,
    competences: { machines_lourdes: 'machines', endurance: 'endurance', combat_rapproche: 'rapproche', mobilite: 'mobilite', combat_a_distance: 'distance', pilotage: 'pilotage', observation: 'observation', comtech: 'comtech', survie: 'survie', commandement: 'commandement', manipulation: 'manipulation', soins_medicaux: 'soins' }, equipement: colonnes };
p.jet.reserve.sansPlafond = true;
p.version = '1.2.0';
assert.deepEqual([p.id, fiche.id], ids);
assert.ok(avant.every(id => fiche.sections.some(s => s.fields.some(f => f.id === id))));
const manifest = JSON.parse(archive.readAsText('manifest.json'));
manifest.bundleId += '-a2'; manifest.exportedAt = new Date().toISOString();
const zip = new AdmZip();
for (const e of archive.getEntries()) if (!['state.json', 'manifest.json'].includes(e.entryName)) zip.addFile(e.entryName, e.getData());
zip.addFile('state.json', Buffer.from(JSON.stringify(state, null, 2)));
zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));
const sortie = 'Export Dirvers/corriges/Alien_driver_gmos_a2.gmos-driver';
zip.writeZip(sortie);
assert.deepEqual(JSON.parse(new AdmZip(sortie).readAsText('state.json')), state);
assert.deepEqual(original, fs.readFileSync(source));
fs.writeFileSync('Export Dirvers/corriges/alien_state_a2.json', JSON.stringify(state, null, 2) + '\n');
fs.mkdirSync('scratch/alien-a2', { recursive: true });
const rapport = { source, sha256Source: crypto.createHash('sha256').update(original).digest('hex'), sortie, ids,
    champsAvant: avant.length, champsApres: fiche.sections.flatMap(s => s.fields).length, originalInchange: true };
fs.writeFileSync('scratch/alien-a2/export.json', JSON.stringify(rapport, null, 2));
console.log(JSON.stringify(rapport));
