# Fantasy Football First Mate

Monorepo (npm workspaces) with an Expo (React Native + web) client and a Node.js/TypeScript/Express/Prisma server. See `README.md` for the product description.

- `client/` — Expo app, targets iOS, Android, and web from one codebase.
- `server/` — Express REST API, PostgreSQL via Prisma (`server/prisma/schema.prisma`).

## Database schema changes

Whenever `server/prisma/schema.prisma` changes (new model, field, relation, or enum), update `server/prisma/ERD.md` in the same change so its Mermaid `erDiagram` reflects the schema exactly. Do this before considering the schema change done - don't defer it to a follow-up.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (`ConorMaley/fantasy-football-first-mate`), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
