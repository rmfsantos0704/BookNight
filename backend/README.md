# Backend API — Social Bookmark & Link Curation Engine

This is the **API Gateway** layer from the architecture doc: Express + MongoDB (Mongoose) + JWT auth, with a BullMQ producer that hands scraping jobs off to the (separate) worker service.

## Setup

```bash
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, Redis creds
npm install
npm run dev             # nodemon, or `npm start` for plain node
```

Requires a running MongoDB Atlas connection and a reachable Redis instance (BullMQ needs Redis even before the worker exists — job creation will just queue up unprocessed until the worker is built).

## Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account, returns JWT |
| POST | `/api/auth/login` | — | Returns JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| POST | `/api/workspaces` | ✅ | Create a workspace |
| GET | `/api/workspaces` | ✅ | List workspaces you own or belong to |
| GET | `/api/workspaces/:id` | ✅ | Get one workspace |
| POST | `/api/workspaces/:id/members` | ✅ | Owner adds a member by email |
| POST | `/api/bookmarks` | ✅ | Create skeleton bookmark (`status: pending`), enqueue scrape job |
| GET | `/api/bookmarks?workspaceId=&status=&tag=&page=&limit=` | ✅ | Paginated list, filterable |
| GET | `/api/bookmarks/:id` | ✅ | Get one bookmark |
| PATCH | `/api/bookmarks/:id` | ✅ | Edit title/description/tags |
| DELETE | `/api/bookmarks/:id` | ✅ | Delete |

Auth: send `Authorization: Bearer <token>` on protected routes.

## Design notes

- **`POST /api/bookmarks` responds before the queue push resolves** — this matches the doc's "optimistic UI" requirement: the client gets its 201 + skeleton doc immediately, scraping happens async. The worker service (not part of this module) listens on the `bookmark-scrape` queue and writes `title`/`description`/`imageUrl`/`faviconUrl`/`status` straight to Mongo — no callback into this API is needed.
- **Access control** is workspace-scoped: every bookmark/workspace route checks `isAccessibleBy` (owner or member) unless the workspace is public.
- **`workspaceId` is a single field**, not an array — per our earlier discussion, this assumes one workspace per bookmark. If you want bookmarks shareable across multiple workspaces later, that's a schema migration (`workspaceId` → `workspaceIds: [ObjectId]`) plus an index/query change, not a rewrite.
- Passwords are hashed with bcrypt; `passwordHash` is `select: false` and stripped from `toJSON` so it never leaks in responses.

## Next module

This produces jobs on the `bookmark-scrape` Redis queue but doesn't consume them — that's the **Scraping Worker** (Cheerio/Puppeteer + BullMQ worker) module.
