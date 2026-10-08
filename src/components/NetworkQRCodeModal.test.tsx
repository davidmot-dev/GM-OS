import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NetworkQRCodeModal } from './NetworkQRCodeModal';
import { useModalStore } from '../stores/useModalStore';
import type { InfoDeConnexion } from '../utils/portsDuRenderer';

const observation = vi.hoisted(() => ({ rendus: [] as string[] }));
vi.mock('qrcode.react', async () => {
    const { useLayoutEffect } = await import('react');
    return { QRCodeSVG: ({ value }: { value: string }) => {
        useLayoutEffect(() => { observation.rendus.push(value); });
        return <svg aria-label="QR" data-adresse={value} />;
    } };
});

const lire = vi.fn<() => Promise<InfoDeConnexion>>();
const adresseA = 'http://192.168.1.10:5173/?window=tablet&sync=4444';
const adresseB = 'http://192.168.1.20:5555/?window=tablet&sync=5555';
function enAttente<T>() {
    let resoudre!: (valeur: T) => void;
    let rejeter!: (erreur: Error) => void;
    const promesse = new Promise<T>((resolve, reject) => { resoudre = resolve; rejeter = reject; });
    return { promesse, resoudre, rejeter };
}
const ouvrir = () => act(() => useModalStore.getState().openNetworkModal());
const fermer = () => act(() => useModalStore.getState().closeNetworkModal());
const adresseDuQr = () => screen.getByLabelText('QR').getAttribute('data-adresse');

beforeEach(() => {
    observation.rendus.length = 0;
    lire.mockReset().mockResolvedValue({ ip: '192.168.1.10', port: 5173, mediaPort: 4444 });
    vi.stubGlobal('appBridge', { remote: { getConnectionInfo: lire } });
    useModalStore.setState({ isNetworkModalOpen: false });
});
afterEach(() => vi.unstubAllGlobals());

describe('le QR de l’ouverture courante', () => {
    it('ne lit rien quand le panneau est fermé', () => {
        render(<NetworkQRCodeModal />);
        expect(screen.queryByLabelText('QR')).toBeNull();
        expect(lire).not.toHaveBeenCalled();
    });

    it('affiche le repli web dès le premier commit, sans lecture', () => {
        vi.stubGlobal('appBridge', undefined);
        useModalStore.setState({ isNetworkModalOpen: true });
        render(<NetworkQRCodeModal />);
        const attendue = `http://${window.location.hostname}:${window.location.port || 80}/?window=tablet&sync=3001`;
        expect(observation.rendus).toEqual([attendue]);
        expect(adresseDuQr()).toBe(attendue);
        expect(screen.getByText(attendue)).toBeTruthy();
        expect(lire).not.toHaveBeenCalled();
    });

    it('garde distincts le port de l’interface et celui de synchronisation', async () => {
        const attente = enAttente<InfoDeConnexion>();
        lire.mockReturnValueOnce(attente.promesse);
        const vue = render(<NetworkQRCodeModal />);
        ouvrir();
        expect(adresseDuQr()).toBe(window.location.href);
        await act(async () => attente.resoudre({ ip: '192.168.1.10', port: 5173, mediaPort: 4444 }));
        expect(adresseDuQr()).toBe(adresseA);
        expect(screen.getByText(adresseA)).toBeTruthy();
        vue.rerender(<NetworkQRCodeModal />);
        expect(lire).toHaveBeenCalledOnce();
    });

    it('ne garde pas l’adresse précédente à la réouverture et ignore sa réponse tardive', async () => {
        const ancienne = enAttente<InfoDeConnexion>();
        const nouvelle = enAttente<InfoDeConnexion>();
        lire.mockReturnValueOnce(ancienne.promesse).mockReturnValueOnce(nouvelle.promesse);
        render(<NetworkQRCodeModal />);
        ouvrir(); fermer(); ouvrir();
        await act(async () => nouvelle.resoudre({ ip: '192.168.1.20', port: 5555, mediaPort: 5555 }));
        await act(async () => ancienne.resoudre({ ip: '192.168.1.10', port: 5173, mediaPort: 4444 }));
        expect(adresseDuQr()).toBe(adresseB);
        fermer();
        const troisieme = enAttente<InfoDeConnexion>();
        lire.mockReturnValueOnce(troisieme.promesse);
        observation.rendus.length = 0;
        ouvrir();
        expect(observation.rendus).toEqual([window.location.href]);
    });

    it('masque l’ancienne adresse dès le changement de lecteur', async () => {
        const vue = render(<NetworkQRCodeModal />);
        ouvrir();
        await act(async () => {});
        expect(adresseDuQr()).toBe(adresseA);
        const attente = enAttente<InfoDeConnexion>();
        const autreLire = vi.fn(() => attente.promesse);
        vi.stubGlobal('appBridge', { remote: { getConnectionInfo: autreLire } });
        observation.rendus.length = 0;
        vue.rerender(<NetworkQRCodeModal />);
        expect(observation.rendus).toEqual([window.location.href]);
        await act(async () => attente.resoudre({ ip: '192.168.1.20', port: 5555 }));
        expect(adresseDuQr()).toBe('http://192.168.1.20:5555/?window=tablet&sync=3001');
    });

    it('ferme par Échap et ignore les erreurs d’une ouverture abandonnée', async () => {
        const attente = enAttente<InfoDeConnexion>();
        lire.mockReturnValueOnce(attente.promesse);
        const journal = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<NetworkQRCodeModal />);
        ouvrir();
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByLabelText('QR')).toBeNull();
        await act(async () => attente.rejeter(new Error('lecture abandonnée')));
        expect(journal).not.toHaveBeenCalled();
    });

    it('traite l’erreur d’une lecture encore ouverte', async () => {
        const panne = new Error('réseau indisponible');
        lire.mockRejectedValueOnce(panne);
        const journal = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<NetworkQRCodeModal />);
        ouvrir();
        await act(async () => {});
        expect(journal).toHaveBeenCalledExactlyOnceWith(panne);
        expect(adresseDuQr()).toBe(window.location.href);
    });
});
