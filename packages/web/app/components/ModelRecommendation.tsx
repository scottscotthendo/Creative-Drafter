"use client";

import { useMemo } from "react";
import type { StructuredBrief } from "@pixel-pusher/core";

// We import the selector logic client-side since it's pure functions (no API calls)
// This gives instant feedback without a round-trip
import { selectModels } from "@pixel-pusher/core";

export function ModelRecommendation({ brief }: { brief: StructuredBrief }) {
  const selections = useMemo(() => selectModels(brief), [brief]);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
        Model Recommendation
      </h3>

      <div className="space-y-4">
        {selections.image && (
          <div className="rounded-md border border-zinc-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-500">IMAGE</span>
                <p className="text-sm font-semibold">
                  {selections.image.model.name}
                </p>
              </div>
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-emerald-400">
                {selections.image.estimatedCost}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              {selections.image.reasoning}
            </p>
            {selections.image.alternativeModels.length > 0 && (
              <p className="mt-2 text-xs text-zinc-600">
                Alternatives:{" "}
                {selections.image.alternativeModels
                  .map((m) => m.name)
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        {selections.video && (
          <div className="rounded-md border border-zinc-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-500">VIDEO</span>
                <p className="text-sm font-semibold">
                  {selections.video.model.name}
                </p>
              </div>
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-emerald-400">
                {selections.video.estimatedCost}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              {selections.video.reasoning}
            </p>
            {selections.video.alternativeModels.length > 0 && (
              <p className="mt-2 text-xs text-zinc-600">
                Alternatives:{" "}
                {selections.video.alternativeModels
                  .map((m) => m.name)
                  .join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Structured brief summary */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-500">
        <div>Output: {brief.outputType}</div>
        <div>Quality: {brief.qualityTier}</div>
        {brief.style && <div>Style: {brief.style}</div>}
        {brief.mood && <div>Mood: {brief.mood}</div>}
        {brief.aspectRatio && <div>Ratio: {brief.aspectRatio}</div>}
        {brief.videoDuration && <div>Duration: {brief.videoDuration}s</div>}
      </div>
    </div>
  );
}
