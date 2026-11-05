import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RemplirLeBestiaire from './RemplirLeBestiaire';
import type { BestiaireDuJeu, GameDriver } from '../../../../types/drivers';
import type { LivreACataloguer } from '../../../equipement/livresDuJeu';
import CONTENU from '../../../../../docs/systems/alien/supplements/colonial-marines/rules/nouvelles-variantes-de-xenomorphes-et-anathemes.md?raw';

/**
 * **L'aperçu « Remplir depuis le corpus » du bestiaire** — § 210, étape C (05/11/2026). La fiche est
 * celle de Colonial Marines, relue ; rien n'est versé avant « Verser au bestiaire ».
 */
const LIVRES: LivreACataloguer[] = [
    { cle: 'jeu', titre: 'Livre de base', fiches: [], total: 32 },
    { cle: 'colonial-marines', titre: 'Colonial Marines Operations Manual', total: 19, fiches: [{
        chemin: 'systems/alien/supplements/colonial-marines/rules/nouvelles-variantes-de-xenomorphes-et-anathemes.md',
        contenu: CONTENU, livre: 'Colonial Marines Operations Manual',
    }] },
];
const pilote = (bestiaire?: BestiaireDuJeu) => ({ id: 'alien', name: 'Alien', bestiaire } as unknown as GameDriver);

afterEach(cleanup);
const monter = (bestiaire?: BestiaireDuJeu) => {
    const onVerser = vi.fn();
    const onFermer = vi.fn();
    const rendu = render(<RemplirLeBestiaire driver={pilote(bestiaire)} onVerser={onVerser} onFermer={onFermer} livresFournis={LIVRES} />);
    return { onVerser, onFermer, ...rendu };
};

describe('RemplirLeBestiaire (§ 210, étape C)', () => {
    it('montre le bilan, les créatures par catégorie, les colonnes et les attaques rattachées', () => {
        const { container } = monter();
        expect(screen.getByText('aucune fiche de créatures relue')).toBeTruthy();
        expect(screen.getByText('1 fiche de créatures sur 19')).toBeTruthy();
        expect(screen.getByRole('status').textContent).toBe('3 créature(s) à ajouter · 0 complétée(s) · 6 colonne(s) à déclarer · 2 table(s) d’attaques rattachée(s)');
        expect(screen.getByRole('tab', { name: 'Xénomorphes aberrants 2' }).getAttribute('aria-selected')).toBe('true');
        const biodrone = [...container.querySelector('[data-creature-proposee="biodrone-xx121b"]')!.children].map(c => c.textContent);
        expect(biodrone).toEqual(['Biodrone XX121B', '2', '6', '8', '10', '8', '8', 'p. 176']);
        fireEvent.click(screen.getByRole('tab', { name: 'Anathèmes 1' }));
        expect(container.querySelector('[data-creature-proposee="anatheme-monstrueux"]')!.textContent).toContain('p. 180');
        expect(screen.getByText(/Goreburster XX121AB : 5 attaques/)).toBeTruthy();
    });

    it('rien n’est versé avant le bouton ; décocher le supplément ne laisse rien à verser', () => {
        const { onVerser } = monter();
        expect(onVerser).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText('Verser au bestiaire'));
        expect(onVerser.mock.calls[0][0].creatures).toHaveLength(3);
        cleanup();
        monter();
        fireEvent.click(screen.getByRole('checkbox', { name: /Colonial Marines/ }));
        expect((screen.getByText('Verser au bestiaire').closest('button') as HTMLButtonElement).disabled).toBe(true);
    });

    it('une valeur corrigée reste ; l’écart est montré dans « À regarder »', () => {
        const corrige: BestiaireDuJeu = {
            colonnes: [{ id: 'sante', libelle: 'Santé', nature: 'nombre', champ: 'sante' }],
            creatures: [{ id: 'biodrone-xx121b', nom: 'Biodrone XX121B', valeurs: { sante: 7 } }],
        };
        monter(corrige);
        expect(screen.getByText(/Biodrone XX121B · sante : bestiaire « 7 », fiche « 6 » — gardé tel quel/)).toBeTruthy();
        expect(screen.getByRole('status').textContent).toContain('2 créature(s) à ajouter · 1 complétée(s) · 5 colonne(s)');
    });
});
