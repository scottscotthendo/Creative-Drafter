"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type InputMode = "notion" | "upload";

export default function Home() {
  const [mode, setMode] = useState<InputMode>("upload");
  const [url, setUrl] = useState("");
  const [markdownFile, setMarkdownFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleNotionSubmit(e: React.FormEvent) {
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
      sessionStorage.setItem("brief", JSON.stringify(data.brief));
      router.push("/draft");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!markdownFile) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("markdown", markdownFile);
      for (const file of mediaFiles) {
        formData.append("media", file);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to parse brief");
      }

      const data = await res.json();
      sessionStorage.setItem("brief", JSON.stringify(data.brief));
      router.push("/draft");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleMediaDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const mdFile = files.find((f) => f.name.endsWith(".md"));
    const media = files.filter((f) => !f.name.endsWith(".md"));

    if (mdFile) setMarkdownFile(mdFile);
    if (media.length) setMediaFiles((prev) => [...prev, ...media]);
  }

  return (
    <div className="flex flex-col items-center gap-10 pt-16">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Design briefs → drafts
        </h2>
        <p className="mt-3 text-zinc-400">
          Upload a Notion export or paste a Notion URL to generate creative
          assets
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-zinc-700 bg-zinc-900 p-1">
        <button
          onClick={() => setMode("upload")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === "upload"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Upload files
        </button>
        <button
          onClick={() => setMode("notion")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === "notion"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Notion URL
        </button>
      </div>

      {/* Upload mode */}
      {mode === "upload" && (
        <form onSubmit={handleUploadSubmit} className="w-full max-w-xl">
          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleMediaDrop}
            className="rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900 p-8 text-center hover:border-zinc-500 transition-colors"
          >
            <p className="text-sm text-zinc-400">
              Drop your Notion export here
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              .md file + images/videos, or drag them separately
            </p>

            <div className="mt-4 flex justify-center gap-3">
              <label className="cursor-pointer rounded-md bg-zinc-800 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-700">
                Choose .md file
                <input
                  type="file"
                  accept=".md,.markdown,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setMarkdownFile(e.target.files[0]);
                  }}
                />
              </label>
              <label className="cursor-pointer rounded-md bg-zinc-800 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-700">
                Add images/videos
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setMediaFiles((prev) => [
                        ...prev,
                        ...Array.from(e.target.files!),
                      ]);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Selected files summary */}
          {(markdownFile || mediaFiles.length > 0) && (
            <div className="mt-4 space-y-2">
              {markdownFile && (
                <div className="flex items-center justify-between rounded-md bg-zinc-900 px-3 py-2 text-sm">
                  <span className="text-zinc-300">{markdownFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setMarkdownFile(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    remove
                  </button>
                </div>
              )}
              {mediaFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md bg-zinc-900 px-3 py-2 text-sm"
                >
                  <span className="text-zinc-400">
                    {file.type.startsWith("video/") ? "Video" : "Image"}:{" "}
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !markdownFile}
            className="mt-4 w-full rounded-lg bg-white py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Parsing..." : "Start"}
          </button>
        </form>
      )}

      {/* Notion URL mode */}
      {mode === "notion" && (
        <form onSubmit={handleNotionSubmit} className="w-full max-w-xl">
          <p className="mb-3 text-xs text-zinc-500">
            Requires NOTION_API_KEY configured on the server. The page must be
            shared with your integration.
          </p>
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
        </form>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-6 text-center text-sm text-zinc-500">
        <div>
          <div className="mb-2 text-lg">1</div>
          <div>Upload brief or paste Notion URL</div>
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
