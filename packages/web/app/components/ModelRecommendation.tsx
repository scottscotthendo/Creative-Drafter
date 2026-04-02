"use client";

import { useMemo } from "react";
import type { StructuredBrief } from "@heidi/core/client";
import { selectModels } from "@heidi/core/client";

export function ModelRecommendation({ brief }: { brief: StructuredBrief }) {
  const selections = useMemo(() => selectModels(brief), [brief]);

  return (
    <div className="card p-6">
      <p className="font-body text-xs font-semibold text-forest uppercase tracking-wide mb-5">
        Recommended model
      </p>

      <div className="space-y-3">
        {selections.image && (
          <div className="rounded-btn bg-surface-1 border border-surface-3 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="tag">Image</span>
                <span className="font-body text-sm font-semibold text-bark">
                  {selections.image.model.name}
                </span>
              </div>
              <span className="tag-success">
                {selections.image.estimatedCost}
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {selections.image.reasoning}
            </p>
            {selections.image.alternativeModels.length > 0 && (
              <p className="mt-2 text-xs text-text-muted">
                Alternatives: {selections.image.alternativeModels.map((m) => m.name).join(" / ")}
              </p>
            )}
          </div>
        )}

        {selections.video && (
          <div className="rounded-btn bg-surface-1 border border-surface-3 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="tag">Video</span>
                <span className="font-body text-sm font-semibold text-bark">
                  {selections.video.model.name}
                </span>
              </div>
              <span className="tag-success">
                {selections.video.estimatedCost}
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {selections.video.reasoning}
            </p>
            {selections.video.alternativeModels.length > 0 && (
              <p className="mt-2 text-xs text-text-muted">
                Alternatives: {selections.video.alternativeModels.map((m) => m.name).join(" / ")}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        <div>
          <span className="text-text-muted">Output</span>{" "}
          <span className="text-text-secondary">{brief.outputType}</span>
        </div>
        <div>
          <span className="text-text-muted">Quality</span>{" "}
          <span className="text-text-secondary">{brief.qualityTier}</span>
        </div>
        {brief.style && (
          <div>
            <span className="text-text-muted">Style</span>{" "}
            <span className="text-text-secondary">{brief.style}</span>
          </div>
        )}
        {brief.mood && (
          <div>
            <span className="text-text-muted">Mood</span>{" "}
            <span className="text-text-secondary">{brief.mood}</span>
          </div>
        )}
        {brief.aspectRatio && (
          <div>
            <span className="text-text-muted">Ratio</span>{" "}
            <span className="text-text-secondary">{brief.aspectRatio}</span>
          </div>
        )}
        {brief.videoDuration && (
          <div>
            <span className="text-text-muted">Duration</span>{" "}
            <span className="text-text-secondary">{brief.videoDuration}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
