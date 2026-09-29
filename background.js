const EPISODE_PATTERNS = [
  /^(.*?)\bS(\d{1,2})[\s._-]*E(\d{1,3})\b/i,
  /^(.*?)\bSeason\s*(\d{1,2})[\s,._-]*Episode\s*(\d{1,3})\b/i,
];
const RELEASE_JUNK = /\b(?:\d{3,4}p|WEB(?:-?DL|Rip)?|BluRay|BDRip|HDTV|DVDRip|x26[45]|HEVC|AAC|mkv|mp4)\b.*$/i;
const KNOWN_PLAYERS = ["filemoon", "vidmoly", "mixdrop", "voe", "youtube"];

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "save") save(message, sender);
  if (message.type === "openPopup" && sender.tab.active) {
    browser.action.openPopup().catch(() => {});
  }
});

async function save({ key, time, frameTitle, host }, sender) {
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
    const name = KNOWN_PLAYERS.find((player) => frame.url.includes(player));
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
  return text
    .replace(/[._]+/g, " ")
    .replace(RELEASE_JUNK, "")
    .replace(/^[\s:\u2013\u2014-]+/, "")
    .split(/\s*\|\s*|\s[\u2013\u2014]\s|\s-\s(?:watch|online|free|stream)/i)[0]
    .replace(/^[\s:-]+|[\s:-]+$/g, "")
    .trim();
}
