import { describe, it, expect } from 'vitest';
import { validerLeTheme, rapportEnTexte, type FichierDuTheme } from './validationDuTheme';

/**
 * **Le validateur, sur des thèmes fabriqués.**
 *
 * Un thème conforme au squelette du cahier (§ 12), puis une faute à la fois :
 * chaque essai prouve qu'une règle refuse — et le premier, qu'elle ne refuse
 * pas le cas normal. *Une garde qui refuse tout ressemble à une garde qui
 * marche.* Les thèmes réels du dépôt passent dans
 * `electron/validationDesThemes.test.ts`.
 */

const IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700&family=IBM+Plex+Mono:wght@400;600&display=swap');";

const JETONS: Record<string, string> = {
    bg: '#101418', surface: '#1a2027', 'surface-2': '#232b33',
    text: '#eef2f5', muted: '#9aa7b3', accent: '#c86bd6', 'accent-2': '#7a9e9f',
    'accent-contrast': '#101418',
    border: 'rgba(217, 164, 65, 0.5)', 'border-soft': 'rgba(255, 255, 255, 0.1)',
    paper: '#e8e6e1', ink: '#1a1d21',
    success: '#4caf7a', danger: '#e5534b', warning: '#e0b84f', info: '#5aa0e0',
    'font-display': '"Barlow Condensed", "Arial Narrow", sans-serif',
    'font-body': 'Georgia, serif', 'font-ui': '"Barlow Condensed", sans-serif',
    'font-mono': '"IBM Plex Mono", ui-monospace, monospace',
    'title-tracking': '0.08em', 'kicker-tracking': '.18em', 'title-transform': 'uppercase',
    'radius-sm': '0px', 'radius-md': '0', 'radius-lg': '2px',
    'border-width': '1px', 'border-style': 'double',
    'elevation-1': 'none', 'elevation-2': '0 8px 24px rgba(0, 0, 0, 0.45)',
    'elevation-3': '0 18px 55px rgba(0, 0, 0, 0.5)',
    glow: 'none', 'glow-strength': '0',
    'glass-bg': 'rgba(16, 20, 24, 0.8)', 'glass-border': 'rgba(255, 255, 255, 0.15)', 'glass-blur': '12px',
    'texture-bg': "url('matieres/grain.svg')", 'texture-panel': 'none', 'texture-opacity': '0.2',
};

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path fill="currentColor" d="M0 0h1v1H0z"/></svg>';

const INTENTION = '# Intention\nTerminal industriel.\n\n# Limites signalées\nAucune.\n';

function feuille(surcharges: Record<string, string | null> = {}, avant = IMPORT, polarite = 'dark'): string {
    const valeurs = { ...JETONS, ...surcharges };
    const lignes = Object.entries(valeurs)
        .filter(([, v]) => v !== null)
        .map(([c, v]) => `  --rpg-${c}: ${v};`);
    return `${avant}\n\n:root[data-theme="essai"] {\n  color-scheme: ${polarite};\n${lignes.join('\n')}\n}\n`;
}

function fichiers(autres: Record<string, FichierDuTheme | null> = {}): Record<string, FichierDuTheme> {
    const tous: Record<string, FichierDuTheme | null> = {
        'intention.md': { taille: INTENTION.length, contenu: INTENTION },
        'matieres/grain.svg': { taille: SVG.length, contenu: SVG },
        ...autres,
    };
    return Object.fromEntries(Object.entries(tous).filter(([, f]) => f !== null)) as Record<string, FichierDuTheme>;
}

const valider = (css: string, autres: Record<string, FichierDuTheme | null> = {}) =>
    validerLeTheme({ jeu: 'essai', css, fichiers: fichiers(autres) });

/** Les sections citées par les erreurs — ce qu'un essai doit trouver. */
const regles = (css: string, autres: Record<string, FichierDuTheme | null> = {}) =>
    valider(css, autres).erreurs.map(e => e.regle);

describe('validerLeTheme — le cas normal', () => {
    it('accepte un thème conforme au squelette, sans rien signaler', () => {
        const r = valider(feuille());
        expect(r.erreurs).toEqual([]);
        expect(r.avertissements).toEqual([]);
        expect(r.accepte).toBe(true);
    });

    it('range les jetons par ce que GM-OS en fait', () => {
        const { jetons } = valider(feuille({ 'font-scale': '1.1', invente: '#ffffff' }));
        expect(jetons.appliques).toEqual(expect.arrayContaining(['bg', 'accent', 'font-display', 'font-scale']));
        expect(jetons.annonces).toEqual(expect.arrayContaining(['radius-sm', 'glass-bg', 'danger']));
        expect(jetons.sansEffet).toEqual(expect.arrayContaining(['paper', 'ink', 'accent-2', 'font-ui']));
        expect(jetons.lusParPersonne).toEqual(['invente']);
    });

    it('mesure les dix paires du § 6', () => {
        expect(valider(feuille()).contrastes).toHaveLength(10);
    });
});

describe('validerLeTheme — ce qu\'il refuse', () => {
    it('§ 1.1 : intention.md absent', () => {
        expect(regles(feuille(), { 'intention.md': null })).toContain('§ 1.1');
    });

    it('§ 3.1 : aucun bloc de jetons', () => {
        expect(regles('.rpg-panel { --rpg-bg: #000000; }')).toContain('§ 3.1');
    });

    it('§ 3.3 : un bloc imbriqué coupe la lecture', () => {
        const css = feuille().replace('  color-scheme: dark;', '  color-scheme: dark;\n  .x { color: red; }');
        expect(regles(css)).toContain('§ 3.3');
    });

    it('§ 3.4 : un jeton déclaré deux fois', () => {
        const css = feuille().replace('  color-scheme: dark;', '  color-scheme: dark;\n  --rpg-accent: #c86bd6;');
        expect(regles(css)).toContain('§ 3.4');
    });

    /* Le piège « page de livre » : Dune, NOC, Star Trek et Torg y tombaient. */
    it('§ 3.5 : une polarité claire sur un fond sombre', () => {
        const r = valider(feuille({}, IMPORT, 'light'));
        expect(r.erreurs.map(e => e.regle)).toContain('§ 3.5');
        expect(r.polarite).toEqual({ declaree: 'light', attendue: 'dark' });
    });

    it('§ 3.6 : une police importée d\'un autre hôte', () => {
        expect(regles(feuille({}, "@import url('https://exemple.com/police.css');"))).toContain('§ 3.6');
    });

    it('§ 3.7 et § 5 : une couleur courte, une couleur transparente', () => {
        expect(regles(feuille({ surface: '#123' }))).toContain('§ 3.7');
        expect(regles(feuille({ text: 'rgba(255, 255, 255, 0.9)' }))).toContain('§ 5');
    });

    it('§ 4.1 : un jeton obligatoire absent', () => {
        expect(regles(feuille({ muted: null }))).toContain('§ 4.1');
    });

    it('§ 4.3 : une pile sans famille générique, une police qui n\'arrivera pas', () => {
        expect(regles(feuille({ 'font-mono': '"IBM Plex Mono"' }))).toContain('§ 4.3');
        expect(regles(feuille({ 'font-display': '"Police Inconnue", sans-serif' }))).toContain('§ 4.3');
    });

    it('§ 4.3 : un repli absent n\'est qu\'un avertissement', () => {
        const r = valider(feuille({ 'font-mono': '"IBM Plex Mono", "OCR A Std", monospace' }));
        expect(r.accepte).toBe(true);
        expect(r.avertissements.map(a => a.regle)).toContain('§ 4.3');
    });

    it('§ 4.5 : un arrondi hors bornes, un style de bordure inconnu', () => {
        expect(regles(feuille({ 'radius-lg': '999px' }))).toContain('§ 4.5');
        expect(regles(feuille({ 'border-style': 'dashed' }))).toContain('§ 4.5');
    });

    it('§ 5 : un verre trop transparent', () => {
        expect(regles(feuille({ 'glass-bg': 'rgba(0, 0, 0, 0.2)' }))).toContain('§ 5');
    });

    it('§ 6 : un texte illisible sur le fond', () => {
        expect(regles(feuille({ text: '#202428' }))).toContain('§ 6');
    });

    it('§ 7 : une matière qui sort du dossier, ou qui n\'existe pas', () => {
        expect(regles(feuille({ 'texture-bg': "url('../../autre/grain.svg')" }))).toContain('§ 7');
        expect(regles(feuille({ 'texture-bg': "url('matieres/absente.svg')" }))).toContain('§ 7');
    });

    it('§ 8 : un SVG qui exécute du code', () => {
        const piege = SVG.replace('<path', '<script>alert(1)</script><path');
        expect(regles(feuille(), { 'matieres/grain.svg': { taille: piege.length, contenu: piege } })).toContain('§ 8');
    });

    it('§ 8 : un emplacement d\'ornement inventé', () => {
        const table = JSON.stringify({ banniere: 'ornements/b.svg' });
        expect(regles(feuille(), { 'ornements.json': { taille: table.length, contenu: table } })).toContain('§ 8');
    });

    it('§ 9 : icones.json est réservé', () => {
        expect(regles(feuille(), { 'icones.json': { taille: 2, contenu: '{}' } })).toContain('§ 9');
    });

    it('§ 11 : !important, et une @media avant la fin des jetons', () => {
        expect(regles(feuille({ accent: '#c86bd6 !important' }))).toContain('§ 11');
        expect(regles(feuille({}, `${IMPORT}\n@media print { .x { color: red; } }`))).toContain('§ 11');
    });

    it('§ 11 : une @media APRÈS les jetons, dans les composants, est seulement signalée', () => {
        const r = valider(`${feuille()}\n@media (max-width: 600px) { .rpg-panel { padding: 0; } }\n`);
        expect(r.accepte).toBe(true);
        expect(r.avertissements.map(a => a.regle)).toContain('§ 11');
    });
});

describe('rapportEnTexte', () => {
    it('dit le verdict, cite la règle, et donne les contrastes à lire', () => {
        const texte = rapportEnTexte(valider(feuille({ text: '#202428' })));
        expect(texte).toContain('**Verdict : REFUSÉ**');
        expect(texte).toContain('[§ 6]');
        expect(texte).toContain('| `text` sur `bg` |');
        expect(texte).toContain('ne les recalcule pas');
    });
});
