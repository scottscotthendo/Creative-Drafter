import { fal } from "@fal-ai/client";
import type {
  StructuredBrief,
  ModelProfile,
  GenerationResult,
  GeneratedMedia,
} from "./types.js";
import { HEIDI_BRAND_REFERENCE_IMAGES } from "./heidi-brand.js";

export function configureGenerator(falKey: string) {
  fal.config({ credentials: falKey });
}

/**
 * Generate creative assets using fal.ai.
 * Builds model-specific parameters and handles the queue lifecycle.
 */
export async function generate(
  brief: StructuredBrief,
  model: ModelProfile,
  prompt: string,
  options?: {
    negativePrompt?: string;
    referenceImageUrls?: string[];
    seed?: number;
    numVariants?: number;
  }
): Promise<GenerationResult> {
  const params = buildParams(brief, model, prompt, options);

  try {
    const result = await fal.subscribe(model.id, {
      input: params,
      logs: true,
    });

    const data = result.data as Record<string, unknown>;
    return {
      id: (result.requestId as string) || crypto.randomUUID(),
      status: "completed",
      outputs: extractOutputs(data, model.type),
      modelUsed: model.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      id: crypto.randomUUID(),
      status: "failed",
      outputs: [],
      modelUsed: model.id,
      cost: undefined,
      duration: undefined,
    };
  }
}

/**
 * Submit a generation job without waiting for results.
 * Returns a request ID for polling.
 */
export async function submitGeneration(
  brief: StructuredBrief,
  model: ModelProfile,
  prompt: string,
  options?: {
    negativePrompt?: string;
    referenceImageUrls?: string[];
    seed?: number;
  }
): Promise<string> {
  const params = buildParams(brief, model, prompt, options);

  const { request_id } = await fal.queue.submit(model.id, {
    input: params,
  });

  return request_id;
}

/**
 * Check the status of a queued generation.
 */
export async function checkStatus(
  modelId: string,
  requestId: string
): Promise<GenerationResult> {
  const status = await fal.queue.status(modelId, {
    requestId,
    logs: true,
  });

  if (status.status === "COMPLETED") {
    const result = await fal.queue.result(modelId, { requestId });
    const data = result.data as Record<string, unknown>;
    const type = modelId.includes("video") ? "video" : "image";

    return {
      id: requestId,
      status: "completed",
      outputs: extractOutputs(data, type),
      modelUsed: modelId,
    };
  }

  return {
    id: requestId,
    status: status.status === "IN_QUEUE" ? "pending" : "processing",
    outputs: [],
    modelUsed: modelId,
  };
}

function buildParams(
  brief: StructuredBrief,
  model: ModelProfile,
  prompt: string,
  options?: {
    negativePrompt?: string;
    referenceImageUrls?: string[];
    seed?: number;
    numVariants?: number;
  }
): Record<string, unknown> {
  const params: Record<string, unknown> = { prompt };

  if (options?.seed != null) {
    params.seed = options.seed;
  }

  // ─── Image model parameters ──────────────────────────────────
  if (model.type === "image") {
    if (brief.dimensions) {
      params.image_size = {
        width: brief.dimensions.width,
        height: brief.dimensions.height,
      };
    } else if (brief.aspectRatio) {
      params.image_size = mapAspectRatio(brief.aspectRatio);
    }

    // FLUX-specific params
    if (model.id.includes("flux")) {
      if (model.id === "fal-ai/flux/schnell") {
        params.num_inference_steps = 4;
      } else if (model.id === "fal-ai/flux/dev") {
        params.num_inference_steps = 28;
        params.guidance_scale = 3.5;
      }

      if (options?.negativePrompt) {
        params.negative_prompt = options.negativePrompt;
      }
    }

    // FLUX General — reference images via IP-Adapter
    // Use user-provided refs if available, otherwise auto-inject a Heidi brand illustration
    if (model.id === "fal-ai/flux-general") {
      const refUrl = options?.referenceImageUrls?.[0] ?? HEIDI_BRAND_REFERENCE_IMAGES[0];
      params.ip_adapter = {
        ip_adapter_image_url: refUrl,
        scale: 0.45,
      };
    }

    // Ideogram-specific params
    if (model.id === "fal-ai/ideogram/v3") {
      if (brief.qualityTier === "draft") {
        params.rendering_speed = "TURBO";
      } else if (brief.qualityTier === "polished") {
        params.rendering_speed = "QUALITY";
      } else {
        params.rendering_speed = "BALANCED";
      }
    }

    // Recraft-specific params
    if (model.id === "fal-ai/recraft/v3/text-to-image") {
      if (
        brief.style?.toLowerCase().includes("vector")
      ) {
        params.style = "vector_illustration";
      }
    }

    // Number of variants
    if (options?.numVariants && options.numVariants > 1) {
      params.num_images = options.numVariants;
    }
  }

  // ─── Video model parameters ──────────────────────────────────
  if (model.type === "video") {
    const duration = brief.videoDuration || 5;

    // Use user-provided reference image, or auto-inject a Heidi brand illustration
    // as the starting frame. All video models are image-to-video and require an image.
    const refImageUrl =
      options?.referenceImageUrls?.[0] ?? HEIDI_BRAND_REFERENCE_IMAGES[2]; // generate-documents.png
    params.image_url = refImageUrl;

    // LTX params
    if (model.id.includes("ltx")) {
      params.num_frames = Math.min(duration * 25, 500); // 25fps
      params.frames_per_second = 25;
      if (brief.dimensions) {
        params.width = brief.dimensions.width;
        params.height = brief.dimensions.height;
      }
    }

    // Veo params
    if (model.id.includes("veo")) {
      params.duration = `${duration}s`;
      params.aspect_ratio = brief.aspectRatio === "9:16" ? "9:16" : "16:9";
    }

    // Kling params
    if (model.id.includes("kling")) {
      params.duration = duration;
      params.fps = 30;
    }

    // WAN params
    if (model.id.includes("wan")) {
      params.num_frames = Math.min(duration * 16, 100);
      params.frames_per_second = 16;
    }

    // CogVideo params
    if (model.id.includes("cogvideo")) {
      params.num_frames = 48;
    }
  }

  return params;
}

function mapAspectRatio(ratio: string): string {
  const map: Record<string, string> = {
    "1:1": "square",
    "16:9": "landscape_16_9",
    "9:16": "portrait_16_9",
    "4:3": "landscape_4_3",
    "3:4": "portrait_4_3",
    "4:5": "portrait_4_5",
    "5:4": "landscape_5_4",
  };
  return map[ratio] || "square";
}

function extractOutputs(
  data: Record<string, unknown>,
  type: "image" | "video"
): GeneratedMedia[] {
  const outputs: GeneratedMedia[] = [];

  // fal.ai returns images in an `images` array or video in a `video` object
  if (type === "image") {
    const images = (data.images as Array<Record<string, unknown>>) || [];
    for (const img of images) {
      outputs.push({
        url: (img.url as string) || "",
        type: "image",
        width: img.width as number | undefined,
        height: img.height as number | undefined,
        format: (img.content_type as string) || "image/png",
        seed: img.seed as number | undefined,
      });
    }
    // Some models return a single `image` instead of `images`
    if (outputs.length === 0 && data.image) {
      const img = data.image as Record<string, unknown>;
      outputs.push({
        url: (img.url as string) || "",
        type: "image",
        width: img.width as number | undefined,
        height: img.height as number | undefined,
      });
    }
  }

  if (type === "video") {
    const video = data.video as Record<string, unknown> | undefined;
    if (video) {
      outputs.push({
        url: (video.url as string) || "",
        type: "video",
        width: video.width as number | undefined,
        height: video.height as number | undefined,
        format: (video.content_type as string) || "video/mp4",
      });
    }
    // Some models return `video_url` directly
    if (outputs.length === 0 && data.video_url) {
      outputs.push({
        url: data.video_url as string,
        type: "video",
      });
    }
  }

  return outputs;
}
