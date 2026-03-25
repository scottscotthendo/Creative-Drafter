"use client";

import { useMemo } from "react";
import type { StructuredBrief } from "@pixel-pusher/core/client";
import { selectModels } from "@pixel-pusher/core/client";

export function ModelRecommendation({ brief }: { brief: StructuredBrief }) {
  const selections = useMemo(() => selectModels(brief), [brief]);

  return (
    <div className="card p-6">
      <p className="font-pixel text-[9px] text-accent-green tracking-widest mb-5">
        MODEL SELECTED
      </p>

      <div className="space-y-3">
        {selections.image && (
          <div className="rounded-btn bg-surface-1 border border-surface-4 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="tag">IMAGE</span>
                <span className="font-pixel text-[10px] text-text-bright">
                  {selections.image.model.name}
                </span>
              </div>
              <span className="tag-green">
                {selections.image.estimatedCost}
              </span>
            </div>
            <p className="text-xs text-muted font-mono leading-relaxed">
              &gt; {selections.image.reasoning}
            </p>
            {selections.image.alternativeModels.length > 0 && (
              <p className="mt-2 text-[10px] text-subtle">
                alt: {selections.image.alternativeModels.map((m) => m.name).join(" / ")}
              </p>
            )}
          </div>
        )}

        {selections.video && (
          <div className="rounded-btn bg-surface-1 border border-surface-4 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="tag">VIDEO</span>
                <span className="font-pixel text-[10px] text-text-bright">
                  {selections.video.model.name}
                </span>
              </div>
              <span className="tag-green">
                {selections.video.estimatedCost}
              </span>
            </div>
            <p className="text-xs text-muted font-mono leading-relaxed">
              &gt; {selections.video.reasoning}
            </p>
            {selections.video.alternativeModels.length > 0 && (
              <p className="mt-2 text-[10px] text-subtle">
                alt: {selections.video.alternativeModels.map((m) => m.name).join(" / ")}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[11px] text-muted">
        <div>
          <span className="text-accent-cyan/60">output</span>{" "}
          <span className="text-text-secondary">{brief.outputType}</span>
        </div>
        <div>
          <span className="text-accent-cyan/60">quality</span>{" "}
          <span className="text-text-secondary">{brief.qualityTier}</span>
        </div>
        {brief.style && (
          <div>
            <span className="text-accent-cyan/60">style</span>{" "}
            <span className="text-text-secondary">{brief.style}</span>
          </div>
        )}
        {brief.mood && (
          <div>
            <span className="text-accent-cyan/60">mood</span>{" "}
            <span className="text-text-secondary">{brief.mood}</span>
          </div>
        )}
        {brief.aspectRatio && (
          <div>
            <span className="text-accent-cyan/60">ratio</span>{" "}
            <span className="text-text-secondary">{brief.aspectRatio}</span>
          </div>
        )}
        {brief.videoDuration && (
          <div>
            <span className="text-accent-cyan/60">duration</span>{" "}
            <span className="text-text-secondary">{brief.videoDuration}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
