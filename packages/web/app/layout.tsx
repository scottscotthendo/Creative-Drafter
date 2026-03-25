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
        <header className="border-b border-surface-4 bg-surface-1/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Pixel sprite logo — small and tasteful */}
              <div className="grid grid-cols-3 gap-[2px] opacity-80">
                <div className="h-[5px] w-[5px] rounded-[1px] bg-accent-cyan" />
                <div className="h-[5px] w-[5px] rounded-[1px] bg-accent-magenta" />
                <div className="h-[5px] w-[5px] rounded-[1px] bg-accent-cyan" />
                <div className="h-[5px] w-[5px] rounded-[1px] bg-accent-magenta" />
                <div className="h-[5px] w-[5px] rounded-[1px] bg-accent-green" />
                <div className="h-[5px] w-[5px] rounded-[1px] bg-accent-magenta" />
                <div className="h-[5px] w-[5px] rounded-[1px] bg-accent-cyan" />
                <div className="h-[5px] w-[5px] rounded-[1px] bg-accent-magenta" />
                <div className="h-[5px] w-[5px] rounded-[1px] bg-accent-cyan" />
              </div>
              <h1 className="font-pixel text-[11px] text-text-bright tracking-wider">
                PIXEL PUSHER
              </h1>
            </div>
            <span className="text-xs text-muted font-mono">v0.1</span>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
