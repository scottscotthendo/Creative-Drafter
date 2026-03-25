/**
 * Client-safe exports — no Node.js modules (fs, path, etc.)
 * Use this entry point in browser/client-side code.
 */
export * from "./types.js";
export { selectModel, selectModels } from "./model-selector.js";
export {
  MODEL_REGISTRY,
  getModelById,
  getImageModels,
  getVideoModels,
} from "./models.js";
