# MeeNav

MeeNav is a web workspace for search and shortcuts, and a desktop browser with a shared start page. Personal Desk remains a separate project.

## Deploy to Vercel

1. Import [Meeketank/Browser](https://github.com/Meeketank/Browser) from GitHub.
2. Select **Other** for Framework Preset and keep **Root Directory** at the repository root. The checked-in `vercel.json` serves `web/` directly. If an existing project overrides the build settings, clear the custom build command and set Output Directory to `web`.
3. Deploy. On the deployment URL, try a website address, a Google search, and adding a shortcut. Add your MeeNav domain under **Settings → Domains** and use the DNS records Vercel provides.

The web workspace opens sites and Google searches in new tabs in the visitor's browser. It stores custom shortcuts in that browser for the current domain. Google AI Mode depends on Google's availability and account settings. No environment variables, API keys, or backend are required. The MeeBI tile links to the project repository. Use **Add shortcut** for your live MeeBI URL or other apps.

## Run the desktop browser

Use Node.js 24 and run:

```sh
npm install
npm test
npm start
```

The desktop app uses Electron's Chromium engine to load sites in its own tabs. It includes navigation, a local Chromium profile, bookmarks, and session restore for open websites. Press Ctrl+L to focus the address bar, Ctrl+T for a new tab, and Ctrl+W to close it. Use Command on macOS.

Run `npm run package:win` for an unsigned Windows x64 portable build in `dist/MeeNav-win32-x64/`. Keep that folder together and run `MeeNav.exe`. The **Windows desktop build** GitHub Actions workflow publishes the folder as an artifact. The web page's **Desktop releases** link points to GitHub Releases, where you can publish the packaged app. Test sign-in and your ecosystem apps in the packaged build before distributing it.

## Ladybird engine source

The repository pins the full upstream Ladybird source as a submodule. The supplied source archive is a pre-alpha Ladybird snapshot with its own LibWeb rendering engine and LibJS JavaScript engine.

```sh
git submodule update --init upstream/ladybird
```

Follow the [Ladybird build instructions](https://github.com/LadybirdBrowser/ladybird/blob/master/Documentation/BuildInstructionsLadybird.md) for your platform. Set `MEENAV_LADYBIRD_BINARY` to the absolute path of a compatible, locally built executable before launching MeeNav. The **Ladybird** button hands the current address to that separate process. Chromium and Ladybird maintain independent profiles and rendering pipelines. A Ladybird binary built for Linux under WSL needs to be launched from WSL.
