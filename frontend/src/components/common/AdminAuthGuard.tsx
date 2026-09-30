"use client";

import {
    useEffect,
    type ReactNode,
} from "react";

import {
    useRouter,
} from "next/navigation";

import {
    useAuthStore,
} from "@/stores/auth.store";

import {
    getLoginRouteForAccount,
} from "@/lib/auth/auth-redirect";

interface AdminAuthGuardProps {
    children: ReactNode;
}

export function AdminAuthGuard({
    children,
}: AdminAuthGuardProps) {
    const router =
        useRouter();

    const user =
        useAuthStore(
            (state) => state.user,
        );

    const isAuthenticated =
        useAuthStore(
            (state) =>
                state.isAuthenticated,
        );

    const isLoading =
        useAuthStore(
            (state) => state.isLoading,
        );

    useEffect(() => {
        if (isLoading) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Not Authenticated
        |--------------------------------------------------------------------------
        */

        if (
            !isAuthenticated ||
            !user
        ) {
            router.replace(
                "/admin/login",
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Account Type
        |--------------------------------------------------------------------------
        */

        if (
            user.accountType !== "OWNER" &&
            user.accountType !== "ADMIN"
        ) {
            router.replace(
                getLoginRouteForAccount(
                    user.accountType,
                ),
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | OWNER Secret Verification
        |--------------------------------------------------------------------------
        |
        | OWNER and ADMIN share the administration panel.
        |
        | OWNER must complete the second authentication step before
        | accessing the administration panel.
        |
        */

        if (
            user.accountType === "OWNER" &&
            user.secretVerified !== true
        ) {
            router.replace(
                "/owner/verify-secret",
            );

            return;
        }

    }, [
        isAuthenticated,
        isLoading,
        router,
        user,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Loading / Unauthenticated
    |--------------------------------------------------------------------------
    */

    if (
        isLoading ||
        !isAuthenticated ||
        !user
    ) {
        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Account Type Guard
    |--------------------------------------------------------------------------
    */

    if (
        user.accountType !== "OWNER" &&
        user.accountType !== "ADMIN"
    ) {
        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | OWNER Secret Guard
    |--------------------------------------------------------------------------
    */

    if (
        user.accountType === "OWNER" &&
        user.secretVerified !== true
    ) {
        return null;
    }

    return children;
}