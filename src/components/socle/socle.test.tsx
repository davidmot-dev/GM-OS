import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
    Bouton, Etiquette, EnTeteDeModule, GabaritDeModule, Jauge, Panneau, Separateur, Tuile, tonAutomatique,
} from './index';

/**
 * **Le socle, variante par variante** — refonte, phase 3, 2026-09-30.
 *
 * Ce qu'on garde ici : chaque composant lit la forme dans le thème (des
 * classes et des variables, jamais une valeur), rend ses états, et **survit à
 * un thème absent** — les ornements n'y paraissent que si le thème en déclare.
 */

describe('<Panneau>', () => {
    it.each([
        [1, 'shadow-sm', 'rounded-xl', 'bg-app-surface'],
        [2, 'shadow-lg', 'rounded-xl', 'bg-app-surface-2'],
        [3, 'shadow-2xl', 'rounded-2xl', 'bg-app-surface'],
    ] as const)('niveau %s : relief %s, arrondi %s, fond %s', (niveau, relief, arrondi, fond) => {
        const { container } = render(<Panneau niveau={niveau}>x</Panneau>);
        const p = container.querySelector('[data-panneau]')!;
        expect(p.className).toContain(relief);
        expect(p.className).toContain(arrondi);
        expect(p.className).toContain(fond);
    });

    it('lit la bordure du thème, 1 px plein en repli', () => {
        const { container } = render(<Panneau>x</Panneau>);
        const style = (container.querySelector('[data-panneau]') as HTMLElement).getAttribute('style') ?? '';
        expect(style).toContain('var(--bordure-largeur, 1px)');
        expect(style).toContain('var(--bordure-style, solid)');
    });

    it('n’est orné que si on le lui demande — quatre coins, retournés', () => {
        const { container: nu } = render(<Panneau>x</Panneau>);
        expect(nu.querySelectorAll('[data-ornement="coin"]')).toHaveLength(0);
        const { container } = render(<Panneau orne>x</Panneau>);
        expect(container.querySelectorAll('[data-ornement="coin"]')).toHaveLength(4);
    });

    it('le filigrane ne se pose que dans un panneau vide', () => {
        const { container } = render(<Panneau vide>x</Panneau>);
        expect(container.querySelector('[data-ornement="fond"]')).not.toBeNull();
    });

    it('un ornement reste caché tant que le thème n’en déclare pas', () => {
        const { container } = render(<Panneau orne>x</Panneau>);
        const coin = container.querySelector('[data-ornement="coin"]') as HTMLElement;
        expect(coin.getAttribute('style')).toContain('var(--orne-coin-affichage, none)');
    });
});

describe('<Bouton>', () => {
    it.each([
        ['accent', 'bg-accent', 'text-app-on-accent'],
        ['neutre', 'bg-app-surface-2', 'text-app-text'],
        ['succes', 'bg-etat-succes/15', 'text-etat-succes'],
        ['danger', 'bg-etat-danger/15', 'text-etat-danger'],
    ] as const)('%s : %s, %s', (variante, fond, texte) => {
        render(<Bouton variante={variante}>Agir</Bouton>);
        const b = screen.getByRole('button', { name: 'Agir' });
        expect(b.className).toContain(fond);
        expect(b.className).toContain(texte);
    });

    it('a un anneau de focus visible, et 48 px à la table', () => {
        render(<><Bouton>Atelier</Bouton><Bouton aLaTable>Table</Bouton></>);
        expect(screen.getByRole('button', { name: 'Atelier' }).className).toContain('focus-visible:outline');
        expect(screen.getByRole('button', { name: 'Atelier' }).className).toContain('min-h-11');
        expect(screen.getByRole('button', { name: 'Table' }).className).toContain('min-h-12');
    });

    it('désactivé, il ne se clique pas', () => {
        render(<Bouton disabled>Non</Bouton>);
        expect((screen.getByRole('button', { name: 'Non' }) as HTMLButtonElement).disabled).toBe(true);
    });
});

describe('<Tuile>', () => {
    it('dit son état actif, en bordure et en halo', () => {
        render(<><Tuile actif>A</Tuile><Tuile>B</Tuile></>);
        const a = screen.getByRole('button', { name: 'A' });
        expect(a.getAttribute('aria-pressed')).toBe('true');
        expect(a.className).toContain('shadow-glow-accent');
        expect(screen.getByRole('button', { name: 'B' }).getAttribute('aria-pressed')).toBe('false');
    });

    it('garde une taille fixe quand on la lui donne', () => {
        render(<Tuile taille={96}>C</Tuile>);
        const c = screen.getByRole('button', { name: 'C' });
        expect(c.style.width).toBe('96px');
        expect(c.style.height).toBe('96px');
    });
});

describe('<Jauge>', () => {
    it.each([[1, 'succes'], [0.5, 'succes'], [0.49, 'alerte'], [0.25, 'alerte'], [0.24, 'danger'], [0, 'danger']] as const)(
        'à %s, le ton automatique est %s', (v, ton) => {
            expect(tonAutomatique(v)).toBe(ton);
        },
    );

    it('se lit comme une mesure, bornée entre 0 et 100', () => {
        render(<><Jauge valeur={1.7} libelle="Trop" /><Jauge valeur={Number.NaN} libelle="Rien" /></>);
        expect(screen.getByRole('meter', { name: 'Trop' }).getAttribute('aria-valuenow')).toBe('100');
        expect(screen.getByRole('meter', { name: 'Rien' }).getAttribute('aria-valuenow')).toBe('0');
    });

    it('un ton imposé passe devant le ton automatique', () => {
        render(<Jauge valeur={0.1} ton="info" libelle="Info" />);
        expect(screen.getByRole('meter', { name: 'Info' }).getAttribute('data-ton')).toBe('info');
    });
});

describe('<Etiquette>', () => {
    it.each(['neutre', 'accent', 'succes', 'alerte', 'danger', 'info'] as const)('%s ne descend jamais sous 11 px', (ton) => {
        render(<Etiquette ton={ton}>{ton}</Etiquette>);
        expect(screen.getByText(ton).className).toContain('text-ui-11');
    });
});

describe('<EnTeteDeModule> et <GabaritDeModule>', () => {
    it('l’en-tête porte le titre, la ligne d’état, les actions et l’ornement d’en-tête', () => {
        const { container } = render(
            <EnTeteDeModule titre="Combat-OS" surtitre="Round 3" etat={<Etiquette ton="danger">3 hostiles</Etiquette>} actions={<Bouton>Fin</Bouton>} />,
        );
        expect(screen.getByRole('heading', { name: 'Combat-OS' })).not.toBeNull();
        expect(screen.getByText('3 hostiles')).not.toBeNull();
        expect(screen.getByRole('button', { name: 'Fin' })).not.toBeNull();
        expect(container.querySelector('[data-ornement="entete"]')).not.toBeNull();
    });

    it('la grammaire : en-tête, barre d’outils, zone de travail, réglages à droite', () => {
        render(
            <GabaritDeModule entete={<EnTeteDeModule titre="Module" />} barreDOutils={<Bouton>Outil</Bouton>} reglages={<p>Réglage</p>}>
                <p>Travail</p>
            </GabaritDeModule>,
        );
        expect(screen.getByRole('toolbar')).not.toBeNull();
        expect(screen.getByRole('region', { name: 'Zone de travail' }).textContent).toContain('Travail');
        expect(screen.getByRole('complementary', { name: 'Réglages' }).textContent).toContain('Réglage');
    });

    it('à la table, les réglages se replient jusqu’à ce qu’on les ouvre', () => {
        const { rerender } = render(
            <GabaritDeModule aLaTable entete={<EnTeteDeModule titre="Module" />} reglages={<p>Réglage</p>}>x</GabaritDeModule>,
        );
        expect(screen.queryByRole('complementary')).toBeNull();
        rerender(<GabaritDeModule aLaTable reglagesOuverts entete={<EnTeteDeModule titre="Module" />} reglages={<p>Réglage</p>}>x</GabaritDeModule>);
        expect(screen.getByRole('complementary', { name: 'Réglages' })).not.toBeNull();
    });

    it('le séparateur pose un filet, et l’ornement du thème s’il en a un', () => {
        const { container } = render(<Separateur />);
        expect(screen.getByRole('separator')).not.toBeNull();
        expect(container.querySelector('[data-ornement="separateur"]')).not.toBeNull();
    });
});
