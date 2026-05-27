import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/app";
import { SiteHeader } from "@/components/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — Library Lending`,
  description: `${APP_NAME}: browse the catalog, borrow books, and manage loans.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-10">
          {children}
        </main>
        <footer className="border-t border-border">
          <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-muted">
            {APP_NAME} · a small private lending library
          </div>
        </footer>
      </body>
    </html>
  );
}
