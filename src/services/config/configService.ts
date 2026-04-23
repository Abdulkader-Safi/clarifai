import * as vscode from "vscode";
import type {
  ProviderConfig,
  ProviderInfo,
  AddProviderRequest,
} from "../../models/provider";
import { ProviderType } from "../../models/provider";

/**
 * Service for managing LLM provider configurations
 * Stores configs in VS Code settings and API keys in secrets
 */
export class ConfigService {
  private static readonly CUSTOM_PROVIDERS_KEY = "clarifai.customProviders";
  private static readonly SELECTED_PROVIDER_KEY = "clarifai.selectedProvider";
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Get the built-in Ollama provider
   */
  public getOllamaProvider(): ProviderConfig {
    return {
      id: "ollama-local",
      name: "Ollama (Local)",
      baseUrl: "http://localhost:11434",
      model: "",
      providerType: ProviderType.OLLAMA,
      requiresApiKey: false,
    };
  }

  /**
   * Get all custom providers from settings
   */
  public async getCustomProviders(): Promise<ProviderConfig[]> {
    const config = vscode.workspace.getConfiguration();
    const providers =
      config.get<ProviderConfig[]>(ConfigService.CUSTOM_PROVIDERS_KEY) || [];
    return providers;
  }

  /**
   * Get all available providers (Ollama + custom)
   */
  public async getAllProviders(): Promise<ProviderConfig[]> {
    const customProviders = await this.getCustomProviders();
    return [this.getOllamaProvider(), ...customProviders];
  }

  /**
   * Get a provider by ID with full info including API key
   */
  public async getProvider(id: string): Promise<ProviderInfo | null> {
    const providers = await this.getAllProviders();
    const provider = providers.find((p) => p.id === id);

    if (!provider) {
      return null;
    }

    // Get API key from secrets if needed
    let apiKey: string | undefined;
    if (provider.requiresApiKey) {
      apiKey = await this.context.secrets.get(`apiKey:${provider.id}`);
    }

    return {
      ...provider,
      apiKey,
    };
  }

  /**
   * Add a new custom provider
   */
  public async addProvider(
    request: AddProviderRequest,
  ): Promise<ProviderConfig> {
    const customProviders = await this.getCustomProviders();

    // Generate unique ID
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newProvider: ProviderConfig = {
      id,
      name: request.name,
      baseUrl: request.baseUrl.replace(/\/$/, ""), // Remove trailing slash
      model: request.model,
      providerType: ProviderType.OPENAI_COMPATIBLE,
      requiresApiKey: !!request.apiKey,
    };

    // Save provider config
    await vscode.workspace
      .getConfiguration()
      .update(
        ConfigService.CUSTOM_PROVIDERS_KEY,
        [...customProviders, newProvider],
        true,
      );

    // Save API key to secrets if provided
    if (request.apiKey) {
      await this.context.secrets.store(`apiKey:${id}`, request.apiKey);
    }

    return newProvider;
  }

  /**
   * Remove a custom provider
   */
  public async removeProvider(id: string): Promise<void> {
    const customProviders = await this.getCustomProviders();
    const filtered = customProviders.filter((p) => p.id !== id);

    await vscode.workspace
      .getConfiguration()
      .update(ConfigService.CUSTOM_PROVIDERS_KEY, filtered, true);

    // Remove API key from secrets
    await this.context.secrets.delete(`apiKey:${id}`);

    // Clear selection if this was the selected provider
    const selected = this.getSelectedProviderId();
    if (selected === id) {
      await this.setSelectedProviderId("");
    }
  }

  /**
   * Get the currently selected provider ID
   */
  public getSelectedProviderId(): string {
    const config = vscode.workspace.getConfiguration();
    return config.get<string>(ConfigService.SELECTED_PROVIDER_KEY) || "";
  }

  /**
   * Set the selected provider ID
   */
  public async setSelectedProviderId(id: string): Promise<void> {
    await vscode.workspace
      .getConfiguration()
      .update(ConfigService.SELECTED_PROVIDER_KEY, id, true);
  }

  /**
   * Get the currently selected provider with full info
   */
  public async getSelectedProvider(): Promise<ProviderInfo | null> {
    const id = this.getSelectedProviderId();
    if (!id) {
      // Auto-select Ollama as default
      const ollama = this.getOllamaProvider();
      await this.setSelectedProviderId(ollama.id);
      return { ...ollama, apiKey: undefined };
    }
    return this.getProvider(id);
  }
}
