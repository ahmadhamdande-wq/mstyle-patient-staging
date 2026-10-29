import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('lib/edition31.ts','utf8');
const assets=JSON.parse(source.slice(source.indexOf('{')).trim().replace(/;$/,''));
const nodes={};
class El{
 constructor(tag='div'){this.tag=tag;this.children=[];this.hidden=false;this.value='';this.classList={add(){},toggle(){}};}
 set id(id){this._id=id;nodes[id]=this;}get id(){return this._id;}
 append(...items){this.children.push(...items);}before(){}setAttribute(){}
 replaceChildren(...items){this.children=items;}
 querySelector(){return null;}
}
for(const id of ['oiSetupCard','setupFields','oiDateStrip','startDaySummary']){const el=new El();el.id=id;}
const ids=['recordingMode','cycleStart','stimulationStart','stimulationStartCD','cycleStatus','cycleIndication','fertilisation','protocol','pgt','pgtDetails','semenSource','semenNotes','transferPlan','transferDay','transferNotes','cycleImportant','cyclePlan'];
for(const id of ids){const el=new El('input');el.id=id;}
const ctx={document:{getElementById:id=>nodes[id],createElement:tag=>new El(tag)},MStyle:{},setupIds:ids,locked:true,episode:{oiSetupSaved:true,fields:{cycleStart:'2026-10-12',stimulationStart:'2026-10-14',stimulationStartCD:'3',protocol:'Antagonist',cycleImportant:'<img src=x onerror=alert(1)>',cyclePlan:'Review response'}},mode(v){ctx.locked=v;},editOI(){ctx.locked=false;},load(){},updateDays(){},recordEditing:{setSavedState(v){ctx.locked=v;}}};
let succeeds=true,saves=0;
ctx.save=async options=>{saves++;assert(options.setupOnly);if(!succeeds)return false;ctx.episode.fields=Object.fromEntries(ids.map(id=>[id,nodes[id].value]));ctx.episode.oiSetupSaved=true;ctx.locked=true;return true;};
for(const [id,value]of Object.entries(ctx.episode.fields))nodes[id].value=value;
ctx.window=ctx;vm.createContext(ctx);vm.runInContext(assets['mstyle-cycle-summary.js'],ctx);
const content=el=>[el.textContent||'',...el.children.map(content)].join(' ');
assert(nodes.setupFields.hidden);assert(!nodes.mstyleCycleSummary.hidden);
assert.match(content(nodes.mstyleCycleSummary),/12 Oct 2026/);assert.match(content(nodes.mstyleCycleSummary),/CD 3/);
assert.match(content(nodes.mstyleCycleSummary),/<img src=x onerror=alert\(1\)>/);
assert(!content(nodes.mstyleCycleSummary).includes('Semen source'));
nodes.mstyleEditCycle.onclick();assert(!ctx.locked);assert(!nodes.setupFields.hidden);assert(nodes.mstyleCycleSummary.hidden);
nodes.cyclePlan.value='Unsaved';nodes.mstyleCancelCycle.onclick();assert.equal(nodes.cyclePlan.value,'Review response');assert(ctx.locked);assert(nodes.setupFields.hidden);
nodes.mstyleEditCycle.onclick();nodes.cyclePlan.value='Updated plan';succeeds=false;
await nodes.mstyleSaveCycle.onclick();assert(!nodes.setupFields.hidden);assert(nodes.mstyleCycleSummary.hidden);assert(nodes.mstyleCancelCycle.hidden);
succeeds=true;await nodes.mstyleSaveCycle.onclick();assert.equal(saves,2);assert(nodes.setupFields.hidden);assert.match(content(nodes.mstyleCycleSummary),/Updated plan/);
ctx.episode={oiSetupSaved:false,fields:{}};ctx.load();assert(!nodes.setupFields.hidden);assert(nodes.mstyleCycleSummary.hidden);
ctx.episode={oiSetupSaved:true,fields:{protocol:'Long agonist'}};ctx.load();assert(nodes.setupFields.hidden);assert.match(content(nodes.mstyleCycleSummary),/Long agonist/);assert(!content(nodes.mstyleCycleSummary).includes('Updated plan'));
nodes.mstyleEditCycle.onclick();assert(!nodes.setupFields.hidden);
console.log('PASS saved/edit/new-cycle states, cancel restoration, failed online-save visibility, save/reopen summaries, safe note text and field omission.');
