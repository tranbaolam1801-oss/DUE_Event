// Read-only catalog inspection. No rows containing personal data are returned.
require('dotenv').config();
const url = process.env.SUPABASE_INSPECT_URL;
if (!/^postgres(?:ql)?:/.test(url || '')) {
 console.error('Set server-side SUPABASE_INSPECT_URL with a read-only PostgreSQL account.'); process.exit(1);
}
const { PrismaClient } = require('../generated/postgresql');
const db = new PrismaClient({ datasources: { db: { url } } });
(async () => {
 const result = await db.$transaction(async tx => {
  await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
  await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '15s'");
  const tables = await tx.$queryRawUnsafe(`SELECT n.nspname AS schema, c.relname AS name, c.relrowsecurity AS rls, c.relforcerowsecurity AS force_rls, has_table_privilege(current_user,c.oid,'SELECT') AS can_select FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','my_due') AND c.relkind='r' ORDER BY c.relname`);
  const columns = await tx.$queryRawUnsafe("SELECT table_schema,table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema IN ('public','my_due') ORDER BY table_name,ordinal_position");
  const constraints = await tx.$queryRawUnsafe("SELECT n.nspname AS schema,c.relname AS table_name, con.conname, pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','my_due')");
  const indexes = await tx.$queryRawUnsafe("SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname IN ('public','my_due')");
  const policies = await tx.$queryRawUnsafe("SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname IN ('public','my_due')");
  const counts = {};
  for (const t of tables) {
   if (!t.can_select) continue;
   const name = '"' + t.name.replaceAll('"','""') + '"';
   counts[t.schema + '.' + t.name] = (await tx.$queryRawUnsafe('SELECT count(*) AS count FROM "' + t.schema + '".' + name))[0].count.toString();
  }
  return {tables,columns,constraints,indexes,policies,counts};
 }, { timeout: 120000 });
 console.log(JSON.stringify(result, (_k,v)=>typeof v==='bigint'?v.toString():v,2));
})().catch(() => { console.error('Read-only inspection failed; check connectivity and privileges. Connection details suppressed.'); process.exitCode=1; }).finally(()=>db.$disconnect());
