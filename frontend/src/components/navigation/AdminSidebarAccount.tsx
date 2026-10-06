"use client";

import Link from "next/link";

import {
    CheckCircle2,
    ShieldCheck,
    UserRound,
} from "lucide-react";

import {
    useEffect,
} from "react";

import { useAuthStore } from "@/stores/auth.store";

import {
    adminProfileApi,
} from "@/services/api/admin-profile.api";

import {
    ownerProfileApi,
} from "@/services/api/owner-profile.api";


/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface AdminSidebarAccountProps {
    collapsed: boolean;
}


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getInitial(
    name?: string,
    email?: string,
): string {
    const value =
        name?.trim() ||
        email?.trim() ||
        "A";

    return value
        .charAt(0)
        .toUpperCase();
}


function getAccountLabel(
    accountType?: string,
): string {
    switch (accountType) {
        case "OWNER":
            return "Owner";

        case "ADMIN":
            return "Administrator";

        default:
            return (
                accountType ||
                "Account"
            );
    }
}


/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function AdminSidebarAccount({
    collapsed,
}: AdminSidebarAccountProps) {

    const user =
        useAuthStore(
            (state) => state.user,
        );

    const updateUser =
        useAuthStore(
            (state) => state.updateUser,
        );

    const accountType = user?.accountType;
    const avatarUrl = user?.avatarUrl;

    useEffect(() => {
        if (
            avatarUrl ||
            (accountType !== "OWNER" &&
                accountType !== "ADMIN")
        ) {
            return;
        }

        let mounted = true;

        const loadProfileImage = async () => {
            try {
                const profile =
                    accountType === "OWNER"
                        ? await ownerProfileApi.getMyProfile()
                        : await adminProfileApi.getMyProfile();

                if (mounted) {
                    updateUser({
                        name: profile.name,
                        phone: profile.phone,
                        avatarUrl: profile.avatarUrl,
                        ...(profile.email
                            ? { email: profile.email }
                            : {}),
                    });
                }
            } catch (error) {
                console.error(
                    "Unable to load sidebar profile details.",
                    error,
                );
            }
        };

        void loadProfileImage();

        return () => {
            mounted = false;
        };
    }, [
        accountType,
        avatarUrl,
        updateUser,
    ]);

    if (!user) {
        return null;
    }

    const initial =
        getInitial(
            user.name,
            user.email,
        );

    const accountLabel =
        getAccountLabel(
            user.accountType,
        );

    const profileHref =
        user.accountType === "OWNER"
            ? "/owner/profile"
            : "/admin/profile";


    /*
    |--------------------------------------------------------------------------
    | Avatar
    |--------------------------------------------------------------------------
    */

    const avatar = (
        <div
            className="
                flex h-11 w-11 shrink-0
                items-center justify-center
                overflow-hidden
                rounded-full
                bg-primary/10
                text-base font-semibold
                text-primary
                ring-1 ring-primary/20
            "
        >
            {user.avatarUrl ? (
                <img
                    src={user.avatarUrl}
                    alt={
                        user.name
                            ? `${user.name} profile picture`
                            : "Profile picture"
                    }
                    className="
                        h-full
                        w-full
                        object-cover
                    "
                />
            ) : (
                initial
            )}
        </div>
    );


    /*
    |--------------------------------------------------------------------------
    | Collapsed Sidebar
    |--------------------------------------------------------------------------
    */

    if (collapsed) {
        return (
            <div className="flex justify-center px-2 py-3">
                <Link
                    href={profileHref}
                    className="
                        flex h-10 w-10
                        items-center justify-center
                        overflow-hidden
                        rounded-full
                        bg-primary/10
                        text-sm font-semibold
                        text-primary
                        ring-1 ring-primary/20
                        transition-colors
                        hover:bg-primary/15
                    "
                    title="My Profile"
                    aria-label="My Profile"
                >
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={
                                user.name
                                    ? `${user.name} profile picture`
                                    : "Profile picture"
                            }
                            className="
                                h-full
                                w-full
                                object-cover
                            "
                        />
                    ) : (
                        initial
                    )}
                </Link>
            </div>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Expanded Sidebar
    |--------------------------------------------------------------------------
    */

    return (
        <div className="border-t border-border px-3 py-3">
            <Link
                href={profileHref}
                className="
                    block rounded-xl
                    border border-border
                    bg-card
                    p-3
                    transition-colors
                    hover:bg-accent/50
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary/30
                "
                aria-label="Open my profile"
            >
                <div className="flex items-start gap-3">

                    {avatar}

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">

                            <p className="truncate text-sm font-semibold text-foreground">
                                {user.name ||
                                    accountLabel}
                            </p>

                            {user.isVerified && (
                                <CheckCircle2
                                    className="
                                        h-3.5 w-3.5
                                        shrink-0
                                        text-emerald-500
                                    "
                                    aria-label="Verified account"
                                />
                            )}
                        </div>

                        <p className="
                            mt-0.5
                            text-xs
                            font-medium
                            text-muted-foreground
                        ">
                            {accountLabel}
                        </p>
                    </div>
                </div>


                <div className="mt-3 space-y-2">

                    <div className="
                        flex items-center gap-2
                        text-xs
                        text-muted-foreground
                    ">
                        <UserRound
                            className="
                                h-3.5 w-3.5
                                shrink-0
                            "
                        />

                        <span className="truncate">
                            {user.email}
                        </span>
                    </div>


                    {user.phone && (
                        <div className="
                            flex items-center gap-2
                            text-xs
                            text-muted-foreground
                        ">
                            <span className="
                                w-3.5
                                shrink-0
                                text-center
                            ">
                                ☎
                            </span>

                            <span className="truncate">
                                {user.phone}
                            </span>
                        </div>
                    )}


                    {user.role && (
                        <div className="
                            flex items-center gap-2
                            text-xs
                            text-muted-foreground
                        ">
                            <ShieldCheck
                                className="
                                    h-3.5 w-3.5
                                    shrink-0
                                "
                            />

                            <span className="truncate">
                                {user.role}
                            </span>
                        </div>
                    )}


                    {user.accountType === "OWNER" &&
                        user.secretVerified && (
                            <div className="
                                flex items-center gap-2
                                rounded-lg
                                border
                                border-emerald-500/20
                                bg-emerald-500/5
                                px-2.5 py-2
                                text-xs
                                font-medium
                                text-emerald-600
                                dark:text-emerald-400
                            ">
                                <ShieldCheck
                                    className="
                                        h-3.5 w-3.5
                                        shrink-0
                                    "
                                />

                                <span>
                                    Secret verified
                                </span>
                            </div>
                        )}
                </div>
            </Link>
        </div>
    );
}
