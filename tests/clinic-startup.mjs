import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
function module(path){const exports={};const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports});return exports;}
const {withClinicStartup}=module('lib/clinic-startup.ts'),{versionAssetLinks,assetVersion}=module('lib/asset-version.ts');
const assets={'skin.css':'body{color:teal}','legacy.js':'/* retained */'},html='<!doctype html><html><head><style>body{color:navy}</style></head><body><main>Original patient markup</main><script src="legacy.js"></script></body></html><link rel="stylesheet" href="skin.css"><link rel="stylesheet" href="https://example.invalid/external.css">';
const prepared=withClinicStartup(html,'index.html',assets),boot=prepared.match(/<script>([\s\S]*?)<\/script>/)[1];
assert(prepared.startsWith('<!doctype html>'));
assert(prepared.indexOf(boot)<prepared.indexOf('Original patient markup'),'Mask installs before clinical markup or legacy scripts');
assert(prepared.endsWith(html.slice('<!doctype html>'.length)),'Original markup, script order and stylesheet cascade remain intact');
assert(prepared.includes('<link rel="preload" as="style" href="skin.css">'));
assert(!prepared.includes('as="style" href="https://'));
const versioned=versionAssetLinks(prepared,assets);assert.equal(versioned.match(new RegExp('skin.css\\?v='+assetVersion(assets['skin.css']),'g')).length,2,'Preload and stylesheet share one content version');
for(const file of ['index.html','husband.html','anc.html','oi.html','oi-simple.html','ivf-stage.html','encounter.html','care.html','lab.html'])assert(withClinicStartup(html,file,assets).includes('clinicStartupStyle'));
assert.equal(withClinicStartup(html,'download.html',assets),html);
assert(withClinicStartup('<main>Fragment</main>','index.html',{}).indexOf(boot)<withClinicStartup('<main>Fragment</main>','index.html',{}).indexOf('<main>'));

function fixture(){
 const attributes=new Map(),classes=new Set(),listeners={},events={},frames=new Map(),timers=new Map();let next=0,reloads=0,ribbon=false;
 const root={setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)};
 function element(tag){return {tag,children:[],setAttribute(k,v){this[k]=v},appendChild(node){node.parent=this;this.children.push(node);return node},remove(){this.parent.children=this.parent.children.filter(n=>n!==this)}};}
 const body=element('body');body.classList={contains:k=>classes.has(k)};
 const document={documentElement:root,body,readyState:'loading',getElementById:id=>id==='mstyleRibbon'&&ribbon?{}:null,createElement:element,addEventListener:(k,fn)=>listeners[k]=fn};
 const context={document,location:{reload(){reloads++}},window:{addEventListener:(k,fn)=>events[k]=fn},requestAnimationFrame:fn=>{frames.set(++next,fn);return next},cancelAnimationFrame:id=>frames.delete(id),setTimeout:fn=>{timers.set(++next,fn);return next},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(boot,context);
 return {attributes,classes,body,listeners,events,frames,timers,ready(){classes.add('patient-file-face');classes.add('clinic-compact');ribbon=true},frame(){const queue=[...frames.values()];frames.clear();queue.forEach(fn=>fn())},reloads:()=>reloads};
}
const page=fixture();assert.equal(page.attributes.get('data-clinic-loading'),'pending');assert.equal(page.attributes.get('aria-busy'),'true');assert.equal(page.body.children.length,0,'Startup does not change patient markup');
page.listeners.DOMContentLoaded();page.frame();page.frame();assert(page.attributes.has('data-clinic-loading'),'DOMContentLoaded alone cannot reveal the old layout');
page.classes.add('patient-file-face');page.frame();assert(page.attributes.has('data-clinic-loading'),'Wait for compact navigation as well as patient header');
page.ready();page.frame();assert(!page.attributes.has('data-clinic-loading'));assert(!page.attributes.has('aria-busy'));assert.equal(page.timers.size,0);assert.equal(page.frames.size,0);
page.events.pageshow({persisted:true});assert.equal(page.frames.size,0,'Ready pages restored from browser history do not flash a loading or legacy view');
const slow=fixture();slow.listeners.DOMContentLoaded();slow.frame();[...slow.timers.values()][0]();assert.equal(slow.attributes.get('data-clinic-loading'),'slow');assert.equal(slow.body.children[0].id,'clinicStartup');slow.body.children[0].children[2].onclick();assert.equal(slow.reloads(),1);assert(slow.attributes.has('data-clinic-loading'),'Slow or failed enhancements never expose the legacy screen');slow.ready();slow.frame();assert.equal(slow.body.children.length,0);assert(!slow.attributes.has('data-clinic-loading'),'Late readiness still opens the current layout');
assert(!/localStorage|sessionStorage|fetch\(/.test(boot),'Presentation startup does not read, modify or transmit clinical data');
console.log('PASS current-layout startup: mask before patient markup, unchanged script/style order, versioned preloads, wait for layout installers, slow-load retry, late readiness, browser-history restore and no clinical data access.');
