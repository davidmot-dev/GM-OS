import { useCallback } from 'react';
import { useTacticalAIStore } from '../useTacticalAIStore';
import { TacticalAISecrets } from '../types';

export const useSecretManager = () => {
  const secrets = useTacticalAIStore((state) => state.secrets);
  const updateSecrets = useTacticalAIStore((state) => state.updateSecrets);

  const getSecret = useCallback((key: keyof TacticalAISecrets) => {
    return secrets[key] || '';
  }, [secrets]);

  const setSecret = useCallback((key: keyof TacticalAISecrets, value: string) => {
    updateSecrets({ [key]: value });
  }, [updateSecrets]);

  const hasAllHardwareSecrets = useCallback(() => {
    return !!(secrets.hueBridgeIp && secrets.hueUsername);
  }, [secrets]);

  return {
    getSecret,
    setSecret,
    hasAllHardwareSecrets,
    secrets // Exposed for settings UI
  };
};
