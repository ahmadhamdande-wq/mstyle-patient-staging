import {database} from '../../../../db/raw';
import {laboratoryUser} from '../../../../lib/lab-api';
import {labProjection,applyLabAction} from '../../../../lib/lab-records';
import {json,sameOrigin} from '../../../../lib/account-security';
import {validId} from '../../../../lib/records';
export async function GET(req:Request,{params}:any){const auth=await laboratoryUser(req);if(!auth)return json({error:'Laboratory access denied.'},403);const {id}=await params;if(!validId(id))return json({error:'Not found.'},404);const row=await database().prepare('SELECT * FROM patients WHERE id=? AND owner=?').bind(id,auth.user.userId).first<any>();if(!row)return json({error:'Not found.'},404);return json(labProjection(row,auth.department));}
export async function POST(req:Request,{params}:any){
 if(!sameOrigin(req))return json({error:'Invalid origin.'},403);const auth=await laboratoryUser(req,true);if(!auth)return json({error:'Laboratory access denied.'},403);
 const {id}=await params;if(!validId(id))return json({error:'Not found.'},404);const raw=await req.text();if(raw.length>100000)return json({error:'Entry too large.'},413);let b:any;try{b=JSON.parse(raw);}catch{return json({error:'Invalid entry.'},400);}if(!Number.isInteger(b?.revision))return json({error:'Refresh this record before saving.'},400);
 const db=database(),row=await db.prepare('SELECT * FROM patients WHERE id=? AND owner=?').bind(id,auth.user.userId).first<any>();if(!row)return json({error:'Not found.'},404);if(row.revision!==b.revision)return json({error:'This patient changed in another window. Your entry has not been saved. Refresh and review before retrying.'},409);
 let snapshot:string;try{snapshot=applyLabAction(row.snapshot,auth.department,b,{staffId:auth.user.staffId,name:auth.user.displayName});}catch(e){return json({error:(e as Error).message},400);}
 const now=new Date().toISOString(),auditId=crypto.randomUUID();
 const result=await db.batch([
 db.prepare('INSERT INTO revisions(id,patient,owner,revision,snapshot,created) SELECT ?,id,owner,revision,snapshot,? FROM patients WHERE id=? AND owner=? AND revision=?').bind(crypto.randomUUID(),now,id,auth.user.userId,b.revision),
 db.prepare('UPDATE patients SET snapshot=?,revision=revision+1,updated=? WHERE id=? AND owner=? AND revision=?').bind(snapshot,now,id,auth.user.userId,b.revision),
 db.prepare('INSERT INTO clinic_audit(id,staff_id,owner,action,created) SELECT ?,?,?,?,? FROM patients WHERE id=? AND owner=? AND revision=? AND updated=?').bind(auditId,auth.user.staffId,auth.user.userId,'lab-'+auth.department+':'+b.action+':'+id,now,id,auth.user.userId,b.revision+1,now)]);
 if(result[1].meta.changes!==1)return json({error:'Concurrent change. Refresh and review your entry.'},409);
 return json(labProjection({...row,snapshot,revision:b.revision+1,updated:now},auth.department));
}
