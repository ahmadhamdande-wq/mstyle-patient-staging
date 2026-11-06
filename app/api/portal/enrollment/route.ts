import {getChatGPTUser} from '../../../chatgpt-auth';
import {database} from '../../../../db/raw';
import {administrator,json,sameOrigin,audit} from '../../../../lib/account-security';
import {emailAddress,accessEmail} from '../../../../lib/email-access';
import {patientContactCore} from '../../../../lib/patient-contact';
import {managesUsers} from '../../../../lib/access-policy';

async function context(req:Request){
 const user=await getChatGPTUser();
 if(!user)return {error:json({error:'Sign in required.'},401)} as const;
 if(!managesUsers(user))return {error:json({error:'Administrator access required.'},403)} as const;
 const id=new URL(req.url).searchParams.get('patientId')||'';
 if(!/^[a-f0-9-]{36}$/i.test(id))return {error:json({error:'Invalid patient ID.'},400)} as const;
 const db=database();
 const patient=await db.prepare('SELECT id,name,snapshot FROM patients WHERE id=? AND owner=?').bind(id,user.userId).first<any>();
 if(!patient)return {error:json({error:'Patient not found.'},404)} as const;
 const snapshot=JSON.parse(patient.snapshot);
 const profile=patientContactCore().profile(snapshot);
 const email=patientContactCore().contact(profile,id).email.trim().toLowerCase();
 return {db,user,patient,email};
}
export async function GET(req:Request){
 const c=await context(req);if('error'in c)return c.error;
 const account=await c.db.prepare('SELECT id,email,active,verified FROM clinic_portal_accounts WHERE owner=? AND patient_id=?').bind(c.user.userId,c.patient.id).first<any>();
 return json({patientName:c.patient.name,contactEmail:c.email,registeredEmail:account?.email||'',registered:!!account,active:!!account?.active,verified:!!account?.verified});
}
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Invalid origin.'},403);
 const c=await context(req);if('error'in c)return c.error;
 const body:any=await req.json().catch(()=>null);
 const denied=await administrator(c.db,c.user,req,body);if(denied)return denied;
 if(!emailAddress(c.email))return json({error:'Save a valid email in patient contact information first.'},400);
 const existing=await c.db.prepare('SELECT * FROM clinic_portal_accounts WHERE owner=? AND patient_id=?').bind(c.user.userId,c.patient.id).first<any>();
 const other=await c.db.prepare('SELECT id FROM clinic_portal_accounts WHERE email=? AND (owner<>? OR patient_id<>?)').bind(c.email,c.user.userId,c.patient.id).first<any>();
 if(other)return json({error:'This email is already registered to another patient.'},409);
 if(existing&&existing.email!==c.email)return json({error:'Existing portal email differs. Email changes require a separate verified workflow.'},409);
 if(!existing){
  const id=crypto.randomUUID();
  await c.db.prepare('INSERT INTO clinic_portal_accounts(id,owner,patient_id,email,active,verified,auth_version,created) VALUES(?,?,?,?,1,0,1,?)').bind(id,c.user.userId,c.patient.id,c.email,new Date().toISOString()).run();
 }
 const account=await c.db.prepare('SELECT * FROM clinic_portal_accounts WHERE owner=? AND patient_id=?').bind(c.user.userId,c.patient.id).first<any>();
 if(!account?.active)return json({error:'Patient portal access is disabled.'},403);
 try{await accessEmail(c.db,req,'portal-password',account,c.email,account.auth_version);}
 catch{return json({error:'Portal account saved, but invitation email failed. Check email configuration and retry.'},502);}
 await audit(c.db,c.user.staffId,c.user.userId,'portal-invitation:'+c.patient.id).run();
 return json({ok:true,message:'Invitation sent. Check the patient email inbox.'});
}
