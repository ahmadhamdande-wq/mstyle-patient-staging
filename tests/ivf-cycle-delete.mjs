import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const raw=fs.readFileSync('lib/ivf-treatment.ts','utf8'),a=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));const ctx={};vm.runInNewContext(a['cycle-delete-core.js'],ctx);const core=ctx.IVFCycleDeleteCore;
const cycle={id:'C',type:'cycle',oiSchedules:[{drug:'Gonal-F'}],oiVisits:{V:{e2:'800'}},oiTrigger:{triggerAt:'2026-10-10T22:00'}};
const other={id:'OTHER',type:'cycle'};const encounters=[{id:'V',careLinks:{cycle:'C',anc:'A'},fields:{patientName:'Fictional'}}];const result=core.remove([cycle,other],'C',encounters);assert.equal(result.care.length,1);assert.equal(result.care[0].id,'OTHER');assert.equal(result.encounters[0].careLinks.cycle,undefined);assert.equal(result.encounters[0].careLinks.anc,'A');assert.equal(encounters[0].careLinks.cycle,'C');
for(const extra of [{opu:{status:'Completed'}},{opu:{retrieved:4}},{embryology:{icsi:{injected:3}}},{embryology:{embryos:[{id:'E1'}]}},{embryology:{days:{1:{}}}},{oiOutcome:{oocytesRetrieved:5}},{oiOutcome:{embryosFrozen:2}},{freshTransfer:{transfer:{status:'Completed'}}}])assert.throws(()=>core.remove([{...cycle,...extra}],'C',[]),/Remove linked records/);
assert.throws(()=>core.remove([cycle,{id:'ET',type:'et',sourceCycleId:'C'}],'C',[]),/transfer/);
assert.equal(core.dependencies(cycle,[]).length,0);assert.equal(cycle.oiSchedules.length,1);
for(const k of ['cycle-controls.js','embryology-ui.js','ivf-workflow-stages.js'])new vm.Script(a[k]);
console.log('PASS whole-cycle removal, encounter unlinking, other-cycle preservation and OPU/lab/transfer dependency blocks.');
