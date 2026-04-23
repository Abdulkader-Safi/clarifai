/**
 * Message types for webview communication
 */
export enum WebviewMessageType {
  // From webview to extension
  LOAD_MODELS = "loadModels",
  MODEL_SELECTED = "modelSelected",
  EXPLAIN_CODE = "explainCode",
  ADD_PROVIDER = "addProvider",
  REMOVE_PROVIDER = "removeProvider",
  UPDATE_MODEL_FOR_PROVIDER = "updateModelForProvider",

  // From extension to webview
  MODELS_LOADED = "modelsLoaded",
  PROVIDER_ADDED = "providerAdded",
  PROVIDER_REMOVED = "providerRemoved",
  PROVIDER_ERROR = "providerError",
  CODE_CONTEXT = "codeContext",
  EXPLANATION_STARTED = "explanationStarted",
  EXPLANATION_CHUNK = "explanationChunk",
  EXPLANATION_COMPLETE = "explanationComplete",
  EXPLANATION_ERROR = "explanationError",
}

/**
 * Analysis modes for code explanation
 */
export enum AnalysisMode {
  EXPLAIN = "explain",
  ENHANCE = "enhance",
}
