#!/usr/bin/env node
/**
 * **Le carnet NotebookLM « GM-OS », tenu à jour depuis le dépôt.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE SCRIPT EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Les 53 guides de `documentation/User Guides/` sont des sources du carnet
 * NotebookLM. Mais **une source est une copie figée** : modifier un guide dans
 * le dépôt ne change rien au carnet, qui continue de répondre d'après l'ancienne
 * version. *Une documentation qui ment est pire qu'une documentation absente* —
 * et celle-là ment sans le dire, puisque le carnet répond avec assurance.
 *
 * Demande de David le 2026-09-12 : *« je voudrais que tu mettes à jour à chaque
 * fois »*.
 *
 * ⛔ **Ne renvoyer QUE ce qui a changé.** Téléverser les 53 prend une dizaine de
 * minutes et occupe une session de navigateur : un script qui refait tout à
 * chaque fois ne serait lancé qu'une fois, puis plus jamais. D'où l'empreinte
 * conservée par guide dans `.notebooklm-etat.json` (ignoré par git).
 *
 * ⚠️ **Remplacer une source, c'est la supprimer puis la rajouter.** NotebookLM
 * ne sait mettre à jour en place que les documents venus de Google Drive ; un
 * fichier téléversé, non. L'ordre compte : on ajoute **avant** de supprimer, de
 * sorte qu'un échec réseau laisse le carnet avec un doublon — visible et
 * réparable — plutôt qu'avec un trou silencieux.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   node scripts/notebooklm-guides.mjs           les guides modifiés
 *   node scripts/notebooklm-guides.mjs --etat    ce qui serait fait, sans rien faire
 *   node scripts/notebooklm-guides.mjs --tout    tout renvoyer (à éviter)
 *
 * Le carnet : https://notebooklm.google.com/notebook/<carnet du manifeste>
 */

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const DOSSIER_DES_GUIDES = path.join(RACINE, 'documentation', 'User Guides');
/** Versionné : il ne porte que l'identifiant du carnet. */
const MANIFESTE = path.join(ICI, 'notebooklm-guides.json');
/**
 * **Ignoré par git, et c'est le point.** Il porte l'empreinte de chaque guide —
 * donc il change à chaque synchronisation. Versionné, il salirait l'arbre après
 * chaque envoi, et on prendrait l'habitude de commiter un fichier qu'on ne lit
 * pas. *Un état qui se reconstruit tout seul n'a rien à faire dans l'historique.*
 *
 * Perdu, il se reconstruit : l'adoption relit les sources du carnet et les
 * rapproche des guides par leur titre.
 */
const ETAT = path.join(ICI, '.notebooklm-etat.json');

const options = new Set(process.argv.slice(2));
const enEtat = options.has('--etat');
const toutRenvoyer = options.has('--tout');

/* ─────────────────────────────────────────────
   Le pont vers NotebookLM
   ───────────────────────────────────────────── */

/**
 * Appelle la CLI `notebooklm_tools`.
 *
 * ⚠️ `stdio: pipe` et non `inherit` : on veut lire le JSON rendu. Les erreurs
 * sont donc remontées à la main — sans quoi un échec passerait inaperçu.
 */
function cli(...args) {
    const r = spawnSync('python', ['-m', 'notebooklm_tools.cli.main', ...args], {
        cwd: RACINE,
        encoding: 'utf-8',
        timeout: 300_000,
    });

    if (r.error) return { ok: false, message: r.error.message };
    if (r.status !== 0) return { ok: false, message: (r.stderr || r.stdout || '').trim().slice(0, 300) };

    try {
        return { ok: true, donnees: JSON.parse(r.stdout) };
    } catch {
        /* Certaines commandes ne rendent rien : ce n'est pas une erreur. */
        return { ok: true, donnees: null };
    }
}

/* ─────────────────────────────────────────────
   Les guides sur le disque
   ───────────────────────────────────────────── */

/** `75-Light-OS-les-lumieres.md` → « 75 - Light OS les lumieres ». */
function titreDuGuide(fichier) {
    return path.basename(fichier, '.md').replace(/-/g, ' ').replace(/^(\d+) /, '$1 - ');
}

function lesGuides() {
    return fs.readdirSync(DOSSIER_DES_GUIDES)
        .filter(n => n.toLowerCase().endsWith('.md'))
        .sort()
        .map(nom => ({
            nom,
            titre: titreDuGuide(nom),
            empreinte: createHash('sha256')
                .update(fs.readFileSync(path.join(DOSSIER_DES_GUIDES, nom)))
                .digest('hex'),
        }));
}

/* ─────────────────────────────────────────────
   Le manifeste
   ───────────────────────────────────────────── */

function lireLeManifeste() {
    if (!fs.existsSync(MANIFESTE)) {
        console.error(`⛔ Manifeste absent : ${MANIFESTE}`);
        process.exit(1);
    }
    const carnet = JSON.parse(fs.readFileSync(MANIFESTE, 'utf-8'));
    const etat = fs.existsSync(ETAT) ? JSON.parse(fs.readFileSync(ETAT, 'utf-8')) : {};
    /* `guides` absent ou vide déclenche l'adoption : les deux valent « je ne
       sais pas ce que le carnet contient », et un objet vide vient d'un premier
       passage interrompu. */
    const guides = etat.guides && Object.keys(etat.guides).length > 0 ? etat.guides : undefined;
    return { ...carnet, guides };
}

/** Seul l'état bouge ; le manifeste versionné n'est jamais réécrit. */
function ecrireLeManifeste(m) {
    fs.writeFileSync(ETAT, `${JSON.stringify({ guides: m.guides }, null, 2)}\n`, 'utf-8');
}

/**
 * Première exécution : on adopte les sources déjà en place au lieu de tout
 * renvoyer.
 *
 * *Le carnet existe déjà avec ses 53 sources ; repartir de zéro coûterait dix
 * minutes pour rien et perdrait les résumés que NotebookLM en a tirés.*
 */
function adopterLExistant(manifeste, guides) {
    console.log('Premier passage : adoption des sources déjà présentes…');
    const r = cli('source', 'list', manifeste.carnet, '--json');
    if (!r.ok) {
        console.error(`⛔ Impossible de lister les sources : ${r.message}`);
        process.exit(1);
    }

    const parTitre = new Map((r.donnees ?? []).map(s => [s.title, s.id]));
    manifeste.guides = {};
    for (const g of guides) {
        const source = parTitre.get(g.titre);
        if (source) manifeste.guides[g.nom] = { source, empreinte: g.empreinte };
    }
    console.log(`   ${Object.keys(manifeste.guides).length} source(s) adoptée(s).\n`);
    return manifeste;
}

/* ─────────────────────────────────────────────
   La synchronisation
   ───────────────────────────────────────────── */

function televerser(carnet, guide) {
    const r = cli(
        'source', 'add', carnet,
        '--file', path.join(DOSSIER_DES_GUIDES, guide.nom),
        '--title', guide.titre,
        '--json',
    );
    if (!r.ok) return { ok: false, message: r.message };
    const source = r.donnees?.source_id;
    return source ? { ok: true, source } : { ok: false, message: 'aucun source_id rendu' };
}

function supprimer(source) {
    return cli('source', 'delete', source, '--confirm', '--json').ok;
}

function principal() {
    const manifeste = lireLeManifeste();
    const guides = lesGuides();

    if (!manifeste.guides) {
        adopterLExistant(manifeste, guides);
        /* Persisté tout de suite, même en `--etat` : c'est un cache local, il ne
           touche pas au carnet, et sans ça chaque exécution repaierait la
           liste des sources. */
        ecrireLeManifeste(manifeste);
    }
    const connus = manifeste.guides;

    const aFaire = guides.filter(g =>
        toutRenvoyer || !connus[g.nom] || connus[g.nom].empreinte !== g.empreinte);
    /* Un guide supprimé du dépôt ne doit pas continuer à répondre dans le carnet. */
    const surLeDepart = Object.keys(connus).filter(nom => !guides.some(g => g.nom === nom));

    if (aFaire.length === 0 && surLeDepart.length === 0) {
        console.log('✅ Le carnet NotebookLM est à jour — rien à renvoyer.');
        return 0;
    }

    console.log(`Carnet : https://notebooklm.google.com/notebook/${manifeste.carnet}`);
    for (const g of aFaire) console.log(`  ${connus[g.nom] ? '~' : '+'} ${g.titre}`);
    for (const nom of surLeDepart) console.log(`  - ${titreDuGuide(nom)} (retiré du dépôt)`);

    if (enEtat) {
        console.log(`\n(--etat : rien n'a été envoyé — ${aFaire.length} à renvoyer, ${surLeDepart.length} à retirer)`);
        return 0;
    }

    let echecs = 0;
    console.log('');

    for (const g of aFaire) {
        const ancienne = connus[g.nom]?.source;
        const envoi = televerser(manifeste.carnet, g);

        if (!envoi.ok) {
            echecs += 1;
            console.error(`⛔ ${g.titre} : ${envoi.message}`);
            continue;
        }

        /* L'ancienne ne part qu'une fois la nouvelle en place — voir l'en-tête. */
        if (ancienne && !supprimer(ancienne)) {
            console.warn(`⚠️  ${g.titre} : la nouvelle source est en place, l'ancienne n'a pas pu être retirée (doublon à supprimer à la main).`);
        }

        connus[g.nom] = { source: envoi.source, empreinte: g.empreinte };
        ecrireLeManifeste(manifeste);   // après chaque guide : une coupure ne perd pas le travail fait
        console.log(`✓ ${g.titre}`);
    }

    for (const nom of surLeDepart) {
        if (supprimer(connus[nom].source)) {
            delete connus[nom];
            ecrireLeManifeste(manifeste);
            console.log(`✓ ${titreDuGuide(nom)} retiré du carnet`);
        } else {
            echecs += 1;
            console.error(`⛔ ${titreDuGuide(nom)} : suppression impossible`);
        }
    }

    console.log(`\n${echecs === 0 ? '✅' : '⚠️'} ${aFaire.length - echecs}/${aFaire.length} guide(s) synchronisé(s)${echecs ? `, ${echecs} en échec` : ''}.`);
    return echecs === 0 ? 0 : 1;
}

process.exit(principal());
