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
    canAccessRoute,
} from "@/lib/auth/route-access";

import {
    getLoginRouteForAccount,
} from "@/lib/auth/auth-redirect";

import type {
    AuthAccountType,
} from "@/types/auth";

interface AuthGuardProps {
    children: ReactNode;

    accountType: AuthAccountType;

    pathname: string;
}

export function AuthGuard({
    children,
    accountType,
    pathname,
}: AuthGuardProps) {
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

        if (
            !isAuthenticated ||
            !user
        ) {
            router.replace(
                getLoginRouteForAccount(
                    accountType,
                ),
            );

            return;
        }

        if (
            user.accountType !==
            accountType
        ) {
            router.replace(
                getLoginRouteForAccount(
                    user.accountType,
                ),
            );

            return;
        }

        if (
            !canAccessRoute(
                accountType,
                pathname,
            )
        ) {
            router.replace(
                getLoginRouteForAccount(
                    accountType,
                ),
            );
        }
    }, [
        accountType,
        isAuthenticated,
        isLoading,
        pathname,
        router,
        user,
    ]);

    if (
        isLoading ||
        !isAuthenticated ||
        !user
    ) {
        return null;
    }

    if (
        user.accountType !==
        accountType
    ) {
        return null;
    }

    return children;
}