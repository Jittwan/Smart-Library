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
      <h1 className="font-display text-3xl font-semibold">Catalog</h1>

      <AddBookForm />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Author</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5 text-right">Copies</th>
              <th className="px-4 py-2.5 text-right">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {books.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No books yet. Add one above.
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book.id}>
                  <td className="px-4 py-2.5 font-medium">{book.title}</td>
                  <td className="px-4 py-2.5">{book.author}</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge badge-${book.category}`}>
                      {categoryLabel(book.category)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">{book.copies}</td>
                  <td className="px-4 py-2.5 text-right">
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
