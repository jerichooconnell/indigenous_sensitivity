// ============================================================
//  Indigenous Language Review — Web App (GitHub Pages)
//  No server needed — calls OpenAI directly from the browser.
// ============================================================

(() => {
  "use strict";

  // ── State ──────────────────────────────────────────────────
  let findings = [];
  let orderedFindings = []; // card-index → finding, set by renderResults
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
  const analysisModeSelect = $("#analysis-mode");
  const apiKeyRow       = $("#api-key-row");
  const modeHintLlm     = $("#mode-hint-llm");
  const modeHintRule    = $("#mode-hint-rule");
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
  const engineBadge     = $("#engine-badge");
  const guidelinesEditor  = $("#guidelines-editor");
  const btnResetGuide     = $("#btn-reset-guidelines");
  const btnSaveGuide      = $("#btn-save-guidelines");
  const guidelinesStatus  = $("#guidelines-status");
  const detailModal       = $("#detail-modal");
  const modalTitle        = $("#modal-title");
  const modalBody         = $("#modal-body");
  const btnCloseModal     = $("#btn-close-modal");
  const btnSample         = $("#btn-sample");
  const headerToggleRule  = $("#toggle-rule");
  const headerToggleLlm   = $("#toggle-llm");

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
    const mode = localStorage.getItem("ilr_analysis_mode") || "llm";
    apiKeyInput.value = key;
    modelSelect.value = model;
    analysisModeSelect.value = mode;
    applyModeUI(mode);
    if (key) setupHint.classList.add("hidden");
  }

  function saveSettings() {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const mode = analysisModeSelect.value;

    if (mode === "llm" && !key) {
      alert("LLM mode requires an OpenAI API key. Please enter one above, or switch to Rule-based Analysis.");
      return;
    }

    localStorage.setItem("ilr_api_key", key);
    localStorage.setItem("ilr_model", model);
    localStorage.setItem("ilr_analysis_mode", mode);
    settingsPanel.classList.add("hidden");

    const needsKey = mode === "llm";
    if (needsKey && !key) setupHint.classList.remove("hidden");
    else setupHint.classList.add("hidden");

    updateScanButton();
  }

  function applyModeUI(mode) {
    if (mode === "rule-based") {
      apiKeyRow.style.display = "none";
      modeHintLlm.style.display = "none";
      modeHintRule.style.display = "";
    } else {
      apiKeyRow.style.display = "";
      modeHintLlm.style.display = "";
      modeHintRule.style.display = "none";
    }
    // Sync header toggle active state
    if (headerToggleRule && headerToggleLlm) {
      headerToggleRule.classList.toggle("active", mode === "rule-based");
      headerToggleLlm.classList.toggle("active", mode === "llm");
    }
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
    const mode = analysisModeSelect ? analysisModeSelect.value : "llm";
    const hasKey = !!localStorage.getItem("ilr_api_key");
    const hasText = textInput.textContent.trim().length > 0;
    const ready = mode === "rule-based" ? hasText : (hasKey && hasText);
    btnScan.disabled = !ready || scanning;
  }

  // ── Events ─────────────────────────────────────────────────
  function bindEvents() {
    // Settings
    btnSettings.addEventListener("click", () => {
      settingsPanel.classList.toggle("hidden");
    });
    btnSave.addEventListener("click", saveSettings);
    btnCancel.addEventListener("click", () => settingsPanel.classList.add("hidden"));

    // Mode dropdown — live update UI without saving
    analysisModeSelect.addEventListener("change", () => {
      applyModeUI(analysisModeSelect.value);
    });

    // Header mode toggle — saves immediately & updates select
    [headerToggleRule, headerToggleLlm].forEach(btn => {
      if (!btn) return;
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        analysisModeSelect.value = mode;
        localStorage.setItem("ilr_analysis_mode", mode);
        applyModeUI(mode);
      });
    });

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

    // Sample text
    if (btnSample) btnSample.addEventListener("click", loadSampleText);

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

  // ── Load sample text ──────────────────────────────────────
  function loadSampleText() {
    if (!window.NLPRules || !window.NLPRules.SAMPLE_TEXT) return;
    textInput.textContent = window.NLPRules.SAMPLE_TEXT;
    textInput.dispatchEvent(new Event("input"));
    // Switch to rule-based mode automatically
    analysisModeSelect.value = "rule-based";
    applyModeUI("rule-based");
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

    const mode = analysisModeSelect.value;
    const apiKey = localStorage.getItem("ilr_api_key");

    if (mode === "llm" && !apiKey) {
      showError("No API Key", "Please open Settings and enter your OpenAI API key, or switch to Rule-based Analysis mode.", "Click the gear icon in the top-right corner.");
      return;
    }

    // UI — scanning state
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
      if (mode === "rule-based") {
        findings = window.NLPRules.analyse(rawText);
        renderResults(rawText, findings, "rule-based");
      } else {
        findings = await analyseText(rawText, apiKey, modelSelect.value);
        renderResults(rawText, findings, "llm");
      }
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
    const systemPrompt = `You are an expert reviewer of academic and professional writing for language that misrepresents, stereotypes, or harms Indigenous Peoples.

Your analysis is grounded in a systematic review of the literature (Wahpepah et al., 2024) that identified seven recurring themes of problematic linguistic representation. For each finding, identify which theme it belongs to. Also flag positive respectful practices using Theme 5.

SEVEN THEMES TO DETECT:

Theme 1 — PATERNALISTIC ATTITUDES & JUSTIFICATION FOR INTERVENTION (most prevalent, ~30%)
Represents the settler perspective that Indigenous Peoples are inferior or in need of external assistance, allowing settlers to assume authority over them. Look for:
- Language framing Indigenous communities as "dysfunctional," "chaotic," or inherently incapable
- Interventions disguised as aid: "grab control," "take over," "emergency response"
- Conditional autonomy language: "earned autonomy," "subject to oversight until compliance"
- Deficit narratives: framing the community as the source of problems rather than colonial structures
- Paternalistic contract language that obscures power imbalances (e.g., "active partnership" used to describe top-down relationships)
- "At-risk," "high-risk community," "capacity-building" applied to Indigenous peoples without structural framing
Example from literature: "you've got to grab control of the communities" (John Howard, PM, 2007)

Theme 2 — STEREOTYPING (~21%)
Portrayal of Indigenous Peoples through oversimplified or distorted narratives about their history, cultural identity, and individuality. Look for:
- Group-level associations with alcoholism, drug abuse, gambling addiction
- "They drink too much," "drug problem on the reservation"
- Assumptions built into clinical questions (e.g., assuming cirrhosis = alcohol without asking)
- "Extremely white" as a compliment implying assimilation equals success
- Myths, legends, folklore (instead of oral traditions / sacred narratives)
- Spirit animals, pow wows, shamans, medicine men (casual or trivialising use)
- Claims of "Aboriginal advantage" (free land, government handouts) that deny treaty rights
- Noble savage / vanishing race / romanticisation tropes
Example from literature: "'They drink too much and get in fights'" attributed as group characteristic

Theme 3 — MANIFESTATION OF COLONIAL ATTITUDES (~17%)
Deliberate or subtle language that demeans, dehumanises, or reinforces power imbalances. Look for:
- High-severity slurs: savage, primitive, squaw, redskin, Eskimo
- Colonial idioms: "off the reservation," "circle the wagons," "Indian giver," "rain dance," "going native"
- Under/over-representation creating false impressions (e.g., "Aboriginal children" without "some" or "alleged" implying universality)
- "Training" applied to Indigenous peoples (echoes of residential school / domestic service)
- "Informants" in research contexts (implies extraction, not partnership)
- Agency minimisation: describing historical violence as if it were mutual or reciprocal when it was not
Example from literature: "'Training' sounds like something done to animals or domestic servants" (Pyett et al., 2008)

Theme 4 — OTHERING (~7%)
Social and cultural labelling that exoticises, discriminates against, and marginalises Indigenous Peoples, maintaining the misperception they are fundamentally inferior and different. Look for:
- "Aboriginal community" used to mark as outside the norm
- "Those people," "these natives," "the Indigenous" as othering constructions
- Grouping Indigenous Peoples with other minority/migrant groups in ways that erase their distinct constitutional and Treaty status
- Language implying Indigenous peoples are an exotic subject of study rather than rights-bearing peoples
- "Fundamentally different" essentialism
Example from literature: "are from an Aboriginal or Torres Strait Islander, Polynesian, Asian or Middle Eastern background" — bundling erases distinct Indigenous status

Theme 5 — RESPECTFUL PRACTICES (positive — commend these) (~11%)
Acknowledges colonial harms, centres Indigenous agency, and prioritises collaboration. Flag these as positive findings:
- Naming specific Nations, Elders, Knowledge Keepers
- OCAP® principles (Ownership, Control, Access, Possession)
- UNDRIP, Nation-to-Nation, Free Prior and Informed Consent (FPIC)
- Self-determination, decolonise/decolonization
- Strengths-based, trauma-informed, culturally safe language
- Two-Eyed Seeing / Etuaptmumk
- Reconciliation (when paired with structural commitment, not superficially)
- "Not the sole expert" — acknowledging Indigenous epistemological authority
Example from literature: "First Nations and Métis education goals … are integral … not an 'add-on'" (Wotherspoon & Milne, 2020)

Theme 6 — REVISIONIST HISTORY (~6%)
Sanitising, glamorising, or diluting the violence and cruelties of colonisation. Look for:
- "Cowboys and Indians" framing (has been used by soldiers to frame Indigenous peoples as targets)
- Discovery language: "discovered," "New World," "first explorers"
- Civilising mission: "brought civilisation," "opened up the land"
- Harmonious contact narratives that omit violence: "two cultures merging," "friendly natives"
- Triumphal framing of colonial conquests
- Tourist-board language presenting colonisation as benevolent or mutual
- Thanksgiving-style narratives of shared harvest ignoring subsequent genocide
Example from literature: "Plymouth is the place where ancient traditions of gratitude … merged" erasing colonisation

Theme 7 — EGALITARIAN COLOR-BLINDNESS (~5%)
Disregarding racial/cultural differences in the name of alleged equality, weaponising equality to justify exclusionary practices. Look for:
- "I prefer to treat everyone the same" in response to Indigenous-specific rights or programs
- "Across the board for everyone" as an argument against Treaty rights or targeted programs
- "Why target these people?" or "Why single out?" framing
- "Reverse discrimination" claims about Indigenous rights
- False universalism that ignores documented structural inequity
- Failure to acknowledge colonial injustices while asserting current fairness
Example from literature: "Why do we have to target these people so much? Make it across the board for everyone." (Tang & Browne, 2008)

---
ADDITIONAL GUIDELINES:
${guidelines}
---

RESPONSE FORMAT:
Return a JSON object: { "findings": [ ... ] }
Each finding must have:
- "phrase": exact verbatim text from the input (as it appears, do not paraphrase)
- "theme": one of: "paternalistic" | "stereotyping" | "colonial" | "othering" | "respectful" | "revisionist" | "colorblind"
- "severity": "high" | "medium" | "low" | "positive" (use "positive" for Theme 5 findings)
- "category": concise label (e.g., "Paternalistic framing", "Alcohol stereotype", "Othering")
- "explanation": 2-3 sentences explaining why this is problematic (or praiseworthy for positive) with reference to the relevant theme. Be specific to the text.
- "suggestion": a respectful alternative phrasing, or "Continue this practice." for positive findings

Flag subtle patterns (framing, implication) as well as explicit slurs. Do not flag neutral academic language.
If nothing problematic or praiseworthy is found, return: { "findings": [] }
Return ONLY valid JSON — no markdown, no code fences, no wrapping.`;

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
          { role: "user",   content: `Analyse this text for all seven themes:\n\n${text}` },
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
  function renderResults(originalText, findings, mode) {
    // Show engine badge
    if (engineBadge) {
      engineBadge.textContent = mode === "rule-based" ? "Rule-based" : "GPT-4o";
      engineBadge.className = "engine-badge engine-badge-" + (mode === "rule-based" ? "rule" : "llm");
    }

    orderedFindings = [];

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

    // Choose rendering strategy
    if (mode === "rule-based" && window.NLPRules && window.NLPRules.THEMES) {
      renderThemeGroups(findings);
    } else {
      renderSeverityList(findings);
    }

    // Wire up card clicks (works for both layouts)
    resultsList.querySelectorAll(".finding-card").forEach((card) => {
      card.addEventListener("click", () => {
        const idx = parseInt(card.dataset.index, 10);
        showDetailModal(orderedFindings[idx]);
      });
    });

    // Summary
    const problemFindings = findings.filter((f) => f.severity !== "positive");
    const goodFindings    = findings.filter((f) => f.severity === "positive");
    const counts = { high: 0, medium: 0, low: 0 };
    problemFindings.forEach((f) => { counts[f.severity] = (counts[f.severity] || 0) + 1; });
    const parts = [];
    if (counts.high)         parts.push(`${counts.high} high`);
    if (counts.medium)       parts.push(`${counts.medium} medium`);
    if (counts.low)          parts.push(`${counts.low} low`);
    if (goodFindings.length) parts.push(`${goodFindings.length} respectful practice${goodFindings.length !== 1 ? "s" : ""} ✓`);
    const issueCount = problemFindings.length;
    resultsSummary.textContent = `${issueCount} issue${issueCount !== 1 ? "s" : ""}: ${parts.join(", ")}`;

    resultsList.classList.remove("hidden");
    resultsPlaceholder.classList.add("hidden");

    // Highlight in the text area
    highlightText(originalText, findings);
  }

  // ── Theme-grouped rendering (rule-based mode) ──────────────
  function renderThemeGroups(findings) {
    var themes = window.NLPRules.THEMES;
    // Group findings by theme key
    var grouped = {};
    findings.forEach(function(f) {
      if (!grouped[f.theme]) grouped[f.theme] = [];
      grouped[f.theme].push(f);
    });

    var html = "";
    themes.forEach(function(theme) {
      var group = grouped[theme.key];
      if (!group || group.length === 0) return;
      var isPos = theme.positive;
      html += `<div class="theme-group theme-${theme.key}${isPos ? " theme-positive" : ""}"><div class="theme-group-header"><span class="theme-number">${theme.code}</span><span class="theme-name">${escapeHtml(theme.label)}</span><span class="theme-count">${group.length}</span></div><div class="theme-group-findings">`;
      group.forEach(function(f) {
        var idx = orderedFindings.length;
        orderedFindings.push(f);
        var badgeText = isPos ? "✓" : f.severity;
        var suggDisplay = isPos ? "Good practice detected" : ("→ " + (f.suggestion || "See details"));
        html += `<div class="finding-card" data-index="${idx}"><span class="severity-badge severity-${f.severity}">${badgeText}</span><div class="finding-text"><div class="finding-phrase">"${escapeHtml(f.phrase)}"</div><div class="finding-suggestion">${escapeHtml(suggDisplay)}</div></div></div>`;
      });
      html += "</div></div>";
    });
    resultsList.innerHTML = html;
  }

  // ── Severity-list rendering (LLM mode) ───────────────────────
  function renderSeverityList(findings) {
    var severityOrder = { high: 0, medium: 1, low: 2 };
    var sorted = findings.slice().sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));
    resultsList.innerHTML = sorted.map(function(f, i) {
      orderedFindings.push(f);
      return `<div class="finding-card" data-index="${i}"><span class="severity-badge severity-${f.severity}">${f.severity}</span><div class="finding-text"><div class="finding-phrase">"${escapeHtml(f.phrase)}"</div><div class="finding-suggestion">→ ${escapeHtml(f.suggestion || "See details")}</div></div></div>`;
    }).join("");
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
      const sev = m.severity === "positive" ? "positive" : m.severity;
      const cls = `highlight highlight-${sev}`;
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
    const isPositive = finding.severity === "positive";
    // Look up full theme name if available
    var themeName = "";
    if (finding.theme && window.NLPRules && window.NLPRules.THEMES) {
      var t = window.NLPRules.THEMES.find((x) => x.key === finding.theme);
      if (t) themeName = `Theme ${t.code}: ${t.label}`;
    }
    const themeRow = themeName ? `
      <div class="detail-row">
        <div class="detail-label">Theme</div>
        <div class="detail-value theme-label theme-${finding.theme}">${escapeHtml(themeName)}</div>
      </div>` : "";
    const actionLabel = isPositive ? "Why This Is Good Practice" : "Why This Is Flagged";
    const suggLabel   = isPositive ? "Recommendation" : "Suggested Alternative";
    const badgeText   = isPositive ? "✓ good practice" : finding.severity;
    modalBody.innerHTML = `
      <div class="detail-row">
        <div class="detail-label">Severity</div>
        <div class="detail-value"><span class="severity-badge severity-${finding.severity}">${badgeText}</span></div>
      </div>${themeRow}
      <div class="detail-row">
        <div class="detail-label">Category</div>
        <div class="detail-value">${escapeHtml(finding.category || "General")}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">${escapeHtml(actionLabel)}</div>
        <div class="detail-value">${escapeHtml(finding.explanation || "")}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">${escapeHtml(suggLabel)}</div>
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
