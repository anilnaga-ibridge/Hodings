# Billboard Advertising Marketplace Platform (Billboardify)

An enterprise-grade Out-of-Home (OOH & DOOH) media buying platform.

## Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: Prisma ORM, PostgreSQL
- **State Management**: Redux Toolkit, Zustand
- **Styling**: Tailwind CSS, CSS Variables
- **Libraries**: Fabric.js (Canvas Editor), Axios, Lucide Icons, Socket.io-client

---

## Workspace Structure
- `/backend`: Unified Next.js project containing both the React Frontend (App Router client pages) and API routes (server logic).
- `/artifacts`: Software design, database schemas, and product requirement documents.

---

## Getting Started

### 1. Database Configuration
In the `backend/` directory, set your PostgreSQL connection string and secrets in the `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/billboard_db?schema=public"
JWT_ACCESS_SECRET="your-super-secret-access-key-goes-here-with-high-entropy"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-goes-here-with-high-entropy"
```

Then execute migrations to instantiate tables:
```bash
cd backend
npx prisma db push
```

### 2. Running the Unified Web App (Next.js)
```bash
cd backend
npm run dev
```
Starts the unified development server at `http://localhost:3000`.

---

## Migration and Architecture (Vite -> Next.js)
The frontend and backend have been consolidated into a single Next.js project to simplify deployments and routing:
1. **App Router Migration**: Replaced `react-router-dom` routing with Next.js page routes (`/`, `/auth`, `/dashboard`, `/design-studio`).
2. **Server-Side Safety**: Wrapped client-only canvas engines (Fabric.js) inside Dynamic Imports with `ssr: false` to avoid SSR compilation failures.
3. **Consolidated Store & API config**: Merged Redux providers, thunks, and Axios interceptors into the Next.js lifecycle.
# Hodings
