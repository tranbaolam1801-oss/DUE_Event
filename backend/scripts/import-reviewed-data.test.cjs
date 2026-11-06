const {test}=require('node:test');const assert=require('node:assert/strict');
const {identity,prepare}=require('./import-reviewed-data.cjs');
test('bigint mapping is stable, table-specific and exact beyond JS safe integer',()=>{
 assert.equal(identity('Users','9007199254740993'),identity('Users','9007199254740993'));
 assert.notEqual(identity('Users','9007199254740993'),identity('Users','9007199254740992'));
 assert.notEqual(identity('Users','1'),identity('Events','1'));
});
test('missing references and unverified account mappings fail closed',()=>{
 assert.throws(()=>prepare({version:1,records:[{sourceTable:'Users',sourceId:'1',targetModel:'User',source:{},data:{}}]}),/email/);
 assert.throws(()=>prepare({version:1,records:[{sourceTable:'Events',sourceId:'1',targetModel:'Event',source:{},data:{createdById:{$ref:{table:'Users',id:'9'}}}}]}),/foreign/);
});
