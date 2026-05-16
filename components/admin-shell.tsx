"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Building2, Database, FileText, Users } from "lucide-react";
import { RequireAuth } from "@/components/route-guards";
import { Topbar } from "@/components/topbar";

const navItems = [
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/programs", label: "Programs", icon: BookOpen },
  { href: "/admin/institutions", label: "Institutions", icon: Building2 },
  { href: "/admin/extractions", label: "Facts", icon: Database },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireAuth adminOnly>
      <div className="app-shell">
        <Topbar />
        <div className="admin-grid">
          <aside className="admin-nav card">
            <div style={{ margin: "0 0 0.8rem", padding: "0 0.3rem" }}>
              <p className="muted" style={{ margin: 0, fontSize: "0.76rem", fontWeight: 900 }}>
                ADMIN PANEL
              </p>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </aside>
          <main className="content-stack">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
