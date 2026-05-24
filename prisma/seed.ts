import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  await prisma.idempotencyRecord.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const [wh1, wh2, wh3] = await Promise.all([
    prisma.warehouse.create({ data: { name: "Mumbai Central", location: "Mumbai, MH" } }),
    prisma.warehouse.create({ data: { name: "Delhi North", location: "Delhi, DL" } }),
    prisma.warehouse.create({ data: { name: "Bengaluru Hub", location: "Bengaluru, KA" } }),
  ]);

  const products = await Promise.all([
    prisma.product.create({ data: { name: "Wireless Headphones", description: "Studio-grade audio with 30hr battery and ANC.", price: 8999 } }),
    prisma.product.create({ data: { name: "Mechanical Keyboard TKL", description: "Compact layout with hot-swappable switches.", price: 5499 } }),
    prisma.product.create({ data: { name: "USB-C Docking Station", description: "12-in-1 hub with dual 4K display and 100W PD.", price: 4299 } }),
    prisma.product.create({ data: { name: "Ergonomic Office Chair", description: "Lumbar support and breathable mesh back.", price: 18999 } }),
    prisma.product.create({ data: { name: "27-inch 4K Monitor", description: "IPS panel, 144Hz, HDR400, USB-C.", price: 32999 } }),
    prisma.product.create({ data: { name: "Portable SSD 2TB", description: "NVMe speeds up to 2000MB/s, rugged IP55.", price: 7999 } }),
  ]);

  await prisma.stock.createMany({
    data: [
      { productId: products[0].id, warehouseId: wh1.id, totalUnits: 50, reservedUnits: 0 },
      { productId: products[0].id, warehouseId: wh2.id, totalUnits: 3,  reservedUnits: 0 },
      { productId: products[0].id, warehouseId: wh3.id, totalUnits: 0,  reservedUnits: 0 },
      { productId: products[1].id, warehouseId: wh1.id, totalUnits: 20, reservedUnits: 0 },
      { productId: products[1].id, warehouseId: wh2.id, totalUnits: 15, reservedUnits: 0 },
      { productId: products[1].id, warehouseId: wh3.id, totalUnits: 8,  reservedUnits: 0 },
      { productId: products[2].id, warehouseId: wh1.id, totalUnits: 1,  reservedUnits: 0 },
      { productId: products[2].id, warehouseId: wh2.id, totalUnits: 0,  reservedUnits: 0 },
      { productId: products[2].id, warehouseId: wh3.id, totalUnits: 5,  reservedUnits: 0 },
      { productId: products[3].id, warehouseId: wh1.id, totalUnits: 10, reservedUnits: 0 },
      { productId: products[3].id, warehouseId: wh2.id, totalUnits: 4,  reservedUnits: 0 },
      { productId: products[3].id, warehouseId: wh3.id, totalUnits: 0,  reservedUnits: 0 },
      { productId: products[4].id, warehouseId: wh1.id, totalUnits: 7,  reservedUnits: 0 },
      { productId: products[4].id, warehouseId: wh2.id, totalUnits: 2,  reservedUnits: 0 },
      { productId: products[4].id, warehouseId: wh3.id, totalUnits: 3,  reservedUnits: 0 },
      { productId: products[5].id, warehouseId: wh1.id, totalUnits: 30, reservedUnits: 0 },
      { productId: products[5].id, warehouseId: wh2.id, totalUnits: 25, reservedUnits: 0 },
      { productId: products[5].id, warehouseId: wh3.id, totalUnits: 12, reservedUnits: 0 },
    ],
  });
  console.log("Done! 6 products, 3 warehouses seeded.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
