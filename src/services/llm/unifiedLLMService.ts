import { Ollama } from "ollama";
import OpenAI from "openai";
import type { ProviderInfo } from "../../models/provider";
import { ProviderType } from "../../models/provider";

/**
 * Unified LLM Service that handles both Ollama and OpenAI-compatible APIs
 */
export class UnifiedLLMService {
  /**
   * Generate a streaming completion from the selected provider
   */
  public async streamCompletion(
    provider: ProviderInfo,
    prompt: string,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    if (provider.providerType === ProviderType.OLLAMA) {
      await this.streamOllamaCompletion(provider, prompt, onChunk);
    } else {
      await this.streamOpenAICompletion(provider, prompt, onChunk);
    }
  }

  /**
   * List available models from a provider
   * For Ollama: fetches from API
   * For OpenAI-compatible: returns the configured model only
   */
  public async listModels(provider: ProviderInfo): Promise<string[]> {
    if (provider.providerType === ProviderType.OLLAMA) {
      const ollama = new Ollama({ host: provider.baseUrl });
      try {
        const response = await ollama.list();
        return response.models.map((m) => m.name);
      } catch (error) {
        console.error("Failed to list Ollama models:", error);
        return [];
      }
    } else {
      // For OpenAI-compatible, we just return the configured model
      return provider.model ? [provider.model] : [];
    }
  }

  /**
   * Stream completion from Ollama
   */
  private async streamOllamaCompletion(
    provider: ProviderInfo,
    prompt: string,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const ollama = new Ollama({ host: provider.baseUrl });

    try {
      const stream = await ollama.generate({
        model: provider.model,
        prompt: prompt,
        stream: true,
      });

      let lastResponse = "";
      let repeatCount = 0;

      for await (const chunk of stream) {
        if (chunk.response) {
          // Infinite loop protection
          if (chunk.response === lastResponse) {
            repeatCount++;
            if (repeatCount > 5) {
              console.warn("Ollama stream detected repeating content, stopping");
              break;
            }
          } else {
            repeatCount = 0;
          }

          lastResponse = chunk.response;
          onChunk(chunk.response);
        }

        // Check for done status
        if (chunk.done) {
          break;
        }
      }
    } catch (error) {
      console.error("Ollama streaming error:", error);
      throw error;
    }
  }

  /**
   * Stream completion from OpenAI-compatible API
   */
  private async streamOpenAICompletion(
    provider: ProviderInfo,
    prompt: string,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const openai = new OpenAI({
      baseURL: provider.baseUrl,
      apiKey: provider.apiKey || "sk-no-key",
    });

    try {
      const stream = await openai.chat.completions.create({
        model: provider.model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });

      let lastContent = "";
      let emptyCount = 0;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;

        // Skip empty chunks and detect infinite loops
        if (content) {
          // Protect against repeating content (infinite loop detection)
          if (content === lastContent && emptyCount > 3) {
            console.warn("Detected potential infinite loop, stopping stream");
            break;
          }

          if (content === lastContent) {
            emptyCount++;
          } else {
            emptyCount = 0;
          }

          lastContent = content;
          onChunk(content);
        }

        // Check for finish reason
        if (chunk.choices[0]?.finish_reason === "stop") {
          break;
        }
      }
    } catch (error) {
      console.error("OpenAI-compatible API error:", error);
      throw error;
    }
  }

  /**
   * Build prompt based on mode (explain or enhance)
   */
  public buildPrompt(
    code: string,
    language: string,
    mode: "explain" | "enhance",
  ): string {
    if (mode === "enhance") {
      return `Analyze the following ${language} code and suggest improvements, enhancements, and potential fixes. Focus on:
- Code quality and best practices
- Performance optimizations
- Potential bugs or edge cases
- Security concerns
- Readability improvements

Do NOT write the actual code. Only describe what could be improved and why.

Code:
${code}`;
    } else {
      return `Explain the following ${language} code in detail:\n\n${code}`;
    }
  }
}
