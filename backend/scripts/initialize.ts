import 'dotenv/config';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { mockUsers, mockFacilities, mockEquipment } from '../../frontend/src/data/mockData';

const DEMO_PASSWORD = '123456';

const schemaDir = path.resolve(process.cwd(), 'prisma');
const localDbPath = path.resolve(schemaDir, 'dev.db');
const relativeDbPath = path.relative(schemaDir, localDbPath).replace(/\\/g, '/');
const sqliteDatabaseUrl = `file:${relativeDbPath.startsWith('.') ? relativeDbPath : `./${relativeDbPath}`}`;

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('prisma/dev.db') || process.env.DATABASE_URL.includes('prisma/prisma/dev.db')) {
  process.env.DATABASE_URL = sqliteDatabaseUrl;
}

const prisma = new PrismaClient();

async function ensureDemoPassword(userEmail: string) {
  const currentUser = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!currentUser) return;

  const shouldReset =
    !currentUser.passwordHash ||
    !currentUser.passwordHash.startsWith('$2') ||
    !(await bcrypt.compare(DEMO_PASSWORD, currentUser.passwordHash));

  if (shouldReset) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        isActive: true,
      },
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const user of mockUsers) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ id: user.id }, { email: user.email }] },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          phone: user.phone,
          passwordHash,
          isActive: true,
        },
      });
    } else {
      await ensureDemoPassword(user.email);
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          phone: user.phone,
          isActive: true,
        },
      });
    }
  }

  for (const f of mockFacilities) {
    const existing = await prisma.facility.findFirst({
      where: { OR: [{ id: f.id }, { code: f.code }] },
    });
    if (!existing) {
      await prisma.facility.create({
        data: {
          id: f.id,
          code: f.code,
          name: f.name,
          location: f.location,
          capacity: f.capacity,
          type: f.type,
          description: f.description,
          amenities: JSON.stringify(f.amenities),
        },
      });
    }
  }

  for (const e of mockEquipment) {
    const existing = await prisma.equipment.findFirst({
      where: { OR: [{ id: e.id }, { code: e.code }] },
    });
    if (!existing) {
      await prisma.equipment.create({
        data: {
          id: e.id,
          code: e.code,
          name: e.name,
          type: e.type,
          totalQuantity: e.totalQuantity,
          condition: e.condition,
        },
      });
    }
  }

  console.log('Reference data ready. Existing events and accounts were preserved and demo passwords were repaired.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
