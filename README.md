# Live UI Maker / Live Code Compiler Pro

A lightweight in-browser playground for HTML, CSS, JS, Python snippets, JSON, and Markdown with live preview, manual run control, and a polished glassmorphism UI.

## Features
- Manual run mode with preview pane, console intercept, and open-in-new-tab preview.
- Multi-file tabs (HTML/CSS/JS/Python/JSON/Markdown), import/export buttons, grouped sidebar, and per-file undo/redo.
- Markdown live preview (`md.html`) with auto-close pairs/tags, list continuation, fence closing, and 1s debounced render; Markdown files auto-open in a new tab on create/import.
- Editor conveniences: tab-size per language, auto-indentation, basic formatter for braced and HTML content, resizable sidebar and preview splitter.
- Quick guide modal on the logo button, glass/blur modal styling with click-off-to-close and animated open/close.
- Keyboard shortcuts: Run `Ctrl/Cmd+S` or `Ctrl/Cmd+Enter`, Toggle preview `Ctrl/Cmd+Shift+P`, Format `Ctrl/Cmd+Shift+F`, Toggle sidebar `Ctrl/Cmd+B`, Refresh preview `F5`, Undo/Redo `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y`.

## Getting Started
1. Clone the repo: `git clone https://github.com/bitcodeAShishcloud/Live-UI-MAKER.git`
2. Open the folder and launch a static server (any will do):
   - VS Code Live Server, or
   - `npx serve .` (Node), or
   - `python -m http.server 8000` (Python).
3. Visit the served URL (e.g., `http://localhost:8000/index.html`).
4. Use the Run button to refresh the embedded preview. Markdown files open in a separate `md.html` tab automatically.

## File Map
- `index.html` – main app shell, header/actions, sidebar, editors, preview + console.
- `script.js` – state, file management, history, formatting, preview/console plumbing, modal handlers.
- `styles.css` – layout, theme variables, glass/blur modal styling, animations.
- `md.html` – standalone Markdown live editor/preview helper.

## Notes
- Default auto-run is disabled; preview updates only on explicit Run/Refresh.
- Basic formatter covers braced languages and HTML; it is intentionally simple.
- Python execution uses Pyodide when Python files exist and is loaded on demand.
