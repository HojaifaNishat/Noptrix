"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ownerRequest,
    saveOwnerSessionId,
    saveOwnerToken,
} from "@/lib/owner-api";

type LoginResult = {
    accessToken: string;
    sessionId: string;
};

export default function Page() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [secretCode, setSecretCode] = useState("");
    const [requiresSecret, setRequiresSecret] = useState(false);
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        try {
            const result = await ownerRequest<LoginResult>(
                "/owner-auth/login",
                {
                    method: "POST",
                    body: JSON.stringify({ email, password }),
                }
            );
            saveOwnerToken(result.accessToken);
            saveOwnerSessionId(result.sessionId);
            setRequiresSecret(true);
            setMessage("Enter your owner secret code to continue.");
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to reach the backend. Check that the API is running."
            );
        } finally {
            setBusy(false);
        }
    };

    const verifySecret = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        try {
            const result = await ownerRequest<LoginResult>(
                "/owner-auth/verify-secret",
                {
                    method: "POST",
                    body: JSON.stringify({
                        secretCode,
                    }),
                }
            );
            saveOwnerToken(result.accessToken);
            router.push("/admin/roles");
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Secret verification failed."
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="owner-shell">
            <section className="owner-card owner-login-card">
                <p className="owner-kicker">NOPTRIX OWNER</p>
                <h1>Owner access</h1>
                <p className="owner-muted">Sign in to test roles, permissions and employee invitations.</p>
                {!requiresSecret ? <form onSubmit={submit} className="owner-form">
                    <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
                    <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
                    {message && <p className="owner-error">{message}</p>}
                    <button disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
                </form> : <form onSubmit={verifySecret} className="owner-form">
                    <label>Owner secret code<input value={secretCode} onChange={(event) => setSecretCode(event.target.value)} inputMode="numeric" required /></label>
                    {message && <p className="owner-error">{message}</p>}
                    <button disabled={busy}>{busy ? "Verifying..." : "Verify and open panel"}</button>
                </form>}
            </section>
        </main>
    );
}
