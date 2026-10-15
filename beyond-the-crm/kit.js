/* Dashboards kit — tiny SVG chart engine shared by all 25 dashboards.
   Theme comes from CSS custom properties on :root:
   --surface (chart background) --ink --ink2 --ink3 (text) --grid
   --s1..--s5 categorical slots (validated per dashboard, fixed order)
   --q1..--q6 sequential ramp (light→dark)  --pos/--neg (diverging poles)  --good/--bad (status)
   Every chart: thin marks, rounded data ends, recessive grid, legend for ≥2 series,
   crosshair or per-mark tooltip, and a table view toggle. */
(function(){
const K={};const NS='http://www.w3.org/2000/svg';
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
K.css=css;const S=i=>css('--s'+(i+1))||['#2a78d6','#eb6834','#1baf7a','#eda100','#e87ba4'][i%5];K.S=S;
// ---------- numbers ----------
K.rng=seed=>{let a=seed>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
K.seed=(...p)=>{let h=2166136261;for(const c of JSON.stringify(p)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const CUR=()=>css('--cur')?css('--cur').replace(/"/g,''):'$';
K.money=(v,d)=>{const s=v<0?'−':'',a=Math.abs(v),c=CUR();if(a>=1e9)return s+c+(a/1e9).toFixed(d??1)+'B';if(a>=1e6)return s+c+(a/1e6).toFixed(d??1)+'M';if(a>=1e4)return s+c+Math.round(a/1e3)+'K';if(a>=1e3)return s+c+(a/1e3).toFixed(d??1)+'K';return s+c+Math.round(a)};
K.num=(v,d)=>{const s=v<0?'−':'',a=Math.abs(v);if(a>=1e6)return s+(a/1e6).toFixed(d??1)+'M';if(a>=1e4)return s+Math.round(a/1e3)+'K';return s+Math.round(a).toLocaleString('en-US')};
K.int=v=>Math.round(v).toLocaleString('en-US');
K.pct=(v,d=1)=>(v*100).toFixed(d)+'%';
K.days=v=>Math.round(v)+'d';
K.x=(v,d=1)=>v.toFixed(d)+'×';
function nice(max){if(max<=0)return{max:1,step:.25};const raw=max/5,p=Math.pow(10,Math.floor(Math.log10(raw)));const f=raw/p;const st=(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p;return{max:Math.ceil(max/st)*st,step:st}}
function niceMin(min,step){return Math.floor(min/step)*step}
// ---------- periods ----------
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
K.periods=(range)=>{const end=new Date(2026,8,30);const out=[];
 if(range==='30d'){for(let i=29;i>=0;i--){const d=new Date(end);d.setDate(d.getDate()-i);out.push(d.getDate()+' '+MON[d.getMonth()])}}
 else if(range==='90d'){for(let i=12;i>=0;i--){const d=new Date(end);d.setDate(d.getDate()-i*7);out.push(d.getDate()+' '+MON[d.getMonth()])}}
 else if(range==='ytd'){for(let m=0;m<9;m++)out.push(MON[m])}
 else {for(let i=11;i>=0;i--){const d=new Date(2026,8-i,1);out.push(MON[d.getMonth()]+(d.getMonth()===0?" '"+String(d.getFullYear()).slice(2):''))}}
 return out};
K.series=(r,n,base,{trend=0,noise=.12,season=0,phase=0,min=0}={})=>Array.from({length:n},(_,i)=>Math.max(min,base*(1+trend*i/Math.max(1,n-1))*(1+Math.sin(i/1.7+phase)*season)*(1+(r()-.5)*2*noise)));
K.pick=(r,a)=>a[Math.floor(r()*a.length)];
K.sum=a=>a.reduce((x,y)=>x+y,0);
// ---------- DOM ----------
const el=(tag,attrs={},parent)=>{const e=tag==='div'||tag==='span'||tag==='button'||tag==='table'||tag==='tr'||tag==='td'||tag==='th'||tag==='thead'||tag==='tbody'||tag==='b'||tag==='i'||tag==='small'?document.createElement(tag):document.createElementNS(NS,tag);for(const k in attrs){if(k==='text')e.textContent=attrs[k];else if(k==='cls')e.setAttribute('class',attrs[k]);else e.setAttribute(k,attrs[k])}parent&&parent.appendChild(e);return e};
K.el=el;
// ---------- styles injected once ----------
const st=document.createElement('style');st.textContent=`
.k-chart{position:relative;width:100%}.k-chart svg{display:block;width:100%;overflow:visible}
.k-chart text{font-family:inherit;font-variant-numeric:tabular-nums}
.k-tip{position:fixed;z-index:9000;pointer-events:none;background:var(--tipbg,#111);color:var(--tipfg,#fff);border-radius:8px;padding:8px 10px;font-size:12px;line-height:1.45;box-shadow:0 8px 24px rgba(0,0,0,.22);opacity:0;transition:opacity .08s;min-width:120px;max-width:280px}
.k-tip .h{opacity:.7;margin-bottom:3px}.k-tip .r{display:flex;align-items:center;gap:7px;white-space:nowrap}.k-tip .r i{width:12px;height:2px;border-radius:1px;flex:none}.k-tip .r b{font-weight:600;min-width:52px}
.k-leg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:var(--ink2);margin:0 0 8px}.k-leg span{display:inline-flex;align-items:center;gap:6px}.k-leg i{display:inline-block;width:10px;height:10px;border-radius:2px}.k-leg i.l{height:2px;width:14px;border-radius:1px}
.k-tt{position:absolute;right:0;top:-2px;z-index:3;border:1px solid var(--grid);background:var(--surface);color:var(--ink3);font:600 10.5px/1 inherit;padding:4px 7px;border-radius:6px;cursor:pointer;opacity:.0;transition:opacity .15s}
.k-chart:hover .k-tt,.k-tt:focus{opacity:1}
.k-tv{position:absolute;inset:0;background:var(--surface);overflow:auto;z-index:2;font-size:12px}.k-tv table{width:100%;border-collapse:collapse}.k-tv th,.k-tv td{padding:4px 8px;border-bottom:1px solid var(--grid);text-align:right;white-space:nowrap}.k-tv th:first-child,.k-tv td:first-child{text-align:left}.k-tv th{color:var(--ink3);font-weight:600;position:sticky;top:0;background:var(--surface)}
.k-table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}
.k-table th{text-align:left;font-weight:600;color:var(--ink3);font-size:11.5px;padding:8px 10px;border-bottom:1px solid var(--grid);cursor:pointer;white-space:nowrap;user-select:none}
.k-table th.r,.k-table td.r{text-align:right}.k-table th.on{color:var(--ink)}
.k-table td{padding:9px 10px;border-bottom:1px solid var(--grid);color:var(--ink);white-space:nowrap}
.k-table tr:hover td{background:color-mix(in srgb,var(--ink) 4%,transparent)}
.k-bar{display:inline-block;height:6px;border-radius:3px;background:var(--s1);vertical-align:middle;margin-right:8px}
.k-kpi .v{font-variant-numeric:tabular-nums}
.k-up{color:var(--good)}.k-dn{color:var(--bad)}
.k-pill{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}
`;document.head.appendChild(st);
// ---------- tooltip ----------
let tip;function T(){if(!tip){tip=el('div',{cls:'k-tip',role:'tooltip'},document.body)}return tip}
K.tipShow=(e,head,rows)=>{const t=T();t.textContent='';if(head)el('div',{cls:'h',text:head},t);rows.forEach(([c,v,n])=>{const r=el('div',{cls:'r'},t);if(c){const i=el('i',{},r);i.style.background=c}el('b',{text:v},r);if(n)el('span',{text:n},r)});
 const w=t.offsetWidth||160,h=t.offsetHeight||60;let x=e.clientX+14,y=e.clientY+14;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y+h>innerHeight-8)y=e.clientY-h-14;t.style.left=x+'px';t.style.top=y+'px';t.style.opacity=1};
K.tipHide=()=>{if(tip)tip.style.opacity=0};
// ---------- chart shell: legend + svg + table toggle ----------
function shell(node,{h=240,legend,tableRows,tableHead}){node.classList.add('k-chart');node.textContent='';
 if(legend&&legend.length>1){const lg=el('div',{cls:'k-leg'},node);legend.forEach(([n,c,kind])=>{const s=el('span',{},lg);const i=el('i',{cls:kind==='line'?'l':''},s);i.style.background=c;s.appendChild(document.createTextNode(n))})}
 const W=Math.max(260,node.clientWidth||600);const svg=el('svg',{viewBox:`0 0 ${W} ${h}`,height:h,role:'img'},node);
 if(tableRows){const b=el('button',{cls:'k-tt',type:'button',text:'Table','aria-label':'Show as table'},node);b.onclick=()=>{let tv=node.querySelector('.k-tv');if(tv){tv.remove();b.textContent='Table';return}tv=el('div',{cls:'k-tv'},node);const tb=el('table',{},tv);const hr=el('tr',{},el('thead',{},tb));tableHead.forEach(x=>el('th',{text:x},hr));const bd=el('tbody',{},tb);tableRows.forEach(r=>{const tr=el('tr',{},bd);r.forEach(x=>el('td',{text:x},tr))});b.textContent='Chart'}}
 return{svg,W,h}}
function axisY(svg,{x0,x1,y0,y1,max,min=0,step,fmt}){const g=el('g',{},svg);for(let v=min;v<=max+1e-9;v+=step){const y=y1-(v-min)/(max-min)*(y1-y0);el('line',{x1:x0,x2:x1,y1:y,y2:y,stroke:css('--grid'),'stroke-width':1},g);el('text',{x:x0-8,y:y+4,'text-anchor':'end','font-size':11,fill:css('--ink3'),text:fmt(v)},g)}return g}
function axisX(svg,labels,xs,y,maxLabels=8){const every=Math.ceil(labels.length/maxLabels);labels.forEach((l,i)=>{if(i%every&&i!==labels.length-1)return;if(i!==labels.length-1&&labels.length-1-i<every&&i%every===0&&i!==0)return;el('text',{x:xs(i),y,'text-anchor':'middle','font-size':11,fill:css('--ink3'),text:l},svg)})}
const roundTop=(x,y,w,h,r)=>{r=Math.min(r,w/2,h);if(h<=0)return'';return`M${x} ${y+h}V${y+r}Q${x} ${y} ${x+r} ${y}H${x+w-r}Q${x+w} ${y} ${x+w} ${y+r}V${y+h}Z`};
const roundRight=(x,y,w,h,r)=>{r=Math.min(r,h/2,w);if(w<=0)return'';return`M${x} ${y}H${x+w-r}Q${x+w} ${y} ${x+w} ${y+r}V${y+h-r}Q${x+w} ${y+h} ${x+w-r} ${y+h}H${x}Z`};
// ---------- line / area ----------
K.line=(node,o)=>{const{labels,series,fmt=K.num,h=240,stacked=false,marker,yMin}=o;const cols=series.map((s,i)=>s.color||S(s.slot??i));
 const ok=v=>v!=null&&!Number.isNaN(v);const tRows=labels.map((l,i)=>[l,...series.map(s=>ok(s.data[i])?fmt(s.data[i]):'—')]);const{svg,W}=shell(node,{h,legend:series.map((s,i)=>[s.name,cols[i],'line']),tableRows:tRows,tableHead:['',...series.map(s=>s.name)]});
 const tot=labels.map((_,i)=>stacked?K.sum(series.map(s=>s.data[i]||0)):Math.max(...series.map(s=>ok(s.data[i])?s.data[i]:-Infinity)));const lo=yMin??0;const n=nice(Math.max(...tot)*1.04-lo);const mn=yMin!=null?niceMin(yMin,n.step):0;const mx=mn+n.max;
 const x0=Math.max(44,String(fmt(mx)).length*7+14),x1=W-12,y0=10,y1=h-26;axisY(svg,{x0,x1,y0,y1,max:mx,min:mn,step:n.step,fmt});const xs=i=>x0+i*(x1-x0)/Math.max(1,labels.length-1),ys=v=>y1-(v-mn)/(mx-mn)*(y1-y0);axisX(svg,labels,xs,h-6);
 const base=labels.map(()=>0);series.forEach((s,k)=>{if(!stacked&&s.data.some(v=>!ok(v))){const segs=[];let cur=[];s.data.forEach((v,i)=>{if(ok(v))cur.push([xs(i),ys(v)]);else if(cur.length){segs.push(cur);cur=[]}});if(cur.length)segs.push(cur);segs.forEach(sg=>el('path',{d:'M'+sg.map(p=>p.join(' ')).join('L'),fill:'none',stroke:cols[k],'stroke-width':2,'stroke-linejoin':'round','stroke-linecap':'round','stroke-dasharray':s.dash?'5 5':''},svg));const lp=segs.length?segs[segs.length-1].slice(-1)[0]:null;if(lp)el('circle',{cx:lp[0],cy:lp[1],r:4,fill:cols[k],stroke:css('--surface'),'stroke-width':2},svg);return}const top=s.data.map((v,i)=>stacked?base[i]+v:v);const pts=top.map((v,i)=>[xs(i),ys(v)]);
  if(s.area||stacked){const bot=stacked?base.map((v,i)=>[xs(i),ys(v)]).reverse():[[xs(labels.length-1),y1],[xs(0),y1]];el('path',{d:'M'+pts.map(p=>p.join(' ')).join('L')+'L'+bot.map(p=>p.join(' ')).join('L')+'Z',fill:cols[k],opacity:stacked?.85:.1},svg)}
  el('path',{d:'M'+pts.map(p=>p.join(' ')).join('L'),fill:'none',stroke:stacked?css('--surface'):cols[k],'stroke-width':stacked?1.5:2,'stroke-linejoin':'round','stroke-linecap':'round','stroke-dasharray':s.dash?'5 5':''},svg);
  if(!stacked){const e=pts[pts.length-1];el('circle',{cx:e[0],cy:e[1],r:4,fill:cols[k],stroke:css('--surface'),'stroke-width':2},svg)}
  if(stacked)top.forEach((v,i)=>base[i]=v)});
 if(marker){const x=xs(marker.i);el('line',{x1:x,x2:x,y1:y0,y2:y1,stroke:css('--ink3'),'stroke-width':1,'stroke-dasharray':'3 3'},svg);el('text',{x:x+5,y:y0+10,'font-size':11,fill:css('--ink2'),text:marker.label},svg)}
 const ch=el('line',{x1:0,x2:0,y1:y0,y2:y1,stroke:css('--ink3'),'stroke-width':1,opacity:0},svg);const hit=el('rect',{x:x0,y:y0,width:x1-x0,height:y1-y0,fill:'transparent'},svg);
 hit.addEventListener('pointermove',e=>{const r=svg.getBoundingClientRect();const px=(e.clientX-r.left)*W/r.width;const i=Math.max(0,Math.min(labels.length-1,Math.round((px-x0)/(x1-x0)*(labels.length-1))));ch.setAttribute('x1',xs(i));ch.setAttribute('x2',xs(i));ch.setAttribute('opacity',.6);
  const rows=series.map((s,k)=>[cols[k],ok(s.data[i])?fmt(s.data[i]):'—',s.name]).reverse();if(stacked)rows.unshift([null,fmt(K.sum(series.map(s=>s.data[i]))),'Total']);K.tipShow(e,labels[i],stacked?rows:rows.reverse())});
 hit.addEventListener('pointerleave',()=>{ch.setAttribute('opacity',0);K.tipHide()})};
// ---------- bars (vertical/horizontal, grouped/stacked) ----------
K.bars=(node,o)=>{const{labels,series,fmt=K.num,h=240,stacked=false,horizontal=false,onClick,highlight,colorBy}=o;const cols=series.map((s,i)=>s.color||S(s.slot??i));
 const tRows=labels.map((l,i)=>[l,...series.map(s=>fmt(s.data[i]))]);const{svg,W}=shell(node,{h,legend:series.length>1?series.map((s,i)=>[s.name,cols[i],'bar']):null,tableRows:tRows,tableHead:['',...series.map(s=>s.name)]});
 const vals=labels.map((_,i)=>stacked?K.sum(series.map(s=>Math.max(0,s.data[i]))):Math.max(...series.map(s=>s.data[i])));const n=nice(Math.max(...vals)*1.05);const surf=css('--surface');
 if(!horizontal){const x0=Math.max(44,String(fmt(n.max)).length*7+14),x1=W-8,y0=12,y1=h-26;axisY(svg,{x0,x1,y0,y1,max:n.max,step:n.step,fmt});const band=(x1-x0)/labels.length;const groupW=Math.min(stacked?24:Math.min(24*series.length+2*(series.length-1),band*.72),band*.72);const bw=stacked?groupW:(groupW-2*(series.length-1))/series.length;
  axisX(svg,labels,i=>x0+band*(i+.5),h-6,Math.floor((x1-x0)/56));
  labels.forEach((l,i)=>{let acc=0;const gx=x0+band*(i+.5)-groupW/2;series.forEach((s,k)=>{const v=Math.max(0,s.data[i]);const hh=v/n.max*(y1-y0);let x,y;if(stacked){x=gx;y=y1-(acc+v)/n.max*(y1-y0);acc+=v}else{x=gx+k*(bw+2);y=y1-hh}
   const isTop=!stacked||k===series.length-1||series.slice(k+1).every(z=>z.data[i]<=0);const hDraw=stacked&&k>0?Math.max(0,hh-2):hh;const c=colorBy?colorBy(i,k):cols[k];
   const p=el('path',{d:isTop?roundTop(x,y,bw,hDraw,4):`M${x} ${y}h${bw}v${hDraw}h${-bw}Z`,fill:c,opacity:highlight!=null&&highlight!==i?.35:1,tabindex:0},svg);p.style.cursor=onClick?'pointer':'default';
   const show=e=>{p.setAttribute('opacity',.8);K.tipShow(e,l,stacked?series.map((z,j)=>[colorBy?colorBy(i,j):cols[j],fmt(z.data[i]),z.name]).reverse():[[c,fmt(s.data[i]),series.length>1?s.name:'']])};
   p.addEventListener('pointermove',show);p.addEventListener('focus',e=>{const r=p.getBoundingClientRect();show({clientX:r.right,clientY:r.top})});p.addEventListener('pointerleave',()=>{p.setAttribute('opacity',highlight!=null&&highlight!==i?.35:1);K.tipHide()});p.addEventListener('blur',K.tipHide);if(onClick)p.addEventListener('click',()=>onClick(i,l))})})}
 else{const lw=Math.min(180,Math.max(...labels.map(l=>l.length))*6.6+14);const x0=lw,x1=W-56,y0=4,y1=h-20;const band=(y1-y0)/labels.length;const groupH=Math.min(stacked?20:Math.min(16*series.length,band*.7),band*.7);const bh=stacked?groupH:(groupH-2*(series.length-1))/series.length;
  for(let v=0;v<=n.max+1e-9;v+=n.step){const x=x0+v/n.max*(x1-x0);el('line',{x1:x,x2:x,y1:y0,y2:y1,stroke:css('--grid')},svg);el('text',{x,y:h-4,'text-anchor':'middle','font-size':11,fill:css('--ink3'),text:fmt(v)},svg)}
  labels.forEach((l,i)=>{const cy=y0+band*(i+.5);el('text',{x:x0-8,y:cy+4,'text-anchor':'end','font-size':12,fill:css('--ink2'),text:l.length>26?l.slice(0,25)+'…':l},svg);let acc=0;const gy=cy-groupH/2;
   series.forEach((s,k)=>{const v=Math.max(0,s.data[i]);const ww=v/n.max*(x1-x0);let x,y;if(stacked){x=x0+acc/n.max*(x1-x0)+(k?2:0);acc+=v;y=gy}else{x=x0;y=gy+k*(bh+2)}const isEnd=!stacked||k===series.length-1;const wd=stacked&&k?Math.max(0,ww-2):ww;const c=colorBy?colorBy(i,k):cols[k];
    const p=el('path',{d:isEnd?roundRight(x,y,wd,bh,4):`M${x} ${y}h${wd}v${bh}h${-wd}Z`,fill:c,opacity:highlight!=null&&highlight!==i?.35:1,tabindex:0},svg);p.style.cursor=onClick?'pointer':'default';
    const show=e=>{p.setAttribute('opacity',.8);K.tipShow(e,l,stacked?series.map((z,j)=>[colorBy?colorBy(i,j):cols[j],fmt(z.data[i]),z.name]):[[c,fmt(s.data[i]),series.length>1?s.name:'']])};p.addEventListener('pointermove',show);p.addEventListener('pointerleave',()=>{p.setAttribute('opacity',highlight!=null&&highlight!==i?.35:1);K.tipHide()});if(onClick)p.addEventListener('click',()=>onClick(i,l))});
   const tot=stacked?K.sum(series.map(s=>s.data[i])):series[0].data[i];if(series.length===1||stacked)el('text',{x:x0+tot/n.max*(x1-x0)+6,y:cy+4,'font-size':11.5,fill:css('--ink2'),text:fmt(tot)},svg)})}};
// ---------- donut ----------
K.donut=(node,o)=>{const{items,fmt=K.num,h=220,center}=o;const cols=items.map((it,i)=>it.color||S(it.slot??i));const tot=K.sum(items.map(i=>i.value));
 node.classList.add('k-chart');node.textContent='';const wrap=el('div',{},node);wrap.style.cssText='display:flex;align-items:center;gap:18px;flex-wrap:wrap';
 const sz=Math.min(h,200);const svg=el('svg',{viewBox:'0 0 200 200',width:sz,height:sz},wrap);svg.style.width=sz+'px';svg.style.flex='none';let a=-Math.PI/2;const R=92,r=62;
 items.forEach((it,i)=>{const f=it.value/tot,a2=a+f*Math.PI*2,gap=items.length>1?.02:0;const s=a+gap/2,e2=a2-gap/2;const lg=e2-s>Math.PI?1:0;const p=(rr,t)=>[100+rr*Math.cos(t),100+rr*Math.sin(t)];
  const d=`M${p(R,s)}A${R} ${R} 0 ${lg} 1 ${p(R,e2)}L${p(r,e2)}A${r} ${r} 0 ${lg} 0 ${p(r,s)}Z`;const pa=el('path',{d,fill:cols[i],tabindex:0},svg);pa.addEventListener('pointermove',e=>{pa.setAttribute('opacity',.8);K.tipShow(e,it.name,[[cols[i],fmt(it.value),K.pct(f)]])});pa.addEventListener('pointerleave',()=>{pa.setAttribute('opacity',1);K.tipHide()});a=a2});
 if(center){el('text',{x:100,y:98,'text-anchor':'middle','font-size':22,'font-weight':700,fill:css('--ink'),text:center.value},svg);el('text',{x:100,y:118,'text-anchor':'middle','font-size':11,fill:css('--ink3'),text:center.label},svg)}
 const lg=el('div',{},wrap);lg.style.cssText='flex:1;min-width:150px;display:grid;gap:6px;font-size:12.5px';items.forEach((it,i)=>{const row=el('div',{},lg);row.style.cssText='display:flex;align-items:center;gap:8px';const sw=el('i',{},row);sw.style.cssText=`width:10px;height:10px;border-radius:2px;flex:none;background:${cols[i]}`;const n=el('span',{text:it.name},row);n.style.cssText='flex:1;color:var(--ink2)';const v=el('b',{text:K.pct(it.value/tot,0)},row);v.style.cssText='font-weight:600;color:var(--ink);font-variant-numeric:tabular-nums'})};
// ---------- funnel ----------
K.funnel=(node,o)=>{const{steps,fmt=K.num,h}=o;node.classList.add('k-chart');node.textContent='';const box=el('div',{},node);box.style.cssText='display:grid;gap:4px';const max=steps[0][1];
 steps.forEach(([name,v],i)=>{const row=el('div',{},box);row.style.cssText='display:grid;grid-template-columns:minmax(90px,150px) 1fr 70px;gap:10px;align-items:center;font-size:12.5px';el('span',{text:name},row).style.color='var(--ink2)';
  const tr=el('div',{},row);tr.style.cssText='height:24px;position:relative';const b=el('div',{},tr);const c=css('--q'+Math.max(2,6-i))||S(0);b.style.cssText=`position:absolute;left:${(1-v/max)*50}%;width:${v/max*100}%;top:0;bottom:0;background:${c};border-radius:4px`;
  b.addEventListener('pointermove',e=>K.tipShow(e,name,[[c,fmt(v),i?K.pct(v/steps[i-1][1])+' of prev.':'']]));b.addEventListener('pointerleave',K.tipHide);
  const vv=el('b',{text:fmt(v)},row);vv.style.cssText='text-align:right;font-weight:600;color:var(--ink)';
  if(i<steps.length-1){const cv=el('div',{text:'↓ '+K.pct(steps[i+1][1]/v)+' convert'},box);cv.style.cssText='font-size:11px;color:var(--ink3);padding-left:min(160px,30%)'}})};
// ---------- heatmap ----------
K.heat=(node,o)=>{const{rows,cols,data,fmt=K.pct,h,cell=30,tri=false}=o;node.classList.add('k-chart');node.textContent='';const flat=data.flat().filter(v=>v!=null);const mn=Math.min(...flat),mx=Math.max(...flat);
 const t=el('table',{},node);t.style.cssText='border-collapse:separate;border-spacing:2px;font-size:11.5px;width:100%;font-variant-numeric:tabular-nums';const hr=el('tr',{},t);el('th',{},hr);cols.forEach(c=>{const th=el('th',{text:c},hr);th.style.cssText='font-weight:500;color:var(--ink3);padding:2px'});
 rows.forEach((r,i)=>{const tr=el('tr',{},t);const th=el('th',{text:r},tr);th.style.cssText='text-align:left;font-weight:500;color:var(--ink2);padding-right:8px;white-space:nowrap';
  cols.forEach((c,j)=>{const v=data[i][j];const td=el('td',{},tr);td.style.cssText=`height:${cell}px;border-radius:4px;text-align:center;min-width:30px`;if(v==null)return;const k=Math.round((v-mn)/(mx-mn||1)*5);const bg=css('--q'+(k+1));td.style.background=bg;td.textContent=fmt(v);td.style.color=k>=3?(css('--qhi')||'#fff'):(css('--qlo')||css('--ink'));td.tabIndex=0;
   td.addEventListener('pointermove',e=>{td.style.outline='2px solid var(--ink)';K.tipShow(e,r+' · '+c,[[bg,fmt(v),'']])});td.addEventListener('pointerleave',()=>{td.style.outline='';K.tipHide()})})})};
// ---------- scatter / bubble ----------
K.scatter=(node,o)=>{const{points,groups,xfmt=K.num,yfmt=K.num,h=260,xLabel='',yLabel='',quad,colors}=o;const gcols=colors?colors.map(c=>c.startsWith('--')?css(c):c):groups?groups.map((g,i)=>S(i)):[S(0)];
 const{svg,W}=shell(node,{h,legend:groups?groups.map((g,i)=>[g,gcols[i],'bar']):null,tableRows:points.map(p=>[p.label,xfmt(p.x),yfmt(p.y)]),tableHead:['',xLabel,yLabel]});
 const nx=o.xMax?{max:o.xMax,step:o.xMax/4}:nice(Math.max(...points.map(p=>p.x))*1.08),ny=o.yMax?{max:o.yMax,step:o.yMax/4}:nice(Math.max(...points.map(p=>p.y))*1.08);const x0=Math.max(46,String(yfmt(ny.max)).length*7+14),x1=W-14,y0=10,y1=h-34;axisY(svg,{x0,x1,y0,y1,max:ny.max,step:ny.step,fmt:yfmt});
 for(let v=0;v<=nx.max+1e-9;v+=nx.step){const x=x0+v/nx.max*(x1-x0);el('text',{x,y:y1+16,'text-anchor':'middle','font-size':11,fill:css('--ink3'),text:xfmt(v)},svg)}
 el('text',{x:x1,y:h-2,'text-anchor':'end','font-size':11,fill:css('--ink2'),text:xLabel+' →'},svg);el('text',{x:x0+4,y:y0+4,'font-size':11,fill:css('--ink2'),text:'↑ '+yLabel},svg);
 if(quad){const qx=x0+quad.x/nx.max*(x1-x0),qy=y1-quad.y/ny.max*(y1-y0);el('line',{x1:qx,x2:qx,y1:y0,y2:y1,stroke:css('--ink3'),'stroke-dasharray':'3 4'},svg);el('line',{x1:x0,x2:x1,y1:qy,y2:qy,stroke:css('--ink3'),'stroke-dasharray':'3 4'},svg);(quad.labels||[]).forEach(([t,ax,ay])=>el('text',{x:ax?x1-6:x0+6,y:ay?y0+22:y1-6,'text-anchor':ax?'end':'start','font-size':11,'font-weight':600,fill:css('--ink3'),text:t},svg))}
 const maxR=Math.max(...points.map(p=>p.r||1));points.forEach(p=>{const cx=x0+p.x/nx.max*(x1-x0),cy=y1-p.y/ny.max*(y1-y0),rr=p.r?5+Math.sqrt(p.r/maxR)*13:5;const c=gcols[p.g||0];const g=el('g',{tabindex:0},svg);el('circle',{cx,cy,r:Math.max(12,rr+4),fill:'transparent'},g);const d=el('circle',{cx,cy,r:rr,fill:c,'fill-opacity':p.r?.55:.9,stroke:css('--surface'),'stroke-width':2},g);
  if(p.tag)el('text',{x:cx+rr+4,y:cy+4,'font-size':11,fill:css('--ink2'),text:p.label},svg);
  g.addEventListener('pointermove',e=>{d.setAttribute('stroke',css('--ink'));K.tipShow(e,p.label,[[c,yfmt(p.y),yLabel],[null,xfmt(p.x),xLabel],...(p.extra||[]).map(x=>[null,x[1],x[0]])])});g.addEventListener('pointerleave',()=>{d.setAttribute('stroke',css('--surface'));K.tipHide()})})};
// ---------- waterfall ----------
K.waterfall=(node,o)=>{const{steps,fmt=K.money,h=250}=o;let run=0;const bars=steps.map(([n,v,t])=>{if(t){const b={n,a:0,b:v,t:1};run=v;return b}const b={n,a:run,b:run+v,v};run+=v;return b});
 const{svg,W}=shell(node,{h,tableRows:steps.map(s=>[s[0],fmt(s[1])]),tableHead:['Step','Value']});const mx=nice(Math.max(...bars.map(b=>Math.max(b.a,b.b)))*1.05);const x0=Math.max(48,String(fmt(mx.max)).length*7+14),x1=W-8,y0=16,y1=h-28;axisY(svg,{x0,x1,y0,y1,max:mx.max,step:mx.step,fmt});
 const band=(x1-x0)/bars.length,bw=Math.min(40,band*.6),ys=v=>y1-v/mx.max*(y1-y0);
 bars.forEach((b,i)=>{const x=x0+band*(i+.5)-bw/2;const top=ys(Math.max(b.a,b.b)),bot=ys(Math.min(b.a,b.b));const c=b.t?css('--ink2'):b.v>=0?css('--pos'):css('--neg');const p=el('path',{d:`M${x} ${top}h${bw}v${Math.max(1,bot-top)}h${-bw}Z`,fill:c,rx:3,tabindex:0},svg);
  if(i<bars.length-1){const nb=ys(b.t?b.b:b.b);el('line',{x1:x+bw,x2:x+band,y1:nb,y2:nb,stroke:css('--ink3'),'stroke-dasharray':'2 3'},svg)}
  el('text',{x:x+bw/2,y:top-5,'text-anchor':'middle','font-size':11,fill:css('--ink2'),text:b.t?fmt(b.b):(b.v>=0?'+':'')+fmt(b.v)},svg);const lbl=b.n.length>12?b.n.slice(0,11)+'…':b.n;el('text',{x:x+bw/2,y:h-8,'text-anchor':'middle','font-size':11,fill:css('--ink3'),text:lbl},svg);
  p.addEventListener('pointermove',e=>K.tipShow(e,b.n,[[c,b.t?fmt(b.b):(b.v>=0?'+':'')+fmt(b.v),b.t?'total':'change']]));p.addEventListener('pointerleave',K.tipHide)})};
// ---------- sankey (columns of nodes) ----------
K.sankey=(node,o)=>{const{nodes,links,h=300,fmt=K.num}=o;const{svg,W}=shell(node,{h,tableRows:links.map(l=>[nodes.find(n=>n[0]===l[0])[1]+' → '+nodes.find(n=>n[0]===l[1])[1],fmt(l[2])]),tableHead:['Flow','Value']});
 const colsN=Math.max(...nodes.map(n=>n[2]))+1;const pad=10,nw=12;const colX=c=>16+c*(W-150-16)/Math.max(1,colsN-1);const val=id=>Math.max(K.sum(links.filter(l=>l[0]===id).map(l=>l[2])),K.sum(links.filter(l=>l[1]===id).map(l=>l[2])));
 const pos={};for(let c=0;c<colsN;c++){const ns=nodes.filter(n=>n[2]===c);const tot=K.sum(ns.map(n=>val(n[0])));const sc=(h-20-pad*(ns.length-1))/Math.max(...Array.from({length:colsN},(_,cc)=>K.sum(nodes.filter(n=>n[2]===cc).map(n=>val(n[0]))))||1);let y=10;ns.forEach((n,i)=>{const hh=val(n[0])*sc;pos[n[0]]={x:colX(c),y,h:hh,out:y,in:y,sc,c:n[3]??i};y+=hh+pad})}
 links.forEach(l=>{const a=pos[l[0]],b=pos[l[1]];const w=l[2]*a.sc;const y1=a.out+w/2,y2=b.in+w/2;a.out+=w;b.in+=w;const mx=(a.x+nw+b.x)/2;const c=S(a.c);const p=el('path',{d:`M${a.x+nw} ${y1}C${mx} ${y1} ${mx} ${y2} ${b.x} ${y2}`,stroke:c,'stroke-width':Math.max(1,w),fill:'none','stroke-opacity':.28,tabindex:0},svg);
  p.addEventListener('pointermove',e=>{p.setAttribute('stroke-opacity',.55);K.tipShow(e,nodes.find(n=>n[0]===l[0])[1]+' → '+nodes.find(n=>n[0]===l[1])[1],[[c,fmt(l[2]),'']])});p.addEventListener('pointerleave',()=>{p.setAttribute('stroke-opacity',.28);K.tipHide()})});
 nodes.forEach(n=>{const p=pos[n[0]];el('rect',{x:p.x,y:p.y,width:nw,height:Math.max(2,p.h),rx:3,fill:S(p.c)},svg);const right=n[2]===colsN-1;el('text',{x:right?p.x+nw+6:p.x+nw+6,y:p.y+Math.max(2,p.h)/2+4,'font-size':11.5,fill:css('--ink'),text:n[1]+' · '+fmt(val(n[0]))},svg)})};
// ---------- bullet (actual vs target) ----------
K.bullet=(node,o)=>{const{rows,fmt=K.money,neutral}=o;node.classList.add('k-chart');node.textContent='';const box=el('div',{},node);box.style.cssText='display:grid;gap:10px';const mx=Math.max(...rows.map(r=>Math.max(r[1],r[2])))*1.08;
 rows.forEach(([n,a,t])=>{const row=el('div',{},box);row.style.cssText='display:grid;grid-template-columns:minmax(80px,130px) 1fr 92px;gap:10px;align-items:center;font-size:12.5px';el('span',{text:n},row).style.color='var(--ink2)';
  const tr=el('div',{},row);tr.style.cssText='height:18px;position:relative;background:color-mix(in srgb,var(--s1) 14%,var(--surface));border-radius:4px';const att=a/t;const c=neutral?css('--s1'):att>=1?css('--good'):att>=.8?css('--s1'):css('--bad');
  const b=el('div',{},tr);b.style.cssText=`position:absolute;left:0;top:4px;bottom:4px;width:${a/mx*100}%;background:${c};border-radius:0 4px 4px 0`;const tk=el('div',{},tr);tk.style.cssText=`position:absolute;left:${t/mx*100}%;top:-2px;bottom:-2px;width:2px;background:var(--ink)`;
  tr.addEventListener('pointermove',e=>K.tipShow(e,n,[[c,fmt(a),'actual'],[null,fmt(t),'target'],[null,K.pct(att,0),'attainment']]));tr.addEventListener('pointerleave',K.tipHide);
  const v=el('span',{text:K.pct(att,0)+(neutral?'':att>=1?' ✓':att<.8?' ▼':'')},row);v.style.cssText='text-align:right;font-weight:600;color:var(--ink)'})};
// ---------- sortable table ----------
K.table=(node,o)=>{const{cols,rows,sort,desc=true,limit,onRow}=o;node.textContent='';let sk=sort??cols[1]?.k,sd=desc;
 const draw=()=>{node.textContent='';const t=el('table',{cls:'k-table'},node);const hr=el('tr',{},el('thead',{},t));
  cols.forEach(c=>{const th=el('th',{cls:(c.align==='r'?'r ':'')+(c.k===sk?'on':'')},hr);th.textContent=c.label+(c.k===sk?(sd?' ↓':' ↑'):'');th.onclick=()=>{if(sk===c.k)sd=!sd;else{sk=c.k;sd=true}draw()}});
  const bd=el('tbody',{},t);const rs=[...rows].sort((a,b)=>{const x=a[sk],y=b[sk];return(typeof x==='string'?x.localeCompare(y):x-y)*(sd?-1:1)}).slice(0,limit||rows.length);
  const maxes={};cols.forEach(c=>{if(c.bar)maxes[c.k]=Math.max(...rows.map(r=>r[c.k]))});
  rs.forEach(r=>{const tr=el('tr',{},bd);if(onRow){tr.style.cursor='pointer';tr.onclick=()=>onRow(r)}cols.forEach(c=>{const td=el('td',{cls:c.align==='r'?'r':''},tr);if(c.render){const out=c.render(r[c.k],r);if(typeof out==='string')td.textContent=out;else td.appendChild(out)}else{if(c.bar){const b=el('span',{cls:'k-bar'},td);b.style.width=Math.max(2,r[c.k]/maxes[c.k]*70)+'px';if(c.barColor)b.style.background=c.barColor}td.appendChild(document.createTextNode(c.fmt?c.fmt(r[c.k]):r[c.k]))}})})};draw()};
// ---------- KPI tiles ----------
K.spark=(data,{w=96,h=28,color}={})=>{const mx=Math.max(...data),mn=Math.min(...data);const pts=data.map((v,i)=>`${i/(data.length-1)*w},${h-2-(v-mn)/(mx-mn||1)*(h-4)}`);const s=el('svg',{viewBox:`0 0 ${w} ${h}`,width:w,height:h});s.style.overflow='visible';el('polyline',{points:pts.join(' '),fill:'none',stroke:css('--ink3'),'stroke-width':1.5,'stroke-linejoin':'round'},s);const last=pts[pts.length-1].split(',');el('circle',{cx:last[0],cy:last[1],r:3,fill:color||css('--s1')},s);return s};
K.kpis=(node,items)=>{node.textContent='';items.forEach(it=>{const d=el('div',{cls:'k-kpi kpi'},node);el('div',{cls:'l',text:it.label},d);el('div',{cls:'v',text:it.value},d);
 if(it.delta!=null){const up=it.delta>=0,good=it.goodDown?!up:up;const dl=el('div',{cls:'d '+(good?'k-up':'k-dn'),text:(up?'▲ ':'▼ ')+(it.deltaText||K.pct(Math.abs(it.delta)))+(it.vs?' '+it.vs:'')},d)}if(it.sub)el('div',{cls:'s',text:it.sub},d);if(it.spark)d.appendChild(K.spark(it.spark))})};
// ---------- app wiring: sheets (tabs) + filters + resize ----------
K.app=({views,state,onChange,sheetSel='[data-sheet]',panelSel='[data-panel]'})=>{const S0=state;let cur=null;
 const go=name=>{cur=name;document.querySelectorAll(sheetSel).forEach(b=>{const on=b.dataset.sheet===name;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});document.querySelectorAll(panelSel).forEach(p=>p.hidden=p.dataset.panel!==name);K.tipHide();views[name]&&views[name](S0);try{history.replaceState(null,'','#'+name)}catch(e){}};
 document.querySelectorAll(sheetSel).forEach(b=>b.addEventListener('click',()=>go(b.dataset.sheet)));
 document.querySelectorAll('[data-f]').forEach(c=>{const ev=c.tagName==='SELECT'||c.tagName==='INPUT'?'change':'click';c.addEventListener(ev,()=>{const k=c.dataset.f;if(c.tagName==='SELECT'||c.tagName==='INPUT')S0[k]=c.value;else{S0[k]=c.dataset.v;document.querySelectorAll(`[data-f="${k}"]`).forEach(x=>x.classList.toggle('on',x===c))}onChange&&onChange(S0);document.querySelectorAll(panelSel).forEach(p=>p.style.opacity=.55);setTimeout(()=>{document.querySelectorAll(panelSel).forEach(p=>p.style.opacity='');go(cur)},120)})});
 let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>go(cur),150)});
 const first=(location.hash.slice(1)&&views[location.hash.slice(1)])?location.hash.slice(1):Object.keys(views)[0];const start=()=>go(first);document.fonts&&document.fonts.ready?document.fonts.ready.then(start):start();
 return{go,state:S0,refresh:()=>go(cur)}};
window.K=K;
})();
