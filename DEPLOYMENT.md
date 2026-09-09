# Production Deployment Guide

Complete operational guide detailing deployment options, database migration workflows, and live production procedures for the Finance Tracker Monorepo.

- Repository: https://github.com/MrAkshay143/finance-app.git
- Live Production URL: https://finance.imakshay.in
- Monorepo Topology: pnpm workspaces (apps/backend, apps/web, packages/*)
- Runtime Targets: Node.js >= 20 LTS, PostgreSQL 16+ or MySQL 8.0+

---

## Architecture Overview

```
Client (Web Browser / PWA)
           |
           v
  HTTPS Reverse Proxy (Nginx / Cloudflare)
           |
           +-----------------------------+
           |                             |
           v                             v
  Static Assets (apps/web/dist)   Express API (/api/v1)
                                         |
                         +---------------+---------------+
                         |                               |
                         v                               v
            Database (Postgres / MySQL)           Redis Cache & Queue
```

---

## Deployment Option 1: Live Cloud Production (Hostinger)

The live production application at https://finance.imakshay.in runs on Hostinger Cloud Application hosting using Node.js 20 and a managed MySQL database.

### Packaging & Deployment Steps

1. Build packages and frontend:
```bash
pnpm -r --filter="./packages/*" run build
pnpm --filter @finance/web build
```

2. Bundle backend and package distribution:
Run the deployment packaging script:
```powershell
powershell -ExecutionPolicy Bypass -File C:/Users/aksha/.gemini/antigravity/brain/5f877727-2365-479e-8623-fa9afa7d6e93/scratch/package_deploy.ps1
```
This compiles server.ts into finance_deploy/server.js via esbuild, copies schema.mysql.prisma, includes public web assets, and creates finance_deploy.zip.

3. Upload and Deploy Archive:
- Upload finance_deploy.zip via upload_archive.mjs.
- Trigger deployment through Hostinger MCP tool hosting_deployJsApplication.
- Restart the application process via hosting_restartNode_jsApplicationV1.

4. Production Environment Variables:
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=mysql://u581617111_financeapp:DB_PASS@127.0.0.1:3306/u581617111_financeapp
JWT_ACCESS_SECRET=production-jwt-access-secret-hostinger-secure-2026-min-32
JWT_REFRESH_SECRET=production-jwt-refresh-secret-hostinger-secure-2026-min-32
JWT_RESET_SECRET=production-jwt-reset-secret-hostinger-secure-2026-min-32
CORS_ALLOWED_ORIGINS=https://finance.imakshay.in,http://finance.imakshay.in
PUBLIC_DIR=./public
LOG_LEVEL=info
```

---

## Deployment Option 2: Docker Compose Stack (VPS / Local Server)

For deployment on any Linux VPS, Docker Compose orchestrates the full stack:

```bash
# Start all containers in the background
docker compose -f infra/compose/docker-compose.prod.yml up -d

# Check running status
docker compose -f infra/compose/docker-compose.prod.yml ps

# View container logs
docker compose -f infra/compose/docker-compose.prod.yml logs -f
```

---

## Deployment Option 3: PaaS (Render / Railway / Fly.io)

For cloud container platforms:
1. Connect the GitHub repository: https://github.com/MrAkshay143/finance-app.git
2. Configure Web Service build command:
```bash
pnpm install && pnpm build
```
3. Start command:
```bash
pnpm start
```
4. Inject production environment variables from .env.example.

---

## Database Migrations & Seeding

```bash
# Run Prisma migrations
pnpm db:migrate

# Seed initial system categories and test data
pnpm db:seed
```

Default accounts provisioned:
- Admin: contact@imakshay.in (Pass@12345)
- User: akshay@gmail.com (Akshay@12345)
