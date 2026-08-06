(() => {
  const KEY = "fib-instructor-tracker-v2";
  const OLD_KEY = "fib-instructor-tracker-v1";
  const NORMS = { apps: 15, groups: 3 };

  const $ = (sel) => document.querySelector(sel);

  let selectedWeek = weekStart(Date.now());
  const state = load();

  function weekStart(ts) {
    const d = new Date(ts);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + diff);
    return d.getTime();
  }

  function weekEnd(start) {
    const d = new Date(start);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }

  function inWeek(ts, start) {
    return ts >= start && ts <= weekEnd(start);
  }

  function fmtDay(ts) {
    return new Date(ts).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  function fmtDateTime(ts) {
    return new Date(ts).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function weekLabel(start) {
    return `${fmtDay(start)} — ${fmtDay(weekEnd(start))}`;
  }

  function load() {
    try {
      let raw = localStorage.getItem(KEY);
      if (!raw) {
        const old = localStorage.getItem(OLD_KEY);
        if (old) {
          const data = JSON.parse(old);
          const migrated = {
            apps: (data.apps || []).map((a) => ({
              id: a.id || uid(),
              nick: a.nick || "",
              proof: a.proof || a.url || "",
              at: a.at || Date.now(),
            })),
            groups: data.groups || [],
            proofs: data.proofs || [],
            notes: data.notes || "",
          };
          localStorage.setItem(KEY, JSON.stringify(migrated));
          return migrated;
        }
        return { apps: [], groups: [], proofs: [], notes: "" };
      }
      const data = JSON.parse(raw);
      return {
        apps: Array.isArray(data.apps) ? data.apps : [],
        groups: Array.isArray(data.groups) ? data.groups : [],
        proofs: Array.isArray(data.proofs) ? data.proofs : [],
        notes: typeof data.notes === "string" ? data.notes : "",
      };
    } catch {
      return { apps: [], groups: [], proofs: [], notes: "" };
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    renderAll();
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function allWeekStarts() {
    const set = new Set([weekStart(Date.now())]);
    for (const a of state.apps) set.add(weekStart(a.at));
    for (const g of state.groups) set.add(weekStart(g.at));
    return [...set].sort((a, b) => b - a);
  }

  function appsInWeek(start = selectedWeek) {
    return state.apps
      .filter((a) => inWeek(a.at, start))
      .sort((a, b) => a.at - b.at);
  }

  function groupsInWeek(start = selectedWeek) {
    return state.groups
      .filter((g) => inWeek(g.at, start))
      .sort((a, b) => a.at - b.at);
  }

  function renderWeekSelect() {
    const sel = $("#weekSelect");
    const weeks = allWeekStarts();
    const current = weekStart(Date.now());
    sel.innerHTML = weeks
      .map((w) => {
        const tag = w === current ? " (текущая)" : "";
        return `<option value="${w}" ${w === selectedWeek ? "selected" : ""}>${weekLabel(w)}${tag}</option>`;
      })
      .join("");
  }

  function renderNorms() {
    const appsDone = appsInWeek().length;
    const groupsDone = groupsInWeek().length;
    $("#appsCount").textContent = appsDone;
    $("#groupsCount").textContent = groupsDone;
    $("#appsBar").style.width = Math.min(100, (appsDone / NORMS.apps) * 100) + "%";
    $("#groupsBar").style.width = Math.min(100, (groupsDone / NORMS.groups) * 100) + "%";
    document.querySelector('.norm[data-kind="apps"]').classList.toggle("is-done", appsDone >= NORMS.apps);
    document.querySelector('.norm[data-kind="groups"]').classList.toggle("is-done", groupsDone >= NORMS.groups);
  }

  function renderAppsTable() {
    const rows = appsInWeek();
    const body = $("#appsBody");
    const empty = $("#appsEmpty");
    empty.style.display = rows.length ? "none" : "block";
    body.innerHTML = rows
      .map(
        (a, i) => `<tr>
          <td class="col-num">${i + 1}</td>
          <td class="col-nick">${escapeHtml(a.nick)}</td>
          <td class="col-link"><a href="${escapeAttr(a.proof)}" target="_blank" rel="noopener">Открыть пруф</a></td>
          <td class="col-date">${fmtDateTime(a.at)}</td>
          <td class="col-actions"><button type="button" data-del="apps" data-id="${a.id}">×</button></td>
        </tr>`
      )
      .join("");
  }

  function renderGroupsTable() {
    const rows = groupsInWeek();
    const body = $("#groupsBody");
    const empty = $("#groupsEmpty");
    empty.style.display = rows.length ? "none" : "block";
    body.innerHTML = rows
      .map(
        (g, i) => `<tr>
          <td class="col-num">${i + 1}</td>
          <td>${escapeHtml(g.title)}</td>
          <td>${escapeHtml(g.people || "—")}</td>
          <td class="col-date">${fmtDateTime(g.at)}</td>
          <td class="col-actions"><button type="button" data-del="groups" data-id="${g.id}">×</button></td>
        </tr>`
      )
      .join("");
  }

  function renderProofsTable() {
    const rows = [...state.proofs].sort((a, b) => b.at - a.at);
    const body = $("#proofsBody");
    const empty = $("#proofsEmpty");
    empty.style.display = rows.length ? "none" : "block";
    body.innerHTML = rows
      .map(
        (p, i) => `<tr>
          <td class="col-num">${i + 1}</td>
          <td>${escapeHtml(p.title)}</td>
          <td class="col-link"><a href="${escapeAttr(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.url)}</a></td>
          <td class="col-date">${fmtDateTime(p.at)}</td>
          <td class="col-actions"><button type="button" data-del="proofs" data-id="${p.id}">×</button></td>
        </tr>`
      )
      .join("");
  }

  function renderHistory() {
    const weeks = allWeekStarts();
    const body = $("#historyBody");
    const empty = $("#historyEmpty");
    empty.style.display = weeks.length ? "none" : "block";
    body.innerHTML = weeks
      .map((w) => {
        const a = appsInWeek(w).length;
        const g = groupsInWeek(w).length;
        const aOk = a >= NORMS.apps;
        const gOk = g >= NORMS.groups;
        const cur = w === weekStart(Date.now()) ? ' class="is-current"' : "";
        return `<tr${cur} data-goto-week="${w}">
          <td><button type="button" class="week-link" data-goto-week="${w}">${weekLabel(w)}${w === weekStart(Date.now()) ? " · сейчас" : ""}</button></td>
          <td><strong>${a}</strong></td>
          <td><span class="pill ${aOk ? "ok" : "no"}">${aOk ? "норма" : "ещё " + (NORMS.apps - a)}</span></td>
          <td><strong>${g}</strong></td>
          <td><span class="pill ${gOk ? "ok" : "no"}">${gOk ? "норма" : "ещё " + (NORMS.groups - g)}</span></td>
        </tr>`;
      })
      .join("");
  }

  function renderAll() {
    renderWeekSelect();
    renderNorms();
    renderAppsTable();
    renderGroupsTable();
    renderProofsTable();
    renderHistory();
  }

  // Tabs
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("is-active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("is-active"));
      btn.classList.add("is-active");
      $(`#panel-${btn.dataset.tab}`).classList.add("is-active");
    });
  });

  $("#weekSelect").addEventListener("change", (e) => {
    selectedWeek = Number(e.target.value);
    renderAll();
  });

  document.addEventListener("click", (e) => {
    const goto = e.target.closest("[data-goto-week]");
    if (goto) {
      selectedWeek = Number(goto.dataset.gotoWeek);
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("is-active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("is-active"));
      document.querySelector('.tab[data-tab="apps"]').classList.add("is-active");
      $("#panel-apps").classList.add("is-active");
      renderAll();
      return;
    }

    const btn = e.target.closest("[data-del]");
    if (!btn) return;
    const kind = btn.dataset.del;
    const id = btn.dataset.id;
    state[kind] = state[kind].filter((x) => x.id !== id);
    save();
  });

  $("#appsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const at = Date.now();
    state.apps.push({
      id: uid(),
      nick: String(fd.get("nick") || "").trim(),
      proof: String(fd.get("proof") || "").trim(),
      at,
    });
    selectedWeek = weekStart(at);
    e.target.reset();
    save();
  });

  $("#groupsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const at = Date.now();
    state.groups.push({
      id: uid(),
      title: String(fd.get("title") || "").trim(),
      people: String(fd.get("people") || "").trim(),
      at,
    });
    selectedWeek = weekStart(at);
    e.target.reset();
    save();
  });

  $("#proofsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.proofs.unshift({
      id: uid(),
      title: String(fd.get("title") || "").trim(),
      url: String(fd.get("url") || "").trim(),
      at: Date.now(),
    });
    e.target.reset();
    save();
  });

  const notes = $("#notesArea");
  notes.value = state.notes;
  let notesTimer;
  notes.addEventListener("input", () => {
    state.notes = notes.value;
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => {
      localStorage.setItem(KEY, JSON.stringify(state));
    }, 250);
  });

  renderAll();
})();
