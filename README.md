Silly Cats City — Ultra Cilly 3D

Quick start

 
Notes on chat and default model:
- A default low-poly cat model is included in `defaultCatModel.js` and is used when you haven't uploaded a `.glb`.
- Chat messages are broadcast via WebSocket and server keeps a short history; when clients connect they receive recent messages.
- Set your displayed name in the menu's "Your name" box; it persists in `localStorage`.

Publishing this project on GitHub + GitHub Pages
------------------------------------------------

I prepared a GitHub Actions workflow to deploy the `silly-cats-game` folder to GitHub Pages automatically whenever you push to `main`.

Steps to publish:

1. Create a new repository on GitHub (e.g. `silly-cats-game`).
2. Add this project as a local git repo and push:

```powershell
cd 'd:\Projects\4d-projects\silly-cats-game'
git init
git add .
git commit -m "Initial silly-cats-game"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

3. The GitHub Actions workflow `.github/workflows/deploy.yml` deploys the `silly-cats-game` folder to GitHub Pages (it will publish to the `gh-pages` branch by default). Wait a minute after pushing and check the Actions tab for deployment success.

4. After the workflow runs, your site will be available at `https://YOUR_USER.github.io/YOUR_REPO/` (pages may take a minute).

Notes and alternatives
- If you prefer to serve from the `docs/` folder on the `main` branch, copy the contents of `silly-cats-game` into a `docs/` folder and enable Pages from the `docs` folder in repo settings.
- The PowerShell script `start-release.ps1` creates a zip under `releases/` you can attach to GitHub release assets.

Google Analytics
----------------

If you want to add Google Analytics, replace the `G-XXXXXXX` placeholder in `index.html` with your GA4 Measurement ID. The page includes a small gtag snippet which will begin sending page views once you replace the ID.

Suggested repo name and site URL
--------------------------------

I recommend using `silly-cats-city` as the repository name; after publishing your site will be available at:

```
https://deviverr.github.io/silly-cats-city/
```

Public site URL (suggested / Stream):

https://silly-cats-city.deviver.art

Google Analytics Measurement ID used in this repo: `G-8QF45D3YF3` (Stream ID 13315253127)


Python 3 built-in server:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

Or use `npx serve`:

```powershell
npx serve .
```

What this is

- A tiny Three.js scene with cute, primitive "cats" made from simple shapes.
- Cats perform random, quirky, silly actions (bobbing, short spins, tongue-out wiggles).
- A procedural WebAudio music engine generates ultra-cilly background music you can toggle.

Notes & next steps

- Replace primitive cats with GLTF models for extra cuteness.
- Add sound effects (meows, boops) — use short public-domain samples or synthesize with WebAudio.
- Adjust colors and animations to taste.

New features added:

- Upload your own `.glb`/`.gltf` cat model using the "Load Cat Model" button. Toggle "Use Uploaded Model" to switch between primitives and your model.
- Click a cat to earn "cute points" — each click plays a silly meow and briefly bounces the cat.
- Record the canvas as WebM using the "Start Recording" button; stop to get a download.
- Download a packaged zip of the project using "Download Project Zip" (JSZip loaded from CDN).

WebSocket chat server

If you run the project with the included Node server, the chat UI will connect to the WebSocket endpoint and broadcast messages between connected players.

Run with Node (recommended):

```powershell
cd 'd:\Projects\4d-projects\silly-cats-game'
npm install
npm start
```

This starts `server.js` which serves the static files and hosts a WebSocket chat endpoint on the same port (default 8000). Open the same URL in multiple browser windows to chat between them.

To run a quick static-only server (no WebSocket), you can also use:

```powershell
python -m http.server 8000
```


Enjoy the silliness! If you'd like, I can add a packaged download, build scripts, or convert this to a Unity prototype.