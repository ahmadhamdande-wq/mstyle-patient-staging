import {database} from '../../../../db/raw';
import {digest,passwordHash,equal,token,SESSION_SECONDS} from '../../../../lib/session-crypto';
export async function POST(req:Request){
 const url=new URL(req.url);if(req.headers.get('origin')!==url.origin)return Response.json({error:'Invalid origin'},{status:403});
 const b:any=await req.json().catch(()=>null);if(!b||typeof b.username!=='string'||typeof b.password!=='string'||b.password.length>256)return Response.json({error:'Invalid login'},{status:400});
 const username=b.username.trim().toLowerCase();const db=database(),now=Date.now();
 // IP is supplied by Cloudflare, never by a form field. Apply both account and address limits.
 const keys=await Promise.all(['user:'+username,'ip:'+(req.headers.get('cf-connecting-ip')||'local')].map(digest));
 for(const key of keys){await db.prepare('INSERT INTO clinic_login_attempts(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<? THEN 1 ELSE count+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END').bind(key,now+900000,now,now).run();const row=await db.prepare('SELECT count FROM clinic_login_attempts WHERE key=?').bind(key).first<any>();if(row.count>10)return Response.json({error:'Too many attempts. Try again in 15 minutes.'},{status:429});}
 const staff=await db.prepare('SELECT * FROM clinic_staff WHERE username=? AND active=1').bind(username).first<any>();
 const computed=await passwordHash(b.password,staff?.salt||'00000000000000000000000000000000');
 if(!staff||!equal(computed,staff.password_hash))return Response.json({error:'Incorrect username or password'},{status:401});
 const raw=token();await db.prepare('DELETE FROM clinic_sessions WHERE expires<?').bind(now).run();const inserted=await db.prepare('INSERT INTO clinic_sessions(token_hash,staff_id,expires,auth_version) SELECT ?,id,?,auth_version FROM clinic_staff WHERE id=? AND active=1 AND password_hash=?').bind(await digest(raw),now+SESSION_SECONDS*1000,staff.id,staff.password_hash).run();
 if(!inserted.meta.changes)return Response.json({error:'Account changed. Sign in again.'},{status:409});
 await db.prepare('INSERT INTO clinic_audit VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),staff.id,staff.owner,'login',new Date().toISOString()).run();
 return Response.json({ok:true,mustChangePassword:!!staff.must_change_password},{headers:{'Set-Cookie':`__Host-mstyle=${raw}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`,'Cache-Control':'no-store'}});
}

