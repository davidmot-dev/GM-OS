import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { ImportPreparation, EquipageNatif } from '../../../outils/star-trek/lcars/preparation-native.mjs';
import { creerFiction } from '../../../outils/star-trek/lcars/fiction.mjs';
import { exporterConfiguration } from '../../../outils/star-trek/lcars/configuration.mjs';
import { vuePour } from '../../../outils/star-trek/lcars/moteur.mjs';
afterEach(cleanup);
function fichier(texte: string) { const f = new File([texte], 'preparation.json', { type: 'application/json' }); Object.defineProperty(f, 'text', { value: async () => texte }); return f; }
describe('préparation native LCARS', () => {
    it('prévisualise le format réellement lu, attend la confirmation et transmet une enveloppe valide', async () => {
        const envoyer = vi.fn(async () => true), configuration = exporterConfiguration(creerFiction());
        render(<ImportPreparation envoyer={envoyer} occupe={false} />);
        fireEvent.change(screen.getByLabelText('Fichier de préparation LCARS'), { target: { files: [fichier(JSON.stringify(configuration))] } });
        await screen.findByRole('heading', { name: 'USS ASTERIA' }); const bouton = screen.getByRole('button', { name: 'Remplacer la préparation LCARS' });
        expect((bouton as HTMLButtonElement).disabled).toBe(true); expect(envoyer).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(bouton);
        await waitFor(() => expect(envoyer).toHaveBeenCalledWith('importer-preparation', { configuration }));
    });
    it('un fichier refusé ou un import annulé ne transmet aucune commande', async () => {
        const envoyer = vi.fn(async () => true); render(<ImportPreparation envoyer={envoyer} occupe={false} />);
        fireEvent.change(screen.getByLabelText('Fichier de préparation LCARS'), { target: { files: [fichier('{invalide')] } }); await screen.findByRole('alert');
        expect(screen.queryByRole('button', { name: 'Remplacer la préparation LCARS' })).toBeNull();
        fireEvent.change(screen.getByLabelText('Fichier de préparation LCARS'), { target: { files: [fichier(JSON.stringify(exporterConfiguration(creerFiction())))] } });
        fireEvent.click(await screen.findByRole('button', { name: 'Annuler cet import' })); expect(envoyer).not.toHaveBeenCalled();
    });
    it('ne propose que les personnages réels, et conserve les anciens auteurs sans cases d’affectation', () => {
        const vue = vuePour(creerFiction(), { role: 'mj' }), envoyer = vi.fn(async () => true);
        render(<EquipageNatif vue={{ ...vue, personnages: [{ id: 'vrai-pj', nom: 'Officier réel' }] }} envoyer={envoyer} occupe={false} />);
        expect(screen.queryByLabelText('Identifiant du nouvel officier')).toBeNull(); expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
        fireEvent.click(screen.getByRole('button', { name: 'Préparer ce personnage' }));
        expect(envoyer).toHaveBeenCalledWith('preparer-officier', { personnageId: 'vrai-pj', nom: 'Officier réel', postes: [] });
    });
});
