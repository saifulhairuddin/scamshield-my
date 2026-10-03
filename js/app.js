/* ScamShield MY - app.js
   Phase 1: UI interactions (counter, clear, sample menu, nav).
   Phase 2: deterministic detection + weighted scoring engine (LOCKED).
   Phase 3: polished explainable threat-assessment rendering, safe
            highlighting, recommendations, functional samples. */
(function () {
  "use strict";

  var MAX_CHARS = 5000;

  // ---- Phase 2 engine (pure, deterministic - no DOM, no network) ----

  function normalizeMessage(message) {
    return String(message).toLowerCase().replace(/\s+/g, " ").trim();
  }

  function validateMessage(message) {
    if (message == null || String(message).trim().length === 0) {
      return { ok: false, reason: "empty", message: "Please enter a message to analyse." };
    }
    if (String(message).length > MAX_CHARS) {
      return { ok: false, reason: "too_long", message: "Message exceeds the 5000-character limit. Please shorten it." };
    }
    return { ok: true };
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }


  function detectIndicators(normalized) {
    var catalogue = (typeof SCAM_INDICATORS !== "undefined") ? SCAM_INDICATORS : [];
    var detected = [];
    for (var i = 0; i < catalogue.length; i++) {
      var ind = catalogue[i];
      var phrases = [];
      var seen = {};
      var k;
      for (k = 0; k < ind.keywords.length; k++) {
        var kw = String(ind.keywords[k]).toLowerCase();
        if (kw && normalized.indexOf(kw) !== -1 && !seen[kw]) {
          seen[kw] = true;
          phrases.push(ind.keywords[k]);
        }
      }
      for (k = 0; k < ind.patterns.length; k++) {
        var re = new RegExp(ind.patterns[k], "ig");
        var m;
        while ((m = re.exec(normalized)) !== null) {
          var hit = m[0];
          if (hit && !seen[hit]) { seen[hit] = true; phrases.push(hit); }
          if (m.index === re.lastIndex) { re.lastIndex++; }
        }
      }
      if (phrases.length > 0) {
        detected.push({
          id: ind.id, name: ind.name, weight: ind.weight,
          matchedPhrases: phrases,
          explanation: ind.explanation,
          recommendedAction: ind.recommendedAction
        });
      }
    }
    return detected;
  }

  function computeScore(detected) {
    var total = 0;
    for (var i = 0; i < detected.length; i++) { total += detected[i].weight; }
    return total;
  }

  function scoreToLevel(score) {
    if (score >= 6) { return "HIGH"; }
    if (score >= 3) { return "MEDIUM"; }
    return "LOW";
  }

  function analyzeMessage(message) {
    var normalized = normalizeMessage(message);
    var detected = detectIndicators(normalized);
    var score = computeScore(detected);
    return {
      originalMessage: message,
      normalizedMessage: normalized,
      score: score,
      riskLevel: scoreToLevel(score),
      indicatorCount: detected.length,
      indicators: detected
    };
  }


  // ---- Phase 3 pure helpers (testable, no DOM) ----

  // Build highlight segments over the ORIGINAL message (never mutated).
  // Returns [{ text, highlighted }] with overlapping spans merged.
  function buildHighlightSegments(original, indicators) {
    var text = String(original);
    var lower = text.toLowerCase();
    var spans = [];
    for (var i = 0; i < indicators.length; i++) {
      var phrases = indicators[i].matchedPhrases || [];
      for (var p = 0; p < phrases.length; p++) {
        var needle = String(phrases[p]).toLowerCase();
        if (!needle) { continue; }
        var from = 0, idx;
        while ((idx = lower.indexOf(needle, from)) !== -1) {
          spans.push({ start: idx, end: idx + needle.length });
          from = idx + needle.length;
        }
      }
    }
    if (spans.length === 0) { return [{ text: text, highlighted: false }]; }
    spans.sort(function (a, b) { return a.start - b.start || a.end - b.end; });
    var merged = [spans[0]];
    for (var s = 1; s < spans.length; s++) {
      var last = merged[merged.length - 1];
      if (spans[s].start <= last.end) { last.end = Math.max(last.end, spans[s].end); }
      else { merged.push(spans[s]); }
    }
    var out = [];
    var cursor = 0;
    for (var mi = 0; mi < merged.length; mi++) {
      if (merged[mi].start > cursor) { out.push({ text: text.slice(cursor, merged[mi].start), highlighted: false }); }
      out.push({ text: text.slice(merged[mi].start, merged[mi].end), highlighted: true });
      cursor = merged[mi].end;
    }
    if (cursor < text.length) { out.push({ text: text.slice(cursor), highlighted: false }); }
    return out;
  }

  // Score breakdown rows (one per detected category) + total.
  function buildScoreBreakdown(result) {
    var rows = result.indicators.map(function (ind) {
      return { name: ind.name, points: ind.weight };
    });
    return { rows: rows, total: result.score };
  }

  // Recommendations from detected categories, deduplicated, with an
  // always-included verify-through-official-channel action when >=1 indicator.
  function buildRecommendations(result) {
    var VERIFY = "Verify the request independently through the organisation's official app, website, or published phone number.";
    var out = [];
    var seen = {};
    function add(text) {
      var key = String(text).trim().toLowerCase();
      if (text && !seen[key]) { seen[key] = true; out.push(text); }
    }
    if (result.indicators.length === 0) {
      add("No common scam risk indicators were detected in this message.");
      add("This does not guarantee the message is safe. When in doubt, verify the sender through an official channel.");
      return out;
    }
    for (var i = 0; i < result.indicators.length; i++) { add(result.indicators[i].recommendedAction); }
    add(VERIFY);
    return out;
  }


  // Expose engine + Phase 3 helpers for the test harness (Node + browser).
  var ENGINE = {
    normalizeMessage: normalizeMessage,
    validateMessage: validateMessage,
    detectIndicators: detectIndicators,
    computeScore: computeScore,
    scoreToLevel: scoreToLevel,
    analyzeMessage: analyzeMessage,
    buildHighlightSegments: buildHighlightSegments,
    buildScoreBreakdown: buildScoreBreakdown,
    buildRecommendations: buildRecommendations
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = ENGINE; }
  if (typeof window !== "undefined") { window.ScamShieldEngine = ENGINE; }


  // ---- DOM wiring (browser only) ----

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () {
      initCharCounter();
      initClearButton();
      initSampleMenu();
      initNav();
      initAnalyse();
      initHistory();
    });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; } // textContent = safe, never HTML
    return node;
  }

  function clearChildren(node) { while (node.firstChild) { node.removeChild(node.firstChild); } }

  function initCharCounter() {
    var textarea = document.getElementById("message-input");
    var counter = document.getElementById("char-counter");
    if (!textarea || !counter) return;
    function update() {
      var len = textarea.value.length;
      counter.textContent = len + " / " + MAX_CHARS;
      counter.classList.toggle("is-max", len >= MAX_CHARS);
    }
    textarea.addEventListener("input", update);
    update();
  }

  function initClearButton() {
    var clearBtn = document.getElementById("clear-btn");
    var textarea = document.getElementById("message-input");
    var feedback = document.getElementById("input-feedback");
    if (!clearBtn || !textarea) return;
    clearBtn.addEventListener("click", function () {
      textarea.value = "";
      if (feedback) feedback.textContent = "";
      textarea.dispatchEvent(new Event("input"));
      textarea.focus();
    });
  }

  function initNav() {
    var links = document.querySelectorAll("[data-nav]");
    links.forEach(function (link) {
      link.addEventListener("click", function () {
        links.forEach(function (l) { l.classList.remove("is-active"); });
        link.classList.add("is-active");
      });
    });
  }


  function initSampleMenu() {
    var btn = document.getElementById("sample-btn");
    var menu = document.getElementById("sample-menu");
    var textarea = document.getElementById("message-input");
    var feedback = document.getElementById("input-feedback");
    if (!btn || !menu) return;

    // Populate menu from SAMPLE_MESSAGES (replaces the Phase 1 placeholder).
    var samples = (typeof SAMPLE_MESSAGES !== "undefined") ? SAMPLE_MESSAGES : [];
    if (samples.length) {
      clearChildren(menu);
      samples.forEach(function (s) {
        var li = el("li"); li.setAttribute("role", "none");
        var item = el("button", "sample-menu__item", s.label);
        item.type = "button"; item.setAttribute("role", "menuitem");
        item.addEventListener("click", function () {
          if (textarea) {
            textarea.value = s.text;              // load only; do NOT auto-analyse
            textarea.dispatchEvent(new Event("input"));
            if (feedback) { feedback.textContent = ""; }
            textarea.focus();
          }
          closeMenu();
        });
        li.appendChild(item); menu.appendChild(li);
      });
    }

    function closeMenu() { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); }
    function openMenu() { menu.hidden = false; btn.setAttribute("aria-expanded", "true"); }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (menu.hidden) openMenu(); else closeMenu();
    });
    document.addEventListener("click", function (e) {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) { closeMenu(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { closeMenu(); btn.focus(); }
    });
  }


  function initAnalyse() {
    var form = document.querySelector(".analysis__form");
    var textarea = document.getElementById("message-input");
    var feedback = document.getElementById("input-feedback");
    if (!form || !textarea) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var raw = textarea.value;
      var check = validateMessage(raw);
      if (!check.ok) { if (feedback) feedback.textContent = check.message; return; }
      if (feedback) feedback.textContent = "";
      var result = analyzeMessage(raw);
      renderResult(result);
      HISTORY.add(result);
      renderHistory();
      var target = document.getElementById("threat-assessment");
      if (target && target.scrollIntoView) { target.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
  }

  var LEVEL_META = {
    LOW:    { cls: "low",    tagline: "Few risk indicators detected.", note: "A LOW result does not guarantee that a message is safe." },
    MEDIUM: { cls: "medium", tagline: "Proceed with caution.", note: "Several risk indicators were detected. Independently verify this request before acting." },
    HIGH:   { cls: "high",   tagline: "Pause before taking action.", note: "This message contains multiple risk indicators. Do not click links, share sensitive information, or make payments until you verify the request through an official channel." }
  };

  // ---- Phase 3 polished renderer (safe DOM construction only) ----
  function renderResult(result) {
    var section = document.getElementById("threat-assessment");
    if (!section) return;
    var meta = LEVEL_META[result.riskLevel] || LEVEL_META.LOW;
    section.hidden = false;
    clearChildren(section);
    section.classList.remove("level-low", "level-medium", "level-high");
    section.classList.add("level-" + meta.cls);

    // Heading
    section.appendChild(el("p", "section-label", "Threat Assessment"));

    // Summary band
    var summary = el("div", "ta-summary");
    var badge = el("span", "risk-badge risk-badge--" + meta.cls, result.riskLevel);
    summary.appendChild(badge);
    var stats = el("div", "ta-stats");
    var stScore = el("div", "ta-stat");
    stScore.appendChild(el("span", "ta-stat__value", String(result.score)));
    stScore.appendChild(el("span", "ta-stat__label", "Risk Score"));
    stats.appendChild(stScore);
    var stCount = el("div", "ta-stat");
    stCount.appendChild(el("span", "ta-stat__value", String(result.indicatorCount)));
    stCount.appendChild(el("span", "ta-stat__label", result.indicatorCount === 1 ? "Risk Indicator Detected" : "Risk Indicators Detected"));
    stats.appendChild(stCount);
    summary.appendChild(stats);
    section.appendChild(summary);
    section.appendChild(el("p", "ta-tagline", meta.tagline));

    // Risk meter (LOW/MEDIUM/HIGH scale)
    var meter = el("div", "risk-meter");
    meter.setAttribute("role", "img");
    meter.setAttribute("aria-label", "Risk level " + result.riskLevel);
    ["LOW", "MEDIUM", "HIGH"].forEach(function (lvl) {
      var seg = el("span", "risk-meter__seg risk-meter__seg--" + lvl.toLowerCase(), lvl);
      if (lvl === result.riskLevel) { seg.classList.add("is-active"); }
      meter.appendChild(seg);
    });
    section.appendChild(meter);
    section.appendChild(el("p", "ta-meter-note", "Score based on detected risk indicators."));


    // Zero-indicator path
    if (result.indicatorCount === 0) {
      var zero = el("div", "ta-zero");
      zero.appendChild(el("p", "ta-zero__title", "No common scam risk indicators were detected in this message."));
      zero.appendChild(el("p", "ta-zero__text", "This does not guarantee that the message is safe. When in doubt, verify the sender through an official channel."));
      section.appendChild(zero);
      appendDisclaimer(section);
      return;
    }

    // Score breakdown
    var breakdown = buildScoreBreakdown(result);
    var bd = el("div", "score-breakdown");
    bd.appendChild(el("h3", "block-title", "Score Breakdown"));
    var bdList = el("ul", "score-breakdown__list");
    breakdown.rows.forEach(function (row) {
      var li = el("li", "score-breakdown__row");
      li.appendChild(el("span", "score-breakdown__name", row.name));
      li.appendChild(el("span", "score-breakdown__pts", "+" + row.points));
      bdList.appendChild(li);
    });
    var totalRow = el("li", "score-breakdown__row score-breakdown__row--total");
    totalRow.appendChild(el("span", "score-breakdown__name", "Risk Score"));
    totalRow.appendChild(el("span", "score-breakdown__pts", String(breakdown.total)));
    bdList.appendChild(totalRow);
    bd.appendChild(bdList);
    section.appendChild(bd);

    // Detected risk indicators (finding cards)
    section.appendChild(el("h3", "block-title", "Detected Risk Indicators"));
    var grid = el("div", "findings");
    result.indicators.forEach(function (ind) {
      var card = el("article", "finding finding--" + severityClass(ind.weight));
      var head = el("div", "finding__head");
      var icon = el("span", "finding__icon"); icon.setAttribute("aria-hidden", "true"); icon.textContent = "\u26A0";
      head.appendChild(icon);
      head.appendChild(el("h4", "finding__name", ind.name));
      head.appendChild(el("span", "finding__pts", "+" + ind.weight));
      card.appendChild(head);
      // phrase chips (deduplicated by the engine already)
      var chipLabel = el("p", "finding__label", "Detected");
      card.appendChild(chipLabel);
      var chips = el("div", "chips");
      var chipSeen = {};
      ind.matchedPhrases.forEach(function (ph) {
        var key = String(ph).toLowerCase();
        if (chipSeen[key]) { return; }
        chipSeen[key] = true;
        chips.appendChild(el("span", "chip", ph));
      });
      if (ind.matchedPhrases.length === 0) { chipLabel.hidden = true; }
      else { card.appendChild(chips); }
      var whyT = el("p", "finding__subtitle", "Why this matters"); card.appendChild(whyT);
      card.appendChild(el("p", "finding__text", ind.explanation));
      var actT = el("p", "finding__subtitle", "Recommended action"); card.appendChild(actT);
      card.appendChild(el("p", "finding__text", ind.recommendedAction));
      grid.appendChild(card);
    });
    section.appendChild(grid);


    // Message with detected signals (safe highlighting)
    section.appendChild(el("h3", "block-title", "Message With Detected Signals"));
    var msgBox = el("div", "highlighted-message");
    var segs = buildHighlightSegments(result.originalMessage, result.indicators);
    segs.forEach(function (seg) {
      if (seg.highlighted) {
        var mark = el("mark", "hl", seg.text); // textContent only - no raw HTML
        msgBox.appendChild(mark);
      } else {
        msgBox.appendChild(document.createTextNode(seg.text));
      }
    });
    section.appendChild(msgBox);

    // High-risk calm guidance
    if (result.riskLevel === "HIGH") {
      var guide = el("div", "guidance guidance--high");
      guide.appendChild(el("p", "guidance__title", "Pause before taking action."));
      guide.appendChild(el("p", "guidance__text", meta.note));
      section.appendChild(guide);
    } else if (result.riskLevel === "MEDIUM") {
      var guideM = el("div", "guidance guidance--medium");
      guideM.appendChild(el("p", "guidance__title", meta.tagline));
      guideM.appendChild(el("p", "guidance__text", meta.note));
      section.appendChild(guideM);
    } else {
      var guideL = el("div", "guidance guidance--low");
      guideL.appendChild(el("p", "guidance__text", meta.note));
      section.appendChild(guideL);
    }

    // Recommended safety actions
    section.appendChild(el("h3", "block-title", "Recommended Safety Actions"));
    var recs = buildRecommendations(result);
    var recList = el("ul", "recs");
    recs.forEach(function (text) {
      var item = el("li", "recs__item");
      var tick = el("span", "recs__tick", "\u2713"); tick.setAttribute("aria-hidden", "true");
      item.appendChild(tick);
      item.appendChild(el("span", "recs__text", text));
      recList.appendChild(item);
    });
    section.appendChild(recList);

    appendDisclaimer(section);
  }

  function severityClass(weight) {
    if (weight >= 3) { return "high"; }
    if (weight >= 2) { return "medium"; }
    return "low";
  }

  function appendDisclaimer(section) {
    var d = el("p", "ta-disclaimer", "ScamShield MY identifies common scam risk indicators to support awareness. A risk score does not prove that a message is fraudulent.");
    d.setAttribute("role", "note");
    section.appendChild(d);
  }

  // ================= PHASE 4: analysis history (localStorage) =================
  var HISTORY_KEY = "scamshield_my_history";
  var HISTORY_MAX = 20;

  function storageAvailable() {
    try {
      if (typeof localStorage === "undefined") { return false; }
      var t = "__ss_test__";
      localStorage.setItem(t, "1"); localStorage.removeItem(t);
      return true;
    } catch (e) { return false; }
  }

  // Load history. Any failure/corruption -> empty list (never throws).
  function historyLoad() {
    try {
      if (!storageAvailable()) { return []; }
      var raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) { return []; }
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) { return []; }
      return parsed.filter(function (r) {
        return r && typeof r === "object" && typeof r.originalMessage === "string";
      });
    } catch (e) { return []; }
  }

  // Persist, trimming to the newest HISTORY_MAX. Fails soft on quota/errors.
  function historySave(records) {
    try {
      if (!storageAvailable()) { return false; }
      var trimmed = records.slice(0, HISTORY_MAX);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
      return true;
    } catch (e) {
      // Quota or other error: try shedding the oldest and retry once.
      try {
        var fewer = records.slice(0, Math.max(0, Math.min(records.length, HISTORY_MAX) - 1));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(fewer));
        return true;
      } catch (e2) { return false; }
    }
  }

  function makeHistoryId() {
    return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Build a compact record from a Phase 3 result object.
  function historyRecordFrom(result) {
    return {
      id: makeHistoryId(),
      timestamp: Date.now(),
      originalMessage: result.originalMessage,
      score: result.score,
      riskLevel: result.riskLevel,
      indicatorCount: result.indicatorCount,
      indicators: result.indicators
    };
  }

  // Public-ish history API (also used by tests via injectable storage).
  var HISTORY = {
    key: HISTORY_KEY,
    max: HISTORY_MAX,
    load: historyLoad,
    all: function () { return historyLoad(); },
    add: function (result) {
      var records = historyLoad();
      records.unshift(historyRecordFrom(result)); // newest first
      if (records.length > HISTORY_MAX) { records = records.slice(0, HISTORY_MAX); }
      historySave(records);
      return records;
    },
    clear: function () {
      try { if (storageAvailable()) { localStorage.removeItem(HISTORY_KEY); } } catch (e) {}
    }
  };

  if (typeof ENGINE !== "undefined" && ENGINE) {
    ENGINE.HISTORY = HISTORY;
    ENGINE.historyRecordFrom = historyRecordFrom;
  }


  function formatTimestamp(ts) {
    try {
      var d = new Date(ts);
      var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      var h = d.getHours(); var ampm = h >= 12 ? "PM" : "AM"; var h12 = h % 12; if (h12 === 0) { h12 = 12; }
      var mins = d.getMinutes(); var mm = mins < 10 ? "0" + mins : "" + mins;
      var day = d.getDate(); var dd = day < 10 ? "0" + day : "" + day;
      return dd + " " + months[d.getMonth()] + " " + d.getFullYear() + ", " + h12 + ":" + mm + " " + ampm;
    } catch (e) { return ""; }
  }

  function previewOf(message) {
    var s = String(message).replace(/\s+/g, " ").trim();
    return s.length > 90 ? s.slice(0, 90) + "..." : s;
  }

  var _historyInited = false;
  function initHistory() {
    if (_historyInited) { return; }
    _historyInited = true;
    var clearBtn = document.getElementById("clear-history-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (HISTORY.all().length === 0) { return; }
        var confirmFn = (typeof window !== "undefined" && window.confirm) ? window.confirm : function () { return true; };
        if (confirmFn("Clear all analysis history?")) {
          HISTORY.clear();
          renderHistory();
        }
      });
    }
    renderHistory();
  }

  // Re-run the CURRENT engine for a stored record; does NOT add a new record.
  function viewHistoryRecord(record) {
    var textarea = document.getElementById("message-input");
    if (textarea) {
      textarea.value = record.originalMessage;
      textarea.dispatchEvent(new Event("input"));
    }
    var result = analyzeMessage(record.originalMessage); // fresh analysis, current rules
    renderResult(result);
    var target = document.getElementById("threat-assessment");
    if (target && target.scrollIntoView) { target.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }

  function renderHistory() {
    var section = document.getElementById("history");
    if (!section) { return; }
    var clearBtn = document.getElementById("clear-history-btn");
    var records = HISTORY.all();

    // Remove any previously rendered list / empty-state body (keep the header).
    var oldList = section.querySelector("[data-history-body]");
    if (oldList) { section.removeChild(oldList); }
    var oldEmpty = section.querySelector(".empty-state");
    if (oldEmpty) { oldEmpty.hidden = records.length > 0; }

    if (clearBtn) { clearBtn.disabled = records.length === 0; }

    if (records.length === 0) { return; }

    var body = el("div"); body.setAttribute("data-history-body", "");
    var note = el("p", "history-note", "History is stored only in this browser.");
    body.appendChild(note);
    var list = el("ul", "history-list");
    records.forEach(function (rec) {
      var cls = (rec.riskLevel || "LOW").toLowerCase();
      var li = el("li", "history-item");
      var card = el("button", "history-card history-card--" + cls);
      card.type = "button";
      card.setAttribute("aria-label", "View analysis: " + rec.riskLevel + " risk, score " + rec.score);
      var top = el("div", "history-card__top");
      top.appendChild(el("span", "risk-badge risk-badge--" + cls, rec.riskLevel));
      top.appendChild(el("span", "history-card__score", "Score " + rec.score));
      card.appendChild(top);
      var meta = el("div", "history-card__meta");
      var n = rec.indicatorCount === 1 ? "1 indicator" : (rec.indicatorCount + " indicators");
      meta.appendChild(el("span", "history-card__count", n));
      meta.appendChild(el("span", "history-card__time", formatTimestamp(rec.timestamp)));
      card.appendChild(meta);
      card.appendChild(el("p", "history-card__preview", previewOf(rec.originalMessage)));
      card.addEventListener("click", function () { viewHistoryRecord(rec); });
      li.appendChild(card); list.appendChild(li);
    });
    body.appendChild(list);
    section.appendChild(body);
  }



})();

