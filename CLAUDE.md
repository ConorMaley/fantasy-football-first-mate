# Fantasy Football First Mate

Monorepo (npm workspaces) with an Expo (React Native + web) client and a Node.js/TypeScript/Express/Prisma server. See `README.md` for the product description.

- `client/` — Expo app, targets iOS, Android, and web from one codebase.
- `server/` — Express REST API, PostgreSQL via Prisma (`server/prisma/schema.prisma`).

## Database schema changes

Whenever `server/prisma/schema.prisma` changes (new model, field, relation, or enum), update `server/prisma/ERD.md` in the same change so its Mermaid `erDiagram` reflects the schema exactly. Do this before considering the schema change done - don't defer it to a follow-up.
