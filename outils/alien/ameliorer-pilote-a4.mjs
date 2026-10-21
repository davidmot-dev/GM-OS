// Usage : node outils/alien/ameliorer-pilote-a4.mjs "Export Dirvers/corriges/Alien_driver_gmos_a3.gmos-driver"
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
const source = process.argv[2]; assert.ok(source, 'Indiquer le pilote A3 à conserver.');
const original = fs.readFileSync(source), archive = new AdmZip(original);
const state = JSON.parse(archive.readAsText('state.json')), p = state.gameDriver;
assert.equal(p.corpusId, 'alien'); assert.ok(p.combat.alien?.androide); assert.equal(p.combat.alien.androide, p.jet.panique.suites.androide);
assert.deepEqual(p.combat.alien, p.jet.alien.combat);
const ficheAvant = JSON.stringify(state.sheetTemplate), id = p.id;
// A4 lit la case Androïde déjà reliée à l'HTML. Aucun champ ni identifiant à remplacer.
p.version = '1.4.0';
const manifest = JSON.parse(archive.readAsText('manifest.json')); manifest.exportedAt = new Date().toISOString(); manifest.bundleId += '-a4';
const zip = new AdmZip();
for (const e of archive.getEntries()) if (!['state.json', 'manifest.json'].includes(e.entryName)) zip.addFile(e.entryName, e.getData());
zip.addFile('state.json', Buffer.from(JSON.stringify(state, null, 2))); zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));
const sortie = 'Export Dirvers/corriges/Alien_driver_gmos_a4.gmos-driver'; zip.writeZip(sortie);
assert.deepEqual(JSON.parse(new AdmZip(sortie).readAsText('state.json')), state);
assert.equal(JSON.stringify(state.sheetTemplate), ficheAvant); assert.equal(p.id, id); assert.deepEqual(fs.readFileSync(source), original);
fs.writeFileSync('Export Dirvers/corriges/alien_state_a4.json', JSON.stringify(state, null, 2) + '\n');
fs.mkdirSync('scratch/alien-a4/pilotes', { recursive: true }); fs.copyFileSync(sortie, 'scratch/alien-a4/pilotes/Alien.gmos-driver');
const rapport = { source, sha256Source: crypto.createHash('sha256').update(original).digest('hex'), sortie, id, champs: state.sheetTemplate.sections.flatMap(s => s.fields).length, ficheInchangee: true, originalInchange: true };
fs.writeFileSync('scratch/alien-a4/export.json', JSON.stringify(rapport, null, 2)); console.log(JSON.stringify(rapport));
