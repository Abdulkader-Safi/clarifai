const vscode = acquireVsCodeApi();
const modelSelect = document.getElementById("modelSelect");
const explainButton = document.getElementById("explainButton");
const refreshModels = document.getElementById("refreshModels");
const content = document.getElementById("content");
const modeRadios = document.querySelectorAll('input[name="mode"]');

// Add Provider UI elements
const addProviderToggle = document.getElementById("addProviderToggle");
const addProviderSection = document.getElementById("addProviderSection");
const addProviderButton = document.getElementById("addProviderButton");
const providerNameInput = document.getElementById("providerName");
const providerUrlInput = document.getElementById("providerUrl");
const providerModelInput = document.getElementById("providerModel");
const providerApiKeyInput = document.getElementById("providerApiKey");
const addProviderError = document.getElementById("addProviderError");

let isLoading = false;
let currentExplanation = "";
let currentMode = "explain";
let currentModels = [];
let selectedProviderId = "";

// --- Template helpers ---

function cloneTemplate(id) {
  const tpl = document.getElementById(id);
  return tpl.content.cloneNode(true);
}

function attachCollapsibleToggle(container) {
  const headers = container.querySelectorAll
    ? container.querySelectorAll("[data-section]")
    : [];
  for (const header of headers) {
    header.addEventListener("click", () => {
      const sectionId = header.getAttribute("data-section");
      toggleCollapsible(sectionId);
    });
  }
}

// --- Init ---

vscode.postMessage({ type: "loadModels" });

modelSelect.addEventListener("change", (e) => {
  const selected = e.target.options[e.target.selectedIndex];
  const providerId = selected.dataset.providerId;
  const model = selected.dataset.model;
  if (providerId && model) {
    vscode.postMessage({
      type: "modelSelected",
      providerId: providerId,
      model: model,
    });
    selectedProviderId = providerId;
  }
});

for (const radio of modeRadios) {
  radio.addEventListener("change", (e) => {
    currentMode = e.target.value;
  });
}

explainButton.addEventListener("click", () => {
  vscode.postMessage({
    type: "explainCode",
    mode: currentMode,
  });
});

refreshModels.addEventListener("click", () => {
  modelSelect.innerHTML = "";
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = "Loading models...";
  modelSelect.appendChild(opt);
  modelSelect.disabled = true;
  vscode.postMessage({ type: "loadModels" });
});

// Add Provider Section Toggle
addProviderToggle.addEventListener("click", () => {
  const icon = document.getElementById("add-provider-icon");
  addProviderSection.classList.toggle("collapsed");
  icon.classList.toggle("collapsed");
});

// Add Provider Button
addProviderButton.addEventListener("click", () => {
  const name = providerNameInput.value.trim();
  const baseUrl = providerUrlInput.value.trim();
  const model = providerModelInput.value.trim();
  const apiKey = providerApiKeyInput.value.trim();

  // Validation
  if (!name || !baseUrl || !model) {
    showAddProviderError("Please fill in all required fields");
    return;
  }

  // Basic URL validation
  if (!isValidUrl(baseUrl)) {
    showAddProviderError("Please enter a valid URL (e.g., https://api.example.com/v1)");
    return;
  }

  // Hide error
  hideAddProviderError();

  // Disable button while adding
  addProviderButton.disabled = true;
  addProviderButton.textContent = "Adding...";

  // Send message to extension
  vscode.postMessage({
    type: "addProvider",
    name,
    baseUrl,
    model,
    apiKey: apiKey || undefined,
  });
});

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function showAddProviderError(message) {
  addProviderError.textContent = message;
  addProviderError.classList.remove("hidden");
}

function hideAddProviderError() {
  addProviderError.classList.add("hidden");
}

function resetAddProviderForm() {
  providerNameInput.value = "";
  providerUrlInput.value = "";
  providerModelInput.value = "";
  providerApiKeyInput.value = "";
  addProviderButton.disabled = false;
  addProviderButton.textContent = "Add Model";
  hideAddProviderError();
}

window.addEventListener("message", (event) => {
  const message = event.data;

  switch (message.type) {
    case "modelsLoaded":
      handleModelsLoaded(message);
      break;

    case "providerAdded":
      handleProviderAdded(message.provider);
      break;

    case "providerRemoved":
      handleProviderRemoved(message.providerId);
      break;

    case "providerError":
      handleProviderError(message.error);
      break;

    case "codeContext": {
      content.innerHTML = "";
      const fragment = cloneTemplate("tpl-code-collapsible");
      fragment.querySelector("[data-slot='label']").textContent =
        `Selected Code (${message.language})`;
      const codeEl = fragment.querySelector("[data-slot='code']");
      codeEl.className = `language-${message.language}`;
      codeEl.textContent = message.code;
      attachCollapsibleToggle(fragment);
      content.appendChild(fragment);

      for (const block of document.querySelectorAll("pre code")) {
        hljs.highlightElement(block);
      }
      break;
    }

    case "explanationStarted":
      isLoading = true;
      explainButton.disabled = true;
      currentExplanation = "";
      content.appendChild(cloneTemplate("tpl-loading"));
      break;

    case "explanationChunk":
      currentExplanation += message.chunk;
      updateExplanation();
      break;

    case "explanationComplete":
      isLoading = false;
      explainButton.disabled = false;
      updateExplanation();
      addResetButton();
      break;

    case "explanationError": {
      isLoading = false;
      explainButton.disabled = false;
      const fragment = cloneTemplate("tpl-error");
      fragment.querySelector(".error").textContent = `Error: ${message.error}`;
      content.appendChild(fragment);
      break;
    }
  }
});

function handleModelsLoaded(message) {
  currentModels = message.models;
  selectedProviderId = message.selectedProviderId || "";

  modelSelect.innerHTML = "";
  modelSelect.disabled = false;

  if (message.models.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No models found";
    modelSelect.appendChild(opt);

    const fragment = cloneTemplate("tpl-empty-state");
    fragment.querySelector(".empty-state").textContent =
      "No models found. Make sure Ollama is running or add a custom provider below.";
    content.appendChild(fragment);
  } else {
    // Group models by provider
    let currentGroup = null;

    for (const model of message.models) {
      const option = document.createElement("option");
      option.value = `${model.providerId}:${model.model}`;
      option.textContent = model.displayName;
      option.dataset.providerId = model.providerId;
      option.dataset.model = model.model;
      modelSelect.appendChild(option);

      // Select the current model
      if (
        message.selectedProviderId === model.providerId &&
        message.selectedModel === model.model
      ) {
        option.selected = true;
      }
    }

    // If nothing selected, select first option
    if (modelSelect.value && message.selectedProviderId) {
      vscode.postMessage({
        type: "modelSelected",
        providerId: modelSelect.options[modelSelect.selectedIndex].dataset.providerId,
        model: modelSelect.options[modelSelect.selectedIndex].dataset.model,
      });
    }
  }
}

function handleProviderAdded(provider) {
  resetAddProviderForm();
  // Collapse the add provider section
  addProviderSection.classList.add("collapsed");
  document.getElementById("add-provider-icon").classList.add("collapsed");
}

function handleProviderRemoved(providerId) {
  // Remove the provider from the select options
  const options = Array.from(modelSelect.options);
  for (const option of options) {
    if (option.dataset.providerId === providerId) {
      option.remove();
    }
  }

  // If no options left, show empty state
  if (modelSelect.options.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No models found";
    modelSelect.appendChild(opt);
  }
}

function handleProviderError(error) {
  showAddProviderError(error);
  addProviderButton.disabled = false;
  addProviderButton.textContent = "Add Model";
}

function updateExplanation() {
  const loadingDiv = document.querySelector(".loading");
  if (loadingDiv) {
    loadingDiv.remove();
  }

  let existingCollapsible = document.getElementById("explanation-collapsible");

  if (!existingCollapsible && currentExplanation) {
    const fragment = cloneTemplate("tpl-explanation-collapsible");
    attachCollapsibleToggle(fragment);
    content.appendChild(fragment);
    existingCollapsible = document.getElementById("explanation-collapsible");
  }

  const explanationText = document.getElementById("explanation-text");
  if (explanationText) {
    // marked.parse output is rendered markdown — this is the only intentional
    // use of innerHTML, required for rich markdown/code-highlight rendering.
    const htmlContent = parseMarkdownWithCodeHighlight(currentExplanation);
    explanationText.innerHTML = htmlContent; // nosec: output of marked.parse
  }
}

function parseMarkdownWithCodeHighlight(text) {
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (err) {
          console.error("Highlight error:", err);
        }
      }
      return hljs.highlightAuto(code).value;
    },
  });

  return marked.parse(text);
}

function toggleCollapsible(sectionId) {
  const sectionContent = document.getElementById(`${sectionId}-content`);
  const icon = document.getElementById(`${sectionId}-icon`);

  if (sectionContent && icon) {
    sectionContent.classList.toggle("collapsed");
    icon.classList.toggle("collapsed");
  }
}

function addResetButton() {
  const existingReset = document.getElementById("reset-button");
  if (existingReset) {
    existingReset.remove();
  }

  const resetButton = document.createElement("button");
  resetButton.id = "reset-button";
  resetButton.className = "reset-button";
  resetButton.textContent = "Reset & Analyze New Code";
  resetButton.addEventListener("click", () => {
    content.innerHTML = "";
    currentExplanation = "";
    explainButton.disabled = false;
  });
  content.appendChild(resetButton);
}
