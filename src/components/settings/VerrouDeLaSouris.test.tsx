import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import VerrouDeLaSouris from './VerrouDeLaSouris';

type Pont = NonNullable<NonNullable<Window['appBridge']>['souris']>;
type Souris = Awaited<ReturnType<Pont['inventaire']>>[number];
const temoin: Souris = { id: 'HID\\VID_0001&PID_0002\\JOUEURS', nom: 'Souris fictive', active: true };
const pont: Pont = {
    inventaire: vi.fn(), couper: vi.fn(), rendre: vi.fn(), confirmer: vi.fn(),
};
function enAttente<T>() {
    let resoudre!: (valeur: T) => void;
    const promesse = new Promise<T>(resolve => { resoudre = resolve; });
    return { promesse, resoudre };
}
async function ouvrir() {
    const vue = render(<VerrouDeLaSouris />);
    await act(async () => {});
    return vue;
}
async function couper() {
    vi.mocked(pont.inventaire).mockResolvedValue([{ ...temoin, active: false }]);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Couper' })));
}

beforeEach(() => {
    vi.stubGlobal('appBridge', { souris: pont });
    vi.mocked(pont.inventaire).mockReset().mockResolvedValue([temoin]);
    vi.mocked(pont.couper).mockReset().mockResolvedValue({ ok: true, retourDans: 20000 });
    vi.mocked(pont.rendre).mockReset().mockResolvedValue({ ok: true });
    vi.mocked(pont.confirmer).mockReset().mockResolvedValue({ ok: true });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('l’inventaire du verrou', () => {
    it('annonce son absence hors de l’application de bureau', async () => {
        vi.stubGlobal('appBridge', undefined);
        await ouvrir();
        expect(screen.getByText(/n’existe que dans l’application de bureau/)).toBeTruthy();
        expect(pont.inventaire).not.toHaveBeenCalled();
    });

    it('charge l’identifiant et garde la liste pendant une actualisation', async () => {
        await ouvrir();
        expect(screen.getByText('0001:0002').getAttribute('title')).toBe(temoin.id);
        const suivante = enAttente<Souris[]>();
        vi.mocked(pont.inventaire).mockReturnValueOnce(suivante.promesse);
        fireEvent.click(screen.getByRole('button', { name: 'Actualiser' }));
        expect(screen.getByText('Souris fictive')).toBeTruthy();
        await act(async () => suivante.resoudre([{ ...temoin, nom: 'Souris renommée' }]));
        expect(screen.getByText('Souris renommée')).toBeTruthy();
        expect(pont.inventaire).toHaveBeenCalledTimes(2);
    });

    it('ignore un inventaire ancien qui termine après l’actualisation', async () => {
        const ancienne = enAttente<Souris[]>();
        vi.mocked(pont.inventaire).mockReturnValueOnce(ancienne.promesse);
        await ouvrir();
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Actualiser' })));
        await act(async () => ancienne.resoudre([{ ...temoin, nom: 'Ancienne liste' }]));
        expect(screen.queryByText('Ancienne liste')).toBeNull();
        expect(screen.getByText('Souris fictive')).toBeTruthy();
    });

    it('ne montre pas les souris du pont précédent après son remplacement', async () => {
        const vue = await ouvrir();
        const suivante = enAttente<Souris[]>();
        const autrePont = { ...pont, inventaire: vi.fn(() => suivante.promesse) };
        vi.stubGlobal('appBridge', { souris: autrePont });
        vue.rerender(<VerrouDeLaSouris />);
        expect(screen.queryByText('Souris fictive')).toBeNull();
        await act(async () => suivante.resoudre([{ ...temoin, nom: 'Autre pont' }]));
        expect(screen.getByText('Autre pont')).toBeTruthy();
    });

    it('annonce une panne de lecture sans effacer la liste et permet de réessayer', async () => {
        await ouvrir();
        vi.mocked(pont.inventaire).mockRejectedValueOnce(new Error('IPC indisponible'));
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Actualiser' })));
        expect(screen.getByRole('alert').textContent).toBe('Inventaire des souris indisponible.');
        expect(screen.getByText('Souris fictive')).toBeTruthy();
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Actualiser' })));
        expect(screen.queryByRole('alert')).toBeNull();
    });
});

describe('le reflet du retour automatique', () => {
    it('décompte les vingt secondes puis relit, sans rendre lui-même le périphérique', async () => {
        await ouvrir();
        vi.useFakeTimers();
        await couper();
        expect(screen.getByText(/revient dans 20 s/)).toBeTruthy();
        for (let i = 0; i < 19; i++) act(() => vi.advanceTimersByTime(1000));
        expect(screen.getByText(/revient dans 1 s/)).toBeTruthy();
        vi.mocked(pont.inventaire).mockResolvedValue([temoin]);
        await act(async () => vi.advanceTimersByTime(1000));
        expect(screen.queryByText(/Sans confirmation/)).toBeNull();
        expect(screen.getByRole('button', { name: 'Couper' })).toBeTruthy();
        expect(pont.inventaire).toHaveBeenCalledTimes(3);
        expect(pont.rendre).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('ne lance aucun compte à rebours si le retour annoncé est immédiat', async () => {
        await ouvrir();
        vi.useFakeTimers();
        vi.mocked(pont.couper).mockResolvedValueOnce({ ok: true, retourDans: 0 });
        await couper();
        expect(screen.queryByText(/Sans confirmation/)).toBeNull();
        expect(vi.getTimerCount()).toBe(0);
        expect(pont.inventaire).toHaveBeenCalledTimes(2);
    });

    it('confirme la coupure et annule le décompte sans nouvelle lecture tardive', async () => {
        await ouvrir();
        vi.useFakeTimers();
        await couper();
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Oui, garde-la coupée' })));
        expect(pont.confirmer).toHaveBeenCalledExactlyOnceWith(temoin.id);
        act(() => vi.advanceTimersByTime(20000));
        expect(screen.queryByText(/Sans confirmation/)).toBeNull();
        expect(pont.inventaire).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('rend sur ordre et annule le décompte', async () => {
        await ouvrir();
        vi.useFakeTimers();
        await couper();
        vi.mocked(pont.inventaire).mockResolvedValue([temoin]);
        await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Rendre' })));
        expect(pont.rendre).toHaveBeenCalledExactlyOnceWith(temoin.id);
        expect(screen.getByRole('button', { name: 'Couper' })).toBeTruthy();
        expect(screen.queryByText(/Sans confirmation/)).toBeNull();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('laisse le retour au processus principal quand l’écran est démonté', async () => {
        const vue = await ouvrir();
        vi.useFakeTimers();
        await couper();
        vue.unmount();
        act(() => vi.advanceTimersByTime(20000));
        expect(pont.rendre).not.toHaveBeenCalled();
        expect(pont.inventaire).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('ne lance pas de décompte quand la coupure est refusée', async () => {
        await ouvrir();
        vi.useFakeTimers();
        vi.mocked(pont.couper).mockResolvedValueOnce({ ok: false, message: 'Dernière souris active.' });
        await couper();
        expect(screen.getByRole('alert').textContent).toBe('Dernière souris active.');
        expect(screen.queryByText(/Sans confirmation/)).toBeNull();
        expect(pont.inventaire).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });
});
