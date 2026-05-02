import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, LoginInput, RegisterInput } from '../types';
import { login as loginApi, logout as logoutApi, register as registerApi } from '../api/authApi';

type AuthState = {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (input: LoginInput) => Promise<void>;
    register: (input: RegisterInput) => Promise<void>;
    logout: () => Promise<void>;
};

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: async (input) => {
                const { token, user } = await loginApi(input);
                localStorage.setItem('auth_token', token);
                set({ user, token, isAuthenticated: true });
            },

            register: async (input) => {
                const { token, user } = await registerApi(input);
                localStorage.setItem('auth_token', token);
                set({ user, token, isAuthenticated: true });
            },

            logout: async () => {
                try { await logoutApi(); } catch { /* ignore */ }
                localStorage.removeItem('auth_token');
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
        },
    ),
);
