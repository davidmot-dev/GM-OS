import { useState } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MatriceShadowrun, SanteEtCoherenceShadowrun } from './CartesShadowrun';
import type { RegleDeShadowrun } from '../../../dice/systemes/shadowrun';
import { appliquerDrainShadowrun, lireSuiviShadowrun } from '../../../dice/systemes/suiviDeShadowrun';
const r: RegleDeShadowrun = { essence: 'essence', suivi: { mecanique: 'shadowrun', suivi: true,
    legeres: 'l', graves: 'g', incapacitantes: 'i', sante: 's' }, matrice: { minimum: 'min', hausse: 'hausse' } };
afterEach(cleanup);

describe('les cartes SR-A1/A2/A3 de la fiche', () => {
    it('le drain reste interdit aux soins et son malus expire seulement sur la fin de narration explicite', () => {
        let derniere: Record<string, unknown> = {};
        function Carte() {
            const base = { l: 0, g: 0, i: 0, essence: 6 };
            const [f, setF] = useState({ ...base, ...appliquerDrainShadowrun(r.suivi!, base, 'critique', 'j') });
            return <SanteEtCoherenceShadowrun regle={r} valeurs={f} appliquer={maj => { derniere = { ...f, ...maj }; setF(derniere as typeof f); }} consigner={() => {}} />;
        }
        render(<Carte />);
        expect((screen.getByText('Soigner cette case') as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(screen.getByText('Fin de la prochaine narration'));
        expect(lireSuiviShadowrun(derniere).legereRecente).toBe(false);
        expect(lireSuiviShadowrun(derniere).blessures).toHaveLength(1);
        fireEvent.change(screen.getByLabelText('Méthode de soins Shadowrun'), { target: { value: 'repos' } });
        fireEvent.change(screen.getByLabelText('Heures de repos'), { target: { value: '8' } });
        fireEvent.click(screen.getByText('Soigner cette case'));
        expect(derniere.l).toBe(0);
    });
    it('le passage en hot-sim perd les accès et dit mental létal ; une heure hors ligne efface la surveillance', () => {
        let derniere: Record<string, unknown> = {};
        function Carte() {
            const [f, setF] = useState<Record<string, unknown>>({ min: 4, hausse: 2, __shadowrunMatrice: {
                version: 1, mode: 'cold-ind', ind: true, cyberdeck: true, cibles: [{ id: 'a', nom: 'Serveur A', firewall: 5, acces: 2 }], cible: 'a', effetsAppliques: [] } });
            return <MatriceShadowrun regle={r} valeurs={f} appliquer={maj => { derniere = { ...f, ...maj }; setF(derniere); }} consigner={() => {}} />;
        }
        render(<Carte />);
        fireEvent.change(screen.getByLabelText('Mode de connexion'), { target: { value: 'hot-ind' } });
        expect((screen.getByLabelText('Accès actuel') as HTMLSelectElement).value).toBe('0');
        expect(screen.getByText(/mental létal — Volonté/)).toBeTruthy();
        expect(derniere.min).toBe(4);
        fireEvent.click(screen.getByText('Confirmer redémarrage et 1 h hors ligne'));
        expect(derniere.min).toBe(0); expect(derniere.hausse).toBe(0);
    });
    it('des saisies non sauvegardées bloquent aussi les boutons du suivi', () => {
        const appliquer = vi.fn();
        render(<SanteEtCoherenceShadowrun regle={r} valeurs={{ essence: 0 }} appliquer={appliquer} consigner={() => {}} disabled />);
        fireEvent.click(screen.getByText('Confirmer la mort par Essence'));
        expect(appliquer).not.toHaveBeenCalled();
    });
});
