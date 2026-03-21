export interface TacticalAISecrets {
  hueBridgeIp?: string;
  hueUsername?: string;
  openAIKey?: string;
  geminiKey?: string;
}

export interface TacticalAISettings {
  intensity: number; // 0 (Stricte) to 1 (Randomisation)
  isMuted: boolean;
  autoApplyDispel: boolean;
  enableTacticalToasts: boolean;
  isEnabled: boolean;
}

export interface TacticalAILogs {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'tactical' | 'error';
}

export interface TacticalAdvice {
  id: string;
  sourceId: string; // ID of the token/combatant generating advice
  type: 'range' | 'dispel' | 'position' | 'magic' | 'status' | 'macro-flank' | 'macro-rout';
  message: string;
  priority: number;
  color?: string; // Optional hex color for lights (legacy)
  resolution?: {
    hardware?: {
        color: string;
        intensity: number;
        priority: number;
        scene: string;
    };
    audio?: {
        effect?: string;
        ambient?: string;
    };
    intensity: number;
    ambientSceneId?: string;
  };
}

export interface TacticalAIState {
  status: 'idle' | 'analyzing' | 'applying' | 'error';
  settings: TacticalAISettings;
  secrets: TacticalAISecrets;
  logs: TacticalAILogs[];
  activeAdvices: TacticalAdvice[];
  hardwareStatus: {
    hue: 'disconnected' | 'connected' | 'pairing';
    audio: 'missing' | 'ready';
  };
  isPanelOpen: boolean;
  
  // Actions
  setStatus: (status: TacticalAIState['status']) => void;
  updateSettings: (settings: Partial<TacticalAISettings>) => void;
  updateSecrets: (secrets: Partial<TacticalAISecrets>) => void;
  addLog: (log: Omit<TacticalAILogs, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  setAdvices: (advices: TacticalAdvice[]) => void;
  setHardwareStatus: (status: Partial<TacticalAIState['hardwareStatus']>) => void;
  setIsPanelOpen: (isOpen: boolean) => void;
}
