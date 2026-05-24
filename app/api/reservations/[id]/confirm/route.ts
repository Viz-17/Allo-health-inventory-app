import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.reservation.findUnique({ where: { id } });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (r.status === "CONFIRMED") return NextResponse.json(r);
  if (r.status !== "PENDING") return NextResponse.json({ error: "Reservation expired or released." }, { status: 410 });
  if (r.expiresAt <= new Date()) {
    await prisma.$transaction([
      prisma.reservation.update({ where: { id }, data: { status: "EXPIRED" } }),
      prisma.$executeRaw`UPDATE "Stock" SET "reservedUnits"=GREATEST(0,"reservedUnits"-${r.quantity}) WHERE "productId"=${r.productId} AND "warehouseId"=${r.warehouseId}`,
    ]);
    return NextResponse.json({ error: "Reservation expired." }, { status: 410 });
  }
  const confirmed = await prisma.$transaction(async (tx) => {
    const u = await tx.reservation.update({ where: { id, status: "PENDING" }, data: { status: "CONFIRMED" },
      include: { product: { select: { id: true, name: true, price: true } },
        warehouse: { select: { id: true, name: true, location: true } } } });
    await tx.$executeRaw`UPDATE "Stock" SET "totalUnits"=GREATEST(0,"totalUnits"-${r.quantity}), "reservedUnits"=GREATEST(0,"reservedUnits"-${r.quantity}) WHERE "productId"=${r.productId} AND "warehouseId"=${r.warehouseId}`;
    return u;
  });
  return NextResponse.json(confirmed);
}