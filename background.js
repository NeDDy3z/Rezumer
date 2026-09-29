const EPISODE_PATTERNS = [
  /^(.*?)\bS(\d{1,2})[\s._-]*E(\d{1,3})\b/i,
  /^(.*?)\bSeason\s*(\d{1,2})[\s,._-]*Episode\s*(\d{1,3})\b/i,
];
const RELEASE_JUNK = /\b(?:\d{3,4}p|WEB(?:-?DL|Rip)?|BluRay|BDRip|HDTV|DVDRip|x26[45]|HEVC|AAC|mkv|mp4)\b.*$/i;

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "save") save(message, sender);
  if (message.type === "pageOpened") openPopupIfSaved(sender.tab);
});

// YouTube and Twitch switch videos without a page load.
browser.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId, frameId }) => {
  if (frameId === 0) openPopupIfSaved(await browser.tabs.get(tabId));
});

async function openPopupIfSaved(tab) {
  if (!tab.active) return;
  const items = await browser.storage.local.get();
  const here = pageAddress(tab.url);
  const saved = Object.entries(items)
    .filter(([key, entry]) => key.startsWith("video:") && pageAddress(entry.url) === here)
    .map(([key, entry]) => ({ key, ...entry }))
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  if (!saved) return;

  // Firefox for Android can't open the popup from code, so the page shows its own card instead.
  const { os } = await browser.runtime.getPlatformInfo();
  if (os === "android") {
    const resumable = RESUMABLE_PLAYERS.includes(saved.player);
    browser.tabs.sendMessage(tab.id, { type: "showCard", entry: saved, resumable }, { frameId: 0 }).catch(() => {});
  } else {
    browser.action.openPopup().catch(() => {});
  }
}

async function save({ key, time, frameTitle, host }, sender) {
  if (sender.tab.incognito) return;
  const { [key]: saved } = await browser.storage.local.get(key);
  if (saved?.time >= time) return;
  browser.storage.local.set({
    [key]: {
      time,
      url: sender.tab.url,
      player: await playerName(sender, host),
      ...describe(sender.tab.title, frameTitle),
      updatedAt: Date.now(),
    },
  });
}

// Players often stream from rotating domains, so also look at the frames around the player,
// e.g. svetserialu.io/sources/filemoon wrapping mfw09.org/e/<id>.
async function playerName(sender, host) {
  const frames = await browser.webNavigation.getAllFrames({ tabId: sender.tab.id });
  let frame = frames.find((f) => f.frameId === sender.frameId);
  while (frame) {
    const name = playerFromUrl(frame.url);
    if (name) return name;
    frame = frames.find((f) => f.frameId === frame.parentFrameId);
  }
  return host.replace(/^www\./, "");
}

function describe(...titles) {
  for (const title of titles) {
    for (const pattern of EPISODE_PATTERNS) {
      const match = title?.match(pattern);
      if (match) {
        const [, show, season, episode] = match;
        return {
          show: clean(show.replace(/^watch\s+/i, "")),
          episode: `S${season.padStart(2, "0")}E${episode.padStart(2, "0")}`,
        };
      }
    }
  }
  return { show: clean(titles[0] ?? ""), episode: "" };
}

function clean(text) {
  const isFileName = !text.trim().includes(" ");
  if (isFileName) text = text.replace(/[._]+/g, " ").replace(RELEASE_JUNK, "");
  return text
    .replace(/^\(\d+\)\s*/, "")
    .replace(/^[\s:\u2013\u2014-]+/, "")
    .split(/\s*\|\s*|\s[\u2013\u2014]\s|\s-\s(?:watch|online|free|stream)|\s-\s(?:youtube|\S+\son\stwitch)$/i)[0]
    .replace(/^[\s:-]+|[\s:-]+$/g, "")
    .trim();
}
