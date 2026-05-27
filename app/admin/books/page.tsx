import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { AddBookForm } from "@/components/AddBookForm";
import { categoryLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  const books = await prisma.book.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <AdminNav email={admin.email} />
      <h1 className="text-2xl font-semibold">Catalog</h1>

      <AddBookForm />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Author</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2 text-right">Copies</th>
              <th className="px-4 py-2 text-right">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {books.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  No books yet. Add one above.
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book.id}>
                  <td className="px-4 py-2 font-medium">{book.title}</td>
                  <td className="px-4 py-2">{book.author}</td>
                  <td className="px-4 py-2">{categoryLabel(book.category)}</td>
                  <td className="px-4 py-2 text-right">{book.copies}</td>
                  <td className="px-4 py-2 text-right">
                    {book.availableCopies}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
