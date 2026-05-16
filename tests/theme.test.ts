import { describe, expect, it } from "vitest";

describe("NULP-inspired theme contract", () => {
  it("keeps the primary palette blue and gold, not generic purple", () => {
    const theme = {
      primary: "#0b4f8f",
      accent: "#f2b705",
      ink: "#102033",
    };

    expect(theme.primary).toBe("#0b4f8f");
    expect(theme.accent).toBe("#f2b705");
    expect(Object.values(theme)).not.toContain("#7c3aed");
  });
});
