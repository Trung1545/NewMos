import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAIStore } from './useAIStore';

export interface UserProfile {
  id?: number | string;
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  roles?: string[];
  [key: string]: any;
}

export interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  role: string | null;

  login: (token: string, userData: UserProfile) => void;
  logout: () => void;
  updateUser: (newData: Partial<UserProfile>) => void;

  // Backward compatibility methods
  setAuth: (token: string, user: UserProfile) => void;
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      role: null,

      login: (token: string, userData: UserProfile) => {
        const role = userData?.role || (userData?.roles && userData.roles.length > 0 ? userData.roles[0] : 'ROLE_USER');
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
        }
        set({
          token,
          user: { ...userData, role },
          isAuthenticated: true,
          role,
        });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('token');
        }
        try {
          useAIStore.getState().clearProfile();
        } catch (_) {}
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          role: null,
        });
      },

      updateUser: (newData: Partial<UserProfile>) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...newData };
        const role = updatedUser.role || (updatedUser.roles && updatedUser.roles.length > 0 ? updatedUser.roles[0] : get().role);
        set({
          user: updatedUser,
          role,
        });
      },

      setAuth: (token: string, user: UserProfile) => {
        get().login(token, user);
      },

      setToken: (token: string | null) => {
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('access_token', token);
          } else {
            localStorage.removeItem('access_token');
          }
        }
        set({
          token,
          isAuthenticated: Boolean(token),
        });
      },

      setUser: (user: UserProfile | null) => {
        const role = user?.role || (user?.roles && user.roles.length > 0 ? user.roles[0] : null);
        set({
          user,
          role: role || get().role,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : (null as unknown as Storage))),
    }
  )
);

export default useAuthStore;
