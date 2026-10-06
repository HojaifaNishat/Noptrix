"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import {
    Mail,
    Phone,
    ShieldCheck,
    UserRound,
    Trash2,
} from "lucide-react";

import {
    adminProfileApi,
} from "@/services/api/admin-profile.api";

import type {
    AdminProfile,
} from "@/types/profile";

import {
    Badge,
    Card,
} from "@/components/ui";

import ImageUploader from "@/components/common/ImageUploader";

import {
    LoadingSpinner,
} from "@/components/loading/LoadingSpinner";

import {
    useAuthStore,
} from "@/stores/auth.store";


export default function AdminProfilePage() {

    const router =
        useRouter();

    const accountType =
        useAuthStore(
            (state) =>
                state.user?.accountType,
        );

    const updateUser =
        useAuthStore(
            (state) =>
                state.updateUser,
        );

    const [
        profile,
        setProfile,
    ] =
        useState<AdminProfile | null>(
            null,
        );

    const [
        selectedAvatar,
        setSelectedAvatar,
    ] =
        useState<File | null>(
            null,
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        avatarUploading,
        setAvatarUploading,
    ] =
        useState(false);

    const [
        avatarRemoving,
        setAvatarRemoving,
    ] =
        useState(false);

    const [
        error,
        setError,
    ] =
        useState<string | null>(
            null,
        );

    const [
        avatarError,
        setAvatarError,
    ] =
        useState<string | null>(
            null,
        );


    useEffect(() => {

        let mounted = true;

        const loadProfile =
            async () => {

                if (
                    accountType ===
                    "OWNER"
                ) {
                    router.replace(
                        "/owner/profile",
                    );
                    return;
                }

                try {

                    setError(null);

                    const data =
                        await adminProfileApi
                            .getMyProfile();

                    if (mounted) {
                        setProfile(
                            data,
                        );
                    }

                } catch {

                    if (mounted) {
                        setError(
                            "Unable to load your profile.",
                        );
                    }

                } finally {

                    if (mounted) {
                        setLoading(
                            false,
                        );
                    }
                }
            };

        void loadProfile();

        return () => {
            mounted = false;
        };

    }, [
        accountType,
        router,
    ]);


    const handleAvatarChange =
        async (
            file: File | null,
        ) => {

            setAvatarError(null);

            if (!file) {
                setSelectedAvatar(null);
                return;
            }

            setSelectedAvatar(
                file,
            );

            try {

                setAvatarUploading(
                    true,
                );

                const avatar =
                    await adminProfileApi
                        .uploadAvatar(
                            file,
                        );

                setProfile(
                    (current) =>
                        current
                            ? {
                                  ...current,
                                  avatarUrl:
                                      avatar.avatarUrl,
                                  avatarPublicId:
                                      avatar.avatarPublicId,
                              }
                            : current,
                );

                updateUser({
                    avatarUrl:
                        avatar.avatarUrl,
                });

                setSelectedAvatar(
                    null,
                );

            } catch {

                setAvatarError(
                    "Unable to upload profile picture.",
                );

            } finally {

                setAvatarUploading(
                    false,
                );
            }
        };


    const handleAvatarRemove =
        async () => {

            if (
                !profile?.avatarUrl
            ) {
                return;
            }

            try {

                setAvatarError(null);

                setAvatarRemoving(
                    true,
                );

                await adminProfileApi
                    .removeAvatar();

                setProfile(
                    (current) =>
                        current
                            ? {
                                  ...current,
                                  avatarUrl:
                                      undefined,
                                  avatarPublicId:
                                      undefined,
                              }
                            : current,
                );

                updateUser({
                    avatarUrl:
                        undefined,
                });

                setSelectedAvatar(
                    null,
                );

            } catch {

                setAvatarError(
                    "Unable to remove profile picture.",
                );

            } finally {

                setAvatarRemoving(
                    false,
                );
            }
        };


    if (
        accountType ===
        "OWNER"
    ) {
        return null;
    }


    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }


    if (
        error ||
        !profile
    ) {
        return (
            <main className="p-6">
                <Card>
                    <div className="p-6 text-sm text-red-600">
                        {
                            error ??
                            "Profile not found."
                        }
                    </div>
                </Card>
            </main>
        );
    }


    return (
        <main className="space-y-6 p-6">

            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    My Profile
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Manage and review your administrator account information.
                </p>
            </div>


            <div className="grid gap-6 lg:grid-cols-3">

                <Card className="lg:col-span-2">

                    <div className="border-b border-gray-100 p-6">

                        <div className="flex items-center gap-4">

                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">

                                {profile.avatarUrl ? (
                                    <img
                                        src={
                                            profile.avatarUrl
                                        }
                                        alt={
                                            profile.name
                                        }
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <UserRound className="h-8 w-8 text-gray-500" />
                                )}

                            </div>


                            <div className="min-w-0">

                                <h2 className="truncate text-lg font-semibold text-gray-900">
                                    {
                                        profile.name
                                    }
                                </h2>

                                <div className="mt-1 flex flex-wrap items-center gap-2">

                                    <Badge>
                                        {
                                            profile.role.name
                                        }
                                    </Badge>

                                    <Badge>
                                        {
                                            profile.adminStatus
                                        }
                                    </Badge>

                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="space-y-6 p-6">

                        <div>

                            <h3 className="text-sm font-semibold text-gray-900">
                                Profile Picture
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Upload a professional profile picture for your administrator account.
                            </p>

                        </div>


                        <ImageUploader
                            value={
                                selectedAvatar
                            }
                            previewUrl={
                                selectedAvatar
                                    ? null
                                    : profile.avatarUrl ??
                                      null
                            }
                            onChange={
                                handleAvatarChange
                            }
                            onRemove={
                                handleAvatarRemove
                            }
                            maxSizeMB={10}
                            disabled={
                                avatarUploading ||
                                avatarRemoving
                            }
                            label="Admin Profile Picture"
                            description="JPEG, PNG, WebP, GIF or AVIF up to 10MB."
                        />


                        {avatarError && (
                            <p className="text-sm text-red-600">
                                {
                                    avatarError
                                }
                            </p>
                        )}


                        {profile.avatarUrl && (
                            <button
                                type="button"
                                onClick={
                                    handleAvatarRemove
                                }
                                disabled={
                                    avatarRemoving ||
                                    avatarUploading
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                {avatarRemoving
                                    ? "Removing..."
                                    : "Remove picture"}
                            </button>
                        )}

                    </div>


                    <div className="grid gap-5 border-t border-gray-100 p-6 sm:grid-cols-2">

                        <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Email
                            </p>

                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-900">

                                <Mail className="h-4 w-4 text-gray-400" />

                                {
                                    profile.email ??
                                    "Not provided"
                                }

                            </div>

                        </div>


                        <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Phone
                            </p>

                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-900">

                                <Phone className="h-4 w-4 text-gray-400" />

                                {
                                    profile.phone ??
                                    "Not provided"
                                }

                            </div>

                        </div>


                        <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                User Status
                            </p>

                            <p className="mt-2 text-sm font-medium text-gray-900">
                                {
                                    profile.userStatus
                                }
                            </p>

                        </div>


                        <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Account Created
                            </p>

                            <p className="mt-2 text-sm text-gray-900">
                                {
                                    new Date(
                                        profile.createdAt,
                                    ).toLocaleDateString()
                                }
                            </p>

                        </div>

                    </div>

                </Card>


                <Card>

                    <div className="border-b border-gray-100 p-6">

                        <div className="flex items-center gap-3">

                            <ShieldCheck className="h-5 w-5 text-gray-600" />

                            <h2 className="font-semibold text-gray-900">
                                Role & Access
                            </h2>

                        </div>

                    </div>


                    <div className="space-y-5 p-6">

                        <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Role
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {
                                    profile.role.name
                                }
                            </p>

                        </div>


                        <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Slug
                            </p>

                            <p className="mt-1 text-sm text-gray-700">
                                {
                                    profile.role.slug
                                }
                            </p>

                        </div>


                        {profile.role.description && (
                            <div>

                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Description
                                </p>

                                <p className="mt-1 text-sm leading-6 text-gray-600">
                                    {
                                        profile.role.description
                                    }
                                </p>

                            </div>
                        )}

                    </div>

                </Card>

            </div>

        </main>
    );
}
