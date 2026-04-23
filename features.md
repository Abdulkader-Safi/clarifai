# ClarifAI — Features

## Current Features

- [x] **Explain Code** — Select code and get a natural-language explanation via Ollama
- [x] **Suggest Enhancements** — AI-powered recommendations for code quality, performance, and best practices
- [x] **Real-time Streaming** — Responses stream token-by-token instead of waiting for full completion
- [x] **Sidebar Webview Panel** — Dedicated Activity Bar icon with interactive UI
- [x] **Markdown Rendering** — Syntax-highlighted code blocks, headers, lists, tables, blockquotes
- [x] **Collapsible Sections** — Selected code and analysis results can be expanded/collapsed
- [x] **Multi-model Support** — Dropdown to pick from all locally available Ollama models
- [x] **Model Refresh** — Reload available models without restarting VS Code
- [x] **Auto-model Selection** — First available model is auto-selected on load
- [x] **Language Auto-detection** — Detects language of selected code for context-aware prompts
- [x] **Command Palette Integration** — "Explain Code with Ollama" command (`Ctrl+Shift+P`)
- [x] **VS Code Theme Awareness** — UI adapts to light/dark themes via CSS variables
- [x] **Content Security Policy** — CSP headers on the webview for safe rendering
- [x] **HTML Escaping** — User input is escaped to prevent XSS in the webview
- [x] **Reset / Re-analyze** — Button to clear results and analyze new code

## Planned / TODO

- [ ] Custom Ollama API endpoint configuration (support remote instances)
- [ ] Temperature and model parameter controls (top_p, context length, etc.)
- [ ] Custom prompt templates (user-defined system prompts)
- [ ] Analysis history / cache (persist and revisit past results)
- [ ] Additional analysis modes: **Debug**, **Optimize**, **Document**
- [ ] Remember last selected model across sessions (persist in workspace/global state)

## Potential New Features

- [ ] **Generate Unit Tests** — Produce test cases for the selected code
- [ ] **Generate Documentation** — Output JSDoc/docstring/comment blocks for selected code
- [ ] **Inline Code Actions** — CodeLens or right-click context menu to trigger analysis without the sidebar
- [ ] **Diff View for Enhancements** — Show suggested changes as a side-by-side diff instead of plain text
- [ ] **Multi-file Context** — Include imports and related files as context for more accurate analysis
- [ ] **Conversation / Follow-up** — Ask follow-up questions about the last analysis result
- [ ] **Copy to Clipboard** — One-click copy of the AI response or suggested code
- [ ] **Export Results** — Save analysis to a Markdown file
- [ ] **Model Download Prompt** — Detect when no models are installed and offer to pull one
- [ ] **Status Bar Indicator** — Show Ollama connection status and current model in the VS Code status bar
- [ ] **Keyboard Shortcut** — Dedicated keybinding to analyze selected code without opening command palette
- [ ] **Multiple AI Provider Support** — Integrate OpenAI, Anthropic, or other LLM APIs alongside Ollama
- [ ] **Code Refactoring Apply** — Apply suggested enhancements directly to the editor with one click
- [ ] **Workspace-level Settings** — Configure per-project models, prompts, and preferences via `.vscode/settings.json`
- [ ] **Localization / i18n** — Support multiple languages for the UI and prompts
