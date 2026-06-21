<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 app. Source lives in `src/`. Standard scripts are in `package.json` (`dev`, `build`, `start`, `lint`).

- Dev server: `npm run dev` serves on `http://localhost:3000`. Use a tmux session for it so it survives between commands; it is not a foreground/blocking task to wait on.
- The guestbook data store (`src/lib/messages.ts`) is **in-memory**, so all messages reset whenever the dev/build server restarts. This is expected — replace it with a real database before relying on persistence.
- The home page (`src/app/page.tsx`) uses `export const dynamic = "force-dynamic"` so it always reflects the current in-memory messages on load; do not remove this unless you add real data fetching/caching.
- Lint uses a flat config (`eslint.config.mjs`) and enforces React 19 rules, including `react-hooks/set-state-in-effect`. Avoid calling `setState` synchronously inside `useEffect`; prefer fetching initial data in a Server Component and passing it to a Client Component (see `page.tsx` → `guestbook.tsx`).
