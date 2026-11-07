import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AttachmentError, validateAttachment, saveAttachment, resolveAttachment, removeAttachment } from '../src/services/storage.service';
test('reject active file extensions, spoofed MIME, empty files and false signatures', () => {
  assert.throws(() => validateAttachment('x.html','text/html',Buffer.from('<script>')));
  assert.throws(() => validateAttachment('x.pdf','application/pdf',Buffer.from('<html>')));
  assert.throws(() => validateAttachment('x.pdf','application/pdf',Buffer.alloc(0)));
  assert.equal(validateAttachment('x.pdf','application/pdf',Buffer.from('%PDF-1.7')), '.pdf');
  assert.equal(validateAttachment('plan.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',Buffer.from('PK\x03\x04')), '.xlsx');
  assert.equal(validateAttachment('receipt.png','image/png',Buffer.from('89504e470d0a1a0a','hex')), '.png');
  assert.equal(validateAttachment('contract.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',Buffer.from('PK\x03\x04')), '.docx');
});
test('private storage checks bucket, disables overwrite, and returns opaque metadata', async () => {
  const originalFetch = global.fetch;
  const keys = ['NODE_ENV','STORAGE_DRIVER','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_STORAGE_BUCKET'];
  const originalEnv = keys.map(key=>process.env[key]);
  Object.assign(process.env, { NODE_ENV:'production', STORAGE_DRIVER:'supabase', SUPABASE_URL:'https://storage.invalid', SUPABASE_SERVICE_ROLE_KEY:'unit-test-only', SUPABASE_STORAGE_BUCKET:'private-test' });
  const calls: {url:string,init?:RequestInit}[] = [];
  global.fetch = (async (url, init) => {
    calls.push({url:String(url),init});
    if (String(url).includes('/bucket/')) return new Response(JSON.stringify({ public:false }));
    if (String(url).includes('/object/sign/')) return new Response(JSON.stringify({ signedURL:'/object/sign/private-test/key?token=test' }));
    return new Response('{}');
  }) as typeof fetch;
  try {
    const saved = await saveAttachment('event-id','plan.pdf','application/pdf',Buffer.from('%PDF-1.7'));
    assert.match(saved.filePath,/^supabase:\/\/private-test\/event-id\//);
    assert.equal((calls[1].init?.headers as Record<string,string>)['x-upsert'],'false');
    assert.equal(calls[1].init?.method,'POST');
    const location = await resolveAttachment(saved.filePath);
    assert.ok('url' in location && location.url.startsWith('https://storage.invalid/storage/v1/object/sign/'));
    await resolveAttachment(saved.filePath, true);
    const signingCall = calls.filter(call => String(call.url).includes('/object/sign/'))[1];
    assert.equal(JSON.parse(String(signingCall.init?.body)).download, true);
    await removeAttachment(saved.filePath);
    assert.equal(calls.find(call => call.init?.method === 'DELETE')?.init?.method, 'DELETE');
    const requestId = 'stable-request-id';
    const firstRetry = await saveAttachment('event-id','plan.pdf','application/pdf',Buffer.from('%PDF-1.7'),requestId);
    const sameRetry = await saveAttachment('event-id','plan.pdf','application/pdf',Buffer.from('%PDF-1.7'),requestId);
    const changedFile = await saveAttachment('event-id','plan.pdf','application/pdf',Buffer.from('%PDF-2.0'),requestId);
    assert.equal(firstRetry.filePath, sameRetry.filePath);
    assert.notEqual(firstRetry.filePath, changedFile.filePath);
    const idempotentUploads = calls.filter(call => String(call.url).includes('/object/private-test/'));
    assert.ok(idempotentUploads.slice(-3).every(call => (call.init?.headers as Record<string,string>)['x-upsert'] === 'true'));
    global.fetch = (async () => new Response(JSON.stringify({public:true}))) as typeof fetch;
    await assert.rejects(saveAttachment('event-id','plan.pdf','application/pdf',Buffer.from('%PDF-1.7')),/private/);
  } finally {
    global.fetch=originalFetch;
    keys.forEach((key,i)=>{if(originalEnv[i]===undefined) delete process.env[key]; else process.env[key]=originalEnv[i];});
  }
});

test('missing production storage configuration fails with a safe actionable error', async () => {
  const keys = ['NODE_ENV','STORAGE_DRIVER','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_STORAGE_BUCKET'];
  const originalEnv = keys.map(key => process.env[key]);
  const originalFetch = global.fetch;
  Object.assign(process.env, {
    NODE_ENV: 'production',
    SUPABASE_URL: 'https://storage.invalid',
    SUPABASE_SERVICE_ROLE_KEY: 'unit-test-only',
    SUPABASE_STORAGE_BUCKET: 'private-test',
  });
  delete process.env.STORAGE_DRIVER;
  let fetchCalled = false;
  global.fetch = (async () => {
    fetchCalled = true;
    return new Response('{}');
  }) as typeof fetch;
  try {
    await assert.rejects(
      saveAttachment('event-id','plan.pdf','application/pdf',Buffer.from('%PDF-1.7')),
      (error: unknown) => error instanceof AttachmentError &&
        error.statusCode === 503 &&
        error.code === 'STORAGE_NOT_CONFIGURED' &&
        !error.message.includes('unit-test-only')
    );
    assert.equal(fetchCalled, false);
  } finally {
    global.fetch = originalFetch;
    keys.forEach((key, index) => {
      if (originalEnv[index] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[index];
    });
  }
});
