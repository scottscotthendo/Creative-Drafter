"use client";

import type { NotionBrief } from "@pixel-pusher/core";

export function BriefViewer({ brief }: { brief: NotionBrief }) {
  return (
    <div className="pixel-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-pixel text-[9px] text-retro-cyan tracking-widest mb-1">
            BRIEF LOADED
          </p>
          <h2 className="font-pixel text-sm text-retro-bright">{brief.title}</h2>
        </div>
        <div className="flex gap-2">
          {brief.images.length > 0 && (
            <span className="pixel-tag text-[8px]">
              {brief.images.length} IMG
            </span>
          )}
          {brief.videos.length > 0 && (
            <span className="pixel-tag text-[8px]">
              {brief.videos.length} VID
            </span>
          )}
        </div>
      </div>

      <div className="whitespace-pre-wrap text-sm text-retro-text leading-relaxed max-h-60 overflow-y-auto font-mono bg-retro-dark p-4 pixel-border">
        {brief.bodyText || "> (empty brief body)"}
      </div>

      {Object.keys(brief.properties).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(brief.properties).map(([key, value]) => (
            <span key={key} className="pixel-tag text-[8px]">
              {key}: {value}
            </span>
          ))}
        </div>
      )}

      {brief.warnings && brief.warnings.length > 0 && (
        <div className="mt-4 pixel-border border-retro-yellow p-3 bg-retro-dark">
          <p className="font-pixel text-[8px] text-retro-yellow tracking-wider mb-1">
            WARNING
          </p>
          {brief.warnings.map((warning, i) => (
            <p key={i} className="text-xs text-retro-yellow opacity-80">
              {warning}
            </p>
          ))}
        </div>
      )}

      {brief.images.length > 0 && (
        <div className="mt-4">
          <p className="font-pixel text-[8px] text-retro-muted tracking-widest mb-2">
            REFERENCE IMAGES
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {brief.images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.name}
                className="h-20 w-20 object-cover pixel-border"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
