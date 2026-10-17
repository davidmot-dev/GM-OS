import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import ts from 'typescript';

// Extraction d'étude : on lit l'archive, on n'exécute aucun de ses scripts.
const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, '../../..');
const entree = path.join(racine, 'scratch/reve-de-dragon-sources');
const archive = fs.readFileSync(path.join(entree, 'tmr.zip'));
const zip = new AdmZip(archive);
const empreinte = octets => crypto.createHash('sha256').update(octets).digest('hex');
const precedent = fs.existsSync(path.join(ici, 'sources.json'))
  ? JSON.parse(fs.readFileSync(path.join(ici, 'sources.json'), 'utf8')) : null;
if (precedent && empreinte(archive) !== precedent.archive.sha256) {
  throw new Error('Archive modifiée : auditer la nouvelle source avant de renouveler la référence.');
}
const ecrireJson = (nom, objet) => fs.writeFileSync(path.join(ici, nom), JSON.stringify(objet, null, 2) + '\n');
const base = 'https://scriptarium.org/RdD/tmr/';
const fichiers = [];
const selections = [
  ['js/tmr.js', 'tmr.js'],
  ['js/tmrHexagon.js', 'tmrHexagon.js'],
  ['css/tmr.css', 'tmr.css'],
  ['index.html', 'index-en-ligne.html'],
];
fs.mkdirSync(path.join(ici, 'originaux'), { recursive: true });
for (const [relatif, destination] of selections) {
  const nomLocal = relatif === 'index.html' ? 'index.html' : destination;
  const octets = fs.readFileSync(path.join(entree, 'en-ligne', nomLocal));
  const octetsZip = zip.getEntry(`tmr/${relatif}`).getData();
  const attendu = precedent?.fichiers.find(f => f.fichier === `originaux/${destination}`);
  if (attendu && empreinte(octets) !== attendu.sha256) {
    throw new Error(`Source modifiée : ${relatif}. Auditer la nouvelle source avant régénération.`);
  }
  fs.writeFileSync(path.join(ici, 'originaux', destination), octets);
  fichiers.push({ fichier: `originaux/${destination}`, url: base + (relatif === 'index.html' ? '' : relatif),
    octets: octets.length, sha256: empreinte(octets), sha256Archive: empreinte(octetsZip),
    identiqueArchive: octets.equals(octetsZip) });
  if (relatif === 'index.html') {
    fs.writeFileSync(path.join(ici, 'originaux/index-archive.html'), octetsZip);
    fichiers.push({ fichier: 'originaux/index-archive.html', entreeArchive: 'tmr/index.html',
      octets: octetsZip.length, sha256: empreinte(octetsZip) });
  }
}

const texte = fs.readFileSync(path.join(ici, 'originaux/tmr.js'), 'utf8');
const arbre = ts.createSourceFile('tmr.js', texte, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const fonctions = new Map();
for (const noeud of arbre.statements) {
  if (ts.isFunctionDeclaration(noeud) && noeud.name) {
    const debut = noeud.getStart(arbre);
    fonctions.set(noeud.name.text, { nom: noeud.name.text,
      ligneDebut: arbre.getLineAndCharacterOfPosition(debut).line + 1,
      ligneFin: arbre.getLineAndCharacterOfPosition(noeud.end).line + 1,
      texte: texte.slice(debut, noeud.end) });
  }
}
const groupes = {
  des: ['diceRoll', 'lanceD', 'dDr'],
  resolution: ['getPourcentageChance', 'getReussiteParticuliereSeuil', 'getReussiteSignificativeSeuil',
    'getEchecParticulierSeuil', 'getEchecTotalSeuil'],
  stress: ['gainXp'],
  astrologie: ['lanceNbAstral', 'calculAstrologie', 'dessineRoueAstrologique', 'positionneAffichage',
    'reinitialisationPointOrigine', 'positionneHeures'],
  geometrie: ['Hex', 'OffsetCoord', 'qoffset_from_cube', 'qoffset_to_cube', 'hex_length', 'hex_add',
    'hex_subtract', 'hex_distance', 'offset_distance', 'hex_hexaAPortee', 'offset_hexaAPortee'],
};
fs.mkdirSync(path.join(ici, 'extraits'), { recursive: true });
const extraits = [];
for (const [groupe, noms] of Object.entries(groupes)) {
  const notice = `/* Extrait d'étude de « Les Terres Médianes du Rêve : Outils ».
 * Auteur : Cyol ; version du site corrigée par Kroc.
 * Source : ${base}js/tmr.js
 * Licence annoncée : CC BY 3.0 France — https://creativecommons.org/licenses/by/3.0/fr/
 * Modification Codex, 18/10/2026 : sélection de fonctions, notice ajoutée.
 * Corps des fonctions inchangés. Dépendances et limites : ../README.md.
 * Aucune intégration à GM-OS ; ne pas importer ces extraits dans l'application.
 */\n\n`;
  const parties = noms.map(nom => {
    const trouvee = fonctions.get(nom);
    if (!trouvee) throw new Error(`Fonction absente : ${nom}`);
    return trouvee;
  });
  const contenu = notice + parties.map(f => f.texte).join('\n\n') + '\n';
  const fichier = `extraits/${groupe}.js`;
  fs.writeFileSync(path.join(ici, fichier), contenu);
  extraits.push({ fichier, sha256: empreinte(Buffer.from(contenu)),
    fonctions: parties.map(({ texte: ignore, ...repere }) => repere) });
}
ecrireJson('sources.json', {
  titre: 'Les Terres Médianes du Rêve : Outils',
  auteurs: ['Cyol', 'Kroc (corrections créditées par le site)'],
  versionAnnoncee: '21, 04/01/2017 - corrigée par Kroc',
  dateRecuperation: '2026-10-18', url: base,
  licenceAnnoncee: { nom: 'CC BY 3.0 France', url: 'https://creativecommons.org/licenses/by/3.0/fr/' },
  archive: { url: base + 'tmr.zip', fichierLocalIgnore: 'scratch/reve-de-dragon-sources/tmr.zip',
    octets: archive.length, sha256: empreinte(archive) },
  fichiers, extraits,
});
ecrireJson('fonctions.json', [...fonctions.values()].map(({ texte: ignore, ...repere }) => repere));
console.log(JSON.stringify({ fichiers: fichiers.length, extraits: extraits.length,
  fonctionsReperees: fonctions.size, fonctionsExtraites: extraits.reduce((n, e) => n + e.fonctions.length, 0),
  identiquesArchive: fichiers.filter(f => f.identiqueArchive === true).length }, null, 2));
