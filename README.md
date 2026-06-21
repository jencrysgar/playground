# My App

A full-stack web app starter built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**. It includes a working "guestbook" feature so you can see frontend and backend working together end to end.

## Getting started

You need [Node.js](https://nodejs.org/) (version 20 or newer) installed.

1. Install dependencies (only needed the first time, or when dependencies change):

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser. Edit a file in `src/` and the page updates automatically.

## What's inside

| Path | What it is |
| --- | --- |
| `src/app/page.tsx` | The home page (a Server Component). |
| `src/app/guestbook.tsx` | The interactive guestbook form + list (a Client Component). |
| `src/app/api/messages/route.ts` | The backend API: `GET` lists messages, `POST` adds one. |
| `src/lib/messages.ts` | A simple in-memory data store (resets when the server restarts). |
| `src/app/layout.tsx` | The shared page shell (fonts, global styles, metadata). |
| `src/app/globals.css` | Global styles and Tailwind setup. |

## Common commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app in development mode (auto-reloads on changes). |
| `npm run build` | Build the app for production. |
| `npm start` | Run the production build (run `npm run build` first). |
| `npm run lint` | Check the code for problems. |

## Next steps as you grow

- **Save data permanently:** the guestbook currently stores messages in memory, so they disappear on restart. Swap `src/lib/messages.ts` for a real database (SQLite and Postgres are popular choices).
- **Add more pages:** create a new folder under `src/app/` with a `page.tsx` file.
- **Add more backend endpoints:** create a `route.ts` file under `src/app/api/`.
