"use client";

import { FormEvent, useEffect, useState } from "react";
import { ownerRequest } from "@/lib/owner-api";

type Employee = {
    _id: string;
    employeeCode: string;
    status: string;
    employmentType: string;
    department?: string;
    jobTitle?: string;
    userId?: { name?: string; email?: string };
    roleId?: { name?: string; slug?: string };
};

export default function Page() {
    const [form, setForm] = useState({ email: "", roleId: "", employmentType: "FULL_TIME", employeeCode: "" });
    const [result, setResult] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [employeeError, setEmployeeError] = useState("");
    const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

    const loadEmployees = async () => {
        setLoadingEmployees(true);
        setEmployeeError("");
        try {
            const data = await ownerRequest<Employee[]>("/owner-auth/employees");
            setEmployees(data ?? []);
        } catch (error) {
            setEmployeeError(error instanceof Error ? error.message : "Could not load employees.");
        } finally {
            setLoadingEmployees(false);
        }
    };

    useEffect(() => { void loadEmployees(); }, []);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        try {
            const data = await ownerRequest<{ token: string; expiresAt: string }>("/employee-invitations", { method: "POST", body: JSON.stringify(form) });
            setResult(`Invitation token: ${data.token} | Expires: ${new Date(data.expiresAt).toLocaleString()}`);
        } catch (error) { setResult(error instanceof Error ? error.message : "Could not create invitation."); }
    };
    return <main className="owner-shell owner-dashboard"><header className="owner-header"><div><p className="owner-kicker">ADMIN PANEL / OWNER CONTROLS</p><h1>Employees</h1></div><a href="/admin/roles">Roles & access</a></header><section className="owner-card owner-invite-card"><h2>Employee directory</h2><p className="owner-muted">{loadingEmployees ? "Loading employees..." : `${employees.length} employee${employees.length === 1 ? "" : "s"} in your workspace.`}</p>{employeeError && <p className="owner-error">{employeeError}</p>}{!loadingEmployees && !employeeError && <div className="owner-table-wrap"><table className="owner-table"><thead><tr><th>Employee</th><th>Role</th><th>Department</th><th>Type</th><th>Status</th></tr></thead><tbody>{employees.map((employee) => <tr key={employee._id}><td><strong>{employee.userId?.name || "Unnamed employee"}</strong><small>{employee.userId?.email || employee.employeeCode}</small></td><td>{employee.roleId?.name || employee.roleId?.slug || "Unassigned"}</td><td>{employee.department || employee.jobTitle || "Not set"}</td><td>{employee.employmentType.replaceAll("_", " ")}</td><td><span className={`owner-status owner-status-${employee.status.toLowerCase()}`}>{employee.status}</span></td></tr>)}</tbody></table>{employees.length === 0 && <p className="owner-muted">No employees found yet.</p>}</div>}<button className="owner-refresh" type="button" onClick={() => void loadEmployees()}>Refresh employee list</button></section><section className="owner-card owner-invite-card"><h2>Invite employee</h2><p className="owner-muted">Choose a role first, then generate a one-time employee invitation.</p><form onSubmit={submit} className="owner-form"><label>Email<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></label><label>Role ID<input value={form.roleId} onChange={(event) => update("roleId", event.target.value)} placeholder="Paste the role ID" required /></label><label>Employee code<input value={form.employeeCode} onChange={(event) => update("employeeCode", event.target.value)} required /></label><label>Employment type<select value={form.employmentType} onChange={(event) => update("employmentType", event.target.value)}><option>FULL_TIME</option><option>PART_TIME</option><option>CONTRACT</option><option>INTERN</option></select></label><button>Generate invitation</button></form>{result && <pre className="owner-notice">{result}</pre>}</section></main>;
}