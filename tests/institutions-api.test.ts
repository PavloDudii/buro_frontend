import { afterEach, describe, expect, it, vi } from "vitest";
import { listDepartments, listInstitutions } from "@/lib/api";

describe("listInstitutions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests canonical institutions with admin auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        total: 0,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await listInstitutions("access-token");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/institutions");
    expect(((init as RequestInit).headers as Headers).get("Authorization")).toBe(
      "Bearer access-token",
    );
  });

  it("requests departments linked to an institution", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        total: 0,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await listDepartments("access-token", { institutionCode: "ІКТА", search: "роботики" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/institutions/departments?");
    expect(String(url)).toContain("institution_code=%D0%86%D0%9A%D0%A2%D0%90");
    expect(String(url)).toContain("search=%D1%80%D0%BE%D0%B1%D0%BE%D1%82%D0%B8%D0%BA%D0%B8");
    expect(((init as RequestInit).headers as Headers).get("Authorization")).toBe(
      "Bearer access-token",
    );
  });
});
