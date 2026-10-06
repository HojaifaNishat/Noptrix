import {
    create,
} from "zustand";

import type {
    AuthUser,
} from "@/types/auth";

interface AuthState {
    user: AuthUser | null;

    isAuthenticated: boolean;

    isLoading: boolean;

    setUser: (
        user: AuthUser,
    ) => void;

    updateUser: (
        updates: Partial<AuthUser>,
    ) => void;

    setLoading: (
        isLoading: boolean,
    ) => void;

    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>(
    (set) => ({
        user: null,

        isAuthenticated: false,

        isLoading: true,

        setUser: (
            user,
        ) =>
            set({
                user,

                isAuthenticated: true,

                isLoading: false,
            }),

        updateUser: (
            updates,
        ) =>
            set((state) => ({
                user: state.user
                    ? {
                          ...state.user,
                          ...updates,
                      }
                    : null,
            })),

        setLoading: (
            isLoading,
        ) =>
            set({
                isLoading,
            }),

        clearAuth: () =>
            set({
                user: null,

                isAuthenticated: false,

                isLoading: false,
            }),
    }),
);