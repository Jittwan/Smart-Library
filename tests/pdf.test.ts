import { describe, it, expect } from "vitest";
import { buildOverdueReportPdf, type OverdueRow } from "../lib/pdf";

function pdfHeader(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes.slice(0, 5));
}

describe("buildOverdueReportPdf", () => {
  it("produces a valid PDF for an empty report", async () => {
    const bytes = await buildOverdueReportPdf([]);
    expect(bytes.length).toBeGreaterThan(0);
    expect(pdfHeader(bytes)).toBe("%PDF-");
  });

  it("produces a valid PDF with overdue rows", async () => {
    const rows: OverdueRow[] = [
      {
        memberName: "Ada Lovelace",
        memberEmail: "ada@example.com",
        bookTitle: "Clean Code",
        author: "Robert C. Martin",
        dueDate: new Date("2026-01-15T00:00:00Z"),
        daysOverdue: 5,
        fine: 25,
      },
    ];
    const bytes = await buildOverdueReportPdf(rows, new Date("2026-01-20T00:00:00Z"));
    expect(pdfHeader(bytes)).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(500);
  });
});
