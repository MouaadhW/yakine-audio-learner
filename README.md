# Yakine Audio Learner

BAC audio learning mobile app built with [**React Native**](https://reactnative.dev) + [**Expo**](https://expo.dev) and an [**Express**](https://expressjs.com) backend powered by **Prisma** + **Supabase** (PostgreSQL & Storage).

## Features

- [x] BAC audio lessons with playback & speed control
- [x] Subjects, chapters & lessons organised by BAC stream
- [x] Script view with search highlighting
- [x] Blog / posts management
- [x] User authentication (JWT)
- [x] Profile editing
- [x] Dark mode support
- [x] Multi-language (English / French)
- [x] Offline lesson downloads with local playback
- [ ] Quiz management
- [ ] Subscription

---

## Prerequisites

| Tool | Version |
|------|---------|
| **Node.js** | ≥ 18 |
| **npm** | ≥ 9 |
| **Expo Go** app | Install on your phone from App Store / Google Play |

> You do **not** need Android Studio or Xcode to run the app — Expo Go is enough.

---

## Project Structure

```
yakine-audio-learner/
├── src/              # React Native app source
├── backend/          # Express API server
│   ├── prisma/       # Prisma schema & seed
│   └── src/          # Routes, config, middleware
├── .env              # App environment variables
└── backend/.env      # Backend environment variables
```

---

## 1 — Environment Variables

### App `.env` (project root)

Create a `.env` file in the project root:

```ini
# Replace with your computer's LAN IP (run `ipconfig` to find it)
API_URL=http://<YOUR_LAN_IP>:8000
```

### Backend `backend/.env`

Create a `backend/.env` file:

```ini
DATABASE_URL="postgresql://user:password@host:5432/dbname"
PORT=8000
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your_refresh_secret"
REFRESH_TOKEN_EXPIRES_IN="7d"
CORS_ORIGIN="*"
STORAGE_PROVIDER="supabase"
STORAGE_BUCKET="audio-files"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your_supabase_service_role_key"
```

---

## 2 — Install Dependencies

Open **two** terminals at the project root.

### Terminal 1 — App dependencies

```bash
npm install --legacy-peer-deps
```

### Terminal 2 — Backend dependencies

```bash
cd backend
npm install
```

---

## 3 — Database Setup (first time only)

From the `backend/` folder:

```bash
# Push the Prisma schema to your database
npx prisma db push

# Generate the Prisma client
npx prisma generate

# Seed sample data (subjects, chapters, lessons)
npx tsx prisma/seed.ts
```

---

## 4 — Start the Backend

From the `backend/` folder:

```bash
npx tsx src/server.ts
```

You should see:

```
Backend API running at http://localhost:8000
```

> **Tip:** For auto-reload during development, use `npm run dev` instead.

---

## 5 — Start the App (Expo Go)

From the **project root** (not `backend/`), in a separate terminal:

```bash
npx expo start --go --tunnel -c
```

This will:
1. Clear the Metro cache (`-c`)
2. Start Metro bundler in Expo Go mode (`--go`)
3. Create a tunnel so your phone can connect from any network (`--tunnel`)

A QR code will appear in the terminal. **Scan it** with:
- **iOS** → Camera app
- **Android** → Expo Go app

> If `--tunnel` is slow, you can use `--lan` instead (phone must be on the same Wi-Fi):
> ```bash
> npx expo start --go --lan -c
> ```

---

## Quick Start (TL;DR)

```bash
# Terminal 1 — Backend
cd backend
npx tsx src/server.ts

# Terminal 2 — App
npx expo start --go --tunnel -c
```

Then scan the QR code with your phone.

---

## Available Scripts

### App (project root)

| Script | Command | Description |
|--------|---------|-------------|
| Start Expo Go | `npx expo start --go --tunnel -c` | Launch with tunnel for phone |
| Start Expo Go (LAN) | `npx expo start --go --lan -c` | Launch on local network |
| Start Metro | `npm start` | Raw Metro bundler |
| Lint | `npm run lint` | Run ESLint |
| Test | `npm test` | Run Jest tests |

### Backend (`backend/`)

| Script | Command | Description |
|--------|---------|-------------|
| Start (production) | `npm start` | Run compiled JS |
| Start (dev) | `npm run dev` | Auto-reload with tsx watch |
| Start (one-off) | `npx tsx src/server.ts` | Run TypeScript directly |
| Prisma Studio | `npm run prisma:studio` | Visual database browser |
| Migrate | `npm run prisma:migrate` | Run migrations |
| Generate client | `npm run prisma:generate` | Regenerate Prisma client |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Port 8000 already in use` | Kill the existing process or change `PORT` in `backend/.env` |
| Tunnel not working | Install ngrok: `npm install -D @expo/ngrok --legacy-peer-deps` |
| `--legacy-peer-deps` needed | React 19 peer dependency conflicts — always add this flag to `npm install` |
| App can't reach backend | Make sure `API_URL` in root `.env` matches your LAN IP (`ipconfig`) and port |
| Expo Go crash on audio | Expected in Expo Go — uses expo-av fallback instead of react-native-track-player |

