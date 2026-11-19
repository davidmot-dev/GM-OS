import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import ListeDuCatalogue from './ListeDuCatalogue';
import type { FamilleDObjet, GameDriver } from '../../../types/drivers';

/**
 * **La liste du catalogue en choix multiple** — registre § 264, T3 (19/11/2026) : la
 * liste de « Prendre dans le catalogue », reprise pour le butin (décision de David,
 * « Reprendre la fenêtre »). Le choix unique reste couvert par
 * `PrendreDansLeCatalogue.test.tsx`, inchangé.
 */
const pilote = {
    id: 'alien', name: 'Alien',
    catalogue: {
        colonnes: { arme: [{ id: 'degats', libelle: 'Dégâts', nature: 'nombre' }] },
        objets: [
            { id: 'm4a3', famille: 'arme', nom: 'Pistolet M4A3', categorie: 'Pistolets', valeurs: { degats: 1 } },
            { id: 'vp70', famille: 'arme', nom: 'Pistolet VP70', categorie: 'Pistolets', valeurs: { degats: 1 } },
            { id: 'm41a', famille: 'arme', nom: 'Fusil M41A', categorie: 'Fusils', valeurs: { degats: 2 } },
            { id: 'ration', famille: 'materiel', nom: 'Ration', valeurs: {} },
        ],
    },
} as unknown as GameDriver;

const Banc = ({ onCocher }: { onCocher?: (ids: string[], coche: boolean) => void }) => {
    const [famille, setFamille] = useState<FamilleDObjet>('arme');
    const [coches, setCoches] = useState<Set<string>>(new Set());
    return (
        <>
            <ListeDuCatalogue driver={pilote} familles={['arme', 'protection', 'vehicule', 'materiel']} famille={famille} onFamille={setFamille}
                choix={{ mode: 'plusieurs', coches, onCocher: (ids, coche) => {
                    onCocher?.(ids, coche);
                    setCoches(c => { const s = new Set(c); for (const id of ids) { if (coche) s.add(id); else s.delete(id); } return s; });
                } }} />
            <output aria-label="Cochés">{[...coches].sort().join(',')}</output>
        </>
    );
};
const coches = () => screen.getByLabelText('Cochés').textContent;

describe('ListeDuCatalogue en choix multiple', () => {
    it('montre les quatre familles demandées, avec leur compte', () => {
        render(<Banc />);
        expect(screen.getAllByRole('tab', { name: /Armes|Protections|Véhicules|Matériel/ }).map(t => t.textContent)).toEqual(['Armes3', 'Protections0', 'Véhicules0', 'Matériel1']);
    });

    it('une ligne se coche et se décoche ; la liste se dit multiple', () => {
        render(<Banc />);
        expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
        fireEvent.click(screen.getByRole('option', { name: /Pistolet M4A3/ }));
        expect(coches()).toBe('m4a3');
        expect(screen.getByRole('option', { name: /Pistolet M4A3/ })).toHaveAttribute('aria-selected', 'true');
        fireEvent.click(screen.getByRole('option', { name: /Pistolet M4A3/ }));
        expect(coches()).toBe('');
    });

    it('« Toute la catégorie » coche les objets de la catégorie ouverte, et les décoche', () => {
        const onCocher = vi.fn();
        render(<Banc onCocher={onCocher} />);
        fireEvent.click(screen.getByRole('tab', { name: 'Pistolets' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Toute la catégorie' }));
        expect(onCocher).toHaveBeenLastCalledWith(['m4a3', 'vp70'], true);
        expect(coches()).toBe('m4a3,vp70');
        expect(screen.getByRole('checkbox', { name: 'Toute la catégorie' })).toBeChecked();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Toute la catégorie' }));
        expect(coches()).toBe('');
    });

    it('la sélection survit au changement de famille et de catégorie', () => {
        render(<Banc />);
        fireEvent.click(screen.getByRole('tab', { name: 'Fusils' }));
        fireEvent.click(screen.getByRole('option', { name: /Fusil M41A/ }));
        fireEvent.click(screen.getByRole('tab', { name: /Matériel/ }));
        fireEvent.click(screen.getByRole('option', { name: /Ration/ }));
        expect(coches()).toBe('m41a,ration');
    });

    it('cherche dans le catalogue', () => {
        render(<Banc />);
        fireEvent.change(screen.getByLabelText('Chercher dans le catalogue'), { target: { value: 'VP70' } });
        expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual([expect.stringContaining('Pistolet VP70')]);
    });

    it('une famille vide le dit', () => {
        render(<Banc />);
        fireEvent.click(screen.getByRole('tab', { name: /Protections/ }));
        expect(screen.getByText('Aucun objet de cette famille dans le catalogue du pilote.')).toBeTruthy();
    });
});
