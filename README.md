# InsureReady MVP

Next.js + TypeScript + Tailwind MVP for year-round insurance readiness tracking.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- SQLite + Prisma

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Push schema to SQLite:
   ```bash
   npm run prisma:push
   ```
5. Seed demo businesses:
   ```bash
   npm run prisma:seed
   ```
6. Run app:
   ```bash
   npm run dev
   ```

## Key routes
- `/` landing
- `/onboarding` create a business profile
- `/dashboard?id=<businessId>` readiness dashboard
- `/underwriter-view?id=<businessId>` underwriter-facing summary

## API routes
- `GET /api/businesses`
- `POST /api/businesses`
- `GET /api/businesses/:id`
- `POST /api/businesses/:id/updates`
- `GET /api/businesses/active`
- `POST /api/demo` (`oakland` or `contractor`)
