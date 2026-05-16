import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusChip } from "@/components/status-chip";

describe("StatusChip", () => {
  it("renders visible document processing status labels", () => {
    render(<StatusChip status="needs_ocr" />);

    expect(screen.getByText("Needs OCR")).toHaveClass("status-warning");
  });
});
