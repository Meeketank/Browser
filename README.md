# Meeket Browser

A Chromium desktop browser prototype and a Vercel workspace with the same branded home page. Personal Desk is a separate project.

## Web on Vercel

Import this repository with its root selected. The Vercel configuration publishes `web/` as a static site. Add `browser.meeket.in` under Domains after import. The workspace runs in the visitor's current browser and opens Google Search or Google's AI Mode, subject to Google's availability and account settings. It uses no Gemini API key.

## Windows desktop

Use Node.js 24. Run `npm install`, `npm test`, then `npm start`. Run `npm run package:win` to produce an unsigned portable Windows x64 app directory. Keep the entire directory together. Ctrl+L focuses the address bar, Ctrl+T opens a tab and Ctrl+W closes a tab. Shortcuts and bookmarks are stored locally. The browser uses Electron's Chromium engine and a persistent browsing profile.

## Ladybird

Run `git submodule update --init upstream/ladybird` to get the entire upstream source at the revision recorded by this repository. Follow the [Ladybird documentation](https://github.com/LadybirdBrowser/ladybird/tree/master/Documentation) to build it for your platform. If you have a compatible local build, set `MEEKET_LADYBIRD_BINARY` to the absolute executable path before starting Meeket Browser. The Ladybird toolbar button opens the current URL in that separate executable. Browser sessions are independent. A Linux executable built in WSL cannot be launched directly by the native Windows app.

This is a prototype. Verify Google sign-in, AI Mode and your key sites in the packaged app before distributing it. Release signing and automatic updates are still needed for a public release. The website links to GitHub Releases once you publish a desktop build there.
