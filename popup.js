const detailView = document.getElementById("detail");
const listView = document.getElementById("list");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");

const SORTS = {
  newest: (a, b) => b.updatedAt - a.updatedAt,
  oldest: (a, b) => a.updatedAt - b.updatedAt,
  az: (a, b) => label(a).localeCompare(label(b), undefined, { numeric: true }),
  za: (a, b) => label(b).localeCompare(label(a), undefined, { numeric: true }),
};

searchInput.addEventListener("input", showList);
sortSelect.addEventListener("change", showList);

init();

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const entries = await loadEntries();
  const here = entries
    .filter((entry) => pageAddress(entry.url) === pageAddress(tab.url))
    .sort(SORTS.newest)[0];
  if (here) showDetail(here);
  else showList();
}

async function loadEntries() {
  const items = await browser.storage.local.get();
  return Object.entries(items)
    .filter(([key, entry]) => key.startsWith("video:") && entry.url)
    .map(([key, entry]) => ({ key, ...entry }));
}

function showDetail(entry) {
  document.getElementById("title").textContent = label(entry);
  document.getElementById("player").textContent = entry.player ?? "";
  document.getElementById("time").textContent = formatTime(entry.time);

  document.getElementById("clear").addEventListener("click", async () => {
    await browser.storage.local.remove(entry.key);
    showList();
  });
  document.getElementById("show-list").addEventListener("click", showList);

  detailView.hidden = false;
}

async function showList() {
  const words = searchInput.value.toLowerCase().split(/\s+/).filter(Boolean);
  const entries = (await loadEntries())
    .filter((entry) => words.every((word) => label(entry).toLowerCase().includes(word)))
    .sort(SORTS[sortSelect.value]);

  const list = document.getElementById("entries");
  const template = document.getElementById("entry-template");
  list.replaceChildren();

  for (const entry of entries) {
    const item = template.content.cloneNode(true);
    item.querySelector("h2").textContent = label(entry);
    item.querySelector(".muted").textContent = entry.player ?? "";
    item.querySelector(".play").addEventListener("click", async () => {
      await browser.tabs.update({ url: entry.url });
      window.close();
    });
    item.querySelector(".delete").addEventListener("click", async () => {
      await browser.storage.local.remove(entry.key);
      showList();
    });
    list.append(item);
  }

  const empty = document.getElementById("empty");
  empty.textContent = words.length ? "No matches." : "Nothing watched yet.";
  empty.hidden = entries.length > 0;
  detailView.hidden = true;
  listView.hidden = false;
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
