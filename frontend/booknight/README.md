# Booknight Frontend

## What's in this zip

```
src/
  App.jsx                 - routing
  main.jsx                - Vite entrypoint
  index.css               - fonts, Tailwind layers, design tokens
  context/AuthContext.jsx - Context API: user session, login/register/logout
  store/useBoardStore.js  - Zustand: workspaces + bookmarks + optimistic add/poll
  store/useUIStore.js     - Zustand: sidebar collapse state
  lib/api.js              - fetch wrapper for the backend (auto-attaches JWT)
  components/
    ProtectedRoute.jsx
    layout/Sidebar.jsx        - workspace switcher
    bookmarks/CaptureBar.jsx  - paste-a-link input
    bookmarks/BentoGrid.jsx   - grid layout + empty/loading states
    bookmarks/BookmarkCard.jsx - one tile, pending->completed animation
  pages/
    LoginPage.jsx
    RegisterPage.jsx
    BoardPage.jsx
tailwind.config.js
postcss.config.js
.env.example
```

## Merging into your existing scaffold

Since you already have `npm create vite` run, don't overwrite your `package.json` or `vite.config.js` — just drop the `src/` contents in (overwriting the default `App.jsx`/`main.jsx`), plus `tailwind.config.js`, `postcss.config.js`, and `.env.example` at the project root.

## Install these dependencies

```bash
npm install react-router-dom zustand motion
npm install -D tailwindcss postcss autoprefixer
```

Copy `.env.example` to `.env` — the default already points at `http://localhost:5000/api`, matching the backend.

## Design tokens (already wired into tailwind.config.js)

Dark graphite app shell, warm paper-white cards, one accent (deep bookmark-ribbon green). Fraunces for titles, Work Sans for UI text. See the `colors`/`fontFamily` extensions in `tailwind.config.js`.

## About Watermelon UI and Motion Primitives

Both are copy-paste component registries with their own CLIs (`@watermelon-ui/cli`, and Motion Primitives' own `add` command) that fetch component source from their hosted registries. I can't run those CLIs from here since they need live network access I don't have — you'll need to run them yourself in the project:

```bash
npx @watermelon-ui/cli init
```

Then use its `add` command (check `npx @watermelon-ui/cli --help` for the current syntax — this is an actively developed tool) to pull in any pre-built components you want (buttons, dialogs, etc.) into a `components/ui/` folder. Motion Primitives works similarly — check motion-primitives.com for its current `npx` install command.

**What I built already uses plain Tailwind + the `motion` package directly** (see `BookmarkCard.jsx`'s `AnimatePresence`/`motion.div` for the pending→completed transition) so the app works standalone right now. Once you pull in Watermelon UI components, the natural places to swap them in are:
- `CaptureBar.jsx`'s input/button → a Watermelon UI input + button
- `Sidebar.jsx`'s workspace list items → Watermelon UI list/nav components
- Any dialogs/modals you add later (e.g. an edit-bookmark modal) → Watermelon UI's dialog primitive

## What's not built yet

- Bookmark editing (tags/title override) - the backend's `PATCH /bookmarks/:id` is ready, no UI for it yet
- Search/filtering within a workspace
- Workspace member management UI (backend route exists: `POST /workspaces/:id/members`)
- The actual bento card *span* logic is basic (image = 2x2, else 1x1) - could get more varied once there's real content to look at

## Running it

```bash
npm run dev
```

Make sure your backend (`npm run dev` in `Booknight/backend`) and worker (`npm run worker`) are both running too - the board needs all three.
