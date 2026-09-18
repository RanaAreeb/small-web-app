# small-web

Web app assessment: a small web and the browser used to read it.

## Stack

- **Web**: Next.js (App Router), TypeScript, Tailwind — port `3000`
- **API**: NestJS, TypeScript, Mongoose — port `4000`
- **DB**: MongoDB (Atlas or any MongoDB URI)
- **Workspace**: pnpm
- **Node**: 22 (see `.nvmrc`)

## Setup

```bash
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```

Set `MONGODB_URI` in `.env` and `apps/api/.env`, then:

```bash
pnpm install
pnpm dev
```

- Web: http://localhost:3000
- API health: http://localhost:4000/api/health

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run web and API in parallel |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `pnpm test` | Test all apps |
| `pnpm seed` | Seed the database |
