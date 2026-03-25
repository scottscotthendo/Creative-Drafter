import Anthropic from "@anthropic-ai/sdk";
import type { StructuredBrief, ModelProfile } from "./types.js";

/**
 * Prompt engineering strategies per model family.
 * Each model responds best to different prompt structures.
 */
const MODEL_PROMPT_GUIDES: Record<string, string> = {
  flux: `You are crafting a prompt for a FLUX image generation model. FLUX works best with:
- Detailed scene descriptions with specific visual elements
- Lighting and atmosphere keywords (e.g., "soft golden hour lighting", "dramatic chiaroscuro")
- Camera/perspective descriptions (e.g., "shot from below", "close-up", "wide angle")
- Style keywords at the end (e.g., "photorealistic", "cinematic", "8k resolution")
- Material and texture descriptions (e.g., "matte finish", "glossy", "textured paper")
- AVOID putting text/words you want rendered in the image — FLUX is poor at text rendering
- Comma-separated descriptors work well
- Be specific about composition and layout`,

  ideogram: `You are crafting a prompt for Ideogram V3, which EXCELS at text rendering. Ideogram works best with:
- Put any text that should appear in the image in DOUBLE QUOTES (e.g., "SALE 50% OFF")
- Describe the typography style (e.g., "bold sans-serif", "hand-lettered script", "retro block letters")
- Specify text placement (e.g., "centered headline", "text at bottom third")
- Describe the overall layout and composition clearly
- Include design style (e.g., "flat design", "gradient background", "minimalist poster")
- Mention color relationships between text and background
- For marketing materials, describe the visual hierarchy`,

  recraft: `You are crafting a prompt for Recraft V3, specialized in graphic design and vector art. Recraft works best with:
- Design-specific language (e.g., "vector illustration", "flat design", "brand identity")
- Clear style direction (e.g., "modern minimalist", "retro 70s", "corporate clean")
- Color specifications using descriptive terms or hex values
- Composition and layout instructions
- Mention if you want vector vs raster output
- Brand guideline references
- Specify design elements (icons, shapes, patterns)
- Works well with graphic design, logos, illustrations`,

  "ltx-video": `You are crafting a prompt for LTX Video, a fast video generation model. LTX works best with:
- Describe the MOTION first (e.g., "camera slowly pans right", "object rotates 360 degrees")
- Specify camera movement (pan, tilt, zoom, dolly, static)
- Describe temporal flow (what happens first, then, finally)
- Keep descriptions focused — one clear action per clip
- Mention lighting changes if relevant (e.g., "transitions from day to night")
- Specify the mood through movement style (e.g., "smooth and cinematic", "fast and energetic")`,

  veo: `You are crafting a prompt for Google Veo 3.1, a premium cinematic video model. Veo works best with:
- Cinematic language (e.g., "establishing shot", "rack focus", "slow motion")
- Detailed scene descriptions with atmosphere
- Camera movement specifications (tracking shot, crane shot, handheld)
- Lighting descriptions (e.g., "backlit silhouette", "neon-lit", "natural daylight")
- Temporal narrative (beginning, middle, end of the clip)
- Style references (e.g., "in the style of a car commercial", "documentary feel")
- Audio cues if audio is enabled (e.g., "ambient sounds of a busy street")`,

  kling: `You are crafting a prompt for Kling 3.0 Pro, known for excellent motion fluidity. Kling works best with:
- Character and object motion descriptions (e.g., "person walks confidently toward camera")
- Precise movement choreography
- Scene transitions within the clip
- Expression and gesture details for characters
- Environment interaction (e.g., "wind blowing through hair", "water splashing")
- Dynamic camera work descriptions`,

  cogvideo: `You are crafting a prompt for CogVideoX, a budget text-to-video model. CogVideoX works best with:
- Simple, clear scene descriptions
- One primary action or movement per prompt
- Basic camera direction (static, slow pan)
- Keep it concise — this model works better with shorter, focused prompts
- Avoid overly complex multi-character scenes`,
};

function getModelFamily(modelId: string): string {
  if (modelId.includes("flux")) return "flux";
  if (modelId.includes("ideogram")) return "ideogram";
  if (modelId.includes("recraft")) return "recraft";
  if (modelId.includes("ltx")) return "ltx-video";
  if (modelId.includes("veo")) return "veo";
  if (modelId.includes("kling")) return "kling";
  if (modelId.includes("cogvideo")) return "cogvideo";
  return "flux"; // default
}

export function createPromptEngineer(apiKey: string) {
  const anthropic = new Anthropic({ apiKey });

  return { craftPrompt };

  async function craftPrompt(
    brief: StructuredBrief,
    model: ModelProfile
  ): Promise<{ prompt: string; negativePrompt?: string }> {
    const family = getModelFamily(model.id);
    const guide = MODEL_PROMPT_GUIDES[family] || MODEL_PROMPT_GUIDES.flux;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `${guide}

Your task: Given a design brief, craft an OPTIMIZED generation prompt for this specific model.
Transform the brief's intent into the prompt structure that this model handles best.

Rules:
- Output ONLY the generation prompt, nothing else
- Do not include meta-commentary or explanations
- The prompt should be 1-4 sentences for video, 1-6 lines for images
- Capture the brief's intent but express it in the model's optimal prompt language
- If the brief mentions specific text to render and the model supports it, include the exact text in quotes
- If the brief mentions text but the model DOESN'T support text rendering, describe the visual without the text`,
      messages: [
        {
          role: "user",
          content: `Design Brief:
Title: ${brief.title}
Description: ${brief.description}
Output Type: ${brief.outputType}
Style: ${brief.style || "not specified"}
Mood: ${brief.mood || "not specified"}
Colors: ${brief.colorPalette?.join(", ") || "not specified"}
Text to include: ${brief.textContent?.join(", ") || "none"}
Target audience: ${brief.targetAudience || "not specified"}
Aspect ratio: ${brief.aspectRatio || "not specified"}
Quality tier: ${brief.qualityTier}
Additional context: ${brief.additionalContext || "none"}

Craft the optimal generation prompt for ${model.name} (${model.id}).`,
        },
      ],
    });

    const prompt =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // For FLUX models, also generate a negative prompt
    let negativePrompt: string | undefined;
    if (family === "flux") {
      negativePrompt =
        "blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, signature, text artifacts";
    }

    return { prompt, negativePrompt };
  }
}
