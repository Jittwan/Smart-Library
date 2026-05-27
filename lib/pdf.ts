import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export interface OverdueRow {
  memberName: string;
  memberEmail: string;
  bookTitle: string;
  author: string;
  dueDate: Date;
  daysOverdue: number;
  fine: number;
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Smart Library";

const PAGE_WIDTH = 595.28; // A4 portrait
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const FONT_SIZE = 9;
const HEADER_SIZE = 10;
const ROW_HEIGHT = 18;

// Column layout: [label, x offset, width]
const COLUMNS: { label: string; x: number; width: number }[] = [
  { label: "Member", x: MARGIN, width: 110 },
  { label: "Email", x: MARGIN + 110, width: 130 },
  { label: "Book", x: MARGIN + 240, width: 150 },
  { label: "Due date", x: MARGIN + 390, width: 70 },
  { label: "Days", x: MARGIN + 460, width: 30 },
  { label: "Fine (THB)", x: MARGIN + 490, width: 60 },
];

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Truncate text so it fits within `maxWidth` at the given font size. */
function fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (
    truncated.length > 1 &&
    font.widthOfTextAtSize(`${truncated}…`, size) > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

export async function buildOverdueReportPdf(
  rows: OverdueRow[],
  generatedAt: Date = new Date(),
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  // Title
  page.drawText(`${APP_NAME} — Overdue Report`, {
    x: MARGIN,
    y,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 20;
  page.drawText(`Generated: ${generatedAt.toISOString().slice(0, 16).replace("T", " ")} UTC`, {
    x: MARGIN,
    y,
    size: FONT_SIZE,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 24;

  const drawHeader = () => {
    for (const col of COLUMNS) {
      page.drawText(col.label, {
        x: col.x,
        y,
        size: HEADER_SIZE,
        font: bold,
      });
    }
    y -= 6;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.75,
      color: rgb(0.6, 0.6, 0.6),
    });
    y -= ROW_HEIGHT;
  };

  drawHeader();

  let totalFine = 0;

  if (rows.length === 0) {
    page.drawText("No overdue loans.", {
      x: MARGIN,
      y,
      size: FONT_SIZE,
      font,
    });
    y -= ROW_HEIGHT;
  }

  for (const row of rows) {
    if (y < MARGIN + ROW_HEIGHT * 2) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      drawHeader();
    }

    totalFine += row.fine;

    const cells = [
      row.memberName,
      row.memberEmail,
      `${row.bookTitle} — ${row.author}`,
      formatDate(row.dueDate),
      String(row.daysOverdue),
      row.fine.toLocaleString("en-US"),
    ];

    cells.forEach((value, i) => {
      const col = COLUMNS[i];
      page.drawText(fit(value, font, FONT_SIZE, col.width - 4), {
        x: col.x,
        y,
        size: FONT_SIZE,
        font,
      });
    });

    y -= ROW_HEIGHT;
  }

  // Totals
  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.75,
    color: rgb(0.6, 0.6, 0.6),
  });
  y -= ROW_HEIGHT;
  page.drawText(
    `Total overdue loans: ${rows.length}    Total fines: ${totalFine.toLocaleString("en-US")} THB`,
    {
      x: MARGIN,
      y,
      size: HEADER_SIZE,
      font: bold,
    },
  );

  return pdf.save();
}
