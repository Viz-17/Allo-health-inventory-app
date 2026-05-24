import { prisma } from "./prisma";

export async function withIdempotency<T>(
  key: string | null,
  fn: () => Promise<{ status: number; body: T }>
): Promise<{ status: number; body: T }> {
  if (!key) return fn();

  const existing = await prisma.idempotencyRecord.findUnique({
    where: { key },
  });

  if (existing) {
    return {
      status: existing.statusCode,
      body: JSON.parse(existing.responseBody) as T,
    };
  }

  const result = await fn();

  try {
    await prisma.idempotencyRecord.create({
      data: {
        key,
        statusCode: result.status,
        responseBody: JSON.stringify(result.body),
      },
    });
  } catch {}

  return result;
}