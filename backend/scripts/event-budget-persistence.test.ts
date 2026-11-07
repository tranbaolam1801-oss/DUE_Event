import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { after, before, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createEventSchema } from '../src/schemas/event.schema';
import { validateBudgetItems, validateBudgetSubmission } from '../../frontend/src/pages/eventCreateValidation';

const backendDirectory = path.resolve(__dirname, '..');
const databaseFile = `.event-budget-test-${process.pid}-${randomUUID()}.db`;
const databaseUrl = `file:./${databaseFile}`;
let prisma: typeof import('../src/config/database').default;
let createEvent: typeof import('../src/services/event.service').createEvent;
let updateEvent: typeof import('../src/services/event.service').updateEvent;
let getEventById: typeof import('../src/services/event.service').getEventById;

describe('event budget persistence', () => {
  before(async () => {
    process.chdir(backendDirectory);
    process.env.NODE_ENV = 'test';
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    process.env.DATABASE_URL = databaseUrl;
    delete process.env.DIRECT_URL;

    const schemaPath = path.join(backendDirectory, 'prisma', 'schema.prisma');
    const prismaCliPath = path.join(backendDirectory, 'node_modules', 'prisma', 'build', 'index.js');
    const push = spawnSync(process.execPath, [
      prismaCliPath,
      'db',
      'push',
      '--schema',
      schemaPath,
      '--skip-generate',
    ], { cwd: backendDirectory, env: process.env, encoding: 'utf8' });
    assert.equal(push.status, 0, `Could not prepare isolated SQLite test database: ${push.stderr}`);

    ({ default: prisma } = await import('../src/config/database'));
    ({ createEvent, updateEvent, getEventById } = await import('../src/services/event.service'));
  });

  after(async () => {
    if (prisma) await prisma.$disconnect();
    for (const suffix of ['', '-journal', '-shm', '-wal']) {
      const file = path.join(backendDirectory, 'prisma', `${databaseFile}${suffix}`);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it('creates, replaces, preserves, and reloads budget rows without duplicates', async () => {
    const user = await prisma.user.create({
      data: {
        email: `budget-test-${process.pid}@example.test`,
        passwordHash: 'test-hash',
        fullName: 'Budget Test',
        role: 'ADMIN',
      },
    });
    const requestId = 'c0a80101-0000-4000-8000-000000000001';
    const originalBudget = [
      { category: 'Hội trường', itemName: 'Thuê địa điểm', quantity: 2, unitPrice: 1_500_000 },
      { category: 'Truyền thông', itemName: 'In tài liệu', quantity: 100, unitPrice: 12_000 },
    ];
    const input = {
      title: 'Kiểm thử lưu dự trù',
      organizingUnit: 'Đơn vị kiểm thử',
      budgetItems: originalBudget,
    };

    const created = await createEvent(input, user.id, undefined, requestId);
    assert.ok(created);
    assert.equal(created.budgetItems.length, 2);
    assert.equal(created.budgetItems.reduce((sum, item) => sum + item.totalPrice, 0), 4_200_000);
    assert.equal(await prisma.workflowHistory.count({ where: { eventId: created.id } }), 1);
    assert.equal(await prisma.eventVersion.count({ where: { eventId: created.id } }), 1);

    const retriedCreate = await createEvent(input, user.id, undefined, requestId);
    assert.equal(retriedCreate?.id, created.id);
    assert.equal(await prisma.budgetItem.count({ where: { eventId: created.id } }), 2);

    const updatedBudget = [
      { category: 'Hội trường', itemName: 'Thuê địa điểm', quantity: 1, unitPrice: 1_800_000 },
      { category: 'Ăn uống', itemName: 'Nước uống', quantity: 80, unitPrice: 8_000 },
    ];
    const updated = await updateEvent(created.id, {
      expectedVersion: created.currentVersion,
      changeNote: 'Cập nhật kiểm thử dự toán',
      budgetItems: updatedBudget,
    }, user.id, 'ADMIN');
    assert.equal(updated?.id, created.id);
    assert.equal(updated?.currentVersion, created.currentVersion + 1);
    assert.equal(updated?.budgetItems.length, 2);
    assert.equal(updated?.budgetItems.reduce((sum, item) => sum + item.totalPrice, 0), 2_440_000);
    const stableIds = updated?.budgetItems.map((item) => item.id).sort();

    const unchanged = await updateEvent(created.id, {
      expectedVersion: updated!.currentVersion,
      changeNote: 'Lưu lại không đổi dự toán',
      budgetItems: updatedBudget,
    }, user.id, 'ADMIN');
    assert.deepEqual(unchanged?.budgetItems.map((item) => item.id).sort(), stableIds);
    assert.equal(await prisma.budgetItem.count({ where: { eventId: created.id } }), 2);

    await assert.rejects(
      updateEvent(created.id, {
        expectedVersion: created.currentVersion,
        changeNote: 'Lần gửi trùng',
        budgetItems: updatedBudget,
      }, user.id, 'ADMIN'),
      /đã được máy khác cập nhật/
    );

    const deletedOne = await updateEvent(created.id, {
      expectedVersion: unchanged!.currentVersion,
      changeNote: 'Xóa một khoản dự trù',
      budgetItems: [updatedBudget[0]],
    }, user.id, 'ADMIN');
    assert.equal(deletedOne?.budgetItems.length, 1);
    assert.equal(deletedOne?.budgetItems[0].totalPrice, 1_800_000);

    const deletedAll = await updateEvent(created.id, {
      expectedVersion: deletedOne!.currentVersion,
      changeNote: 'Xóa toàn bộ khoản dự trù',
      budgetItems: [],
    }, user.id, 'ADMIN');
    assert.equal(deletedAll?.budgetItems.length, 0);
    assert.equal(await prisma.budgetItem.count({ where: { eventId: created.id } }), 0);

    const reloaded = await getEventById(created.id);
    assert.equal(reloaded?.id, created.id);
    assert.equal(reloaded?.budgetItems.length, 0);
    assert.equal(await prisma.workflowHistory.count({ where: { eventId: created.id } }), 5);
    assert.equal(await prisma.eventVersion.count({ where: { eventId: created.id } }), 5);
  });

  it('rejects invalid quantities, amounts, and unsafe line totals', () => {
    const valid = {
      title: 'Kiểm thử dự trù',
      organizingUnit: 'Đơn vị kiểm thử',
      budgetItems: [{ category: 'Khác', itemName: 'Vật tư', quantity: 2, unitPrice: 10 }],
    };
    assert.equal(createEventSchema.safeParse(valid).success, true);
    assert.equal(createEventSchema.safeParse({
      ...valid,
      budgetItems: [{ ...valid.budgetItems[0], unitPrice: 10.5, notes: null }],
    }).success, true);
    assert.equal(createEventSchema.safeParse({
      ...valid,
      budgetItems: [{ ...valid.budgetItems[0], quantity: 1.5 }],
    }).success, false);
    assert.equal(createEventSchema.safeParse({
      ...valid,
      budgetItems: [{ ...valid.budgetItems[0], unitPrice: -1 }],
    }).success, false);
    assert.equal(createEventSchema.safeParse({
      ...valid,
      budgetItems: [{ ...valid.budgetItems[0], quantity: Number.MAX_SAFE_INTEGER, unitPrice: 2 }],
    }).success, false);
    assert.equal(createEventSchema.safeParse({
      ...valid,
      budgetItems: [
        { category: 'Khác', itemName: 'Khoản A', quantity: Number.MAX_SAFE_INTEGER - 1, unitPrice: 1 },
        { category: 'Khác', itemName: 'Khoản B', quantity: 2, unitPrice: 1 },
      ],
    }).success, false);
    assert.deepEqual(validateBudgetItems([{ itemName: 'Hội trường', quantity: 2, unitPrice: 10 }]), {});
    assert.deepEqual(validateBudgetSubmission([], true), {});
    assert.ok(Object.hasOwn(validateBudgetItems([{
      itemName: 'Hội trường',
      quantity: Number.MAX_SAFE_INTEGER,
      unitPrice: 2,
    }]), 'budget'));
    assert.ok(Object.hasOwn(validateBudgetItems([
      { itemName: 'Khoản A', quantity: Number.MAX_SAFE_INTEGER - 1, unitPrice: 1 },
      { itemName: 'Khoản B', quantity: 2, unitPrice: 1 },
    ]), 'budget'));
  });
});
