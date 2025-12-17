# LLM Control Center

A modern, minimalist LLM management console inspired by Open WebUI, LM Studio, and AnythingLLM. The app ships as a dependency-free static experience with localStorage persistence, polished dark/light theming, and a focus on daily operator workflows.

## Features
- **Chat workspace**: multi-chat sessions, inline rename/delete, per-chat system prompt, keyboard shortcut (Cmd/Ctrl + Enter), and persistence.
- **History search**: fuzzy filter across chat titles and message content.
- **Model & server routing**: assign models/servers per chat, view metadata (size, quant, context window, throughput), and simulate latency pings with live indicators.
- **Configuration**: per-chat overrides (temperature, top-p, max tokens, streaming, stop sequences), global defaults for new chats, and quick-apply presets with custom saving.
- **Themes & UX**: light/dark toggle, subtle transitions, responsive layout, badges, and clean typography.

## Getting Started
1. Ensure Node.js 18+ is available (already installed in this workspace).
2. From the repo root, start the static server:
   ```bash
   npm start
   ```
3. Open `http://localhost:4173` in your browser.

> Tip: No package installation is required; the project is dependency-free and uses modern browser ES modules.

## Architecture Notes
- **State**: A lightweight store (`src/state/store.js`) centralizes app state and persists to `localStorage` under `llm-control-center-state-v1`.
- **Seed data**: Models, servers, presets, and starter chat data live in `src/state/defaults.js`.
- **UI**: Pure HTML/CSS/JS modules (`src/app.js`, `src/styles.css`) render a responsive sidebar + workspace + settings drawer layout.
- **Extensibility**: Add new providers or features by extending the model/server arrays and enriching the render + event handlers in `src/app.js`.

## Roadmap Ideas
- Wire chat streaming to a real backend transport (Server-Sent Events or WebSockets).
- Multi-user accounts with role-based permissions and shared workspaces.
- Audit logs, token-level analytics, and cost dashboards.
- Import/export of presets and chat transcripts.
