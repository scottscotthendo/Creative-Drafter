/**
 * Heidi Health brand constants.
 * Injected into AI system prompts (analyzer + prompt engineer) to ensure
 * all generated assets are on-brand by default.
 */

/**
 * Brand illustration reference images hosted on fal.ai storage.
 * Injected as IP-Adapter references for models that support them,
 * guiding the visual style toward Heidi's aesthetic.
 * Uploaded once via scripts/upload-brand-assets.mjs.
 */
export const HEIDI_BRAND_REFERENCE_IMAGES = [
  "https://v3b.fal.media/files/b/0a94af11/GIHjZSVKqg_e14I0pPlkj_ask-heidi.png",
  "https://v3b.fal.media/files/b/0a94af12/qzkwtdbLQe1N52aZgi0Ah_note-soap.png",
  "https://v3b.fal.media/files/b/0a94af12/Xg1AcA5uxuzJdsZDt9EeK_generate-documents.png",
  "https://v3b.fal.media/files/b/0a94af12/TKhHEMwxigASOEUXbn6Ty_note-custom.png",
];

export const HEIDI_BRAND_CONTEXT = `
BRAND: Heidi Health — "AI that makes care more human"
PURPOSE: Clinical AI that reduces administrative burden on clinicians so they can focus on patients, not paperwork.
AUDIENCE: Clinicians, GPs, specialists, nurses, and healthcare professionals. Intelligent, time-poor people who value clarity, trust, and tools that feel human rather than bureaucratic.
TONE: Warm, human-centric, clear, optimistic, and compassionate. Never corporate. Never pharma-sterile. Emphasis on connection, clarity, and care.

VISUAL STYLE:
- Clean, modern healthcare aesthetic — warm and organic, not cold or clinical
- Balanced, symmetrical compositions with generous whitespace
- Tactile yet digital: combines natural textures with precise digital elements
- Emphasises human connection: clinicians with patients, attentive moments, genuine interactions
- Optimistic and positive — avoids alarming, bureaucratic, or institutional imagery
- Avoids generic medical stock clichés (stethoscopes on white backgrounds, generic doctor poses)

COLOR PALETTE:
- Sunlight #FBF582 — primary brand accent (CTAs, highlights, brand moments). Pairs with Bark text.
- Bark #28030F — headlines, text, dark backgrounds. Deep burgundy, warm and sophisticated.
- Sand #F6ECE4 — warm off-white backgrounds. Never stark white.
- Forest #194B22 — natural green for success states and positive reinforcement.
- Sky #B9CFFF — soft blue for calm, informational elements.
- Avoid: neon colours, stark black-and-white, cold clinical blues, oversaturated palettes.

DO NOT produce:
- Alarming or distressing imagery
- Cold, clinical, or sterile medical environments
- Pharmaceutical or corporate aesthetics
- Pixel art, retro gaming, or neon visuals
- Generic medical stock photography clichés
`.trim();
