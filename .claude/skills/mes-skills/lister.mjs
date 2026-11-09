#!/usr/bin/env node
// Liste les skills de GM-OS (.claude/skills/*/SKILL.md) : nom, description, étapes (titres ##).
// Option « tout » : ajoute les skills installés sur la machine (~/.claude/skills).
// Signale aussi les skills du projet que AGENTS.md ne cite pas.
// Usage : node .claude/skills/mes-skills/lister.mjs [tout]

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const racineSkillsProjet = resolve(ici, '..');
const racineDepot = resolve(racineSkillsProjet, '..', '..');
const tout = process.argv.slice(2).some((a) => /^(tout|all|--tout)$/i.test(a));

function lireEnTete(texte) {
  const m = texte.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const champs = {};
  if (!m) return champs;
  let cle = null;
  for (const ligne of m[1].split(/\r?\n/)) {
    const k = ligne.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (k) {
      cle = k[1];
      champs[cle] = k[2].replace(/^[>|]-?\s*$/, '').trim();
    } else if (cle && /^\s+/.test(ligne)) {
      champs[cle] = `${champs[cle]} ${ligne.trim()}`.trim();
    }
  }
  for (const c of Object.keys(champs)) champs[c] = champs[c].replace(/^["']|["']$/g, '');
  return champs;
}

function lireSkills(racine) {
  if (!existsSync(racine)) return [];
  const sortie = [];
  for (const d of readdirSync(racine, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const fichier = join(racine, d.name, 'SKILL.md');
    if (!existsSync(fichier)) continue;
    const texte = readFileSync(fichier, 'utf8');
    const t = lireEnTete(texte);
    const horsCode = texte.replace(/^(```|~~~)[\s\S]*?^\1/gm, '');
    const etapes = [...horsCode.matchAll(/^## (.+)$/gm)].map((x) => x[1].trim());
    const fichiers = readdirSync(join(racine, d.name)).filter((f) => f !== 'SKILL.md');
    sortie.push({ nom: t.name || d.name, description: t.description || '(pas de description)', etapes, fichiers, chemin: fichier });
  }
  return sortie.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

function afficher(titre, skills) {
  console.log(`\n# ${titre} — ${skills.length}\n`);
  for (const s of skills) {
    console.log(`## /${s.nom}`);
    console.log(`DESCRIPTION : ${s.description}`);
    if (s.etapes.length) console.log(`ÉTAPES : ${s.etapes.join(' | ')}`);
    if (s.fichiers.length) console.log(`FICHIERS JOINTS : ${s.fichiers.join(', ')}`);
    console.log(`CHEMIN : ${s.chemin}\n`);
  }
}

const projet = lireSkills(racineSkillsProjet);
afficher('Skills de GM-OS (projet, .claude/skills)', projet);

const agents = join(racineDepot, 'AGENTS.md');
if (existsSync(agents)) {
  const texte = readFileSync(agents, 'utf8');
  const absents = projet.filter((s) => !texte.includes(s.nom)).map((s) => s.nom);
  console.log(absents.length
    ? `\n⚠️ AGENTS.md ne cite pas : ${absents.join(', ')}`
    : '\n✓ AGENTS.md cite tous les skills du projet.');
}

if (tout) {
  afficher('Skills installés sur la machine (~/.claude/skills)', lireSkills(join(homedir(), '.claude', 'skills')));
  console.log('\nNB : les skills des plugins (claude-mem, etc.) et ceux intégrés à Claude Code ne sont pas dans ces dossiers.');
}
