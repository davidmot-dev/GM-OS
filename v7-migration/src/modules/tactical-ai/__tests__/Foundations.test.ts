import { describe, it, expect, beforeEach } from 'vitest';
import { useTacticalAIStore } from '../useTacticalAIStore';
import { renderHook } from '@testing-library/react';
import { useNarrativeRegistry } from '../hooks/useNarrativeRegistry';

describe('TacticalAI Foundations', () => {
  beforeEach(() => {
    useTacticalAIStore.getState().clearLogs();
    useTacticalAIStore.setState({
      status: 'idle',
      settings: {
        intensity: 0.5,
        isMuted: false,
        isEnabled: true,
        autoApplyDispel: true,
        enableTacticalToasts: true,
      }
    });
  });

  describe('useTacticalAIStore', () => {
    it('should update status correctly', () => {
      const { setStatus } = useTacticalAIStore.getState();
      setStatus('analyzing');
      expect(useTacticalAIStore.getState().status).toBe('analyzing');
    });

    it('should add logs with unique IDs', () => {
      const { addLog } = useTacticalAIStore.getState();
      addLog({ message: 'Test Log', type: 'info' });
      
      const logs = useTacticalAIStore.getState().logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test Log');
      expect(logs[0].id).toBeDefined();
    });
  });

  describe('useNarrativeRegistry', () => {
    it('should resolve "foudre" to correct tags', () => {
      const { result } = renderHook(() => useNarrativeRegistry());
      const tags = result.current.resolvePrompt('Un éclair de foudre');
      
      expect(tags).not.toBeNull();
      expect(tags?.hardware?.scene).toBe('Storm');
      expect(tags?.audio?.effect).toBe('thunder_crack.mp3');
    });

    it('should return null for unknown prompts', () => {
      const { result } = renderHook(() => useNarrativeRegistry());
      const tags = result.current.resolvePrompt('The sun is shining');
      
      expect(tags).toBeNull();
    });
  });
});
