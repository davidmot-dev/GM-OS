// Usage : node outils/alien/ameliorer-pilote-a12-colonial-marines.mjs "Export Dirvers/Alien_driver_gmos_1793655035463.gmos-driver"
//
// A12 — Colonial Marines, étape 2 du § 185 (décisions de David du 14/11/2026) :
//   1. la fiche de personnage reçoit une section « Marines coloniaux » : Spécialité militaire,
//      Statut, Grade, Événements de terrain. Rien d'autre ne change : identifiants, sections et
//      champs existants sont comparés avant et après (règle d'enrichirLePilote : on ajoute, on
//      ne remplace rien) ;
//   2. les cinq tables du supplément (événements de terrain A, B, C ; temps libre de l'escouade et
//      personnel) passent dans Table-OS, databases/tables/Alien/, à côté des autres tables D66
//      d'Alien. Elles sont lues dans les fiches RELUES du corpus (relu: true), jamais réécrites à
//      la main ; un fichier déjà présent et différent n'est pas écrasé.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';

const source = process.argv[2];
assert.ok(source, 'Indiquer le pilote Alien 1.9.0 à enrichir.');

// ---------------------------------------------------------------- 1 · les tables du supplément
const CORPUS = 'docs/systems/alien/supplements/colonial-marines/rules';
const TABLES = 'databases/tables/Alien';

function lireFicheRelue(nom) {
    const texte = fs.readFileSync(path.join(CORPUS, nom), 'utf8').replace(/\r\n/g, '\n');
    assert.match(texte, /^relu: true$/m, `${nom} n'est pas relue : on ne tire pas de table d'une fiche non relue.`);
    return texte;
}

/** Les lignes « | **11-13** | … | » du tableau qui suit le titre donné. */
function lignesDuTableau(texte, titre) {
    const debut = texte.indexOf(titre);
    assert.ok(debut >= 0, `Tableau introuvable : ${titre}`);
    const lignes = [];
    for (const ligne of texte.slice(debut + titre.length).split('\n').slice(1)) {
        if (!ligne.trim()) { if (lignes.length) break; else continue; }
        if (!ligne.startsWith('|')) break;
        const m = ligne.match(/^\|\s*\*\*(\d+)(?:\s*[–-]\s*(\d+))?\*\*\s*\|\s*(.+?)\s*\|\s*$/);
        if (!m) continue; // en-tête et séparateur
        // Table-OS affiche du texte brut : l'emphase du Markdown (*(Heavy Machinery)*) part.
        lignes.push({ min: Number(m[1]), max: Number(m[2] ?? m[1]), texte: m[3].replace(/\*+/g, '') });
    }
    assert.ok(lignes.length > 0, `Tableau vide : ${titre}`);
    return lignes;
}

const majuscule = s => s.charAt(0).toUpperCase() + s.slice(1);

/** « Événement : conséquence » → titre = l'événement, description = la conséquence. */
function entreeDeTerrain({ min, max, texte }) {
    const deuxPoints = texte.indexOf(':');
    assert.ok(deuxPoints > 0, `Pas de « : » dans l'événement ${min}-${max}`);
    return {
        min, max,
        title: texte.slice(0, deuxPoints).trim(),
        description: majuscule(texte.slice(deuxPoints + 1).trim()),
    };
}

/** Première phrase en titre, le reste en description. */
function entreeDeTempsLibre({ min, max, texte }) {
    const m = texte.match(/^(.+?[.!?])\s+(.+)$/);
    return m
        ? { min, max, title: m[1].trim(), description: m[2].trim() }
        : { min, max, title: texte.trim(), description: '' };
}

const terrain = lireFicheRelue('evenements-de-terrain.md');
const tempsLibre = lireFicheRelue('evenements-de-temps-libre.md');

const tables = {
    'marines_coloniaux_evenements_de_terrain_a_engage': {
        name: 'Marines coloniaux — Événements de terrain A, Engagé (p. 57-59)',
        dice: 'd66',
        entries: lignesDuTableau(terrain, '### Table A').map(entreeDeTerrain),
    },
    'marines_coloniaux_evenements_de_terrain_b_sous_officier': {
        name: 'Marines coloniaux — Événements de terrain B, Sous-officier (p. 57-59)',
        dice: 'd66',
        entries: lignesDuTableau(terrain, '### Table B').map(entreeDeTerrain),
    },
    'marines_coloniaux_evenements_de_terrain_c_pilotes_et_chefs_d_equipage': {
        name: "Marines coloniaux — Événements de terrain C, Pilotes et chefs d'équipage (p. 57-59)",
        dice: 'd66',
        entries: lignesDuTableau(terrain, '### Table C').map(entreeDeTerrain),
    },
    'marines_coloniaux_temps_libre_de_l_escouade': {
        name: "Marines coloniaux — Temps libre de l'escouade (p. 131-132)",
        dice: '2d6',
        entries: lignesDuTableau(tempsLibre, "### Tableau des Événements de temps libre de l'escouade").map(entreeDeTempsLibre),
    },
    'marines_coloniaux_temps_libre_personnel': {
        name: 'Marines coloniaux — Temps libre personnel (p. 131-132)',
        dice: '1d6',
        entries: lignesDuTableau(tempsLibre, '### Tableau des Événements de temps libre personnel').map(entreeDeTempsLibre),
    },
};

// Couverture exacte du dé : chaque valeur possible tombe sur une entrée et une seule.
const valeursD66 = [];
for (let d = 1; d <= 6; d++) for (let u = 1; u <= 6; u++) valeursD66.push(d * 10 + u);
const valeursDuDe = { d66: valeursD66, '2d6': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], '1d6': [1, 2, 3, 4, 5, 6] };
for (const [fichier, t] of Object.entries(tables)) {
    for (const v of valeursDuDe[t.dice]) {
        const n = t.entries.filter(e => e.min <= v && v <= e.max).length;
        assert.equal(n, 1, `${fichier} : la valeur ${v} tombe sur ${n} entrée(s).`);
    }
}
assert.deepEqual(Object.values(tables).map(t => t.entries.length), [11, 11, 11, 9, 6]);

const tablesEcrites = [];
for (const [fichier, t] of Object.entries(tables)) {
    const cible = path.join(TABLES, `${fichier}.json`);
    const contenu = JSON.stringify(t, null, 4) + '\n';
    if (fs.existsSync(cible)) {
        assert.equal(fs.readFileSync(cible, 'utf8'), contenu, `${cible} existe déjà et diffère : il n'est pas écrasé.`);
    } else {
        fs.writeFileSync(cible, contenu);
    }
    tablesEcrites.push(cible);
}

// ---------------------------------------------------------------- 2 · la fiche du pilote
const original = fs.readFileSync(source);
const archive = new AdmZip(original);
const state = JSON.parse(archive.readAsText('state.json'));
const p = state.gameDriver, fiche = state.sheetTemplate;
assert.equal(p.corpusId, 'alien');
assert.equal(p.version, '1.9.0', 'Ce script part du pilote 1.9.0 (export du 11/11/2026).');
const avant = structuredClone(fiche.sections), ids = [p.id, p.templateId, fiche.id];
const piloteAvant = structuredClone(p);

// Les dix spécialités, dans l'ordre et sous les noms de l'édition française (p. 54-56).
const specialites = lignesDuTableauDesSM(lireFicheRelue('specialites-militaires-sm.md'));
function lignesDuTableauDesSM(texte) {
    const noms = [...texte.matchAll(/^\| \*\*(.+?)\*\* \*\(/gm)].map(m => m[1]);
    assert.equal(noms.length, 10, 'Dix spécialités attendues dans la fiche relue.');
    return noms;
}

const SECTION = {
    id: 'marines_coloniaux',
    label: 'Marines coloniaux',
    fields: [
        { id: 'specialite_militaire', label: 'Spécialité militaire (SM)', type: 'select', options: specialites },
        { id: 'statut_marine', label: "Statut — Engagé : table A ; Sous-officier : A puis B ; Pilote ou chef d'équipage : C", type: 'select', options: ['Engagé', 'Sous-officier', "Pilote ou chef d'équipage"] },
        { id: 'grade', label: 'Grade', type: 'text' },
        { id: 'evenements_de_terrain', label: 'Événements de terrain — un par ligne, avec son gain', type: 'textarea', defaultValue: '' },
    ],
};

const idsExistants = new Set(fiche.sections.flatMap(s => [s.id, ...(s.fields ?? []).map(f => f.id)]));
for (const id of [SECTION.id, ...SECTION.fields.map(f => f.id)]) {
    assert.ok(!idsExistants.has(id), `L'identifiant « ${id} » existe déjà dans la fiche : rien n'est remplacé.`);
}
fiche.sections.push(SECTION);
p.version = '1.10.0';

// Rien d'autre n'a bougé : sections d'avant identiques, pilote identique hors version.
assert.deepEqual(fiche.sections.slice(0, avant.length), avant);
assert.deepEqual({ ...p, version: piloteAvant.version }, piloteAvant);
assert.deepEqual([p.id, p.templateId, fiche.id], ids);

const manifest = JSON.parse(archive.readAsText('manifest.json'));
manifest.exportedAt = new Date().toISOString();
manifest.bundleId += '-a12';
const zip = new AdmZip();
for (const e of archive.getEntries()) if (!['state.json', 'manifest.json'].includes(e.entryName)) zip.addFile(e.entryName, e.getData());
zip.addFile('state.json', Buffer.from(JSON.stringify(state, null, 2)));
zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));
const sortie = 'Export Dirvers/corriges/Alien-1.10.0.gmos-driver';
zip.writeZip(sortie);

assert.deepEqual(JSON.parse(new AdmZip(sortie).readAsText('state.json')), state);
assert.deepEqual(fs.readFileSync(source), original, "L'export d'origine a changé.");

const rapport = {
    sortie,
    version: p.version,
    champs: fiche.sections.flatMap(s => s.fields).length,
    champsAjoutes: SECTION.fields.map(f => f.id),
    specialites,
    tables: tablesEcrites,
    ids,
    originalInchange: true,
    sha256Source: crypto.createHash('sha256').update(original).digest('hex'),
};
console.log(JSON.stringify(rapport, null, 2));
