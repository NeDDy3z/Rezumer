# Rezumer
Firefox extension that remembers how far you got in a video.

- Saves your position while you watch. The saved time only moves forward.
- Opening a saved page shows the show, episode and time. On YouTube, Twitch and Prehraj.to, Resume jumps back to it. On Android it shows as a card at the top of the page.
- On other pages the popup lists everything you've watched, with search and sorting.
- Ignores videos under 2 minutes, muted videos, ads on YouTube and live streams. The saved time is removed once you reach the last minute.

## Supported players
YouTube, Twitch (VODs), Prehraj.to, Filemoon, Vidmoly, Mixdrop, Voe. Other sites with a normal video player often work too.

## Install (Firefox 149+)
1. Open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on..." and pick `manifest.json`.
2. In `about:addons` -> Rezumer -> Permissions, allow access to all websites.

Temporary add-ons are removed when Firefox restarts. To keep it, sign it with `web-ext sign --channel=unlisted`.

## Build
`npx web-ext build` creates the upload zip in `web-ext-artifacts/`. Listing text and screenshots for addons.mozilla.org are in `store/`.

To release, bump `version` in `manifest.json`, then push a matching tag (`git tag v1.0.0 && git push origin v1.0.0`). GitHub Actions builds the zip and attaches it to a new release.
