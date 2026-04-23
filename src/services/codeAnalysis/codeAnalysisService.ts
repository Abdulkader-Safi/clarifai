import * as vscode from "vscode";
import type { ModelService } from "../models/modelService";
import type { ProviderInfo } from "../../models/provider";
import type { AnalysisMode } from "../../constants/messages";
import { ERROR_MESSAGES } from "../../constants";

/**
 * Service for analyzing code using LLMs (Ollama or OpenAI-compatible)
 */
export class CodeAnalysisService {
  private modelService: ModelService;

  constructor(modelService: ModelService) {
    this.modelService = modelService;
  }

  /**
   * Get selected code from the active editor
   */
  public getSelectedCode(): {
    text: string;
    languageId: string;
  } | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage(ERROR_MESSAGES.NO_CODE_SELECTED);
      return null;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);

    if (!text) {
      vscode.window.showInformationMessage(ERROR_MESSAGES.NO_CODE_SELECTED);
      return null;
    }

    return {
      text,
      languageId: editor.document.languageId,
    };
  }

  /**
   * Analyze code with streaming response
   */
  public async analyzeCode(
    code: string,
    languageId: string,
    mode: AnalysisMode,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const provider = this.modelService.getCurrentProvider();

    if (!provider || !provider.model) {
      vscode.window.showErrorMessage(ERROR_MESSAGES.NO_MODEL_SELECTED);
      throw new Error(ERROR_MESSAGES.NO_MODEL_SELECTED);
    }

    const llmService = this.modelService.getLLMService();
    const prompt = llmService.buildPrompt(code, languageId, mode);

    try {
      await llmService.streamCompletion(provider, prompt, onChunk);
    } catch (error) {
      const errorMessage = `${ERROR_MESSAGES.EXPLANATION_FAILED}: ${error}`;
      vscode.window.showErrorMessage(errorMessage);
      throw error;
    }
  }
}
