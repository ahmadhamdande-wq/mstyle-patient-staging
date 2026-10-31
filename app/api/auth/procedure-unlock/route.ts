import {getChatGPTUser} from '../../../chatgpt-auth';
import {database} from '../../../../db/raw';
import {record,validId} from '../../../../lib/records';
import {digest,passwordHash,equal} from '../../../../lib/session-crypto';
import {procedureApprover,procedureProof} from '../../../../lib/procedure-security';
export async function POST(req:Request){
 const noStore={'Cache-Control':'no-store'};if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid origin'},{status:403,headers:noStore});
 const u=await getChatGPTUser();if(!u)return Response.json({error:'Sign in required'},{status:401,headers:noStore});const db=database(),staff=await db.prepare('SELECT * FROM clinic_staff WHERE id=? AND active=1').bind(u.staffId).first<any>();
 if(!staff||!await procedureApprover(db,staff))return Response.json({error:'The clinic owner or an administrator must sign in to correct submitted procedures.'},{status:403,headers:noStore});
 const b:any=await req.json().catch(()=>null);if(!b||typeof b.password!=='string'||b.password.length>256||!validId(b.patient)||typeof b.cycleId!=='string'||b.cycleId.length>200||!['et','cryo'].includes(b.kind))return Response.json({error:'Invalid request'},{status:400,headers:noStore});
 if(!await record(b.patient,u.userId))return Response.json({error:'Patient not found'},{status:404,headers:noStore});
 const now=Date.now();for(const raw of ['procedure-user:'+u.staffId,'procedure-ip:'+(req.headers.get('cf-connecting-ip')||'local')]){const key=await digest(raw);await db.prepare('INSERT INTO clinic_login_attempts(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<? THEN 1 ELSE count+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END').bind(key,now+900000,now,now).run();const attempts=await db.prepare('SELECT count FROM clinic_login_attempts WHERE key=?').bind(key).first<any>();if(attempts.count>10)return Response.json({error:'Too many attempts. Try again in 15 minutes.'},{status:429,headers:noStore});}
 if(!equal(await passwordHash(b.password,staff.salt),staff.password_hash))return Response.json({error:'Incorrect administrator password.'},{status:401,headers:noStore});
 const session=await digest(req.headers.get('cookie')||'');const proof=await procedureProof(staff.password_hash,{patient:b.patient,cycleId:b.cycleId,kind:b.kind,staffId:u.staffId,session,exp:now+600000});await db.prepare('INSERT INTO clinic_audit VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),u.staffId,u.userId,'procedure-unlock:'+b.kind+':'+b.patient+':'+b.cycleId,new Date().toISOString()).run();
 return Response.json({proof},{headers:noStore});
}
