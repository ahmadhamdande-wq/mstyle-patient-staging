import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const raw=fs.readFileSync('lib/edition31.ts','utf8'),a=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
for(const file of ['index.html','encounter.html']){
const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{id,value:'',options:[],style:{},addEventListener(){},append(o){this.options.push(o)}});return nodes.get(id)};
const ivf={style:{}},anc={hidden:false,style:{}},left={children:[],appendChild(n){this.children.push(n)}},right={children:[],firstChild:{},appendChild(n){this.children.push(n)},insertBefore(n){this.children.unshift(n)}};let renders=0;
const ctx=vm.createContext({location:{pathname:'/'+file},document:{getElementById:get,querySelector:()=>({children:[left,right]}),querySelectorAll:s=>s.includes("ClinicIVF")?[ivf]:[],createElement:()=>({}),addEventListener(){}},render(){renders++}});
ctx.window=ctx;vm.runInContext(a['clinic-file-layout.js'],ctx);assert.equal(ivf.hidden,true);assert.equal(anc.hidden,false);
get(file==='index.html'?'chiefComplaint':'complaint').value='Planning for IVF';if(file==='encounter.html')ctx.render();else vm.runInContext(a['clinic-file-layout.js'],ctx);assert.equal(ivf.hidden,false);assert.equal(ivf.textContent,'IVF Cycle / OI Chart');assert.equal(anc.hidden,false);
if(file==='index.html'){assert.equal(left.children.at(-1).id,'initialUltrasound');assert.equal(right.children[0].id,'hsgMainCard');assert.equal(right.children.at(-1).id,'initialPlanCard');}else{get('complaint').value='';get('purpose').value='IVF cycle';ctx.render();assert.equal(ivf.hidden,false);get('purpose').value='Follow-up';ctx.render();assert.equal(ivf.hidden,true);assert(renders>0);}
assert.match(a[file],/clinic-file-layout.js/);assert.match(a[file],/ANC/);
}
console.log('PASS IVF entry visibility, encounter re-render, equal-column placement and ANC controls retained.');
