export interface NotionBrief {
  pageId: string;
  title: string;
  bodyText: string;
  properties: Record<string, string>;
  images: MediaAttachment[];
  videos: MediaAttachment[];
}

export interface MediaAttachment {
  url: string;
  name: string;
  type: "image" | "video";
  localPath?: string;
}

export interface StructuredBrief {
  title: string;
  description: string;
  outputType: "image" | "video" | "both";
  qualityTier: "draft" | "standard" | "polished";
  dimensions?: { width: number; height: number };
  aspectRatio?: string;
  style?: string;
  mood?: string;
  colorPalette?: string[];
  textContent?: string[];
  targetAudience?: string;
  videoDuration?: number;
  referenceImages: MediaAttachment[];
  referenceVideos: MediaAttachment[];
  additionalContext: string;
  budgetSensitivity: "low" | "medium" | "high";
}

export interface ClarificationResult {
  complete: boolean;
  brief?: StructuredBrief;
  questions?: string[];
  analysis?: string;
}

export type ImageModelId =
  | "fal-ai/flux/schnell"
  | "fal-ai/flux/dev"
  | "fal-ai/flux-2-pro"
  | "fal-ai/flux-general"
  | "fal-ai/flux-lora"
  | "fal-ai/ideogram/v3"
  | "fal-ai/recraft/v3/text-to-image";

export type VideoModelId =
  | "fal-ai/ltx-2/image-to-video/fast"
  | "fal-ai/ltx-2/image-to-video"
  | "fal-ai/veo3.1/fast/image-to-video"
  | "fal-ai/veo3.1/image-to-video"
  | "fal-ai/kling-video/v3/pro/image-to-video"
  | "fal-ai/cogvideox-5b"
  | "fal-ai/wan/v2.6/image-to-video/api";

export type ModelId = ImageModelId | VideoModelId;

export interface ModelProfile {
  id: ModelId;
  name: string;
  type: "image" | "video";
  costDescription: string;
  costPerUnit: number;
  unit: "megapixel" | "image" | "second" | "video";
  maxResolution: string;
  strengths: string[];
  weaknesses: string[];
  supportsReferenceImage: boolean;
  supportsTextRendering: boolean;
  speedTier: "fast" | "standard" | "slow";
  qualityTier: "draft" | "standard" | "high";
}

export interface ModelSelection {
  model: ModelProfile;
  reasoning: string;
  estimatedCost: string;
  alternativeModels: ModelProfile[];
}

export interface GenerationRequest {
  brief: StructuredBrief;
  model: ModelProfile;
  prompt: string;
  negativePrompt?: string;
  referenceImageUrls?: string[];
  parameters: Record<string, unknown>;
}

export interface GenerationResult {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  outputs: GeneratedMedia[];
  modelUsed: string;
  cost?: string;
  duration?: number;
}

export interface GeneratedMedia {
  url: string;
  type: "image" | "video";
  width?: number;
  height?: number;
  format?: string;
  seed?: number;
}
