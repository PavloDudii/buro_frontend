import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteProgram,
  getProgram,
  importBachelorPrograms,
  listPrograms,
  updateProgram,
  updateProgramDepartment,
  updateProgramDocument,
} from "@/lib/api";

describe("program APIs", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests program import, list, detail, and manual department assignment", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [], total: 0, limit: 100, offset: 0 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await importBachelorPrograms("access-token");
    await listPrograms("access-token", {
      institutionCode: "ІКНІ",
      departmentLinkStatus: "matched",
      search: "систем",
    });
    await getProgram("access-token", "program-id");
    await updateProgramDepartment("access-token", "program-id", "department-id");
    await updateProgram("access-token", "program-id", { program_name: "Updated" });
    await updateProgramDocument("access-token", "program-id", "document-link-id", { title: "File" });
    await deleteProgram("access-token", "program-id");

    expect(fetchMock).toHaveBeenCalledTimes(7);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/programs/import/nulp/bachelor");
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("POST");
    expect(String(fetchMock.mock.calls[1][0])).toContain("/programs?");
    expect(String(fetchMock.mock.calls[1][0])).toContain("institution_code=%D0%86%D0%9A%D0%9D%D0%86");
    expect(String(fetchMock.mock.calls[1][0])).toContain("department_link_status=matched");
    expect(String(fetchMock.mock.calls[1][0])).toContain("search=%D1%81%D0%B8%D1%81%D1%82%D0%B5%D0%BC");
    expect(String(fetchMock.mock.calls[2][0])).toContain("/programs/program-id");
    expect(String(fetchMock.mock.calls[3][0])).toContain("/programs/program-id/department");
    expect((fetchMock.mock.calls[3][1] as RequestInit).method).toBe("PATCH");
    expect(((fetchMock.mock.calls[3][1] as RequestInit).headers as Headers).get("Authorization")).toBe(
      "Bearer access-token",
    );
    expect(String(fetchMock.mock.calls[4][0])).toContain("/programs/program-id");
    expect((fetchMock.mock.calls[4][1] as RequestInit).method).toBe("PATCH");
    expect(String(fetchMock.mock.calls[5][0])).toContain("/programs/program-id/documents/document-link-id");
    expect((fetchMock.mock.calls[5][1] as RequestInit).method).toBe("PATCH");
    expect(String(fetchMock.mock.calls[6][0])).toContain("/programs/program-id");
    expect((fetchMock.mock.calls[6][1] as RequestInit).method).toBe("DELETE");
  });
});
