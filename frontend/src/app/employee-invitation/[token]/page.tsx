"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    KeyRound,
    Loader2,
    LogIn,
    Mail,
    Phone,
    ShieldCheck,
    UserCheck,
    XCircle,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { employeeInvitationsApi } from "@/services/api/employee-invitations.api";

import type {
    EmployeeInvitation,
    AcceptEmployeeInvitationResult,
} from "@/features/invitations/invitation.types";

interface EmployeeInvitationPageProps {
    params: Promise<{
        token: string;
    }>;
}

type PageState =
    | "loading"
    | "valid"
    | "accepting"
    | "accepted"
    | "invalid"
    | "expired"
    | "revoked"
    | "error";

type VerificationChannel = "EMAIL" | "PHONE";

function formatDate(value?: string): string {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function getRoleName(
    invitation: EmployeeInvitation,
): string {
    if (
        invitation.roleId &&
        typeof invitation.roleId === "object"
    ) {
        return (
            invitation.roleId.name ||
            invitation.roleId.slug ||
            "Employee"
        );
    }

    return "Employee";
}

function getErrorMessage(error: unknown): string {
    if (
        error &&
        typeof error === "object" &&
        "response" in error
    ) {
        const response = (
            error as {
                response?: {
                    data?: {
                        message?: string;
                    };
                };
            }
        ).response;

        if (
            response?.data?.message
        ) {
            return response.data.message;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong. Please try again.";
}

function getErrorCode(error: unknown): string {
    if (
        error &&
        typeof error === "object" &&
        "response" in error
    ) {
        const response = (
            error as {
                response?: {
                    data?: {
                        code?: string;
                    };
                };
            }
        ).response;

        return response?.data?.code ?? "";
    }

    return "";
}

export default function EmployeeInvitationPage({
    params,
}: EmployeeInvitationPageProps) {
    const router = useRouter();

    const [token, setToken] =
        useState("");

    const [invitation, setInvitation] =
        useState<EmployeeInvitation | null>(
            null,
        );

    const [pageState, setPageState] =
        useState<PageState>("loading");

    const [errorMessage, setErrorMessage] =
        useState("");

    const [acceptedResult, setAcceptedResult] =
        useState<AcceptEmployeeInvitationResult | null>(
            null,
        );

    const [remainingSeconds, setRemainingSeconds] =
        useState<number | null>(null);
    const visiblePageState =
        pageState === "valid" && remainingSeconds === 0
            ? "expired"
            : pageState;

    const [verificationChannel, setVerificationChannel] =
        useState<VerificationChannel>("EMAIL");

    const [verificationCode, setVerificationCode] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [otpSentChannel, setOtpSentChannel] =
        useState<VerificationChannel | null>(null);

    const [sendingOtp, setSendingOtp] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | Resolve Route Token
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let active = true;

        void params.then((resolvedParams) => {
            if (!active) {
                return;
            }

            setToken(
                decodeURIComponent(
                    resolvedParams.token,
                ),
            );
        });

        return () => {
            active = false;
        };
    }, [params]);

    /*
    |--------------------------------------------------------------------------
    | Validate Invitation
    |--------------------------------------------------------------------------
    */

    const validateInvitation =
        useCallback(
            async (invitationToken: string) => {
                try {
                    const result =
                        await employeeInvitationsApi.validateToken(
                            invitationToken,
                        );

                    if (
                        result.status !==
                        "PENDING"
                    ) {
                        if (
                            result.status ===
                            "EXPIRED"
                        ) {
                            setPageState(
                                "expired",
                            );
                            return;
                        }

                        if (
                            result.status ===
                            "REVOKED"
                        ) {
                            setPageState(
                                "revoked",
                            );
                            return;
                        }

                        setPageState(
                            "invalid",
                        );
                        return;
                    }

                    const expiresAt =
                        new Date(
                            result.expiresAt,
                        ).getTime();

                    if (
                        Number.isNaN(
                            expiresAt,
                        ) ||
                        expiresAt <=
                            Date.now()
                    ) {
                        setPageState(
                            "expired",
                        );
                        return;
                    }

                    setInvitation(
                        result,
                    );
                    setErrorMessage("");

                    setRemainingSeconds(
                        Math.max(
                            0,
                            Math.floor(
                                (
                                    expiresAt -
                                    Date.now()
                                ) /
                                    1000,
                            ),
                        ),
                    );

                    setPageState(
                        "valid",
                    );
                } catch (error) {
                    const code =
                        getErrorCode(
                            error,
                        );

                    const message =
                        getErrorMessage(
                            error,
                        );

                    if (
                        code ===
                            "INVITATION_EXPIRED" ||
                        message
                            .toLowerCase()
                            .includes(
                                "expired",
                            )
                    ) {
                        setPageState(
                            "expired",
                        );
                        return;
                    }

                    if (
                        code ===
                            "INVITATION_NOT_PENDING"
                    ) {
                        setPageState(
                            "invalid",
                        );
                        return;
                    }

                    if (
                        message
                            .toLowerCase()
                            .includes(
                                "revoked",
                            )
                    ) {
                        setPageState(
                            "revoked",
                        );
                        return;
                    }

                    setErrorMessage(
                        message,
                    );

                    setPageState(
                        "error",
                    );
                }
            },
            [],
        );

    useEffect(() => {
        if (!token) {
            return;
        }

        void validateInvitation(
            token,
        );
    }, [
        token,
        validateInvitation,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Expiration Countdown
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (
            pageState !== "valid" ||
            remainingSeconds === null
        ) {
            return;
        }

        if (remainingSeconds <= 0) {
            return;
        }

        const timer =
            window.setInterval(() => {
                setRemainingSeconds(
                    (current) => {
                        if (
                            current === null ||
                            current <= 1
                        ) {
                            window.clearInterval(
                                timer,
                            );

                            return 0;
                        }

                        return current - 1;
                    },
                );
            }, 1000);

        return () => {
            window.clearInterval(
                timer,
            );
        };
    }, [
        pageState,
        remainingSeconds,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Accept Invitation
    |--------------------------------------------------------------------------
    */

    const handleSendCode =
        async () => {
            if (!token || !invitation || sendingOtp) {
                return;
            }

            setSendingOtp(true);
            setErrorMessage("");

            try {
                await employeeInvitationsApi.requestOtp({
                    token,
                    channel: verificationChannel,
                });
                setOtpSentChannel(verificationChannel);
                setVerificationCode("");
            } catch (error) {
                setErrorMessage(
                    getErrorMessage(error),
                );
            } finally {
                setSendingOtp(false);
            }
        };

    const handleAccept =
        async () => {
            if (
                !token ||
                !invitation ||
                visiblePageState !== "valid"
            ) {
                return;
            }

            if (!otpSentChannel || otpSentChannel !== verificationChannel) {
                setErrorMessage(
                    "Send a verification code to your selected contact method first.",
                );
                return;
            }

            if (password.length < 8) {
                setErrorMessage(
                    "Password must be at least 8 characters.",
                );
                return;
            }

            if (password !== confirmPassword) {
                setErrorMessage(
                    "Passwords do not match.",
                );
                return;
            }

            setPageState(
                "accepting",
            );

            setErrorMessage("");

            try {
                const result =
                    await employeeInvitationsApi.accept({
                        token,
                        channel: verificationChannel,
                        code: verificationCode,
                        password,
                    });

                setAcceptedResult(
                    result,
                );

                setPageState(
                    "accepted",
                );
                router.replace(
                    `/employee/login?email=${encodeURIComponent(result.email)}`,
                );
            } catch (error) {
                const code =
                    getErrorCode(
                        error,
                    );

                const message =
                    getErrorMessage(
                        error,
                    );

                if (
                    code ===
                        "INVITATION_EXPIRED" ||
                    message
                        .toLowerCase()
                        .includes(
                            "expired",
                        )
                ) {
                    setPageState(
                        "expired",
                    );
                    return;
                }

                if (
                    code ===
                        "INVITATION_ALREADY_PROCESSED"
                ) {
                    setErrorMessage(
                        "This invitation has already been processed.",
                    );

                    setPageState(
                        "invalid",
                    );
                    return;
                }

                if (
                    code ===
                        "APPLICANT_ALREADY_EMPLOYEE"
                ) {
                    setErrorMessage(
                        "This user is already registered as an employee.",
                    );

                    setPageState(
                        "invalid",
                    );
                    return;
                }

                setErrorMessage(
                    message,
                );

                setPageState(
                    "valid",
                );
            }
        };

    const countdownText =
        useMemo(() => {
            if (
                remainingSeconds === null
            ) {
                return "Checking expiration...";
            }

            const hours =
                Math.floor(
                    remainingSeconds /
                        3600,
                );

            const minutes =
                Math.floor(
                    (
                        remainingSeconds %
                        3600
                    ) /
                        60,
                );

            const seconds =
                remainingSeconds %
                60;

            if (hours > 0) {
                return `${hours}h ${minutes}m remaining`;
            }

            if (minutes > 0) {
                return `${minutes}m ${seconds}s remaining`;
            }

            return `${seconds}s remaining`;
        }, [
            remainingSeconds,
        ]);

    /*
    |--------------------------------------------------------------------------
    | Shared Layout
    |--------------------------------------------------------------------------
    */

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
            <div className="w-full max-w-xl">
                <div className="mb-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                        <UserCheck className="h-7 w-7" />
                    </div>

                    <h1 className="mt-5 text-2xl font-bold tracking-tight">
                        NOPTRIX Employee Invitation
                    </h1>

                    <p className="mt-2 text-sm text-muted-foreground">
                        Secure employee onboarding
                    </p>
                </div>

                {visiblePageState ===
                    "loading" && (
                    <div className="rounded-xl border bg-background p-8 text-center shadow-sm">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />

                        <h2 className="mt-4 font-semibold">
                            Validating invitation
                        </h2>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Please wait while we verify your
                            invitation.
                        </p>
                    </div>
                )}

                {visiblePageState ===
                    "valid" &&
                    invitation && (
                    <div className="rounded-xl border bg-background shadow-sm">
                        <div className="border-b p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                    <ShieldCheck className="h-5 w-5 text-green-700" />
                                </div>

                                <div>
                                    <h2 className="font-semibold">
                                        You&apos;re invited
                                    </h2>

                                    <p className="text-sm text-muted-foreground">
                                        Your employee invitation is
                                        valid.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5 p-6">
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="mb-3 text-xs text-muted-foreground">
                                    Your details from the application
                                </p>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="text-sm">
                                        <span className="mb-1 block text-muted-foreground">
                                            Name
                                        </span>
                                        <input
                                            value={invitation.name}
                                            readOnly
                                            className="w-full rounded-md border bg-background px-3 py-2 text-foreground"
                                        />
                                    </label>

                                    <label className="text-sm">
                                        <span className="mb-1 block text-muted-foreground">
                                            Email
                                        </span>
                                        <input
                                            value={invitation.email}
                                            readOnly
                                            className="w-full rounded-md border bg-background px-3 py-2 text-foreground"
                                        />
                                    </label>

                                    <label className="text-sm sm:col-span-2">
                                        <span className="mb-1 block text-muted-foreground">
                                            Phone
                                        </span>
                                        <input
                                            value={invitation.phone ?? ""}
                                            readOnly
                                            placeholder="No phone number on the application"
                                            className="w-full rounded-md border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border p-4">
                                    <p className="text-xs text-muted-foreground">
                                        Employee Role
                                    </p>

                                    <p className="mt-1 font-medium">
                                        {getRoleName(
                                            invitation,
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-lg border p-4">
                                    <p className="text-xs text-muted-foreground">
                                        Invitation Status
                                    </p>

                                    <p className="mt-1 font-medium text-green-700">
                                        PENDING
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                                <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />

                                <div>
                                    <p className="font-medium">
                                        Invitation expiration
                                    </p>

                                    <p className="mt-1">
                                        {countdownText}
                                    </p>

                                    <p className="mt-1 text-xs opacity-80">
                                        Expires:{" "}
                                        {formatDate(
                                            invitation.expiresAt,
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                                Set a password and verify either your
                                email or phone number to activate your
                                employee account.
                            </div>

                            {errorMessage && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                                >
                                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <div className="space-y-4 rounded-lg border p-4">
                                <div>
                                    <p className="text-sm font-medium">
                                        Verify with
                                    </p>
                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setVerificationChannel("EMAIL");
                                                setOtpSentChannel(null);
                                                setVerificationCode("");
                                                setErrorMessage("");
                                            }}
                                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                                                verificationChannel === "EMAIL"
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "hover:bg-muted"
                                            }`}
                                        >
                                            <Mail className="h-4 w-4" />
                                            Email
                                        </button>

                                        <button
                                            type="button"
                                            disabled={!invitation.phone}
                                            onClick={() => {
                                                setVerificationChannel("PHONE");
                                                setOtpSentChannel(null);
                                                setVerificationCode("");
                                                setErrorMessage("");
                                            }}
                                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                                                verificationChannel === "PHONE"
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "hover:bg-muted"
                                            }`}
                                        >
                                            <Phone className="h-4 w-4" />
                                            Phone
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void handleSendCode()}
                                    disabled={sendingOtp}
                                    className="flex h-10 w-full items-center justify-center rounded-md border px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {sendingOtp
                                        ? "Sending verification code..."
                                        : otpSentChannel === verificationChannel
                                          ? "Resend verification code"
                                          : `Send code to ${
                                                verificationChannel === "EMAIL"
                                                    ? invitation.email
                                                    : invitation.phone
                                            }`}
                                </button>

                                {otpSentChannel === verificationChannel && (
                                    <label className="block text-sm">
                                        <span className="mb-1 block text-muted-foreground">
                                            6-digit verification code
                                        </span>
                                        <input
                                            value={verificationCode}
                                            onChange={(event) =>
                                                setVerificationCode(
                                                    event.target.value
                                                        .replace(/\D/g, "")
                                                        .slice(0, 6),
                                                )
                                            }
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            required
                                            className="w-full rounded-md border bg-background px-3 py-2 text-foreground"
                                        />
                                    </label>
                                )}

                                <label className="block text-sm">
                                    <span className="mb-1 block text-muted-foreground">
                                        New password
                                    </span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        autoComplete="new-password"
                                        minLength={8}
                                        maxLength={128}
                                        required
                                        className="w-full rounded-md border bg-background px-3 py-2 text-foreground"
                                    />
                                </label>

                                <label className="block text-sm">
                                    <span className="mb-1 block text-muted-foreground">
                                        Confirm new password
                                    </span>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(event.target.value)
                                        }
                                        autoComplete="new-password"
                                        minLength={8}
                                        maxLength={128}
                                        required
                                        className="w-full rounded-md border bg-background px-3 py-2 text-foreground"
                                    />
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    void handleAccept()
                                }
                                disabled={
                                    visiblePageState !== "valid" ||
                                    !otpSentChannel ||
                                    otpSentChannel !== verificationChannel ||
                                    verificationCode.length !== 6 ||
                                    password.length < 8 ||
                                    password !== confirmPassword
                                }
                                className="flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <KeyRound className="mr-2 h-4 w-4" />
                                Verify and Accept Invitation
                            </button>
                        </div>
                    </div>
                )}

                {visiblePageState ===
                    "accepting" && (
                    <div className="rounded-xl border bg-background p-8 text-center shadow-sm">
                        <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" />

                        <h2 className="mt-4 text-lg font-semibold">
                            Creating your employee profile
                        </h2>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Please do not close this page.
                        </p>
                    </div>
                )}

                {visiblePageState ===
                    "accepted" &&
                    acceptedResult && (
                    <div className="rounded-xl border bg-background p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-8 w-8 text-green-700" />
                        </div>

                        <h2 className="mt-5 text-xl font-semibold">
                            Welcome to NOPTRIX
                        </h2>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Your employee profile has been created
                            successfully.
                        </p>

                        <div className="mt-6 space-y-3 rounded-lg bg-muted/40 p-4 text-left text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Employee ID
                                </span>

                                <span className="font-medium">
                                    {
                                        acceptedResult.employeeId
                                    }
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Role
                                </span>

                                <span className="font-medium">
                                    {
                                        acceptedResult.role
                                    }
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Email
                                </span>

                                <span className="break-all font-medium">
                                    {
                                        acceptedResult.email
                                    }
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                router.push(
                                    "/admin/login",
                                )
                            }
                            className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                        >
                            <LogIn className="mr-2 h-4 w-4" />
                            Continue to Login
                        </button>
                    </div>
                )}

                {visiblePageState ===
                    "expired" && (
                    <StatusCard
                        icon={
                            <Clock3 className="h-8 w-8 text-amber-600" />
                        }
                        title="Invitation Expired"
                        description="This employee invitation has expired and can no longer be accepted."
                        tone="warning"
                        action={
                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/",
                                    )
                                }
                                className="mt-6 flex h-11 w-full items-center justify-center rounded-md border px-4 text-sm font-medium transition hover:bg-muted"
                            >
                                Return Home
                            </button>
                        }
                    />
                )}

                {visiblePageState ===
                    "revoked" && (
                    <StatusCard
                        icon={
                            <XCircle className="h-8 w-8 text-red-600" />
                        }
                        title="Invitation Revoked"
                        description="This employee invitation has been revoked and is no longer available."
                        tone="danger"
                    />
                )}

                {visiblePageState ===
                    "invalid" && (
                    <StatusCard
                        icon={
                            <XCircle className="h-8 w-8 text-red-600" />
                        }
                        title="Invalid Invitation"
                        description={
                            errorMessage ||
                            "This employee invitation is no longer valid."
                        }
                        tone="danger"
                    />
                )}

                {visiblePageState ===
                    "error" && (
                    <StatusCard
                        icon={
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        }
                        title="Unable to Process Invitation"
                        description={
                            errorMessage ||
                            "We could not process this invitation."
                        }
                        tone="danger"
                        action={
                            token ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        void validateInvitation(
                                            token,
                                        )
                                    }
                                    className="mt-6 flex h-11 w-full items-center justify-center rounded-md border px-4 text-sm font-medium transition hover:bg-muted"
                                >
                                    Try Again
                                </button>
                            ) : undefined
                        }
                    />
                )}
            </div>
        </main>
    );
}

interface StatusCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    tone: "warning" | "danger";
    action?: React.ReactNode;
}

function StatusCard({
    icon,
    title,
    description,
    action,
}: StatusCardProps) {
    return (
        <div className="rounded-xl border bg-background p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                {icon}
            </div>

            <h2 className="mt-5 text-xl font-semibold">
                {title}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {description}
            </p>

            {action}
        </div>
    );
}
