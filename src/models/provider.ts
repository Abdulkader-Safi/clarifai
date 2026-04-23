/**
 * LLM Provider types and interfaces
 */

/**
 * Provider type enum
 */
export enum ProviderType {
  OLLAMA = "ollama",
  OPENAI_COMPATIBLE = "openai-compatible",
}

/**
 * Provider configuration interface
 * Stores provider settings including API credentials
 */
export interface ProviderConfig {
  /** Unique identifier for the provider */
  id: string;
  /** Display name */
  name: string;
  /** Base URL for the API (e.g., https://api.openai.com/v1) */
  baseUrl: string;
  /** Model identifier (e.g., gpt-4, llama2) */
  model: string;
  /** Provider type */
  providerType: ProviderType;
  /** Whether to use API key (stored in VS Code secrets) */
  requiresApiKey: boolean;
}

/**
 * Complete provider info with API key
 * Used internally when making API calls
 */
export interface ProviderInfo extends ProviderConfig {
  /** API key from VS Code secrets (optional) */
  apiKey?: string;
}

/**
 * Model option for UI dropdown
 */
export interface ModelOption {
  /** Provider ID */
  providerId: string;
  /** Display name for the dropdown */
  displayName: string;
  /** Provider type */
  providerType: ProviderType;
  /** Model name */
  model: string;
}

/**
 * Request to add a new custom provider
 */
export interface AddProviderRequest {
  name: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
}

/**
 * LLM completion chunk from streaming response
 */
export interface LLMChunk {
  content: string;
  done: boolean;
}
