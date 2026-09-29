const EPISODE_PATTERNS = [
  /^(.*?)\bS(\d{1,2})[\s._-]*E(\d{1,3})\b/i,
  /^(.*?)\bSeason\s*(\d{1,2})[\s,._-]*Episode\s*(\d{1,3})\b/i,
];
const RELEASE_JUNK = /\b(?:\d{3,4}p|WEB(?:-?DL|Rip)?|BluRay|BDRip|HDTV|DVDRip|x26[45]|HEVC|AAC|mkv|mp4)\b.*$/i;
const KNOWN_PLAYERS = ["filemoon", "vidmoly", "mixdrop", "voe", "youtube"];

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "save") {
    const { key, time, frameTitle, host } = message;
    browser.storage.local.set({
      [key]: {
        time,
        url: sender.tab.url,
        player: playerName(host),
        ...describe(sender.tab.title, frameTitle),
        updatedAt: Date.now(),
      },
    });
  }
  if (message.type === "openPopup" && sender.tab.active) {
    browser.action.openPopup().catch(() => {});
  }
});

function playerName(host) {
  return KNOWN_PLAYERS.find((name) => host.includes(name)) ?? host.replace(/^www\./, "");
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
