const vscode = acquireVsCodeApi();
const modelSelect = document.getElementById("modelSelect");
const explainButton = document.getElementById("explainButton");
const refreshModels = document.getElementById("refreshModels");
const content = document.getElementById("content");
const modeRadios = document.querySelectorAll('input[name="mode"]');

let isLoading = false;
let currentExplanation = "";
let currentMode = "explain";

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
  vscode.postMessage({
    type: "modelSelected",
    model: e.target.value,
  });
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

window.addEventListener("message", (event) => {
  const message = event.data;

  switch (message.type) {
    case "modelsLoaded":
      modelSelect.innerHTML = "";
      modelSelect.disabled = false;

      if (message.models.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No models found";
        modelSelect.appendChild(opt);

        const fragment = cloneTemplate("tpl-empty-state");
        fragment.querySelector(".empty-state").textContent =
          "No Ollama models found. Make sure Ollama is running and you have models installed.";
        content.appendChild(fragment);
      } else {
        for (const model of message.models) {
          const option = document.createElement("option");
          option.value = model;
          option.textContent = model;
          modelSelect.appendChild(option);
        }
        if (modelSelect.value) {
          vscode.postMessage({
            type: "modelSelected",
            model: modelSelect.value,
          });
        }
      }
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
