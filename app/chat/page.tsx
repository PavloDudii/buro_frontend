"use client";

import { Send } from "lucide-react";
import { RequireAuth } from "@/components/route-guards";
import { Topbar } from "@/components/topbar";

export default function ChatPage() {
  return (
    <RequireAuth>
      <div className="app-shell">
        <Topbar />
        <main style={{ width: "min(100% - 2rem, 980px)", margin: "2rem auto" }}>
          <section className="card" style={{ minHeight: "70vh", padding: "1.2rem" }}>
            <div className="toolbar">
              <div>
                <h1 className="page-title">Ask the bureau</h1>
                <p className="muted" style={{ margin: "0.7rem 0 0" }}>
                  Chat backend comes next. This shell is ready for document-grounded answers.
                </p>
              </div>
              <span className="status-chip status-warning">Coming soon</span>
            </div>

            <div
              style={{
                display: "grid",
                minHeight: 380,
                placeItems: "center",
                color: "var(--muted)",
                textAlign: "center",
              }}
            >
              <div>
                <div className="brand-mark" style={{ margin: "0 auto 1rem" }}>
                  LP
                </div>
                <p style={{ margin: 0, fontWeight: 900, color: "var(--ink)" }}>Chat shell is active</p>
                <p style={{ margin: "0.35rem 0 0" }}>
                  Once retrieval is exposed, this page will stream answers with source citations.
                </p>
              </div>
            </div>

            <form className="toolbar" onSubmit={(event) => event.preventDefault()}>
              <input className="field" placeholder="Ask about university procedures..." disabled />
              <button className="button button-primary" type="submit" disabled>
                <Send size={16} />
                Send
              </button>
            </form>
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}
