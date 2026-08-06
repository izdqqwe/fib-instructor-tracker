(() => {
  const KEY = "fib-instructor-tracker-v1";
  const NORMS = { apps: 15, groups: 3 };

  const $ = (sel) => document.querySelector(sel);

  const state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        return { apps: [], groups: [], proofs: [], notes: "", weekStarted: Date.now() };
      }
      const data = JSON.parse(raw);
      return {
        apps: Array.isArray(data.apps) ? data.apps : [],
        groups: Array.isArray(data.groups) ? data.groups : [],
        proofs: Array.isArray(data.proofs) ? data.proofs : [],
        notes: typeof data.notes === "string" ? data.notes : "",
        weekStarted: data.weekStarted || Date.now(),
      };
    } catch {
      return { apps: [], groups: [], proofs: [], notes: "", weekStarted: Date.now() };
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    renderNorms();
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function fmtDate(ts) {
    try {
      return new Date(ts).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  function renderNorms() {
    const appsDone = state.apps.length;
    const groupsDone = state.groups.length;

    $("#appsCount").textContent = appsDone;
    $("#groupsCount").textContent = groupsDone;

    $("#appsBar").style.width = Math.min(100, (appsDone / NORMS.apps) * 100) + "%";
    $("#groupsBar").style.width = Math.min(100, (groupsDone / NORMS.groups) * 100) + "%";

    document.querySelector('.norm[data-kind="apps"]').classList.toggle("is-done", appsDone >= NORMS.apps);
    document.querySelector('.norm[data-kind="groups"]').classList.toggle("is-done", groupsDone >= NORMS.groups);
  }

  function renderList(kind) {
    const map = {
      apps: { el: "#appsList", empty: "Пока нет одобренных заявок." },
      groups: { el: "#groupsList", empty: "Пока нет групп." },
      proofs: { el: "#proofsList", empty: "Пруфов ещё нет — вставь ссылку выше." },
    };
    const cfg = map[kind];
    const list = $(cfg.el);
    const items = state[kind];

    if (!items.length) {
      list.innerHTML = `<li class="empty">${cfg.empty}</li>`;
      return;
    }

    list.innerHTML = items
      .map((item) => {
        if (kind === "apps") {
          return `<li class="item" data-id="${item.id}">
            <div>
              <h3>${escapeHtml(item.nick)}</h3>
              <p>${escapeHtml([item.ranks && `Ранг: ${item.ranks}`, item.points && `Баллы: ${item.points}`].filter(Boolean).join(" · "))}</p>
              ${item.proof ? `<p><a href="${escapeAttr(item.proof)}" target="_blank" rel="noopener">Доказательства</a></p>` : ""}
            </div>
            <button type="button" data-del="${kind}" data-id="${item.id}">Удалить</button>
            <div class="meta">${fmtDate(item.at)}</div>
          </li>`;
        }
        if (kind === "groups") {
          return `<li class="item" data-id="${item.id}">
            <div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml([item.people, item.when].filter(Boolean).join(" · "))}</p>
            </div>
            <button type="button" data-del="${kind}" data-id="${item.id}">Удалить</button>
            <div class="meta">${fmtDate(item.at)}</div>
          </li>`;
        }
        return `<li class="item" data-id="${item.id}">
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p><a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.url)}</a></p>
          </div>
          <button type="button" data-del="${kind}" data-id="${item.id}">Удалить</button>
          <div class="meta">${fmtDate(item.at)}</div>
        </li>`;
      })
      .join("");
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

  // Tabs
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("is-active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("is-active"));
      btn.classList.add("is-active");
      $(`#panel-${btn.dataset.tab}`).classList.add("is-active");
    });
  });

  // Forms
  $("#appsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.apps.unshift({
      id: uid(),
      nick: String(fd.get("nick") || "").trim(),
      ranks: String(fd.get("ranks") || "").trim(),
      points: String(fd.get("points") || "").trim(),
      proof: String(fd.get("proof") || "").trim(),
      at: Date.now(),
    });
    e.target.reset();
    save();
    renderList("apps");
  });

  $("#groupsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.groups.unshift({
      id: uid(),
      title: String(fd.get("title") || "").trim(),
      people: String(fd.get("people") || "").trim(),
      when: String(fd.get("when") || "").trim(),
      at: Date.now(),
    });
    e.target.reset();
    save();
    renderList("groups");
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
    renderList("proofs");
  });

  // Delete
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-del]");
    if (!btn) return;
    const kind = btn.dataset.del;
    const id = btn.dataset.id;
    state[kind] = state[kind].filter((x) => x.id !== id);
    save();
    renderList(kind);
  });

  // Notes
  const notes = $("#notesArea");
  notes.value = state.notes;
  let notesTimer;
  notes.addEventListener("input", () => {
    state.notes = notes.value;
    clearTimeout(notesTimer);
    notesTimer = setTimeout(save, 250);
  });

  // Reset progress (keeps proofs + notes)
  $("#resetWeek").addEventListener("click", () => {
    if (!confirm("Сбросить заявки и группы? Пруфы и заметки останутся.")) return;
    state.apps = [];
    state.groups = [];
    state.weekStarted = Date.now();
    save();
    renderList("apps");
    renderList("groups");
  });

  renderNorms();
  renderList("apps");
  renderList("groups");
  renderList("proofs");
})();
