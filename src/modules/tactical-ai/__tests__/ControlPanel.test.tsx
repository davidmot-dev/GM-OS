import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TacticalAIControlPanel } from '../components/TacticalAIControlPanel';
import { useTacticalAIStore } from '../useTacticalAIStore';
import React from 'react';

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
});
