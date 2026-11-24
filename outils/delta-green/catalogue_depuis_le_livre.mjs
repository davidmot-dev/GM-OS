// Le pilote Delta Green 2.2.0 — 24/11/2026 : le catalogue d'équipement refait depuis le livre.
// Demande de David : « finalise Delta Green ».
//
// Le catalogue de l'export du 21/11 (195 objets) avait été versé par la Forge depuis la fiche
// `equipement-et-materiel.md` telle que NotebookLM l'avait générée : ses tableaux d'armes à feu,
// d'armes lourdes, d'explosifs, d'artillerie, de protections, de véhicules et de biens étaient en
// grande partie inventés (catégories « Cher » et « Très cher », casque en Kevlar à 4, C4 à 15 %,
// missile de croisière à 60 %, lance-flammes à 25 m…). La fiche est relue et retranscrite du
// *Manuel de l'Agent* le 24/11 (p. 84-103, PDF = imprimée + 1) ; ce script en tire le catalogue par
// `remplirDepuisLesFiches`, la fonction même de la Forge, sur un catalogue VIDE : les objets nés de
// l'ancienne fiche disparaissent, ceux que David aurait ajoutés à la main (une autre source) restent.
//
// Rien d'autre ne change : jet, fiche, combat, identité visuelle, bannière, identifiants.
//
// Usage : node outils/delta-green/catalogue_depuis_le_livre.mjs [export.gmos-driver]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { createJiti } from 'jiti';

const dossier = 'Export Dirvers';
const source = process.argv[2]
    ?? path.join(dossier, fs.readdirSync(dossier).filter(f => /^Delta_Green_driver.*\.gmos-driver$/.test(f)).sort().at(-1));
const original = fs.readFileSync(source);
const archive = new AdmZip(source);
const etat = JSON.parse(archive.readAsText('state.json'));
const avant = structuredClone(etat);
const { gameDriver: p, sheetTemplate: fiche } = etat;
assert.equal(p.version, '2.1.0', `Pilote 2.1.0 attendu, ${p.version} trouvé.`);

const jiti = createJiti(import.meta.url);
const { remplirDepuisLesFiches } = await jiti.import('../../src/modules/equipement/depuisLeCorpus.ts');
const { controlerLePilote } = await jiti.import('../../src/modules/forge/rules/controlesDuPilote.ts');

const CHEMIN = 'systems/delta-green/rules/equipement-et-materiel.md';
const contenu = fs.readFileSync(path.join('docs', CHEMIN), 'utf8').replace(/\r\n/g, '\n');
assert.match(contenu, /^relu: true$/m, "La fiche d'équipement n'est pas relue : on n'en tire rien.");

const champs = fiche.sections.flatMap(s => s.fields).map(f => ({ id: f.id, label: f.label }));
const { catalogue, journal } = remplirDepuisLesFiches(undefined, [{ chemin: CHEMIN, contenu, livre: 'Delta Green' }], champs);
assert.deepEqual(journal.lignesNonLues, [], `Lignes non lues : ${JSON.stringify(journal.lignesNonLues)}`);

// Les objets d'une autre source que la fiche (ajoutés à la main) sont gardés, à la fin.
const anciens = p.catalogue?.objets ?? [];
const aLaMain = anciens.filter(o => o.source?.fiche !== CHEMIN);
const noms = new Set(catalogue.objets.map(o => o.nom));
for (const o of aLaMain) if (!noms.has(o.nom)) catalogue.objets.push(o);

p.catalogue = catalogue;
p.version = '2.2.0';

// Rien d'autre n'a bougé.
assert.deepEqual({ ...p, version: '2.1.0', catalogue: avant.gameDriver.catalogue }, avant.gameDriver);
assert.deepEqual(etat.sheetTemplate, avant.sheetTemplate);

const constats = controlerLePilote(p, fiche);
const erreurs = constats.filter(c => c.gravite === 'erreur');
assert.deepEqual(erreurs, [], JSON.stringify(erreurs, null, 2));

const manifeste = JSON.parse(archive.readAsText('manifest.json'));
manifeste.exportedAt = new Date().toISOString();
const zip = new AdmZip();
for (const e of archive.getEntries()) if (!['state.json', 'manifest.json'].includes(e.entryName)) zip.addFile(e.entryName, e.getData());
zip.addFile('state.json', Buffer.from(JSON.stringify(etat, null, 2)));
zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifeste, null, 2)));
const sortie = path.join(dossier, 'corriges', 'Delta-Green-2.2.0.gmos-driver');
zip.writeZip(sortie);
assert.deepEqual(JSON.parse(new AdmZip(sortie).readAsText('state.json')), etat);
assert.deepEqual(fs.readFileSync(source), original, "L'export d'origine a changé.");

const parFamille = {};
for (const o of catalogue.objets) parFamille[o.famille] = (parFamille[o.famille] ?? 0) + 1;
console.log(JSON.stringify({
    source, sortie, avant: anciens.length, apres: catalogue.objets.length, parFamille, gardesALaMain: aLaMain.length,
    colonnes: Object.fromEntries(Object.entries(catalogue.colonnes).map(([f, c]) => [f, c.map(x => x.libelle)])),
    tableauxIgnores: journal.tableauxIgnores.map(t => t.titre),
    effets: catalogue.objets.filter(o => o.effets?.length).map(o => [o.nom, o.effets]),
    avertissements: constats.filter(c => c.gravite !== 'erreur').map(c => `${c.ou} : ${c.message}`),
}, null, 2));
