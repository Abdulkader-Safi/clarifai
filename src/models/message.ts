import type { WebviewMessageType, AnalysisMode } from "../constants";
import type { ModelOption, ProviderType } from "./provider";

/**
 * Base message structure
 */
export interface BaseMessage {
  type: WebviewMessageType;
}

/**
 * Messages from webview to extension
 */
export interface LoadModelsMessage extends BaseMessage {
  type: WebviewMessageType.LOAD_MODELS;
}

export interface ModelSelectedMessage extends BaseMessage {
  type: WebviewMessageType.MODEL_SELECTED;
  providerId: string;
  model: string;
}

export interface ExplainCodeMessage extends BaseMessage {
  type: WebviewMessageType.EXPLAIN_CODE;
  mode?: AnalysisMode;
}

export interface AddProviderMessage extends BaseMessage {
  type: WebviewMessageType.ADD_PROVIDER;
  name: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export interface RemoveProviderMessage extends BaseMessage {
  type: WebviewMessageType.REMOVE_PROVIDER;
  providerId: string;
}

export interface UpdateModelForProviderMessage extends BaseMessage {
  type: WebviewMessageType.UPDATE_MODEL_FOR_PROVIDER;
  providerId: string;
  model: string;
}

export type WebviewToExtensionMessage =
  | LoadModelsMessage
  | ModelSelectedMessage
  | ExplainCodeMessage
  | AddProviderMessage
  | RemoveProviderMessage
  | UpdateModelForProviderMessage;

/**
 * Messages from extension to webview
 */
export interface ModelsLoadedMessage extends BaseMessage {
  type: WebviewMessageType.MODELS_LOADED;
  models: ModelOption[];
  selectedProviderId?: string;
  selectedModel?: string;
}

export interface ProviderAddedMessage extends BaseMessage {
  type: WebviewMessageType.PROVIDER_ADDED;
  provider: ModelOption;
}

export interface ProviderRemovedMessage extends BaseMessage {
  type: WebviewMessageType.PROVIDER_REMOVED;
  providerId: string;
}

export interface ProviderErrorMessage extends BaseMessage {
  type: WebviewMessageType.PROVIDER_ERROR;
  error: string;
}

export interface CodeContextMessage extends BaseMessage {
  type: WebviewMessageType.CODE_CONTEXT;
  code: string;
  language: string;
}

export interface ExplanationStartedMessage extends BaseMessage {
  type: WebviewMessageType.EXPLANATION_STARTED;
}

export interface ExplanationChunkMessage extends BaseMessage {
  type: WebviewMessageType.EXPLANATION_CHUNK;
  chunk: string;
}

export interface ExplanationCompleteMessage extends BaseMessage {
  type: WebviewMessageType.EXPLANATION_COMPLETE;
}

export interface ExplanationErrorMessage extends BaseMessage {
  type: WebviewMessageType.EXPLANATION_ERROR;
  error: string;
}

export type ExtensionToWebviewMessage =
  | ModelsLoadedMessage
  | ProviderAddedMessage
  | ProviderRemovedMessage
  | ProviderErrorMessage
  | CodeContextMessage
  | ExplanationStartedMessage
  | ExplanationChunkMessage
  | ExplanationCompleteMessage
  | ExplanationErrorMessage;
