import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.reservation.findUnique({ where: { id } });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (r.status !== "PENDING") return NextResponse.json(r);
  const released = await prisma.$transaction(async (tx) => {
    const u = await tx.reservation.update({ where: { id, status: "PENDING" }, data: { status: "RELEASED" },
      include: { product: { select: { id: true, name: true, price: true } },
        warehouse: { select: { id: true, name: true, location: true } } } });
    await tx.$executeRaw`UPDATE "Stock" SET "reservedUnits"=GREATEST(0,"reservedUnits"-${r.quantity}) WHERE "productId"=${r.productId} AND "warehouseId"=${r.warehouseId}`;
    return u;
  });
  return NextResponse.json(released);
}