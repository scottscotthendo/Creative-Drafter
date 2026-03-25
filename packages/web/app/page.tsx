"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notionUrl: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch brief");
      }

      const data = await res.json();
      // Store brief in sessionStorage and navigate to draft page
      sessionStorage.setItem("brief", JSON.stringify(data.brief));
      router.push("/draft");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-12 pt-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Design briefs → drafts
        </h2>
        <p className="mt-3 text-zinc-400">
          Paste a Notion page URL to start generating creative assets
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://notion.so/your-brief-page..."
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm placeholder-zinc-500 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Start"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}
      </form>

      <div className="mt-8 grid grid-cols-3 gap-6 text-center text-sm text-zinc-500">
        <div>
          <div className="mb-2 text-lg">1</div>
          <div>Paste your Notion brief URL</div>
        </div>
        <div>
          <div className="mb-2 text-lg">2</div>
          <div>Answer clarifying questions</div>
        </div>
        <div>
          <div className="mb-2 text-lg">3</div>
          <div>Get image & video drafts</div>
        </div>
      </div>
    </div>
  );
}
