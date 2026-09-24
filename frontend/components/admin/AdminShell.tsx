"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Boxes, ChevronRight, LayoutDashboard, LogOut, Menu, Package, Settings, Shield, ShoppingBag, Truck, Users, X } from "lucide-react";
import { useState } from "react";
import { adminAuthService } from "@/services/admin.service";
import { ownerRequest } from "@/lib/owner-api";

const navItems = [
    { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Inventory", href: "/admin/inventory", icon: Boxes },
    { label: "Delivery", href: "/admin/delivery/tracking", icon: Truck },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "Staff & access", href: "/admin/staff", icon: Shield },
];

export default function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [session] = useState(() => { try { return JSON.parse(localStorage.getItem("adminSession") || "{}"); } catch { return {}; } });

    const logout = async () => {
        try {
            if (session.role === "OWNER") await ownerRequest("/owner-auth/logout", { method: "POST" });
            else await adminAuthService.logout();
        } catch { /* The local session is still cleared if the API session has expired. */ }
        localStorage.removeItem("adminAccessToken");
        localStorage.removeItem("adminRefreshToken");
        localStorage.removeItem("adminSession");
        localStorage.removeItem("noptrix_owner_access_token");
        localStorage.removeItem("noptrix_owner_session_id");
        router.replace("/admin/login");
    };

    return <div className="admin-shell"><aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}><div className="admin-sidebar-top"><Link href="/admin/dashboard" className="admin-logo">N<span>/</span>P</Link><button className="admin-icon-button admin-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button></div><div className="admin-sidebar-label">Workspace</div><nav className="admin-nav">{navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={pathname === href || pathname.startsWith(`${href}/`) ? "active" : ""}><Icon size={18} /><span>{label}</span>{pathname === href && <ChevronRight size={15} />}</Link>)}</nav><div className="admin-sidebar-bottom"><Link href="/admin/settings"><Settings size={18} />Settings</Link><button onClick={logout}><LogOut size={18} />Sign out</button></div></aside>{mobileOpen && <button className="admin-overlay" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}<div className="admin-main"><header className="admin-topbar"><button className="admin-icon-button admin-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><div><span className="admin-topbar-kicker">Noptrix control room</span><strong>{navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label || "Admin"}</strong></div><div className="admin-profile"><span className="admin-avatar">{(session.role || "A").slice(0, 1).toUpperCase()}</span><span><strong>{session.role || "Admin"}</strong><small>Online</small></span></div></header><main className="admin-content">{children}</main></div></div>;
}