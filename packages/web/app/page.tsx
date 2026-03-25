"use client";

import { useState, useRef } from "react";
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
    <div className="flex flex-col items-center gap-10 pt-12">
      {/* Hero */}
      <div className="text-center">
        <h2 className="font-pixel text-xl text-retro-bright leading-relaxed">
          BRIEFS IN.
          <br />
          <span className="text-retro-cyan">DRAFTS OUT.</span>
        </h2>
        <p className="mt-4 text-sm text-retro-muted max-w-md">
          Drop a Notion export or paste a URL. We ask the right questions,
          pick the cheapest model that fits, and push pixels.
        </p>
      </div>

      {/* Mode toggle — pixel tab style */}
      <div className="flex">
        <button
          onClick={() => setMode("upload")}
          className={`font-pixel text-[10px] uppercase tracking-wider px-5 py-3 border-2 transition-all duration-0 ${
            mode === "upload"
              ? "bg-retro-panel border-retro-cyan text-retro-cyan border-b-retro-panel z-10"
              : "bg-retro-dark border-retro-border text-retro-muted hover:text-retro-text"
          }`}
        >
          Upload Files
        </button>
        <button
          onClick={() => setMode("notion")}
          className={`font-pixel text-[10px] uppercase tracking-wider px-5 py-3 border-2 -ml-[2px] transition-all duration-0 ${
            mode === "notion"
              ? "bg-retro-panel border-retro-cyan text-retro-cyan border-b-retro-panel z-10"
              : "bg-retro-dark border-retro-border text-retro-muted hover:text-retro-text"
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
            className="pixel-card p-8 text-center hover:border-retro-cyan transition-colors duration-100"
          >
            {/* Pixel art drop icon */}
            <div className="flex justify-center mb-4">
              <div className="grid grid-cols-5 gap-[2px]">
                {[0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0, 0,0,1,0,0, 0,0,1,0,0].map((on, i) => (
                  <div
                    key={i}
                    className={`h-[6px] w-[6px] ${on ? "bg-retro-cyan opacity-60" : "bg-transparent"}`}
                  />
                ))}
              </div>
            </div>

            <p className="font-pixel text-[10px] text-retro-text tracking-wider">
              DROP FILES HERE
            </p>
            <p className="mt-2 text-xs text-retro-muted">
              .md brief + images/videos from Notion export
            </p>

            <div className="mt-5 flex justify-center gap-3">
              <label className="pixel-btn-secondary cursor-pointer text-[9px] px-4 py-2">
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
              <label className="pixel-btn-secondary cursor-pointer text-[9px] px-4 py-2">
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
            <div className="mt-3 space-y-1">
              {markdownFile && (
                <div className="flex items-center justify-between pixel-border px-3 py-2">
                  <span className="text-xs text-retro-green font-mono">
                    &gt; {markdownFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMarkdownFile(null)}
                    className="font-pixel text-[8px] text-retro-red hover:text-retro-bright"
                  >
                    [X]
                  </button>
                </div>
              )}
              {mediaFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between pixel-border px-3 py-2"
                >
                  <span className="text-xs text-retro-text font-mono">
                    &gt; {file.type.startsWith("video/") ? "[VID]" : "[IMG]"}{" "}
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="font-pixel text-[8px] text-retro-red hover:text-retro-bright"
                  >
                    [X]
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !markdownFile}
            className="pixel-btn w-full mt-4"
          >
            {loading ? "LOADING..." : "START"}
          </button>
        </form>
      )}

      {/* Notion URL mode */}
      {mode === "notion" && (
        <form onSubmit={handleNotionSubmit} className="w-full max-w-xl">
          <p className="mb-3 font-pixel text-[8px] text-retro-muted tracking-wider">
            REQUIRES NOTION_API_KEY ON SERVER
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://notion.so/your-brief..."
              className="pixel-input flex-1"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="pixel-btn"
            >
              {loading ? "..." : "GO"}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="w-full max-w-xl pixel-border px-4 py-3 border-retro-red">
          <p className="font-pixel text-[9px] text-retro-red">ERROR:</p>
          <p className="text-xs text-retro-text mt-1">{error}</p>
        </div>
      )}

      {/* Steps — pixel style */}
      <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-xl">
        {[
          { step: "01", label: "LOAD BRIEF", desc: "Upload or paste URL" },
          { step: "02", label: "CLARIFY", desc: "AI asks what's missing" },
          { step: "03", label: "GENERATE", desc: "Get image & video drafts" },
        ].map(({ step, label, desc }) => (
          <div key={step} className="pixel-card p-4 text-center">
            <div className="font-pixel text-lg text-retro-cyan opacity-30">
              {step}
            </div>
            <div className="font-pixel text-[8px] text-retro-text mt-2 tracking-wider">
              {label}
            </div>
            <div className="text-[11px] text-retro-muted mt-1">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
