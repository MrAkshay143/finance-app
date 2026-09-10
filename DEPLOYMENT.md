# Deployment Guide

Production deployment guide for the Finance Tracker application, covering Hostinger Cloud Application hosting (active production), Docker Compose orchestration, and cloud PaaS options.

## 1. Production Architecture Overview

The production system is deployed live at https://finance.imakshay.in on Hostinger Cloud Application hosting:
- Frontend: Single Page Application (SPA) built via Vite and served as static assets with client-side routing.
- Backend: Node.js (v20+) Express server mounted at /api/v1.
- Database: MySQL 8.0+ cloud database managed via Prisma ORM (apps/backend/prisma/schema.mysql.prisma).
- Process Management: Hostinger Node.js Application manager running dist/server.js.

## 2. Option 1: Hostinger Cloud Application (Active Production)

### Step 1: Prepare Database on Hostinger
1. In Hostinger hPanel, create a MySQL Database and user.
2. Note the database credentials:
   - Host: localhost (or Hostinger DB IP)
   - Port: 3306
   - User: your_db_user
   - Password: your_db_password
   - Database: your_db_name

### Step 2: Build and Package Deployment Archive
Run the automated packaging script in PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scratch/package_deploy.ps1
```
This compiles all packages, runs prisma generate with schema.mysql.prisma, builds the web SPA, copies static assets to apps/backend/public, and produces finance_deploy.zip.

### Step 3: Deploy to Hostinger
Upload finance_deploy.zip to the public_html or application root directory via Hostinger File Manager or automated script:
```powershell
node scratch/upload_archive.mjs
```

### Step 4: Configure Environment Variables in Hostinger
Configure the following in Hostinger Application Settings:
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=mysql://your_db_user:your_db_password@localhost:3306/your_db_name
JWT_ACCESS_SECRET=your_32_character_access_secret_key_here
JWT_REFRESH_SECRET=your_32_character_refresh_secret_key
JWT_RESET_SECRET=your_32_character_reset_secret_key_here
JWT_ACCESS_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
CORS_ALLOWED_ORIGINS=https://finance.imakshay.in
PUBLIC_DIR=public
```

### Step 5: Run Database Migrations
On the Hostinger console or terminal:
```bash
npx prisma db push --schema=prisma/schema.mysql.prisma
node dist/seedData.js
```

### Step 6: Restart and Verify
Restart the Node.js application in Hostinger hPanel. Verify health at https://finance.imakshay.in/healthz.

## 3. Option 2: Docker Compose Stack

For containerized deployment on a VPS (Ubuntu, Debian, etc.):

### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/MrAkshay143/finance-app.git
cd finance-app
cp .env.example .env
```
Edit .env with production passwords and secrets.

### Step 2: Build and Launch Containers
```bash
docker compose -f infra/compose/docker-compose.prod.yml up -d --build
```

### Step 3: Run Database Migrations & Seeds
```bash
docker compose -f infra/compose/docker-compose.prod.yml exec backend pnpm db:migrate
docker compose -f infra/compose/docker-compose.prod.yml exec backend pnpm db:seed
```

## 4. Option 3: PaaS Deployment (Render / Railway / Fly.io)

### Render (render.yaml included):
1. Connect GitHub repository to Render.
2. Render detects render.yaml and provisions:
   - PostgreSQL Managed Database
   - Redis Managed Instance
   - Web Service (Node.js backend)
   - Static Site (React frontend)

## 5. Production Health Verification

After deployment, verify the following endpoints:
- GET /healthz: returns 200 {"status":"ok"}
- GET /readyz: returns 200 {"status":"ready"}
- GET /metrics: returns Prometheus metrics
- GET /api/v1/: returns API status and endpoint discovery
