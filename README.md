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
# Silly Cats City — Ultra Cilly 3D

**Latest update:** 2026-01-17 — pre-game UI, multiplayer scaffolding, emotes, missions, and a detailed checkpoint were added.

## Overview

Silly Cats City is a browser Three.js demo/game with low-poly cats, procedural city blocks, simple missions, and optional multiplayer using the included Node WebSocket server.

## Recent work

- Pre-game nickname + single/multi choice, room create/join UI.
- Local player assignment, WASD movement, jump/gravity, three camera modes (3rd/1st/Orbit) with persistent zoom.
- NPC wandering cats, mission scaffold (`find5`), emotes, confetti/dance-party effects, and WebAudio music scaffolding.
- WebSocket server (`server.js`) for rooms, chat, host actions and persisted chat history.
- Checkpoint file: `CHECKPOINT_FULL.md` (detailed session notes, 2026-01-17).

## Run locally (development)

1. Install dependencies and start the server:

```powershell
cd "D:\Projects\4d-projects\silly-cats-game"
npm install
node server.js
```

2. Open the game in a browser (multiple windows simulate players):

```powershell
Start-Process "http://localhost:8000/?room=test&user=Alice"
Start-Process "http://localhost:8000/?room=test&user=Bob"
```

Port note: the server uses port `8000` by default. If the port is occupied, stop the other process (example):

```powershell
taskkill /F /IM node.exe
node server.js
```

## Multiplayer details

- Rooms are short IDs. First joiner becomes `host` and can `start` or `kick` players.
- Client sends `pos` messages periodically; remote clients interpolate positions.
- Supported WS message types: `join`, `chat`, `pos`, `members`, `host`, `start`, `kick`, `kicked`, `kick_notice`, `leave`, `error`, `emote`, and `history`.

## Publish to GitHub Pages

I pushed changes to branch `checkpoint/2026-01-17` and merged them into `main`. If your repository has GitHub Pages enabled to serve from `main` (or a GH Action that publishes on push), pushing to `main` will trigger a redeploy automatically.

To merge locally and push (example):

```bash
git checkout main
git pull origin main
git merge checkpoint/2026-01-17
git push origin main
```

After pushing, check the repository's Actions tab for the deployment workflow and the Pages settings for the published URL.

## Files to inspect

- `index.html`, `main.js`, `style.css` — client code and UI.
- `server.js` — simple server + WebSocket handling.
- `CHECKPOINT_FULL.md` — full session checkpoint.

## Next recommended work

1. Synchronize mission and NPC state across clients (`mission_update`, `npc_state`) via server relay.
2. Emote replication rate-limits and audit events on server.
3. Replace primitive cats with GLTF assets and add walking animations.

## License

See the repository `LICENSE` file.

Enjoy — tell me if you want me to open a PR description, create release notes, or continue implementing server-side mission sync.
