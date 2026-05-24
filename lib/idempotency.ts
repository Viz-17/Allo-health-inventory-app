import { prisma } from "./prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withIdempotency<T = any>(
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
  } catch {
    // race condition — another request saved it first
  }

  return result;
}