import { create } from 'zustand';
import { UserProfile, CarrierBillingState } from '../types';

interface AppState {
  currentUser: UserProfile | null;
  openBilling: boolean;
  appLoading: boolean;
  setCurrentUser: (user: UserProfile | null) => void;
  setOpenBilling: (open: boolean) => void;
  setAppLoading: (loading: boolean) => void;
  syncProfile: () => Promise<void>;
  signOut: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  openBilling: false,
  appLoading: true,

  setCurrentUser: (user) => {
    set({ currentUser: user });
    if (user) {
      localStorage.setItem('skillhire_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('skillhire_user');
    }
  },

  setOpenBilling: (open) => set({ openBilling: open }),
  setAppLoading: (loading) => set({ appLoading: loading }),

  syncProfile: async () => {
    const { currentUser } = get();
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/auth/profile/${currentUser.id}`);
      const data = await res.json();
      if (data.status === 'success') {
        set({ currentUser: data.user });
        localStorage.setItem('skillhire_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error('Failed to sync profile', e);
    }
  },

  signOut: () => {
    set({ currentUser: null });
    localStorage.removeItem('skillhire_user');
  }
}));
