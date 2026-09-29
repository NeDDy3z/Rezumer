# Rezumer
A browser extension to automatically save a timestamp of where you finished watching.

## How it works
While a video plays, Rezumer saves your position every few seconds and when you pause. It runs in every frame of a page, so it can also pick up embedded players like filemoon, vidmoly, mixdrop and voe.

When you open a page you have a saved time for, the popup opens on its own and shows the show, episode, player and time. Resume jumps the video to that time. If the video hasn't loaded yet, it jumps once it does. Clear removes the saved time.

On any other page, the popup lists everything you've watched. Play opens that page in the current tab and resumes it, and the X deletes it. On a page with a saved time, the button in the top right opens the same list.

Videos shorter than 2 minutes and muted videos are ignored. Once you reach the last minute of a video, its saved position is removed.

## Install (Firefox 149+)
1. Open `about:debugging#/runtime/this-firefox`.
2. Click "Load Temporary Add-on..." and pick `manifest.json`.
3. In `about:addons` -> Rezumer -> Permissions, allow access to all websites if it's not already on.

Temporary add-ons are removed when Firefox restarts. To keep it permanently, sign it as an unlisted add-on with `web-ext sign --channel=unlisted`.
