import {labBuckets,taskBucket,type LabBucket} from '../../../lib/hormonal-tasks';
import {database} from '../../../db/raw';
import {laboratoryUser} from '../../../lib/lab-api';
import {labProjection} from '../../../lib/lab-records';
import {json} from '../../../lib/account-security';
export async function GET(req:Request){
 const auth=await laboratoryUser(req);if(!auth)return json({error:'Laboratory access denied.'},403);
 const url=new URL(req.url),query=(url.searchParams.get('q')||'').trim().slice(0,150),offset=Number(url.searchParams.get('offset')||0);
 if(!Number.isInteger(offset)||offset<0||offset>100000)return json({error:'Invalid page.'},400);
 const bucket=url.searchParams.get('bucket');if(bucket&&!labBuckets.includes(bucket as LabBucket))return json({error:'Unknown task list.'},400);
 const term='%'+query.replace(/[\\%_]/g,'\\$&')+'%';
 const rows=await database().prepare("SELECT id,name,dob,husband,snapshot,revision,updated FROM patients WHERE owner=? AND (name LIKE ? ESCAPE '\\' OR husband LIKE ? ESCAPE '\\' OR id=?) ORDER BY updated DESC,id LIMIT 20 OFFSET ?").bind(auth.user.userId,term,term,query,offset).all<any>();
 const items=rows.results.map(row=>{const p:any=labProjection(row,auth.department);const requests=auth.department==='hormonal'?p.requests.filter((r:any)=>!bucket||taskBucket(r)===bucket):[];return {id:p.id,name:p.name,husband:p.husband,fileNumber:p.fileNumber,updated:p.updated,pending:auth.department==='hormonal'?requests.filter((r:any)=>r.status!=='Cancelled'&&(r.status!=='Completed'||r.draft)).length:p.cycles.filter((c:any)=>c.transfer.status!=='Completed'||Object.keys(c.drafts).length).length,total:auth.department==='hormonal'?requests.length:p.cycles.length};}).filter(x=>x.total>0);
 return json({department:auth.department,items,nextOffset:rows.results.length===20?offset+20:null});
}
