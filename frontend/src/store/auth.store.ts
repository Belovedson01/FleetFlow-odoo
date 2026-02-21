import { create } from 'zustand';
import type { Role, User } from '../types';

type AuthState = {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
  hasRole: (roles) => {
    const role = get().user?.role;
    return !!role && roles.includes(role);
  }
}));
