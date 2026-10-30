import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const raw=fs.readFileSync('lib/patient-file-face.ts','utf8'),a=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
const ctx={location:{pathname:'/record/fictional/index.html'},document:{readyState:'loading',addEventListener(){}},Date};ctx.window=ctx;vm.runInNewContext(a['patient-file-face.js'],ctx);const core=ctx.PatientFileFaceCore;
assert.equal(core.years('1992-10-31','2026-10-30'),33);assert.equal(core.years('1992-10-30','2026-10-30'),34);assert.equal(core.years('2030-01-01','2026-10-30'),'');assert.equal(core.years('','2026-10-30'),'');assert.equal(core.marriageDuration('2020-05-15','2026-10-30'),'6 years 5 months');assert.equal(core.marriageDuration('2020-10-31','2026-10-30'),'5 years 11 months');assert.equal(core.marriageDuration('','2026-10-30'),'');
assert(!/localStorage\.(setItem|removeItem|clear)/.test(a['patient-file-face.js']),'Layout code cannot write or remove stored clinical values');
console.log('PASS couple age/marriage summary boundaries and layout-only data preservation.');

for(const file of ['index.html','husband.html','anc.html','oi.html','oi-simple.html','ivf-stage.html','encounter.html','care.html','lab.html']){const context={location:{pathname:'/record/fictional/'+file},document:{readyState:'loading',addEventListener(){}},Date};context.window=context;vm.runInNewContext(a['patient-file-face.js'],context);assert(context.PatientFileFaceCore,file+' enabled');}
assert.match(a['patient-file-face.js'],/b.onclick=\(\)=>g.MStyle.navigate\(file\)/,'Sheet switching must retain existing guarded navigation');
assert.match(a['patient-file-face.js'],/if\(isFile&&typeof render/,'Clinical chart render functions stay untouched');
console.log('PASS shared sheet coverage, guarded switching and clinical render preservation.');
new vm.Script(a['compact-clinical.js']);
assert(!/localStorage\.(setItem|removeItem|clear)/.test(a['compact-clinical.js']));
assert.match(a['compact-clinical.js'],/Go to patient file/);
assert.match(a['compact-clinical.js'],/compactPrevious/);
assert.match(a['compact-clinical.js'],/g\.IVFCompact=\{dock:side\}/);
assert(!/medicine.?shortcut/i.test(a['compact-clinical.js']),'Patient overview adds no medicine shortcut box');
console.log('PASS compact layout syntax, navigation and layout-only storage boundary.');
assert(!/side\.append\(day\)/.test(a['compact-clinical.js']),'Monitoring panel must remain in its original modal');
assert.match(a['compact-clinical.js'],/active=\[treatment,trigger\]/,'Only injection editors activate the sidebar');
console.log('PASS monitoring modal ownership preserved; compact dock holds only injection editors.');
// Exercise compact installation with a monitoring panel already owned by the modal.
const domNodes=new Map();class LayoutNode{constructor(id=''){this.id=id;this.children=[];this.hidden=true;this.classList={add(){},toggle(){}};}append(...nodes){for(const n of nodes){if(n.parentNode)n.parentNode.children=n.parentNode.children.filter(x=>x!==n);n.parentNode=this;this.children.push(n);}}before(){}querySelectorAll(){return [];}setAttribute(){}}
for(const id of ['mstyleRibbon','oiDailyChart','oiDayPanel','chartDayDialog','ivfTreatmentEditor','ivfTriggerInline'])domNodes.set(id,new LayoutNode(id));domNodes.get('chartDayDialog').append(domNodes.get('oiDayPanel'));
const layoutContext={location:{pathname:'/record/fictional/oi.html'},document:{readyState:'complete',getElementById:id=>domNodes.get(id),querySelector:()=>null,createElement:()=>new LayoutNode(),body:{classList:{add(){}}}},MStyle:{menus:new Map()},MutationObserver:class{observe(){}}};layoutContext.window=layoutContext;
vm.runInNewContext(a['compact-clinical.js'],layoutContext);
assert.equal(domNodes.get('oiDayPanel').parentNode,domNodes.get('chartDayDialog'),'Compact installation must not empty the monitoring modal');
console.log('PASS compact installation leaves the check-up fields inside the existing dialog.');
