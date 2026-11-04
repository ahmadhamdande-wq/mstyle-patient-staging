import {database,bucket} from '../db/raw';
export function validId(id:string){return /^[a-f0-9-]{36}$/.test(id);}
export async function record(id:string,owner:string){return database().prepare('SELECT * FROM patients WHERE id=? AND owner=?').bind(id,owner).first<any>();}
// Static assets need the same ownership check, but never the clinical snapshot.
export async function recordExists(id:string,owner:string){return !!await database().prepare('SELECT id FROM patients WHERE id=? AND owner=?').bind(id,owner).first<{id:string}>();}
export async function encodeSnapshot(values:Record<string,string>,owner:string,patient:string){
 async function walk(v:any):Promise<any>{
  if(typeof v==='string'&&/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,/.test(v)){
   const [head,body]=v.split(',');if(body.length>1500000)throw new Error('Attachment exceeds 1 MB');const mime=head.slice(5).split(';')[0];const bytes=Uint8Array.from(atob(body),c=>c.charCodeAt(0));const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');const key=owner+'/'+patient+'/'+hash;await bucket().put(key,bytes,{httpMetadata:{contentType:mime}});return {__attachment:hash,mime};
  }if(Array.isArray(v))return Promise.all(v.map(walk));if(v&&typeof v==='object'){const out:any={};for(const [k,x]of Object.entries(v))out[k]=await walk(x);return out;}return v;
 }
 const out:Record<string,any>={};for(const [k,v]of Object.entries(values)){try{out[k]={json:await walk(JSON.parse(v))};}catch(e){if(v.startsWith('{')||v.startsWith('['))throw e;out[k]={raw:v};}}return JSON.stringify(out);
}
export async function decodeSnapshot(snapshot:string,owner:string,patient:string){
 const attachmentReads=new Map<string,Promise<string>>();
 async function attachment(hash:string,mime:string){const key=hash+':'+mime;let pending=attachmentReads.get(key);if(!pending){pending=(async()=>{const file=await bucket().get(owner+'/'+patient+'/'+hash);if(!file)throw new Error('An attachment is unavailable');const bytes=new Uint8Array(await file.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return 'data:'+mime+';base64,'+btoa(s);})();attachmentReads.set(key,pending);}return pending;}
 async function walk(v:any):Promise<any>{if(v&&typeof v==='object'&&v.__attachment)return attachment(v.__attachment,v.mime);if(Array.isArray(v))return Promise.all(v.map(walk));if(v&&typeof v==='object'){const out:any={};for(const [k,x]of Object.entries(v))out[k]=await walk(x);return out;}return v;}
 const result:Record<string,string>={};for(const [k,v]of Object.entries(JSON.parse(snapshot)) as [string,any][])result[k]=v.raw!==undefined?v.raw:JSON.stringify(await walk(v.json));return result;
}
export function seed(name:string,dob:string,husband:string,husbandDOB:string){const day=new Date().toISOString().slice(0,10);const profile={name,dob,date:day,marriage:'',previous:'Not recorded',previousDetails:'',complaint:'Not recorded',complaintDetails:'',infertilityType:'Not recorded',infertilityDuration:''};const hp={name:husband,dob:husbandDOB,date:day,marriage:'',previous:'Not recorded',previousDetails:'',complaint:'Not recorded',complaintDetails:'',type:'Not recorded',infDuration:''};return {
 'profile-wife':JSON.stringify(profile),'profile-husband':JSON.stringify(hp),
 'ivf-medical-history-demo-001-v1':JSON.stringify({data:{profile,ob:{Gravida:'',Para:'',Miscarriages:'','Ectopic pregnancies':'','Living boys':'','Living girls':'','Youngest child age (years)':'',Stillbirths:'','Preterm deliveries':'Not recorded'},family:{'Family multiple pregnancy':'Not recorded','Congenital anomalies':'Not recorded'}},pregnancies:[],labs:[],events:{fertility:[],procedure:[]},children:[]}),
 'hamdan-husband-demo-m001-v1':JSON.stringify({data:{profile:hp},semen:[]})};}

