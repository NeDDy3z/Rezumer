const SAVE_INTERVAL_MS = 5000;
const PENDING_RESUME_TTL_MS = 10 * 60 * 1000;
const MIN_DURATION_S = 120;
const END_MARGIN_S = 60;

// Embed URLs on filemoon, vidmoly, mixdrop and voe: /e/<id>, /embed-<id>.html, etc.
const EMBED_PATH = /^\/(?:e|embed|d|f|v|w)\/([A-Za-z0-9]+)|^\/embed-([A-Za-z0-9]+)/;

const embed = location.pathname.match(EMBED_PATH);
const key = embed ? `video:${embed[1] ?? embed[2]}` : `video:${location.host}${location.pathname}${location.search}`;
let lastSave = 0;

document.addEventListener("timeupdate", (event) => {
  if (!isWatchedVideo(event.target) || Date.now() - lastSave < SAVE_INTERVAL_MS) return;
  lastSave = Date.now();
  save(event.target);
}, true);

document.addEventListener("pause", (event) => {
  if (isWatchedVideo(event.target)) save(event.target);
}, true);

document.addEventListener("loadedmetadata", (event) => {
  if (isLongVideo(event.target)) resumeIfPending(event.target);
}, true);

browser.runtime.onMessage.addListener((message) => {
  if (message.type !== "resume" || message.key !== key) return;
  const video = [...document.querySelectorAll("video")].find(isLongVideo);
  if (video) resumeIfPending(video);
});

if (window === window.top) openPopupIfSaved();

function isLongVideo(element) {
  return element instanceof HTMLVideoElement && element.duration >= MIN_DURATION_S;
}

// Muted videos are usually autoplaying backgrounds or previews, not something you're watching.
function isWatchedVideo(element) {
  return isLongVideo(element) && !element.muted;
}

function save(video) {
  if (video.currentTime > video.duration - END_MARGIN_S) return browser.storage.local.remove(key);
  return browser.runtime.sendMessage({
    type: "save",
    key,
    time: video.currentTime,
    frameTitle: document.title,
    host: location.hostname,
  });
}

async function resumeIfPending(video) {
  const { pendingResume } = await browser.storage.local.get("pendingResume");
  if (pendingResume?.key !== key || Date.now() - pendingResume.at > PENDING_RESUME_TTL_MS) return;
  await browser.storage.local.remove("pendingResume");
  video.currentTime = pendingResume.time;
  video.play().catch(() => {});
}

async function openPopupIfSaved() {
  const items = await browser.storage.local.get();
  const resumeStarted = Date.now() - (items.pendingResume?.at ?? 0) < PENDING_RESUME_TTL_MS;
  const here = pageAddress(location.href);
  const saved = Object.entries(items).some(([k, entry]) => k.startsWith("video:") && pageAddress(entry.url) === here);
  if (saved && !resumeStarted) browser.runtime.sendMessage({ type: "openPopup" });
}

function pageAddress(url) {
  if (!url) return "";
  const { origin, pathname } = new URL(url);
  return origin + pathname;
}
