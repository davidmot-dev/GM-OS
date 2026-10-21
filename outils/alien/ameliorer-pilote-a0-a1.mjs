// Met à jour un EXPORT, jamais les données installées de David.
// Usage : node outils/alien/ameliorer-pilote-a0-a1.mjs "Export Dirvers/Alien_....gmos-driver"
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';

const source = process.argv[2];
assert.ok(source, 'Indiquer le chemin de l’export Alien à conserver.');
const original = fs.readFileSync(source);
const archive = new AdmZip(original);
const state = JSON.parse(archive.readAsText('state.json'));
const pilote = state.gameDriver;
const fiche = state.sheetTemplate;
assert.equal(pilote.corpusId, 'alien');
assert.equal(pilote.templateId, fiche.id);
const ids = { pilote: pilote.id, fiche: fiche.id };
const champs = fiche.sections.flatMap(s => s.fields);
for (const id of ['sante', 'force', 'niveau_de_stress', 'panique_en_cours', 'agilite', 'empathie', 'talent', 'androide']) {
    assert.ok(champs.some(f => f.id === id), `Champ manquant : ${id}`);
}
const clesAvant = champs.map(f => f.id);
pilote.jet.panique.suites = {
    mecanique: 'alien', stress: 'niveau_de_stress', agilite: 'agilite', empathie: 'empathie', talents: 'talent', androide: 'androide',
};
const stress = pilote.jet.reserve.secondaire.composantes.find(c => c.id === 'stress');
assert.ok(stress);
stress.motif = '^niveau_de_stress$';
// Ne pas transformer le plafond imprimé de dix cases en plafond de règle.
const stressSurLaFiche = champs.find(f => f.id === 'niveau_de_stress');
stressSurLaFiche.type = 'number';
delete stressSurLaFiche.max;
if (!pilote.combat.statsToTrack.some(s => s.fieldId === 'sante')) {
    pilote.combat.statsToTrack.unshift({ fieldId: 'sante', label: 'Santé', isMainHP: true, isResource: false, max: 'force' });
}
pilote.combat.santeDeDepart = 'force';
pilote.version = '1.1.0';
assert.deepEqual(ids, { pilote: pilote.id, fiche: fiche.id });
assert.deepEqual(clesAvant, fiche.sections.flatMap(s => s.fields.map(f => f.id)));
const manifest = JSON.parse(archive.readAsText('manifest.json'));
assert.equal(manifest.driverId, pilote.id);
manifest.exportedAt = new Date().toISOString();
manifest.bundleId = `${manifest.bundleId}-a0-a1`;
// Recréer les entrées : updateFile conservait le drapeau de descripteur du
// ZIP exporté en flux, puis produisait une archive illisible à la réouverture.
const corrige = new AdmZip();
for (const entree of archive.getEntries()) {
    if (!['state.json', 'manifest.json'].includes(entree.entryName)) corrige.addFile(entree.entryName, entree.getData());
}
corrige.addFile('state.json', Buffer.from(JSON.stringify(state, null, 2), 'utf8'));
corrige.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));
fs.mkdirSync('Export Dirvers/corriges', { recursive: true });
const sortie = 'Export Dirvers/corriges/Alien_driver_gmos_a0_a1.gmos-driver';
corrige.writeZip(sortie);
assert.deepEqual(JSON.parse(new AdmZip(sortie).readAsText('state.json')), state, 'Contrôler le vrai ZIP rouvert.');
fs.writeFileSync('Export Dirvers/corriges/alien_state_a0_a1.json', JSON.stringify(state, null, 2) + '\n');
assert.deepEqual(original, fs.readFileSync(source), 'L’original doit rester inchangé.');
const rapport = { source, sha256Source: crypto.createHash('sha256').update(original).digest('hex'), sortie, ...ids,
    sections: fiche.sections.length, champs: champs.length, originalInchange: true, clesConservees: true };
fs.mkdirSync('scratch/alien-a0-a1', { recursive: true });
fs.writeFileSync('scratch/alien-a0-a1/export.json', JSON.stringify(rapport, null, 2) + '\n');
console.log(JSON.stringify(rapport, null, 2));
