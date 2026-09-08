# Finance Tracker — Production Monorepo

Enterprise-grade personal finance application engineered across Web (React 18 + Vite + Tailwind CSS), Mobile (React Native Expo SDK 52 + NativeWind), and a unified backend API (Node.js/Express + TypeScript + PostgreSQL 18 + Prisma + Redis 7 fallback + BullMQ + Socket.IO).

---

## Live Services & Architecture

| Service | Port / URL | Details |
| :--- | :--- | :--- |
| **Web Application** | `http://localhost:3000` | Vite React 18 SPA (centered mobile frame ~390–430px) |
| **Backend API** | `http://localhost:4000` | Express REST API + Socket.IO gateway |
| **PostgreSQL Database** | `127.0.0.1:5433` | PostgreSQL 18 cluster with `finance_tracker` database |
| **Metrics** | `http://localhost:4000/metrics` | Prometheus metrics endpoint (`prom-client`) |
| **Health Check** | `http://localhost:4000/healthz` | Express healthcheck endpoint |

---

## Quick Start

### 1. Database (Port 5433)
```powershell
& "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "C:\Users\aksha\Downloads\finenace\.pgdata" -p 5433
```

### 2. Backend API Server (Port 4000)
```powershell
pnpm --filter @finance/backend dev
```

### 3. Web Frontend (Port 3000)
```powershell
pnpm --filter @finance/web dev
```

---

## Testing & Quality Gates
```powershell
# Run full test suite (525 tests passing across 35 test files)
pnpm test

# Run placeholder & emoji gate (0 violations)
pnpm check:placeholders

# Typecheck all packages
pnpm typecheck

# Full production build
pnpm build
```
