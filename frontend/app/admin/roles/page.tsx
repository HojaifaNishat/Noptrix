"use client";

import { FormEvent, useEffect, useState } from "react";
import { ownerRequest } from "@/lib/owner-api";

type Item = { _id: string; name?: string; key?: string; slug?: string };

export default function Page() {
    const [roles, setRoles] = useState<Item[]>([]);
    const [permissions, setPermissions] = useState<Item[]>([]);
    const [roleId, setRoleId] = useState("");
    const [permissionId, setPermissionId] = useState("");
    const [roleName, setRoleName] = useState("");
    const [roleSlug, setRoleSlug] = useState("");
    const [message, setMessage] = useState("");

    const load = async () => {
        const [roleData, permissionData] = await Promise.all([
            ownerRequest<{ roles: Item[] }>("/roles"),
            ownerRequest<{ permissions: Item[] }>("/permissions"),
        ]);
        setRoles(roleData.roles ?? []);
        setPermissions(permissionData.permissions ?? []);
    };

    useEffect(() => { load().catch((error) => setMessage(error.message)); }, []);

    const createRole = async (event: FormEvent) => {
        event.preventDefault();
        try {
            await ownerRequest("/roles", { method: "POST", body: JSON.stringify({ name: roleName, slug: roleSlug }) });
            setRoleName(""); setRoleSlug(""); setMessage("Role created."); await load();
        } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create role."); }
    };

    const assignPermission = async (event: FormEvent) => {
        event.preventDefault();
        try {
            await ownerRequest("/role-permissions/assign", { method: "POST", body: JSON.stringify({ roleId, permissionId }) });
            setMessage("Permission assigned to role.");
        } catch (error) { setMessage(error instanceof Error ? error.message : "Could not assign permission."); }
    };

    return <main className="owner-shell owner-dashboard"><header className="owner-header"><div><p className="owner-kicker">ADMIN PANEL / OWNER CONTROLS</p><h1>Roles & access</h1></div><a href="/admin/staff">Employee invitations</a></header><p className="owner-muted">Owner has full access. Select the access that each employee role should receive.</p><div className="owner-grid"><section className="owner-card"><h2>Create role</h2><form onSubmit={createRole} className="owner-form"><label>Name<input value={roleName} onChange={(event) => setRoleName(event.target.value)} required /></label><label>Slug<input value={roleSlug} onChange={(event) => setRoleSlug(event.target.value)} placeholder="inventory-manager" required /></label><button>Create role</button></form></section><section className="owner-card"><h2>Assign access</h2><form onSubmit={assignPermission} className="owner-form"><label>Role<select value={roleId} onChange={(event) => setRoleId(event.target.value)} required><option value="">Select role</option>{roles.map((role) => <option key={role._id} value={role._id}>{role.name ?? role.slug}</option>)}</select></label><label>Permission<select value={permissionId} onChange={(event) => setPermissionId(event.target.value)} required><option value="">Select permission</option>{permissions.map((permission) => <option key={permission._id} value={permission._id}>{permission.key}</option>)}</select></label><button>Assign access</button></form></section></div>{message && <p className="owner-notice">{message}</p>}</main>;
}