import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAttachment, saveAttachment, resolveAttachment, removeAttachment } from '../src/services/storage.service';
test('reject active file extensions, spoofed MIME, empty files and false signatures', () => {
  assert.throws(() => validateAttachment('x.html','text/html',Buffer.from('<script>')));
  assert.throws(() => validateAttachment('x.pdf','application/pdf',Buffer.from('<html>')));
  assert.throws(() => validateAttachment('x.pdf','application/pdf',Buffer.alloc(0)));
  assert.equal(validateAttachment('x.pdf','application/pdf',Buffer.from('%PDF-1.7')), '.pdf');
  assert.equal(validateAttachment('plan.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',Buffer.from('PK\x03\x04')), '.xlsx');
});
test('private storage checks bucket, disables overwrite, and returns opaque metadata', async () => {
  const originalFetch = global.fetch;
  const keys = ['STORAGE_DRIVER','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_STORAGE_BUCKET'];
  const originalEnv = keys.map(key=>process.env[key]);
  Object.assign(process.env, { STORAGE_DRIVER:'supabase', SUPABASE_URL:'https://storage.invalid', SUPABASE_SERVICE_ROLE_KEY:'unit-test-only', SUPABASE_STORAGE_BUCKET:'private-test' });
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
    global.fetch = (async () => new Response(JSON.stringify({public:true}))) as typeof fetch;
    await assert.rejects(saveAttachment('event-id','plan.pdf','application/pdf',Buffer.from('%PDF-1.7')),/private/);
  } finally {
    global.fetch=originalFetch;
    keys.forEach((key,i)=>{if(originalEnv[i]===undefined) delete process.env[key]; else process.env[key]=originalEnv[i];});
  }
});
