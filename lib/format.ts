export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTHB(amount: number): string {
  return `${amount.toLocaleString("en-US")} THB`;
}

const CATEGORY_LABELS: Record<string, string> = {
  textbook: "Textbook",
  general: "General",
  novel: "Novel",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
