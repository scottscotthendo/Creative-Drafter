"use client";

import { useMemo } from "react";
import type { StructuredBrief } from "@pixel-pusher/core";
import { selectModels } from "@pixel-pusher/core";

export function ModelRecommendation({ brief }: { brief: StructuredBrief }) {
  const selections = useMemo(() => selectModels(brief), [brief]);

  return (
    <div className="pixel-card p-6">
      <p className="font-pixel text-[9px] text-retro-green tracking-widest mb-4">
        MODEL SELECTED
      </p>

      <div className="space-y-3">
        {selections.image && (
          <div className="pixel-border p-4 bg-retro-dark">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="pixel-tag text-[8px]">IMAGE</span>
                <span className="font-pixel text-[10px] text-retro-bright">
                  {selections.image.model.name}
                </span>
              </div>
              <span className="pixel-tag-green text-[9px] font-pixel px-3 py-1">
                {selections.image.estimatedCost}
              </span>
            </div>
            <p className="text-xs text-retro-muted font-mono">
              &gt; {selections.image.reasoning}
            </p>
            {selections.image.alternativeModels.length > 0 && (
              <p className="mt-2 text-[10px] text-retro-muted opacity-60">
                ALT: {selections.image.alternativeModels.map((m) => m.name).join(" | ")}
              </p>
            )}
          </div>
        )}

        {selections.video && (
          <div className="pixel-border p-4 bg-retro-dark">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="pixel-tag text-[8px]">VIDEO</span>
                <span className="font-pixel text-[10px] text-retro-bright">
                  {selections.video.model.name}
                </span>
              </div>
              <span className="pixel-tag-green text-[9px] font-pixel px-3 py-1">
                {selections.video.estimatedCost}
              </span>
            </div>
            <p className="text-xs text-retro-muted font-mono">
              &gt; {selections.video.reasoning}
            </p>
            {selections.video.alternativeModels.length > 0 && (
              <p className="mt-2 text-[10px] text-retro-muted opacity-60">
                ALT: {selections.video.alternativeModels.map((m) => m.name).join(" | ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Brief metadata */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-retro-muted">
        <div>
          <span className="text-retro-cyan">OUTPUT:</span> {brief.outputType}
        </div>
        <div>
          <span className="text-retro-cyan">QUALITY:</span> {brief.qualityTier}
        </div>
        {brief.style && (
          <div>
            <span className="text-retro-cyan">STYLE:</span> {brief.style}
          </div>
        )}
        {brief.mood && (
          <div>
            <span className="text-retro-cyan">MOOD:</span> {brief.mood}
          </div>
        )}
        {brief.aspectRatio && (
          <div>
            <span className="text-retro-cyan">RATIO:</span> {brief.aspectRatio}
          </div>
        )}
        {brief.videoDuration && (
          <div>
            <span className="text-retro-cyan">DURATION:</span>{" "}
            {brief.videoDuration}s
          </div>
        )}
      </div>
    </div>
  );
}
