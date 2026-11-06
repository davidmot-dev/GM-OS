import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VerificationAuLivre from './VerificationAuLivre';
import type { LectureDesPages, LivreDuJeu } from '../livres';

/*
 * F4 — l'encart de la relecture (06/11/2026) : la lecture part seule, sans bouton, et dit ce qu'elle
 * a trouvé ; sans PDF enregistré, elle dit où l'ajouter.
 */
const FICHE = [
    '### Tableau des Armes de contact (p. 93)',
    '',
    '| Arme | Allonge | DM | Bonus critique |',
    '| --- | --- | --- | --- |',
    '| **Fouet** | Grande | 1d4+FOR | 4 |',
    '| **Couteau / poignard / baïonnette** | Petite | 1d8+FOR | 6 |',
].join('\n');

const PAGE = 'Fouet \tGrande \t1d4+FOR \t4\nCouteau / poignard / baïonnette \tPetite \t1d6+FOR \t6\nFleuret \tMoyenne \t1d8+FOR \t8';

const LIVRE: LivreDuJeu = { cle: 'jeu', titre: 'COC', chemin: 'Z:/coc.pdf', decalage: 3 };
const registre = { racine: 'systems/coc', livres: [LIVRE] };

describe('VerificationAuLivre', () => {
    const pontInitial = window.appBridge;
    const lirePages = vi.fn<(d: unknown) => Promise<LectureDesPages>>();

    beforeEach(() => {
        lirePages.mockReset();
        window.appBridge = { livres: { lirePages, ouvrir: vi.fn() } } as unknown as typeof window.appBridge;
    });
    afterEach(() => { window.appBridge = pontInitial; });

    it('lit seule les pages du tableau, puis dit les lignes retrouvées et celle à confirmer', async () => {
        lirePages.mockResolvedValue({ lu: true, titre: 'COC', pages: [{ page: 93, texte: PAGE }] });
        render(<VerificationAuLivre contenu={FICHE} registre={registre} cle="jeu" plage={null} plageEnCours={false} />);
        await waitFor(() => expect(document.querySelector('[data-verification-au-livre="fait"]')).not.toBeNull());
        expect(lirePages).toHaveBeenCalledWith({ racine: 'systems/coc', cle: 'jeu', pages: [92, 93, 94] });
        expect(document.querySelector('[data-ligne-douteuse]')?.getAttribute('data-ligne-douteuse')).toBe('Couteau / poignard / baïonnette');
        // À confirmer n'est pas introuvable : pas d'alerte.
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('une valeur introuvable déclenche l’alerte', async () => {
        lirePages.mockResolvedValue({ lu: true, titre: 'COC', pages: [{ page: 93, texte: 'Fouet \tGrande \t1d4+FOR \t4' }] });
        render(<VerificationAuLivre contenu={FICHE} registre={registre} cle="jeu" plage={null} plageEnCours={false} />);
        await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    });

    it('sans PDF enregistré : dit où l’ajouter, sans rien lire', () => {
        render(<VerificationAuLivre contenu={FICHE} registre={{ racine: 'systems/coc', livres: [] }} cle="jeu" plage={null} plageEnCours={false} />);
        expect(document.querySelector('[data-verification-au-livre="sans-livre"]')).not.toBeNull();
        expect(lirePages).not.toHaveBeenCalled();
    });

    it('un livre qui ne répond pas le dit', async () => {
        lirePages.mockResolvedValue({ lu: false, motif: 'introuvable' });
        render(<VerificationAuLivre contenu={FICHE} registre={registre} cle="jeu" plage={null} plageEnCours={false} />);
        await waitFor(() => expect(document.querySelector('[data-verification-au-livre="echec"]')).not.toBeNull());
    });

    it('un tableau sans page attend la plage de l’index, puis la lit', async () => {
        lirePages.mockResolvedValue({ lu: true, titre: 'COC', pages: [] });
        const sansPage = FICHE.replace(' (p. 93)', '');
        const { rerender } = render(<VerificationAuLivre contenu={sansPage} registre={registre} cle="jeu" plage={null} plageEnCours />);
        expect(lirePages).not.toHaveBeenCalled();
        rerender(<VerificationAuLivre contenu={sansPage} registre={registre} cle="jeu" plage={{ min: 93, max: 94 }} plageEnCours={false} />);
        await waitFor(() => expect(lirePages).toHaveBeenCalledWith({ racine: 'systems/coc', cle: 'jeu', pages: [92, 93, 94, 95] }));
    });

    it('une fiche sans tableau lu par le catalogue ou le bestiaire : rien', () => {
        const { container } = render(<VerificationAuLivre contenu="## Règle\nRien." registre={registre} cle="jeu" plage={null} plageEnCours={false} />);
        expect(container.innerHTML).toBe('');
    });
});
