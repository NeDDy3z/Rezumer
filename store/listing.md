# AMO submission

Fields in the order the addons.mozilla.org form asks for them.

## 1. Distribution
On this site

## 2. Upload
`web-ext-artifacts/rezumer-1.0.0.zip` (built with `npx web-ext build`)

Compatible platforms: Firefox and Firefox for Android

## 3. Source code
No. The add-on has no build step, minification or bundled libraries.

## 4. Describe add-on

### Name
Rezumer

### Add-on URL
rezumer

### Summary
Remembers how far you got in a video on YouTube, Twitch and sites with embedded players. Shows the show, episode and time, and lists everything you've started watching.

### Description
Rezumer saves your position while you watch and shows it when you come back.

- Saves the time every few seconds and when you pause. The saved time only moves forward, so skipping back doesn't lose it.
- When you open a page you've watched before, the popup opens and shows the show, episode (like S04E08) and time. On Android, a card at the top of the page shows it instead.
- On YouTube, Twitch and Prehraj.to, Resume jumps the video back to the saved time.
- On any other page the popup lists everything you've watched. Search by show or episode, sort by date or name, open or delete entries.
- Also works inside embedded video players on other sites.
- Skips short clips, muted autoplay videos, YouTube ads and live streams. Finished videos are removed automatically.
- Settings show whether Rezumer has the access it needs, with a button to grant it.

Everything is stored locally in your browser. Nothing is sent anywhere, and nothing is saved in private windows.

### Experimental
No

### Requires payment
No

### Categories
Photos, Music & Videos; Tabs

### Tags
video, youtube, twitch, resume, watch history

### Support email
(your choice)

### Support website
https://github.com/NeDDy3z/Rezumer

### License
Apache License 2.0

### Privacy policy
None. The add-on declares no data collection (`data_collection_permissions: none`) and sends nothing off the device.

### Notes for reviewers
- No build step, minification or remote code. The uploaded files are the source.
- `host_permissions: <all_urls>` and a content script in all frames: videos are often in cross-origin iframes on rotating domains, so the script has to run in every frame to read the video's current time. It listens for `timeupdate` and `pause` on video elements. It only changes the page to seek the video when the user clicks Resume, and on Android to show a card (in a closed shadow root) when the page has a saved time.
- `webNavigation`: `getAllFrames` names the player from the surrounding frame URLs, and `onHistoryStateUpdated` notices video changes on YouTube and Twitch, which don't reload the page.
- `storage`: watched positions (time, page URL, title, player name) are kept in `storage.local` only.
- Private windows: nothing is saved when `tab.incognito` is true (background.js, `save`).
- `action.openPopup()` runs when the user opens a page that has a saved time. Firefox for Android doesn't support it, so there `runtime.getPlatformInfo()` is checked and the content script shows the card instead.
- `permissions.request` only runs when the user clicks Grant in settings, to re-grant site access they turned off.
- "Sync with cloud" in settings is a disabled placeholder. There is no network code.

## 5. Images

### Icon
Taken from the manifest (`icons/play.svg`).

### Screenshots
1. `screenshots/1-current-page.png` - "Popup on a page you've started watching"
2. `screenshots/2-watch-list.png` - "Everything you've watched, with search and sorting"

## 6. Version release notes (1.0.0)
First release.
