# Finance App — Production Deployment Guide

This guide details the complete production architecture, deployment strategies, database migration workflows, and operational procedures for the **Finance Tracker Monorepo**.

- **Repository**: [https://github.com/MrAkshay143/finance-app.git](https://github.com/MrAkshay143/finance-app.git)
- **Monorepo Structure**: PNPM Workspaces (`apps/backend`, `apps/web`, `apps/mobile`, `packages/*`)
- **Runtime Targets**: Node.js >= 20 LTS, PostgreSQL 16+, Redis 7+

---

## Architecture Overview

```mermaid
graph TD
    Client[Web Browser / Mobile App] -->|HTTPS :443| Nginx[Nginx Reverse Proxy & Static Host]
    Nginx -->|Static Assets| WebDist[Built SPA: apps/web/dist]
    Nginx -->|Proxy /api/v1 & /socket.io| Backend[Express Backend: apps/backend]
    Backend -->|Prisma ORM| Postgres[(PostgreSQL 16+)]
    Backend -->|Queues & Rate Limiting| Redis[(Redis 7+)]
    Worker[BullMQ Worker Service] --> Postgres
    Worker --> Redis
```

---

## Deployment Option 1: Docker Compose Production Stack (Recommended for VPS / Hostinger VPS / Cloud VM)

The complete application stack (PostgreSQL, Redis, Backend, BullMQ Worker, and Nginx) can be run using the pre-configured production Docker Compose configuration.

### Prerequisites
- Docker Engine 24+ and Docker Compose v2 installed on the host.
- A registered domain (e.g. `app.yourdomain.com`) pointing to the server's public IP address.

### Step 1: Clone Repository
```bash
git clone https://github.com/MrAkshay143/finance-app.git
cd finance-app
```

### Step 2: Configure Production Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Generate secure 32+ character secrets for JWT:
```bash
openssl rand -base64 32
openssl rand -base64 32
```

Edit `.env`:
```ini
NODE_ENV=production
PORT=4000
LOG_LEVEL=info

# Database
POSTGRES_USER=finance_admin
POSTGRES_PASSWORD=generate_a_strong_password_here
POSTGRES_DB=finance_tracker
DATABASE_URL=postgresql://finance_admin:generate_a_strong_password_here@postgres:5432/finance_tracker?schema=public

# Redis
REDIS_URL=redis://redis:6379

# Auth Secrets
JWT_ACCESS_SECRET=paste_first_generated_32_char_secret_here
JWT_REFRESH_SECRET=paste_second_generated_32_char_secret_here

# Domains & CORS
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
VITE_API_URL=https://app.yourdomain.com
```

### Step 3: Launch the Production Stack
```bash
docker compose -f infra/compose/docker-compose.prod.yml up -d --build
```

### Step 4: Run Database Migrations
```bash
docker compose -f infra/compose/docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Step 5: (Optional) Seed Real-World Baseline Data
```bash
docker compose -f infra/compose/docker-compose.prod.yml exec backend npm run seed:realworld
```

### Step 6: Verify Service Health
```bash
# Check container status
docker compose -f infra/compose/docker-compose.prod.yml ps

# Verify backend health probe
curl -I http://localhost:4000/healthz

# Verify database connectivity readiness probe
curl -I http://localhost:4000/readyz
```

---

## Deployment Option 2: Decoupled Cloud Services (Render / Railway / Supabase / Vercel)

For fully managed serverless or platform-as-a-service infrastructure:

### 1. Database (PostgreSQL)
- **Providers**: Supabase, Neon, AWS RDS, Railway, Render.
- Create a PostgreSQL 16 database.
- Obtain the connection string (with SSL mode enabled):
  `postgresql://user:password@host:port/database?sslmode=require`

### 2. Cache & Message Queue (Redis)
- **Providers**: Upstash Redis, Redis Cloud, Railway, Render.
- Obtain connection string: `rediss://default:password@host:port`

### 3. Backend API Service
- **Providers**: Render, Railway, Fly.io, Hostinger VPS.
- **Root Directory**: Repository root (`.`)
- **Build Command**:
  ```bash
  pnpm install --frozen-lockfile && pnpm -r --filter="./packages/*" run build && pnpm --filter @finance/backend build
  ```
- **Start Command**:
  ```bash
  pnpm --filter @finance/backend db:migrate && pnpm --filter @finance/backend start
  ```
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `4000` (or provided dynamically by host)
  - `DATABASE_URL`: Your managed PostgreSQL connection string
  - `REDIS_URL`: Your managed Redis connection string
  - `JWT_ACCESS_SECRET`: Cryptographically random 32+ character key
  - `JWT_REFRESH_SECRET`: Cryptographically random 32+ character key
  - `CORS_ALLOWED_ORIGINS`: Frontend URL (e.g. `https://app.yourdomain.com`)

### 4. Frontend Web SPA
- **Providers**: Vercel, Netlify, Cloudflare Pages, Hostinger Web Hosting.
- **Root Directory**: Repository root (`.`) or `apps/web`
- **Build Command**:
  ```bash
  pnpm install --frozen-lockfile && pnpm -r --filter="./packages/*" run build && pnpm --filter @finance/web build
  ```
- **Output Directory**: `apps/web/dist`
- **Environment Variables**:
  - `VITE_API_URL`: Backend URL (e.g. `https://api.yourdomain.com`)
  - `VITE_SOCKET_URL`: (Optional) WebSocket URL (e.g. `https://api.yourdomain.com`)

---

## Deployment Option 3: Hostinger Shared / Cloud Hosting + VPS

### Frontend on Hostinger Web Hosting (Static SPA)
1. Build the frontend locally or via CI:
   ```bash
   pnpm run build
   ```
2. Upload the entire contents of `apps/web/dist/` to the `public_html/` directory on Hostinger.
3. The `.htaccess` file included in `apps/web/public/` is copied directly into `apps/web/dist/` and automatically handles client-side routing on page refresh.
4. Create an `apps/web/.env.production` before building:
   ```ini
   VITE_API_URL=https://api.yourdomain.com
   ```

### Backend on Hostinger VPS (Docker or Node.js)
1. Provision an Ubuntu 22.04 / 24.04 LTS VPS on Hostinger.
2. Install Docker or Node.js 20 LTS.
3. Follow **Deployment Option 1** above to deploy the backend and database containers.

---

## Production Verification Checklist

| Check | Command / URL | Expected Result |
| :--- | :--- | :--- |
| **API Liveness Probe** | `GET /healthz` | HTTP 200 `{"status":"ok"}` |
| **API Readiness Probe** | `GET /readyz` | HTTP 200 `{"status":"ready","db":"ok"}` |
| **Prometheus Metrics** | `GET /metrics` | HTTP 200 formatted Prometheus exposition |
| **Frontend Static Bundle** | `GET /` | HTTP 200 HTML with Vite assets |
| **SPA PushState Refresh** | `GET /transactions` | HTTP 200 serves `index.html` (no 404) |
| **Rate Limiter** | Rapid requests to `/api/v1/auth/login` | HTTP 429 Too Many Requests |
| **CORS Validation** | Request with disallowed `Origin` | Clean rejection (no 500 status) |
| **Database Migrations** | `pnpm --filter @finance/backend db:migrate` | `No pending migrations to apply.` |
