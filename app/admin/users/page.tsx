"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/components/use-auth";
import { listUsers, updateUserRole } from "@/lib/api";
import type { UserRole } from "@/lib/types";

export default function AdminUsersPage() {
  const auth = useAuth();
  const token = auth.requireToken();
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const users = useQuery({
    queryKey: ["users", search],
    queryFn: () => listUsers(token, search),
  });
  const roleUpdate = useMutation({
    mutationFn: ({ email, role }: { email: string; role: UserRole }) =>
      updateUserRole(token, email, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return (
    <>
      <section className="card" style={{ padding: "1.2rem" }}>
        <div className="toolbar">
          <div>
            <p className="muted" style={{ margin: 0, fontWeight: 900 }}>
              USERS
            </p>
            <h1 className="page-title">Access control</h1>
          </div>
          <input
            className="field"
            style={{ width: 290 }}
            placeholder="Search users"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      <section className="card" style={{ padding: "1rem" }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Created</th>
                <th>Change role</th>
              </tr>
            </thead>
            <tbody>
              {(users.data?.items ?? []).map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.full_name}</strong>
                    <div className="muted" style={{ fontSize: "0.82rem" }}>
                      {user.email}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-chip ${
                        user.role === "admin" ? "status-active" : "status-neutral"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleString()}</td>
                  <td>
                    <select
                      className="field"
                      style={{ width: 140 }}
                      value={user.role}
                      disabled={roleUpdate.isPending}
                      onChange={(event) =>
                        roleUpdate.mutate({
                          email: user.email,
                          role: event.target.value as UserRole,
                        })
                      }
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
              {!users.data?.items.length ? (
                <tr>
                  <td colSpan={4} className="muted" style={{ textAlign: "center" }}>
                    {users.isLoading ? "Loading users..." : "No users found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {roleUpdate.error ? (
          <div style={{ color: "var(--danger)", fontWeight: 700, marginTop: "0.8rem" }}>
            {roleUpdate.error.message}
          </div>
        ) : null}
      </section>
    </>
  );
}
