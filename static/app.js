const $ = (s) => document.querySelector(s);
const HISTORY_KEY = "stockanalyser_history";

const textarea = $("#text-input");
const analyseBtn = $("#analyse-btn");
const clearBtn = $("#clear-btn");
const typeSelect = $("#analysis-type");
const wordCount = $("#word-count");
const loading = $(".loading");
const results = $(".results");
const historyList = $("#history-list");

textarea.addEventListener("input", () => {
  const words = textarea.value.trim() ? textarea.value.trim().split(/\s+/).length : 0;
  wordCount.textContent = `${words.toLocaleString()} words`;
});

analyseBtn.addEventListener("click", runAnalysis);

textarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runAnalysis();
});

clearBtn.addEventListener("click", () => {
  textarea.value = "";
  wordCount.textContent = "0 words";
  results.classList.remove("active");
  textarea.focus();
});

async function runAnalysis() {
  const text = textarea.value.trim();
  if (!text) return;

  analyseBtn.disabled = true;
  loading.classList.add("active");
  results.classList.remove("active");

  try {
    const res = await fetch("/api/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, analysis_type: typeSelect.value }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Analysis failed");
    }

    const data = await res.json();
    renderResults(data);
    saveToHistory(text, data);
    renderHistory();
  } catch (err) {
    alert(`Error: ${err.message}`);
  } finally {
    analyseBtn.disabled = false;
    loading.classList.remove("active");
  }
}

function renderResults(data) {
  const score = data.sentiment?.score ?? 0;
  const label = data.sentiment?.label ?? "Neutral";
  const color = score > 0.2 ? "var(--green)" : score < -0.2 ? "var(--red)" : "var(--yellow)";

  $("#sentiment-score").textContent = score.toFixed(2);
  $("#sentiment-score").style.color = color;
  $("#sentiment-label").textContent = label;

  const angle = score * 90;
  $(".gauge-needle").style.transform = `rotate(${angle}deg)`;

  $("#metric-words").textContent = (data.word_count ?? 0).toLocaleString();
  $("#metric-confidence").textContent = `${((data.confidence ?? 0) * 100).toFixed(0)}%`;
  $("#metric-type").textContent = (data.analysis_type ?? "general").charAt(0).toUpperCase() + (data.analysis_type ?? "general").slice(1);

  $("#summary-text").textContent = data.summary ?? "";

  renderList("#insights-list", data.insights);
  renderList("#risks-list", data.risks);
  renderList("#catalysts-list", data.catalysts);

  $("#action-text").textContent = data.action ?? "";

  results.classList.add("active");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderList(selector, items) {
  const ul = $(selector);
  ul.replaceChildren();
  (items ?? []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
}

function saveToHistory(text, data) {
  const history = getHistory();
  history.unshift({
    id: Date.now(),
    preview: text.slice(0, 100),
    sentiment: data.sentiment,
    timestamp: data.timestamp,
    data,
  });
  if (history.length > 20) history.length = 20;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function renderHistory() {
  const history = getHistory();
  historyList.replaceChildren();

  if (!history.length) {
    const p = document.createElement("p");
    p.style.cssText = "color: var(--text-muted); font-size: 0.85rem;";
    p.textContent = "No analyses yet";
    historyList.appendChild(p);
    return;
  }

  history.forEach((item) => {
    const score = item.sentiment?.score ?? 0;
    const color = score > 0.2 ? "var(--green)" : score < -0.2 ? "var(--red)" : "var(--yellow)";
    const time = new Date(item.timestamp).toLocaleString();

    const div = document.createElement("div");
    div.className = "history-item";
    div.addEventListener("click", () => loadHistory(item.id));

    const preview = document.createElement("span");
    preview.className = "preview";
    preview.textContent = item.preview + "...";

    const meta = document.createElement("span");
    meta.className = "meta";

    const dot = document.createElement("span");
    dot.className = "sentiment-dot";
    dot.style.background = color;

    const scoreText = document.createTextNode(` ${score.toFixed(2)} \u00B7 ${time}`);

    meta.appendChild(dot);
    meta.appendChild(scoreText);
    div.appendChild(preview);
    div.appendChild(meta);
    historyList.appendChild(div);
  });
}

function loadHistory(id) {
  const history = getHistory();
  const item = history.find((h) => h.id === id);
  if (item) renderResults(item.data);
}

function clearHistory() {
  if (confirm("Clear all history?")) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }
}

function exportHistory() {
  const history = getHistory();
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stockanalyser-history-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyResults() {
  const summary = $("#summary-text").textContent;
  const sentiment = `${$("#sentiment-label").textContent} (${$("#sentiment-score").textContent})`;
  const insights = [...document.querySelectorAll("#insights-list li")].map((li) => `- ${li.textContent}`).join("\n");
  const risks = [...document.querySelectorAll("#risks-list li")].map((li) => `- ${li.textContent}`).join("\n");
  const catalysts = [...document.querySelectorAll("#catalysts-list li")].map((li) => `- ${li.textContent}`).join("\n");
  const action = $("#action-text").textContent;

  const text = `SUMMARY\n${summary}\n\nSENTIMENT: ${sentiment}\n\nKEY INSIGHTS\n${insights}\n\nRISKS\n${risks}\n\nCATALYSTS\n${catalysts}\n\nCONSIDERATION\n${action}\n\n(Not financial advice)`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = $("#copy-btn");
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = "Copy Results"; }, 1500);
  });
}

renderHistory();
