"use client";

import {
    useEffect,
    type ReactNode,
} from "react";

import {
    useAuthStore,
} from "@/stores/auth.store";

import {
    adminAuthApi,
} from "@/services/api/admin-auth.api";

import {
    customerAuthApi,
} from "@/services/api/customer-auth.api";

import {
    ownerAuthApi,
} from "@/services/api/owner-auth.api";

import {
    sellerAuthApi,
} from "@/services/api/seller-auth.api";

import {
    riderAuthApi,
} from "@/services/api/rider-auth.api";

import {
    authStorage,
} from "@/lib/auth/auth-storage";

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({
    children,
}: AuthProviderProps) {
    const setUser =
        useAuthStore(
            (state) => state.setUser,
        );

    const setLoading =
        useAuthStore(
            (state) => state.setLoading,
        );

    const clearAuth =
        useAuthStore(
            (state) => state.clearAuth,
        );

    useEffect(() => {
        let mounted = true;

        const restoreSession =
            async () => {
                try {
                    const stored =
                        authStorage.get();

                    if (!stored) {
                        if (mounted) {
                            setLoading(false);
                        }

                        return;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | OWNER
                    |--------------------------------------------------------------------------
                    |
                    | Owner authentication is two-step:
                    |
                    | 1. Email + password
                    | 2. Secret verification
                    |
                    | The refresh token is stored in an httpOnly cookie.
                    | After a browser refresh, request a new access token.
                    |
                    | Backend intentionally returns secretVerified:false
                    | after refresh, so Owner must verify the secret again.
                    |
                    */

                    if (
                        stored.accountType === "OWNER"
                    ) {
                        const response =
                            await ownerAuthApi.refresh();

                        if (!mounted) {
                            return;
                        }

                        setUser({
                            id:
                                response.userId,

                            email:
                                "",

                            accountType:
                                "OWNER",

                            role:
                                "OWNER",

                            isVerified:
                                false,

                            secretVerified:
                                false,
                        });

                        return;
                    }

                    let user;

                    switch (
                        stored.accountType
                    ) {
                        case "ADMIN":
                            user =
                                await adminAuthApi.getMe();
                            break;

                        case "USER":
                            user =
                                await customerAuthApi.getMe();
                            break;

                        case "SELLER":
                            user =
                                await sellerAuthApi.getMe();
                            break;

                        case "RIDER":
                            user =
                                await riderAuthApi.getMe();
                            break;

                        default:
                            throw new Error(
                                "Unsupported account type.",
                            );
                    }

                    if (!mounted) {
                        return;
                    }

                    setUser(user);

                    authStorage.set({
                        accountType:
                            user.accountType,

                        userId:
                            user.id,

                        role:
                            user.role,
                    });
                } catch {
                    if (!mounted) {
                        return;
                    }

                    authStorage.clear();

                    clearAuth();
                } finally {
                    if (mounted) {
                        setLoading(false);
                    }
                }
            };

        void restoreSession();

        return () => {
            mounted = false;
        };
    }, [
        setUser,
        setLoading,
        clearAuth,
    ]);

    return children;
}
