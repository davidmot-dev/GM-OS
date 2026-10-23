// Ajoute le module « Combat spatial » au pilote Alien — 23/10/2026, Claude Code, à la demande de David
// (« je voudrais aussi finir Alien aujourd'hui », périmètre complet). Version 1.9.0 ; A0–A8 conservés, fiche intacte.
// Usage : node outils/alien/ajouter-combat-spatial.mjs "Export Dirvers/Alien_driver_gmos_<export>.gmos-driver"
import fs from 'node:fs';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
const source = process.argv[2]; assert.ok(source, 'Indiquer le pilote Alien 1.8.0 à compléter.');
const original = fs.readFileSync(source), archive = new AdmZip(original), state = JSON.parse(archive.readAsText('state.json'));
const p = state.gameDriver, fiche = state.sheetTemplate;
assert.equal(p.corpusId, 'alien'); assert.ok(p.combat?.alien?.progression, 'Le pilote doit déjà contenir A7.');
const avant = structuredClone(fiche), ids = [p.id, fiche.id];
p.version = '1.9.0';
p.modulesDuJeu ??= [{ id: 'alien-muthur' }, { id: 'alien-detecteur' }];
if (!p.modulesDuJeu.some(m => m.id === 'alien-combat-spatial')) p.modulesDuJeu.push({ id: 'alien-combat-spatial' });
const manifest = JSON.parse(archive.readAsText('manifest.json')); manifest.exportedAt = new Date().toISOString(); manifest.bundleId += '-spatial';
const zip = new AdmZip();
for (const e of archive.getEntries()) if (!['state.json', 'manifest.json'].includes(e.entryName)) zip.addFile(e.entryName, e.getData());
zip.addFile('state.json', Buffer.from(JSON.stringify(state, null, 2))); zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));
const sortie = 'Export Dirvers/corriges/Alien_driver_gmos_combat-spatial.gmos-driver';
fs.mkdirSync('Export Dirvers/corriges', { recursive: true }); zip.writeZip(sortie);
assert.deepEqual(JSON.parse(new AdmZip(sortie).readAsText('state.json')), state);
assert.deepEqual(fs.readFileSync(source), original); assert.deepEqual(fiche, avant); assert.deepEqual([p.id, fiche.id], ids);
console.log(JSON.stringify({ sortie, version: p.version, modules: p.modulesDuJeu.map(m => m.id), champs: fiche.sections.flatMap(s => s.fields).length }));
