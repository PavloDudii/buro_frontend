import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, setRefresher } from "@/lib/api";

const OK_RESPONSE = {
  ok: true,
  status: 200,
  json: async () => ({ result: "ok" }),
};

const UNAUTHORIZED_RESPONSE = {
  ok: false,
  status: 401,
  statusText: "Unauthorized",
  json: async () => ({ detail: "Token has expired." }),
};

beforeEach(() => {
  setRefresher(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  setRefresher(null);
});

describe("apiFetch 401 retry", () => {
  it("throws ApiError immediately when no refresher is registered", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(UNAUTHORIZED_RESPONSE));

    await expect(apiFetch("/documents", { token: "expired-token" })).rejects.toMatchObject({
      status: 401,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries with new token after refresher succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(UNAUTHORIZED_RESPONSE)
      .mockResolvedValueOnce(OK_RESPONSE);
    vi.stubGlobal("fetch", fetchMock);

    const refresher = vi.fn().mockResolvedValue("new-access-token");
    setRefresher(refresher);

    await apiFetch("/documents", { token: "expired-token" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refresher).toHaveBeenCalledTimes(1);
    const [, retryInit] = fetchMock.mock.calls[1];
    expect((retryInit as RequestInit & { headers: Headers }).headers.get("Authorization")).toBe(
      "Bearer new-access-token",
    );
  });

  it("throws original ApiError when refresher itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(UNAUTHORIZED_RESPONSE));

    setRefresher(vi.fn().mockRejectedValue(new Error("refresh failed")));

    await expect(apiFetch("/documents", { token: "expired-token" })).rejects.toMatchObject({
      status: 401,
      message: "Token has expired.",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a second time if the retried request also returns 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(UNAUTHORIZED_RESPONSE));

    setRefresher(vi.fn().mockResolvedValue("new-token"));

    await expect(apiFetch("/documents", { token: "expired-token" })).rejects.toMatchObject({
      status: 401,
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent 401s into a single refresh call", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ...UNAUTHORIZED_RESPONSE, json: async () => ({}) }),
    );

    let resolveRefresh!: (token: string) => void;
    const refreshPromise = new Promise<string>((resolve) => {
      resolveRefresh = resolve;
    });
    const refresher = vi.fn().mockReturnValue(refreshPromise);
    setRefresher(refresher);

    const r1 = apiFetch("/documents", { token: "expired" });
    const r2 = apiFetch("/programs", { token: "expired" });

    resolveRefresh("new-token");

    await Promise.allSettled([r1, r2]);

    expect(refresher).toHaveBeenCalledTimes(1);
  });

  it("setRefresher(null) disables retry after logout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(UNAUTHORIZED_RESPONSE));

    setRefresher(vi.fn().mockResolvedValue("new-token"));
    setRefresher(null);

    await expect(apiFetch("/documents", { token: "expired-token" })).rejects.toMatchObject({
      status: 401,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
