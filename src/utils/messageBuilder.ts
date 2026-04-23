import { WebviewMessageType } from "../constants";
import type {
  ModelsLoadedMessage,
  ProviderAddedMessage,
  ProviderRemovedMessage,
  ProviderErrorMessage,
  CodeContextMessage,
  ExplanationStartedMessage,
  ExplanationChunkMessage,
  ExplanationCompleteMessage,
  ExplanationErrorMessage,
} from "../models";
import type { ModelOption } from "../models/provider";

/**
 * Utility functions for building messages to send to webview
 */
export function modelsLoaded(
  models: ModelOption[],
  selectedProviderId?: string,
  selectedModel?: string,
): ModelsLoadedMessage {
  return {
    type: WebviewMessageType.MODELS_LOADED,
    models,
    selectedProviderId,
    selectedModel,
  };
}

export function providerAdded(provider: ModelOption): ProviderAddedMessage {
  return {
    type: WebviewMessageType.PROVIDER_ADDED,
    provider,
  };
}

export function providerRemoved(providerId: string): ProviderRemovedMessage {
  return {
    type: WebviewMessageType.PROVIDER_REMOVED,
    providerId,
  };
}

export function providerError(error: string): ProviderErrorMessage {
  return {
    type: WebviewMessageType.PROVIDER_ERROR,
    error,
  };
}

export function codeContext(
  code: string,
  language: string,
): CodeContextMessage {
  return {
    type: WebviewMessageType.CODE_CONTEXT,
    code,
    language,
  };
}

export function explanationStarted(): ExplanationStartedMessage {
  return {
    type: WebviewMessageType.EXPLANATION_STARTED,
  };
}

export function explanationChunk(chunk: string): ExplanationChunkMessage {
  return {
    type: WebviewMessageType.EXPLANATION_CHUNK,
    chunk,
  };
}

export function explanationComplete(): ExplanationCompleteMessage {
  return {
    type: WebviewMessageType.EXPLANATION_COMPLETE,
  };
}

export function explanationError(error: string): ExplanationErrorMessage {
  return {
    type: WebviewMessageType.EXPLANATION_ERROR,
    error,
  };
}
