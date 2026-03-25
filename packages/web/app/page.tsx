"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InputMode = "upload" | "notion";

export default function Home() {
  const [mode, setMode] = useState<InputMode>("upload");
  const [url, setUrl] = useState("");
  const [markdownFile, setMarkdownFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    <div className="flex flex-col items-center gap-12 pt-16">
      {/* Hero */}
      <div className="text-center max-w-lg">
        <h2 className="font-pixel text-lg text-text-bright leading-loose tracking-wide">
          BRIEFS IN.
          <br />
          <span className="text-accent-cyan">DRAFTS OUT.</span>
        </h2>
        <p className="mt-5 text-sm text-text-secondary leading-relaxed">
          Drop a Notion export or paste a URL. We ask the right questions,
          pick the cheapest model that fits, and push pixels.
        </p>
      </div>

      {/* Mode toggle — Raycast-style segmented control */}
      <div className="inline-flex rounded-btn bg-surface-2 p-1 border border-surface-4">
        <button
          onClick={() => setMode("upload")}
          className={`font-pixel text-[9px] uppercase tracking-wider px-5 py-2.5 rounded-[6px] transition-all duration-150 ${
            mode === "upload"
              ? "bg-surface-4 text-accent-cyan shadow-sm"
              : "text-muted hover:text-text-secondary"
          }`}
        >
          Upload Files
        </button>
        <button
          onClick={() => setMode("notion")}
          className={`font-pixel text-[9px] uppercase tracking-wider px-5 py-2.5 rounded-[6px] transition-all duration-150 ${
            mode === "notion"
              ? "bg-surface-4 text-accent-cyan shadow-sm"
              : "text-muted hover:text-text-secondary"
          }`}
        >
          Notion URL
        </button>
      </div>

      {/* Upload mode */}
      {mode === "upload" && (
        <form onSubmit={handleUploadSubmit} className="w-full max-w-xl">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleMediaDrop}
            className="card p-10 text-center hover:border-accent-cyan/20 transition-all duration-200 group"
          >
            {/* Minimal pixel art arrow icon */}
            <div className="flex justify-center mb-5 opacity-40 group-hover:opacity-60 transition-opacity">
              <div className="grid grid-cols-5 gap-[2px]">
                {[
                  0,0,1,0,0,
                  0,1,1,1,0,
                  1,0,1,0,1,
                  0,0,1,0,0,
                  0,0,1,0,0,
                ].map((on, i) => (
                  <div
                    key={i}
                    className={`h-[5px] w-[5px] ${
                      on ? "bg-accent-cyan" : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="font-pixel text-[10px] text-text-secondary tracking-wider">
              DROP FILES HERE
            </p>
            <p className="mt-2 text-xs text-muted">
              .md brief + images/videos from Notion export
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <label className="btn-secondary cursor-pointer !text-[9px] !px-4 !py-2">
                CHOOSE .MD
                <input
                  type="file"
                  accept=".md,.markdown,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setMarkdownFile(e.target.files[0]);
                  }}
                />
              </label>
              <label className="btn-secondary cursor-pointer !text-[9px] !px-4 !py-2">
                ADD MEDIA
                <input
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

          {/* Selected files */}
          {(markdownFile || mediaFiles.length > 0) && (
            <div className="mt-3 space-y-1.5">
              {markdownFile && (
                <div className="flex items-center justify-between rounded-btn bg-surface-2 border border-surface-4 px-4 py-2.5">
                  <span className="text-xs text-accent-green font-mono">
                    {markdownFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMarkdownFile(null)}
                    className="font-pixel text-[8px] text-muted hover:text-accent-red transition-colors"
                  >
                    [x]
                  </button>
                </div>
              )}
              {mediaFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-btn bg-surface-2 border border-surface-4 px-4 py-2.5"
                >
                  <span className="text-xs text-text-secondary font-mono">
                    <span className="text-muted">
                      {file.type.startsWith("video/") ? "[vid] " : "[img] "}
                    </span>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="font-pixel text-[8px] text-muted hover:text-accent-red transition-colors"
                  >
                    [x]
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !markdownFile}
            className="btn-primary w-full mt-5"
          >
            {loading ? "LOADING..." : "START"}
          </button>
        </form>
      )}

      {/* Notion URL mode */}
      {mode === "notion" && (
        <form onSubmit={handleNotionSubmit} className="w-full max-w-xl">
          <p className="mb-3 font-pixel text-[8px] text-muted tracking-wider">
            REQUIRES NOTION_API_KEY ON SERVER
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://notion.so/your-brief..."
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="btn-primary"
            >
              {loading ? "..." : "GO"}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="w-full max-w-xl card px-5 py-4 !border-accent-red/30">
          <p className="font-pixel text-[9px] text-accent-red tracking-wider">
            ERROR
          </p>
          <p className="text-xs text-text-secondary mt-1">{error}</p>
        </div>
      )}

      {/* Steps */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xl">
        {[
          { n: "01", label: "LOAD BRIEF", desc: "Upload export or paste URL" },
          { n: "02", label: "CLARIFY", desc: "AI asks what's missing" },
          { n: "03", label: "GENERATE", desc: "Get image & video drafts" },
        ].map(({ n, label, desc }) => (
          <div key={n} className="card p-5 text-center">
            <div className="font-pixel text-base text-accent-cyan/20">{n}</div>
            <div className="font-pixel text-[8px] text-text-secondary mt-2 tracking-widest">
              {label}
            </div>
            <div className="text-[11px] text-muted mt-1.5 leading-relaxed">
              {desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
