// Runs inside each authenticated patient screen, after its original interface initializes.
export function installRecordEditing(initialValues:Record<string,string>, initialRevision:number){
 const file=location.pathname.split('/').at(-1)||'index.html',query=new URLSearchParams(location.search);
 if(file==='oi.html'||file==='ivf-stage.html'||file==='oi-simple.html')return;
 const view=file+':'+(query.get('encounter')||query.get('record')||query.get('person')||'')+':'+(query.get('path')||'');
 const parse=(k:string)=>{try{return JSON.parse(initialValues[k]||'null')}catch{return null}};
 const savedViews=parse('clinic-saved-views-v1')||{};
 let initiallySaved=!!savedViews[view];
 if(!initiallySaved){
  if(file==='index.html'||file==='husband.html')initiallySaved=initialRevision>0||!!parse('clinic-edition-origin-v1');
  if(file==='encounter.html'){initiallySaved=!!query.get('encounter');if(query.get('embedded')==='1'&&['orders','medications'].includes(query.get('tab')||'')){const visit=(parse('hamdan-couple-encounters-v1')||[]).find((v:any)=>v.id===query.get('encounter'));if(visit&&!(query.get('tab')==='medications'?visit.medications||[]:visit.orders||[]).length)initiallySaved=false;}}
  if(file==='care.html'){const path=query.get('path')||'cycle',visits=parse('hamdan-couple-encounters-v1')||[],visit=visits.find((v:any)=>v.id===query.get('encounter')),linked=query.get('record')||visit?.careLinks?.[path],care=parse('hamdan-linked-care-v1')||[];initiallySaved=care.some((e:any)=>e.type===path&&e.patientId===visit?.patientId&&(path==='procedure'?e.id===linked&&e.fields?.procedureName===(query.get('procedure')||'Other procedure'):e.id===linked||!['Ended','Completed','Cancelled'].includes(e.status)));}
  if(file==='anc.html'){const id=query.get('encounter');initiallySaved=(parse('hamdan-linked-care-v1')||[]).some((e:any)=>e.type==='anc'&&(e.ancRecords?.[id||'']||e.status==='Ended'&&e.encounterIds?.includes(id)));}
 }
 let locked=initiallySaved,pendingLock=false,lastEditState='';const sectionRoots=new Set<Element>();
 const excluded=new Set(['medicinePicker','rxSavedMedicine','person','historyPicker','visitFilter','episodePicker','encounter','pregnancy','pathway','subtype']);
 const managed=new Map<any,boolean>();
 const message=document.createElement('span');message.id='record-edit-status';message.setAttribute('role','status');
 const edit=document.createElement('button');edit.id='record-edit-button';edit.textContent='Edit';
 const eligible=(el:any)=>!el.closest('#cloud-bar')&&!el.closest('#mstyleConsultationDialog')&&!el.closest('#encounterResultsDrawer')&&!el.closest('#patientHistoryDrawer')&&!el.closest('#clinicSearch')&&!el.closest('#clinicAppointments')&&!el.closest('.clinic-same-day')&&!el.closest('.medication-catalog-settings')&&!el.closest('.ivf-cycle-history')&&!el.closest('.ivf-history-confirm')&&!el.closest('#nsAIImport')&&!el.closest('#newStyleTreatment')&&!el.closest('.rx-template-bar')&&!el.closest('#rxTemplatePreview')&&!excluded.has(el.id)&&el.type!=='hidden'&&!/search|filter/i.test(el.id||'')&&!el.readOnly;
 function update(){
  if(locked){document.querySelectorAll('input,select,textarea').forEach((el:any)=>{if(eligible(el)&&!Array.from(sectionRoots).some(root=>root.contains(el))&&!managed.has(el)){managed.set(el,el.disabled);el.disabled=true;el.dataset.recordLocked='true';}});}
  else{for(const [el,disabled]of managed){el.disabled=disabled;delete el.dataset.recordLocked;}managed.clear();}
  const text=locked?(sectionRoots.size?'Editing section · save this box':'Saved · read only'):'Editing · save changes when finished';if(message.textContent!==text)message.textContent=text;edit.hidden=false;(window as any).importantFindings?.syncMode();const state=String(locked)+':'+sectionRoots.size;if(state!==lastEditState){lastEditState=state;document.dispatchEvent(new Event('clinic-edit-state'));}
 }
 function unlock(){sectionRoots.clear();locked=false;pendingLock=false;update();}
 function unlockSection(root:Element){if(!root)return;if(!locked)return;sectionRoots.add(root);for(const [el,disabled]of managed)if(root.contains(el)){el.disabled=disabled;delete el.dataset.recordLocked;managed.delete(el);}update();}
 edit.onclick=()=>{unlock();if(file==='anc.html')(window as any).ANCSavedSummary?.editChart();};
 const bar=document.getElementById('cloud-bar');bar?.appendChild(message);bar?.appendChild(edit);
 const save=document.getElementById('cloud-retry');if(save)save.textContent='Save changes';
 // Save must complete online before the interface returns to read-only mode.
 const controller={setSavedState(saved:boolean){sectionRoots.clear();locked=saved;pendingLock=false;update();},prepareSave(){if(locked&&!sectionRoots.size)return;pendingLock=true;let markers:any={};try{markers=JSON.parse(localStorage.getItem('clinic-saved-views-v1')||'{}')}catch{}markers[view]=true;localStorage.setItem('clinic-saved-views-v1',JSON.stringify(markers));},isLocked(){return locked;},saved(){if(pendingLock){pendingLock=false;sectionRoots.clear();locked=true;update();}},unlock,unlockSection};
 (window as any).recordEditing=controller;
 document.addEventListener('click',e=>{
  const button=(e.target as Element)?.closest('button');if(!button||button.closest('#mstyleConsultationDialog')||button.closest('#cloud-bar')||button.closest('#clinicSearch')||button.closest('#clinicAppointments')||button.closest('.medication-catalog-settings')||button.closest('.ivf-cycle-history')||button.closest('.ivf-history-confirm')||button.closest('#nsAIImport')||button.closest('#newStyleTreatment'))return;
  const text=(button.textContent||'').trim(),action=button.getAttribute('onclick')||'';
  if(/^Edit requests$/i.test(text)){const root=button.closest('#orders');if(root)unlockSection(root);return;}
  if(/\bedit\b/i.test(text)||/^Describe\b/i.test(text)){const box=button.closest('.anc-two-box-card');if(box){unlockSection(box);return;}unlock();return;}
  const templateAction=/ClinicPrescriptions\.(?:newTemplate|saveTemplate(?:Edits)?|deleteTemplate|appendPreviewRow|removeTemplateRow)\(/.test(action);
  if(locked&&!Array.from(sectionRoots).some(root=>root.contains(button))&&!templateAction&&(/remove important flag/i.test(button.getAttribute('aria-label')||'')||/^(?:\+?\s*Add|Remove|Delete|Approve|Finalize|Send)\b/i.test(text)||/^save|^apply/i.test(text))){e.preventDefault();e.stopImmediatePropagation();message.textContent='Choose Edit before changing saved data.';edit.focus();return;}
  if(!locked&&/^(?:Save|Apply)\b/i.test(text)&&!action.includes('saveMedicineName')&&!action.includes('saveTemplate')){const before=(window as any).clinicRecordVersion||0;setTimeout(()=>{if(((window as any).clinicRecordVersion||0)!==before)controller.prepareSave();},0);}
 },true);
 for(const id of ['historyPicker','episodePicker'])document.getElementById(id)?.addEventListener('change',()=>{locked=true;pendingLock=false;update();});
 new MutationObserver(()=>{if(locked)update();}).observe(document.body,{childList:true,subtree:true});
 const orders=document.getElementById('orders');if(orders){const b=document.createElement('button');b.type='button';b.textContent='Edit requests';orders.insertBefore(b,orders.firstChild);}
 update();return controller;
}

