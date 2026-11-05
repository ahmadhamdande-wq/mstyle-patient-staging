import {withClinicStartup} from '../../../../lib/clinic-startup';
import {historyVisitAssets} from '../../../../lib/history-visit-design';
import {clinicalAccess} from '../../../../lib/access-policy';
import {ancScanMethodAssets} from '../../../../lib/anc-scan-method';
import {clinicalShortcutAssets} from '../../../../lib/clinical-shortcuts';
import {prescriptionWorkflowAssets} from '../../../../lib/prescription-workflow';
import {clinicLabelAssets} from '../../../../lib/clinic-label-style';
import {patientFileAssets} from '../../../../lib/patient-file-face';
import {assetVersion,versionAssetLinks} from '../../../../lib/asset-version';
import {treatmentAssets} from '../../../../lib/ivf-treatment';
import {getChatGPTUser,chatGPTSignInPath} from '../../../chatgpt-auth';import {assets as originalAssets} from '../../../../lib/edition31';
const assets={...originalAssets,...treatmentAssets,...patientFileAssets,...clinicLabelAssets,...prescriptionWorkflowAssets,...clinicalShortcutAssets,...ancScanMethodAssets,...historyVisitAssets};import {bridge} from '../../../../lib/cloud-bridge';import {record,recordExists,decodeSnapshot,validId} from '../../../../lib/records';
export async function GET(req:Request,{params}:any){const {id,file}=await params;const u=await getChatGPTUser();if(!u)return Response.redirect(new URL(chatGPTSignInPath(new URL(req.url).pathname),req.url));if(!validId(id)||!assets[file])return new Response('Not found',{status:404});try{const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
if(file.endsWith('.css')||file.endsWith('.js')){if(!await recordExists(id,u.userId))return new Response('Not found',{status:404});const staticHeaders={...headers,...(new URL(req.url).searchParams.get('v')===assetVersion(assets[file])?{'Cache-Control':'private, max-age=86400, immutable','Vary':'Cookie'}:{})};return new Response(assets[file],{headers:{...staticHeaders,'Content-Type':file.endsWith('.css')?'text/css':'text/javascript'}});}
const r=await record(id,u.userId);if(!r)return new Response('Not found',{status:404});const values=await decodeSnapshot(r.snapshot,u.userId,id);let html=assets[file];if(file==='oi.html')html+='<link rel="stylesheet" href="ivf-treatment.css"><script src="ivf-treatment.js"></script><script src="ivf-trigger-inline.js"></script>';
if(['index.html','husband.html','anc.html','oi.html','oi-simple.html','ivf-stage.html','encounter.html','care.html','lab.html'].includes(file))html+='<link rel="stylesheet" href="patient-file-face.css"><script src="patient-file-face.js"></script><link rel="stylesheet" href="compact-clinical.css"><script src="compact-clinical.js"></script><script src="post-opu-followup.js"></script><link rel="stylesheet" href="mobile-clinic-navigation.css"><script src="mobile-clinic-navigation.js"></script>';
if(['oi.html','ivf-stage.html'].includes(file))html+='<script src="procedure-review.js"></script><script src="cycle-delete-core.js"></script><script src="cycle-controls.js"></script>';
if(file==='index.html')html+='<script src="patient-file-actions.js"></script><script src="patient-cryo-summary.js"></script>';
if(file==='oi.html')html+='<script src="clinic-confirm.js"></script><script src="cycle-outcome-view.js"></script><script src="chart-selection-core.js"></script><script src="chart-selection.js"></script>';
if(['oi.html','ivf-stage.html'].includes(file))html+='<script src="transfer-outcome-core.js"></script><script src="transfer-outcome-ui.js"></script>';
if(['index.html','husband.html','anc.html','oi.html','oi-simple.html','ivf-stage.html','encounter.html','care.html','lab.html'].includes(file))html+='<link rel="stylesheet" href="clinic-label-style.css"><script src="clinic-label-style.js"></script>';
if(file==='encounter.html')html+='<script src="prescription-save-ui.js"></script>';
if(['index.html','husband.html','anc.html','oi.html','oi-simple.html','ivf-stage.html','encounter.html','care.html','lab.html'].includes(file))html+='<link rel="stylesheet" href="clinical-shortcuts.css"><script src="clinical-shortcuts.js"></script>';
if(file==='anc.html')html+='<link rel="stylesheet" href="anc-space-layout.css"><script src="anc-space-layout.js"></script>';
if(['index.html','anc.html'].includes(file))html+='<link rel="stylesheet" href="history-visit-design.css"><script src="history-visit-core.js"></script><script src="history-visit-design.js"></script>';
if(['index.html','husband.html','oi.html','ivf-stage.html'].includes(file))html+='<link rel="stylesheet" href="patient-results-drawer.css"><script src="encounter-results-core.js"></script><script src="encounter-results-drawer.js"></script>';
// Keep all original links and pathways within the selected couple file.
html=html.replace(/(["'])\/(index|husband|encounter|care|lab|anc)\.html/g,(_,quote,name)=>quote+'/record/'+id+'/'+name+'.html');html=html.replace(/href="\/"/g,'href="/record/'+id+'/index.html"');html=html.replace(/(["'])\/(request-ui|important-flags)\.js/g,(_,quote,name)=>quote+'/record/'+id+'/'+name+'.js');
if(clinicalAccess(u)==='read')html=html.replace(/<body([^>]*)>/i,'<body$1><div role="status" style="padding:10px 18px;background:#fff6df;color:#694d0d;border-bottom:1px solid #e7cf96;font:14px system-ui">View-only clinical access. Changes cannot be saved. <a href="/">Return to patient list</a></div>');
html=withClinicStartup(html,file,assets);html=versionAssetLinks(html,assets);html=html.replace(/<script(?:\s|>)/,m=>bridge(id,values,r.revision)+m);return new Response(html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
}catch(e){console.error('Patient page unavailable',e);return new Response('Online record unavailable. Keep any editing window open and return to the patient list to retry.',{status:503,headers:{'Cache-Control':'no-store'}});}}

