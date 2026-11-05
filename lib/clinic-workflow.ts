// Shared catalogue and record-only workflow. No clinical interpretation is inferred.
export const hormoneCatalogue = [
 ['E2','Estradiol','pg/mL','40.7–220.4','e2'],['Progesterone (P4)','Progesterone','ng/mL','<1.55','p4'],
 ['LH','LH','IU/L','1.7–13.3','lh'],['FSH','FSH','IU/L','4.5–11.0','fsh'],['Prolactin','Prolactin','ng/mL','4.1–28.9',''],
 ['Free T3','FT3','pg/mL','2.02–5.43',''],['Free T4','FT4','ng/dL','0.25–1.71',''],['TSH','TSH','mIU/L','0.38–4.31',''],
 ['Testosterone','Testosterone','ng/dL','9.0–56.0',''],['β-hCG','β-hCG','mIU/mL','0.1–10000',''],['AMH','AMH','ng/mL','0.01–9.0','']
].map(([name,label,unit,range,chart])=>({name,label,unit,range,chart}));
export function hormone(name:string){return hormoneCatalogue.find(t=>[t.name,t.label].includes(name));}
export const V='hamdan-couple-encounters-v1',C='hamdan-linked-care-v1',A='clinic-appointments-v1';
const list=(v:any)=>Array.isArray(v)?v:[];
export const validDate=(v:any)=>typeof v==='string'&&/^20\d\d-\d\d-\d\d$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
export const validTime=(v:any)=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export function workflow(snapshot:string,b:any,actor:{staffId:string;name:string},now=new Date().toISOString()){
 const s=JSON.parse(snapshot),visits=list(s[V]?.json),care=list(s[C]?.json);let v=visits.find((x:any)=>x.id===b.visitId);
 const cycle=care.find((x:any)=>x.id===b.cycleId&&x.type==='cycle'&&!x.archived);
 if(b.action==='cancel-next-visit'){if(!cycle||!v||v.careLinks?.cycle!==cycle.id)throw Error('Select the linked IVF visit.');const source=cycle.oiAppointments?.[v.id];if(!source?.approvedAt||source.approvedAt!==b.approvalAt||source.cancelledAt)throw Error('Approval changed. Refresh before cancelling.');const appointments=list(s[A]?.json),ap=appointments.find((a:any)=>a.id==='monitor:'+cycle.id+':'+v.id);if(!ap||ap.status!=='Scheduled'||Object.values(cycle.oiVisits||{}).some((x:any)=>x.monitorDate===ap.date))throw Error('An attended visit cannot be cancelled here.');source.cancelledAt=now;source.cancelledBy=actor.name;ap.status='Cancelled';ap.timeStatus='Cancelled';for(const next of visits)if(next.id===source.encounterId){next.cancelledAt=now;next.planned=false;}for(const next of visits)if(next.id===source.encounterId)for(const o of list(next.orders))if(o.status==='Pending'){o.status='Cancelled';o.cancelledAt=now;o.cancelledBy=actor.name;}const alerts=list(s['clinic-portal-alerts-v1']?.json);alerts.push({id:crypto.randomUUID(),kind:'Appointment cancelled by clinic',date:source.date,time:source.time||'',at:now});s['clinic-portal-alerts-v1']={json:alerts.slice(-100)};s[A]={json:appointments};s[V]={...s[V],json:visits};s[C]={...s[C],json:care};return JSON.stringify(s);}
 if(b.action==='next-visit'){
  if(!cycle||!v||v.person==='husband'||v.careLinks?.cycle!==cycle.id)throw Error('Open the linked IVF encounter before approving the next visit.');
  if(!validDate(b.date)||b.date<=v.fields?.visitDate)throw Error('Choose a valid doctor-approved date.');
  const previous=cycle.oiAppointments?.[v.id];
  if(previous?.date===b.date&&previous?.approvedAt&&!previous.cancelledAt)throw Error('This date is already approved. Review its appointment before changing it.');
  if(previous?.approvedAt&&!previous.cancelledAt)throw Error('An approved appointment already exists. Cancel or reschedule it explicitly before creating another.');
  const id='monitor:'+cycle.id+':'+v.id,eid='ENC-NEXT-'+crypto.randomUUID();
  const approval={date:b.date,time:'',tests:[],folliculometry:true,approvedAt:now,approvedBy:actor.name,approvedStaffId:actor.staffId,encounterId:eid,timeStatus:'Pending reception'};
  if(previous?.cancelledAt)cycle.appointmentHistory=[...list(cycle.appointmentHistory),{...previous,sourceVisitId:v.id}];
  cycle.oiAppointments={...cycle.oiAppointments,[v.id]:approval};
  v={id:eid,appointmentId:id,person:'wife',patientId:cycle.patientId,coupleId:cycle.coupleId,careLinks:{cycle:cycle.id},fields:{visitDate:b.date,purpose:'IVF cycle',clinician:actor.name},exam:{},us:{},orders:[],medications:[],planned:true};visits.push(v);
  const appointments=list(s[A]?.json).filter((a:any)=>a.id!==id);appointments.push({id,kind:'IVF monitoring',source:'cycle',cycleId:cycle.id,encounterId:eid,person:'wife',date:b.date,time:'',status:'Scheduled',approvalAt:now,timeStatus:'Pending reception',doctor:actor.name,tests:[]});s[A]={json:appointments};
 }else if(b.action!=='request-tests')throw Error('Unknown workflow action.');
 if(!v||v.cancelledAt)throw Error('Select an active saved encounter.');if(b.cycleId&&(!cycle||v.careLinks?.cycle!==cycle.id))throw Error('The test request must use this visit’s linked cycle.');
 if(b.person&&v.person!==b.person)throw Error('The request must belong to the selected person’s visit.');
 if(b.action==='request-tests'&&(!validDate(b.date)||!validTime(b.time)))throw Error('Enter the shared request date and time.');
 if(!Array.isArray(b.tests)||b.tests.length>30||b.tests.some((n:any)=>typeof n!=='string'||!hormone(n)))throw Error('Select tests from the internal laboratory catalogue.');
 if(!b.tests.length&&b.action==='request-tests')throw Error('Select at least one test.');
 const names=[...new Set<string>(b.tests)],requestAt=b.action==='next-visit'?b.date:b.date+'T'+b.time;
 for(const name of names){if(list(v.orders).some((o:any)=>o.name===name&&o.status!=='Cancelled'&&o.requestedAt===requestAt))continue;const t=hormone(name)!;v.orders=list(v.orders);v.orders.push({id:'LAB-'+crypto.randomUUID(),name,category:'hormonal',status:'Pending',units:t.unit,range:v.person==='husband'?'':t.range,requestedAt:requestAt,requestedBy:actor.name,requestedStaffId:actor.staffId,internalLab:true,cycleId:cycle?.id||v.careLinks?.cycle||'',monitorDate:v.fields?.visitDate||b.date,labDispatch:{status:'Requested',department:'hormonal',scheduledAt:requestAt}});}
 if(b.action==='next-visit'){cycle.oiAppointments[b.visitId].tests=names;const ap=s[A].json.at(-1);ap.tests=names;}
 s[V]={...s[V],json:visits};s[C]={...s[C],json:care};return JSON.stringify(s);
}
export function syncHormone(s:any,v:any,o:any){
 const test=hormone(o.name);if(v.person==='husband'||!test?.chart)return;
 const cycle=list(s[C]?.json).find((c:any)=>c.id===(o.cycleId||v.careLinks?.cycle));if(!cycle)return;
 // Only synchronize to an actual dated monitoring entry; planned visits never become attended.
 const row=Object.values(cycle.oiVisits||{}).find((r:any)=>r.encounterId===v.id&&r.monitorDate===(o.monitorDate||v.fields?.visitDate)) as any;
 if(!row){o.chartSync={status:'Pending monitoring entry'};return;}
 const field=test.chart,value=String(o.result).trim();if(!/^\d+(\.\d+)?$/.test(value)){o.chartSync={status:'Review nonnumeric result'};return;}
 row.labProvenance=row.labProvenance||{};const current=String(row[field]??''),prior=row.labProvenance[field];
 const unitField=field==='e2'?'e2Units':field==='p4'?'p4Units':'gonadoUnits';if(current!==''&&(current!==value||row[unitField]&&row[unitField]!==o.units)&&!(prior?.orderId===o.id&&current===prior.value)){o.chartSync={status:'Conflict',field,existing:current,incoming:value};return;}
 row[field]=value;row[field==='e2'?'e2Units':field==='p4'?'p4Units':'gonadoUnits']=o.units;row.labProvenance[field]={orderId:o.id,value,submittedAt:o.labSubmittedAt};o.chartSync={status:'Synchronized',field};
}
export function confirmTime(snapshot:string,b:any,actor:any,now=new Date().toISOString()){
 if(!validTime(b.time))throw Error('Enter a valid appointment time.');
 const s=JSON.parse(snapshot),care=list(s[C]?.json),appointments=list(s[A]?.json),ap=appointments.find((a:any)=>a.id===b.appointmentId),cycle=care.find((c:any)=>c.id===ap?.cycleId);
 const source=cycle&&Object.values(cycle.oiAppointments||{}).find((a:any)=>a.encounterId===ap?.encounterId) as any;
 if(!ap||!source?.approvedAt||source.date!==ap.date||source.approvedAt!==b.approvalAt||ap.status!=='Scheduled')throw Error('The doctor’s approval changed. Refresh before confirming the time.');
 if(ap.time!==String(b.expectedTime||''))throw Error('The time changed in another window. Refresh before confirming.');if(ap.time===b.time&&ap.timeConfirmedAt)throw Error('This time is already confirmed.');
 ap.time=source.time=b.time;ap.timeStatus=source.timeStatus='Confirmed';ap.timeConfirmedAt=source.timeConfirmedAt=now;ap.timeConfirmedBy=actor.name;
 for(const v of list(s[V]?.json))if(v.id===ap.encounterId)for(const o of list(v.orders))if(o.internalLab&&o.status==='Pending')o.labDispatch={...o.labDispatch,scheduledAt:ap.date+'T'+b.time};
 const notices=list(s['clinic-portal-alerts-v1']?.json);notices.push({id:crypto.randomUUID(),kind:'Appointment confirmed',date:ap.date,time:b.time,at:now});s['clinic-portal-alerts-v1']={json:notices.slice(-100)};s[A]={json:appointments};s[C]={...s[C],json:care};return JSON.stringify(s);
}
