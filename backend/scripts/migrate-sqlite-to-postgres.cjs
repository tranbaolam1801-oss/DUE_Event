require('dotenv').config();

const { PrismaClient: SqliteClient } = require('@prisma/client');
const { PrismaClient: PostgresClient } = require('../generated/postgresql');

const models = [
  'User',
  'Facility',
  'Equipment',
  'Event',
  'EventVersion',
  'EventScheduleItem',
  'BudgetItem',
  'ApprovalDecision',
  'WorkflowHistory',
  'Attachment',
  'ResourceBooking',
  'ResourceBookingItem',
  'HandoverRecord',
  'ReturnInspection',
  'IncidentReport',
  'Settlement',
  'SettlementItem',
  'FinancialDocument',
  'EventReport',
  'Notification',
  'AuditLog',
  'SystemSetting',
  'PasswordResetToken',
];

const delegateName = (model) => model[0].toLowerCase() + model.slice(1);

function assertConnectionUrls(sourceUrl, targetUrl) {
  if (!sourceUrl?.startsWith('file:')) {
    throw new Error('SOURCE_DATABASE_URL must point to a local SQLite file');
  }
  if (!targetUrl || !['postgres:', 'postgresql:'].includes(new URL(targetUrl).protocol)) {
    throw new Error('DIRECT_URL must point to the PostgreSQL target');
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  const sourceUrl = process.env.SOURCE_DATABASE_URL || 'file:./dev.db';
  const targetUrl = process.env.DIRECT_URL;

  if (apply) {
    assertConnectionUrls(sourceUrl, targetUrl);
    if (process.env.CONFIRM_SQLITE_TO_POSTGRES_MIGRATION !== 'I_HAVE_BACKUP_AND_TARGET_IS_EMPTY') {
      throw new Error('Explicit backup and empty-target confirmation is required');
    }
  } else {
    assertConnectionUrls(sourceUrl, 'postgresql://dry-run:dry-run@localhost:5432/dry-run');
  }

  const source = new SqliteClient({ datasources: { db: { url: sourceUrl } } });
  const target = apply
    ? new PostgresClient({ datasources: { db: { url: targetUrl } } })
    : undefined;

  try {
    const sourceCounts = {};
    const targetCounts = {};

    for (const model of models) {
      const delegate = delegateName(model);
      sourceCounts[model] = await source[delegate].count();
      if (target) {
        targetCounts[model] = await target[delegate].count();
        if (targetCounts[model] !== 0) {
          throw new Error('Target contains application data; migration requires an empty target schema');
        }
      }
    }

    const sourceTotal = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);
    if (!apply) {
      console.log(JSON.stringify({ mode: 'dry-run', models: sourceCounts, totalRecords: sourceTotal }, null, 2));
      return;
    }

    await target.$transaction(async (transaction) => {
      for (const model of models) {
        const delegate = delegateName(model);
        const records = await source[delegate].findMany();
        for (let offset = 0; offset < records.length; offset += 250) {
          await transaction[delegate].createMany({ data: records.slice(offset, offset + 250) });
        }
      }
    }, { maxWait: 10000, timeout: 600000 });

    const verifiedCounts = {};
    for (const model of models) {
      const delegate = delegateName(model);
      verifiedCounts[model] = await target[delegate].count();
      if (verifiedCounts[model] !== sourceCounts[model]) {
        throw new Error('Post-migration row counts do not match the SQLite source');
      }
    }

    console.log(JSON.stringify({
      mode: 'applied',
      models: verifiedCounts,
      totalRecords: Object.values(verifiedCounts).reduce((sum, count) => sum + count, 0),
    }, null, 2));
  } finally {
    await source.$disconnect();
    await target?.$disconnect();
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error('SQLite-to-PostgreSQL migration stopped. No target data was reset or deleted; inspect configuration and target schema.');
    process.exitCode = 1;
  });
}

module.exports = { assertConnectionUrls, models };
