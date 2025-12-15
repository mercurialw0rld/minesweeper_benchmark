# Minesweeper AI (Gemini-powered)

A browser-based Minesweeper with an AI player powered by Google Gemini. Runs fully in the browser (works on GitHub Pages) and lets you watch the AI play autonomously or play yourself.

## What you can do
- Play classic Minesweeper (easy/medium/hard) with a modern neon UI.
- Let the AI auto-play: it keeps making moves until it wins or loses.
- Track stats per difficulty for both user and AI (wins/losses and average time). Data persists in `localStorage`.
- See a live timer centered above the grid and an AI status indicator on the play button.

## How it works
- `@google/genai` is loaded via an import map to the ESM build on `esm.sh`.
- The AI function (`aiPlay`) receives the current board state and returns an action (open or flag with coordinates).
- Autoplay loops calls to `aiPlay` with a small delay until the game ends.

## Getting started locally
1) Clone or download this folder.
2) Open `index.html` in a modern browser **or** serve the folder with a static server (recommended for consistent module loading).
3) Enter your Gemini API key in the top bar and click **Set API Key**.
4) Pick a difficulty, hit **New Game**, and optionally click **AI Play** to watch the AI.

### Notes on API keys
- Keys are entered in-page and used client-side; do **not** commit or expose your key publicly.
- For GitHub Pages, visitors must supply their own key. Consider usage quotas and billing.

## Deploying to GitHub Pages
- Push this folder to a GitHub repo.
- Enable Pages (e.g., `main` branch, `/` root). Pages will serve `index.html`.
- Remind users to provide their own Gemini API key in the UI.

## Files
- `index.html` – layout, controls, import map for `@google/genai`.
- `minesweeper.js` – game logic, timer, stats, AI autoplay loop.
- `aiplayer.js` – Gemini client and `aiPlay` function wiring.
- `minesweeper.css` – styles for board, HUD, and stats visualization.

## Tech stack
- Vanilla JS + modules, Google Gemini via `@google/genai` ESM build, `localStorage` for stats persistence.

## Privacy & limits
- All gameplay and stats stay in the browser; only API calls go to Gemini.
- Respect API usage limits and keep keys confidential.

Enjoy watching the AI sweep the board! :)
