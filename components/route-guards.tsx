"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/use-auth";

export function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (auth.isLoading) {
      return;
    }
    if (!auth.user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (adminOnly && auth.user.role !== "admin") {
      router.replace("/chat");
    }
  }, [adminOnly, auth.isLoading, auth.user, pathname, router]);

  if (auth.isLoading) {
    return <div style={{ padding: "2rem" }}>Loading session...</div>;
  }
  if (!auth.user || (adminOnly && auth.user.role !== "admin")) {
    return null;
  }

  return children;
}
