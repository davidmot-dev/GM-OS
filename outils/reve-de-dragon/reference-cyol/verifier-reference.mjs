import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const ici = path.dirname(fileURLToPath(import.meta.url));
const lire = nom => fs.readFileSync(path.join(ici, nom));
const manifeste = JSON.parse(lire('sources.json'));
const empreinte = octets => crypto.createHash('sha256').update(octets).digest('hex');
const fonctions = source => {
  const arbre = ts.createSourceFile('reference.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  return new Map(arbre.statements.filter(n => ts.isFunctionDeclaration(n) && n.name)
    .map(n => [n.name.text, { texte: source.slice(n.getStart(arbre), n.end),
      ligneDebut: arbre.getLineAndCharacterOfPosition(n.getStart(arbre)).line + 1,
      ligneFin: arbre.getLineAndCharacterOfPosition(n.end).line + 1 }]));
};
for (const entree of [...manifeste.fichiers, ...manifeste.extraits]) {
  const octets = lire(entree.fichier);
  assert.equal(empreinte(octets), entree.sha256, `Empreinte : ${entree.fichier}`);
  if (entree.octets !== undefined) assert.equal(octets.length, entree.octets);
  if (entree.identiqueArchive === true) assert.equal(entree.sha256, entree.sha256Archive);
  if (entree.fichier.endsWith('.js')) {
    // node --check analyse la syntaxe sans évaluer le code tiers ni charger jQuery.
    const resultat = spawnSync(process.execPath, ['--check', path.join(ici, entree.fichier)], { encoding: 'utf8' });
    assert.equal(resultat.status, 0, resultat.stderr || String(resultat.error));
  }
}
const originales = fonctions(lire('originaux/tmr.js').toString('utf8'));
const index = JSON.parse(lire('fonctions.json'));
assert.equal(originales.size, index.length);
for (const entree of index) {
  const originale = originales.get(entree.nom);
  assert.ok(originale, entree.nom);
  assert.equal(originale.ligneDebut, entree.ligneDebut);
  assert.equal(originale.ligneFin, entree.ligneFin);
}
let corpsVerifies = 0;
for (const extrait of manifeste.extraits) {
  const extraites = fonctions(lire(extrait.fichier).toString('utf8'));
  assert.equal(extraites.size, extrait.fonctions.length);
  for (const fonction of extrait.fonctions) {
    const originale = originales.get(fonction.nom);
    assert.equal(extraites.get(fonction.nom)?.texte, originale?.texte, fonction.nom);
    assert.equal(fonction.ligneDebut, originale.ligneDebut);
    assert.equal(fonction.ligneFin, originale.ligneFin);
    corpsVerifies++;
  }
}
console.log(`Référence vérifiée : ${manifeste.fichiers.length} originaux, ${manifeste.extraits.length} extraits, `
  + `${corpsVerifies} corps inchangés, ${index.length} fonctions indexées ; empreintes et syntaxe conformes.`);
