import {taskTiming,taskStatus,taskBucket} from './hormonal-tasks';
import {hormone,syncHormone} from './clinic-workflow';
import {embryo,fresh} from './lab-embryology.mjs';
import {assertProcedureIntegrity,procedureScopes} from './procedure-security';
export type Department='hormonal'|'embryology';
const VISITS='hamdan-couple-encounters-v1',CARE='hamdan-linked-care-v1';
const hormones=['FSH','LH','E2','Progesterone (P4)','AMH','TSH','T3','T4','Free T4','Free T3','Prolactin','Testosterone','Free testosterone','DHEA-S','Androstenedione','17-OH progesterone','Cortisol','Insulin','β-hCG'];
const isHormone=(o:any)=>o.category==='hormonal'||hormones.includes(o.name);
const pick=(v:any,keys:string[])=>Object.fromEntries(keys.map(k=>[k,v?.[k]??'']));
const list=(x:any)=>Array.isArray(x)?x:[];
const resultKeys=['result','units','range','resultDate','resultTime'];
const text=(v:any,max=2000)=>{if(v==null)return '';if(typeof v!=='string'||v.length>max)throw Error('Invalid or overlong laboratory field.');return v.trim();};
const date=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
export function todayBaghdad(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function parsedSnapshot(snapshot:string){return JSON.parse(snapshot);}
export function labProjection(row:any,department:Department){
 const s=parsedSnapshot(row.snapshot),visits=list(s[VISITS]?.json),care=list(s[CARE]?.json);
 const wife=s['profile-wife']?.json||{},husband=s['profile-husband']?.json||{};
 const identity={id:row.id,name:row.name,dob:row.dob,husband:row.husband,fileNumber:wife.fileNumber||row.id,husbandDOB:husband.dob||'',revision:row.revision,updated:row.updated};
 if(department==='hormonal')return {...identity,department,requests:visits.flatMap((v:any)=>list(v.orders).filter(isHormone).map((o:any)=>({orderId:o.id,person:v.person||'wife',name:v.person==='husband'?husband.name||row.husband:row.name,dob:v.person==='husband'?husband.dob||'':row.dob,visitDate:v.fields?.visitDate||'',...taskTiming(v,o,visits,care),displayStatus:taskStatus({...o,draft:o.labDraft}),bucket:taskBucket({...o,...taskTiming(v,o,visits,care)}),chartSync:o.chartSync||null,test:o.name,status:o.status||'Pending',...pick(o,resultKeys),draft:o.labDraft||null,catalogue:hormone(o.name)?{...hormone(o.name),range:v.person==='husband'?'':hormone(o.name)?.range}:null,submittedBy:o.labSubmittedBy||'',submittedAt:o.labSubmittedAt||''}))) };
 const hx=s['ivf-medical-history-demo-001-v1']?.json||{},hd=hx.data||{};
 const historySummary={general:hd.general||{},gyn:hd.gyn||{},medical:hd.med||{},ob:hd.ob||{},pregnancies:hx.pregnancies||[],children:hx.children||[],previousTreatment:hx.events?.fertility||[]};
 const husbandSFA=list(s['hamdan-husband-demo-m001-v1']?.json?.semen);
 return {...identity,department,historySummary,husbandSFA,cycles:care.filter((c:any)=>c.type==='cycle'&&(c.opu?.status==='Completed'||c.oiOutcome?.actualOPUDate)).map((c:any)=>({id:c.id,title:c.fields?.title||c.name||c.id,opu:pick(c.opu,['status','at','retrieved','mii','mi','gv','doctor']),actualOPUDate:fresh.opuDate(c),decision:c.postOPUDecision?pick(c.postOPUDecision,['plan','doctor','confirmedAt']):null,lab:c.embryology?pick(c.embryology,['sourceCycleId','embryos','icsi','days','allocations','legacy']):null,transfer:pick(fresh.read(c,care).transfer,['status','reviewState','at','doctor','embryos','day','embryoIds','embryoDetails','notes']),semenPreparation:c.semenPreparation||null,drafts:c.labDrafts||{}})).map((c:any)=>{for(const transfer of care.filter((x:any)=>x.type==='fet'&&x.transfer?.status==='Completed'))for(const ref of transfer.transfer.embryoRefs||[])if(ref.cycleId===c.id&&c.lab?.allocations?.[ref.embryoId])c.lab.allocations[ref.embryoId]={...c.lab.allocations[ref.embryoId],kind:'Transferred FET',status:'Transferred'};return c;})};
}
function validateResult(input:any,today:string,submit:boolean){const out=Object.fromEntries(resultKeys.map(k=>[k,text(input?.[k],k==='result'?2000:150)]));if(out.resultDate&&(!date(out.resultDate)||out.resultDate>today))throw Error('Enter a valid actual result date, no later than today.');if(out.resultTime&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(out.resultTime))throw Error('Enter a valid result time.');if(submit&&(!out.result||!out.resultDate||!out.resultTime))throw Error('Enter a result and its actual date and time before submitting.');return out;}
function values(input:any,keys:string[]){return Object.fromEntries(keys.map(k=>[k,text(input?.[k])]));}
export function applyLabAction(snapshot:string,department:Department,b:any,actor:{staffId:string;name:string},today=todayBaghdad()){
 const s=parsedSnapshot(snapshot),stamp=new Date().toISOString();
 if(department==='hormonal'){
  if(!['hormone-draft','hormone-submit'].includes(b.action)||!Array.isArray(b.patches)||!b.patches.length||b.patches.length>100)throw Error('Select requested hormone tests to save.');
  const visits=list(s[VISITS]?.json),care=list(s[CARE]?.json),seen=new Set();let batchDate:string|undefined,batchTime:string|undefined,batchVisit:string|undefined;
  for(const p of b.patches){const key=JSON.stringify([p.visitId,p.orderId]);if(seen.has(key))throw Error('Duplicate request.');seen.add(key);const v=visits.find((v:any)=>v.id===p.visitId),o=list(v?.orders).find((o:any)=>o.id===p.orderId);if(!o||!isHormone(o)||o.status==='Cancelled')throw Error('Hormone request not found.');const result=validateResult(p.values,today,b.action==='hormone-submit'),timing=taskTiming(v,o,visits,care),due=timing.scheduledAt.slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(due)&&due>today)throw Error('This test is scheduled for '+due+'. It remains an upcoming task until that visit.');if(result.resultDate&&due&&result.resultDate<due)throw Error('The actual result date cannot precede the scheduled visit. Review the requested visit before recording this result.');if(batchVisit!==undefined&&(batchVisit!==v.id||batchDate!==result.resultDate||batchTime!==result.resultTime))throw Error('Use one encounter and one shared result date/time per saved batch.');batchVisit=v.id;batchDate=result.resultDate;batchTime=result.resultTime;if(b.action==='hormone-draft')o.labDraft={...result,by:actor.name,staffId:actor.staffId,at:stamp};else{if(!o.labDraft||resultKeys.some(k=>o.labDraft[k]!==result[k]))throw Error('Save this result as a draft before submitting.');const history=list(o.labHistory);if(history.length>=200)throw Error('This result has reached its correction history limit.');o.labHistory=[...history,{...pick(o,resultKeys),status:o.status||'Pending',at:stamp,by:actor.name,staffId:actor.staffId}];Object.assign(o,result,{status:'Completed',labStatus:'Submitted',resultEntryMode:'Manual',resultUpdatedAt:stamp,labSubmittedBy:actor.name,labSubmittedStaffId:actor.staffId,labSubmittedAt:stamp});delete o.labDraft;if(o.labDispatch)o.labDispatch={...o.labDispatch,status:'Completed'};syncHormone(s,v,o);}}
  s[VISITS]={...s[VISITS],json:visits};
 }else{
  const care=list(s[CARE]?.json),index=care.findIndex((c:any)=>c.id===b.cycleId&&c.type==='cycle');if(index<0)throw Error('Retrieval cycle not found.');let c=care[index];if(!fresh.opuDate(c))throw Error('The doctor must complete and save OPU first.');const v=b.values||{},performer=text(v.embryologist||actor.name,150),witness=text(v.witness,150);if(!performer)throw Error('Enter the performing embryologist.');
  if(b.action==='semen-preparation'){
 const entry=values(v,['at','source','preparation','sampleNumber','volume','concentration','motility','normalForms','abnormalForms','comments']);
 if(!entry.at||!entry.source||!entry.preparation)throw Error('Enter preparation date/time, source and method.');
 if(!/^20\d\d-\d\d-\d\dT\d\d:\d\d$/.test(entry.at)||!Number.isFinite(Date.parse(entry.at))||entry.at.slice(0,10)>today)throw Error('Enter a valid actual preparation date/time.');
 for(const k of ['volume','concentration','motility','normalForms','abnormalForms'])if(entry[k]!==''&&(!/^\d+(\.\d+)?$/.test(entry[k])||Number(entry[k])<0||(['motility','normalForms','abnormalForms'].includes(k)&&Number(entry[k])>100)))throw Error('Enter valid numeric preparation findings; percentages must be 0–100.');
 const history=list(c.semenPreparationHistory);if(c.semenPreparation)history.push(c.semenPreparation);if(history.length>200)throw Error('Correction history limit reached.');c.semenPreparationHistory=history;c.semenPreparation={...entry,sourceCycleId:c.id,person:'husband',embryologist:performer,witness,submittedAt:stamp,submittedBy:actor.name,submittedStaffId:actor.staffId};
 }else if(b.action==='icsi'){c.embryology=embryo.icsi(c,{...values(v,['at','method','source','preparation','injected','inseminated','notes']),embryologist:performer,witness},today,care);}
  else if(b.action==='culture'){
   const entries:any={};if(!v.entries||typeof v.entries!=='object'||Array.isArray(v.entries)||Object.keys(v.entries).length>500)throw Error('Invalid culture observations.');
   for(const [id,entry]of Object.entries(v.entries))entries[id]=values(entry,['pn','stage','cells','fragmentation','grade','notes']);
   c.embryology=embryo.day(c,String(b.day),{...values(v,['at','notes']),embryologist:performer,witness,entries},today,care);
  }else if(['cryo-draft','cryo-submit'].includes(b.action)){
   if(!Array.isArray(b.embryoIds)||!b.embryoIds.length||b.embryoIds.length>500||b.embryoIds.some((id:any)=>typeof id!=='string')||new Set(b.embryoIds).size!==b.embryoIds.length)throw Error('Select embryo IDs for this straw.');
   const draft={...values(v,['at','day','device','storage','method','notes']),embryologist:performer,witness,embryoIds:b.embryoIds,grades:Object.fromEntries(b.embryoIds.map((id:string)=>[id,text(b.grades?.[id],150)]))};
   // Validate both draft and submission with the existing embryo / straw rules.
   const next=embryo.batchAllocation(c,draft.embryoIds,draft,draft.grades,today,care);
   if(b.action==='cryo-draft')c.labDrafts={...c.labDrafts,cryo:draft};else{const saved=c.labDrafts?.cryo;if(!saved||JSON.stringify(pick(saved,['at','day','device','storage','method','notes','embryoIds','grades']))!==JSON.stringify(pick(draft,['at','day','device','storage','method','notes','embryoIds','grades'])))throw Error('Save this straw as a draft before submitting.');c.embryology=next;c.labDrafts={...c.labDrafts};delete c.labDrafts.cryo;}
  }else if(['et-draft','et-submit'].includes(b.action)){
   if(!Array.isArray(b.embryoIds)||b.embryoIds.length>500||b.embryoIds.some((id:any)=>typeof id!=='string'))throw Error('Select embryo IDs.');
   if(c.postOPUDecision?.plan!=='Fresh ET')throw Error('The doctor must confirm Fresh ET in the OPU decision first.');
   if(fresh.read(c,care).transfer?.status==='Completed')throw Error('Submitted ET is locked. Ask the administrator to correct it in the clinical chart.');
   const ids=b.embryoIds,details=ids.map((id:string)=>({id,stage:text(b.details?.[id]?.stage,150),grade:text(b.details?.[id]?.grade,150)}));
   const input={...fresh.read(c,care),regimens:[],transfer:{...values(v,['at','doctor','notes']),embryos:ids.length,embryoIds:ids,embryoDetails:details,status:'Draft',reviewState:'Draft'}};
   const next=fresh.build(c,input,b.action==='et-submit',today);next.regimens=fresh.read(c,care).regimens||[];
   if(b.action==='et-draft')c.labDrafts={...c.labDrafts,et:next.transfer};else{const saved=c.labDrafts?.et;if(!saved||JSON.stringify(pick(saved,['at','doctor','notes','embryos','embryoIds','embryoDetails']))!==JSON.stringify(pick(next.transfer,['at','doctor','notes','embryos','embryoIds','embryoDetails'])))throw Error('Save this transfer as a draft before submitting.');next.transfer.reviewState='Submitted';c.embryology=embryo.applyTransfer(c,next,care);c.freshTransfer=next;c.labDrafts={...c.labDrafts};delete c.labDrafts.et;}
  }else if(b.action==='disposition')c.embryology=embryo.disposition(c,text(b.embryoId,100),{...values(v,['day','at','notes','action']),embryologist:performer,witness},today,care);
  else throw Error('Unknown embryology action.');
  c.labStaffEntries=[...list(c.labStaffEntries),{action:b.action,performer,witness,by:actor.name,staffId:actor.staffId,at:stamp}].slice(-200);care[index]=c;s[CARE]={...s[CARE],json:care};
  const before={[CARE]:JSON.stringify(list(parsedSnapshot(snapshot)[CARE]?.json))},after={[CARE]:JSON.stringify(care)};
  assertProcedureIntegrity(before,after);
  if(procedureScopes(before,after).length)throw Error('Submitted ET / cryo is locked. Ask the administrator to make corrections through the clinical chart.');
 }
 const result=JSON.stringify(s);if(result.length>1800000)throw Error('Record too large.');return result;
}
