"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/use-auth";

export function Topbar() {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="topbar">
      <Link
        className="topbar-brand"
        href={auth.user?.role === "admin" ? "/admin/documents" : "/chat"}
      >
        <span className="brand-mark">LP</span>
        <span>
          <span style={{ display: "block", fontSize: "0.95rem" }}>
            Assistant
          </span>
          <span
            className="muted"
            style={{ display: "block", fontSize: "0.78rem", fontWeight: 700 }}
          >
            Bureau documents
          </span>
        </span>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {auth.user?.role === "admin" ? (
          <Link className="button button-secondary" href="/admin/documents">
            Admin
          </Link>
        ) : null}
        {auth.user ? (
          <>
            <Link
              className="button button-secondary"
              href="/chat"
              aria-current={pathname === "/chat" ? "page" : undefined}
            >
              Chat
            </Link>
            <button
              className="button button-danger"
              type="button"
              onClick={() => {
                auth.logout();
                router.replace("/login");
              }}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </>
        ) : null}
      </nav>
    </header>
  );
}
