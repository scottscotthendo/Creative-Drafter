import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heidi Creative Studio",
  description: "AI-assisted creative drafting for Heidi Health",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-surface-3 bg-surface-0/90 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logos/Logomark_Dark.svg"
                alt="Heidi Health"
                className="h-7 w-7"
              />
              <span className="font-display text-base font-semibold text-bark tracking-tight">
                Creative Studio
              </span>
            </div>
            <span className="text-xs text-text-muted font-body">by Heidi Health</span>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
