import { create } from 'zustand';

interface ColdStartState {
  isWaking: boolean;
  setWaking: (waking: boolean) => void;
}

export const useColdStartStore = create<ColdStartState>((set) => ({
  isWaking: false,
  setWaking: (waking: boolean) => set({ isWaking: waking }),
}));
