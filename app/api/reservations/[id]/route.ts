import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, price: true } },
      warehouse: { select: { id: true, name: true, location: true } },
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (reservation.status === "PENDING" && reservation.expiresAt <= new Date()) {
    const expired = await prisma.$transaction(async (tx) => {
      const u = await tx.reservation.update({
        where: { id },
        data: { status: "EXPIRED" },
        include: {
          product: { select: { id: true, name: true, price: true } },
          warehouse: { select: { id: true, name: true, location: true } },
        },
      });
      await tx.$executeRaw`
        UPDATE "Stock"
        SET "reservedUnits" = GREATEST(0, "reservedUnits" - ${reservation.quantity})
        WHERE "productId" = ${reservation.productId}
          AND "warehouseId" = ${reservation.warehouseId}
      `;
      return u;
    });
    return NextResponse.json(expired);
  }

  return NextResponse.json(reservation);
}