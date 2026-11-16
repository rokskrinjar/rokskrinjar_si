/* Würth Slovenija (demo) — Sales Growth Engine: deset strategij rasti in izračun priložnosti za vse kupce.
   Skupno za strani 22 (Growth Engine) in 23 (Direktorjev brifing). Uporaba: const D = G.compute(W.load()).
   Vsaka priložnost: {s (strategija 1–10), cust | pros, rep, val (€ ob uspehu, 12 mes.), p (verjetnost), ev (= val × p), urg, title, why[]}. */
(function(root){'use strict';
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STR=[
 {id:1,name:'Novi kupci',en:'New Customer Acquisition',desc:'Sistematično prepoznavanje podjetij v divizijah Avto, Lesno-gradbena in Metal, ki še ne kupujejo pri Würthu, a ustrezajo profilu najuspešnejših kupcev.',ana:['lead scoring','potencial podjetja','prioritizacija obiskov'],cov:'part',need:'<b>Imamo:</b> zgodovino pridobitev in profil najboljših kupcev. <b>Potrebujemo:</b> register podjetij (AJPES / Bizi / Bisnode: dejavnost SKD, zaposleni, lokacija) in evidenco stikov v CRM. V demu: register 6.500 podjetij.',K:3.6,real:60},
 {id:2,name:'Vračanje izgubljenih',en:'Customer Win-back',desc:'Ponovno pridobivanje kupcev, ki so nekoč redno naročali, zdaj pa ne kupujejo več.',ana:['izgubljeni kupci','vzrok odhoda','potencial vrnitve'],cov:'full',need:'<b>Imamo:</b> zgodovino nakupov in datum odhoda iz računov. <b>Priporočeno:</b> razlog izgube v CRM (sicer ga ocenimo iz dogodkov: nezaseden teritorij, dostava, cene).',K:1.5,real:60},
 {id:3,name:'Preprečevanje odhoda',en:'Customer Retention',desc:'Prepoznati kupce, pri katerih se zmanjšuje pogostost nakupov, še preden jih izgubimo.',ana:['churn prediction','ritem naročanja','opozorila'],cov:'full',need:'<b>Imamo vse:</b> račune (ritem in upad naročil), obiske, dostavo, popuste.',K:2.4,real:60},
 {id:4,name:'Navzkrižna prodaja',en:'Cross-selling / White space',desc:'Povečati delež kupčevih nabav pri Würthu s kategorijami, ki jih podobni kupci kupujejo, ta kupec pa ne.',ana:['kupec × kategorija','pravila asociacij','naslednji najboljši izdelek'],cov:'full',need:'<b>Imamo vse:</b> račune po artiklih ter panogo in velikost kupca.',K:1.8,real:60},
 {id:5,name:'Upselling',en:'Upselling',desc:'Spodbujanje k nakupu kakovostnejših, profesionalnih izdelkov ali širših rešitev.',ana:['produktna priporočila','primerjava alternativ','produktni mix'],cov:'full',need:'<b>Imamo:</b> račune po artiklih. <b>Potrebujemo:</b> označen razred izdelka (osnovni / profesionalni / premium) in nadomestne artikle; v demu cenovni razred v podkategoriji.',K:1.4,real:60},
 {id:6,name:'Pogostost nakupov',en:'Purchase Frequency',desc:'Kupci naj naročajo pogosteje, poraba potrošnega blaga pa naj ne odteka h konkurenci.',ana:['napoved ponovnega naročila','napoved porabe','avtomatski opomniki'],cov:'full',need:'<b>Imamo vse:</b> datume in količine nakupov potrošnega blaga po kupcu in podkategoriji.',K:1.5,real:60},
 {id:7,name:'Ključni kupci',en:'Key Account Growth',desc:'Individualni načrti rasti z največjimi kupci: širitev na obrate, ki jih še ne oskrbujemo, in večji delež denarnice.',ana:['načrt računa','delež denarnice','potencial lokacij'],cov:'part',need:'<b>Imamo:</b> prodajo po kupcu. <b>Potrebujemo:</b> seznam obratov in zaposlenih po lokacijah (CRM, AJPES) ter oceno denarnice; v računih je ne vidimo.',K:2,real:60},
 {id:8,name:'Večkanalna prodaja',en:'Omnichannel Growth',desc:'Povezati teren, spletno trgovino, aplikacijo, trgovine in klicni center: svetovalec svetuje, ponavljajoča naročila gredo prek aplikacije.',ana:['uporaba kanalov','digitalna aktivacija','nakupne poti'],cov:'full',need:'<b>Imamo vse:</b> kanal na vsakem naročilu. <b>Priporočeno:</b> strošek obdelave naročila po kanalu iz controllinga (v demu ocena).',K:1.5,real:60},
 {id:9,name:'Skladiščne omare',en:'Automated Replenishment',desc:'Širjenje oskrbe prek avtomatiziranih omar pri kupcih, kjer se dobava sproži na podlagi porabe.',ana:['izbor primernih kupcev','napoved porabe','donosnost namestitve'],cov:'full',need:'<b>Imamo:</b> porabo potrošnega blaga in učinek prvih omar. <b>Za napoved porabe po omari:</b> telemetrija omar (odvzemi po artiklih).',K:3,real:60},
 {id:10,name:'Pametne cene',en:'Value-based Pricing',desc:'Namesto enakih popustov za vse: cenovni pogoji glede na segment, cenovno občutljivost in donosnost kupca.',ana:['cenovna elastičnost','uhajanje popustov','optimizacija marže'],cov:'part',need:'<b>Imamo:</b> ceniške in neto cene, popuste in odziv na akcije. <b>Potrebujemo za polno optimizacijo:</b> cene konkurence in pogodbene pogoje kupcev.',K:1.2,real:60}];
const WB={'Nezaseden teritorij':.35,'Težave z dostavo':.3,'Premalo stika':.3,'Cena / konkurenca':.18,'Konkurenca':.12,'Sprememba nabave':.1};
function compute(S){const F=S.fmt,U=W.util;
 const L=S.L,C=S.customers,nC=C.length,ND=S.ND,NM=S.NM,asOf=ND-1,d12=ND-365,d18=ND-548;
 const i12=S.dayStart[d12],i18=S.dayStart[d18];
 const BZ=new Uint8Array(nC),GR=new Uint8Array(nC);C.forEach(c=>{BZ[c.id]=S.branze.indexOf(c.branza);GR[c.id]=BZ[c.id]*4+c.si});
 const catNet=new Float32Array(nC*10),chOrd=new Uint16Array(nC*6),lst=new Float32Array(nC),net12=new Float32Array(nC),cons12=new Float32Array(nC),consOrd=new Uint16Array(nC);
 let maxO=0;for(let i=0;i<S.n;i++)if(L.ord[i]>maxO)maxO=L.ord[i];const seen=new Uint8Array(maxO+1),seenC=new Uint8Array(maxO+1);
 const tier=new Map(),buys=new Map(),gProd=new Map();const qP=new Float64Array(7*64),nP=new Float64Array(7*64),qN=new Float64Array(7*64),nN=new Float64Array(7*64);
 const SUBC=S.subs.map(s=>s.consumable);
 for(let i=i18;i<S.n;i++){const c=L.cust[i],sb=L.sub[i],d=L.day[i],v=L.net[i];
  if(SUBC[sb]){const k=c*64+sb;let b=buys.get(k);if(!b)buys.set(k,b={d:[],v:[]});const n=b.d.length;if(n&&b.d[n-1]===d)b.v[n-1]+=v;else{b.d.push(d);b.v.push(v)}}
  if(i<i12)continue;
  catNet[c*10+L.cat[i]]+=v;lst[c]+=L.list[i];net12[c]+=v;const o=L.ord[i];if(!seen[o]){seen[o]=1;chOrd[c*6+L.chan[i]]++}
  if(SUBC[sb]){cons12[c]+=v;if(!seenC[o]){seenC[o]=1;consOrd[c]++}}
  const p=S.products[L.prod[i]];const k=c*64+sb;let t=tier.get(k);if(!t)tier.set(k,t=[0,0,0]);t[p.tier]+=v;
  const gk=GR[c]*2048+L.prod[i];gProd.set(gk,(gProd.get(gk)||0)+v);
  const bk=BZ[c]*64+sb;if(L.promo[i]){qP[bk]+=L.qty[i];nP[bk]++}else{qN[bk]+=L.qty[i];nN[bk]++}}
 // naročila po kupcu (vsa zgodovina) za preverjanje modela odliva
 const od=Array.from({length:nC},()=>[]);{const sn=new Uint8Array(maxO+1);for(let i=0;i<S.n;i++){const o=L.ord[i];if(sn[o])continue;sn[o]=1;od[L.cust[i]].push(L.day[i])}}
 const active=c=>c.status!=='Izgubljen'&&net12[c.id]>0;
 const opps=[];const add=o=>{o.key=o.s+':'+(o.cust!=null?'c'+o.cust:'p'+o.pros)+(o.k?':'+o.k:'');opps.push(o)};
 const fieldActive=S.reps.filter(r=>r.role==='Terenski svetovalec'&&!r.left);
 const callReps=S.reps.filter(r=>r.role==='Klicni center');
 const repFor=(b,rg)=>{const a=fieldActive.filter(r=>r.branza===b);return(a.find(r=>r.region===rg)||a[0]||fieldActive[0]).id};
 const med=a=>U.median(a);
 const groups=Array.from({length:28},()=>[]);C.forEach(c=>{if(active(c))groups[GR[c.id]].push(c.id)});
 const EV={};
 // ===== 4 navzkrižna prodaja =====
 const bas=S.basket({from:d12,level:'cat'});const lift=(a,b)=>bas.occ[a]&&bas.occ[b]?bas.co[a*10+b]*bas.orders/(bas.occ[a]*bas.occ[b]):0;
 const pen=new Float32Array(28*10),pmed=new Float32Array(28*10);
 groups.forEach((g,gi)=>{if(g.length<12)return;for(let k=0;k<10;k++){const sp=g.map(id=>catNet[id*10+k]).filter(v=>v>=50);pen[gi*10+k]=sp.length/g.length;pmed[gi*10+k]=sp.length?med(sp):0}});
 C.forEach(c=>{if(!active(c)||net12[c.id]<300)return;const gi=GR[c.id];const cand=[];
  for(let k=0;k<10;k++){if(catNet[c.id*10+k]>=20||pen[gi*10+k]<.45)continue;const val=pmed[gi*10+k]*.6;const p=Math.min(.45,.1+.3*pen[gi*10+k]);cand.push({k,val,p,ev:val*p})}
  cand.sort((a,b)=>b.ev-a.ev).slice(0,2).forEach(x=>{let best=-1,bl=0;for(let j=0;j<10;j++)if(catNet[c.id*10+j]>=100){const l=lift(j,x.k);if(l>bl){bl=l;best=j}}
   add({s:4,cust:c.id,rep:c.rep,k:x.k,val:x.val,p:x.p,ev:x.ev,urg:1,title:`Ponudi ${S.cats[x.k].name.toLowerCase()}`,
    why:[`${F.pct(pen[gi*10+x.k],0)} podobnih kupcev (${c.branza}, velikost ${c.size}) kupuje to kategorijo — mediana ${F.eur(pmed[gi*10+x.k])} na leto.`,`${esc(c.name)} je v zadnjih 12 mesecih ni kupil(a) pri nas.`,best>=0&&bl>1.1?`Kupuje ${S.cats[best].name.toLowerCase()}, s katero se ta kategorija v naročilih pojavlja ${F.dec(bl,1)}-krat pogosteje od naključja.`:`Predlog: vzorec ali predstavitev ob naslednjem obisku.`]})})});
 // ===== 5 upselling =====
 const gSub=new Map();for(const[k,t]of tier){const c=Math.floor(k/64),sb=k%64;const gk=GR[c]*64+sb;let a=gSub.get(gk);if(!a)gSub.set(gk,a=[0,0,0]);a[0]+=t[0];a[1]+=t[1];a[2]+=t[2]}
 const topPro=new Map();for(const[k,v]of gProd){const g=Math.floor(k/2048),p=S.products[k%2048];if(p.tier<1)continue;const kk=g*64+p.sub;const cur=topPro.get(kk);if(!cur||cur.v<v)topPro.set(kk,{v,p})}
 for(const[k,t]of tier){const cid=Math.floor(k/64),sb=k%64,c=C[cid];if(!active(c))continue;const tot=t[0]+t[1]+t[2];if(tot<150)continue;const pro=(t[1]+t[2])/tot;
  const g=gSub.get(GR[cid]*64+sb);const gt=g[0]+g[1]+g[2];const gpro=(g[1]+g[2])/gt;if(pro>.3||gpro<.55)continue;const tp=topPro.get(GR[cid]*64+sb);if(!tp)continue;
  const val=tot*.35*(gpro-pro);const p=.3;add({s:5,cust:cid,rep:c.rep,k:sb,val,p,ev:val*p,urg:1,title:`Predstavi profesionalno izbiro: ${tp.p.name}`,prod:tp.p.id,
   why:[`V »${S.subs[sb].name}« kupuje ${F.pct(1-pro,0)} osnovnih izdelkov; podobni kupci le ${F.pct(1-gpro,0)}.`,`Poraba v podkategoriji: ${F.eur(tot)} v zadnjih 12 mesecih.`,`Najpogostejša profesionalna izbira vrstnikov: ${tp.p.name} (${S.tiers[tp.p.tier]}, ${F.eur2(tp.p.list)}).`]})}
 // ===== 6 pogostost / ponovno naročilo =====
 const due=new Map();const rb={n:0,in7:0,naive7:0,err:[]};const T0=asOf-120;
 for(const[k,b]of buys){const cid=Math.floor(k/64),sb=k%64,c=C[cid];const n=b.d.length;if(n<4)continue;
  const gaps=[];for(let j=1;j<n;j++)gaps.push(b.d[j]-b.d[j-1]);const g=Math.round(med(gaps));if(g<7)continue;
  // preverjanje: napoved naslednjega nakupa na dan T0
  {let j=-1;for(let q=0;q<n;q++)if(b.d[q]<=T0)j=q;if(j>=3&&j<n-1){const gg=[];for(let q=1;q<=j;q++)gg.push(b.d[q]-b.d[q-1]);const pred=b.d[j]+med(gg),act=b.d[j+1];const e=act-Math.max(pred,T0);rb.n++;if(Math.abs(e)<=7)rb.in7++;if(Math.abs(act-Math.max(b.d[j]+30,T0))<=7)rb.naive7++;rb.err.push(Math.max(-60,Math.min(60,e)))}}
  if(!active(c))continue;const last=b.d[n-1],ds=asOf-last,avgV=U.avg(b.v.slice(-6));
  if(ds>=.9*g&&ds<=2*g){let a=due.get(cid);if(!a)due.set(cid,a=[]);a.push({sb,g,ds,v:avgV})}
  else if(ds>2.6*g&&c.daysSince!=null&&c.daysSince<60){const annual=avgV*365/g;const val=annual*.5,p=.35;add({s:6,cust:cid,rep:c.rep,k:'l'+sb,val,p,ev:val*p,urg:1.1,title:`Ugotovi, kam je odšla poraba: ${S.subs[sb].name}`,
   why:[`Običajno vsakih ${g} dni (${F.eur(avgV)} na nakup), zadnjič pred ${ds} dnevi.`,`Druga naročila oddaja redno (zadnje pred ${c.daysSince} dnevi) → poraba verjetno odteka h konkurenci.`,`Letna vrednost porabe: ${F.eur(annual)}.`]})}}
 for(const[cid,a]of due){const c=C[cid];a.sort((x,y)=>y.v-x.v);const val=U.sum(a.map(x=>x.v));const p=.7;const rep=c.si===0&&callReps.length?callReps[cid%callReps.length].id:c.rep;
  add({s:6,cust:cid,rep,k:'d',val,p,ev:val*p,urg:1.3,title:`Predlagaj naročilo: ${a.length===1?S.subs[a[0].sb].name.toLowerCase():a.length+' artiklov zapade'}`,
   why:a.slice(0,3).map(x=>`${S.subs[x.sb].name}: običajno vsakih ${x.g} dni, zadnjič pred ${x.ds} dnevi (~${F.eur(x.v)}).`).concat(rep!==c.rep?['Mali kupec → opomnik pokliče klicni center.']:[])})}
 // ===== 3 preprečevanje odhoda =====
 const r3=c=>{const o=c.id*NM;let a=0,b=0;for(let m=33;m<=35;m++){a+=S.cube.custMonth[o+m];b+=S.cube.custMonth[o+m-12]}return b>0?a/b:null};
 const noVisit=c=>{let v=0;for(let m=33;m<=35;m++)v+=S.visitCM[m][c.id];return v===0};
 C.forEach(c=>{if(!active(c)||c.rev12<300||!c.cadence||c.overdue==null)return;const rr=r3(c);const dec=c.status==='V upadu';if(c.overdue<1.8&&!(rr!=null&&rr<.55)&&!dec)return;
  if(rr!=null&&rr>1.1&&c.overdue<4&&!dec)return;const p=Math.min(.85,Math.max(.05,.08+.12*(c.overdue-1.5)+(rr!=null&&rr<.6?.15:0)+(dec?.25:0)));const val=c.rev12*.55;
  const why=[`Običajno naroča vsakih ${c.cadence} dni, zadnje naročilo pred ${c.daysSince} dnevi (${F.dec(c.overdue,1)}× daljši premor).`];
  if(rr!=null&&rr<.95)why.push(`Zadnji 3 meseci ${F.delta(rr-1,0)} glede na isto obdobje lani.`);else if(rr!=null)why.push(`Prodaja zadnjih 3 mesecev je še na lanski ravni (${F.delta(rr-1,0)}) — premor je zgodnji signal.`);
  if(noVisit(c))why.push('V zadnjih treh mesecih ni bilo obiska svetovalca.');else why.push(`Prodaja zadnjih 12 mesecev: ${F.eur(c.rev12)}.`);
  add({s:3,cust:c.id,rep:c.rep,val,p,ev:val*p,urg:c.overdue>2.5||dec?1.5:1.2,title:dec||c.overdue>3?'Obisk s ponudbo za zadržanje':'Pokliči in preveri zadovoljstvo',why})});
 // preverjanje (backtest): ritem na dan TB → odliv v naslednjih 6 mesecih
 const TB=asOf-183;const bands=[[0,1,'pod 1×'],[1,1.5,'1–1,5×'],[1.5,2.5,'1,5–2,5×'],[2.5,4,'2,5–4×'],[4,99,'nad 4×']].map(b=>({b,n:0,lost:0}));let bN=0,bL=0;
 C.forEach(c=>{if(c.acqDay>TB-180||(c.churnDay!=null&&c.churnDay<=TB))return;const a=od[c.id].filter(d=>d<=TB&&d>TB-365);if(a.length<3)return;const g=[];for(let j=1;j<a.length;j++)if(a[j]>a[j-1])g.push(a[j]-a[j-1]);if(g.length<2)return;
  const ratio=(TB-a[a.length-1])/med(g);const lost=c.churnDay!=null&&c.churnDay>TB;bN++;if(lost)bL++;const bb=bands.find(x=>ratio>=x.b[0]&&ratio<x.b[1]);if(bb){bb.n++;if(lost)bb.lost++}});
 // ===== 2 vračanje izgubljenih =====
 const cmo=S.cube.custMonth;
 C.forEach(c=>{if(c.status!=='Izgubljen'||c.closedBusiness||c.churnDay==null||c.churnDay<ND-730)return;const cm=S.monthOfDay[c.churnDay];let pre=0;for(let m=Math.max(0,cm-15);m<=cm-4;m++)pre+=cmo[c.id*NM+m];if(pre<400)return;
  const ms=(asOf-c.churnDay)/30.4;const pw=(WB[c.churnCause]||.1)*Math.exp(-ms/18);const val=pre*.7;const rep=S.rep(c.rep);
  const fix=c.churnCause==='Težave z dostavo'?`Dostava v roku je spet ${F.pct(S.otif[35],1)} (ob selitvi ${F.pct(S.otif[S.move.m0],1)}).`:c.churnCause==='Nezaseden teritorij'?`Teritorij ima zdaj svetovalca: ${rep?rep.name:'—'}.`:c.churnCause==='Premalo stika'?'Predlog: osebni obisk in predstavitev novosti (potrošno blago, aplikacija).':c.churnCause==='Cena / konkurenca'?'Predlog: ciljana cena na ključnih artiklih, ki jih je kupoval.':'Predlog: preveri, ali se je spremenila nabava ali lastništvo.';
  add({s:2,cust:c.id,rep:c.rep,val,p:pw,ev:val*pw,urg:1,title:c.churnCause==='Nezaseden teritorij'?'Predstavi novega svetovalca in ponudbo za vrnitev':c.churnCause==='Težave z dostavo'?'Opravičilo, dokaz boljše dostave in uvodna ponudba':'Ponudba za vrnitev',
   why:[`Pred odhodom ${F.eur(pre)} na leto; zadnje naročilo ${F.date(c.lastOrder)} (pred ${Math.round(ms)} meseci).`,`Razlog odhoda (CRM): ${c.churnCause}.`,fix]})});
 // ===== 1 novi kupci (lead scoring) =====
 const P=S.prospects;const eb=e=>e<2?0:e<5?1:e<10?2:e<50?3:4,EB=['1','2–4','5–9','10–49','50+'],kb=k=>k<15?0:k<35?1:2,KB=['do 15 km','15–35 km','nad 35 km'];
 const covAt=(b,rg,m)=>S.reps.some(r=>r.role==='Terenski svetovalec'&&r.branza===b&&r.region===rg&&r.hired<=S.months[m].end&&!(r.left&&r.left<S.months[m].start))?1:0;
 const feats=(p,m)=>[S.branze.indexOf(p.branza),eb(p.employees),kb(p.branchKm),covAt(p.branza,p.region,m)];const FN=[7,5,3,2];
 function nb(rows){// rows [{f,y}] → model
  const n1=rows.filter(r=>r.y).length,n0=rows.length-n1;const cnt=FN.map(k=>[new Float64Array(k),new Float64Array(k)]);rows.forEach(r=>r.f.forEach((v,j)=>cnt[j][r.y?1:0][v]++));
  return{prior:(n1+1)/(rows.length+2),score:f=>{let lo=Math.log((n1+1)/(n0+1));f.forEach((v,j)=>{lo+=Math.log((cnt[j][1][v]+1)/(n1+FN[j]))-Math.log((cnt[j][0][v]+1)/(n0+FN[j]))});return 1/(1+Math.exp(-lo))},cnt,n1,n0}}
 const dT=S.months[18].d0;const train=P.map(p=>({f:feats(p,18),y:p.convertedDay!=null&&p.convertedDay<dT}));const mT=nb(train);
 const test=P.filter(p=>p.convertedDay==null||p.convertedDay>=dT).map(p=>({s:mT.score(feats(p,18)),y:p.convertedDay!=null}));test.sort((a,b)=>b.s-a.s);
 const dec=Array.from({length:10},(_,i)=>{const sl=test.slice(Math.floor(i*test.length/10),Math.floor((i+1)*test.length/10));return sl.filter(x=>x.y).length/Math.max(1,sl.length)});const testBase=test.filter(x=>x.y).length/test.length;
 const mF=nb(P.map(p=>({f:feats(p,35),y:p.convertedDay!=null})));
 // prva letna prodaja pridobljenih kupcev po velikosti
 const fyB=Array.from({length:5},()=>[]);C.forEach(c=>{if(c.prospect==null||c.acqDay<0||c.acqDay>ND-365)return;const m0=S.monthOfDay[c.acqDay];let s=0;for(let m=m0;m<Math.min(NM,m0+12);m++)s+=cmo[c.id*NM+m];fyB[eb(c.employees)].push(s)});const fyM=fyB.map((a,i)=>a.length>=5?med(a):[300,600,1100,2600,6000][i]);
 const base36=mF.n1/(mF.n1+mF.n0);
 P.forEach(p=>{if(p.customer!=null)return;const p36=mF.score(feats(p,35));const p12=1-Math.pow(1-p36,1/3);const fy=fyM[eb(p.employees)];p._p12=p12;p._fy=fy;
  if(p12<.06)return;const br=S.branches[p.branch];
  add({s:1,pros:p.id,rep:repFor(p.branza,p.region),val:fy,p:p12,ev:fy*p12,urg:1,title:`Prvi obisk: ${p.name}`,
   why:[`Profil kot pri pridobljenih kupcih: ${p.branza}, ${p.employees} zaposl., ${p.branchKm} km do trgovine ${br?br.town:''}.`,`Verjetnost pridobitve v 12 mesecih ${F.pct(p12,0)} (povprečje registra ${F.pct(1-Math.pow(1-base36,1/3),0)}).`,`Pričakovana prva letna prodaja ${F.eur(fy)}; potencial denarnice ${F.eur(p.potential)} na leto.`]})});
 // ===== 7 ključni kupci =====
 let siteUp=[];C.forEach(c=>{if(!c.sites)return;c.sites.forEach(s=>{if(!s.since)return;const m=S.dayOf(s.since)>=0?S.monthOfDay[S.dayOf(s.since)]:null;if(m==null||m<6||m>29)return;let a=0,b=0;for(let k=1;k<=6;k++){a+=cmo[c.id*NM+m+k-1];b+=cmo[c.id*NM+m-k]}if(b>0)siteUp.push(a/b-1)})});
 const siteUpM=siteUp.length?med(siteUp):.3;
 C.forEach(c=>{if(!active(c))return;if(c.sites){const un=c.sites.filter(s=>!s.served);const sv=c.sites.length-un.length;un.sort((a,b)=>b.potential-a.potential).slice(0,2).forEach((s,j)=>{const val=s.potential*.35,p=.3;
   add({s:7,cust:c.id,rep:c.rep,k:'s'+j,val,p,ev:val*p,urg:1,title:`Predstavi oskrbo obrata ${s.town}`,why:[`Oskrbujemo ${sv} od ${c.sites.length} obratov.`,`Obrat ${s.town}: ${s.employees} zaposlenih, ocenjen potencial ${F.eur(s.potential)} na leto.`,`Pri kupcih, kjer smo odprli nov obrat, je prodaja v 6 mesecih zrasla za ${F.pct(siteUpM,0)}.`]})})}
  else if(c.si>=2&&c.potential>0&&c.rev12/c.potential<.35){const val=Math.max(0,c.potential*.45-c.rev12),p=.2;if(val<1500)return;
   add({s:7,cust:c.id,rep:c.rep,k:'w',val,p,ev:val*p,urg:1,title:'Načrt računa: večji delež denarnice',why:[`Delež denarnice ${F.pct(c.rev12/c.potential,0)} (prodaja ${F.eur(c.rev12)} od ocenjenih ${F.eur(c.potential)}).`,`${c.employees} zaposlenih, ${c.branza}, velikost ${c.size}.`,'Predlog: letni pogovor o nabavi in okvirna pogodba za potrošno blago.']})}});
 // ===== 8 omnikanal =====
 const dd=(cond)=>{let a=[];C.forEach(c=>{if(!cond(c))return;const m=S.monthOfDay[Math.max(0,S.dayOf(c.eshopSince))];if(m<6||m>29)return;let x=0,y=0;for(let k=1;k<=6;k++){x+=cmo[c.id*NM+m+k-1];y+=cmo[c.id*NM+m-k]}if(y>200)a.push({m,g:x/y-1})});return a};
 const adop=dd(c=>c.eshop&&c.eshopSince&&c.acqDay<0);const ctrl=m=>{let x=0,y=0;C.forEach(c=>{if(c.eshop||c.acqDay>=0)return;for(let k=1;k<=6;k++){x+=cmo[c.id*NM+m+k-1];y+=cmo[c.id*NM+m-k]}});return y?x/y-1:0};
 const ctrlM=new Map();adop.forEach(a=>{if(!ctrlM.has(a.m))ctrlM.set(a.m,ctrl(a.m))});const digUp=adop.length?U.avg(adop.map(a=>a.g-ctrlM.get(a.m))):.08;
 const CT=S.costToServe.order;
 C.forEach(c=>{if(!active(c)||c.eshop)return;const o=chOrd.subarray(c.id*6,c.id*6+6);const tot=U.sum(o);if(tot<6)return;const fc=o[0]+o[4];if(fc/tot<.7)return;const aov=net12[c.id]/tot;if(aov>300)return;
  const save=(o[0]*(CT[0]-CT[3])+o[4]*(CT[4]-CT[3]))*.6;const val=c.rev12*Math.max(.04,digUp),p=.4;
  add({s:8,cust:c.id,rep:c.rep,val,p,ev:val*p,save,urg:1,title:'Aktiviraj aplikacijo za ponavljajoča naročila',why:[`${tot} naročil v 12 mesecih, povprečno ${F.eur(aov)}; ${F.pct(fc/tot,0)} prek terena in klicnega centra.`,`Kupci po prehodu na e-shop/aplikacijo kupujejo ${F.pct(Math.max(.04,digUp),0)} več kot primerljivi (6 mesecev pred/po).`,`Prihranek stroška obdelave ~${F.eur(save)} na leto; svetovalec ima več časa za svetovanje.`]})});
 // ===== 9 skladiščne omare =====
 const cabs=C.filter(c=>c.cabinetSince);const cabUp=[];cabs.forEach(c=>{const m=S.monthOfDay[S.dayOf(c.cabinetSince)];if(m>29)return;let x=0,y=0;for(let k=1;k<=6;k++){x+=cmo[c.id*NM+m+k-1];y+=cmo[c.id*NM+m-k]}let cx=0,cy=0;C.forEach(o=>{if(o.si<2||o.cabinetSince||o.acqDay>=0)return;for(let k=1;k<=6;k++){cx+=cmo[o.id*NM+m+k-1];cy+=cmo[o.id*NM+m-k]}});if(y>0&&cy>0)cabUp.push({c,g:x/y-1,ctl:cx/cy-1})});
 const cabUpM=cabUp.length?U.avg(cabUp.map(x=>x.g-x.ctl)):.15;const gmC=.55;const E=S.cabinetEcon;
 C.forEach(c=>{if(!active(c)||c.cabinetSince||cons12[c.id]<4500||consOrd[c.id]<10)return;const up=cons12[c.id]*Math.max(.05,cabUpM);const save=consOrd[c.id]*.5*(CT[0]-CT[5]);const monthlyGain=(up*gmC+save)/12-E.monthly;const pay=monthlyGain>0?E.install/monthlyGain:null;if(!pay||pay>36)return;const p=.35;
  add({s:9,cust:c.id,rep:c.rep,val:up,p,ev:up*p,pay,urg:1,title:'Predlagaj skladiščno omaro',why:[`Potrošno blago ${F.eur(cons12[c.id])} na leto v ${consOrd[c.id]} naročilih.`,`Pri ${cabUp.length} kupcih z omaro je prodaja v 6 mesecih zrasla za ${F.pct(cabUpM,0)} več kot pri primerljivih.`,`Povračilo naložbe (${F.eur(E.install)} + ${F.eur(E.monthly)}/mes.) v ~${Math.round(pay)} mesecih.`]})});
 // ===== 10 cene =====
 const promoLift=S.branze.map((b,bi)=>{let w=0,s=0;for(let sb=0;sb<64;sb++){const k=bi*64+sb;if(nP[k]<15||nN[k]<40)continue;s+=nP[k]*(qP[k]/nP[k])/(qN[k]/nN[k]);w+=nP[k]}return w?s/w:1});
 const liftMed=U.quantile(promoLift,.7);
 const disc=new Float32Array(nC);C.forEach(c=>{disc[c.id]=lst[c.id]?1-net12[c.id]/lst[c.id]:0});const gDisc=groups.map(g=>g.length>=10?med(g.map(id=>disc[id])):null);
 C.forEach(c=>{if(!active(c)||net12[c.id]<1500)return;const pm=gDisc[GR[c.id]];if(pm==null)return;const ex=disc[c.id]-pm;if(ex<.02)return;const low=promoLift[BZ[c.id]]<=liftMed;if(!low||(c.overdue!=null&&c.overdue>1.5))return;
  const step=Math.min(ex-.005,.03);const val=net12[c.id]*step,p=.6;
  add({s:10,cust:c.id,rep:c.rep,val,p,ev:val*p,urg:1,title:`Uskladi popust z vrstniki (−${F.dec(step*100,1)} o.t.)`,why:[`Povprečni popust ${F.pct(disc[c.id])} proti ${F.pct(pm)} pri podobnih kupcih (${c.branza}, ${c.size}).`,`Panoga ${c.branza} se na akcije odziva zmerno (količina +${F.pct(promoLift[BZ[c.id]]-1,0)} pri akcijski ceni) → nizka cenovna občutljivost.`,`Kupec naroča redno (${c.orders12} naročil v 12 mesecih), brez znakov odhoda.`]})});
 // povzetki
 STR.forEach(s=>EV[s.id]=0);opps.forEach(o=>EV[o.s]+=o.ev);
 const v=S.periods;const ytd=S.total({from:v.ytd[0],to:v.ytd[1]}).net,pytd=S.total({from:v.pytd[0],to:v.pytd[1]}).net;const nd25=S.cube.total[24]+S.cube.total[25];
 const landing=ytd+nd25*(ytd/pytd);
 const fieldReps=S.reps.filter(r=>r.role==='Terenski svetovalec'&&!r.left).length;const fieldNet=S.total({from:v.l12[0],to:v.l12[1],filter:{chan:0}}).net;const perRep=fieldNet/fieldReps;
 return{opps,EV,landing,perRep,fieldReps,ytd,pytd,bands,bN,bL,dec,testBase,rb,promoLift,gDisc,disc,cabUp,cabUpM,siteUp,siteUpM,digUp,adop,fyM,EB,KB,mF,feats,eb,kb,net12,cons12,catNet,chOrd,base36,WB};
}
root.G={STR,WB,compute,SI:id=>STR[id-1]};
})(typeof window!=='undefined'?window:globalThis);
