// ============================================================
//  Indigenous Language Review — Web App (GitHub Pages)
//  No server needed — calls OpenAI directly from the browser.
// ============================================================

(() => {
  "use strict";

  // ── State ──────────────────────────────────────────────────
  let findings = [];
  let scanning = false;

  // ── DOM refs ───────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const textInput       = $("#text-input");
  const btnScan         = $("#btn-scan");
  const btnPaste        = $("#btn-paste");
  const btnClear        = $("#btn-clear");
  const btnSettings     = $("#btn-settings");
  const settingsPanel   = $("#settings-panel");
  const apiKeyInput     = $("#api-key");
  const modelSelect     = $("#model-select");
  const btnSave         = $("#btn-save-settings");
  const btnCancel       = $("#btn-cancel-settings");
  const charCount       = $("#char-count");
  const resultsSummary  = $("#results-summary");
  const resultsPlaceholder = $("#results-placeholder");
  const resultsList     = $("#results-list");
  const errorBox        = $("#error-box");
  const errorTitle      = $("#error-title");
  const errorMessage    = $("#error-message");
  const errorHint       = $("#error-hint");
  const btnDismissError = $("#btn-dismiss-error");
  const setupHint       = $("#setup-hint");
  const scanLabel       = $(".scan-label");
  const scanSpinner     = $(".scan-spinner");
  const guidelinesEditor  = $("#guidelines-editor");
  const btnResetGuide     = $("#btn-reset-guidelines");
  const btnSaveGuide      = $("#btn-save-guidelines");
  const guidelinesStatus  = $("#guidelines-status");
  const detailModal       = $("#detail-modal");
  const modalTitle        = $("#modal-title");
  const modalBody         = $("#modal-body");
  const btnCloseModal     = $("#btn-close-modal");

  // ── Init ───────────────────────────────────────────────────
  function init() {
    loadSettings();
    loadGuidelines();
    updateScanButton();
    bindEvents();
  }

  // ── Settings ───────────────────────────────────────────────
  function loadSettings() {
    const key = localStorage.getItem("ilr_api_key") || "";
    const model = localStorage.getItem("ilr_model") || "gpt-4o-mini";
    apiKeyInput.value = key;
    modelSelect.value = model;
    if (key) setupHint.classList.add("hidden");
  }

  function saveSettings() {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    localStorage.setItem("ilr_api_key", key);
    localStorage.setItem("ilr_model", model);
    settingsPanel.classList.add("hidden");
    if (key) setupHint.classList.add("hidden");
    else setupHint.classList.remove("hidden");
    updateScanButton();
  }

  // ── Guidelines ─────────────────────────────────────────────
  function getGuidelines() {
    return localStorage.getItem("ilr_guidelines") || DEFAULT_GUIDELINES;
  }

  function loadGuidelines() {
    guidelinesEditor.value = getGuidelines();
  }

  function saveGuidelines() {
    localStorage.setItem("ilr_guidelines", guidelinesEditor.value);
    showGuidelinesStatus("Saved ✓");
  }

  function resetGuidelines() {
    if (!confirm("Reset guidelines to the defaults? Your edits will be lost.")) return;
    localStorage.removeItem("ilr_guidelines");
    guidelinesEditor.value = DEFAULT_GUIDELINES;
    showGuidelinesStatus("Reset to defaults ✓");
  }

  function showGuidelinesStatus(msg) {
    guidelinesStatus.textContent = msg;
    setTimeout(() => { guidelinesStatus.textContent = ""; }, 3000);
  }

  // ── Scan button state ─────────────────────────────────────
  function updateScanButton() {
    const hasKey = !!localStorage.getItem("ilr_api_key");
    const hasText = textInput.textContent.trim().length > 0;
    btnScan.disabled = !hasKey || !hasText || scanning;
  }

  // ── Events ─────────────────────────────────────────────────
  function bindEvents() {
    // Settings
    btnSettings.addEventListener("click", () => {
      settingsPanel.classList.toggle("hidden");
    });
    btnSave.addEventListener("click", saveSettings);
    btnCancel.addEventListener("click", () => settingsPanel.classList.add("hidden"));

    // Text input
    textInput.addEventListener("input", () => {
      const len = textInput.textContent.length;
      charCount.textContent = `${len.toLocaleString()} character${len !== 1 ? "s" : ""}`;
      updateScanButton();
    });

    // Paste button
    btnPaste.addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        textInput.textContent = text;
        textInput.dispatchEvent(new Event("input"));
      } catch {
        // fallback — focus the box so the user can Ctrl+V
        textInput.focus();
      }
    });

    // Clear button
    btnClear.addEventListener("click", () => {
      textInput.innerHTML = "";
      textInput.dispatchEvent(new Event("input"));
      clearResults();
    });

    // Scan
    btnScan.addEventListener("click", onScan);

    // Error dismiss
    btnDismissError.addEventListener("click", () => errorBox.classList.add("hidden"));

    // Guidelines
    btnSaveGuide.addEventListener("click", saveGuidelines);
    btnResetGuide.addEventListener("click", resetGuidelines);

    // Modal
    btnCloseModal.addEventListener("click", () => detailModal.classList.add("hidden"));
    detailModal.addEventListener("click", (e) => {
      if (e.target === detailModal) detailModal.classList.add("hidden");
    });

    // Close modal on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") detailModal.classList.add("hidden");
    });
  }

  // ── Clear results ─────────────────────────────────────────
  function clearResults() {
    findings = [];
    resultsList.innerHTML = "";
    resultsList.classList.add("hidden");
    resultsPlaceholder.classList.remove("hidden");
    resultsSummary.textContent = "";
    errorBox.classList.add("hidden");
  }

  // ── Scan ───────────────────────────────────────────────────
  async function onScan() {
    if (scanning) return;
    const rawText = textInput.textContent.trim();
    if (!rawText) return;

    const apiKey = localStorage.getItem("ilr_api_key");
    if (!apiKey) {
      showError("No API Key", "Please open Settings and enter your OpenAI API key.", "Click the gear icon in the top-right corner.");
      return;
    }

    // UI ─ scanning state
    scanning = true;
    updateScanButton();
    scanLabel.classList.add("hidden");
    scanSpinner.classList.remove("hidden");
    errorBox.classList.add("hidden");
    resultsList.innerHTML = "";
    resultsList.classList.add("hidden");
    resultsPlaceholder.classList.remove("hidden");
    resultsSummary.textContent = "";

    try {
      findings = await analyseText(rawText, apiKey, modelSelect.value);
      renderResults(rawText, findings);
    } catch (err) {
      showError(err.title || "Analysis Error", err.message, err.hint || "");
    } finally {
      scanning = false;
      scanLabel.classList.remove("hidden");
      scanSpinner.classList.add("hidden");
      updateScanButton();
    }
  }

  // ── OpenAI Call ────────────────────────────────────────────
  async function analyseText(text, apiKey, model) {
    const guidelines = getGuidelines();

    // Chunk long text (~3000 words per chunk)
    const chunks = chunkText(text, 12000);
    let allFindings = [];

    for (const chunk of chunks) {
      const chunkFindings = await analyseChunk(chunk, guidelines, apiKey, model);
      allFindings = allFindings.concat(chunkFindings);
    }

    // Deduplicate
    const seen = new Set();
    return allFindings.filter((f) => {
      const key = `${f.phrase.toLowerCase()}|${f.startOffset}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function analyseChunk(text, guidelines, apiKey, model) {
    const systemPrompt = `You are a cultural sensitivity review assistant. Analyse text for language that may be offensive, biased, or insensitive toward indigenous peoples.

Use these guidelines:
---
${guidelines}
---

Return a JSON array of findings. Each finding must have:
- "phrase": the exact text found (verbatim from the input)
- "severity": "high", "medium", or "low"
- "category": short label (e.g., "Colonial terminology", "Stereotyping")
- "explanation": why this is problematic (1-2 sentences)
- "suggestion": a respectful alternative phrase or rewording

If nothing is found, return an empty array: []
Return ONLY valid JSON — no markdown, no wrapping.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: `Analyse this text:\n\n${text}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw describeApiError(response.status);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    try {
      const parsed = JSON.parse(content);
      // Handle both { findings: [...] } and bare [...]
      const arr = Array.isArray(parsed) ? parsed : (parsed.findings || parsed.results || []);
      return arr.filter((f) => f && f.phrase);
    } catch {
      return [];
    }
  }

  function describeApiError(status) {
    const errors = {
      401: {
        title: "Invalid API Key",
        message: "OpenAI rejected your API key. Please check that it's correct.",
        hint: "Go to Settings (gear icon) and re-enter your key. Keys start with sk-.",
      },
      403: {
        title: "Access Denied",
        message: "Your API key doesn't have permission to use this model.",
        hint: "Try switching to gpt-4o-mini in Settings, or check your OpenAI account permissions.",
      },
      429: {
        title: "Rate Limit / Quota Exceeded",
        message: "You've either sent too many requests or your OpenAI account balance is empty.",
        hint: "Wait a minute and try again, or add credit at platform.openai.com → Billing.",
      },
      404: {
        title: "Model Not Found",
        message: "The selected model doesn't exist or isn't available on your account.",
        hint: "Try switching to gpt-4o-mini in Settings.",
      },
      500: {
        title: "OpenAI Server Error",
        message: "OpenAI's servers are having problems. This is on their end, not yours.",
        hint: "Wait a minute and try again.",
      },
      503: {
        title: "OpenAI Temporarily Unavailable",
        message: "OpenAI is experiencing high demand or maintenance.",
        hint: "Wait a few minutes and try again.",
      },
    };
    return errors[status] || {
      title: `API Error (${status})`,
      message: `OpenAI returned an unexpected error (HTTP ${status}).`,
      hint: "Check your internet connection and try again.",
    };
  }

  // ── Text chunking ─────────────────────────────────────────
  function chunkText(text, maxLength) {
    if (text.length <= maxLength) return [text];
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      let end = start + maxLength;
      if (end < text.length) {
        // try to break at sentence or paragraph boundary
        const slice = text.slice(start, end);
        const lastPara = slice.lastIndexOf("\n\n");
        const lastSentence = slice.lastIndexOf(". ");
        if (lastPara > maxLength * 0.5) end = start + lastPara + 2;
        else if (lastSentence > maxLength * 0.5) end = start + lastSentence + 2;
      }
      chunks.push(text.slice(start, end));
      start = end;
    }
    return chunks;
  }

  // ── Render Results & Highlights ───────────────────────────
  function renderResults(originalText, findings) {
    if (findings.length === 0) {
      resultsList.innerHTML = "";
      resultsList.classList.add("hidden");
      resultsPlaceholder.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#276749" stroke-width="2">
          <circle cx="24" cy="24" r="20"/><path d="M15 25l6 6 12-14"/>
        </svg>
        <p><strong>No issues found!</strong></p>
        <p style="color:var(--gray-500)">The text looks good based on the current guidelines.</p>`;
      resultsPlaceholder.classList.remove("hidden");
      resultsSummary.textContent = "0 findings";
      highlightText(originalText, []);
      return;
    }

    // Sort: high → medium → low
    const order = { high: 0, medium: 1, low: 2 };
    findings.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

    // Summary counts
    const counts = { high: 0, medium: 0, low: 0 };
    findings.forEach((f) => counts[f.severity] = (counts[f.severity] || 0) + 1);
    const parts = [];
    if (counts.high)   parts.push(`${counts.high} high`);
    if (counts.medium) parts.push(`${counts.medium} medium`);
    if (counts.low)    parts.push(`${counts.low} low`);
    resultsSummary.textContent = `${findings.length} finding${findings.length > 1 ? "s" : ""}: ${parts.join(", ")}`;

    // Build cards
    resultsList.innerHTML = findings.map((f, i) => `
      <div class="finding-card" data-index="${i}">
        <span class="severity-badge severity-${f.severity}">${f.severity}</span>
        <div class="finding-text">
          <div class="finding-phrase">"${escapeHtml(f.phrase)}"</div>
          <div class="finding-suggestion">→ ${escapeHtml(f.suggestion || "See details")}</div>
        </div>
      </div>
    `).join("");

    resultsList.classList.remove("hidden");
    resultsPlaceholder.classList.add("hidden");

    // Card click → modal
    resultsList.querySelectorAll(".finding-card").forEach((card) => {
      card.addEventListener("click", () => {
        const idx = parseInt(card.dataset.index, 10);
        showDetailModal(findings[idx]);
      });
    });

    // Highlight in the text area
    highlightText(originalText, findings);
  }

  // ── Highlight Text ────────────────────────────────────────
  function highlightText(originalText, findings) {
    if (findings.length === 0) {
      textInput.textContent = originalText;
      return;
    }

    // Find positions of each phrase in the text (case-insensitive)
    const markers = [];
    for (const f of findings) {
      const regex = new RegExp(escapeRegex(f.phrase), "gi");
      let match;
      while ((match = regex.exec(originalText)) !== null) {
        markers.push({
          start: match.index,
          end: match.index + match[0].length,
          severity: f.severity,
          finding: f,
        });
      }
    }

    // Sort by position, prefer longer spans
    markers.sort((a, b) => a.start - b.start || b.end - a.end);

    // Remove overlapping markers (keep the first/longest)
    const filtered = [];
    let lastEnd = -1;
    for (const m of markers) {
      if (m.start >= lastEnd) {
        filtered.push(m);
        lastEnd = m.end;
      }
    }

    // Build highlighted HTML
    let html = "";
    let pos = 0;
    for (const m of filtered) {
      if (m.start > pos) html += escapeHtml(originalText.slice(pos, m.start));
      const cls = `highlight highlight-${m.severity}`;
      const phraseHtml = escapeHtml(originalText.slice(m.start, m.end));
      html += `<span class="${cls}" data-severity="${m.severity}" title="Click for details">${phraseHtml}</span>`;
      pos = m.end;
    }
    if (pos < originalText.length) html += escapeHtml(originalText.slice(pos));

    textInput.innerHTML = html;

    // Make highlights clickable
    textInput.querySelectorAll(".highlight").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const phrase = el.textContent;
        const match = findings.find((f) => f.phrase.toLowerCase() === phrase.toLowerCase());
        if (match) showDetailModal(match);
      });
    });
  }

  // ── Detail Modal ──────────────────────────────────────────
  function showDetailModal(finding) {
    modalTitle.textContent = `"${finding.phrase}"`;
    modalBody.innerHTML = `
      <div class="detail-row">
        <div class="detail-label">Severity</div>
        <div class="detail-value"><span class="severity-badge severity-${finding.severity}">${finding.severity}</span></div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Category</div>
        <div class="detail-value">${escapeHtml(finding.category || "General")}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Why This Is Flagged</div>
        <div class="detail-value">${escapeHtml(finding.explanation || "")}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Suggested Alternative</div>
        <div class="detail-value"><span class="suggestion-text">${escapeHtml(finding.suggestion || "No suggestion available")}</span></div>
      </div>`;
    detailModal.classList.remove("hidden");
  }

  // ── Error Display ─────────────────────────────────────────
  function showError(title, message, hint) {
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorHint.textContent = hint || "";
    errorHint.style.display = hint ? "" : "none";
    errorBox.classList.remove("hidden");
    resultsPlaceholder.classList.add("hidden");
    resultsList.classList.add("hidden");
  }

  // ── Utilities ─────────────────────────────────────────────
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // ── Boot ──────────────────────────────────────────────────
  init();
})();
