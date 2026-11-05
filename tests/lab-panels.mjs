import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const require=createRequire(import.meta.url);
const {Miniflare}=await import(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]}));
const files=fs.readdirSync('dist/server',{recursive:true}).filter(p=>/\.m?js$/.test(p)).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:0);
const mf=new Miniflare({name:'laboratory-test',modules:files.map(p=>({type:'ESModule',path:'dist/server/'+p})),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'fictional-labs'},r2Buckets:{BUCKET:'fictional-labs'}});
const password='Fictional owner passphrase 2026',temp='Fictional temporary password',salt='fictional-lab-salt';
const patient='11111111-1111-4111-8111-111111111111',foreign='22222222-2222-4222-8222-222222222222';
const call=(path,method='GET',body,cookie='',headers={})=>mf.dispatchFetch('https://clinic.example'+path,{method,redirect:'manual',headers:{Origin:'https://clinic.example','Content-Type':'application/json','X-Clinic-Request':'1',Cookie:cookie,...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
async function expect(res,status){assert.equal(res.status,status,await res.clone().text());return res;}
async function body(res,status=200){return (await expect(res,status)).json();}
async function login(username,p=password){const r=await expect(await call('/api/auth/login','POST',{username,password:p}),200);return r.headers.get('set-cookie').split(';')[0];}
const raw=fs.readFileSync('lib/edition31.ts','utf8'),assets=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
assert.equal(fs.readFileSync('lib/lab-embryology.mjs','utf8'),'// Validated clinical cores shared with the existing chart. No browser state.\nconst window={};\n'+assets['fresh-ivf-core.js']+'\n'+assets['embryology-core.js']+'\nexport const fresh=window.FreshIVFCore;\nexport const embryo=window.EmbryologyCore;\n','Server uses the exact clinical validators.');
let db;
try{
 db=await mf.getD1Database('DB');
 for(const name of fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())for(const sql of fs.readFileSync('drizzle/'+name,'utf8').replaceAll('--> statement-breakpoint','').split(';').map(x=>x.trim()).filter(Boolean))await db.prepare(sql).run();
 const k=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const hash=Buffer.from(await webcrypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},k,256)).toString('hex');
 for(const [id,owner,role,access]of [['owner','clinic-a','doctor','write'],['other','clinic-b','doctor','write'],['reader','clinic-a','nurse','read'],['reception','clinic-a','reception','none']])await db.prepare('INSERT INTO clinic_staff(id,owner,username,password_hash,salt,role,active,created,is_owner,clinical_access,display_name) VALUES(?,?,?,?,?,?,1,?,?,?,?)').bind(id,owner,id,hash,salt,role,'2026-01-01',id==='owner'?1:0,access,'Fictional '+id).run();
 const date='2026-10-10',c={id:'CYCLE-A',type:'cycle',fields:{fertilisation:'ICSI'},opu:{status:'Completed',at:date+'T08:00',retrieved:4,mii:4},postOPUDecision:{plan:'Fresh ET',doctor:'Fictional doctor',confirmedAt:date+'T09:00'},oiVisits:{SECRET:{comment:'SECRET SCAN'}},freshTransfer:{plan:'Fresh ET',transfer:{status:'Draft'},regimens:[{id:'RX',drug:'SECRET MEDICINE'}]}};
 const values={'profile-wife':{name:'Fictional wife',dob:'1990-01-01',fileNumber:'FILE-LAB',complaint:'SECRET HISTORY',mobile:'SECRET PHONE'},'profile-husband':{name:'Fictional husband',dob:'1988-01-01'},'hamdan-couple-encounters-v1':[{id:'V1',person:'wife',fields:{visitDate:date,complaint:'SECRET COMPLAINT'},orders:[{id:'E2',name:'E2',category:'hormonal',status:'Pending'},{id:'P4',name:'Progesterone (P4)',category:'hormonal',status:'Pending'},{id:'CBC',name:'CBC',category:'hematology',result:'SECRET CBC'}]},{id:'H1',person:'husband',fields:{visitDate:date},orders:[{id:'T',name:'Testosterone',category:'hormonal'}]}],'hamdan-linked-care-v1':[c],'SECRET-KEY':{keep:'SECRET KEY'},'attachment':{__attachment:'untouched',mime:'application/pdf'}};
 const snapshot=JSON.stringify(Object.fromEntries(Object.entries(values).map(([k,v])=>[k,{json:v}])));
 for(const [id,owner]of [[patient,'clinic-a'],[foreign,'clinic-b']])await db.prepare('INSERT INTO patients VALUES(?,?,?,?,?,?,?,?)').bind(id,owner,'Fictional wife','1990-01-01','Fictional husband',snapshot,0,date).run();
 await (await mf.getR2Bucket('BUCKET')).put('clinic-a/'+patient+'/untouched','fictional attachment');
 const owner=await login('owner'),reader=await login('reader'),reception=await login('reception');
 async function create(username,role){await db.prepare('DELETE FROM clinic_login_attempts').run();return body(await call('/api/staff','POST',{username,displayName:'Fictional '+username,role,clinicalAccess:'write',canExport:true,password:temp,administratorPassword:password},owner),201);}
 const hID=(await create('hormone','hormone_lab')).id,eID=(await create('embryo','embryology_lab')).id;
 const stored=await db.prepare('SELECT * FROM clinic_staff WHERE id=?').bind(hID).first();assert.equal(stored.role,'nurse');assert.equal(stored.clinical_access,'none');assert.equal(stored.can_export,0);assert.equal(stored.lab_department,'hormonal');
 let hormone=await login('hormone',temp),embryo=await login('embryo',temp);
 await expect(await call('/api/lab?department=hormonal','GET',undefined,hormone),403);
 async function change(cookie){await db.prepare('DELETE FROM clinic_login_attempts').run();const r=await expect(await call('/api/account/password','POST',{currentPassword:temp,password},cookie),200);return r.headers.get('set-cookie').split(';')[0];}
 hormone=await change(hormone);embryo=await change(embryo);
 for(const cookie of [hormone,embryo]){
  for(const path of ['/api/patients','/api/patients/'+patient,'/api/backup','/api/staff','/api/appointments','/record/'+patient+'/index.html'])await expect(await call(path,'GET',undefined,cookie),403);
  await expect(await call('/api/patients/'+patient,'PUT',{revision:0,values:{}},cookie),403);
  await expect(await call('/lab','GET',undefined,cookie),200);
  assert.match((await call('/','GET',undefined,cookie)).headers.get('location'),/\/lab$/);
 }
 const list=await body(await call('/api/staff','GET',undefined,owner));assert.equal(list.users.find(x=>x.id===hID).role,'hormone_lab');
 const hbase='/api/lab/'+patient+'?department=hormonal',ebase='/api/lab/'+patient+'?department=embryology';
 await expect(await call(ebase,'GET',undefined,hormone),403);await expect(await call(hbase,'GET',undefined,embryo),403);await expect(await call(hbase,'GET',undefined,reception),403);
 await expect(await call('/api/lab/'+foreign+'?department=hormonal','GET',undefined,hormone),404);
 const queue=await body(await call('/api/lab?department=hormonal&q=Fictional','GET',undefined,hormone));assert.equal(queue.items.length,1);assert(!JSON.stringify(queue).includes('SECRET'));assert.equal((await body(await call('/api/lab?department=embryology','GET',undefined,embryo))).items[0].total,1);
 let h=await body(await call(hbase,'GET',undefined,hormone));assert.equal(h.requests.length,3);assert(!JSON.stringify(h).includes('SECRET'));assert(!('cycles'in h));
 let e=await body(await call(ebase,'GET',undefined,embryo));assert(!JSON.stringify(e).includes('SECRET'));assert(!('requests'in e));assert.equal(e.cycles.length,1);
 await expect(await call(hbase,'POST',{revision:h.revision},reader),403);
 const result={result:'125',units:'pg/mL',range:'Laboratory range',resultDate:date,resultTime:'10:30'},patches=[{visitId:'V1',orderId:'E2',values:result}];
 await expect(await call(hbase,'POST',{revision:0,action:'hormone-submit',patches},hormone),400);
 await expect(await call(hbase,'POST',{revision:0,action:'hormone-draft',patches},hormone,{Origin:'https://evil.example'}),403);
 await expect(await call(hbase,'POST',{revision:0,action:'hormone-draft',patches:[{visitId:'V1',orderId:'CBC',values:result}]},hormone),400);
 h=await body(await call(hbase,'POST',{revision:0,action:'hormone-draft',patches},hormone));assert.equal(h.requests[0].draft.result,'125');assert.equal(h.requests[0].status,'Pending');assert.equal(h.requests[0].result,'');
 await expect(await call(hbase,'POST',{revision:0,action:'hormone-submit',patches},hormone),409);
 h=await body(await call(hbase,'POST',{revision:h.revision,action:'hormone-submit',patches},hormone));assert.equal(h.requests[0].status,'Completed');assert.equal(h.requests[0].draft,null);
 const submittedQueue=await body(await call('/api/lab?department=hormonal&bucket=Submitted','GET',undefined,hormone));assert.equal(submittedQueue.items.length,1);assert.equal(submittedQueue.items[0].total,1);assert.equal(submittedQueue.items[0].pending,0);await expect(await call('/api/lab?department=hormonal&bucket=invalid','GET',undefined,hormone),400);
 let full=await body(await call('/api/patients/'+patient,'GET',undefined,owner));assert.equal(JSON.parse(full.values['hamdan-couple-encounters-v1'])[0].orders[0].result,'125');assert.equal(JSON.parse(full.values['hamdan-couple-encounters-v1'])[0].orders[2].result,'SECRET CBC');
 async function save(action,extra={},status=200){const current=await body(await call(ebase,'GET',undefined,embryo));return body(await call(ebase,'POST',{revision:current.revision,cycleId:c.id,action,...extra},embryo),status);}
 e=await save('semen-preparation',{values:{at:date+'T09:00',source:'Ejaculate',preparation:'Swim up',sampleNumber:'1',volume:'0.7',concentration:'42',motility:'55',normalForms:'4',abnormalForms:'96',embryologist:'Fictional performing embryologist',witness:'Fictional witness',comments:'Fictional preparation'}});assert.equal(e.cycles[0].semenPreparation.embryologist,'Fictional performing embryologist');assert.equal(e.cycles[0].semenPreparation.submittedBy,'Fictional embryo');
 e=await save('icsi',{values:{at:date+'T10:00',method:'ICSI',source:'Ejaculated fresh',preparation:'Fictional prep',injected:'4',inseminated:'0',notes:'Lab only'}});assert.equal(e.cycles[0].lab.embryos.length,4);
 await save('icsi',{values:{at:date+'T10:00',method:'ICSI',source:'Ejaculated fresh',preparation:'Fictional prep',injected:'5',inseminated:'0'}},400);
 await save('culture',{day:'1',values:{at:'2026-10-11T09:00',entries:{E01:{pn:'2PN'},E02:{pn:'2PN'},E03:{pn:'0PN'},E04:{pn:'2PN'}}}});
 await save('culture',{day:'3',values:{at:'2026-10-13T09:00',entries:{E01:{stage:'Cleavage',grade:'G1'},E02:{stage:'Cleavage',grade:'G2'},E04:{stage:'Arrested',grade:'G3'}}}});
 const cryo={embryoIds:['E02'],grades:{E02:'G2'},values:{at:'2026-10-13T10:00',day:'3',device:'FICTIONAL-STRAW',storage:'Tank A / Canister 1 / Position 1',method:'Fictional method'}};
 await save('cryo-submit',cryo,400);e=await save('cryo-draft',cryo);assert(e.cycles[0].drafts.cryo);assert(!e.cycles[0].lab.allocations.E02);
 e=await save('cryo-submit',cryo);assert.equal(e.cycles[0].lab.allocations.E02.kind,'Frozen');assert(!e.cycles[0].drafts.cryo);
 const et={embryoIds:['E01'],details:{E01:{stage:'Cleavage',grade:'G1'}},values:{at:'2026-10-13T11:00',doctor:'Fictional doctor',notes:'Fictional ET'}};
 await save('et-submit',et,400);await save('et-draft',et);e=await save('et-submit',et);assert.equal(e.cycles[0].transfer.status,'Completed');assert.equal(e.cycles[0].lab.allocations.E01.kind,'Fresh ET');
 await save('cryo-draft',{...cryo,embryoIds:['E01'],grades:{E01:'G1'}},400);
 await save('et-draft',et,400);
 await save('cryo-draft',{...cryo,values:{...cryo.values,storage:'Different location'}},400);await save('cryo-submit',{...cryo,values:{...cryo.values,storage:'Different location'}},400);
 full=await body(await call('/api/patients/'+patient,'GET',undefined,owner));const current=JSON.parse(full.values['hamdan-linked-care-v1'])[0];assert.equal(current.freshTransfer.regimens[0].drug,'SECRET MEDICINE');assert.equal(current.oiVisits.SECRET.comment,'SECRET SCAN');assert.equal(current.embryology.allocations.E02.storage,cryo.values.storage);assert.equal(JSON.parse(full.values['SECRET-KEY']).keep,'SECRET KEY');assert.equal(JSON.parse((await db.prepare('SELECT snapshot FROM patients WHERE id=?').bind(patient).first()).snapshot).attachment.json.__attachment,'untouched');
 const beforeForeign=await db.prepare('SELECT snapshot,revision FROM patients WHERE id=?').bind(foreign).first();assert.equal(beforeForeign.snapshot,snapshot);assert.equal(beforeForeign.revision,0);
 const count=await db.prepare("SELECT COUNT(*) AS n FROM clinic_audit WHERE action LIKE 'lab-%'").first();assert(count.n>=8);
 await db.prepare('DELETE FROM clinic_login_attempts').run();await expect(await call('/api/staff/'+hID,'PATCH',{action:'update',displayName:'Fictional hormone',role:'nurse',clinicalAccess:'read',canExport:false,active:true,administratorPassword:password},owner),200);await expect(await call(hbase,'GET',undefined,hormone),401);assert.equal((await db.prepare('SELECT lab_department FROM clinic_staff WHERE id=?').bind(hID).first()).lab_department,'');
 console.log('PASS hormonal / embryology roles, forced password change, route isolation, patient ownership, minimal projections, CSRF, draft submission, revision conflicts, shared results, ICSI / culture, ET / cryo exclusivity and locks, audit trail, migration preservation and role conversion. Fictional data only.');
}finally{await mf.dispose();}
