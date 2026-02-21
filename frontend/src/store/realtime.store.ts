import { create } from 'zustand';

type RealtimeState = {
  tick: number;
  bump: () => void;
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  tick: 0,
  bump: () => set((state) => ({ tick: state.tick + 1 }))
}));
