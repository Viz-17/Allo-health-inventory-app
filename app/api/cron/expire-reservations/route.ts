import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const expired = await prisma.reservation.findMany({
    where: { status: "PENDING", expiresAt: { lte: new Date() } },
    select: { id: true, productId: true, warehouseId: true, quantity: true },
  });
  let released = 0;
  for (const r of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({ where: { id: r.id, status: "PENDING" }, data: { status: "EXPIRED" } });
        await tx.$executeRaw`UPDATE "Stock" SET "reservedUnits"=GREATEST(0,"reservedUnits"-${r.quantity})
          WHERE "productId"=${r.productId} AND "warehouseId"=${r.warehouseId}`;
      });
      released++;
    } catch {}
  }
  return NextResponse.json({ released });
}
