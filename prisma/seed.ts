import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Skip empty values and unfilled placeholders (e.g. "...<ref>...<password>...").
function isUsableUrl(value: string | undefined): value is string {
  if (!value || value.includes("<")) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function connectionString(): string | undefined {
  const cs = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
  ].find(isUsableUrl);
  if (!cs) return cs;
  try {
    const url = new URL(cs);
    url.searchParams.set("sslmode", "no-verify");
    return url.toString();
  } catch {
    return cs;
  }
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: connectionString() }),
});

const SAMPLE_BOOKS = [
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", category: "textbook", copies: 3 },
  { title: "Clean Code", author: "Robert C. Martin", category: "textbook", copies: 4 },
  { title: "Database System Concepts", author: "Abraham Silberschatz", category: "textbook", copies: 2 },
  { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", category: "general", copies: 5 },
  { title: "Atomic Habits", author: "James Clear", category: "general", copies: 4 },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", category: "general", copies: 2 },
  { title: "1984", author: "George Orwell", category: "novel", copies: 3 },
  { title: "The Hobbit", author: "J.R.R. Tolkien", category: "novel", copies: 4 },
  { title: "Pride and Prejudice", author: "Jane Austen", category: "novel", copies: 2 },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "novel", copies: 3 },
] as const;

async function main() {
  let created = 0;
  for (const book of SAMPLE_BOOKS) {
    const existing = await prisma.book.findFirst({
      where: { title: book.title, author: book.author },
    });
    if (existing) continue;
    await prisma.book.create({
      data: {
        title: book.title,
        author: book.author,
        category: book.category,
        copies: book.copies,
        availableCopies: book.copies,
      },
    });
    created++;
  }
  console.log(
    `Seed complete: ${created} added, ${SAMPLE_BOOKS.length - created} already present.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
