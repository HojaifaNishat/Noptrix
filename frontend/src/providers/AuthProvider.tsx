"use client";

import { useEffect, type ReactNode } from "react";

import { useAuthStore } from "@/stores/auth.store";

import { adminAuthApi } from "@/services/api/admin-auth.api";
import { customerAuthApi } from "@/services/api/customer-auth.api";
import { ownerAuthApi } from "@/services/api/owner-auth.api";
import { sellerAuthApi } from "@/services/api/seller-auth.api";
import { riderAuthApi } from "@/services/api/rider-auth.api";

import { authStorage } from "@/lib/auth/auth-storage";
import { tokenStorage } from "@/lib/auth/token-storage";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface AuthProviderProps {
    children: ReactNode;
}

/*
|--------------------------------------------------------------------------
| Owner Refresh Single-Flight
|--------------------------------------------------------------------------
|
| Prevents multiple refresh requests from using the same old refresh token
| at the same time.
|
| This is especially important in Next.js/React development mode where
| effects can be executed more than once during development.
|
*/

let ownerRefreshPromise:
    | Promise<
          Awaited<
              ReturnType<
                  typeof ownerAuthApi.refresh
              >
          >
      >
    | null = null;

/*
|--------------------------------------------------------------------------
| Auth Provider
|--------------------------------------------------------------------------
*/

export function AuthProvider({
    children,
}: AuthProviderProps) {
    const setUser =
        useAuthStore(
            (state) =>
                state.setUser,
        );

    const setLoading =
        useAuthStore(
            (state) =>
                state.setLoading,
        );

    const clearAuth =
        useAuthStore(
            (state) =>
                state.clearAuth,
        );

    useEffect(() => {
        let mounted = true;

        /*
        |--------------------------------------------------------------------------
        | Restore Session
        |--------------------------------------------------------------------------
        */

        const restoreSession =
            async (): Promise<void> => {
                try {
                    /*
                    |--------------------------------------------------------------------------
                    | Read Stored Authentication State
                    |--------------------------------------------------------------------------
                    */

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
                    | OWNER uses refresh-token rotation.
                    |
                    | The refresh operation is protected by a single-flight
                    | promise so multiple simultaneous restore attempts share
                    | the same refresh request.
                    |
                    */

                    if (
                        stored.accountType ===
                        "OWNER"
                    ) {
                        if (
                            !ownerRefreshPromise
                        ) {
                            ownerRefreshPromise =
                                ownerAuthApi
                                    .refresh()
                                    .finally(
                                        () => {
                                            ownerRefreshPromise =
                                                null;
                                        },
                                    );
                        }

                        const response =
                            await ownerRefreshPromise;

                        if (!mounted) {
                            return;
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | Store New Access Token
                        |--------------------------------------------------------------------------
                        */

                        tokenStorage.set(
                            response.accessToken,
                        );

                        /*
                        |--------------------------------------------------------------------------
                        | Restore OWNER State
                        |--------------------------------------------------------------------------
                        |
                        | Refresh intentionally resets secretVerified to false.
                        |
                        | Therefore the OWNER must verify the secret again
                        | before accessing /admin.
                        |
                        */

                        setUser({
                            id:
                                response.userId,

                            email: "",

                            accountType:
                                "OWNER",

                            role: "OWNER",

                            isVerified:
                                false,

                            secretVerified:
                                false,
                        });

                        return;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | ADMIN / CUSTOMER / SELLER / RIDER
                    |--------------------------------------------------------------------------
                    */

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

                    /*
                    |--------------------------------------------------------------------------
                    | Prevent State Updates After Unmount
                    |--------------------------------------------------------------------------
                    */

                    if (!mounted) {
                        return;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Restore User
                    |--------------------------------------------------------------------------
                    */

                    setUser(user);

                    /*
                    |--------------------------------------------------------------------------
                    | Keep Local Auth State In Sync
                    |--------------------------------------------------------------------------
                    */

                    authStorage.set({
                        accountType:
                            user.accountType,

                        userId:
                            user.id,

                        role:
                            user.role,
                    });
                } catch {
                    /*
                    |--------------------------------------------------------------------------
                    | Session Restoration Failed
                    |--------------------------------------------------------------------------
                    */

                    if (!mounted) {
                        return;
                    }

                    authStorage.clear();

                    tokenStorage.clear();

                    clearAuth();
                } finally {
                    /*
                    |--------------------------------------------------------------------------
                    | Finish Loading
                    |--------------------------------------------------------------------------
                    */

                    if (mounted) {
                        setLoading(false);
                    }
                }
            };

        void restoreSession();

        /*
        |--------------------------------------------------------------------------
        | Cleanup
        |--------------------------------------------------------------------------
        */

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