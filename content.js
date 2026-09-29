const SAVE_INTERVAL_MS = 5000;
const MIN_DURATION_S = 120;
const END_MARGIN_S = 60;

// Embed URLs on filemoon, vidmoly, mixdrop and voe: /e/<id>, /embed-<id>.html, etc.
const EMBED_PATH = /^\/(?:e|embed|d|f|v|w)\/([A-Za-z0-9]+)|^\/embed-([A-Za-z0-9]+)/;

let lastSave = 0;

document.addEventListener("timeupdate", (event) => {
  if (!isWatchedVideo(event.target) || Date.now() - lastSave < SAVE_INTERVAL_MS) return;
  lastSave = Date.now();
  save(event.target);
}, true);

document.addEventListener("pause", (event) => {
  if (isWatchedVideo(event.target)) save(event.target);
}, true);

browser.runtime.onMessage.addListener((message) => {
  if (window !== window.top) return;
  if (message.type === "resume") resumeAt(message.time);
  if (message.type === "showCard") showCard(message.entry, message.resumable);
});

function resumeAt(time) {
  const video = [...document.querySelectorAll("video")].find(isLongVideo);
  if (!video) return;
  video.currentTime = time;
  video.play().catch(() => {});
}

if (window === window.top) browser.runtime.sendMessage({ type: "pageOpened" });

// Read on every save because YouTube and Twitch switch videos without reloading the page.
function videoKey() {
  const embed = location.pathname.match(EMBED_PATH);
  return embed ? `video:${embed[1] ?? embed[2]}` : `video:${pageAddress(location.href)}`;
}

// Live streams have an infinite duration and nothing to come back to.
function isLongVideo(element) {
  return element instanceof HTMLVideoElement && Number.isFinite(element.duration) && element.duration >= MIN_DURATION_S;
}

// Muted videos are usually autoplaying backgrounds or previews. YouTube ads play in the same element.
function isWatchedVideo(element) {
  return isLongVideo(element) && !element.muted && !document.querySelector(".ad-showing");
}

function save(video) {
  const key = videoKey();
  if (video.currentTime > video.duration - END_MARGIN_S) return browser.storage.local.remove(key);
  return browser.runtime.sendMessage({
    type: "save",
    key,
    time: video.currentTime,
    frameTitle: document.title,
    host: location.hostname,
  });
}

// Same layout as the popup's saved-page view, scaled 1.25x because it's drawn at the page's own size.
const CARD_STYLE = `
  .card { position: fixed; top: 12px; left: 12px; right: 12px; z-index: 2147483647; padding: 20px;
    border-radius: 12px; background: #18181b; color: #f4f4f5; font: 17px system-ui, sans-serif;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4); }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }
  .row { display: flex; align-items: flex-start; gap: 15px; }
  .info { flex: 1; min-width: 0; }
  .title { overflow: hidden; font-size: 20px; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }
  .player { margin-top: -2.5px; color: #a1a1aa; font-size: 15px; }
  .time { margin-top: -1.55px; font-size: 35px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
  button { border: 0; font: inherit; cursor: pointer; }
  .icon { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; border-radius: 10px;
    background: #27272a; color: #d4d4d8; }
  .icon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8;
    stroke-linecap: round; stroke-linejoin: round; }
  .close { padding: 0 0 4px; font-size: 20px; line-height: 1; }
  .resume { width: 100%; height: 50px; margin-top: 15px; border-radius: 10px; background: #e11d48; color: #fff;
    font-weight: 600; }
`;
const TRASH_PATH = "M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4M6.8 6.5v4.5M9.2 6.5v4.5";

function showCard(entry, resumable) {
  document.getElementById("rezumer-card")?.remove();
  const host = document.createElement("div");
  host.id = "rezumer-card";
  const root = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = CARD_STYLE;
  const card = element("div", "card");

  const header = element("div", "header");
  const clear = element("button", "icon");
  clear.title = "Clear";
  clear.append(svgIcon(TRASH_PATH));
  clear.addEventListener("click", async () => {
    await browser.storage.local.remove(entry.key);
    host.remove();
  });
  const close = element("button", "icon close", "x");
  close.title = "Close";
  close.addEventListener("click", () => host.remove());
  header.append(clear, close);

  const row = element("div", "row");
  const info = element("div", "info");
  info.append(
    element("div", "title", [entry.show, entry.episode].filter(Boolean).join(" - ")),
    element("div", "player", entry.player ?? ""),
  );
  row.append(info, element("span", "time", formatTime(entry.time)));
  card.append(header, row);

  if (resumable) {
    const resume = element("button", "resume", "Resume");
    resume.addEventListener("click", () => {
      resumeAt(entry.time);
      host.remove();
    });
    card.append(resume);
  }

  root.append(style, card);
  document.documentElement.append(host);
}

function svgIcon(pathData) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  svg.append(path);
  return svg;
}

function element(tag, className, text = "") {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}
