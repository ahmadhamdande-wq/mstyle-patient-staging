import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const s=fs.readFileSync('lib/edition31.ts','utf8');const assets=JSON.parse(s.slice(s.indexOf('=')+1).trim().replace(/;$/,''));
for(const html of [assets['index.html'],fs.readFileSync('/workspace/scratch/bc4ad78b991d/patient-history-site/dist/index.html','utf8')]){
 const code=html.slice(html.indexOf('function filePregnancies()'),html.indexOf('function refreshFileANC()'));
 const store=new Map();let url;const ctx={data:{profile:{name:'Example patient',dob:'1990-01-01'},initialPlan:{}},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},saveDraft:()=>true,$:()=>({focus(){}}),location:{set href(v){url=v}},window:{cloudNavigate:v=>url=v},Date,Math,JSON,encodeURIComponent};vm.createContext(ctx);vm.runInContext(code,ctx);
 ctx.openANCFromFile();assert.match(url,/^anc.html\?path=anc&encounter=/);let visits=JSON.parse(store.get('hamdan-couple-encounters-v1'));assert.equal(visits.length,1);assert.equal(visits[0].fields.patientName,'Example patient');
 store.set('hamdan-linked-care-v1',JSON.stringify([{id:'ANC-EXAMPLE',type:'anc',patientId:'DEMO-001',status:'Active',encounterIds:[visits[0].id]}]));ctx.openANCFromFile();assert.equal(JSON.parse(store.get('hamdan-couple-encounters-v1')).length,1);assert.match(url,/record=ANC-EXAMPLE/);
 ctx.newANCVisitFromFile();visits=JSON.parse(store.get('hamdan-couple-encounters-v1'));assert.equal(visits.length,2);assert.equal(visits[1].careLinks.anc,'ANC-EXAMPLE');assert.match(url,/record=ANC-EXAMPLE/);
 store.set('hamdan-linked-care-v1',JSON.stringify([{id:'ANC-EXAMPLE',type:'anc',patientId:'DEMO-001',status:'Ended',encounterIds:[visits[0].id]}]));ctx.newANCVisitFromFile();assert.equal(JSON.parse(store.get('hamdan-couple-encounters-v1')).length,2);
}
assert.match(assets['anc.html'],/renderLinkedHistory\(\);persistLinkedANC\(\);}/);console.log('PASS: direct ANC entry, patient identity, existing pregnancy reuse, follow-up linking and ended pregnancy protection in both copies.');
