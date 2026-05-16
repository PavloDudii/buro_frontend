"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/use-auth";

export default function SignupPage() {
  const auth = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await auth.register({ email, fullName, password });
      router.replace(result.user.role === "admin" ? "/admin/documents" : "/chat");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed.");
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
        <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr" }}>
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(7,55,99,0.97), rgba(11,79,143,0.94)), radial-gradient(circle at 80% 20%, rgba(242,183,5,0.45), transparent 16rem)",
              color: "white",
              padding: "clamp(2rem, 6vw, 4rem)",
            }}
          >
            <span className="brand-mark" style={{ background: "rgba(255,255,255,0.15)" }}>
              LP
            </span>
            <h1 className="page-title" style={{ marginTop: "2rem" }}>
              Start with chat. Admins can be promoted later.
            </h1>
            <p style={{ maxWidth: 420, color: "rgba(255,255,255,0.78)", fontSize: "1.05rem" }}>
              New accounts are regular users by default. Admins can update roles from the users panel.
            </p>
          </div>
          <form onSubmit={submit} style={{ display: "grid", gap: "1rem", padding: "clamp(2rem, 5vw, 3rem)" }}>
            <div>
              <p className="muted" style={{ margin: 0, fontWeight: 900 }}>
                CREATE ACCOUNT
              </p>
              <h2 className="section-title" style={{ marginTop: "0.4rem" }}>
                Sign up
              </h2>
            </div>
            <label>
              <span className="muted" style={{ display: "block", marginBottom: "0.35rem", fontWeight: 700 }}>
                Full name
              </span>
              <input
                className="field"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </label>
            <label>
              <span className="muted" style={{ display: "block", marginBottom: "0.35rem", fontWeight: 700 }}>
                Email
              </span>
              <input
                className="field"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              <span className="muted" style={{ display: "block", marginBottom: "0.35rem", fontWeight: 700 }}>
                Password
              </span>
              <input
                className="field"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error ? <div style={{ color: "var(--danger)", fontWeight: 700 }}>{error}</div> : null}
            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
            <p className="muted" style={{ margin: 0 }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--primary)", fontWeight: 900 }}>
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
