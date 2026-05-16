import Link from "next/link";
import type { ExtractionItemType } from "@/lib/types";

type ExtractionTab = {
  type: ExtractionItemType | "";
  label: string;
};

export const EXTRACTION_TYPE_TABS: ExtractionTab[] = [
  { type: "", label: "All facts" },
  { type: "person", label: "Persons" },
];

export function ExtractionTypeTabs({ activeType }: { activeType: ExtractionItemType | "" }) {
  return (
    <nav style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }} aria-label="Extracted fact categories">
      {EXTRACTION_TYPE_TABS.map((tab) => {
        const active = tab.type === activeType;
        return (
          <Link
            key={tab.type || "all"}
            className={`button ${active ? "button-primary" : "button-secondary"}`}
            href={tab.type ? `/admin/extractions?type=${tab.type}` : "/admin/extractions"}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
