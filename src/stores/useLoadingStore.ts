import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  message: string;
  setLoading: (loading: boolean, message?: string) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  message: '',
  setLoading: (isLoading, message = '') => set({ isLoading, message }),
}));
