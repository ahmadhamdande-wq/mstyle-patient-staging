import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const raw=fs.readFileSync('lib/edition31.ts','utf8'),assets=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
const ctx=vm.createContext({});vm.runInContext(assets['encounter-results-core.js'],ctx);const C=ctx.EncounterResultsCore;
for(const [s,d,raised,severe]of [['','',false,false],['139','89',false,false],['140','70',true,false],['110','90',true,false],['160','70',true,true],['110','110',true,true],['','95',true,false]]){assert.equal(C.bp(s,d).elevated,raised);assert.equal(C.bp(s,d).severe,severe);}
const all=[{id:'old',patientId:'P',person:'wife',fields:{visitDate:'2026-10-01'}},{id:'new',patientId:'P',person:'wife',fields:{visitDate:'2026-10-14'}},{id:'other',patientId:'OTHER',person:'wife',fields:{visitDate:'2026-10-15'}},{id:'husband',patientId:'P',person:'husband',fields:{visitDate:'2026-10-14'}}];
assert.deepEqual(Array.from(C.visits(all,'P','wife'),v=>v.id),['new','old']);assert.equal(all[0].id,'old');
const scan={scanDate:'2026-10-14',obstetricUS:{ancCRL:'44',ancScanFHR:'160',ancFetalCount:'1',ancHeartbeat:'Present'}};
const care=[{id:'A',type:'anc',patientId:'P',encounterIds:['new'],ancRecords:{new:scan}},{id:'B',type:'anc',patientId:'OTHER',encounterIds:['other'],ancRecords:{other:{scanDate:'2026-10-15'}}}];
assert.equal(C.scan(care,all[1]),scan);assert.equal(C.scan(care,all[0]),null);
// Exercise the actual ANC record save/reopen functions with the new scan fields.
const original=fs.readFileSync('tests/anc-visit-persistence.mjs','utf8');
const enhanced=original.replace("el('newScan').checked=false;", "for(const key of ['ancCRL','ancScanFHR','ancFetalCount','ancHeartbeat'])ctx.ancUSKeys.push(key);el('ancCRL').value='44';el('ancScanFHR').value='160';el('ancFetalCount').value='1';el('ancHeartbeat').value='Present';el('newScan').checked=false;")
.replace("assert.equal(ep.ancRecords.v1.us,'10w 0d');", "assert.equal(ep.ancRecords.v1.us,'10w 0d');assert.equal(ep.ancRecords.v1.obstetricUS.ancCRL,'44');assert.equal(ep.ancRecords.v1.obstetricUS.ancScanFHR,'160');assert.equal(visits[0].gestationalUS.ancHeartbeat,'Present');")
.replace("el('ancAF').value='';ctx.loadObstetricUS", "el('ancCRL').value='';el('ancAF').value='';ctx.loadObstetricUS")
.replace("assert.equal(el('ancAF').value,'Oligohydramnios');", "assert.equal(el('ancAF').value,'Oligohydramnios');assert.equal(el('ancCRL').value,'44');assert.equal(el('ancHeartbeat').value,'Present');");
// ancUSKeys is a lexical binding in the original VM.
const fixed=enhanced.replace("ctx.ancUSKeys.push(key)", "vm.runInContext('ancUSKeys.push('+JSON.stringify(key)+')',ctx)")
.replace("assert.equal(visits[0].gestationalUS.ancHeartbeat,'Present');", "assert.equal(JSON.parse(store['hamdan-couple-encounters-v1'])[0].gestationalUS.ancHeartbeat,'Present');");
const scratch='tests/.anc-compact-persistence-check.mjs';try{fs.writeFileSync(scratch,fixed);await import('./.anc-compact-persistence-check.mjs?run='+Date.now());}finally{fs.rmSync(scratch,{force:true});}
for(const name of ['encounter-results-core.js','anc-compact-setup.js','encounter-results-drawer.js','anc-compact-setup.css'])assert.equal(assets[name],fs.readFileSync('/workspace/sites/hamdan-mstyle-center/dist/'+name,'utf8'));
console.log('PASS BP thresholds, severe range, patient/person isolation, encounter-specific scans, new scan field save/reopen and paired copy parity.');
