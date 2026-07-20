# Audio Worker (BullMQ) — Local development

This project uses BullMQ + Redis to process audio generation jobs created by the Teacher Composer.

Quick steps to run locally:

1. Start Redis using Docker Compose:

```bash
cd backend
docker compose up -d
```

2. Install dependencies (from repo root):

```bash
# from repo root
cd backend
npm install
```

3. Ensure env contains `REDIS_URL` when not using default `redis://localhost:6379`.

4. Start the API server (in one terminal):

```bash
cd backend
npm run dev
```

5. Start the worker (in another terminal):

```bash
cd backend
npm run dev:worker
```

6. From the app or the teacher composer routes, create an audio generation job. The worker will pick it up and process it.

Troubleshooting:
- Check Redis logs: `docker compose logs -f redis`
- Worker logs output to stdout; watch for errors about ElevenLabs credentials or storage provider.

Environment variables used by the worker:
- `REDIS_URL` (optional) — Redis connection string; defaults to `redis://localhost:6379`.
- `ELEVENLABS_API_KEY`, `ELEVENLABS_BASE_URL`, `ELEVENLABS_MODEL_ID`, `ELEVENLABS_OUTPUT_FORMAT` — TTS provider settings.

Monitor UI:
- The Bull Board dashboard is exposed at `/api/admin/monitor/bull` and is protected by `requireAuth` + `ADMIN` role.
- For non-interactive access (CI, ops), you can set `MONITOR_SECRET` env and supply header `x-monitor-token` with that value.

Production notes:
- Run Redis as a managed service or cluster.
- Use TLS and authentication for Redis in production.
- Monitor queue length and errors with BullBoard or a similar dashboard.

Tracing (Jaeger / OTLP):
- A Jaeger all-in-one collector is provided in `docker-compose.yml` and listens on `http://localhost:4318` for OTLP/HTTP traces and `http://localhost:16686` for the Jaeger UI.
- To enable tracing, set `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces` and optionally `SERVICE_NAME=yakine-backend` in your `.env`.
- Start docker compose: `docker compose up -d` and visit `http://localhost:16686` to view traces.

Database migration:
- After changing the Prisma schema, run migrations to update the database schema.
- For local development run:

```bash
cd backend
npx prisma migrate dev --name add-traceid
```

Or apply migrations in CI with `npx prisma migrate deploy` for non-interactive environments.
