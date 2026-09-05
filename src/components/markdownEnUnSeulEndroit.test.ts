import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import TexteMarkdown from './TexteMarkdown';

/**
 * **Le Markdown s'interprète en un seul endroit, avec les tableaux.**
 *
 * Trouvé par David le 2026-09-05 : *« dans Nexus Wiki, il n'interprète pas les
 * tables correctement »*. La cause tenait en un greffon absent — `remark-gfm` —
 * et le défaut était à **six endroits**, parce que chaque écran reposait le
 * réglage pour son compte. Voir [[TexteMarkdown]] pour le détail.
 *
 * Ce fichier tient les deux moitiés de la réparation :
 *
 * 1. **le composant interprète bien un tableau** — sinon la garde du dessous
 *    protégerait un composant qui ne répare rien ;
 * 2. **personne d'autre n'appelle `react-markdown`** — sinon un septième écran
 *    rouvrirait le trou sans que rien ne le dise.
 *
 * ⚠️ Le second point balaie **tout `src/`**, pas une liste tenue à la main :
 * *une garde qui énumère ce qu'elle surveille ne surveille pas ce qui arrive
 * après elle.*
 */

describe('TexteMarkdown', () => {
    it('rend un tableau GFM comme un vrai tableau', () => {
        render(
            React.createElement(
                TexteMarkdown,
                null,
                ['| Arme | Dégâts |', '| --- | --- |', '| Blaster | 2d6 |'].join('\n'),
            ),
        );

        /* Sans `remark-gfm`, ces trois lignes ne feraient qu'un paragraphe où
           l'on lirait les barres verticales. */
        const table = screen.getByRole('table');
        expect(table).toBeTruthy();
        expect(screen.getByRole('columnheader', { name: 'Arme' })).toBeTruthy();
        expect(screen.getByRole('cell', { name: 'Blaster' })).toBeTruthy();
        expect(document.body.textContent).not.toContain('|');
    });

    it('laisse le tableau défiler dans son propre cadre', () => {
        // Une table large ne doit pas pousser la page entière vers la droite.
        render(
            React.createElement(TexteMarkdown, null, '| a | b |\n| --- | --- |\n| 1 | 2 |'),
        );
        const cadre = screen.getByRole('table').parentElement;
        expect(cadre?.className).toContain('overflow-x-auto');
    });

    it('lit un contenu absent comme du vide, sans tomber', () => {
        // Plusieurs appelants passent `contenu || ''` faute de mieux ; le
        // composant doit se débrouiller seul.
        expect(() => render(React.createElement(TexteMarkdown, null, null))).not.toThrow();
    });
});

describe('personne n’appelle react-markdown directement', () => {
    it('seul TexteMarkdown importe la bibliothèque', () => {
        const sources = import.meta.glob('/src/**/*.{ts,tsx}', {
            query: '?raw',
            import: 'default',
            eager: true,
        }) as Record<string, string>;

        const fautifs = Object.entries(sources)
            .filter(([chemin]) => !chemin.endsWith('/src/components/TexteMarkdown.tsx'))
            .filter(([, source]) => /from ['"]react-markdown['"]/.test(source))
            .map(([chemin]) => chemin);

        expect(fautifs, [
            'Ces fichiers appellent react-markdown sans greffon : leurs tableaux',
            "s'afficheront en texte brut, barres verticales comprises.",
            "Passez par <TexteMarkdown> — c'est lui qui porte remark-gfm.",
        ].join(' ')).toEqual([]);

        // La garde doit voir quelque chose, sinon elle passe pour de bonnes raisons.
        expect(Object.keys(sources).length).toBeGreaterThan(200);
    });
});
