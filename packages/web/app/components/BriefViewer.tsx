"use client";

import type { NotionBrief } from "@heidi/core/client";

export function BriefViewer({ brief }: { brief: NotionBrief }) {
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-body text-xs font-semibold text-forest uppercase tracking-wide mb-2">
            Brief loaded
          </p>
          <h2 className="text-base font-semibold text-bark">
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
          {brief.bodyText || "(empty brief body)"}
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
        <div className="mt-4 rounded-btn border border-status-warning/30 bg-status-warning/5 p-4">
          <p className="font-body text-xs font-semibold text-status-warning mb-1">
            Heads up
          </p>
          {brief.warnings.map((warning, i) => (
            <p key={i} className="text-xs text-status-warning/80 leading-relaxed">
              {warning}
            </p>
          ))}
        </div>
      )}

      {brief.images.length > 0 && (
        <div className="mt-4">
          <p className="font-body text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
            Reference images
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {brief.images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img.url}
                alt={img.name}
                className="h-20 w-20 rounded-btn object-cover border border-surface-3"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
