import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TacticalAIControlPanel } from '../components/TacticalAIControlPanel';
import { useTacticalAIStore } from '../useTacticalAIStore';


// Mock the store
vi.mock('../useTacticalAIStore', () => ({
  useTacticalAIStore: vi.fn(),
}));

describe('TacticalAIControlPanel', () => {
  it('should render the trigger button when closed', () => {
    (useTacticalAIStore as any).mockReturnValue({
      status: 'idle',
      settings: { isMuted: false, autoApplyDispel: false },
      logs: [],
      isPanelOpen: true,
      updateSettings: vi.fn(),
      clearLogs: vi.fn(),
      setIsPanelOpen: vi.fn(),
      activeAdvices: [],
      hardwareStatus: { hue: 'connected', audio: 'ready' },
    });

    render(<TacticalAIControlPanel />);
    expect(screen.getByText(/Fermer Cortex/i)).toBeDefined();
  });

  it('should open the panel when clicked', () => {
    (useTacticalAIStore as any).mockReturnValue({
      status: 'idle',
      settings: { isMuted: false, autoApplyDispel: false },
      logs: [],
      isPanelOpen: true,
      updateSettings: vi.fn(),
      clearLogs: vi.fn(),
      setIsPanelOpen: vi.fn(),
      activeAdvices: [],
      hardwareStatus: { hue: 'connected', autoApplyDispel: false },
    });

    render(<TacticalAIControlPanel />);
    const btn = screen.getByText(/Fermer Cortex/i);
    fireEvent.click(btn);
    
    expect(screen.getByText(/Cerveau/i)).toBeDefined();
  });

  /** Échap referme le bandeau — sauf quand un autre écouteur l'a déjà revendiquée (2026-10-03). */
  describe('Échap', () => {
    const ouvert = (setIsPanelOpen: () => void) => (useTacticalAIStore as any).mockReturnValue({
      status: 'idle',
      settings: { isMuted: false, autoApplyDispel: false },
      logs: [],
      isPanelOpen: true,
      updateSettings: vi.fn(),
      clearLogs: vi.fn(),
      setIsPanelOpen,
      activeAdvices: [],
      hardwareStatus: { hue: 'connected', audio: 'ready' },
    });

    it('referme le bandeau quand personne ne la réclame', async () => {
      const setIsPanelOpen = vi.fn();
      ouvert(setIsPanelOpen);
      render(<TacticalAIControlPanel />);
      fireEvent.keyDown(window, { key: 'Escape' });
      await new Promise(r => setTimeout(r, 0));
      expect(setIsPanelOpen).toHaveBeenCalledWith(false);
    });

    it('cède la touche à qui l’a revendiquée — la scène de Light-OS, une surcouche', async () => {
      const setIsPanelOpen = vi.fn();
      ouvert(setIsPanelOpen);
      render(<TacticalAIControlPanel />);
      const revendique = (e: KeyboardEvent) => e.preventDefault();
      window.addEventListener('keydown', revendique);
      fireEvent.keyDown(window, { key: 'Escape' });
      window.removeEventListener('keydown', revendique);
      await new Promise(r => setTimeout(r, 0));
      expect(setIsPanelOpen).not.toHaveBeenCalled();
    });

    it('laisse Échap au champ de saisie', async () => {
      const setIsPanelOpen = vi.fn();
      ouvert(setIsPanelOpen);
      render(<><TacticalAIControlPanel /><input aria-label="note" /></>);
      fireEvent.keyDown(screen.getByLabelText('note'), { key: 'Escape' });
      await new Promise(r => setTimeout(r, 0));
      expect(setIsPanelOpen).not.toHaveBeenCalled();
    });
  });
});
