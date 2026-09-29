const PLAYERS = {
  youtube: /youtube\.com|youtu\.be/,
  twitch: /twitch\.tv/,
  prehrajto: /prehraj\.to/,
  filemoon: /filemoon/,
  vidmoly: /vidmoly/,
  mixdrop: /mixdrop/,
  voe: /voe/,
};

// Players whose video sits on the page itself, so the popup can seek it.
const RESUMABLE_PLAYERS = ["youtube", "twitch", "prehrajto"];

function playerFromUrl(url) {
  return Object.keys(PLAYERS).find((name) => PLAYERS[name].test(url));
}

// One address per video page. YouTube keeps the video id in ?v=, everything else in the path.
function pageAddress(url) {
  if (!url) return "";
  const { origin, pathname, searchParams } = new URL(url);
  const videoId = searchParams.get("v");
  return origin + pathname + (videoId ? `?v=${videoId}` : "");
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
