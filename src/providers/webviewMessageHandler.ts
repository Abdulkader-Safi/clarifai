import type * as vscode from "vscode";
import type { WebviewToExtensionMessage } from "../models";
import { WebviewMessageType, AnalysisMode, ERROR_MESSAGES } from "../constants";
import type { ModelService } from "../services/models/modelService";
import type { CodeAnalysisService } from "../services/codeAnalysis/codeAnalysisService";
import {
  codeContext,
  explanationChunk,
  explanationComplete,
  explanationError,
  explanationStarted,
  modelsLoaded,
  providerAdded,
  providerError,
  providerRemoved,
} from "../utils";

/**
 * Handles messages from the webview
 */
export class WebviewMessageHandler {
  constructor(
    private webview: vscode.Webview,
    private modelService: ModelService,
    private codeAnalysisService: CodeAnalysisService,
  ) {}

  /**
   * Handle a message from the webview
   */
  public async handleMessage(
    message: WebviewToExtensionMessage,
  ): Promise<void> {
    switch (message.type) {
      case WebviewMessageType.LOAD_MODELS:
        await this.handleLoadModels();
        break;

      case WebviewMessageType.MODEL_SELECTED:
        this.handleModelSelected(message.providerId, message.model);
        break;

      case WebviewMessageType.EXPLAIN_CODE:
        await this.handleExplainCode(message.mode || AnalysisMode.EXPLAIN);
        break;

      case WebviewMessageType.ADD_PROVIDER:
        await this.handleAddProvider(
          message.name,
          message.baseUrl,
          message.model,
          message.apiKey,
        );
        break;

      case WebviewMessageType.REMOVE_PROVIDER:
        await this.handleRemoveProvider(message.providerId);
        break;
    }
  }

  /**
   * Load models and send to webview
   */
  private async handleLoadModels(): Promise<void> {
    try {
      const models = await this.modelService.loadModels();
      const currentProvider = this.modelService.getCurrentProvider();
      this.webview.postMessage(
        modelsLoaded(
          models,
          currentProvider?.id,
          this.modelService.getCurrentModel(),
        ),
      );
    } catch (error) {
      this.webview.postMessage(
        modelsLoaded([], undefined, this.modelService.getCurrentModel()),
      );
    }
  }

  /**
   * Handle model selection
   */
  private handleModelSelected(providerId: string, model: string): void {
    this.modelService.setCurrentProvider(providerId).then(() => {
      this.modelService.setCurrentModel(model);
    });
  }

  /**
   * Handle code explanation request
   */
  private async handleExplainCode(mode: AnalysisMode): Promise<void> {
    const selectedCode = this.codeAnalysisService.getSelectedCode();
    if (!selectedCode) {
      return;
    }

    const { text, languageId } = selectedCode;

    // Show loading state
    this.webview.postMessage(explanationStarted());

    try {
      // Send code context
      this.webview.postMessage(codeContext(text, languageId));

      // Stream the explanation
      await this.codeAnalysisService.analyzeCode(
        text,
        languageId,
        mode,
        (chunk) => {
          this.webview.postMessage(explanationChunk(chunk));
        },
      );

      // Signal completion
      this.webview.postMessage(explanationComplete());
    } catch (error) {
      this.webview.postMessage(explanationError(String(error)));
    }
  }

  /**
   * Handle adding a new custom provider
   */
  private async handleAddProvider(
    name: string,
    baseUrl: string,
    model: string,
    apiKey?: string,
  ): Promise<void> {
    try {
      const newProvider = await this.modelService.addCustomProvider(
        name,
        baseUrl,
        model,
        apiKey,
      );
      this.webview.postMessage(providerAdded(newProvider));
    } catch (error) {
      this.webview.postMessage(
        providerError(`${ERROR_MESSAGES.PROVIDER_ADD_FAILED}: ${error}`),
      );
    }
  }

  /**
   * Handle removing a provider
   */
  private async handleRemoveProvider(providerId: string): Promise<void> {
    try {
      await this.modelService.removeProvider(providerId);
      this.webview.postMessage(providerRemoved(providerId));
    } catch (error) {
      this.webview.postMessage(
        providerError(`${ERROR_MESSAGES.PROVIDER_REMOVE_FAILED}: ${error}`),
      );
    }
  }
}
