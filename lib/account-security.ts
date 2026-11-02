import {digest,passwordHash,equal,token,SESSION_SECONDS} from './session-crypto';
import {clinicalAccess,managesUsers} from './access-policy';
export const noStore={'Cache-Control':'no-store'};
export const json=(value:any,status=200)=>Response.json(value,{status,headers:noStore});
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
export async function limited(db:D1Database,req:Request,scope:string,identity:string,maximum=10){
 const now=Date.now();for(const raw of [scope+':user:'+identity,scope+':ip:'+(req.headers.get('cf-connecting-ip')||'local')]){
 const key=await digest(raw);await db.prepare('INSERT INTO clinic_login_attempts(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<? THEN 1 ELSE count+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END').bind(key,now+900000,now,now).run();
 const row=await db.prepare('SELECT count FROM clinic_login_attempts WHERE key=?').bind(key).first<any>();if(row.count>maximum)return true;
 }return false;
}
export function passwordError(value:any){return typeof value!=='string'||value.length<14||value.length>256?'Use a password or passphrase of 14–256 characters.':'';}
export async function passwordValues(password:string){const salt=token();return {salt,hash:await passwordHash(password,salt)};}
export async function verifiesPassword(row:any,password:any){return typeof password==='string'&&password.length<=256&&equal(await passwordHash(password,row.salt),row.password_hash);}
export function publicStaff(row:any){return {id:row.id,username:row.username,displayName:row.display_name||row.username,role:row.role,active:!!row.active,isOwner:row.is_owner===1,clinicalAccess:clinicalAccess(row),canExport:!!row.can_export||row.is_owner===1||row.role==='admin',mustChangePassword:!!row.must_change_password,created:row.created};}
export function audit(db:D1Database,actor:string,owner:string,action:string){return db.prepare('INSERT INTO clinic_audit(id,staff_id,owner,action,created) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),actor,owner,action,new Date().toISOString());}
export async function administrator(db:D1Database,user:any,req:Request,body:any){
 if(!managesUsers(user))return json({error:'Administrator access required.'},403);
 if(await limited(db,req,'staff-change',user.staffId))return json({error:'Too many attempts. Try again in 15 minutes.'},429);
 const row=await db.prepare('SELECT * FROM clinic_staff WHERE id=? AND owner=? AND active=1').bind(user.staffId,user.userId).first<any>();
 if(!row||!await verifiesPassword(row,body?.administratorPassword))return json({error:'Enter your current administrator password to confirm this change.'},401);
 return null;
}
export function sessionCookie(raw:string){return `__Host-mstyle=${raw}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;}
