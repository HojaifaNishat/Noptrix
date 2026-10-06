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

interface OwnerAuthGuardProps {
    children: ReactNode;
}

export function OwnerAuthGuard({
    children,
}: OwnerAuthGuardProps) {
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
                "/owner/login",
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Account Type
        |--------------------------------------------------------------------------
        */

        if (
            user.accountType !==
            "OWNER"
        ) {
            router.replace(
                "/admin/login",
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | OWNER Secret Verification
        |--------------------------------------------------------------------------
        |
        | OWNER profile and protected OWNER routes require the
        | second authentication step.
        |
        */

        if (
            user.secretVerified !== true
        ) {
            router.replace(
                "/owner/verify-secret",
            );
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
        user.accountType !==
        "OWNER"
    ) {
        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Secret Verification Guard
    |--------------------------------------------------------------------------
    */

    if (
        user.secretVerified !== true
    ) {
        return null;
    }

    return children;
}
