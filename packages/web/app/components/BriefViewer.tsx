"use client";

import type { NotionBrief } from "@pixel-pusher/core/client";

export function BriefViewer({ brief }: { brief: NotionBrief }) {
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-pixel text-[9px] text-accent-cyan tracking-widest mb-2">
            BRIEF LOADED
          </p>
          <h2 className="text-base font-semibold text-text-bright">
            {brief.title}
          </h2>
        </div>
        <div className="flex gap-2">
          {brief.images.length > 0 && (
            <span className="tag">{brief.images.length} img</span>
          )}
          {brief.videos.length > 0 && (
            <span className="tag">{brief.videos.length} vid</span>
          )}
        </div>
      </div>

      <div className="terminal p-4 max-h-60 overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">
          {brief.bodyText || "> (empty brief body)"}
        </pre>
      </div>

      {Object.keys(brief.properties).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(brief.properties).map(([key, value]) => (
            <span key={key} className="tag">
              {key}: {value}
            </span>
          ))}
        </div>
      )}

      {brief.warnings && brief.warnings.length > 0 && (
        <div className="mt-4 rounded-btn border border-accent-yellow/20 bg-accent-yellow/5 p-4">
          <p className="font-pixel text-[8px] text-accent-yellow tracking-wider mb-1">
            WARNING
          </p>
          {brief.warnings.map((warning, i) => (
            <p key={i} className="text-xs text-accent-yellow/80 leading-relaxed">
              {warning}
            </p>
          ))}
        </div>
      )}

      {brief.images.length > 0 && (
        <div className="mt-4">
          <p className="font-pixel text-[8px] text-muted tracking-widest mb-3">
            REFERENCE IMAGES
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {brief.images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.name}
                className="h-20 w-20 rounded-btn object-cover border border-surface-4"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
