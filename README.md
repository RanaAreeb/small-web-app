# small-web

## Prerequisites

- Node.js 22+
- pnpm 9
- A MongoDB database (Atlas or local)

## Install

```bash
pnpm install
```

## Configure env

```bash
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```

Set `MONGODB_URI` in `.env` and `apps/api/.env`.

## Seed

```bash
pnpm seed
```

## Start both applications

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/health

## Test

```bash
pnpm test
pnpm test:e2e
```

## Production build

```bash
pnpm build
```
