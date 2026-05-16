"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useAuth } from "@/components/use-auth";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const auth = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await auth.login(email, password);
      const next = params.get("next");
      router.replace(next ?? (result.user.role === "admin" ? "/admin/documents" : "/chat"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        display: "grid",
        minHeight: "100vh",
        placeItems: "center",
        padding: "1rem",
      }}
    >
      <section className="card" style={{ width: "min(100%, 980px)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr" }}>
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(11,79,143,0.96), rgba(7,55,99,0.96)), radial-gradient(circle at 20% 20%, rgba(242,183,5,0.5), transparent 18rem)",
              color: "white",
              padding: "clamp(2rem, 6vw, 4rem)",
            }}
          >
            <span className="brand-mark" style={{ background: "rgba(255,255,255,0.15)" }}>
              LP
            </span>
            <h1 className="page-title" style={{ marginTop: "2rem" }}>
              Bureau documents, without the queue.
            </h1>
            <p style={{ maxWidth: 420, color: "rgba(255,255,255,0.78)", fontSize: "1.05rem" }}>
              A focused assistant interface for NULP document search, uploads, and admin workflows.
            </p>
          </div>
          <form onSubmit={submit} style={{ display: "grid", gap: "1rem", padding: "clamp(2rem, 5vw, 3rem)" }}>
            <div>
              <p className="muted" style={{ margin: 0, fontWeight: 900 }}>
                SIGN IN
              </p>
              <h2 className="section-title" style={{ marginTop: "0.4rem" }}>
                Welcome back
              </h2>
            </div>
            <label>
              <span className="muted" style={{ display: "block", marginBottom: "0.35rem", fontWeight: 700 }}>
                Email
              </span>
              <input className="field" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              <span className="muted" style={{ display: "block", marginBottom: "0.35rem", fontWeight: 700 }}>
                Password
              </span>
              <input
                className="field"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <div style={{ color: "var(--danger)", fontWeight: 700 }}>{error}</div> : null}
            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
            <p className="muted" style={{ margin: 0 }}>
              No account yet?{" "}
              <Link href="/signup" style={{ color: "var(--primary)", fontWeight: 900 }}>
                Create one
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function LoginShell() {
  return (
    <main
      style={{
        display: "grid",
        minHeight: "100vh",
        placeItems: "center",
        padding: "1rem",
      }}
    >
      <section className="card" style={{ width: "min(100%, 980px)", padding: "3rem" }}>
        <p className="muted" style={{ margin: 0, fontWeight: 900 }}>
          SIGN IN
        </p>
        <h1 className="page-title" style={{ marginTop: "0.5rem" }}>
          Loading secure session
        </h1>
      </section>
    </main>
  );
}
