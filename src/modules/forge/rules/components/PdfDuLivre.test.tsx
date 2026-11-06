import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import PdfDuLivre from './PdfDuLivre';
import type { LivreDuJeu } from '../livres';

/**
 * **La carte « PDF du livre »** — « Les chemins des livres », étape B (06/11/2026), maquette
 * validée par David. Le pont `livres` est simulé : le processus principal a son propre essai.
 */
const ALIEN: LivreDuJeu = { cle: 'jeu', titre: 'ALIEN, le jeu de rôle', chemin: '\\\\CLOUDDAVID\\Media\\ALIEN.pdf', decalage: 3, notes: 'mesuré' };
const pont = { choisir: vi.fn(), verifier: vi.fn(), proposerDecalage: vi.fn() };

beforeEach(() => {
    Object.values(pont).forEach(f => f.mockReset());
    (window as unknown as { appBridge: unknown }).appBridge = { livres: pont };
});
afterEach(() => { delete (window as unknown as { appBridge?: unknown }).appBridge; });

const monter = (livres: LivreDuJeu[] = [ALIEN], cle = 'jeu', titre = 'Livre de base') => {
    const onEcrire = vi.fn().mockResolvedValue(true);
    const vue = render(<PdfDuLivre cle={cle} titre={titre} livres={livres} onEcrire={onEcrire} cheminDuRegistre="systems/alien/livres.json" />);
    return { onEcrire, vue };
};
const clic = async (nom: RegExp | string) => { await act(async () => { fireEvent.click(screen.getByRole('button', { name: nom })); }); };

describe('PdfDuLivre', () => {
    it('montre le livre enregistré, son décalage ; rien à enregistrer tant que rien ne change', () => {
        monter();
        expect((screen.getByLabelText('Chemin du PDF du livre') as HTMLInputElement).value).toBe(ALIEN.chemin);
        expect(screen.getByLabelText('Décalage').textContent).toBe('+3');
        expect((screen.getByRole('button', { name: 'Enregistrer' }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByText(/le livre n’est jamais copié/)).toBeTruthy();
    });

    it('« la page imprimée 291 est la page 296 du PDF » donne + 5, et s’enregistre en gardant les notes', async () => {
        const { onEcrire } = monter();
        fireEvent.change(screen.getByLabelText('Page imprimée'), { target: { value: '291' } });
        fireEvent.change(screen.getByLabelText('Page du PDF'), { target: { value: '296' } });
        expect(screen.getByLabelText('Décalage').textContent).toBe('+5');
        await clic('Enregistrer');
        expect(onEcrire).toHaveBeenCalledWith([{ ...ALIEN, decalage: 5 }]);
        expect(screen.getByText('Enregistré.')).toBeTruthy();
    });

    it('vérifier : le livre répond, ou l’écran dit pourquoi il ne répond pas', async () => {
        pont.verifier.mockResolvedValueOnce({ repond: true, pages: 398 }).mockResolvedValueOnce({ repond: false, motif: 'introuvable' });
        monter();
        await clic('Vérifier');
        expect(pont.verifier).toHaveBeenCalledWith(ALIEN.chemin);
        expect(screen.getByText(/Le livre répond — 398 pages/)).toBeTruthy();
        await clic('Vérifier');
        expect(screen.getByText(/NAS éteint/)).toBeTruthy();
    });

    it('proposer depuis le livre : une proposition, retenue d’un clic, jamais écrite seule', async () => {
        pont.proposerDecalage.mockResolvedValue({ trouve: true, mesure: { decalage: 4, concordantes: 37, lues: 60 }, pages: 240 });
        const { onEcrire } = monter();
        await clic(/Proposer depuis le livre/);
        expect(screen.getByText(/Proposé : \+4 — 37 pages concordent\./)).toBeTruthy();
        expect(screen.getByLabelText('Décalage').textContent).toBe('+3');
        await clic('Retenir ?');
        expect(screen.getByLabelText('Décalage').textContent).toBe('+4');
        expect(screen.getByText('Retenu.')).toBeTruthy();
        expect(onEcrire).not.toHaveBeenCalled();
    });

    it('rien ne se dégage : on le dit, et le décalage reste à saisir', async () => {
        pont.proposerDecalage.mockResolvedValue({ trouve: false, motif: 'rien-ne-se-degage' });
        monter();
        await clic(/Proposer depuis le livre/);
        expect(screen.getByText(/saisissez-le à la main/)).toBeTruthy();
    });

    it('un supplément sans PDF : choisir le fichier puis l’enregistrer l’ajoute au registre, avec son titre', async () => {
        pont.choisir.mockResolvedValue('D:\\Livres\\Colonial Marines.pdf');
        const { onEcrire } = monter([ALIEN], 'colonial-marines', 'Colonial Marines Operations Manual');
        expect((screen.getByLabelText('Chemin du PDF du livre') as HTMLInputElement).value).toBe('');
        await clic('Choisir…');
        await clic('Enregistrer');
        expect(onEcrire).toHaveBeenCalledWith([ALIEN, { cle: 'colonial-marines', titre: 'Colonial Marines Operations Manual', chemin: 'D:\\Livres\\Colonial Marines.pdf', decalage: 0 }]);
    });

    it('le registre lu après l’ouverture remplit la carte (vu à l’e2e le 06/11)', () => {
        const { onEcrire, vue } = monter([]);
        expect((screen.getByLabelText('Chemin du PDF du livre') as HTMLInputElement).value).toBe('');
        vue.rerender(<PdfDuLivre cle="jeu" titre="Livre de base" livres={[ALIEN]} onEcrire={onEcrire} cheminDuRegistre={null} />);
        expect((screen.getByLabelText('Chemin du PDF du livre') as HTMLInputElement).value).toBe(ALIEN.chemin);
        expect(screen.getByLabelText('Décalage').textContent).toBe('+3');
    });

    it('retirer ôte le livre du registre ; changer de livre recharge la carte', async () => {
        const { onEcrire, vue } = monter();
        await clic('Retirer');
        expect(onEcrire).toHaveBeenCalledWith([]);
        vue.rerender(<PdfDuLivre cle="colonial-marines" titre="CM" livres={[ALIEN]} onEcrire={onEcrire} cheminDuRegistre={null} />);
        expect((screen.getByLabelText('Chemin du PDF du livre') as HTMLInputElement).value).toBe('');
        expect(screen.getByLabelText('Décalage').textContent).toBe('0');
    });
});
