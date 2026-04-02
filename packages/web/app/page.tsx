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
        <h2 className="font-display text-4xl font-semibold text-bark leading-tight tracking-tight">
          From brief to draft,
          <br />
          <span className="text-forest">in minutes.</span>
        </h2>
        <p className="mt-4 text-base text-text-secondary font-body leading-relaxed">
          Upload a Notion export or paste a page URL. Heidi Creative Studio
          analyses your brief, asks only what&apos;s missing, and generates
          on-brand assets ready for review.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="inline-flex rounded-btn bg-surface-1 p-1 border border-surface-3">
        <button
          onClick={() => setMode("upload")}
          className={`font-body text-sm font-medium px-5 py-2 rounded-[8px] transition-all duration-150 ${
            mode === "upload"
              ? "bg-white text-bark shadow-card"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Upload files
        </button>
        <button
          onClick={() => setMode("notion")}
          className={`font-body text-sm font-medium px-5 py-2 rounded-[8px] transition-all duration-150 ${
            mode === "notion"
              ? "bg-white text-bark shadow-card"
              : "text-text-muted hover:text-text-secondary"
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
            className="card p-10 text-center hover:border-sunlight/40 transition-all duration-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/illustrations/ask-heidi.png"
              alt=""
              className="h-20 mx-auto mb-4 opacity-90"
            />

            <p className="font-body text-sm font-medium text-text-secondary">
              Drop files here
            </p>
            <p className="mt-1 text-xs text-text-muted">
              .md brief + images/videos from Notion export
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <label className="btn-secondary cursor-pointer">
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
              <label className="btn-secondary cursor-pointer">
                Add media
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
                <div className="flex items-center justify-between rounded-btn bg-surface-1 border border-surface-3 px-4 py-2.5">
                  <span className="text-xs text-status-success font-body">
                    {markdownFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMarkdownFile(null)}
                    className="text-xs text-text-muted hover:text-status-error transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
              {mediaFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-btn bg-surface-1 border border-surface-3 px-4 py-2.5"
                >
                  <span className="text-xs text-text-secondary font-body">
                    <span className="text-text-muted">
                      {file.type.startsWith("video/") ? "video · " : "image · "}
                    </span>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="text-xs text-text-muted hover:text-status-error transition-colors"
                  >
                    Remove
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
            {loading ? "Loading..." : "Analyse brief"}
          </button>
        </form>
      )}

      {/* Notion URL mode */}
      {mode === "notion" && (
        <form onSubmit={handleNotionSubmit} className="w-full max-w-xl">
          <p className="mb-3 text-xs text-text-muted font-body">
            Requires a Notion API key — see setup docs.
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
              {loading ? "..." : "Go"}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="w-full max-w-xl card px-5 py-4 border-status-error/30">
          <p className="font-body text-sm font-semibold text-status-error">
            Something went wrong
          </p>
          <p className="text-xs text-text-secondary mt-1">{error}</p>
        </div>
      )}

      {/* Steps */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xl">
        {[
          {
            n: "01",
            label: "Load your brief",
            desc: "Upload a Notion export or paste the page URL",
          },
          {
            n: "02",
            label: "Clarify together",
            desc: "Heidi asks only what's needed — no guesswork",
          },
          {
            n: "03",
            label: "Generate drafts",
            desc: "Receive on-brand assets ready for review",
          },
        ].map(({ n, label, desc }) => (
          <div key={n} className="card p-5 text-center">
            <div className="font-display text-3xl font-bold text-sunlight opacity-60">
              {n}
            </div>
            <div className="font-body text-sm font-semibold text-bark mt-2">
              {label}
            </div>
            <div className="text-xs text-text-muted mt-1.5 leading-relaxed">
              {desc}
            </div>
          </div>
        ))}
      </div>

      {/* Brand reference grid */}
      <div className="w-full max-w-xl">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Brand reference images
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { src: "/brand/illustrations/ask-heidi.png", label: "Ask Heidi" },
            { src: "/brand/illustrations/note-soap.png", label: "Session notes" },
            {
              src: "/brand/illustrations/generate-documents.png",
              label: "Documents",
            },
            {
              src: "/brand/illustrations/transcript-desktop.png",
              label: "Transcript",
            },
            { src: "/brand/illustrations/note-custom.png", label: "Custom note" },
            {
              src: "/brand/illustrations/note-send-patient.png",
              label: "Send to patient",
            },
          ].map(({ src, label }) => (
            <div
              key={src}
              className="rounded-btn overflow-hidden border border-surface-3 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={label}
                className="w-full h-24 object-cover"
              />
              <p className="text-[11px] text-text-muted text-center py-1.5 font-body">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
