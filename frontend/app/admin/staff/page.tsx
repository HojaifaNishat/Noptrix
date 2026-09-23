"use client";

import { FormEvent, useState } from "react";
import { ownerRequest } from "@/lib/owner-api";

export default function Page() {
    const [form, setForm] = useState({ email: "", roleId: "", employmentType: "FULL_TIME", employeeCode: "" });
    const [result, setResult] = useState("");
    const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
    const submit = async (event: FormEvent) => {
        event.preventDefault();
        try {
            const data = await ownerRequest<{ token: string; expiresAt: string }>("/employee-invitations", { method: "POST", body: JSON.stringify(form) });
            setResult(`Invitation token: ${data.token} | Expires: ${new Date(data.expiresAt).toLocaleString()}`);
        } catch (error) { setResult(error instanceof Error ? error.message : "Could not create invitation."); }
    };
    return <main className="owner-shell owner-dashboard"><header className="owner-header"><div><p className="owner-kicker">ADMIN PANEL / OWNER CONTROLS</p><h1>Invite employee</h1></div><a href="/admin/roles">Roles & access</a></header><section className="owner-card owner-invite-card"><p className="owner-muted">Choose a role first, then generate a one-time employee invitation.</p><form onSubmit={submit} className="owner-form"><label>Email<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></label><label>Role ID<input value={form.roleId} onChange={(event) => update("roleId", event.target.value)} placeholder="Paste the role ID" required /></label><label>Employee code<input value={form.employeeCode} onChange={(event) => update("employeeCode", event.target.value)} required /></label><label>Employment type<select value={form.employmentType} onChange={(event) => update("employmentType", event.target.value)}><option>FULL_TIME</option><option>PART_TIME</option><option>CONTRACT</option><option>INTERN</option></select></label><button>Generate invitation</button></form>{result && <pre className="owner-notice">{result}</pre>}</section></main>;
}