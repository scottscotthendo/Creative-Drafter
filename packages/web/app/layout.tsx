import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixel Pusher",
  description: "Generate design drafts from briefs using AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen scanlines">
        {/* Header */}
        <header className="border-b-2 border-retro-border bg-retro-dark px-6 py-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Pixel art logo — a tiny sprite */}
              <div className="grid grid-cols-3 grid-rows-3 gap-[2px]">
                <div className="h-2 w-2 bg-retro-cyan" />
                <div className="h-2 w-2 bg-retro-magenta" />
                <div className="h-2 w-2 bg-retro-cyan" />
                <div className="h-2 w-2 bg-retro-magenta" />
                <div className="h-2 w-2 bg-retro-green" />
                <div className="h-2 w-2 bg-retro-magenta" />
                <div className="h-2 w-2 bg-retro-cyan" />
                <div className="h-2 w-2 bg-retro-magenta" />
                <div className="h-2 w-2 bg-retro-cyan" />
              </div>
              <h1 className="font-pixel text-sm text-retro-cyan tracking-wider">
                PIXEL PUSHER
              </h1>
            </div>
            <span className="font-pixel text-[10px] text-retro-muted">
              v0.1
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>

        {/* Footer */}
        <footer className="mt-auto border-t-2 border-retro-border px-6 py-4">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-pixel text-[8px] text-retro-muted tracking-widest">
              BRIEF → CLARIFY → SELECT MODEL → GENERATE
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
