import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acquireLock, releaseLock } from "@/lib/redis";
import { withIdempotency } from "@/lib/idempotency";
import { CreateReservationSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateReservationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { productId, warehouseId, quantity } = parsed.data;
  const idempotencyKey = req.headers.get("Idempotency-Key");

  const { status, body: responseBody } = await withIdempotency(idempotencyKey, async () => {
    const lockKey = `reserve:${productId}:${warehouseId}`;
    const locked = await acquireLock(lockKey, 15);
    if (!locked) return { status: 409, body: { error: "Another reservation in progress. Retry." } };

    try {
      const reservation = await prisma.$transaction(async (tx) => {
        const stocks = await tx.$queryRaw<{ total_units: number; reserved_units: number }[]>`
          SELECT "totalUnits" as total_units, "reservedUnits" as reserved_units
          FROM "Stock"
          WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
          FOR UPDATE
        `;
        if (!stocks.length) throw new Error("STOCK_NOT_FOUND");
        const available = stocks[0].total_units - stocks[0].reserved_units;
        if (available < quantity) throw new Error("INSUFFICIENT_STOCK");

        await tx.$executeRaw`
          UPDATE "Stock" SET "reservedUnits" = "reservedUnits" + ${quantity}
          WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
        `;

        return tx.reservation.create({
          data: { productId, warehouseId, quantity, status: "PENDING",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
          include: {
            product: { select: { id: true, name: true, price: true } },
            warehouse: { select: { id: true, name: true, location: true } },
          },
        });
      });
      return { status: 201, body: reservation };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "INSUFFICIENT_STOCK") return { status: 409, body: { error: "Not enough stock available." } };
      if (msg === "STOCK_NOT_FOUND") return { status: 404, body: { error: "Product/warehouse not found." } };
      throw err;
    } finally {
      await releaseLock(lockKey);
    }
  });

  return NextResponse.json(responseBody, { status });
}
