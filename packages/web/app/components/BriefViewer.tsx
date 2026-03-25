"use client";

import type { NotionBrief } from "@creative-drafter/core";

export function BriefViewer({ brief }: { brief: NotionBrief }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{brief.title}</h2>
        <span className="text-xs text-zinc-500">
          {brief.images.length} images · {brief.videos.length} videos
        </span>
      </div>

      <div className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed max-h-60 overflow-y-auto">
        {brief.bodyText || "(empty brief body)"}
      </div>

      {Object.keys(brief.properties).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(brief.properties).map(([key, value]) => (
            <span
              key={key}
              className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
            >
              {key}: {value}
            </span>
          ))}
        </div>
      )}

      {brief.images.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Reference Images
          </p>
          <div className="flex gap-2 overflow-x-auto">
            {brief.images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.name}
                className="h-20 w-20 rounded-md object-cover border border-zinc-700"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
