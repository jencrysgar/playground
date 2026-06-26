# AI Knowledge Center

A rich, secure hub for your AI knowledge — **courses, skills, prompts, agents**, a **URL library**, favorites, private notes, tags, and search — behind user logins with **passkeys, authenticator (TOTP), and SMS 2FA**. Built with **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, and **Prisma** (PostgreSQL).

## Getting started

You need [Node.js](https://nodejs.org/) 20+ and a **PostgreSQL** database. The easiest hosted option is a free [Neon](https://neon.tech) or [Supabase](https://supabase.com) database — copy its connection string into `DATABASE_URL`.

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
npm install          # installs deps and generates the Prisma client
npm run db:push      # syncs the schema to your database
npm run db:seed      # loads demo users + content (idempotent, non-destructive)
npm run dev          # http://localhost:3000
```

> Set `DATABASE_URL` in a `.env` file (git-ignored) or as an environment variable. Because the database is hosted, your data persists across restarts and deploys.

### Demo accounts (password: `Password123!`)

| Email | Role | Can do |
| --- | --- | --- |
| `admin@akc.dev` | Admin | Everything: manage users, tags, view all notes |
| `editor@akc.dev` | Editor | Manage content & tags |
| `member@akc.dev` | Member | Browse, favorite, take notes, save links |

The **first account to ever sign up** becomes an Admin automatically.

## Features

- **Auth & MFA** — email/password, passkeys (WebAuthn), authenticator apps (TOTP), and SMS 2FA (dev mock logs the code to the server console).
- **Roles & access** — Member / Editor / Admin, with per-content access levels.
- **Content** — Courses → Modules → Lessons, plus Skills, Prompts, and Agents.
- **Prompts** — one-click copy and "Open in ChatGPT / Claude" deep links.
- **Favorites** — star any page; favorites page with card/list and expanded/collapsed views.
- **Notes** — private per-page notes (admins can review all notes).
- **Tags & search** — admins create tags and assign them to content; search by word/phrase and filter by tag.
- **URL Library** — a Raindrop-style bookmark manager with tags.
- **Personalization** — default landing page, light/dark/system theme.

## Project structure

| Path | What it is |
| --- | --- |
| `src/app/(auth)/` | Login, signup, and the 2FA step. |
| `src/app/(app)/` | The authenticated app (dashboard, content, settings, admin). |
| `src/lib/actions/` | Server Actions (auth, MFA, favorites, notes, links, admin). |
| `src/lib/` | Data access (`content.ts`), auth/session, permissions, Prisma client. |
| `src/components/` | UI kit, app shell, and feature components. |
| `prisma/schema.prisma` | Database schema. `prisma/seed.ts` seeds demo data. |

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Production build. |
| `npm run lint` | Lint the code. |
| `npm run db:push` | Sync the schema to the SQLite database. |
| `npm run db:seed` | Seed demo data (idempotent). |

## Going to production

- The app already uses PostgreSQL — point `DATABASE_URL` at your production database.
- Replace the SMS mock in `src/lib/actions/mfa.ts` with a real provider (e.g. Twilio).
- Passkeys derive the Relying Party ID from the request host, so they work on your real domain automatically over HTTPS.
- AI features need `OPENAI_API_KEY` and `ANTHROPIC_API_KEY`.
