import type { StructuredBrief, ModelProfile, ModelSelection } from "./types.js";
import { MODEL_REGISTRY, getImageModels, getVideoModels } from "./models.js";

/**
 * Select the most APPROPRIATE model — not the best, not the cheapest.
 * Matches the brief's actual needs to avoid overspending on quality
 * the user doesn't need, while ensuring the output meets expectations.
 */
export function selectModel(brief: StructuredBrief): ModelSelection {
  const candidates =
    brief.outputType === "video" ? getVideoModels() : getImageModels();

  const scored = candidates.map((model) => ({
    model,
    score: scoreModel(model, brief),
    reasons: explainScore(model, brief),
  }));

  // Sort by score descending (highest = best fit)
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const alternatives = scored
    .slice(1, 4)
    .map((s) => s.model);

  return {
    model: best.model,
    reasoning: best.reasons.join(". "),
    estimatedCost: estimateCost(best.model, brief),
    alternativeModels: alternatives,
  };
}

/**
 * Select models for both image and video when brief needs both.
 */
export function selectModels(brief: StructuredBrief): {
  image?: ModelSelection;
  video?: ModelSelection;
} {
  const result: { image?: ModelSelection; video?: ModelSelection } = {};

  if (brief.outputType === "image" || brief.outputType === "both") {
    result.image = selectModel({ ...brief, outputType: "image" });
  }
  if (brief.outputType === "video" || brief.outputType === "both") {
    result.video = selectModel({ ...brief, outputType: "video" });
  }

  return result;
}

function scoreModel(model: ModelProfile, brief: StructuredBrief): number {
  let score = 50; // Base score

  // ─── Quality Tier Match (most important) ────────────────────────
  if (model.qualityTier === brief.qualityTier) {
    score += 30; // Perfect match
  } else if (
    (model.qualityTier === "standard" && brief.qualityTier === "draft") ||
    (model.qualityTier === "standard" && brief.qualityTier === "polished")
  ) {
    score += 15; // Adjacent tier — acceptable
  } else if (
    model.qualityTier === "high" && brief.qualityTier === "draft"
  ) {
    score -= 20; // Overkill for a draft
  } else if (
    model.qualityTier === "draft" && brief.qualityTier === "polished"
  ) {
    score -= 25; // Under-qualified for polished output
  }

  // ─── Text Rendering Need ────────────────────────────────────────
  const needsText = brief.textContent && brief.textContent.length > 0;
  if (needsText) {
    if (model.supportsTextRendering) {
      score += 25; // Critical capability match
    } else {
      score -= 30; // Will produce bad text
    }
  }

  // ─── Reference Image Handling ───────────────────────────────────
  const hasRefs = brief.referenceImages.length > 0;
  if (hasRefs) {
    if (model.supportsReferenceImage) {
      score += 20;
    } else {
      score -= 10; // Can't use the references
    }
  }

  // ─── Budget Sensitivity ─────────────────────────────────────────
  if (brief.budgetSensitivity === "high") {
    // Penalize expensive models more
    if (model.costPerUnit > 0.1) score -= 15;
    else if (model.costPerUnit > 0.03) score -= 5;
    else score += 10;
  } else if (brief.budgetSensitivity === "low") {
    // Budget isn't a concern — prefer quality
    if (model.qualityTier === "high") score += 10;
  }

  // ─── Speed vs Quality Tradeoff ──────────────────────────────────
  if (brief.qualityTier === "draft") {
    if (model.speedTier === "fast") score += 10;
    if (model.speedTier === "slow") score -= 10;
  }
  if (brief.qualityTier === "polished") {
    if (model.speedTier === "slow") score += 5; // Slower often = higher quality
  }

  // ─── Graphic Design / Vector Need ───────────────────────────────
  const isGraphicDesign =
    brief.style?.toLowerCase().includes("vector") ||
    brief.style?.toLowerCase().includes("graphic design") ||
    brief.style?.toLowerCase().includes("logo") ||
    brief.style?.toLowerCase().includes("icon");
  if (isGraphicDesign && model.id === "fal-ai/recraft/v3/text-to-image") {
    score += 20;
  }

  return score;
}

function explainScore(model: ModelProfile, brief: StructuredBrief): string[] {
  const reasons: string[] = [];

  if (model.qualityTier === brief.qualityTier) {
    reasons.push(`Quality tier matches (${brief.qualityTier})`);
  } else {
    reasons.push(
      `${model.qualityTier} quality for a ${brief.qualityTier} brief`
    );
  }

  const needsText = brief.textContent && brief.textContent.length > 0;
  if (needsText && model.supportsTextRendering) {
    reasons.push("Supports text rendering (needed for this brief)");
  } else if (needsText && !model.supportsTextRendering) {
    reasons.push("Warning: does not support text rendering well");
  }

  if (brief.referenceImages.length > 0 && model.supportsReferenceImage) {
    reasons.push("Can use your reference images");
  }

  reasons.push(`Cost: ${model.costDescription}`);

  if (brief.budgetSensitivity === "high") {
    reasons.push("Budget-conscious selection");
  }

  return reasons;
}

function estimateCost(model: ModelProfile, brief: StructuredBrief): string {
  let estimate: number;

  switch (model.unit) {
    case "megapixel": {
      const w = brief.dimensions?.width || 1024;
      const h = brief.dimensions?.height || 1024;
      const mp = (w * h) / 1_000_000;
      estimate = model.costPerUnit * mp;
      return `~$${estimate.toFixed(3)} (${mp.toFixed(1)}MP)`;
    }
    case "image":
      return `~$${model.costPerUnit.toFixed(2)} per image`;
    case "second": {
      const duration = brief.videoDuration || 5;
      estimate = model.costPerUnit * duration;
      return `~$${estimate.toFixed(2)} (${duration}s clip)`;
    }
    case "video":
      return `~$${model.costPerUnit.toFixed(2)} per video`;
    default:
      return model.costDescription;
  }
}
