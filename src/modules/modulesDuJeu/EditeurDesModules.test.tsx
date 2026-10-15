import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { EditeurDesModules } from './EditeurDesModules';
import type { GameDriver } from '../../types/drivers';

afterEach(cleanup);
const alien = { id: 'custom-1', name: 'Alien' } as GameDriver;
describe('sélection des modules', () => {
    it('désélectionne les deux modules et garde un choix explicite vide', () => {
        const sauver = vi.fn();
        function Atelier() {
            const [pilote, setPilote] = useState(alien);
            return <EditeurDesModules pilote={pilote} onChange={modulesDuJeu => { sauver(modulesDuJeu); setPilote({ ...pilote, modulesDuJeu }); }} />;
        }
        render(<Atelier />);
        const cases = screen.getAllByRole('checkbox');
        expect(cases.every(c => (c as HTMLInputElement).checked)).toBe(true);
        fireEvent.click(cases[0]); fireEvent.click(cases[1]);
        expect(sauver).toHaveBeenLastCalledWith([]);
        expect(cases.every(c => !(c as HTMLInputElement).checked)).toBe(true);
    });
    it('préserve une référence absente du catalogue quand on active un outil connu', () => {
        const sauver = vi.fn();
        render(<EditeurDesModules pilote={{ ...alien, modulesDuJeu: [{ id: 'futur-module', libelle: 'Mon outil' }] }} onChange={sauver} />);
        fireEvent.click(screen.getAllByRole('checkbox')[0]);
        expect(sauver).toHaveBeenCalledWith([{ id: 'futur-module', libelle: 'Mon outil' }, { id: 'alien-muthur' }]);
        expect(screen.getByRole('button', { name: 'Retirer Mon outil' })).toBeTruthy();
    });
});
