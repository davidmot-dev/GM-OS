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
      updateSettings: vi.fn(),
      clearLogs: vi.fn(),
    });

    render(<TacticalAIControlPanel />);
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('should open the panel when clicked', () => {
    (useTacticalAIStore as any).mockReturnValue({
      status: 'idle',
      settings: { isMuted: false, autoApplyDispel: false },
      logs: [],
      updateSettings: vi.fn(),
      clearLogs: vi.fn(),
    });

    render(<TacticalAIControlPanel />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    
    expect(screen.getByText(/Cerveau/i)).toBeDefined();
  });
});
