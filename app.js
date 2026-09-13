// 交互逻辑：生词弹窗 + 生词本（localStorage，全书各页共用）
(function () {
  const LS_KEY = "zgkeywords_notebook";
  // 兼容旧版生词本数据
  try {
    if (!localStorage.getItem(LS_KEY) && localStorage.getItem("ydyl_notebook")) {
      localStorage.setItem(LS_KEY, localStorage.getItem("ydyl_notebook"));
    }
  } catch (e) {}

  const ALL_VOCAB = Object.assign({}, VOCAB1, VOCAB2, VOCAB3, DISCUSS_VOCAB);

  function $(id) { return document.getElementById(id); }

  // ---------- 生词本存取 ----------
  function loadNotebook() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveNotebook(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
    updateCount();
  }
  function inNotebook(word) {
    return loadNotebook().some(item => item.word === word);
  }
  function updateCount() {
    const el = $("nb-count");
    if (el) el.textContent = loadNotebook().length;
  }

  // ---------- 弹窗 ----------
  const popup = $("popup");
  const popupWord = $("popup-word");
  const popupPinyin = $("popup-pinyin");
  const popupGloss = $("popup-gloss");
  const popupSave = $("popup-save");
  let currentWord = null;

  function lookup(word) { return ALL_VOCAB[word]; }

  function openPopup(word) {
    const entry = lookup(word);
    if (!entry || !popup) return;
    currentWord = word;
    popupWord.textContent = word;
    popupPinyin.textContent = entry[0];
    popupGloss.textContent = entry[1];
    refreshSaveBtn();
    popup.classList.remove("hidden");
  }
  function closePopup() { if (popup) popup.classList.add("hidden"); currentWord = null; }

  function refreshSaveBtn() {
    if (!popupSave) return;
    if (currentWord && inNotebook(currentWord)) {
      popupSave.textContent = "✓ 已收入生词本";
      popupSave.classList.add("saved");
    } else {
      popupSave.textContent = "★ 收入生词本";
      popupSave.classList.remove("saved");
    }
  }

  document.querySelectorAll(".w[data-w]").forEach(span => {
    span.addEventListener("click", () => openPopup(span.dataset.w));
  });
  const popupCloseBtn = $("popup-close");
  if (popupCloseBtn) popupCloseBtn.addEventListener("click", closePopup);
  if (popup) popup.addEventListener("click", e => { if (e.target === popup) closePopup(); });

  if (popupSave) popupSave.addEventListener("click", () => {
    if (!currentWord) return;
    if (!inNotebook(currentWord)) {
      const list = loadNotebook();
      list.push({ word: currentWord, pinyin: lookup(currentWord)[0], gloss: lookup(currentWord)[1] });
      saveNotebook(list);
      renderNotebook();
    }
    refreshSaveBtn();
  });

  // ---------- 生词本抽屉 ----------
  const drawer = $("drawer");
  const mask = $("drawer-mask");
  const nbList = $("notebook-list");

  function openDrawer() { if (!drawer) return; drawer.classList.add("open"); if (mask) mask.classList.remove("hidden"); renderNotebook(); }
  function closeDrawer() { if (!drawer) return; drawer.classList.remove("open"); if (mask) mask.classList.add("hidden"); }

  const nbBtn = $("notebook-btn");
  if (nbBtn) nbBtn.addEventListener("click", openDrawer);
  const drawerCloseBtn = $("drawer-close");
  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);
  if (mask) mask.addEventListener("click", closeDrawer);

  function renderNotebook() {
    if (!nbList) return;
    const list = loadNotebook();
    nbList.innerHTML = "";
    if (list.length === 0) {
      const li = document.createElement("li");
      li.className = "nb-empty";
      li.textContent = "生词本还是空的，点击正文中的红色生词，再点“★ 收入生词本”吧！";
      nbList.appendChild(li);
      return;
    }
    list.forEach((item, idx) => {
      const li = document.createElement("li");
      const head = document.createElement("div");
      const w = document.createElement("span");
      w.className = "nb-word"; w.textContent = item.word;
      const py = document.createElement("span");
      py.className = "nb-py"; py.textContent = item.pinyin;
      head.appendChild(w); head.appendChild(py);
      const gloss = document.createElement("span");
      gloss.className = "nb-gloss"; gloss.textContent = item.gloss;
      const del = document.createElement("button");
      del.className = "nb-del"; del.textContent = "✕";
      del.title = "删除";
      del.addEventListener("click", () => {
        const arr = loadNotebook();
        arr.splice(idx, 1);
        saveNotebook(arr);
        renderNotebook();
      });
      li.appendChild(head); li.appendChild(gloss); li.appendChild(del);
      nbList.appendChild(li);
    });
  }

  // ---------- 文末词语表（按页面选择词表） ----------
  const ol = $("vocab-list");
  if (ol) {
    const listName = document.body.dataset.vocab || "VOCAB1";
    const lists = { VOCAB1, VOCAB2, VOCAB3, DISCUSS_VOCAB };
    const data = lists[listName] || VOCAB1;
    Object.keys(data).forEach(word => {
      const li = document.createElement("li");
      const b = document.createElement("b"); b.textContent = word;
      const py = document.createElement("span"); py.className = "py"; py.textContent = " (" + data[word][0] + ") ";
      const g = document.createElement("span"); g.textContent = "- " + data[word][1];
      li.appendChild(b); li.appendChild(py); li.appendChild(g);
      ol.appendChild(li);
    });
  }

  // ---------- 讨论词汇 ----------
  const dvOl = $("discuss-vocab");
  if (dvOl) {
    Object.keys(DISCUSS_VOCAB).forEach(word => {
      const li = document.createElement("li");
      li.textContent = word;
      li.addEventListener("click", () => openPopup(word));
      dvOl.appendChild(li);
    });
  }

  updateCount();
})();
