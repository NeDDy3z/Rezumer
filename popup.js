const detailView = document.getElementById("detail");
const listView = document.getElementById("list");

init();

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const entries = await loadEntries();
  const here = entries.find((entry) => pageAddress(entry.url) === pageAddress(tab.url));
  if (here) showDetail(here, tab);
  else showList(entries);
}

async function loadEntries() {
  const items = await browser.storage.local.get();
  return Object.entries(items)
    .filter(([key, entry]) => key.startsWith("video:") && entry.url)
    .map(([key, entry]) => ({ key, ...entry }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function showDetail(entry, tab) {
  document.getElementById("title").textContent = label(entry);
  document.getElementById("player").textContent = entry.player ?? "";
  document.getElementById("time").textContent = formatTime(entry.time);

  document.getElementById("resume").addEventListener("click", async () => {
    await setPendingResume(entry);
    await browser.tabs.sendMessage(tab.id, { type: "resume", key: entry.key }).catch(() => {});
    window.close();
  });
  document.getElementById("clear").addEventListener("click", async () => {
    await browser.storage.local.remove(entry.key);
    showList(await loadEntries());
  });
  document.getElementById("show-list").addEventListener("click", async () => showList(await loadEntries()));

  detailView.hidden = false;
}

function showList(entries) {
  const list = document.getElementById("entries");
  const template = document.getElementById("entry-template");
  list.replaceChildren();

  for (const entry of entries) {
    const item = template.content.cloneNode(true);
    item.querySelector("h2").textContent = label(entry);
    item.querySelector(".muted").textContent = entry.player ?? "";
    item.querySelector(".play").addEventListener("click", async () => {
      await setPendingResume(entry);
      await browser.tabs.update({ url: entry.url });
      window.close();
    });
    item.querySelector(".delete").addEventListener("click", async () => {
      await browser.storage.local.remove(entry.key);
      showList(await loadEntries());
    });
    list.append(item);
  }

  document.getElementById("empty").hidden = entries.length > 0;
  detailView.hidden = true;
  listView.hidden = false;
}

function setPendingResume(entry) {
  return browser.storage.local.set({ pendingResume: { key: entry.key, time: entry.time, at: Date.now() } });
}

function label(entry) {
  return [entry.show, entry.episode].filter(Boolean).join(" - ");
}

function pageAddress(url) {
  if (!url) return "";
  const { origin, pathname } = new URL(url);
  return origin + pathname;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
