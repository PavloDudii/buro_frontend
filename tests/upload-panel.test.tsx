import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UploadPanel } from "@/components/upload-panel";

describe("UploadPanel", () => {
  it("shows the 50 MB upload limit", () => {
    render(<UploadPanel accessToken="access-token" onCompleted={() => undefined} />);

    expect(screen.getByText(/up to 50 MB/i)).toBeInTheDocument();
  });
});
