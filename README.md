Silly Cats City — Make Everything Ridiculously Silly

Welcome to the official manual of nonsense for making and playing the silliest cat city on the internet.

This README is intentionally small, terribly enthusiastic, and focused only on the pure joy of game-making and goofiness.

How to play (very seriously)
----------------------------
- Use WASD or arrow keys to wiggle your cat around the city.
- Press Space to leap like a majestic noodle. Try not to trip on confetti.
- Click cats to gain Cute Points™ and make them go boing.
- Press C to cycle camera modes: Third-Person Snoot, First-Person Nuzzle, or Orbit Around The Chaos.
- Invite friends by creating a room and sending them the link — more cats, more chaos.

How to make the game sillier (quick dev tips)
--------------------------------------------
- Add more cat colors: open `main.js`, tweak the `palette` array and watch the parade of pastel purrs.
- Replace primitives with a custom `.glb` model: Load a GLTF in the Start menu ("Load Cat Model") and toggle "Use Uploaded Model".
- Make new emotes: in `main.js` add entries to `emoteTextures` (create new canvas textures with more faces, stickers, or laser eyes).
- Tune gravity/jump: change the `cat.userData.velocity.y` and gravity constant in `applyLocalMovement` for moon-cat or bowling-ball-cat physics.

How to add new silly features (3 ideas to try right now)
------------------------------------------------------
1. Confetti Volcano — spawn confetti when score > 50 and call `spawnConfettiBurst(x,z,count)`.
2. Dance Party Mode — make all cats dance by setting `danceParty = true` and play music with `startMusic()`.
3. Silly Missions — add another mission in `startMission()` (e.g., `find10`, `hugTheStatue`) and update UI via `updateMissionUI()`.

Developer quickstart (for people who like typing)
------------------------------------------------
Launch a local server (Node) and open the game:

```powershell
cd "D:\Projects\4d-projects\silly-cats-game"
npm install
node server.js
Start-Process "http://localhost:8000/"
```

To run static-only (no server chat):

```powershell
python -m http.server 8000
```

Contributing (bring silliness)
-----------------------------
- Open issues for wacky ideas, send PRs with tiny GIFs of your cat doing absurd things, or add a new emote and call it `:insanecute:`.
- Keep things lightweight: small patches, lots of color, zero shame.

License
-------
Do what you like with the silliness, just give the cats credit and maybe share a screenshot.

That is all. Be silly, make cats, enjoy the chaos.

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
