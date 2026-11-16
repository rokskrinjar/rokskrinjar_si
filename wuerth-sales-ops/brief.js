/* Würth Slovenija (demo) — Direktorjev brifing: izračun prizorov in besedilo pripovedi.
   Skupno za stran 23 in za snemanje glasu (wuerth/tools/brief-voice.js). Uporaba: const M = B.model(S, G.compute(S)); B.narration(S, M). */
(function(root){'use strict';
function model(S,D){const F=S.fmt,U=W.util;const NM=36,cm=S.cube.custMonth,C=S.customers,P=S.periods;
 const ytd=S.total({from:P.ytd[0],to:P.ytd[1]}).net,pytd=S.total({from:P.pytd[0],to:P.pytd[1]}).net,y25=S.total({from:P.y2025[0],to:P.y2025[1]}).net;
 let plan=S.budgetNovDec.total[0]+S.budgetNovDec.total[1];for(let m=26;m<=35;m++)plan+=S.budget.total[m];
 const land=D.landing;
 // most lani → letos (jan–okt)
 let neu=0,lost=0,ex0=0,ex1=0;C.forEach(c=>{let a=0,b=0;for(let m=26;m<=35;m++){a+=cm[c.id*NM+m];b+=cm[c.id*NM+m-12]}if(b<=0&&a>0)neu+=a;else if(a<=0&&b>0)lost-=b;else if(a>0&&b>0){ex0+=b;ex1+=a}});
 const price=ex0*.029,vol=(ex1-ex0)-price;
 // tveganje
 const risk=D.opps.filter(o=>o.s===3).map(o=>({c:S.cust(o.cust),ev:o.ev})).filter(x=>x.c.lon);risk.sort((a,b)=>b.c.rev12-a.c.rev12);const riskV=U.sum(risk.map(x=>x.c.rev12));let acc=0,half=0;for(const x of risk){acc+=x.c.rev12;half++;if(acc>=riskV/2)break}
 const byReg={};risk.forEach(x=>{byReg[x.c.region]=(byReg[x.c.region]||0)+x.c.rev12});const topReg=Object.entries(byReg).sort((a,b)=>b[1]-a[1])[0];
 // pot 2033
 const base33=land*Math.pow(1.03,7);const contrib=G.STR.map(s=>({s,ev:D.EV[s.id],c:D.EV[s.id]*s.K*.6}));const strat=U.sum(contrib.map(x=>x.c));const tot33=base33+strat;const gap33=S.annual.target2033-tot33;const reps33=Math.ceil(Math.max(0,gap33)/D.perRep);
 // ekipa
 const ra=S.agg({by:['rep'],from:P.ytd[0],to:P.ytd[1]});const act=new Map(ra.map(r=>[r.rep,r.net]));
 const vis=(id,d0,d1)=>{let v=0;for(let d=d0;d<=d1;d++)v+=S.visitRepDay(id,d);return v};
 const team=S.reps.filter(r=>r.role==='Terenski svetovalec'&&!r.left&&r.hired<new Date(2025,0,1)).map(r=>{const pl=S.planSum(S.budget.rep,r.id,26,35);const a=act.get(r.id)||0;return{r,pl,a,ach:pl>0?a/pl:0}}).filter(x=>x.pl>50000);
 team.forEach(x=>{const cs=C.filter(c=>c.rep===x.r.id);let ln=0,lv=0,nn=0;cs.forEach(c=>{let a=0,b=0;for(let m=26;m<=35;m++){a+=cm[c.id*NM+m];b+=cm[c.id*NM+m-12]}if(b>0&&a<=0){ln++;lv+=b}if(b<=0&&a>0)nn++});x.lostN=ln;x.lostV=lv;x.newN=nn;const v1=vis(x.r.id,P.ytd[0],P.ytd[1]),v0=vis(x.r.id,P.pytd[0],P.pytd[1]);x.visD=v0?v1/v0-1:0});
 const srt=team.slice().sort((a,b)=>a.ach-b.ach);const worst=srt.slice(0,2),best=srt[srt.length-1];const above=team.filter(x=>x.ach>=1).length;
 // odločitve
 const cov=new Set(S.reps.filter(r=>r.role==='Terenski svetovalec'&&!r.left).map(r=>r.branza+'|'+r.region));const combos={};
 S.prospects.forEach(p=>{if(p.customer!=null||p._p12==null)return;const k=p.branza+'|'+p.region;if(cov.has(k))return;const o=combos[k]||(combos[k]={b:p.branza,rg:p.region,n:0,v:0,w:0});o.n++;o.v+=(1-Math.pow(1-p._p12,3))*p._fy;o.w+=p.potential});
 const hire=Object.values(combos).filter(o=>o.n>=10).sort((a,b)=>b.v-a.v).slice(0,3);const hireV=hire.length*D.perRep*.5;const hireW=U.sum(hire.map(o=>o.w));const repCost=S.annual.y2025.laborCost/S.annual.y2025.avgEmployees;
 const cab=D.opps.filter(o=>o.s===9).sort((a,b)=>b.ev-a.ev).slice(0,10);const cabV=U.sum(cab.map(o=>o.val));const cabPay=cab.length?U.median(cab.map(o=>o.pay)):0;
 const ret=D.opps.filter(o=>o.s===3).sort((a,b)=>b.ev-a.ev).slice(0,40);const retStake=U.sum(ret.map(o=>S.cust(o.cust).rev12));const retEv=U.sum(ret.map(o=>o.ev));
 return{ytd,pytd,y25,plan,land,neu,lost,price,vol,risk,riskV,half,topReg,base33,contrib,strat,tot33,gap33,reps33,team,worst,best,above,hire,hireV,hireW,repCost,cab,cabV,cabPay,ret,retStake,retEv}}
// ---------- besedilo pripovedi: vsak stavek ima obliko za glas (števila z besedami) in za podnapis (števke) ----------
const U1=['nič','ena','dve','tri','štiri','pet','šest','sedem','osem','devet','deset','enajst','dvanajst','trinajst','štirinajst','petnajst','šestnajst','sedemnajst','osemnajst','devetnajst'];
const T10=['','','dvajset','trideset','štirideset','petdeset','šestdeset','sedemdeset','osemdeset','devetdeset'];const UC=['','ena','dva','tri','štiri','pet','šest','sedem','osem','devet'];
const w99=n=>{if(n<20)return U1[n];const t=Math.floor(n/10),u=n%10;return u?UC[u]+'in'+T10[t]:T10[t]};
const w999=n=>{const h=Math.floor(n/100),r=n%100;const hs=h===0?'':h===1?'sto':h===2?'dvesto':UC[h]+'sto';return[hs,r?w99(r):''].filter(Boolean).join(' ')||'nič'};
const num=n=>{n=Math.round(Math.abs(n));if(n<1000)return w999(n);const th=Math.floor(n/1000),r=n%1000;const ts=th===1?'tisoč':th===2?'dva tisoč':w999(th)+' tisoč';return r?ts+' '+w999(r):ts};
const cel=ip=>ip===1?'cela':ip===2?'celi':ip===3||ip===4?'cele':'celih';
const mio=v=>{const r=Math.round(Math.abs(v)/1e5)/10,ip=Math.floor(r+1e-9),d=Math.round((r-ip)*10);if(!d)return ip===1?'en milijon evrov':ip===2?'dva milijona evrov':ip<=4?num(ip)+' milijone evrov':num(ip)+' milijonov evrov';return`${num(ip)} ${cel(ip)} ${num(d)} milijona evrov`};
const k=v=>{v=Math.abs(v);if(v>=995000)return mio(v);const t=Math.max(1,Math.round(v/1e3));return(t===1?'tisoč':num(t)+' tisoč')+' evrov'};
const pct=f=>{const n=Math.round(Math.abs(f)*100);return n===1?'en odstotek':n===2?'dva odstotka':n===3||n===4?num(n)+' odstotke':num(n)+' odstotkov'};
const pct1=f=>{const r=Math.round(Math.abs(f)*1000)/10,ip=Math.floor(r+1e-9),d=Math.round((r-ip)*10);if(!d)return pct(f);return`${num(ip)} ${cel(ip)} ${num(d)} odstotka`};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const regLoc=name=>name==='Jugovzhodna Slovenija'?'jugovzhodni Sloveniji':name.toLowerCase().replace(/a$/,'i')+' regiji';
const W_={num,mio,k,pct,pct1};
// L`…${V}…` → {say, show}; V = {s: za glas, d: za podnapis} ali navaden niz
const L=(strs,...vals)=>{let say='',show='';strs.forEach((s,i)=>{say+=s;show+=s;if(i<vals.length){const v=vals[i];say+=typeof v==='object'?v.s:v;show+=typeof v==='object'?v.d:v}});return{say:say.replace(/\.{2,}/g,'.'),show:show.replace(/\.{2,}/g,'.')}};
function narration(S,M){const F=S.fmt,dm=v=>F.dec(Math.abs(v)/1e6,1)+' mio €';
 const MIO=v=>({s:mio(v),d:dm(v)}),K=v=>({s:k(v),d:Math.abs(v)>=995000?dm(v):F.eurK(Math.abs(v))}),N=n=>({s:num(n),d:F.num(n)}),NC=n=>({s:cap(num(n)),d:F.num(n)}),P=f=>({s:pct(f),d:F.pct(Math.abs(f),0)}),P1=f=>({s:pct1(f),d:F.pct(Math.abs(f),1)}),Y=(s,d)=>({s,d});
 const below=M.land<M.plan;const even=Math.abs(M.neu+M.lost)<.25*M.neu,lostBig=-M.lost>M.neu;
 const top3=M.contrib.slice().sort((a,b)=>b.c-a.c).slice(0,3).map(x=>x.s.name.toLowerCase());
 const why=x=>x.lostN>=3&&x.visD>-.03?L`Ne gre za manj obiskov, ampak za izgubljene kupce.`:x.visD<=-.05?L`Obiskov je manj kot lani.`:null;
 const nh=M.hire.length,y26=Y('dva tisoč šestindvajset','2026'),y33=Y('dva tisoč triintrideset','2033'),t375=Y('sedemintrideset celih pet milijona evrov','37,5 mio €');
 return[
  [L`Dober dan. To je brifing prodaje za oktober ${y26}.`,L`Leto bomo po oceni zaključili pri ${MIO(M.land)}.`,below?L`To je ${MIO(M.plan-M.land)} pod planom.`:L`To je ${MIO(M.land-M.plan)} nad planom.`,L`Do konca oktobra smo glede na lani zrasli za ${P1(M.ytd/M.pytd-1)}. Plan zahteva rast za ${P(M.plan/M.y25-1)}, ker je postavljen na pot do ${t375}.`],
  [L`Kaj se je spremenilo?`,even?L`Novi kupci so prinesli ${K(M.neu)}, izgubljeni pa so odnesli skoraj enako, ${K(M.lost)}.`:lostBig?L`Izgubljeni kupci so odnesli ${K(M.lost)}, več, kot so prinesli vsi novi.`:L`Novi kupci so prinesli ${K(M.neu)}, izgubljeni so odnesli ${K(M.lost)}.`,L`Rast prinašajo predvsem višje cene, plus ${K(M.price)}, in obstoječi kupci, ${M.vol>=0?'plus':'minus'} ${K(M.vol)}.`].concat(even?[L`Baza kupcev torej ne raste.`]:[]),
  [L`Kje izgubljamo?`,L`${NC(M.risk.length)} kupcev naroča redkeje kot običajno ali pa je v upadu.`,L`Na kocki je ${MIO(M.riskV)} letne prodaje.`,L`Polovica tega tveganja odpade na samo ${N(M.half)} kupcev.`,L`Največ tveganja je v ${regLoc(S.regionName(M.topReg[0]))}.`],
  [L`Kje je denar?`,L`Deset strategij rasti, od novih kupcev do skladiščnih omar, prinese do leta ${y33} ${MIO(M.strat)} dodatne prodaje.`,L`Največ prispevajo ${top3[0]}, ${top3[1]} in ${top3[2]}.`].concat(M.gap33>0?[L`A tudi s tem do cilja manjka ${MIO(M.gap33)}.`,L`To je približno toliko, kot proda ${N(M.reps33)} terenskih svetovalcev.`,L`Rast do cilja zato zahteva tudi večjo ekipo.`]:[L`S tem je cilj dosegljiv.`]),
  [L`Ekipa.`,L`Nad planom je ${N(M.above)} svetovalcev, od skupno ${N(M.team.length)}.`,L`Pomoč potrebujeta ${M.worst[0].r.name} in ${M.worst[1].r.name}.`,...M.worst.flatMap(x=>[L`${x.r.name}: ${P(x.ach)} plana.`,why(x)].filter(Boolean)),L`Zgled za ekipo: ${M.best.r.name}, ${P(M.best.ach)} plana.`],
  [L`Tri odločitve za ta teden.`,L`Prva: zaposlite ${nh===2?'dva svetovalca':nh===1?'enega svetovalca':Y(num(nh)+' svetovalce',nh+' svetovalce')} na nepokritih teritorijih. V treh letih to prinese okoli ${K(M.hireV)} letne prodaje.`,L`Druga: ponudite skladiščne omare izbranim kupcem. Kandidatov je ${N(M.cab.length)}, povračilo naložbe je približno ${Y(num(Math.round(M.cabPay))+' mesecev',Math.round(M.cabPay)+' mesecev')}.`,L`Tretja: program zadržanja za ${N(M.ret.length)} kupcev v nevarnosti. Tako ohranimo okoli ${K(M.retEv)} prodaje.`,L`Vsako odločitev lahko potrdite ali jo prestavite na sejo vodstva.`],
  [L`To je vse za ta mesec.`,L`Odločitve se shranijo, svetovalci pa svoje naloge vidijo na strani Moj dan.`,L`Lep in uspešen teden.`]]}
// ---------- mesečni (pregled nazaj) in tedenski brifing ----------
function vh(S){const F=S.fmt,dm=v=>F.dec(Math.abs(v)/1e6,2)+' mio €';return{MIO:v=>({s:mio(v),d:F.dec(Math.abs(v)/1e6,1)+' mio €'}),K:v=>({s:k(v),d:Math.abs(v)>=995000?F.dec(Math.abs(v)/1e6,1)+' mio €':F.eurK(Math.abs(v))}),N:n=>({s:num(n),d:F.num(n)}),NC:n=>({s:cap(num(n)),d:F.num(n)}),P:f=>({s:pct(f),d:F.pct(Math.abs(f),0)}),P1:f=>({s:pct1(f),d:F.pct(Math.abs(f),1)}),Y:(s,d)=>({s,d})}}
function month(S,D){const U=W.util,NM=36,m=35,mo=S.months[m],cm=S.cube.custMonth,C=S.customers;
 const ac=S.cube.total[m],py=S.cube.total[m-12],pl=S.budget.total[m];
 const T=S.total({from:mo.d0,to:mo.d1}),TP=S.total({from:S.months[m-12].d0,to:S.months[m-12].d1});
 // divizije proti planu (plan iz portfelja svetovalcev)
 const dA=new Map(S.agg({by:['division'],from:mo.d0,to:mo.d1}).map(r=>[r.division,r.net]));const divs=[...S.divisions.map(d=>d.name),'Ključni kupci'].map(name=>{let p=0;S.reps.forEach(r=>{if(r.division===name)p+=S.budget.rep[r.id*NM+m]});return{name,ac:dA.get(name)||0,pl:p,v:(dA.get(name)||0)-p}}).filter(d=>d.pl>0);
 // kanali proti lani
 const c1=new Map(S.agg({by:['chan'],from:mo.d0,to:mo.d1}).map(r=>[r.chan,r.net])),c0=new Map(S.agg({by:['chan'],from:S.months[m-12].d0,to:S.months[m-12].d1}).map(r=>[r.chan,r.net]));
 const ch=S.channels.map((n,i)=>({i,name:n,short:S.chShort[i],ac:c1.get(i)||0,py:c0.get(i)||0})).map(x=>({...x,d:x.py>0?x.ac/x.py-1:null})).filter(x=>x.ac>0||x.py>0);
 // kupci
 const nw=C.filter(c=>c.acqDay>=mo.d0&&c.acqDay<=mo.d1),lo=C.filter(c=>c.churnDay!=null&&c.churnDay>=mo.d0&&c.churnDay<=mo.d1);
 const loV=U.sum(lo.map(c=>{let s=0;for(let k=m-12;k<m;k++)s+=cm[c.id*NM+k];return s})),nwV=U.sum(nw.map(c=>cm[c.id*NM+m]));
 const mv=C.filter(c=>c.si>=1).map(c=>({c,d:cm[c.id*NM+m]-cm[c.id*NM+m-12]})).sort((a,b)=>b.d-a.d);const up=mv.slice(0,3),down=mv.slice(-3).reverse();
 // ekipa v mesecu
 const ra=new Map(S.agg({by:['rep'],from:mo.d0,to:mo.d1}).map(r=>[r.rep,r.net]));
 const team=S.reps.filter(r=>r.role==='Terenski svetovalec'&&!r.left&&r.hired<new Date(2025,0,1)).map(r=>{const p=S.budget.rep[r.id*NM+m],a=ra.get(r.id)||0;return{r,pl:p,a,ach:p>0?a/p:0}}).filter(x=>x.pl>5000);
 const srt=team.slice().sort((a,b)=>a.ach-b.ach);
 // november
 const g=(()=>{const P=S.periods;return S.total({from:P.ytd[0],to:P.ytd[1]}).net/S.total({from:P.pytd[0],to:P.pytd[1]}).net})();
 const planNov=S.budgetNovDec.total[0],expNov=S.cube.total[24]*g;
 const urgent=D.opps.filter(o=>o.s===3&&o.urg>=1.5).length,dueN=D.opps.filter(o=>o.s===6&&o.k==='d').length,cabN=D.opps.filter(o=>o.s===9).length;
 return{m,label:mo.long,ac,py,pl,gm:T.gmPct,gmPy:TP.gmPct,divs,ch,nw,lo,nwV,loV,up,down,team,worst:srt[0],best:srt[srt.length-1],above:team.filter(x=>x.ach>=1).length,planNov,expNov,urgent,dueN,cabN}}
function narrMonth(S,MM){const{MIO,K,N,NC,P,Y}=vh(S);const y26=Y('dva tisoč šestindvajset','2026');const below=MM.ac<MM.pl;
 const dv=MM.divs.slice().sort((a,b)=>a.v-b.v),wd=dv[0],bd=dv[dv.length-1];const chs=MM.ch.filter(x=>x.d!=null&&x.py>20000).sort((a,b)=>b.d-a.d),fu=chs[0],fd=chs[chs.length-1];
 return[
  [L`Mesečni brifing za oktober ${y26}.`,L`Oktober smo zaključili pri ${MIO(MM.ac)} prodaje.`,L`To je ${P(MM.ac/MM.pl-1)} ${below?'pod':'nad'} planom in ${P(MM.ac/MM.py-1)} ${MM.ac>=MM.py?'več':'manj'} kot oktobra lani.`],
  [L`Kje je odstopanje?`,wd.v<0?L`Največ zaostaja divizija ${wd.name}: ${K(wd.v)} pod planom.`:L`Vse divizije so na planu ali nad njim.`,bd.v>0?L`Najbolje: divizija ${bd.name}, ${K(bd.v)} nad planom.`:L`Nobena divizija ni presegla plana.`],
  [L`Kanali.`,L`Najhitreje raste kanal ${fu.name}: plus ${P(fu.d)} glede na lani.`,fd.d<0?L`Najbolj pada kanal ${fd.name}: minus ${P(fd.d)}.`:L`Noben večji kanal ne pada.`],
  [L`Kupci v oktobru.`,L`Novih kupcev: ${N(MM.nw.length)}.`,L`Izgubljenih: ${N(MM.lo.length)}, ki so v zadnjem letu kupili za ${K(MM.loV)}.`,L`Največji padec glede na lani: ${MM.down[0].c.name}.`],
  [L`Ekipa v oktobru.`,L`Plan je doseglo ${N(MM.above)} svetovalcev, od skupno ${N(MM.team.length)}.`,L`Najboljši mesec: ${MM.best.r.name}, ${P(MM.best.ach)} plana.`,L`Največ zaostaja: ${MM.worst.r.name}, ${P(MM.worst.ach)} plana.`],
  [L`November.`,L`Plan za november je ${MIO(MM.planNov)}.`,L`Če nadaljujemo s tempom tega leta, bomo pri ${MIO(MM.expNov)}.`,L`Fokus meseca: zadržanje ogroženih kupcev, opomniki za ponovna naročila in ponudbe za skladiščne omare.`]]}
// tedenski brifing gleda naprej: teden od ponedeljka 2. 11. do petka 6. 11. 2026 (koledar je izmišljen, a izpeljan iz podatkov)
function week(S,D){const U=W.util,R=U.rng(U.hash('teden-2026-11-02'));const n0=new Date(2026,10,2),s0=S.dayOf(n0);
 const days=[0,1,2,3,4].map(i=>{const dt=new Date(2026,10,2+i);return{dt,wd:W.WD[dt.getDay()],items:[]}});
 let wdNov=0;for(let i=2;i<=30;i++){const w=new Date(2026,10,i).getDay();if(w>0&&w<6)wdNov++}
 const planNov=S.budgetNovDec.total[0],pl=planNov*5/wdNov;
 const l0=S.dayOf(new Date(2026,9,26)),l1=S.dayOf(new Date(2026,9,31));const last=S.total({from:l0,to:l1}).net;const mo=S.months[35];let wdOct=0;for(let d=mo.d0;d<=mo.d1;d++)if(S.workday(d))wdOct++;const lastPl=S.budget.total[35]*5/wdOct;
 const add=(i,o)=>days[i].items.push(o);const T=['9:00','10:30','11:30','13:30','14:30','15:30'];
 add(0,{t:'8:00',k:'int',txt:'Tedenski sestanek prodaje',sub:'vodje divizij · Škofljica'});
 add(0,{t:'',k:'int',txt:'Začetek novembrske akcije',sub:'14 artiklov z dodatnim popustom'});
 add(2,{t:'8:30',k:'int',txt:'Mesečni brifing za oktober',sub:'3. delovni dan v mesecu'});
 add(3,{t:'14:00',k:'int',txt:'Usposabljanje: nova linija potrošnega blaga',sub:'vsi terenski svetovalci'});
 add(4,{t:'9:00',k:'ev',txt:'Dan odprtih vrat',sub:S.branches[2].name+' · demonstracija 18V'});
 // pogajanja in odločanja o odprtih ponudbah = sestanki s kupci
 const neg=S.quotes.filter(q=>q.status==='Odprta'&&(q.stage==='Pogajanja'||q.stage==='Odločanje')).sort((a,b)=>b.value-a.value).slice(0,6);
 neg.forEach((q,j)=>{const c=S.cust(q.cust),r=S.rep(q.rep);add(j%5,{t:T[Math.floor(R()*T.length)],k:'cust',txt:(q.stage==='Pogajanja'?'Pogajanja: ':'Odločitev: ')+q.type,sub:c.name+(r?' · '+r.name:''),v:q.value,cust:c.id})});
 // četrtletni pregledi največjih ključnih kupcev
 S.customers.filter(c=>c.si===3&&c.status!=='Izgubljen').sort((a,b)=>b.rev12-a.rev12).slice(0,3).forEach((c,j)=>add([1,3,4][j],{t:['10:00','11:00','13:00'][j],k:'cust',txt:'Četrtletni pregled računa',sub:c.name+' · '+S.rep(c.rep).name,v:c.rev12,cust:c.id}));
 // predstavitev omare najboljšemu kandidatu
 const cb=D.opps.filter(o=>o.s===9).sort((a,b)=>b.ev-a.ev)[0];if(cb){const c=S.cust(cb.cust);add(2,{t:'10:00',k:'cust',txt:'Predstavitev skladiščne omare',sub:c.name+' · '+S.rep(cb.rep).name,v:cb.val,cust:c.id})}
 // roki za odločitve o projektih
 const n1=new Date(2026,10,8,23);const proj=S.quotes.filter(q=>q.status==='Odprta'&&q.expClose>=n0&&q.expClose<=n1).map(q=>({q,w:q.value*(q.prob||.35)})).sort((a,b)=>b.w-a.w);
 proj.slice(0,5).forEach(({q})=>{const dd=Math.min(4,Math.max(0,Math.round((q.expClose-n0)/864e5)));add(dd,{t:'rok',k:'dl',txt:q.type,sub:S.cust(q.cust).name,v:q.value,cust:q.cust})});
 const ord=t=>t===''?-1:t==='rok'?9999:+t.split(':')[0]*60+ +t.split(':')[1];days.forEach(d=>d.items.sort((a,b)=>ord(a.t)-ord(b.t)));
 // kupci, ki bi po svojem ritmu morali naročiti ta teden
 const due=S.customers.filter(c=>c.status!=='Izgubljen'&&c.cadence&&c.lastOrderDay>=0&&c.lastOrderDay+c.cadence>=s0&&c.lastOrderDay+c.cadence<=s0+4&&c.orders12>=3);
 const dueV=U.sum(due.map(c=>c.rev12/c.orders12));
 const crit=D.opps.filter(o=>o.s===3&&o.urg>=1.5).sort((a,b)=>b.ev-a.ev).slice(0,3);
 const acts=D.opps.map(o=>({o,sc:o.ev*o.urg})).sort((a,b)=>b.sc-a.sc);const seen=new Set();const top=[];for(const x of acts){const k=x.o.cust!=null?'c'+x.o.cust:'p'+x.o.pros;if(seen.has(k))continue;seen.add(k);top.push(x.o);if(top.length>=5)break}
 const items=days.flatMap(d=>d.items);
 return{days,pl,perDay:pl/5,planNov,last,lastPl,meet:items.filter(x=>x.k==='cust').length,dl:items.filter(x=>x.k==='dl').length,proj,projV:U.sum(proj.map(x=>x.w)),due,dueV,crit,top}}
function narrWeek(S,WK){const{K,N,P,Y}=vh(S);const below=WK.last<WK.lastPl;const p0=WK.proj[0];const t=WK.top[0];
 const cn=o=>o.cust!=null?S.cust(o.cust).name:S.prospects[o.pros].name;
 return[
  [L`Tedenski brifing za teden od ${Y('drugega do šestega novembra','2. do 6. novembra')}.`,L`Plan tedna je ${K(WK.pl)}, to je ${K(WK.perDay)} na dan.`,L`Pretekli teden smo prodali ${K(WK.last)}, ${P(WK.last/WK.lastPl-1)} ${below?'pod':'nad'} planom.`],
  [L`Koledar tedna.`,L`Sestanki s kupci: ${N(WK.meet)}. Roki za odločitve o projektih: ${N(WK.dl)}.`,L`V sredo je mesečni brifing, v četrtek usposabljanje za novo linijo potrošnega blaga, v petek dan odprtih vrat v Celju.`],
  [L`Projekti, ki se odločajo.`,L`Tehtana vrednost projektov z rokom ta teden: ${K(WK.projV)}.`].concat(p0?[L`Največji: ${p0.q.type.toLowerCase()}, kupec ${S.cust(p0.q.cust).name}, ${K(p0.q.value)}.`]:[]),
  [L`Kupci ta teden.`,L`Po svojem ritmu bi moralo naročiti ${N(WK.due.length)} kupcev, skupaj približno ${K(WK.dueV)}.`].concat(WK.crit.length?[L`Kritični, ki naročajo bistveno redkeje kot običajno: ${WK.crit.map(o=>S.cust(o.cust).name).join(', ')}.`]:[]),
  [L`Prioritete tedna.`,L`Prva akcija: ${t.title}, kupec ${cn(t)}.`,L`Vse akcije so razdeljene po svetovalcih na strani Moj dan. Uspešen teden.`]]}
root.B={model,narration,words:W_,month,narrMonth,week,narrWeek};
})(typeof window!=='undefined'?window:globalThis);
