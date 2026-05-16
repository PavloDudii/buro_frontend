import { afterEach, describe, expect, it, vi } from "vitest";
import { listExtractionItems } from "@/lib/api";

describe("listExtractionItems", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests extracted facts with type/search filters and admin auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [],
        total: 0,
        limit: 100,
        offset: 0,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await listExtractionItems("access-token", {
      type: "person",
      search: "саєнко",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/documents/extraction-items?");
    expect(String(url)).toContain("type=person");
    expect(String(url)).toContain("search=%D1%81%D0%B0%D1%94%D0%BD%D0%BA%D0%BE");
    expect(((init as RequestInit).headers as Headers).get("Authorization")).toBe(
      "Bearer access-token",
    );
  });
});
