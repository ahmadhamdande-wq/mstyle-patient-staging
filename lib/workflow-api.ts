import {database} from '../db/raw';
export async function saveWorkflow(row:any,snapshot:string,staff:any,action:string){
 if(snapshot.length>1800000)throw Error('Record too large.');
 const db=database(),now=new Date().toISOString();const r=await db.batch([
 db.prepare('INSERT INTO revisions(id,patient,owner,revision,snapshot,created) SELECT ?,id,owner,revision,snapshot,? FROM patients WHERE id=? AND owner=? AND revision=?').bind(crypto.randomUUID(),now,row.id,staff.userId,row.revision),
 db.prepare('UPDATE patients SET snapshot=?,revision=revision+1,updated=? WHERE id=? AND owner=? AND revision=?').bind(snapshot,now,row.id,staff.userId,row.revision),
 db.prepare('INSERT INTO clinic_audit(id,staff_id,owner,action,created) SELECT ?,?,?,?,? FROM patients WHERE id=? AND owner=? AND revision=? AND updated=?').bind(crypto.randomUUID(),staff.staffId,staff.userId,action+':'+row.id,now,row.id,staff.userId,row.revision+1,now)]);
 return r[1].meta.changes===1;
}
