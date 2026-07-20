Media worker image

This image runs the `media-worker` which performs audio transcoding and HLS generation.

Build locally:

```bash
# from backend/
docker build -f Dockerfile.media -t yakine/media-worker:latest .
```

Run (requires Redis + Postgres + Supabase credentials in env):

```bash
docker run --rm \
  -e REDIS_URL=redis://host:6379 \
  -e DATABASE_URL=postgres://... \
  -e SUPABASE_URL=... \
  -e SUPABASE_SERVICE_KEY=... \
  yakine/media-worker:latest
```

Notes:
- The image installs the system `ffmpeg` package for reliability across platforms.
- For production, prefer multi-stage builds or a dist-based approach to reduce image size.
