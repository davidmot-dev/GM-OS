import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    it('should resolve "lightning" to correct tags', () => {
      const { result } = renderHook(() => useNarrativeRegistry());
      const tags = result.current.resolvePrompt('A flash of lightning strike');
      
      expect(tags).not.toBeNull();
      expect(tags?.light).toBe('thunderstorm');
      expect(tags?.audio).toBe('thunder_heavy');
    });

    it('should return null for unknown prompts', () => {
      const { result } = renderHook(() => useNarrativeRegistry());
      const tags = result.current.resolvePrompt('The sun is shining');
      
      expect(tags).toBeNull();
    });
  });
});
