"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    CheckCircle2,
    ImagePlus,
    Mail,
    Phone,
    ShieldCheck,
    UserRound,
} from "lucide-react";

import {
    ownerProfileApi,
} from "@/services/api/owner-profile.api";

import type {
    OwnerProfile,
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


/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function OwnerProfilePage() {

    const updateUser =
        useAuthStore(
            (state) =>
                state.updateUser,
        );

    const [
        profile,
        setProfile,
    ] = useState<OwnerProfile | null>(
        null,
    );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    );

    const [
        selectedAvatar,
        setSelectedAvatar,
    ] = useState<File | null>(
        null,
    );

    const [
        avatarUploading,
        setAvatarUploading,
    ] = useState(false);

    const [
        avatarRemoving,
        setAvatarRemoving,
    ] = useState(false);

    const [
        avatarMessage,
        setAvatarMessage,
    ] = useState<string | null>(
        null,
    );

    const [
        avatarError,
        setAvatarError,
    ] = useState<string | null>(
        null,
    );


    /*
    |--------------------------------------------------------------------------
    | Load profile
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let mounted = true;

        const loadProfile =
            async () => {
                try {
                    setLoading(true);
                    setError(null);

                    const data =
                        await ownerProfileApi.getMyProfile();

                    if (mounted) {
                        setProfile(data);
                    }
                } catch (error) {
                    let message =
                        "Unable to load your profile.";

                    if (
                        typeof error === "object" &&
                        error !== null
                    ) {
                        const axiosError =
                            error as {
                                response?: {
                                    status?: number;
                                    data?: {
                                        message?: string;
                                    };
                                };
                                message?: string;
                            };

                        const response =
                            axiosError.response;

                        if (
                            response?.data?.message
                        ) {
                            message =
                                response.data.message;
                        } else if (
                            response?.status
                        ) {
                            message =
                                `Profile request failed (${response.status}).`;
                        } else if (
                            axiosError.message
                        ) {
                            message =
                                axiosError.message;
                        }
                    } else if (
                        error instanceof Error
                    ) {
                        message = error.message;
                    }

                    if (mounted) {
                        setError(message);
                    }
                } finally {
                    if (mounted) {
                        setLoading(false);
                    }
                }
            };

        void loadProfile();

        return () => {
            mounted = false;
        };
    }, []);


    /*
    |--------------------------------------------------------------------------
    | Avatar select
    |--------------------------------------------------------------------------
    */

    const handleAvatarChange =
        (
            file: File | null,
        ) => {
            setAvatarError(null);
            setAvatarMessage(null);
            setSelectedAvatar(file);
        };


    /*
    |--------------------------------------------------------------------------
    | Upload avatar
    |--------------------------------------------------------------------------
    */

    const handleAvatarUpload =
        async () => {
            if (!selectedAvatar) {
                setAvatarError(
                    "Please select an image first.",
                );

                return;
            }

            try {
                setAvatarUploading(true);
                setAvatarError(null);
                setAvatarMessage(null);

                const avatar =
                    await ownerProfileApi.uploadAvatar(
                        selectedAvatar,
                    );

                setProfile(
                    (current) =>
                        current
                            ? {
                                  ...current,
                                  avatarUrl:
                                      avatar.avatarUrl,
                              }
                            : current,
                );

                updateUser({
                    avatarUrl:
                        avatar.avatarUrl,
                });

                setSelectedAvatar(null);

                setAvatarMessage(
                    "Profile picture updated successfully.",
                );
            } catch {
                setAvatarError(
                    "Unable to update your profile picture.",
                );
            } finally {
                setAvatarUploading(false);
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Remove avatar
    |--------------------------------------------------------------------------
    */

    const handleAvatarRemove =
        async () => {
            /*
             * If the user has only selected a new local
             * image and has not uploaded it yet, simply
             * clear the local selection.
             */
            if (selectedAvatar) {
                setSelectedAvatar(null);
                setAvatarError(null);
                setAvatarMessage(null);

                return;
            }

            /*
             * Nothing exists remotely.
             */
            if (!profile?.avatarUrl) {
                return;
            }

            try {
                setAvatarRemoving(true);
                setAvatarError(null);
                setAvatarMessage(null);

                await ownerProfileApi.removeAvatar();

                setProfile(
                    (current) =>
                        current
                            ? {
                                  ...current,
                                  avatarUrl:
                                      undefined,
                              }
                            : current,
                );

                updateUser({
                    avatarUrl:
                        undefined,
                });

                setAvatarMessage(
                    "Profile picture removed successfully.",
                );
            } catch {
                setAvatarError(
                    "Unable to remove your profile picture.",
                );
            } finally {
                setAvatarRemoving(false);
            }
        };


    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Error
    |--------------------------------------------------------------------------
    */

    if (error || !profile) {
        return (
            <main className="p-6">
                <Card>
                    <div className="p-6 text-sm text-red-600">
                        {error ??
                            "Profile not found."}
                    </div>
                </Card>
            </main>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <main className="space-y-6 p-6">

            {/* ------------------------------------------------------------ */}
            {/* Header */}
            {/* ------------------------------------------------------------ */}

            <div>
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    Owner Profile
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage your owner account, profile picture,
                    and security information.
                </p>
            </div>


            {/* ------------------------------------------------------------ */}
            {/* Profile + Security */}
            {/* ------------------------------------------------------------ */}

            <div className="grid gap-6 lg:grid-cols-3">

                {/* -------------------------------------------------------- */}
                {/* Main profile */}
                {/* -------------------------------------------------------- */}

                <Card className="lg:col-span-2">

                    <div className="border-b border-slate-200 p-6 dark:border-slate-800">

                        <div className="flex items-center gap-4">

                            {/* Avatar */}
                            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">

                                {profile.avatarUrl ? (
                                    <img
                                        src={
                                            profile.avatarUrl
                                        }
                                        alt={`${profile.name} profile picture`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <UserRound className="h-8 w-8 text-slate-500 dark:text-slate-300" />
                                )}

                            </div>


                            {/* Identity */}
                            <div className="min-w-0">

                                <h2 className="truncate text-lg font-semibold text-slate-800 dark:text-slate-100">
                                    {profile.name}
                                </h2>

                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <Badge>
                                        OWNER
                                    </Badge>

                                    <Badge>
                                        {profile.status}
                                    </Badge>
                                </div>

                            </div>

                        </div>

                    </div>


                    {/* Profile information */}

                    <div className="grid gap-5 p-6 sm:grid-cols-2">

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Email
                            </p>

                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
                                <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />

                                {profile.email ??
                                    "Not provided"}
                            </div>
                        </div>


                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Phone
                            </p>

                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
                                <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500" />

                                {profile.phone ??
                                    "Not provided"}
                            </div>
                        </div>


                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Account Status
                            </p>

                            <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                                {profile.status}
                            </p>
                        </div>


                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Account Created
                            </p>

                            <p className="mt-2 text-sm text-slate-800 dark:text-slate-100">
                                {new Date(
                                    profile.createdAt,
                                ).toLocaleDateString()}
                            </p>
                        </div>

                    </div>

                </Card>


                {/* -------------------------------------------------------- */}
                {/* Security */}
                {/* -------------------------------------------------------- */}

                <Card>

                    <div className="border-b border-slate-200 p-6 dark:border-slate-800">

                        <div className="flex items-center gap-3">

                            <ShieldCheck className="h-5 w-5 text-slate-600 dark:text-slate-300" />

                            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                                Security
                            </h2>

                        </div>

                    </div>


                    <div className="space-y-5 p-6">

                        <div className="flex items-center gap-3">

                            <CheckCircle2 className="h-5 w-5 text-green-600" />

                            <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                    Secret Verification
                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Protected owner access
                                </p>
                            </div>

                        </div>


                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Last Secret Verification
                            </p>

                            <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">
                                {profile.lastSecretVerificationAt
                                    ? new Date(
                                          profile.lastSecretVerificationAt,
                                      ).toLocaleString()
                                    : "Not available"}
                            </p>
                        </div>


                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Last Login
                            </p>

                            <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">
                                {profile.lastLoginAt
                                    ? new Date(
                                          profile.lastLoginAt,
                                      ).toLocaleString()
                                    : "Not available"}
                            </p>
                        </div>

                    </div>

                </Card>

            </div>


            {/* ------------------------------------------------------------ */}
            {/* Profile picture */}
            {/* ------------------------------------------------------------ */}

            <Card>

                <div className="border-b border-slate-200 p-6 dark:border-slate-800">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <ImagePlus className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        </div>

                        <div>
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                                Profile Picture
                            </h2>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Upload a profile picture for your owner account.
                            </p>
                        </div>

                    </div>

                </div>


                <div className="p-6">

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
                        label="Owner profile picture"
                        description="JPEG, PNG, WebP, GIF or AVIF. Maximum 10 MB."
                    />


                    {/* ---------------------------------------------------- */}
                    {/* Save button */}
                    {/* ---------------------------------------------------- */}

                    {selectedAvatar && (
                        <div className="mt-5 flex items-center justify-end">

                            <button
                                type="button"
                                onClick={
                                    handleAvatarUpload
                                }
                                disabled={
                                    avatarUploading
                                }
                                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                            >
                                {avatarUploading
                                    ? "Uploading..."
                                    : "Save Profile Picture"}
                            </button>

                        </div>
                    )}


                    {/* ---------------------------------------------------- */}
                    {/* Success */}
                    {/* ---------------------------------------------------- */}

                    {avatarMessage && (
                        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
                            {avatarMessage}
                        </div>
                    )}


                    {/* ---------------------------------------------------- */}
                    {/* Error */}
                    {/* ---------------------------------------------------- */}

                    {avatarError && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                            {avatarError}
                        </div>
                    )}

                </div>

            </Card>

        </main>
    );
}
