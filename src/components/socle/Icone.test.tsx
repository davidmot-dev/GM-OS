import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Swords } from 'lucide-react';
import { Icone } from './Icone';

/** Phase 6 · `<Icone>` — sans thème de jeu, l'icône de GM-OS reste, à l'identique. */
describe('<Icone>', () => {
    it('rend l’icône de GM-OS en repli, et le dessin du jeu masqué par défaut', () => {
        const { container } = render(<Icone nom="combat" taille={20} repli={<Swords size={20} data-testid="repli" />} />);
        const dessin = container.querySelector('[data-icone="combat"]') as HTMLElement;
        const repli = container.querySelector('[data-icone-repli="combat"]') as HTMLElement;
        expect(dessin.style.display).toBe('var(--icone-combat-affichage, none)');
        expect(repli.style.display).toBe('var(--icone-combat-repli, contents)');
        expect(repli.querySelector('svg')).not.toBeNull();
    });
});
