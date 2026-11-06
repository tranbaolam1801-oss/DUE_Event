// Reviewed mapping manifest only. Dry-run by default. Never writes to remote/production DBs.
const fs = require('node:fs');
const crypto = require('node:crypto');
const allowed = new Set(['User','Event','EventVersion','EventScheduleItem','BudgetItem','ApprovalDecision','WorkflowHistory','Attachment','Facility','Equipment','ResourceBooking','ResourceBookingItem','HandoverRecord','ReturnInspection','IncidentReport','Settlement','SettlementItem','FinancialDocument','EventReport','Notification','AuditLog','SystemSetting']);
function identity(table,id) {
 if (typeof id !== 'string') throw new Error('Legacy IDs must be decimal strings, never JS numbers');
 if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(table) || !/^\d+$/.test(String(id))) throw new Error('Invalid legacy identity');
 const hex=crypto.createHash('sha256').update(`my-due-public:${table}:${BigInt(id)}`).digest('hex').slice(0,32).split('');
 hex[12]='5';hex[16]=((parseInt(hex[16],16)&3)|8).toString(16);
 const h=hex.join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
function prepare(manifest) {
 if(manifest.version!==1 || !Array.isArray(manifest.records)) throw new Error('Expected reviewed version 1 manifest');
 const keys=new Set();
 for(const r of manifest.records){
  if(!allowed.has(r.targetModel)||!r.source||!r.data)throw new Error('Missing source, target or mapping');
  const k=r.sourceTable+':'+BigInt(r.sourceId);if(keys.has(k))throw new Error('Duplicate source identity');keys.add(k);
 }
 function resolve(value){
  if(Array.isArray(value))return value.map(resolve);
  if(value && typeof value==='object'){
   if(value.$ref){const ref=value.$ref;if(!keys.has(ref.table+':'+BigInt(ref.id)))throw new Error('Unresolved foreign identity');return identity(ref.table,ref.id);}
   return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,resolve(v)]));
  }return value;
 }
 return manifest.records.map(r=>{
  const data=resolve(r.data);
  if(r.targetModel==='User') {
   if(r.emailVerified!==true || typeof data.email!=='string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email))throw new Error('Verified email mapping required; Username is not email');
   if(data.passwordHash!==r.source.PasswordHash)throw new Error('Password hash must be preserved exactly');
   if(!/^\$2[aby]\$/.test(data.passwordHash))throw new Error('Existing hash is incompatible with bcrypt; explicit auth review required');
   if(r.roleVerified!==true || !['BTC','BCN_KHOA','DOAN_TRUONG','CSVC','KHTC','ADMIN'].includes(data.role))throw new Error('Verified role mapping required');
  }
  if(data.id && data.id!==identity(r.sourceTable,r.sourceId))throw new Error('Unexpected target identity');
  return {...r,data:{...data,id:identity(r.sourceTable,r.sourceId)}};
 });
}
async function main(){
 const manifest=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const records=prepare(manifest);
 console.log(JSON.stringify({validatedRecords:records.length,mode:process.argv.includes('--apply-test')?'test-write':'dry-run'}));
 if(!process.argv.includes('--apply-test'))return;
 const url=new URL(process.env.TEST_DATABASE_URL||'');
 if(!['postgres:','postgresql:'].includes(url.protocol)||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||!/^\/my_due_test_[a-z0-9_]+$/.test(url.pathname)||process.env.CONFIRM_ISOLATED_TEST_DATABASE!=='true')throw new Error('Only explicitly confirmed local my_due_test_* databases are allowed');
 const {PrismaClient}=require('../generated/postgresql');const db=new PrismaClient({datasources:{db:{url:url.toString()}}});
 try{
 await db.$transaction(async tx=>{
  for(const r of records){
   const where={entity_legacyId:{entity:r.sourceTable,legacyId:BigInt(r.sourceId)}};
   if(await tx.legacyIdentityMap.findUnique({where}))throw new Error('Already imported identity; no overwrite allowed');
   const delegate=r.targetModel[0].toLowerCase()+r.targetModel.slice(1);
   await tx[delegate].create({data:r.data});
   await tx.legacyIdentityMap.create({data:{entity:r.sourceTable,legacyId:BigInt(r.sourceId),applicationId:r.data.id,verifiedAt:new Date()}});
   await tx.$executeRaw`INSERT INTO my_due."LegacySourceArchive" ("entity", "legacyId", "source") VALUES (${r.sourceTable}, ${BigInt(r.sourceId)}, ${JSON.stringify(r.source)}::jsonb)`;
  }
 },{timeout:120000});
 console.log(JSON.stringify({inserted:records.length}));
 }finally{await db.$disconnect();}
}
module.exports={identity,prepare};
if(require.main===module)main().catch(()=>{console.error('Import rejected or rolled back. Check mapping, schema and test connection; sensitive details suppressed.');process.exitCode=1});
