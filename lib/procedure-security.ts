import {equal,hex} from './session-crypto';
export type ProcedureScope={cycleId:string;kind:'et'|'cryo'};
const parse=(s:string|undefined,f:any)=>{try{return JSON.parse(s||'null')||f}catch{return f}};
const same=(a:any,b:any)=>JSON.stringify(a)===JSON.stringify(b);
export function procedureScopes(before:Record<string,string>,after:Record<string,string>):ProcedureScope[]{
 const old=parse(before['hamdan-linked-care-v1'],[]),next=parse(after['hamdan-linked-care-v1'],[]),out:ProcedureScope[]=[];
 for(const c of old){const n=next.find((x:any)=>x.id===c.id);const t=c.type==='cycle'?c.freshTransfer?.transfer:c.transfer,nt=n?.type==='cycle'?n.freshTransfer?.transfer:n?.transfer;
 const oldAlloc=c.embryology?.allocations||{};const changedETAllocation=Object.entries(oldAlloc).some(([id,a]:any)=>a.kind==='Fresh ET'&&!same(a,n?.embryology?.allocations?.[id]));if(((t?.status==='Completed'||t?.reviewState==='Submitted')&&!same(t,nt))||changedETAllocation)out.push({cycleId:c.id,kind:'et'});
 const allocations=c.embryology?.allocations||{};if(Object.entries(allocations).some(([id,a]:any)=>a.kind==='Frozen'&&!same(a,n?.embryology?.allocations?.[id])))out.push({cycleId:c.id,kind:'cryo'});
 }return out;
}
export function assertProcedureIntegrity(before:Record<string,string>,after:Record<string,string>){
 const old=parse(before['hamdan-linked-care-v1'],[]),next=parse(after['hamdan-linked-care-v1'],[]);
 for(const c of next){if(c.type!=='cycle')continue;const t=c.freshTransfer?.transfer,alloc=c.embryology?.allocations||{},prior=old.find((x:any)=>x.id===c.id),priorT=prior?.freshTransfer?.transfer;
 const frozen=Object.entries(alloc).filter(([,a]:any)=>a.kind==='Frozen'&&a.status!=='Voided');
 const linked=t?.embryoIds||[],unlinked=t?.status==='Completed'&&Number(t.embryos||0)>linked.length;
 for(const [id,a] of frozen){const priorA=prior?.embryology?.allocations?.[id],changed=!same(a,priorA);if(!changed&&same(t,priorT))continue;
 if(linked.includes(id)||unlinked)throw Error('An embryo selected or recorded for ET cannot also be frozen. Correct the transfer IDs or the erroneous cryo record first.');
 const used=next.some((x:any)=>x.type==='fet'&&x.transfer?.status==='Completed'&&(x.transfer.embryoRefs||[]).some((r:any)=>r.cycleId===c.id&&r.embryoId===id));
 if(used&&(!priorA||priorA.status==='Voided'))throw Error('A transferred FET embryo cannot be frozen again.');
 }
 }
}
const enc=new TextEncoder();async function signature(payload:string,key:string){const k=await crypto.subtle.importKey('raw',enc.encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(new Uint8Array(await crypto.subtle.sign('HMAC',k,enc.encode(payload))));}
export async function procedureProof(key:string,data:any){const payload=btoa(JSON.stringify(data));return payload+'.'+await signature(payload,key);}
export async function verifyProcedureProof(proof:string,key:string,expected:any){try{const [payload,sig,...rest]=proof.split('.');if(rest.length||!equal(sig||'',await signature(payload,key)))return false;const d=JSON.parse(atob(payload));return d.exp>Date.now()&&d.exp<=Date.now()+601000&&Object.entries(expected).every(([k,v])=>d[k]===v);}catch{return false;}}
export async function procedureApprover(db:D1Database,staff:any){return staff.role==='admin'||staff.is_owner===1;}

