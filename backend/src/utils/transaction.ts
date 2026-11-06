import { Prisma } from '@prisma/client';
import prisma from '../config/database';

/** Retry only serialization conflicts; callbacks must contain database operations only. */
export async function serializableTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2034' || attempt >= 2) throw error;
    }
  }
}
