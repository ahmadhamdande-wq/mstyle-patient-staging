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
 const raw=token();await db.prepare('DELETE FROM clinic_sessions WHERE expires<?').bind(now).run();await db.prepare('INSERT INTO clinic_sessions(token_hash,staff_id,expires) VALUES(?,?,?)').bind(await digest(raw),staff.id,now+SESSION_SECONDS*1000).run();
 await db.prepare('INSERT INTO clinic_audit VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),staff.id,staff.owner,'login',new Date().toISOString()).run();
 return Response.json({ok:true},{headers:{'Set-Cookie':`__Host-mstyle=${raw}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`,'Cache-Control':'no-store'}});
}
