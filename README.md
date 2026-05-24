# Allo Inventory

An inventory reservation platform for multi-warehouse retail.

When a customer proceeds to checkout, the system temporarily reserves the required units for 10 minutes. This prevents overselling during concurrent checkouts, while ensuring that unused reservations don’t block other buyers.

## Live Demo

> [Vercel URL](https://allo-health-inventory-app.vercel.app/) 

---

## Local Development

### Prerequisites
- Node.js (v18 or above)
- A Postgres database (Supabase / Neon / Railway)
- Redis instance (Upstash recommended)

### Steps

```bash
git clone https://github.com/Viz-17/Allo-health-inventory-app.git
cd Allo-health-inventory-app
npm install
```

Create a `.env` file in the root with your credentials:

```
DATABASE_URL="your-neon-postgres-url"
REDIS_URL="your-upstash-redis-url"
CRON_SECRET="any-secret-string"
```

Then set up the database and start the app:

```bash
npx prisma db push      # creates the tables
npx prisma db seed      # loads sample products and warehouses
npm run dev             # starts at http://localhost:3000
```

---

## How the reservation system works

### Concurrency handling

The main challenge is preventing two users from reserving the last unit at the same time.

I handled this using two layers:

1. **Redis lock (`SET NX`)**
   - A lock is acquired per (productId, warehouseId)
   - If the lock is already held, the request fails with 409

2. **Database transaction (`SELECT FOR UPDATE`)**
   - The row is locked inside a transaction
   - Ensures only one request updates stock at a time

Even if Redis is unavailable, the database layer ensures correctness.

### Reservation expiry

Reservations expire after 10 minutes if not confirmed.

This is handled using:

- **Cron job (primary)**  
  Runs every minute and releases expired reservations

- **Lazy cleanup (fallback)**  
  Expiry is also checked during API calls

- **Frontend timer**  
  Displays countdown and refreshes state when expired

### Idempotency (bonus)

`POST /api/reservations` and `POST /api/reservations/:id/confirm` support an `Idempotency-Key` header. On first request, the key+response are stored in the `IdempotencyRecord` table. On retry with the same key, the stored response is returned without re-executing the side effect. This prevents double-charges and double-reservations from network retries.

## Stack

- Next.js (App Router)
- TypeScript
- Prisma + Postgres (Supabase/Neon)
- Redis (Upstash)
- Zod

---

## Trade-offs

- No authentication (kept simple for this exercise)
- Redis lock TTL is fixed and may expire early in edge cases
- Idempotency records are not cleaned up
- No retry logic on the frontend
- Inline styles used instead of a UI library
