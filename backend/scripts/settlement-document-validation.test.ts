import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertSettlementDocumentFilesExist,
  assertSettlementReadyForSubmission,
} from '../src/services/settlement.service';

const readySettlement = {
  settlementDate: new Date('2026-11-07T00:00:00Z'),
  items: [{ itemName: 'Hội trường' }],
};

test('submission does not require financial-document metadata or a file', () => {
  assert.doesNotThrow(() => assertSettlementReadyForSubmission({ ...readySettlement, documents: [] }));
  assert.doesNotThrow(() => assertSettlementReadyForSubmission({
    ...readySettlement,
    documents: [{ documentType: 'INVOICE', fileName: 'receipt.pdf', filePath: null }],
  }));
  assert.doesNotThrow(() => assertSettlementReadyForSubmission({
    ...readySettlement,
    documents: [{ documentType: 'INVOICE', fileName: 'receipt.pdf', filePath: 'supabase://private/event/receipt.pdf' }],
  }));
});

test('approval verifies attached financial document objects exist in the configured private bucket', async () => {
  const keys = ['NODE_ENV', 'STORAGE_DRIVER', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_STORAGE_BUCKET'];
  const originalEnv = keys.map((key) => process.env[key]);
  const originalFetch = global.fetch;
  Object.assign(process.env, {
    NODE_ENV: 'production',
    STORAGE_DRIVER: 'supabase',
    SUPABASE_URL: 'https://storage.invalid',
    SUPABASE_SERVICE_ROLE_KEY: 'unit-test-only',
    SUPABASE_STORAGE_BUCKET: 'private-test',
  });
  const requests: Array<{ url: string; method: string }> = [];
  global.fetch = (async (url, init) => {
    requests.push({ url: String(url), method: init?.method || 'GET' });
    if (String(url).includes('/bucket/')) return new Response(JSON.stringify({ public: false }));
    if (String(url).includes('/missing.pdf')) return new Response(null, { status: 404 });
    return new Response(null, { status: 200 });
  }) as typeof fetch;
  try {
    await assert.rejects(assertSettlementDocumentFilesExist({
      documents: [
        { documentType: 'INVOICE', fileName: 'missing.pdf', filePath: 'supabase://private-test/event-id/missing.pdf' },
        { documentType: 'INVOICE', fileName: 'receipt.pdf', filePath: 'supabase://private-test/event-id/receipt.pdf' },
      ],
    }), /Không tìm thấy tệp chứng từ trong Supabase Storage/);
    assert.equal(requests.filter((request) => request.method === 'HEAD').length, 1);
    assert.ok(requests.some((request) => request.url.includes('/object/private-test/event-id/missing.pdf')));

    requests.length = 0;
    global.fetch = (async (url, init) => {
      requests.push({ url: String(url), method: init?.method || 'GET' });
      if (String(url).includes('/bucket/')) return new Response(JSON.stringify({ public: false }));
      return new Response(null, { status: 200 });
    }) as typeof fetch;
    await assertSettlementDocumentFilesExist({
      documents: [
        { documentType: 'INVOICE', fileName: 'one.pdf', filePath: 'supabase://private-test/event-id/one.pdf' },
        { documentType: 'RECEIPT', fileName: 'two.pdf', filePath: 'supabase://private-test/event-id/two.pdf' },
      ],
    });
    assert.equal(requests.filter((request) => request.method === 'HEAD').length, 2);

    global.fetch = (async (url) => {
      if (String(url).includes('/bucket/')) return new Response(JSON.stringify({ public: false }));
      return new Response(null, { status: 404 });
    }) as typeof fetch;
    await assert.rejects(
      assertSettlementDocumentFilesExist({
        documents: [{ documentType: 'INVOICE', fileName: 'missing.pdf', filePath: 'supabase://private-test/event-id/missing.pdf' }],
      }),
      /Không tìm thấy tệp chứng từ/
    );
    await assert.rejects(assertSettlementDocumentFilesExist({
      documents: [
        { documentType: 'INVOICE', fileName: 'receipt.pdf', filePath: 'supabase://private-test/event-id/receipt.pdf' },
        { documentType: 'INVOICE', fileName: 'missing-2.pdf', filePath: 'supabase://private-test/event-id/missing-2.pdf' },
      ],
    }),
      /Không tìm thấy tệp chứng từ trong Supabase Storage/
    );
  } finally {
    global.fetch = originalFetch;
    keys.forEach((key, index) => {
      if (originalEnv[index] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[index];
    });
  }
});
