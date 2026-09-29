# Rezumer
A browser extension to automatically save a timestamp of where you finished watching.

## How it works
While a video plays, Rezumer saves your position every few seconds and when you pause. A saved time only ever moves forward, so skipping back doesn't overwrite it. It runs in every frame of a page, so it can also pick up embedded players like filemoon, vidmoly, mixdrop and voe.

When you open a page you have a saved time for, the popup opens on its own and shows the show, episode, player and time you got to. Clear removes it, and the button in the top right shows everything you've watched.

On any other page, the popup shows that list straight away. You can search it by show or episode and sort it by date or name. Play opens the page where you watched it, and the X deletes it.

Videos shorter than 2 minutes and muted videos are ignored. Once you reach the last minute of a video, its saved time is removed.

## Install (Firefox 149+)
1. Open `about:debugging#/runtime/this-firefox`.
2. Click "Load Temporary Add-on..." and pick `manifest.json`.
3. In `about:addons` -> Rezumer -> Permissions, allow access to all websites if it's not already on.

Temporary add-ons are removed when Firefox restarts. To keep it permanently, sign it as an unlisted add-on with `web-ext sign --channel=unlisted`.
