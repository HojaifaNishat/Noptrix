"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { ownerRequest, saveOwnerSessionId, saveOwnerToken } from "@/lib/owner-api";

type OwnerLoginResult = { userId: string; ownerId: string; sessionId: string; accessToken: string; secretVerified: boolean };

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
            const result = await ownerRequest<OwnerLoginResult>("/owner-auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
            saveOwnerToken(result.accessToken);
            saveOwnerSessionId(result.sessionId);
            setRequiresSecret(true);
            setMessage("Enter your owner secret code to continue.");
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Unable to sign in. Check your credentials and API connection."
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
            const result = await ownerRequest<OwnerLoginResult>("/owner-auth/verify-secret", { method: "POST", body: JSON.stringify({ secretCode }) });
            saveOwnerToken(result.accessToken);
            saveOwnerSessionId(result.sessionId);
            localStorage.setItem("adminSession", JSON.stringify({ role: "OWNER", ownerId: result.ownerId, userId: result.userId, sessionId: result.sessionId }));
            router.push("/admin/dashboard");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Secret verification failed.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="admin-login-page">
            <section className="admin-login-aside">
                <p className="admin-brand-mark">NOPTRIX / CONTROL ROOM</p>
                <div><p className="admin-kicker">OPERATIONS CONSOLE</p><h1>Make every order count.</h1><p>One focused workspace for your store, stock, delivery and support teams.</p></div>
                <div className="admin-login-aside-note"><ShieldCheck size={18} /><span>Protected by your Noptrix admin session</span></div>
            </section>
            <section className="admin-login-panel"><div className="admin-login-card"><div className="admin-login-icon"><LockKeyhole size={21} /></div><p className="admin-kicker">OWNER ACCESS</p><h2>{requiresSecret ? "Verify your access" : "Owner sign in"}</h2><p className="admin-muted">{requiresSecret ? "Enter the owner code to open the control room." : "Use the owner account configured for this workspace."}</p>{!requiresSecret ? <form onSubmit={submit} className="admin-form"><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@company.com" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" required /></label>{message && <p className="admin-form-error">{message}</p>}<button type="submit" disabled={busy}>{busy ? "Signing in..." : "Continue"}</button></form> : <form onSubmit={verifySecret} className="admin-form"><label>Owner secret code<input value={secretCode} onChange={(event) => setSecretCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="Enter secret code" required /></label>{message && <p className="admin-form-error">{message}</p>}<button type="submit" disabled={busy}>{busy ? "Verifying..." : "Open control room"}</button></form>}</div></section>
        </main>
    );
}
