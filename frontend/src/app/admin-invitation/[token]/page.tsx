"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import {
    adminInvitationsApi,
    type AdminInvitationTarget,
} from "@/services/api/admin-invitations.api";

interface AdminInvitationAcceptPageProps {
    params: Promise<{ token: string }>;
}

function getErrorMessage(error: unknown): string {
    if (
        error &&
        typeof error === "object" &&
        "response" in error
    ) {
        const message = (
            error as { response?: { data?: { message?: string } } }
        ).response?.data?.message;
        if (message) return message;
    }
    return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export default function AdminInvitationAcceptPage({
    params,
}: AdminInvitationAcceptPageProps) {
    const router = useRouter();
    const [token, setToken] = useState("");
    const [invitation, setInvitation] = useState<AdminInvitationTarget | null>(null);
    const [loading, setLoading] = useState(true);
    const [sendingCode, setSendingCode] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [channel, setChannel] = useState<"EMAIL" | "PHONE">("EMAIL");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        void params.then(({ token: routeToken }) => {
            if (active) setToken(decodeURIComponent(routeToken));
        });
        return () => {
            active = false;
        };
    }, [params]);

    useEffect(() => {
        if (!token) return;
        let active = true;
        setLoading(true);
        adminInvitationsApi
            .validateToken(token)
            .then((result) => {
                if (!active) return;
                if (result.status !== "PENDING" || new Date(result.expiresAt).getTime() <= Date.now()) {
                    setError("This admin invitation has expired or has already been processed.");
                    return;
                }
                setInvitation(result);
            })
            .catch((loadError: unknown) => {
                if (active) setError(getErrorMessage(loadError));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [token]);

    const sendCode = async () => {
        if (!token || sendingCode) return;
        setSendingCode(true);
        setError("");
        try {
            await adminInvitationsApi.requestOtp({ token, channel });
            setCodeSent(true);
        } catch (sendError) {
            setError(getErrorMessage(sendError));
        } finally {
            setSendingCode(false);
        }
    };

    const acceptInvitation = async () => {
        if (!token || accepting) return;
        if (!codeSent) {
            setError("Request a verification code first.");
            return;
        }
        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setAccepting(true);
        setError("");
        try {
            const result = await adminInvitationsApi.accept({
                token,
                channel,
                code,
                password,
            });
            router.replace(`/admin/login?email=${encodeURIComponent(result.email)}`);
        } catch (acceptError) {
            setError(getErrorMessage(acceptError));
        } finally {
            setAccepting(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <section className="w-full max-w-lg space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <header className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <ShieldCheck size={26} />
                    </div>
                    <h1 className="mt-4 text-2xl font-bold text-slate-950">Set up your admin account</h1>
                    {invitation && (
                        <p className="mt-2 text-sm text-slate-500">
                            Invitation for <strong>{invitation.name}</strong> ({invitation.email})
                            {invitation.role?.name ? <> as <strong>{invitation.role.name}</strong></> : null}
                        </p>
                    )}
                </header>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                        <Loader2 size={18} className="animate-spin" /> Checking invitation...
                    </div>
                ) : invitation ? (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="verification-channel" className="mb-2 block text-sm font-semibold text-slate-700">
                                Verify using
                            </label>
                            <select
                                id="verification-channel"
                                value={channel}
                                onChange={(event) => {
                                    setChannel(event.target.value as "EMAIL" | "PHONE");
                                    setCodeSent(false);
                                }}
                                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                            >
                                <option value="EMAIL">Email ({invitation.email})</option>
                                <option value="PHONE">Phone</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={() => void sendCode()}
                            disabled={sendingCode}
                            className="h-11 w-full rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                            {sendingCode ? "Sending code..." : codeSent ? "Send another code" : "Send verification code"}
                        </button>
                        <div>
                            <label htmlFor="code" className="mb-2 block text-sm font-semibold text-slate-700">
                                Verification code
                            </label>
                            <input
                                id="code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                maxLength={6}
                                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                                Create password
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                minLength={8}
                                maxLength={128}
                                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">
                                Confirm password
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm"
                            />
                        </div>
                    </div>
                ) : null}

                {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle size={17} className="mt-0.5 shrink-0" />
                        {error}
                    </div>
                )}

                {invitation && (
                    <button
                        type="button"
                        onClick={() => void acceptInvitation()}
                        disabled={accepting || loading}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                        {accepting ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                        {accepting ? "Setting up account..." : "Verify and create admin account"}
                    </button>
                )}
            </section>
        </main>
    );
}
