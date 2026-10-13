import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { gabaritsDuMoteur, validerLaFiche } from '../src/modules/fiches/validationDeLaFiche';
import { lireLaCorrespondance } from '../src/modules/fiches/correspondanceDeFiche';

/**
 * **Les fiches du dépôt passent le cahier des charges** — le garde de
 * `npm run fiche:valider`, posé le 2026-10-13.
 *
 * Il lit les **vraies** fiches, le **vrai** moteur et les **vraies**
 * correspondances. Une fiche régénérée qui perd une clé (§ 6) ou que sa
 * correspondance ne couvre plus (§ 7) échoue ici, avant d'arriver chez David.
 *
 * Dans `electron/` pour lire le disque (même raison que
 * `correspondanceDesFiches.test.ts`).
 */

const RACINE = path.resolve(__dirname, '..');
const FICHES = path.join(RACINE, 'docs', 'fiches');
const SYSTEMES = path.join(RACINE, 'docs', 'systems');

const MOTEURS = gabaritsDuMoteur(fs.readFileSync(path.join(FICHES, 'Character_Sheet_Manager.html'), 'utf8'));
const CORRESPONDANCES = fs.readdirSync(SYSTEMES, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => path.join(SYSTEMES, e.name, 'fiche', 'correspondance.json'))
    .filter(c => fs.existsSync(c))
    .map(c => ({ chemin: c, table: lireLaCorrespondance(fs.readFileSync(c, 'utf8'))! }));

const FICHES_HTML = fs.readdirSync(FICHES, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .flatMap(e => fs.readdirSync(path.join(FICHES, e.name))
        .filter(n => n.toLowerCase().endsWith('.html'))
        .map(n => ({ jeu: e.name, chemin: path.join(FICHES, e.name, n) })));

/**
 * **Livrées avant le cahier des charges, sans manifeste** (§ 2) — connues, pas
 * oubliées. Leur gabarit vit déjà dans le moteur ; elles en sortiront à leur
 * prochaine régénération. Une fiche NOUVELLE sans manifeste échoue.
 */
const SANS_MANIFESTE_CONNUES = ['Alien', 'Blade Runner'];

const rapport = (chemin: string) => validerLaFiche({
    fiche: path.relative(RACINE, chemin),
    html: fs.readFileSync(chemin, 'utf8'),
    gabaritsDuMoteur: MOTEURS,
    correspondances: CORRESPONDANCES,
});

describe('les fiches du dépôt', () => {
    it('il y en a — sinon ce fichier ne teste rien', () => {
        expect(FICHES_HTML.length).toBeGreaterThan(0);
    });

    /*
      Une fiche connue sans manifeste n'est tolérée QUE tant qu'elle n'en a pas :
      dès qu'une régénération le lui donne, elle est contrôlée en entier — sans
      qu'il faille d'abord toucher à cette liste.
    */
    it.each(FICHES_HTML)('$jeu passe le cahier des charges', ({ jeu, chemin }) => {
        const r = rapport(chemin);
        const toleree = r.gabarit === undefined && SANS_MANIFESTE_CONNUES.includes(jeu);
        expect(toleree ? [] : r.erreurs.map(e => `[${e.regle}] ${e.message}`)).toEqual([]);
    });

    it('aucune fiche nouvelle n’arrive sans manifeste', () => {
        const sans = FICHES_HTML.filter(f => rapport(f.chemin).gabarit === undefined).map(f => f.jeu);
        expect(sans.filter(jeu => !SANS_MANIFESTE_CONNUES.includes(jeu))).toEqual([]);
    });
});
