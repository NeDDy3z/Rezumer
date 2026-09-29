const VIEWS = ["detail", "list", "settings"];
const ALL_SITES = { origins: ["<all_urls>"] };
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");

const SORTS = {
  newest: (a, b) => b.updatedAt - a.updatedAt,
  oldest: (a, b) => a.updatedAt - b.updatedAt,
  az: (a, b) => label(a).localeCompare(label(b), undefined, { numeric: true }),
  za: (a, b) => label(b).localeCompare(label(a), undefined, { numeric: true }),
};

let currentView;
let previousView = "list";

searchInput.addEventListener("input", showList);
sortSelect.addEventListener("change", showList);
setUpSettings();

init();

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const entries = await loadEntries();
  const here = entries
    .filter((entry) => pageAddress(entry.url) === pageAddress(tab.url))
    .sort(SORTS.newest)[0];
  if (here) showDetail(here, tab);
  else showList();
}

async function loadEntries() {
  const items = await browser.storage.local.get();
  return Object.entries(items)
    .filter(([key, entry]) => key.startsWith("video:") && entry.url)
    .map(([key, entry]) => ({ key, ...entry }));
}

function showDetail(entry, tab) {
  const title = document.getElementById("title");
  title.textContent = title.title = label(entry);
  document.getElementById("player").textContent = entry.player ?? "";
  document.getElementById("time").textContent = formatTime(entry.time);

  const resume = document.getElementById("resume");
  resume.hidden = !RESUMABLE_PLAYERS.includes(entry.player);
  resume.addEventListener("click", async () => {
    await browser.tabs.sendMessage(tab.id, { type: "resume", time: entry.time }).catch(() => {});
    window.close();
  });
  const listBack = document.getElementById("list-back");
  listBack.hidden = false;
  listBack.addEventListener("click", () => showView("detail"));
  document.getElementById("clear").addEventListener("click", async () => {
    await browser.storage.local.remove(entry.key);
    listBack.hidden = true;
    showList();
  });
  document.getElementById("show-list").addEventListener("click", showList);

  showView("detail");
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
    const title = item.querySelector("h2");
    title.textContent = title.title = label(entry);
    item.querySelector(".muted").textContent = `${entry.player ?? ""} (${formatTime(entry.time)})`.trim();
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
  showView("list");
}

function setUpSettings() {
  const manifest = browser.runtime.getManifest();
  document.getElementById("version").textContent = manifest.version;
  document.getElementById("repo").addEventListener("click", (event) => {
    event.preventDefault();
    browser.tabs.create({ url: manifest.homepage_url });
    window.close();
  });

  for (const button of document.querySelectorAll(".show-settings")) {
    button.addEventListener("click", () => {
      previousView = currentView;
      updatePermissionStatus();
      showView("settings");
    });
  }
  document.getElementById("back").addEventListener("click", () => showView(previousView));
  // Firefox only shows the permission prompt when request() runs directly in the click handler.
  document.getElementById("grant").addEventListener("click", () => {
    browser.permissions.request(ALL_SITES).then(updatePermissionStatus);
  });
}

async function updatePermissionStatus() {
  const granted = await browser.permissions.contains(ALL_SITES);
  document.getElementById("permission").classList.toggle("missing", !granted);
  document.getElementById("permission-text").textContent = granted
    ? "All permissions granted."
    : "Access to all websites is off, so videos can't be tracked.";
  document.getElementById("grant").hidden = granted;
}

function showView(name) {
  for (const view of VIEWS) document.getElementById(view).hidden = view !== name;
  currentView = name;
}

function label(entry) {
  return [entry.show, entry.episode].filter(Boolean).join(" - ");
}
