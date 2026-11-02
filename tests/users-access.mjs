import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const require=createRequire(import.meta.url);
const {Miniflare}=await import(require.resolve('miniflare',{paths:[dirname(require.resolve('wrangler/package.json'))]}));
const files=fs.readdirSync('dist/server',{recursive:true}).filter(p=>/\.m?js$/.test(p)).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:0);
const mf=new Miniflare({name:'users-access-test',modules:files.map(p=>({type:'ESModule',path:'dist/server/'+p})),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'fictional-users-test'},r2Buckets:{BUCKET:'fictional-users-test'}});
const password='Fictional owner passphrase 2026',temp='Fictional temporary password',chosen='Fictional chosen passphrase 2026',recovered='Fictional recovered passphrase';
const salt='fictional-test-salt';
async function hash(p){const k=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(p),'PBKDF2',false,['deriveBits']);return Buffer.from(await webcrypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},k,256)).toString('hex');}
let db;
const call=(path,method='GET',body,cookie='',headers={})=>mf.dispatchFetch('https://clinic.example'+path,{method,redirect:'manual',headers:{Origin:'https://clinic.example','Content-Type':'application/json','X-Clinic-Request':'1',Cookie:cookie,...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
async function expect(res,status){assert.equal(res.status,status,await res.clone().text());return res;}
async function login(username,p=password){const r=await expect(await call('/api/auth/login','POST',{username,password:p}),200);assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);return r.headers.get('set-cookie').split(';')[0];}
const json=async r=>await r.json();
async function clearLimits(){await db.prepare('DELETE FROM clinic_login_attempts').run();}
try{
 db=await mf.getD1Database('DB');
 async function migrate(file){for(const sql of fs.readFileSync('drizzle/'+file,'utf8').replaceAll('--> statement-breakpoint','').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();}
 await migrate('0000_shallow_carmella_unuscione.sql');await migrate('0001_independent_login.sql');
 const h=await hash(password);
 for(const [id,owner,username,role]of [['owner','mstyle-hamdan','dr.ahmad','doctor'],['other','other-clinic','other','doctor'],['existing','mstyle-hamdan','existing.doctor','doctor']])await db.prepare('INSERT INTO clinic_staff(id,owner,username,password_hash,salt,role,active,created) VALUES(?,?,?,?,?,?,1,?)').bind(id,owner,username,h,salt,role,'2026-01-01').run();
 await db.prepare('INSERT INTO patients VALUES(?,?,?,?,?,?,?,?)').bind('fictional-preserved','mstyle-hamdan','Fictional pre-migration patient','1990-01-01','','{}',0,'2026-01-01').run();
 await migrate('0002_users_access.sql');
 assert.equal((await db.prepare('SELECT password_hash FROM clinic_staff WHERE id=?').bind('owner').first()).password_hash,h,'Migration preserves owner password');
 assert.equal((await db.prepare('SELECT is_owner FROM clinic_staff WHERE id=?').bind('owner').first()).is_owner,1);
 assert.equal((await db.prepare('SELECT is_owner FROM clinic_staff WHERE id=?').bind('existing').first()).is_owner,0,'Only original owner elevated');
 assert.equal((await db.prepare('SELECT name FROM patients WHERE id=?').bind('fictional-preserved').first()).name,'Fictional pre-migration patient');
 assert.equal((await call('/')).status,303);await expect(await call('/api/staff'),401);
 let owner=await login('dr.ahmad'),other=await login('other');
 for(const path of ['/settings/users','/account/password','/recover'])await expect(await call(path,'GET',undefined,owner),200);
 await expect(await call('/api/staff','POST',{},owner,{Origin:'https://evil.example'}),403);
 await expect(await call('/api/staff','POST',{administratorPassword:'wrong'},owner),401);
 async function create(username,role,clinicalAccess='read',cookie=owner,adminPassword=password){await clearLimits();return call('/api/staff','POST',{username,displayName:'Fictional '+username,role,clinicalAccess,password:temp,administratorPassword:adminPassword,owner:'other-clinic',isOwner:true},cookie);}
 const nurseId=(await json(await expect(await create('nurse.test','nurse'),201))).id;
 const receptionId=(await json(await expect(await create('reception.test','reception','write'),201))).id;
 const adminId=(await json(await expect(await create('admin.test','admin','write'),201))).id;
 const staff=await db.prepare('SELECT * FROM clinic_staff WHERE id=?').bind(nurseId).first();assert.equal(staff.owner,'mstyle-hamdan');assert.equal(staff.is_owner,0);assert.notEqual(staff.password_hash,temp);
 const listed=await json(await call('/api/staff','GET',undefined,owner));assert(!JSON.stringify(listed).includes('password_hash'));assert(!JSON.stringify(listed).includes(h));assert(!listed.users.some(u=>u.id==='other'));
 await expect(await create('nurse.test','nurse'),409);
 let nurse=await login('nurse.test',temp),reception=await login('reception.test',temp),admin=await login('admin.test',temp);
 await expect(await call('/api/patients','GET',undefined,nurse),403);assert.equal((await call('/','GET',undefined,nurse)).headers.get('location'),'https://clinic.example/account/password');
 async function ownChange(cookie){await clearLimits();const r=await expect(await call('/api/account/password','POST',{currentPassword:temp,password:chosen},cookie),200);await expect(await call('/api/account','GET',undefined,cookie),401);return r.headers.get('set-cookie').split(';')[0];}
 nurse=await ownChange(nurse);reception=await ownChange(reception);admin=await ownChange(admin);
 await expect(await call('/api/staff','GET',undefined,nurse),403);await expect(await create('forged','doctor','write',nurse,chosen),403);
 await expect(await call('/api/staff','GET',undefined,other),403);
 const patient=(await json(await expect(await call('/api/patients','POST',{name:'Fictional permission patient',dob:'1991-01-01'},owner),201))).id;
 await expect(await call('/api/patients/'+patient,'GET',undefined,nurse),200);await expect(await call('/api/patients/'+patient,'PUT',{},nurse),403);
 await expect(await call('/api/backup','POST',{password},nurse),403);await expect(await call('/api/patients/'+patient+'/summary','GET',undefined,nurse),403);
 await expect(await call('/record/'+patient+'/index.html','GET',undefined,reception),403);
 const minimal=await json(await call('/api/patients','GET',undefined,reception));assert(!('complaint'in minimal[0]));assert(!('snapshot'in minimal[0]));
 await expect(await call('/api/patients','POST',{name:'Fictional registry only',dob:'1990-01-01',reviewedSourceNotes:'forbidden clinical note'},reception),403);
 await expect(await call('/api/patients','POST',{name:'Fictional registry only',dob:'1990-01-01'},reception),201);
 let snap=await json(await call('/api/patients/'+patient,'GET',undefined,owner));snap.values['clinic-appointments-v1']=JSON.stringify([{id:'A',date:'2026-11-02',time:'09:00',kind:'Clinic',notes:'SECRET CLINICAL NOTE',status:'Scheduled',person:'wife'}]);
 await expect(await call('/api/patients/'+patient,'PUT',{revision:snap.revision,values:snap.values},owner),200);
 const appointments=await json(await call('/api/appointments','GET',undefined,reception));assert(appointments.length);assert(!JSON.stringify(appointments).includes('SECRET'));assert.equal(appointments[0].canOpen,false);
 const home=await (await call('/','GET',undefined,owner)).text();assert.match(home,/Users &amp; Access/);
 const nurseHome=await (await call('/','GET',undefined,nurse)).text();assert(!nurseHome.includes('>Users &amp; Access<'));assert(!nurseHome.includes('href="/backups"'));
 async function patch(id,body,cookie=owner,administratorPassword=password){await clearLimits();return call('/api/staff/'+id,'PATCH',{...body,administratorPassword},cookie);}
 await expect(await patch('owner',{action:'update',active:false}),403);await expect(await patch('other',{action:'sign-out'}),404);
 await expect(await patch('owner',{action:'reset-password',password:temp},admin,chosen),403);
 await expect(await patch(adminId,{action:'sign-out'},admin,chosen),403);
 await expect(await create('forged.admin','admin','write',admin,chosen),400);
 await expect(await patch(nurseId,{action:'update',displayName:'Fictional nurse',role:'nurse',active:true,clinicalAccess:'write',canExport:true}),200);
 await expect(await call('/api/account','GET',undefined,nurse),401);nurse=await login('nurse.test',chosen);
 snap=await json(await call('/api/patients/'+patient,'GET',undefined,nurse));await expect(await call('/api/patients/'+patient,'PUT',{revision:snap.revision,values:snap.values},nurse),200);await expect(await call('/api/patients/'+patient+'/summary','GET',undefined,nurse),200);
 await expect(await patch(nurseId,{action:'update',displayName:'Fictional nurse',role:'nurse',active:true,clinicalAccess:'read',canExport:true}),200);nurse=await login('nurse.test',chosen);
 await expect(await call('/api/backup','POST',{password},nurse),200);await expect(await call('/api/restore','POST',{},nurse),403);await expect(await call('/api/patients/'+patient,'PUT',{},nurse),403);
 await expect(await patch(nurseId,{action:'reset-password',password:temp}),200);await expect(await call('/api/account','GET',undefined,nurse),401);await expect(await call('/api/auth/login','POST',{username:'nurse.test',password:chosen}),401);
 nurse=await login('nurse.test',temp);await expect(await call('/api/patients','GET',undefined,nurse),403);nurse=await ownChange(nurse);
 await expect(await patch(nurseId,{action:'update',displayName:'Fictional nurse',role:'nurse',active:false,clinicalAccess:'none',canExport:false}),200);await expect(await call('/api/account','GET',undefined,nurse),401);await expect(await call('/api/auth/login','POST',{username:'nurse.test',password:chosen}),401);
 await expect(await patch(receptionId,{action:'sign-out'}),200);await expect(await call('/api/account','GET',undefined,reception),401);
 // Codes are random, stored only as hashes, rotated and consumed exactly once.
 await clearLimits();await expect(await call('/api/account/recovery','POST',{currentPassword:chosen},admin),403);
 let codes=(await json(await expect(await call('/api/account/recovery','POST',{currentPassword:password},owner),200))).codes;assert.equal(new Set(codes).size,8);
 const hashes=await db.prepare('SELECT code_hash FROM clinic_recovery_codes').all();assert(!JSON.stringify(hashes).includes(codes[0]));
 const old=codes[0];codes=(await json(await expect(await call('/api/account/recovery','POST',{currentPassword:password},owner),200))).codes;
 await expect(await call('/api/auth/recover','POST',{username:'dr.ahmad',code:old,password:recovered}),400);
 await expect(await call('/api/auth/recover','POST',{username:'existing.doctor',code:codes[0],password:recovered}),400);
 await expect(await call('/api/auth/recover','POST',{username:'dr.ahmad',code:codes[0],password:recovered},'',{Origin:'https://evil.example'}),403);
 await expect(await call('/api/auth/recover','POST',{username:'dr.ahmad',code:codes[0],password:recovered}),200);
 await expect(await call('/api/auth/recover','POST',{username:'dr.ahmad',code:codes[0],password:recovered}),400);
 await expect(await call('/api/account','GET',undefined,owner),401);owner=await login('dr.ahmad',recovered);
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM clinic_recovery_codes WHERE used_at IS NULL').first()).n,7);
 assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM patients').first()).n,3,'User operations preserve patients');
 await clearLimits();for(let i=0;i<10;i++)await call('/api/auth/recover','POST',{username:'dr.ahmad',code:'wrong',password:recovered});await expect(await call('/api/auth/recover','POST',{username:'dr.ahmad',code:codes[1],password:recovered}),429);
 console.log('PASS Users & Access: additive migration, owner protection, reauthentication, tenant isolation, CSRF, role enforcement, first-login change, clinical/export permissions, registration privacy, session revocation, deactivation, code rotation, one-time owner recovery and throttling. Fictional data only.');
}finally{await mf.dispose();}
