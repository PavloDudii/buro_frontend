import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  EXTRACTION_TYPE_TABS,
  ExtractionTypeTabs,
} from "@/components/extraction-type-tabs";

describe("ExtractionTypeTabs", () => {
  it("shows all extracted fact categories with a clear active tab", () => {
    render(<ExtractionTypeTabs activeType="person" />);

    expect(EXTRACTION_TYPE_TABS.map((tab) => tab.type)).toEqual([
      "",
      "person",
    ]);
    expect(screen.getByRole("link", { name: "Persons" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
