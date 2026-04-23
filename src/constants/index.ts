export * from "./messages";

/**
 * Extension constants
 */
export const EXTENSION_CONSTANTS = {
  VIEW_TYPE: "ollamaExplainer",
  COMMAND_ID: "ollamaExplainer.explainCode",
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NO_MODELS: "Failed to load models. Make sure your provider is configured correctly.",
  NO_CODE_SELECTED: "No code selected. Please select some code to explain.",
  NO_MODEL_SELECTED: "No model selected. Please select a model first.",
  EXPLANATION_FAILED: "Failed to explain code",
  NO_MODELS_FOUND:
    "No models found. Make sure your provider is configured correctly and you have models available.",
  PROVIDER_ADD_FAILED: "Failed to add custom provider",
  PROVIDER_REMOVE_FAILED: "Failed to remove provider",
  INVALID_PROVIDER_URL: "Invalid provider URL",
} as const;
