import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync('lib/edition31.ts','utf8'),a=JSON.parse(source.slice(source.indexOf('{')).trim().replace(/;$/,'')),nodes={};
class El{constructor(){this.value='';this.hidden=false;this.children=[];}set id(v){nodes[v]=this;}append(...v){this.children.push(...v);}before(){}querySelector(){return bar;}closest(){return section;}focus(){this.focused=true;}scrollIntoView(){this.scrolled=true;}}
const bar=new El(),section=new El();section.hidden=true;
for(const id of ['oiSetupCard','monitorDate','gInjection','oiInjections','oiDailyEditors','oiDayPanel']){const e=new El();e.id=id;}
nodes.monitorDate.value='2026-10-14';let opened=[],edits=0;
const ctx={document:{getElementById:id=>nodes[id],createElement:()=>new El()},MStyle:{},episode:{oiSetupSaved:true,fields:{stimulationStart:'2026-10-12'}},O:{cycleDay:date=>date>='2026-10-12'?3:0},OIPaper:{openDate(...v){opened.push(v);nodes.oiDayPanel.hidden=false;},editSetup(){edits++;}},message(t){ctx.msg=t;},load(){nodes.monitorDate.value='2026-10-20';}};
ctx.window=ctx;vm.createContext(ctx);vm.runInContext(a['mstyle-injection-shortcut.js'],ctx);
assert.equal(nodes.mstyleInjectionDate.value,'2026-10-14');nodes.mstyleEnterInjections.onclick();assert.deepEqual(opened,[['2026-10-14','injection']]);assert(nodes.gInjection.focused);assert(!section.hidden);assert(nodes.oiInjections.open);
nodes.mstyleInjectionDate.value='2026-10-01';nodes.mstyleEnterInjections.onclick();assert.equal(opened.length,1);assert.match(ctx.msg,/within this cycle/);
ctx.episode.oiSetupSaved=false;nodes.mstyleEnterInjections.onclick();assert.equal(edits,1);assert.equal(opened.length,1);
ctx.load();assert.equal(nodes.mstyleInjectionDate.value,'2026-10-20');console.log('PASS visible injection shortcut selects dated editor, reveals/focuses medicine entry, validates dates and supports initial setup.');
