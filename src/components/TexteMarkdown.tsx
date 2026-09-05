import React from 'react';
import ReactMarkdown, { type Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * **Le seul endroit où GM-OS interprète du Markdown.**
 *
 * Trouvé par David le 2026-09-05 : *« dans Nexus Wiki, il n'interprète pas les
 * tables correctement »*.
 *
 * ⛔ **La cause : `react-markdown` ne connaît que le CommonMark.** Et les
 * tableaux **n'en font pas partie** — ils viennent de l'extension GitHub, portée
 * par `remark-gfm`. Sans ce greffon, `| Nom | Effet |` n'est pas un tableau,
 * c'est un paragraphe : les barres verticales s'affichent telles quelles. Tout
 * le reste — titres, gras, listes, liens — marchait, ce qui explique que seuls
 * les tableaux paraissaient cassés.
 *
 * Trois autres écritures étaient muettes pour la même raison : le texte barré,
 * les cases à cocher `- [ ]`, et les liens écrits sans crochets.
 *
 * ⚠️ **Le défaut était à SIX endroits.** Panneau Obsidian, vue Wiki, livre de
 * règles, atelier de règles, et deux écrans du Hub des joueurs appelaient tous
 * `ReactMarkdown` nu. *Un réglage qui doit être le même partout et que chaque
 * appelant repose est un réglage qu'un appelant finira par oublier* — d'où ce
 * composant, et la garde de `markdownEnUnSeulEndroit.test.ts` qui refuse un
 * septième appel direct.
 */

/**
 * **Un tableau défile dans son propre cadre, jamais la page.**
 *
 * Une table de dégâts à six colonnes dans un panneau étroit pousserait sinon
 * toute la mise en page vers la droite. Le débordement se tient ici, où il ne
 * gêne que lui-même.
 */
const COMPOSANTS: Options['components'] = {
    table: ({ node: _node, children, ...props }) => (
        <div className="overflow-x-auto max-w-full">
            <table {...props}>{children}</table>
        </div>
    ),
};

interface TexteMarkdownProps {
    /** Le Markdown à rendre. `null` et `undefined` se lisent comme du vide. */
    children: string | null | undefined;
    /** Rendus sur mesure, ajoutés aux nôtres — le nôtre cède si les clés se croisent. */
    components?: Options['components'];
}

const TexteMarkdown: React.FC<TexteMarkdownProps> = ({ children, components }) => (
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components ? { ...COMPOSANTS, ...components } : COMPOSANTS}
    >
        {children ?? ''}
    </ReactMarkdown>
);

export default TexteMarkdown;
