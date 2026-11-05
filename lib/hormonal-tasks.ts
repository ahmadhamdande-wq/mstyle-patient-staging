export type LabBucket='Today'|'Upcoming'|'Overdue'|'Submitted'|'History';
export const labBuckets:LabBucket[]=['Today','Upcoming','Overdue','Submitted','History'];
export function labToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
const valid=(s:any)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}/.test(s)&&Number.isFinite(Date.parse(s.slice(0,10)))&&new Date(s.slice(0,10)).toISOString().slice(0,10)===s.slice(0,10);
export function taskBucket(r:any,today=labToday()):LabBucket{if(r.status==='Cancelled')return 'History';if(r.status==='Completed')return 'Submitted';if(!valid(r.scheduledAt))return 'History';const date=r.scheduledAt.slice(0,10);return date===today?'Today':date>today?'Upcoming':'Overdue';}
export function taskStatus(r:any){return r.status==='Cancelled'?'Cancelled':r.draft?r.status==='Completed'?'Draft correction saved':'Draft saved':r.status==='Completed'?(r.submittedAt||r.labSubmittedAt?'Submitted ✓':'Completed · previous entry'):'Pending';}
export function taskTiming(v:any,o:any,visits:any[],care:any[]){
 const cycle=care.find(c=>c.id===(o.cycleId||v.careLinks?.cycle));const linked=Object.entries(cycle?.oiAppointments||{}).find(([sourceId,a]:any)=>sourceId!==v.id&&a.encounterId===v.id&&!a.cancelledAt) as [string,any]|undefined;
 const sourceId=o.requestVisitId||linked?.[0]||v.id,source=visits.find(x=>x.id===sourceId);
 const scheduled=o.labDispatch?.scheduledAt||o.monitorDate||linked?.[1]?.date||v.fields?.visitDate||'';
 // Older next-visit requests used the due date as their request date. Display their documented source visit without rewriting history.
 const legacy=linked&&sourceId!==v.id&&o.requestedAt===v.fields?.visitDate;
 return {requestedAt:legacy?source?.fields?.visitDate||o.requestedAt:o.requestedAt||source?.fields?.visitDate||'',scheduledAt:scheduled,requestVisitId:sourceId,visitId:v.id,timeStatus:linked?.[1]?.timeStatus||(valid(scheduled)&&scheduled.length>10?'Recorded time':'Time pending reception'),scheduleSource:o.labDispatch?.scheduledAt?'Saved lab schedule':o.monitorDate||linked?'Linked monitoring visit':'Original visit'};
}
