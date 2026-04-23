import * as vscode from "vscode";
import { ConfigService } from "../config/configService";
import { UnifiedLLMService } from "../llm/unifiedLLMService";
import type { ProviderInfo, ModelOption } from "../../models/provider";
import { ProviderType } from "../../models/provider";
import { ERROR_MESSAGES } from "../../constants";

/**
 * Service for managing LLM models and providers
 * Handles both Ollama and custom OpenAI-compatible providers
 */
export class ModelService {
  private configService: ConfigService;
  private llmService: UnifiedLLMService;
  private currentProvider: ProviderInfo | null = null;

  constructor(context: vscode.ExtensionContext) {
    this.configService = new ConfigService(context);
    this.llmService = new UnifiedLLMService();
  }

  /**
   * Get the currently selected provider
   */
  public getCurrentProvider(): ProviderInfo | null {
    return this.currentProvider;
  }

  /**
   * Set the current provider by ID
   */
  public async setCurrentProvider(providerId: string): Promise<void> {
    const provider = await this.configService.getProvider(providerId);
    if (provider) {
      this.currentProvider = provider;
      await this.configService.setSelectedProviderId(providerId);
    }
  }

  /**
   * Get model options for the UI dropdown
   * Each model is prefixed with its provider name
   */
  public async getModelOptions(): Promise<ModelOption[]> {
    const providers = await this.configService.getAllProviders();
    const options: ModelOption[] = [];

    for (const provider of providers) {
      if (provider.providerType === ProviderType.OLLAMA) {
        // For Ollama, fetch available models
        const providerInfo: ProviderInfo = {
          ...provider,
          apiKey: undefined,
        };
        const models = await this.llmService.listModels(providerInfo);
        for (const model of models) {
          options.push({
            providerId: provider.id,
            displayName: `${provider.name}: ${model}`,
            providerType: provider.providerType,
            model: model,
          });
        }
      } else {
        // For custom providers, use the configured model
        options.push({
          providerId: provider.id,
          displayName: `${provider.name}: ${provider.model}`,
          providerType: provider.providerType,
          model: provider.model,
        });
      }
    }

    return options;
  }

  /**
   * Load available models and auto-select if needed
   */
  public async loadModels(): Promise<ModelOption[]> {
    try {
      const options = await this.getModelOptions();

    // Auto-select first model if none selected
    if (options.length > 0 && !this.currentProvider) {
      const first = options[0];
      await this.setCurrentProvider(first.providerId);
      // Update the current provider with the selected model
      this.currentProvider = await this.configService.getProvider(first.providerId);
      if (this.currentProvider) {
        this.currentProvider.model = first.model;
      }
    }

      return options;
    } catch (error) {
      vscode.window.showErrorMessage(ERROR_MESSAGES.NO_MODELS);
      throw error;
    }
  }

  /**
   * Get the current model name
   */
  public getCurrentModel(): string {
    return this.currentProvider?.model || "";
  }

  /**
   * Set the current model
   * For Ollama, this updates the model in the current provider
   * For custom providers, the model is fixed
   */
  public setCurrentModel(model: string): void {
    if (this.currentProvider) {
      this.currentProvider.model = model;
    }
  }

  /**
   * Add a new custom provider
   */
  public async addCustomProvider(
    name: string,
    baseUrl: string,
    model: string,
    apiKey?: string,
  ): Promise<ModelOption> {
    const config = await this.configService.addProvider({
      name,
      baseUrl,
      model,
      apiKey,
    });

    // Auto-select the new provider
    await this.setCurrentProvider(config.id);
    if (this.currentProvider) {
      this.currentProvider.model = model;
    }

    return {
      providerId: config.id,
      displayName: `${config.name}: ${config.model}`,
      providerType: config.providerType,
      model: config.model,
    };
  }

  /**
   * Remove a custom provider
   */
  public async removeProvider(providerId: string): Promise<void> {
    await this.configService.removeProvider(providerId);

    // Clear current provider if it was removed
    if (this.currentProvider?.id === providerId) {
      this.currentProvider = null;
    }
  }

  /**
   * Get the unified LLM service for making API calls
   */
  public getLLMService(): UnifiedLLMService {
    return this.llmService;
  }

  /**
   * Check if a provider ID is the Ollama provider
   */
  public isOllamaProvider(providerId: string): boolean {
    return providerId === "ollama-local";
  }
}
