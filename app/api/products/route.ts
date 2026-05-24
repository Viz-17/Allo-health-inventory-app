import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const products = await prisma.product.findMany({
    include: { stocks: { include: { warehouse: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products.map((p) => ({
    id: p.id, name: p.name, description: p.description,
    imageUrl: p.imageUrl, price: p.price,
    warehouses: p.stocks.map((s) => ({
      warehouseId: s.warehouseId, warehouseName: s.warehouse.name,
      warehouseLocation: s.warehouse.location, totalUnits: s.totalUnits,
      reservedUnits: s.reservedUnits, availableUnits: s.totalUnits - s.reservedUnits,
    })),
  })));
}
