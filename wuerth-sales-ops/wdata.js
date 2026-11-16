/* Würth Slovenija — demo prodajni podatki (izmišljeni, umerjeni na letno poročilo 2025: ~17,1 mio € prodaje, ~52 % bruto marža,
   teren ~70 %, 7 trgovin, 3 divizije, skladiščne omare, selitev v Škofljico 2025, cilj 37,5 mio € do 2033). Simulacija od 1. 11. 2023 do 31. 10. 2026.
   Vse je deterministično (seed), zato vse strani vidijo iste številke. Simulacija je vzročna:
   obiski svetovalcev dvigujejo nakupe, nezasedeni teritoriji in selitev skladišča (okt–dec 2025)
   povzročijo odliv, akcije dvignejo prodajo izdelkov, e-trgovina in ORSY dvigneta zvestobo,
   cenovna vojna v gradbeništvu 2026 zviša popuste. Uporaba: const S = W.load()  — glej ENGINE.md. */
(function(root){
'use strict';
const W={};
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const rng=seed=>{let a=seed>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const sum=a=>{let s=0;for(const v of a)s+=v;return s};
const avg=a=>a.length?sum(a)/a.length:0;
const quantile=(a,q)=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);const p=(s.length-1)*q,lo=Math.floor(p),hi=Math.ceil(p);return s[lo]+(s[hi]-s[lo])*(p-lo)};
const group=(arr,fn)=>{const m=new Map();for(const x of arr){const k=fn(x);let g=m.get(k);if(!g)m.set(k,g=[]);g.push(x)}return m};
// znak in besedni znak (poenostavljen, za demo)
W.logo=(h=30)=>'<svg viewBox="0 0 150 30" height="'+h+'" role="img" aria-label="Würth"><path fill="#cc0000" d="M2 0.75H12.81V5.12H17.14V0.75H28V11.91H2ZM2 16.28H28A13 13 0 0 1 17.14 29.1V24.83H12.81V29.1A13 13 0 0 1 2 16.28Z"/><text x="34" y="24" font-family="Roboto Condensed,Arial Narrow,Arial,sans-serif" font-weight="800" font-size="25" letter-spacing="1.2" fill="#222">WÜRTH</text></svg>';
W.util={hash,rng,clamp,sum,avg,median:a=>quantile(a,.5),quantile,group,count:(a,f)=>{let n=0;for(const x of a)if(f(x))n++;return n}};

// ---------- koledar ----------
const D0=new Date(2023,10,1),ND=1096,NM=36;// 1. 11. 2023 .. 31. 10. 2026
const MON=['jan','feb','mar','apr','maj','jun','jul','avg','sep','okt','nov','dec'];
const MONL=['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'];
const WD=['ned','pon','tor','sre','čet','pet','sob'];
const DAYS=Array.from({length:ND},(_,i)=>new Date(2023,10,1+i));
const monthOfDay=new Uint8Array(ND),dowOfDay=new Uint8Array(ND);
const MONTHS=Array.from({length:NM},(_,i)=>{const d=new Date(2023,10+i,1);const e=new Date(2023,11+i,0);return{i,y:d.getFullYear(),m:d.getMonth(),label:MON[d.getMonth()]+' '+String(d.getFullYear()).slice(2),long:MONL[d.getMonth()]+' '+d.getFullYear(),start:d,end:e,d0:0,d1:0}});
DAYS.forEach((d,i)=>{const mi=(d.getFullYear()-2023)*12+d.getMonth()-10;monthOfDay[i]=mi;dowOfDay[i]=d.getDay()});
MONTHS.forEach(m=>{m.d0=monthOfDay.indexOf(m.i);m.d1=monthOfDay.lastIndexOf(m.i)});
const HOL=new Set(['1-0','2-0','8-1','27-3','1-4','2-4','25-5','15-7','31-9','1-10','25-11','26-11']);
const EASTER=new Set(['2024-3-1','2025-3-21','2026-3-6']);
const closed=new Uint8Array(ND);DAYS.forEach((d,i)=>{if(HOL.has(d.getDate()+'-'+d.getMonth())||EASTER.has(d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()))closed[i]=1});
const workday=i=>dowOfDay[i]>0&&dowOfDay[i]<6&&!closed[i];
const dayOf=d=>Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-D0)/864e5);
W.MON=MON;W.MONL=MONL;W.WD=WD;

// ---------- geografija ----------
const REGIONS=[['os','Osrednjeslovenska',14.51,46.05,23500],['po','Podravska',15.65,46.50,11800],['sa','Savinjska',15.26,46.24,11200],['go','Gorenjska',14.15,46.30,9400],['jv','Jugovzhodna Slovenija',15.17,45.80,6600],['ob','Obalno-kraška',13.73,45.55,5800],['gs','Goriška',13.65,45.96,5600],['pm','Pomurska',16.15,46.65,4900],['ko','Koroška',15.02,46.55,2700],['ps','Posavska',15.50,45.95,2900],['pn','Primorsko-notranjska',14.21,45.78,2300],['za','Zasavska',14.98,46.13,1300]];
const TOWNS=[['Ljubljana','os',14.506,46.051,10],['Domžale','os',14.594,46.139,2],['Kamnik','os',14.612,46.226,1.5],['Vrhnika','os',14.295,45.966,1],['Grosuplje','os',14.659,45.955,1.2],['Škofljica','os',14.575,45.985,.6],['Litija','os',14.828,46.058,.7],['Logatec','os',14.224,45.917,.8],['Trzin','os',14.556,46.130,.6],['Medvode','os',14.411,46.142,.9],
['Maribor','po',15.646,46.555,6],['Ptuj','po',15.870,46.420,2],['Slovenska Bistrica','po',15.574,46.393,1.2],['Lenart','po',15.831,46.576,.7],['Ruše','po',15.516,46.539,.6],['Ormož','po',16.154,46.408,.6],
['Celje','sa',15.267,46.236,4],['Velenje','sa',15.111,46.359,2.5],['Žalec','sa',15.165,46.251,1.2],['Šentjur','sa',15.395,46.217,.8],['Rogaška Slatina','sa',15.640,46.237,.6],['Laško','sa',15.236,46.155,.6],['Mozirje','sa',14.963,46.339,.5],
['Kranj','go',14.355,46.239,4],['Šenčur','go',14.420,46.244,.8],['Škofja Loka','go',14.306,46.165,1.6],['Jesenice','go',14.064,46.436,1.2],['Radovljica','go',14.174,46.344,1.1],['Tržič','go',14.310,46.364,.7],['Bled','go',14.114,46.368,.6],
['Novo mesto','jv',15.169,45.804,3.5],['Kočevje','jv',14.865,45.643,.9],['Črnomelj','jv',15.188,45.572,.7],['Trebnje','jv',15.009,45.904,.8],['Metlika','jv',15.314,45.647,.4],
['Koper','ob',13.730,45.548,3],['Izola','ob',13.660,45.537,.9],['Piran','ob',13.568,45.528,.7],['Sežana','ob',13.873,45.709,1],
['Nova Gorica','gs',13.648,45.956,3],['Ajdovščina','gs',13.909,45.889,1.2],['Idrija','gs',14.027,46.000,.8],['Tolmin','gs',13.733,46.183,.6],
['Murska Sobota','pm',16.166,46.662,2.5],['Lendava','pm',16.452,46.565,.8],['Gornja Radgona','pm',15.993,46.674,.7],['Ljutomer','pm',16.197,46.519,.6],
['Slovenj Gradec','ko',15.081,46.510,1.4],['Ravne na Koroškem','ko',14.969,46.544,1],['Dravograd','ko',15.022,46.589,.6],
['Krško','ps',15.491,45.959,1.5],['Brežice','ps',15.591,45.905,1.2],['Sevnica','ps',15.316,46.008,.8],
['Postojna','pn',14.215,45.775,1.4],['Ilirska Bistrica','pn',14.243,45.567,.7],['Cerknica','pn',14.362,45.795,.6],
['Trbovlje','za',15.053,46.155,.9],['Zagorje ob Savi','za',14.996,46.135,.7],['Hrastnik','za',15.083,46.146,.4]];
const OUTLINE=[[13.71,46.52],[13.92,46.52],[14.14,46.48],[14.43,46.43],[14.56,46.38],[14.70,46.45],[14.87,46.60],[15.02,46.65],[15.20,46.66],[15.42,46.66],[15.65,46.71],[15.98,46.68],[16.07,46.74],[16.23,46.87],[16.36,46.84],[16.52,46.70],[16.60,46.48],[16.40,46.53],[16.27,46.39],[16.06,46.38],[15.92,46.28],[15.65,46.22],[15.70,46.05],[15.60,45.90],[15.70,45.84],[15.48,45.81],[15.39,45.71],[15.30,45.63],[15.33,45.46],[15.13,45.47],[14.93,45.50],[14.71,45.53],[14.57,45.64],[14.44,45.53],[14.25,45.48],[14.10,45.47],[13.92,45.46],[13.59,45.48],[13.58,45.52],[13.72,45.60],[13.91,45.63],[13.79,45.74],[13.60,45.80],[13.58,45.97],[13.48,46.04],[13.66,46.18],[13.42,46.21],[13.40,46.32],[13.63,46.45],[13.71,46.52]];
W.geo={regions:REGIONS.map(r=>({id:r[0],name:r[1],lon:r[2],lat:r[3],businesses:r[4]})),towns:TOWNS.map(t=>({name:t[0],region:t[1],lon:t[2],lat:t[3]})),outline:OUTLINE,
 bbox:[13.36,45.40,16.64,46.90],
 project:(lon,lat,w,h,pad=8)=>{const[x0,y0,x1,y1]=[13.36,45.40,16.64,46.90];const k=Math.cos(46.1*Math.PI/180);const sx=(w-2*pad)/((x1-x0)*k),sy=(h-2*pad)/(y1-y0);const s=Math.min(sx,sy);const ox=pad+((w-2*pad)-(x1-x0)*k*s)/2,oy=pad+((h-2*pad)-(y1-y0)*s)/2;return[ox+(lon-x0)*k*s,oy+(y1-lat)*s]},
 path:(w,h,pad=8)=>'M'+OUTLINE.map(([lo,la])=>W.geo.project(lo,la,w,h,pad).map(v=>v.toFixed(1)).join(' ')).join('L')+'Z'};

// ---------- trgovine, kanali ----------
// sedem trgovin po letnem poročilu 2025 (Ljubljana BTC, Trzin, Celje, Koper, Novo mesto, Šenčur, Ptuj)
const BRANCHES=[['lj','Trgovina Ljubljana BTC','Ljubljana',14.548,46.066],['tr','Trgovina Trzin','Trzin',14.556,46.130],['ce','Trgovina Celje','Celje',15.250,46.230],['kp','Trgovina Koper','Koper',13.745,45.545],['nm','Trgovina Novo mesto','Novo mesto',15.150,45.810],['se','Trgovina Šenčur','Šenčur',14.420,46.244],['pt','Trgovina Ptuj','Ptuj',15.870,46.420]];
// pet prodajnih kanalov iz letnega poročila; spletna trgovina je razdeljena na e-shop in aplikacijo
const CHANNELS=['Terenski svetovalec','Trgovina','E-shop','Aplikacija','Klicni center','Skladiščne omare'];
const CHSHORT=['Teren','Trgovina','E-shop','Aplikacija','Klicni center','Omare'];
// ---------- panoge ----------
const BRANZE=['Avto','Kovina','Les','Gradbeništvo','Inštalacije','Industrija','Cargo'];
const BRANZA_W=[.2,.17,.14,.2,.15,.06,.08];
// ---------- asortiment ----------
// [id, ime, marža (bruto), barva idx]
const CATS=[['pri','Pritrjevanje in sidranje',.717],['kem','Kemično-tehnični izdelki',.697],['oro','Ročno orodje',.602],['ele','Električno orodje',.522],['obd','Obdelava materialov',.657],['ovo','Zaščita pri delu',.602],['avt','Avto in vozila',.637],['ins','Elektro in inštalacije',.562],['orsy','ORSY in shranjevanje',.602],['pot','Potrošni in delavniški material',.677]];
// podkategorije: [cat, ime, ceneTipične [min,max], enota, artikli: predloge imen]
const SUBS=[
['pri','Vijaki za les',[6,48],'pak',['Vijak za les ASSY {d}x{l} (100 kos)','Vijak za les s ploščato glavo {d}x{l} (200 kos)','Vijak za terase {d}x{l} nerjavni (100 kos)']],
['pri','Metrični vijaki in matice',[4,60],'pak',['Vijak DIN 933 M{m}x{l} 8.8 (50 kos)','Matica DIN 934 M{m} (100 kos)','Podložka DIN 125 M{m} (200 kos)']],
['pri','Sidra in vložki',[9,120],'pak',['Kovinsko sidro W-FA M{m}x{l} (50 kos)','Najlonski vložek W-UR {d}x{l} (100 kos)','Kemično sidro WIT-VM 250 (410 ml)']],
['pri','Pritrdilni elementi za montažo',[5,55],'pak',['Kotnik z rebrom {l} mm (50 kos)','Kabelska vezica {l} mm (100 kos)','Zakovica Al {d}x{l} (500 kos)']],
['kem','PUR pene in tesnila',[7,28],'kos',['PUR pena pištolna 750 ml','Silikon nevtralni 310 ml','Akrilni kit 310 ml','Požarna PUR pena B1 750 ml']],
['kem','Lepila in lepilni trakovi',[5,40],'kos',['Konstrukcijsko lepilo 310 ml','Sekundno lepilo 20 g','Izolirni trak 19 mm x 20 m','Montažni lepilni trak 19 mm']],
['kem','Maziva in spreji',[6,26],'kos',['Rost Off spray 400 ml','Silikonski spray 500 ml','Mast HHS 2000 500 ml','Univerzalno olje 5 l']],
['kem','Čistila in nega',[4,38],'kos',['Čistilo za zavore 500 ml','Čistilne krpe (rola)','Čistilo za roke 3 l','Čistilo za steklo 500 ml']],
['kem','Površinska zaščita',[8,32],'kos',['Cinkov spray 400 ml','Lak v spreju RAL 9005 400 ml','Zaščita votlih delov 500 ml']],
['oro','Izvijači in ključi',[9,140],'kos',['Set izvijačev ZEBRA {n}-delni','Kombinirani ključ {m} mm','Set natičnih ključev 1/2" {n}-delni']],
['oro','Klešče in rezilno orodje',[8,95],'kos',['Kombinirane klešče 180 mm','Nož z zložljivim rezilom','Ščipalne klešče 160 mm','Škarje za pločevino']],
['oro','Merilno in gradbeno orodje',[6,180],'kos',['Libela Alu {l} cm','Merski trak 5 m','Zidarska žlica','Laserski merilnik razdalje']],
['oro','Udarno in vpenjalno orodje',[10,120],'kos',['Kladivo ključavničarsko {n}00 g','Primež {n}00 mm','Spona hitra {l} mm']],
['ele','Akumulatorsko orodje',[120,690],'kos',['Akumulatorski vrtalni vijačnik 18 V','Akumulatorski udarni vijačnik 18 V','Akumulatorska kotna brusilka 18 V','Akumulator 18 V 5,2 Ah']],
['ele','Akumulatorski sistem 18V NOVO',[149,790],'kos',['Kompaktni vijačnik 18 V (nova gen.)','Udarni vijačnik 18 V brezkrtačni (nova gen.)','Večnamensko orodje 18 V (nova gen.)','Komplet 2× 5 Ah + polnilec (nova gen.)']],
['ele','Omrežno orodje',[89,560],'kos',['Kotna brusilka 125 mm 1200 W','Vrtalno kladivo SDS-plus 800 W','Krožna žaga 1400 W','Sesalnik za suho/mokro']],
['obd','Svedri in krone',[4,85],'kos',['Sveder HSS-G {d} mm','Sveder SDS-plus {d}x{l}','Kronska žaga Bi-Metal {l} mm','Set svedrov {n}-delni']],
['obd','Brusni in rezalni material',[1.5,24],'kos',['Rezalna plošča 125x1,0 Inox','Lamelna brusna plošča 125 P{n}0','Brusni papir P{n}0 (50 kos)','Žična krtača čašasta']],
['obd','Žagini listi in rezila',[3,40],'kos',['List za vbodno žago (5 kos)','List za sabljasto žago (5 kos)','Rezilo za nož (10 kos)']],
['ovo','Zaščitne rokavice',[1.8,14],'par',['Rokavice nitril Multifit','Rokavice proti urezu Level C','Rokavice za enkratno uporabo (100 kos)']],
['ovo','Delovna oblačila',[15,120],'kos',['Delovne hlače Stretch X','Softshell jakna','Delovna majica polo','Zimska jakna']],
['ovo','Zaščitna obutev',[49,140],'par',['Zaščitni čevlji S3','Zaščitni škornji S5','Zaščitni sandali S1P']],
['ovo','Zaščita glave, oči in sluha',[2,60],'kos',['Zaščitna očala','Ušesni čepki (200 par)','Zaščitna čelada','Polmaska FFP2 (10 kos)']],
['avt','Avtodeli in karoserija',[3,70],'pak',['Karoserijska sponka (50 kos)','Ploščati varovalke (asortiment)','Žarnica H7 12 V (10 kos)']],
['avt','Avtokemija in tekočine',[5,45],'kos',['Antifriz G12+ 5 l','Tekočina za stekla zimska 5 l','Čistilo za klimo 300 ml','AdBlue 10 l']],
['avt','Servis pnevmatik',[3,95],'pak',['Utež za uravnoteženje (100 kos)','Ventil za pnevmatike (100 kos)','Montažna pasta 5 kg']],
['avt','Delavniška oprema vozil',[25,380],'kos',['Dvigalka hidravlična 2 t','Polnilnik akumulatorjev','Diagnostični čitalnik']],
['ins','Elektroinštalacijski material',[2,60],'pak',['Vrstna sponka (100 kos)','Kabelski čevelj (100 kos)','Termoskrčna cev (asortiment)','Razdelilnica nadometna']],
['ins','Vodovod in ogrevanje',[3,80],'pak',['Teflonski trak (10 kos)','Objemka za cevi (50 kos)','Pasta za tesnjenje navojev','Tesnilo za navoje vrvica']],
['orsy','ORSY kovčki in sortimenti',[45,420],'kos',['ORSY kovček s sortimentom vijakov','ORSY sortiment ploščatih varovalk','ORSY kovček prazen']],
['orsy','ORSY regali in vozički',[250,2400],'kos',['ORSY regal modul','ORSY voziček delavniški','ORSY mobil vložek za vozilo']],
['orsy','ORSY MAT avtomati (najem/polnitve)',[60,900],'kos',['ORSY MAT polnitev potrošnega materiala','ORSY MAT mesečni najem']],
['pot','Delavniški potrošni material',[2,35],'pak',['Papirnati brisači (rola)','Vreče za smeti 120 l (25 kos)','Absorpcijsko sredstvo 20 kg','Označevalni sprej']],
['pot','Varjenje in spajkanje',[6,160],'kos',['Varilna žica 0,8 mm 5 kg','Elektrode rutil 2,5 mm','Sprej proti brizgom','Varilna maska samozatemnitvena']]];
// potrošno blago: se redno ponavlja (napoved ponovnega naročila, skladiščne omare)
const CONSUMABLE=new Set(['Vijaki za les','Metrični vijaki in matice','Sidra in vložki','Pritrdilni elementi za montažo','PUR pene in tesnila','Lepila in lepilni trakovi','Maziva in spreji','Čistila in nega','Brusni in rezalni material','Žagini listi in rezila','Svedri in krone','Zaščitne rokavice','Zaščita glave, oči in sluha','Avtokemija in tekočine','Servis pnevmatik','Elektroinštalacijski material','Vodovod in ogrevanje','Delavniški potrošni material','Varjenje in spajkanje','ORSY MAT avtomati (najem/polnitve)']);
// 2025: širitev asortimana potrošnega blaga (letno poročilo: +6,4 % različnih prodanih artiklov)
const NEWLINE={'Delavniški potrošni material':['Čistilne krpe v dozi (72 kos)','Industrijski papir 2-slojni (rola 1000 m)','Absorpcijske blazinice (100 kos)','Zaščitna folija za pod (50 m)','Trak za označevanje tal 50 mm','Brisače za roke (6 rol)','Vreče za smeti 240 l (10 kos)','Nitrilne rokavice v dozatorju (100 kos)'],
 'Brusni in rezalni material':['Rezalna plošča 115x1,0 Inox (25 kos)','Lamelna plošča cirkonij 125 P60','Brusna goba (10 kos)','Fiber disk 125 P36 (25 kos)','Rezalna plošča 230x1,9 (25 kos)','Brusni kolut iz flisa 125 mm'],
 'Zaščitne rokavice':['Rokavice nitril Grip (12 par)','Rokavice zimske podložene','Rokavice za montažo Touch','Rokavice proti urezu Level D','Rokavice kemijsko odporne'],
 'Čistila in nega':['Čistilni robčki za roke (80 kos)','Industrijsko čistilo koncentrat 5 l','Odmaščevalec na vodni osnovi 1 l','Čistilo za površine 500 ml'],
 'Lepila in lepilni trakovi':['Hibridno lepilo-tesnilo 290 ml','Montažno lepilo transparentno 290 ml','Dvokomponentno lepilo 50 ml','Trak za maskiranje 38 mm'],
 'Varjenje in spajkanje':['Varilna žica 1,0 mm 15 kg','Šoba za varilni gorilnik (10 kos)','Kontaktna šoba M6 (25 kos)'],
 'Pritrdilni elementi za montažo':['Samorezni vijak za pločevino 4,8x19 (500 kos)','Vijak za beton 7,5x80 (100 kos)','Vložek za votle stene (50 kos)','Kabelska vezica črna UV 290 mm (100 kos)']};
const TIERS=['Osnovni','Profesionalni','Premium'];
// občutljivost na ceno po panogi (1 = povprečje) in poraba na zaposlenega pri Würthu (€/leto, ocena celotne denarnice)
const SENS_B={Avto:.8,Kovina:1,Les:1.1,Gradbeništvo:1.55,Inštalacije:1.2,Industrija:.7,Cargo:.9};
const PPE={Avto:1250,Kovina:1050,Les:900,Gradbeništvo:820,Inštalacije:780,Industrija:620,Cargo:560};
// panožna afiniteta do kategorij (vrstni red CATS)
const AFF={Avto:[.10,.22,.08,.06,.10,.06,.30,.03,.03,.02],Kovina:[.16,.12,.08,.10,.26,.10,.02,.03,.03,.10],Les:[.36,.18,.08,.10,.14,.07,.01,.02,.02,.02],Gradbeništvo:[.30,.22,.10,.10,.10,.12,.01,.02,.01,.02],Inštalacije:[.20,.12,.10,.10,.10,.07,.01,.26,.02,.02],Industrija:[.18,.14,.08,.08,.14,.14,.02,.06,.10,.06],Cargo:[.10,.20,.08,.04,.04,.06,.38,.04,.04,.02]};
const SEAS={base:[.85,.92,1.08,1.08,1.1,1.06,1.0,.78,1.06,1.1,1.02,.85],Gradbeništvo:[.62,.72,1.0,1.18,1.24,1.2,1.12,.86,1.18,1.14,.98,.62],Avto:[.95,.9,1.05,1.08,1.0,.94,.92,.8,1.0,1.22,1.28,.86],Cargo:[.95,.92,1.02,1.04,1.02,1.0,.96,.84,1.02,1.1,1.14,.98]};
const SIZES=['S','M','L','KA'];
const SIZE_SPEND=[420,1800,6800,27000],SIZE_ORDER=[150,250,420,760],SIZE_LINES=[.7,1.2,1.8,2.4],SIZE_DISC=[.08,.15,.22,.29],SIZE_CATS=[[2,4],[4,6],[6,8],[8,10]];
const LEGAL=['s.p.','d.o.o.','d.o.o.','d.d.'];
// kalibracija na letno poročilo: ~17,2 mio € (2024), ~17,1 mio € (2025), teren ~70 %
const CHW={field:[.5,.56],shop:[.24,.13,.04],eshop:.2,app:[.06,.11],call:.08};const APP_M=18;
const CONS_CATS=new Set([0,1,4,5,9]);
// vizija 2026–2033 iz letnega poročila: 37,5 mio € prihodkov do 2033 → potrebna letna rast
const TARGET33=37.5e6,REV25=17123397,PLAN_G=Math.pow(TARGET33/REV25,1/8);
const ANNUAL={source:'Letno poročilo Wuerth d.o.o. 2025 (javno objavljeno)',y2024:{revenue:17160135,netProfit:251842,operatingProfit:340030,employees:102,avgEmployees:106.16,revenuePerEmployee:165001,cogs:8303442,laborCost:5002694},
 y2025:{revenue:17123397,netProfit:66266,operatingProfit:116733,employees:105,avgEmployees:101.49,revenuePerEmployee:164648,cogs:8160705,laborCost:5035940,sellingCosts:6669855,transport:684415,hired:9,left:11,skuGrowth:.064,fieldShare:.7,cabinetCustomers:10},
 target2033:TARGET33,cagr:PLAN_G-1,divisions:['Avto','Lesno-gradbena','Metal'],channels:5,shops:7};
const TREND=m=>{const y=2023+Math.floor((m+10)/12);return 1.06*(y<=2024?1:y===2025?.947:.95)*(1+.0015*m)};
const PREF={Avto:['Avtoservis','Avtokleparstvo','Avtoličarstvo','Vulkanizerstvo','Avto center','Servis vozil'],Kovina:['Kovinarstvo','Ključavničarstvo','Strojna obdelava','Varilstvo','Kovinoplastika','Kovinska galanterija'],Les:['Mizarstvo','Tesarstvo','Lesarstvo','Pohištvo','Stavbno pohištvo'],Gradbeništvo:['Gradbeništvo','Gradnje','Fasaderstvo','Krovstvo','Kleparstvo','Zidarstvo','Suhomontaža'],Inštalacije:['Elektro','Elektroinštalacije','Vodoinštalacije','Instalacije','Ogrevanje in klima','Solarni sistemi'],Industrija:['Industrija','Tehnika','Strojegradnja','Proizvodnja','Mehanika'],Cargo:['Prevozi','Transport','Logistika','Avtoprevozništvo']};
const SURN='Novak Horvat Kovačič Krajnc Zupančič Potočnik Kovač Mlakar Kos Vidmar Golob Turk Kralj Božič Korošec Bizjak Zupan Hribar Kotnik Kavčič Rozman Kastelic Oblak Petek Žagar Hočevar Kolar Košir Koren Klemenčič Zajc Knez Medved Pirc Erjavec Bergant Pavlič Sever Jereb Rupnik Kokalj Hren Lešnik Mohorič Bezjak Debeljak Gorenc Jerman Kranjc Kuhar Lah Mrak Pavlin Pintar Rebernik Repnik Sitar Škof Toplak Uršič Vovk Zorko Žnidaršič Babič Dolenc Fras Grošelj Jamnik Lavrič Majcen Ozimek Perko Rus Šuštar Tomažič Vrhovnik Zalokar'.split(' ');
const FN_F='Ana Maja Nina Eva Sara Tina Petra Katja Urška Mojca Barbara Špela Nika Lara Tjaša Mateja Anja Polona Vesna Jerneja'.split(' '),FN_M='Luka Matej Jure Nejc Žiga Blaž Tilen Gregor Aleš Andrej Primož Marko Uroš Miha David Jan Tomaž Boštjan Jaka Domen Anže Gašper Klemen Simon Rok Peter Dejan Bojan Robert Igor'.split(' ');
const RETURN_R=['Napačen artikel','Poškodovano pri dostavi','Ni več potrebno','Reklamacija kakovosti','Napačna količina'];
const QUOTE_T=[['ORSY regal / delavnica','orsy',[1500,14000]],['ORSY MAT avtomat','orsy',[6000,40000]],['Oprema vozila','orsy',[2500,18000]],['Paket akumulatorskega orodja','ele',[900,9000]],['Letna pogodba potrošni material','pri',[5000,60000]],['Delovna oblačila za podjetje','ovo',[1200,16000]],['Projekt gradbišče (pritrjevanje)','pri',[2000,25000]]];
const LOST_R=['Cena','Konkurenca','Projekt zamaknjen','Ni odziva','Tehnične zahteve','Interna odločitev kupca'];
W.meta={company:'Würth Slovenija (demo)',legal:'Wurth d.o.o. — demo podatki, izmišljeni',cats:CATS.map(c=>({id:c[0],name:c[1]})),channels:CHANNELS,branze:BRANZE,sizes:SIZES};

// ---------- gradnja ----------
let cache=null;
W.load=()=>cache||(cache=build());
function build(){
 const R=rng(hash('wuerth-si-demo'));const N=()=>{let u=0,v=0;while(!u)u=R();while(!v)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
 const pick=a=>a[Math.floor(R()*a.length)];const pickW=(items,ws)=>{let s=0;for(const w of ws)s+=w;let r=R()*s;for(let i=0;i<ws.length;i++){r-=ws[i];if(r<=0)return items[i]}return items[items.length-1]};
 const pois=l=>{if(l<=0)return 0;if(l>30)return Math.max(0,Math.round(l+Math.sqrt(l)*N()));let L=Math.exp(-l),k=0,p=1;do{k++;p*=R()}while(p>L);return k-1};
 // ---- izdelki ----
 const cats=CATS.map((c,i)=>({id:c[0],idx:i,name:c[1],gm:c[2]}));const CI={};cats.forEach(c=>CI[c.id]=c.idx);
 const subs=SUBS.map((s,i)=>({id:i,cat:CI[s[0]],name:s[1],price:s[2],unit:s[3],tpl:s[4]}));
 const products=[];
 subs.forEach(s=>{const n=s.name.includes('NOVO')?14:s.cat===CI.orsy?12:s.price[1]>300?20:30;for(let k=0;k<n;k++){const t=s.tpl[k%s.tpl.length];const d=[4,5,6,8,10,12][k%6],l=[30,40,50,60,80,100,120][(k*3+1)%7],m=[6,8,10,12,16][k%5],nn=[2,3,4,5,6,8,12][k%7];
   let name=t.replace('{d}',d).replace('{l}',l).replace('{m}',m).replace('{n}',nn);if(products.some(p=>p.name===name))name+=' · v'+(k+1);
   const lp=+(s.price[0]*Math.exp(R()*Math.log(s.price[1]/s.price[0]))).toFixed(2);const gm=clamp(cats[s.cat].gm+N()*.06,.18,.75);
   products.push({id:products.length,sku:String(hash(name)%9e7+1e7).replace(/(\d{4})(\d{3})(\d+)/,'$1 $2 $3'),name,sub:s.id,cat:s.cat,list:lp,cost:+(lp*(1-gm)).toFixed(2),unit:s.unit,pop:Math.pow(1/(k+1),.85)*(0.6+R()*.8),launch:s.name.includes('NOVO')?16+Math.floor(k/4):null,old:s.name==='Akumulatorsko orodje'})}});
 // nova linija potrošnega blaga (lansirana feb–okt 2025)
 subs.forEach(s=>{const nl=NEWLINE[s.name];if(!nl)return;nl.forEach((name,k)=>{const lp=+(s.price[0]*Math.exp(R()*Math.log(s.price[1]/s.price[0]))).toFixed(2);const gm=clamp(cats[s.cat].gm+.02+N()*.05,.25,.8);
   products.push({id:products.length,sku:String(hash(name)%9e7+1e7).replace(/(\d{4})(\d{3})(\d+)/,'$1 $2 $3'),name,sub:s.id,cat:s.cat,list:lp,cost:+(lp*(1-gm)).toFixed(2),unit:s.unit,pop:Math.pow(1/(k+2),.7)*(0.7+R()*.6),launch:15+((k*3+s.id)%9),old:false})})});
 subs.forEach(s=>{s.consumable=CONSUMABLE.has(s.name)});
 // cenovni razred znotraj podkategorije (tretjine po ceniški ceni) → osnova za upselling
 subs.forEach(s=>{const ps=products.filter(p=>p.sub===s.id).sort((a,b)=>a.list-b.list);ps.forEach((p,j)=>{p.tier=Math.min(2,Math.floor(j*3/ps.length));p.consumable=s.consumable})});
 const subProds=subs.map(s=>products.filter(p=>p.sub===s.id));
 // akcije: vsak mesec 14 artiklov
 const promo=Array.from({length:NM},(_,m)=>{const r2=rng(hash('promo'+m));const set=new Set();while(set.size<14)set.add(Math.floor(r2()*products.length));return set});
 products.forEach(p=>p.promoMonths=promo.map((s,m)=>s.has(p.id)?m:-1).filter(m=>m>=0));
 // ---- cene skozi čas ----
 const listIdx=m=>{const y=MONTHS[m].y;return(y>=2025?1.035:1)*(y>=2026?1.029:1)};const costIdx=m=>1+.0021*m;
 // ---- svetovalci ----
 // divizije po letnem poročilu (prehod z regijskega na divizijsko vodenje konec 2025)
 const divisions=[['Avto',['Avto','Cargo']],['Lesno-gradbena',['Les','Gradbeništvo','Inštalacije']],['Metal',['Kovina','Industrija']]];
 const divOf=b=>divisions.find(d=>d[1].includes(b))[0];
 const reps=[];let rid=0;const rname=()=>{const f=R()<.28;return(f?pick(FN_F):pick(FN_M))+' '+pick(SURN)};
 const mgrs=divisions.map(([dn])=>{const r={id:rid++,name:rname(),role:'Vodja prodaje',division:dn,branza:null,region:null,hired:new Date(2008+Math.floor(R()*8),Math.floor(R()*12),1),left:null};reps.push(r);return r});
 // terenski: po panogi in regiji (32 svetovalcev; teren ustvari ~70 % prodaje)
 const plan=[['Avto',['os','os','po','sa','go','jv','ob','gs']],['Cargo',['os']],['Les',['os','po','sa','go','jv']],['Gradbeništvo',['os','os','po','sa','go','jv','gs']],['Inštalacije',['os','po','sa','jv']],['Kovina',['os','po','sa','go','ps']],['Industrija',['os','sa']]];
 plan.forEach(([b,regs])=>regs.forEach(rg=>{const dv=divisions.findIndex(d=>d[1].includes(b));reps.push({id:rid++,name:rname(),role:'Terenski svetovalec',division:divisions[dv][0],manager:mgrs[dv].id,branza:b,region:rg,hired:new Date(2010+Math.floor(R()*13),Math.floor(R()*12),1),left:null,visitRate:4.4+R()*2.4,disc:clamp(.015+N()*.022,-.02,.07),skill:N()*.6})}));
 const kam=[0,1].map(i=>{const r={id:rid++,name:rname(),role:'Key account manager',division:'Ključni kupci',manager:mgrs[2].id,branza:null,region:null,hired:new Date(2012+i*3,3,1),left:null,visitRate:3,disc:.01+N()*.01,skill:.3};reps.push(r);return r});
 const call=[0,1,2,3].map(()=>{const r={id:rid++,name:rname(),role:'Klicni center',division:'Notranja prodaja',branza:null,region:null,hired:new Date(2016+Math.floor(R()*8),Math.floor(R()*12),1),left:null,visitRate:0,disc:.01,skill:0};reps.push(r);return r});
 // odhodi svetovalcev → nezasedeni teritoriji
 const field=reps.filter(r=>r.role==='Terenski svetovalec');
 const departures=[[field[3],19,3],[field[15],14,4],[field[27],27,2]];// (rep, mesec odhoda, mesecev vakance)
 departures.forEach(([r,m,vac])=>{r.left=new Date(2023,10+m,15);const nr={id:rid++,name:rname(),role:'Terenski svetovalec',division:r.division,manager:r.manager,branza:r.branza,region:r.region,hired:new Date(2023,10+m+vac,1),left:null,visitRate:3.6+R()*1.5,disc:clamp(.03+N()*.02,-.01,.08),skill:-.2+N()*.3,replaces:r.id};reps.push(nr);r.replacedBy=nr.id;r.vacantFrom=m;r.vacantTo=m+vac});
 // novi terenski svetovalci 2025/26 na slabo pokritih teritorijih (letno poročilo: »dodatno investirali v nove zaposlene v terenski prodaji«)
 const HIRES=[['Avto','pm',23],['Kovina','ko',24],['Gradbeništvo','ob',26],['Les','pm',28]];
 const newReps=HIRES.map(([b,rg,m])=>{const dv=divisions.findIndex(d=>d[1].includes(b));const r={id:rid++,name:rname(),role:'Terenski svetovalec',division:divisions[dv][0],manager:mgrs[dv].id,branza:b,region:rg,hired:new Date(2023,10+m,1),left:null,visitRate:4.8+R()*1.4,disc:clamp(.025+N()*.02,-.01,.07),skill:-.1+N()*.3,newTerritory:true,startM:m};reps.push(r);return r});
 // ---- trgovine ----
 const branches=BRANCHES.map((b,i)=>({id:i,code:b[0],name:b[1],town:b[2],lon:b[3],lat:b[4]}));
 const dist=(a,b,c,d)=>Math.hypot((a-c)*Math.cos(46*Math.PI/180),b-d)*111;
 // ---- kupci ----
 const customers=[];const townW=TOWNS.map(t=>t[4]);
 const pickTown=()=>TOWNS[(()=>{let s=0;for(const w of townW)s+=w;let r=R()*s;for(let i=0;i<TOWNS.length;i++){r-=townW[i];if(r<=0)return i}return 0})()];
 const nearBranch=(lon,lat)=>{let br=0,bd=1e9;branches.forEach(x=>{const dd=dist(lon,lat,x.lon,x.lat);if(dd<bd){bd=dd;br=x.id}});return[br,bd]};
 // register potencialnih kupcev (podjetja v ciljnih panogah, ki ob začetku niso kupovala pri Würthu)
 const prospects=[];const FIT_B={Avto:1.2,Kovina:1.1,Les:1,Gradbeništvo:.95,Inštalacije:1.05,Industrija:.8,Cargo:.75};
 for(let i=0;i<6500;i++){const b=pickW(BRANZE,BRANZA_W);const t=pickTown();const emp=Math.round(clamp(Math.exp(1.25+N()*1.0),1,420));const sur=pick(SURN);
  const lon=t[2]+N()*.03,lat=t[3]+N()*.02;const[br,bd]=nearBranch(lon,lat);
  const name=emp>=120&&R()<.6?(b==='Cargo'?sur+' Logistika d.o.o.':sur+' '+pick(['Industrija','Tehnika','Group'])+' d.o.o.'):pick(PREF[b])+' '+sur+(emp<5&&R()<.55?' s.p.':' d.o.o.');
  const fit=FIT_B[b]*(emp<2?.6:emp<=50?1.15:emp<=150?.9:.6)*(bd<15?1.3:bd<35?1:.7)*Math.exp(N()*.6);
  prospects.push({id:i,code:'R'+String(100000+i*37%899999).slice(-6),name,branza:b,division:divOf(b),town:t[0],region:t[1],lon:+lon.toFixed(4),lat:+lat.toFixed(4),branch:br,branchKm:Math.round(bd),employees:emp,founded:2025-Math.round(clamp(Math.exp(2.3+N()*.7),1,60)),potential:Math.round(emp*PPE[b]*Math.exp(N()*.25)),customer:null,convertedDay:null,_fit:fit,_open:true})}
 const mkCust=(acqDay,initial,pr)=>{const am=acqDay<0?-1:monthOfDay[acqDay];let b,t,lon,lat,si,spend,emp,name;
  if(pr){b=pr.branza;t=TOWNS.find(x=>x[0]===pr.town);lon=pr.lon;lat=pr.lat;emp=pr.employees;spend=emp*PPE[b]*clamp(.13+N()*.05,.05,.3)*Math.exp(N()*.3);si=spend<1000?0:spend<4000?1:spend<15000?2:3;if(si===3&&R()<.6)si=2;name=pr.name}
  else{b=pickW(BRANZE,BRANZA_W);si=pickW([0,1,2,3],initial?[.6,.29,.09,.02]:[.76,.2,.04,0]);if(b==='Industrija'&&si<2&&R()<.4)si++;t=pickTown();lon=t[2]+N()*.03;lat=t[3]+N()*.02;spend=SIZE_SPEND[si]*Math.exp(N()*.55);
   const sur=pick(SURN);name=si===3?(b==='Cargo'?sur+' Logistika':b==='Avto'?'Avtohiša '+sur:b==='Gradbeništvo'?sur+' Gradnje':sur+' '+pick(['Industrija','Tehnika','Group']))+' d.d.':pick(PREF[b])+' '+sur+(si===0&&R()<.5?' '+pick(['s.p.','s.p.']):' '+LEGAL[si])}
  const[br,bd]=nearBranch(lon,lat);
  const nr=newReps.find(r=>r.branza===b&&r.region===t[1]);
  const fr=field.filter(r=>r.branza===b&&r.region===t[1]);const cand=fr.length?fr:field.filter(r=>r.branza===b);let rep=si===3?pick(kam).id:(cand.length?cand[Math.floor(R()*cand.length)]:pick(field)).id;
  if(si<3&&nr&&am>=nr.startM)rep=nr.id;
  const kc=SIZE_CATS[si][0]+Math.floor(R()*(SIZE_CATS[si][1]-SIZE_CATS[si][0]+1));
  const aff=AFF[b];const fp=new Set();let guard=0;while(fp.size<kc&&guard++<200)fp.add(pickW([...Array(10).keys()],aff));
  const csow=pr?clamp(.14+N()*.04,.06,.3):clamp([.42,.36,.3,.46][si]+N()*.08,.12,.85);
  if(!emp)emp=Math.max(1,Math.round(spend/csow/PPE[b]*Math.exp(N()*.2)));
  const c={id:customers.length,code:'K'+String(20000+customers.length*7%79997+customers.length).slice(-5),name,branza:b,division:divOf(b),size:SIZES[si],si,town:t[0],region:t[1],lon:+(+lon).toFixed(4),lat:+(+lat).toFixed(4),branch:br,branchKm:Math.round(bd),rep,rep0:rep,
   acquired:acqDay<0?new Date(Math.max(1994,2023-Math.floor(-Math.log(1-R()*.97)*7)),Math.floor(R()*12),1+Math.floor(R()*27)):DAYS[acqDay],acqDay,churned:null,churnDay:null,spend,disc:clamp(SIZE_DISC[si]+N()*.03,0,.38),fp,
   eshopDay:null,orsy:null,contract:si>=2&&R()<(si===3?.9:.25),sow:csow,loyal:N(),employees:emp,prospect:pr?pr.id:null,
   priceSens:+(SENS_B[b]*[1.25,1,.85,1.05][si]*Math.exp(N()*.35)).toFixed(2),tierPref:clamp(si*.2+(b==='Industrija'||b==='Avto'?.15:0)+N()*.15,0,.9),cabinetDay:null,churnCause:null};
  if(si<3&&nr&&am<nr.startM&&c.rep!==nr.id){c.moveM=nr.startM;c.moveTo=nr.id}
  // stalni potrošni artikli: kupec jih naroča v svojem ritmu (rokavice, rezalne plošče, vijaki …)
  {const cs=subs.filter(s=>s.consumable&&fp.has(s.cat)&&!s.name.includes('MAT'));const ns=si===0?(R()<.55?1:0):1+Math.floor(R()*Math.min(3,si+1));c.staples=[];
   for(let k=0;k<ns&&cs.length;k++){const j=Math.floor(R()*cs.length);const sb=cs.splice(j,1)[0];c.staples.push({sb:sb.id,g:Math.round((12+R()*42)*(si===0?1.5:1)),next:null,lostM:null})}
   c.stShare=c.staples.length?.22+R()*.14:0}
  // obrati/lokacije večjih kupcev (key account: kje Würth že oskrbuje in kje še ne)
  if(si===3||(si===2&&R()<.35)){const ns=si===3?2+Math.floor(R()*5):2+Math.floor(R()*2);const ws=Array.from({length:ns},(_,k)=>k===0?1.6:.4+R());const wt=sum(ws);
   c.sites=ws.map((w,k)=>{const tt=k===0?t:pickTown();return{town:tt[0],region:tt[1],employees:Math.max(3,Math.round(emp*w/wt*ns*.9)),served:k===0||R()<.42,since:null}});
   const se=c.sites.filter(s=>s.served).reduce((a,s)=>a+s.employees,0),un=c.sites.filter(s=>!s.served);
   if(un.length&&R()<(si===3?.32:.18)){const s=un[Math.floor(R()*un.length)];c._siteM=6+Math.floor(R()*28);c._siteF=(se+s.employees)/se;s._open=c._siteM}}
  // e-trgovina: prevzem s časom
  const eshopP=[.36,.45,.42,.55][si]*(b==='Avto'||b==='Inštalacije'?1.15:1);if(R()<eshopP){c.eshopDay=initial&&R()<.45?-1:Math.max(acqDay,Math.floor(R()*ND*1.15))}if(c.eshopDay!=null&&c.eshopDay>=ND)c.eshopDay=null;
  if(si>=1&&R()<[0,.12,.32,.6][si])c.orsy=pick(['ORSY regal','ORSY regal','ORSY mobil','ORSY kovčki']);
  customers.push(c);return c};
 for(let i=0;i<4300;i++)mkCust(-1,true);
 // avtomatizirane skladiščne omare: prvih 10 kupcev v 2025, nadaljnja širitev v 2026
 const CAB_M=[14,15,16,17,18,19,20,21,22,24,26,27,28,30,31,33];const CAB_B=new Set(['Industrija','Kovina','Avto','Cargo']);
 // pokritost teritorija za pridobivanje: aktiven terenski svetovalec za panogo v regiji
 const coverage=(b,rg,m)=>{const mo=MONTHS[m];return reps.some(r=>r.role==='Terenski svetovalec'&&r.branza===b&&r.region===rg&&r.hired<=mo.end&&!(r.left&&r.left<mo.start))?1.3:.6};
 let covW0=null;
 // ---- simulacija po mesecih ----
 const nC0=customers.length;
 // vrstice (začasni seznami → kasneje razvrščeni po dnevu)
 const T={day:[],cust:[],prod:[],qty:[],net:[],cost:[],list:[],chan:[],rep:[],branch:[],ord:[],promo:[]};let ordN=0;
 const visitCM=[],visitRep=new Uint16Array(256*ND);const quotes=[];
 // selitev skladišča in sedeža Trzin → Škofljica v 2025 (letno poročilo): dostava v roku okt–dec 2025 pade
 const MOVE=[23,25];
 const OTIF=MONTHS.map((m,i)=>{const r2=rng(hash('otif'+i));const base=.965+(r2()-.5)*.016;return i===23?.915:i===24?.928:i===25?.948:base});
 const workdaysOfMonth=MONTHS.map(m=>{const a=[];for(let d=m.d0;d<=m.d1;d++)if(workday(d))a.push(d);return a});
 const allDaysOfMonth=MONTHS.map(m=>{const a=[];for(let d=m.d0;d<=m.d1;d++)a.push(d);return a});
 const pickDay=(m,ch)=>{if(ch===2||ch===3){const a=allDaysOfMonth[m];for(let g=0;g<6;g++){const d=a[Math.floor(R()*a.length)];const w=dowOfDay[d];const p=w===0?.18:w===6?.28:closed[d]?.35:1;if(R()<p)return d}return workdaysOfMonth[m][Math.floor(R()*workdaysOfMonth[m].length)]}
  const a=workdaysOfMonth[m];for(let g=0;g<5;g++){const d=a[Math.floor(R()*a.length)];const w=dowOfDay[d];if(R()<[0,1,.93,.9,.86,.74,0][w])return d}return a[Math.floor(R()*a.length)]};
 const repAt=(c,m)=>{if(c.moveTo!=null&&m>=c.moveM)return c.moveTo;const r=reps[c.rep];if(r.left&&r.vacantFrom!=null&&m>=r.vacantFrom){if(m<r.vacantTo)return-1;return r.replacedBy}return c.rep};
 const SUBWT=subs.map(x=>x.name.includes('regali')?.12:x.name.includes('MAT')?1:x.name.includes('kovčki')?.6:x.name.includes('NOVO')?.8:x.name==='Omrežno orodje'?.7:1);const swC=new Map(),pwC=new Map();
 function subW(m,ci,mat){const k=m*100+ci*2+(mat?1:0);let o=swC.get(k);if(o)return o;const ss=subs.filter(x=>x.cat===ci&&!(x.name.includes('NOVO')&&m<16)&&!(x.name.includes('MAT')&&!mat));const w=ss.map(x=>SUBWT[x.id]);o={subs:ss,w,tot:sum(w)};swC.set(k,o);return o}
 function prodW(m,sb){const k=m*1000+sb.id;let o=pwC.get(k);if(o)return o;const ps=subProds[sb.id].filter(p=>p.launch==null||p.launch<=m);let acc=0;const cum=ps.map(p=>acc+=p.pop*(promo[m].has(p.id)?2.6:1)*(p.old&&m>=16?Math.max(.35,1-(m-16)*.05):1)*(p.launch!=null?Math.min(1.6,.35+(m-p.launch)*.12):1));o={prods:ps,cum};pwC.set(k,o);return o}
 // spremljevalne kategorije v istem naročilu (pri→kem/obd/oro …), da analiza košarice najde prave povezave
 const COMP=[[1,4,2],[0,9,6],[4,0],[4,3],[3,0,5],[5,9],[1,9],[0,2],[0,1],[5,1]];
 function addOrder(c,m,d,ch,lines,valueTarget,catForce,subForce){const oid=ordN++;const rp=repAt(c,m);const rpId=rp<0?255:rp;const br=ch===1?c.branch:255;
  const fps=[...c.fp];const lv=valueTarget/lines;let c0=null;
  for(let l=0;l<lines;l++){let ci=catForce!=null?catForce:fps[Math.floor(R()*fps.length)];if(catForce==null&&c0!=null&&R()<.55){const cc=COMP[c0];ci=cc[Math.floor(R()*cc.length)]}if(c0==null)c0=ci;
   const SW=subForce!=null?{subs:[subs[subForce]],w:[1],tot:1}:subW(m,ci,c.orsy==='ORSY MAT');let p=null;
   for(let tr=0;tr<5;tr++){let x=R()*SW.tot,si=0;for(;si<SW.subs.length-1;si++){x-=SW.w[si];if(x<=0)break}const PW=prodW(m,SW.subs[si]);let y=R()*PW.cum[PW.cum.length-1],lo=0,hi=PW.cum.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(PW.cum[mid]<y)lo=mid+1;else hi=mid}p=PW.prods[lo];const okP=p.list<=lv*2.6||R()<lv*2.6/p.list;const okT=p.tier===2?R()<.3+c.tierPref:p.tier===0?R()>c.tierPref*.55:true;if(okP&&okT)break}
   const isP=promo[m].has(p.id);const lp=p.list*listIdx(m);const rpObj=rp>=0?reps[rp]:null;
   let disc=c.disc+(rpObj&&rpObj.disc?rpObj.disc:0)+(isP?.12:0)+(c.branza==='Gradbeništvo'&&MONTHS[m].y===2026?.035:0)+(ch===2||ch===3?-.01:0)+N()*.018;disc=clamp(disc,0,.55);
   const unit=lp*(1-disc);let q=Math.max(1,Math.round(lv/unit*Math.exp(N()*.5)*(isP?1+.4*c.priceSens:1)));if(p.list>250)q=Math.max(1,Math.min(q,c.si>=2?6:2));
   T.day.push(d);T.cust.push(c.id);T.prod.push(p.id);T.qty.push(q);T.net.push(+(unit*q).toFixed(2));T.cost.push(+(p.cost*costIdx(m)*q).toFixed(2));T.list.push(+(lp*q).toFixed(2));T.chan.push(ch);T.rep.push(rpId);T.branch.push(br);T.ord.push(oid);T.promo.push(isP?1:0)}}
 for(let m=0;m<NM;m++){const mo=MONTHS[m];
  // novi kupci
  // novi kupci: iz registra potencialnih kupcev; verjetnost raste s profilom (fit) in pokritostjo teritorija
  const covSet=new Set();for(const r of reps)if(r.role==='Terenski svetovalec'&&r.hired<=mo.end&&!(r.left&&r.left<mo.start))covSet.add(r.branza+'|'+r.region);
  const open=prospects.filter(p=>p._open);const cw=open.map(p=>covSet.has(p.branza+'|'+p.region)?1.3:.6);const covAvg=avg(cw);if(covW0==null)covW0=covAvg;
  const nNew=pois(44*SEAS.base[mo.m]*(1+m*.003)*covAvg/covW0);const pw=open.map((p,j)=>p._fit*cw[j]);let pwt=sum(pw),gg=0;
  for(let k=0;k<nNew&&pwt>0;k++){let x=R()*pwt,j=0;for(;j<open.length-1;j++){x-=pw[j];if(x<=0)break}if(!pw[j]){pwt=sum(pw);if(++gg>20)break;k--;continue}const p=open[j];pwt-=pw[j];pw[j]=0;p._open=false;
   const d=workdaysOfMonth[m][Math.floor(R()*workdaysOfMonth[m].length)];const c=mkCust(d,false,p);p.customer=c.id;p.convertedDay=d}
  // namestitev skladiščnih omar pri največjih primernih porabnikih potrošnega blaga
  for(const cm2 of CAB_M)if(cm2===m){let best=null,bv=0;for(const c of customers){if(c.cabinetDay!=null||c.si<2||!CAB_B.has(c.branza)||c.decline!=null||c.churnDay!=null||c.acqDay>mo.d0)continue;const v=c.spend*(.7+.6*R());if(v>bv){bv=v;best=c}}
   if(best){best.cabinetDay=workdaysOfMonth[m][2+Math.floor(R()*8)];best.orsy='ORSY MAT'}}
  // obiski: svetovalec razdeli zmogljivost po portfelju
  const vc=new Uint8Array(customers.length);
  const port=group(customers.filter(c=>c.acqDay<=mo.d1&&(c.churnDay==null||c.churnDay>mo.d0)),c=>repAt(c,m));
  for(const r of reps){if(!r.visitRate)continue;if(r.hired>mo.end||(r.left&&r.left<mo.start))continue;const P=port.get(r.id)||[];if(!P.length)continue;
   const cap=pois(workdaysOfMonth[m].length*r.visitRate*(r.role==='Key account manager'?.8:1));const w=P.map(c=>[.22,.6,1.5,3][c.si]*(c.decline?1.4:1)*(c.loyal<-1?.7:1)*(r.region&&c.region!==r.region?.4:1));const ws=sum(w);
   for(let k=0;k<cap;k++){let x=R()*ws,j=0;for(;j<P.length;j++){x-=w[j];if(x<=0)break}const c=P[Math.min(j,P.length-1)];if(vc[c.id]<9)vc[c.id]++;
    const d=workdaysOfMonth[m][Math.floor(R()*workdaysOfMonth[m].length)];visitRep[r.id*ND+d]++;
    if(R()<.035)c.fp.add(pickW([...Array(10).keys()],AFF[c.branza]))}}
  visitCM.push(vc);
  // nakupi
  for(const c of customers){if(c.acqDay>mo.d1)continue;if(c.churnDay!=null&&c.churnDay<mo.d0)continue;
   const age=c.acqDay<0?99:m-monthOfDay[Math.max(0,c.acqDay)];const ramp=age>=6?1:.45+age*.09;
   const se=(SEAS[c.branza]||SEAS.base)[mo.m];const trend=TREND(m);
   let mult=ramp*se*trend*(1+.16*Math.min(vc[c.id],2)*(c.si<2?1:.5));
   const rp=repAt(c,m);if(rp<0)mult*=.84;
   const cab=c.cabinetDay!=null&&c.cabinetDay<=mo.d1;
   if(c.eshopDay!=null&&c.eshopDay<=mo.d1)mult*=1.14;if(c.orsy)mult*=cab?1.17:1.1;
   if(c._siteM!=null&&m>=c._siteM)mult*=c._siteF;
   mult*=1+.9*c.priceSens*(c.disc-SIZE_DISC[c.si]);
   if(c.decline){const k=(m-c.decline)/Math.max(1,c.churnM-c.decline);mult*=Math.max(.08,1-k*.9)}
   const expSpend=c.spend/12*mult*(1-c.stShare);const ov=SIZE_ORDER[c.si]*Math.exp(N()*.2);const nOrd=pois(expSpend/ov);
   for(let o=0;o<nOrd;o++){const e=c.eshopDay!=null&&c.eshopDay<=mo.d1;let ch;
    let cf=null;
    if(cab&&R()<.55){ch=5;const cc=c.fp.size?[...c.fp].filter(x=>CONS_CATS.has(x)):[];cf=cc.length?cc[Math.floor(R()*cc.length)]:0}
    else{const w=[c.si===0?CHW.field[0]:CHW.field[1],c.branchKm<35?(c.si===0?CHW.shop[0]:CHW.shop[1]):CHW.shop[2],e?CHW.eshop:.01,e?(m>=APP_M?CHW.app[1]:CHW.app[0])+m*.002:0,CHW.call,0];ch=pickW([0,1,2,3,4,5],w)}
    const d=pickDay(m,ch);if(c.acqDay>d)continue;if(c.churnDay!=null&&d>=c.churnDay)continue;if(ch===5&&d<c.cabinetDay)ch=0;
    const nl=1+pois(SIZE_LINES[c.si]-(ch===2||ch===3||ch===5?.4:0));addOrder(c,m,d,ch,nl,ov*(ch===2||ch===3?.92:1),cf)}
   // stalni potrošni artikli: naročila v ritmu porabe; del porabe občasno odteče h konkurenci
   if(c.staples.length){const per=c.spend*c.stShare/c.staples.length;const eA=c.eshopDay!=null&&c.eshopDay<=mo.d1;
    for(const st of c.staples){if(st.next==null)st.next=Math.max(c.acqDay<0?0:c.acqDay,Math.floor(R()*st.g));
     while(st.next<=mo.d1){let d=st.next;st.next+=Math.max(5,Math.round(st.g*(1+N()*.1)));if(d<mo.d0||d>=ND)continue;if(c.churnDay!=null&&d>=c.churnDay)continue;if(st.lostM!=null)continue;
      if(c.decline&&R()<(m-c.decline)/Math.max(1,c.churnM-c.decline))continue;
      const ch=cab?(R()<.7?5:0):eA?pickW([0,2,3,4],[.4,.3,.2,.1]):pickW([0,4,1],[.62,.24,c.branchKm<35?.2:.03]);
      if(ch!==2&&ch!==3){let dd=d;while(dd<=mo.d1&&!workday(dd))dd++;if(dd>mo.d1){dd=d;while(dd>=mo.d0&&!workday(dd))dd--}if(dd<mo.d0)continue;d=dd}
      if(c.acqDay>d)continue;
      addOrder(c,m,d,ch,1+(R()<.3?1:0),per*st.g/365*ramp*trend*(cab?1.17:1)*Math.exp(N()*.15),null,st.sb)}
     if(st.lostM==null&&R()<.0045*(c.priceSens>1.3?1.6:1)*(OTIF[m]<.95?2:1))st.lostM=m}}
   // ponudbe
   if(c.si>=1&&R()<[0,.025,.07,.16][c.si]&&rp>=0){const qt=pick(QUOTE_T);const rr=reps[rp];const val=Math.round(qt[2][0]*Math.exp(R()*Math.log(qt[2][1]/qt[2][0]))*[0,.6,1,1.6][c.si]*.45/10)*10;
    const cd=workdaysOfMonth[m][Math.floor(R()*workdaysOfMonth[m].length)];const cyc=Math.round(12+R()*55*(val>15000?1.6:1));const close=cd+cyc;
    const qd=+clamp(.06+N()*.05+(rr.disc||0),0,.3).toFixed(3);const pw=clamp(.42+(rr.skill||0)*.12+(c.orsy?.1:0)+(c.si===3?.08:0)-(qt[0].includes('MAT')?.1:0)+(c.branza==='Gradbeništvo'&&mo.y===2026?-.08:0)+(qd-.07)*1.8,.12,.85);
    const q={id:'P-'+(26000+quotes.length),cust:c.id,rep:rp,type:qt[0],cat:CI[qt[1]],value:val,created:DAYS[cd],createdDay:cd,expClose:new Date(2023,10,1+close),status:'Odprta',stage:null,closed:null,closedDay:null,lostReason:null,prob:null,discount:qd};
    if(close<ND){const won=R()<pw;q.status=won?'Dobljena':'Izgubljena';q.closedDay=close;q.closed=DAYS[close];if(!won)q.lostReason=pickW(LOST_R,c.branza==='Gradbeništvo'&&mo.y===2026?[.58,.2,.08,.07,.04,.03]:qd<.04?[.46,.2,.12,.12,.06,.04]:[.3,.22,.18,.15,.09,.06]);
     else{const parts=val>8000?3:val>3000?2:1;for(let k=0;k<parts;k++){let dd=close+k*30;while(dd<ND-1&&!workday(dd))dd++;if(dd<ND)addOrder(c,monthOfDay[dd],dd,0,2+Math.floor(R()*3),val*(1-q.discount)/(1-c.disc)/parts,q.cat)}}}
    else{const age=ND-1-cd;q.stage=age<10?'Kvalifikacija':age<25?'Ponudba poslana':age<45?'Pogajanja':'Odločanje';q.prob=({'Kvalifikacija':.2,'Ponudba poslana':.35,'Pogajanja':.55,'Odločanje':.7})[q.stage]}
    quotes.push(q)}
   // odliv
   if(c.churnDay==null&&!c.decline){const noV=vc[c.id]===0&&(m<1||visitCM[m-1][c.id]===0),pw26=c.branza==='Gradbeništvo'&&mo.y===2026;
    let hz=[.0105,.0055,.0028,.0008][c.si]*(rp<0?2.6:1)*(OTIF[m]<.95?1.45:1)*(noV?1.25:.85)*(cab?.3:c.orsy?.4:1)*(c.eshopDay!=null&&c.eshopDay<=mo.d1?.78:1)*(pw26?1+.25*c.priceSens:1)*Math.exp(-6*c.priceSens*(c.disc-SIZE_DISC[c.si]))*Math.exp(-.35*c.loyal);
    if(R()<hz){c.decline=m;c.churnCause=rp<0?'Nezaseden teritorij':OTIF[m]<.95&&R()<.7?'Težave z dostavo':(pw26||c.priceSens>1.35)&&R()<.6?'Cena / konkurenca':noV&&R()<.6?'Premalo stika':pickW(['Konkurenca','Prenehanje dejavnosti','Sprememba nabave'],[.45,.3,.25]);c.churnM=m+3+Math.floor(R()*3);const cd=MONTHS[Math.min(NM-1,c.churnM)];if(c.churnM<NM){c.churnDay=cd.d0+Math.floor(R()*20);c.churned=DAYS[c.churnDay];}}}}
 }
 // ---- umeritev na letno poročilo: 2024 in 2025 točno, 2026 (jan–okt) +4,5 % glede na isto obdobje 2025 ----
 {const yr=new Float64Array(T.day.length),tot={2024:0,2025:0,p25:0,y26:0};for(let i=0;i<T.day.length;i++){const mo=MONTHS[monthOfDay[T.day[i]]];yr[i]=mo.y;if(mo.y===2024)tot[2024]+=T.net[i];if(mo.y===2025){tot[2025]+=T.net[i];if(mo.m<=9)tot.p25+=T.net[i]}if(mo.y===2026)tot.y26+=T.net[i]}
  const f24=ANNUAL.y2024.revenue/tot[2024],f25=ANNUAL.y2025.revenue/tot[2025],f26=tot.p25*f25*1.045/tot.y26;
  for(let i=0;i<T.day.length;i++){const f=yr[i]<=2024?f24:yr[i]===2025?f25:f26;T.net[i]=+(T.net[i]*f).toFixed(2);T.cost[i]=+(T.cost[i]*f).toFixed(2);T.list[i]=+(T.list[i]*f).toFixed(2)}}
 // ---- razvrsti vrstice po dnevu (counting sort) ----
 const n=T.day.length;const cnt=new Uint32Array(ND+1);for(let i=0;i<n;i++)cnt[T.day[i]+1]++;for(let d=0;d<ND;d++)cnt[d+1]+=cnt[d];const pos=cnt.slice();const ord=new Uint32Array(n);for(let i=0;i<n;i++)ord[pos[T.day[i]]++]=i;
 const L={day:new Uint16Array(n),cust:new Uint16Array(n),prod:new Uint16Array(n),qty:new Uint16Array(n),net:new Float32Array(n),cost:new Float32Array(n),list:new Float32Array(n),chan:new Uint8Array(n),rep:new Uint8Array(n),branch:new Uint8Array(n),ord:new Uint32Array(n),promo:new Uint8Array(n),month:new Uint8Array(n),cat:new Uint8Array(n),sub:new Uint8Array(n)};
 for(let k=0;k<n;k++){const i=ord[k];L.day[k]=T.day[i];L.cust[k]=T.cust[i];L.prod[k]=T.prod[i];L.qty[k]=Math.min(65535,T.qty[i]);L.net[k]=T.net[i];L.cost[k]=T.cost[i];L.list[k]=T.list[i];L.chan[k]=T.chan[i];L.rep[k]=T.rep[i];L.branch[k]=T.branch[i];L.ord[k]=T.ord[i];L.promo[k]=T.promo[i];L.month[k]=monthOfDay[T.day[i]];const p=products[T.prod[i]];L.cat[k]=p.cat;L.sub[k]=p.sub}
 const dayStart=cnt.slice(0,ND+1);// vrstice dneva d: [dayStart[d], dayStart[d+1])
 // obiski: vsi meseci imajo polno dolžino (kupci, pridobljeni kasneje, imajo 0)
 for(let m=0;m<visitCM.length;m++){const b=new Uint8Array(customers.length);b.set(visitCM[m]);visitCM[m]=b}
 // ---- vračila ----
 const returns=[];const RR=rng(hash('ret'));
 for(let i=0;i<n;i++){const p=products[L.prod[i]];const mv=L.month[i]>=MOVE[0]&&L.month[i]<=MOVE[1]+1&&L.chan[i]!==1;const pr=((L.chan[i]===2||L.chan[i]===3?.034:.017)+(p.cat===CI.ele?.03:0)+(p.cat===CI.ovo?.012:0))*(mv?1.6:1);if(RR()<pr){const d=L.day[i]+3+Math.floor(RR()*22);if(d>=ND)continue;
  const reason=mv&&RR()<.38?(RR()<.6?'Poškodovano pri dostavi':'Napačen artikel'):p.cat===CI.ele&&RR()<.45?'Reklamacija kakovosti':L.chan[i]===2&&RR()<.4?'Napačen artikel':p.cat===CI.ovo&&RR()<.5?'Napačna količina':RETURN_R[Math.floor(RR()*RETURN_R.length)];const fr=reason==='Napačna količina'?.3+RR()*.4:1;
  returns.push({line:i,day:d,date:DAYS[d],cust:L.cust[i],prod:L.prod[i],chan:L.chan[i],rep:L.rep[i],qty:Math.max(1,Math.round(L.qty[i]*fr)),value:+(L.net[i]*fr).toFixed(2),reason})}}
 returns.sort((a,b)=>a.day-b.day);
 // ---- agregati na kupca ----
 const nCu=customers.length;const cm=new Float32Array(nCu*NM),cmg=new Float32Array(nCu*NM),co=new Uint16Array(nCu*NM),ccat=new Float32Array(nCu*10);
 const lastDay=new Int16Array(nCu).fill(-1),firstDay=new Int16Array(nCu).fill(-1);let lastOrd=-1;
 for(let i=0;i<n;i++){const c=L.cust[i],m=L.month[i];cm[c*NM+m]+=L.net[i];cmg[c*NM+m]+=L.net[i]-L.cost[i];ccat[c*10+L.cat[i]]+=L.net[i];if(lastDay[c]<L.day[i])lastDay[c]=L.day[i];if(firstDay[c]<0)firstDay[c]=L.day[i]}
 const seenO=new Uint8Array(ordN);for(let i=0;i<n;i++){const o=L.ord[i];if(!seenO[o]){seenO[o]=1;co[L.cust[i]*NM+L.month[i]]++}}
 customers.forEach(c=>{c.fp=[...c.fp].sort((a,b)=>a-b);c.lastOrder=lastDay[c.id]>=0?DAYS[lastDay[c.id]]:null;c.firstOrder=firstDay[c.id]>=0?DAYS[firstDay[c.id]]:null;
  c.status=c.churnDay!=null?'Izgubljen':c.decline!=null?'V upadu':c.acqDay>=0&&c.acqDay>ND-180?'Nov':'Aktiven';
  c.eshop=c.eshopDay!=null;c.eshopSince=c.eshopDay==null?null:c.eshopDay<0?new Date(2021+Math.floor((c.id%3)),c.id%12,1):DAYS[c.eshopDay];
  const r12=sumRange(cm,c.id*NM+24,c.id*NM+36),p12=sumRange(cm,c.id*NM+12,c.id*NM+24);c.rev12=Math.round(r12);c.revPrev12=Math.round(p12);
  // obrati: odprt obrat je zdaj oskrbovan; potencial (denarnica) zajema vse obrate
  let wallet=Math.max(r12,c.spend)/c.sow;
  if(c.sites){c.sites.forEach(s=>{if(s._open!=null){s.served=true;s.since=MONTHS[s._open].start;delete s._open}});const all=c.sites.reduce((a,s)=>a+s.employees,0),sv=c.sites.filter(s=>s.served).reduce((a,s)=>a+s.employees,0);wallet*=all/sv;
   c.sites.forEach(s=>s.potential=Math.round(wallet*s.employees/all));c.employees=Math.max(c.employees,all)}
  c.potential=Math.round(wallet);
  c.cabinetSince=c.cabinetDay!=null?DAYS[c.cabinetDay]:null;
  if(c.status!=='Izgubljen'&&c.status!=='V upadu')c.churnCause=null;
  c.closedBusiness=c.churnCause==='Prenehanje dejavnosti';
  c.repName=reps[c.rep]?reps[c.rep].name:'—';delete c.decline;delete c.churnM;delete c.spend;delete c.loyal;delete c.sow;delete c._siteM;delete c._siteF;delete c.staples;delete c.stShare});
 // ritem naročanja: mediana dni med naročili v zadnjih 12 mesecih
 {const od=new Map();const seen=new Uint8Array(ordN);for(let i=0;i<n;i++){const o=L.ord[i];if(seen[o])continue;seen[o]=1;const c=L.cust[i];let a=od.get(c);if(!a)od.set(c,a=[]);a.push(L.day[i])}
  customers.forEach(c=>{const a=od.get(c.id)||[];const rec=a.filter(d=>d>=ND-365);const g=[];for(let k=1;k<rec.length;k++)if(rec[k]>rec[k-1])g.push(rec[k]-rec[k-1]);
   c.orders12=rec.length;c.cadence=g.length>=3?Math.round(quantile(g,.5)):null;c.lastOrderDay=lastDay[c.id];c.daysSince=lastDay[c.id]>=0?ND-1-lastDay[c.id]:null;c.overdue=c.cadence&&c.daysSince!=null?+(c.daysSince/c.cadence).toFixed(2):null})}
 prospects.forEach(p=>{p.status=p.customer!=null?'Pridobljen':'Odprt';p.converted=p.convertedDay!=null?DAYS[p.convertedDay]:null;delete p._fit;delete p._open});
 function sumRange(a,i0,i1){let s=0;for(let i=i0;i<i1;i++)s+=a[i];return s}
 // dodelitev po odhodih: trenutni svetovalec
 customers.forEach(c=>{const r=reps[c.rep];if(r.replacedBy!=null&&r.left)c.rep=r.replacedBy;if(c.moveTo!=null){c.rep=c.moveTo;c.repSince=MONTHS[c.moveM].start}delete c.moveTo;delete c.moveM;c.repName=reps[c.rep].name});
 // ---- plan (budžet) ----
 const repMonth=new Float32Array(256*NM),brMonth=new Float32Array(8*NM),catMonth=new Float32Array(10*NM),chMonth=new Float32Array(6*NM),tot=new Float32Array(NM);
 for(let i=0;i<n;i++){const m=L.month[i],v=L.net[i];tot[m]+=v;catMonth[L.cat[i]*NM+m]+=v;chMonth[L.chan[i]*NM+m]+=v;if(L.rep[i]!==255)repMonth[L.rep[i]*NM+m]+=v;if(L.branch[i]!==255)brMonth[L.branch[i]*NM+m]+=v}
 const RB=rng(hash('budget'));const mkPlan=(arr,k)=>{const out=new Float32Array(k*NM);for(let j=0;j<k;j++)for(let m=0;m<NM;m++){const py=m>=12?arr[j*NM+m-12]:arr[j*NM+m]*(.98+RB()*.06);const g=MONTHS[m].y===2026?PLAN_G:MONTHS[m].y===2025?1.04:1.03;out[j*NM+m]=Math.round(py*g*(1+(RB()-.5)*.04))}return out};
 // plan svetovalca izhaja iz lanske prodaje njegovega sedanjega portfelja kupcev (tudi iz mesecev, ko je bil teritorij nezaseden)
 const repPort=new Float32Array(256*NM);customers.forEach(c=>{for(let m=0;m<NM;m++)repPort[c.rep*NM+m]+=cm[c.id*NM+m]});
 const budget={total:mkPlan(tot,1),rep:mkPlan(repPort,256),branch:mkPlan(brMonth,8),cat:mkPlan(catMonth,10),chan:mkPlan(chMonth,6)};
 // plan za nov–dec 2026 (zunaj 36 mesecev podatkov): lanski nov–dec × rast poti do 2033
 const ext=(arr,k)=>{const o=new Float32Array(k*2);for(let j=0;j<k;j++)for(let q=0;q<2;q++)o[j*2+q]=Math.round(arr[j*NM+24+q]*PLAN_G);return o};
 const budgetNovDec={months:['nov 26','dec 26'],total:ext(tot,1),rep:null,branch:ext(brMonth,8),cat:ext(catMonth,10),chan:ext(chMonth,6)};
 // vakantni teritoriji: plan prevzame naslednik

 budgetNovDec.rep=new Float32Array(256*2);for(let j=0;j<256;j++)for(let q=0;q<2;q++)budgetNovDec.rep[j*2+q]=Math.round(budget.rep[j*NM+24+q]/1.04*PLAN_G);
 // ---- digitalni promet ----
 const digital=MONTHS.map((mo,m)=>{const e=chMonth[2*NM+m],a=chMonth[3*NM+m];const conv=.026+m*.0004+(R()-.5)*.002;const ordersE=Math.round(e/320),ordersA=Math.round(a/250);return{month:m,eshopNet:e,appNet:a,eshopOrders:ordersE,appOrders:ordersA,sessions:Math.round((ordersE+ordersA)/conv),conv:+conv.toFixed(4),appUsers:Math.round(380+m*26+(R()-.5)*40),registered:Math.round(1300+m*58)}});
 // ---- API ----
 const S={asOf:new Date(2026,9,31),days:DAYS,months:MONTHS,ND,NM,monthOfDay,dowOfDay,closed,workday,dayOf,
  cats:cats.map(c=>({id:c.id,idx:c.idx,name:c.name})),subs:subs.map(s=>({id:s.id,cat:s.cat,name:s.name,unit:s.unit,consumable:s.consumable})),products,customers,reps,branches,channels:CHANNELS,chShort:CHSHORT,branze:BRANZE,sizes:SIZES,divisions:divisions.map(d=>({name:d[0],branze:d[1]})),
  budgetNovDec,regions:W.geo.regions,prospects,move:{m0:MOVE[0],m1:MOVE[1],label:'Selitev skladišča in sedeža Trzin → Škofljica'},annual:ANNUAL,tiers:TIERS,
  path2033:Array.from({length:9},(_,k)=>({year:2025+k,target:Math.round(REV25*Math.pow(PLAN_G,k))})),
  costToServe:{order:[26,11,3.5,2.5,8,4],visit:38,note:'Ocena stroška obdelave enega naročila po kanalu in enega obiska (demo predpostavka)'},
  cabinetEcon:{install:7800,monthly:110,lifeMonths:60,note:'Ocena: nakup in namestitev omare ter mesečni servis/polnjenje (demo predpostavka)'},L,n,dayStart,returns,quotes,visitCM,visitRepDay:(rep,day)=>visitRep[rep*ND+day],otif:OTIF,budget,digital,promo:promo.map(s=>[...s]),
  cube:{custMonth:cm,custMonthGM:cmg,custMonthOrders:co,custCat:ccat,repMonth,branchMonth:brMonth,catMonth,chanMonth:chMonth,total:tot},events:[
   {month:14,label:'Dvig ceniških cen +3,5 %',type:'cena'},{month:26,label:'Dvig ceniških cen +2,9 %',type:'cena'},{month:16,label:'Lansiran nov akumulatorski sistem 18V',type:'izdelek'},
   {month:MOVE[0],label:'Selitev skladišča in sedeža Trzin → Škofljica (dostava v roku 91,5 %)',type:'logistika'},{month:26,label:'Cenovni pritisk v gradbeništvu',type:'trg'},
   {month:14,label:'Prve avtomatizirane skladiščne omare pri kupcih',type:'kanal'},{month:15,label:'Širitev asortimana potrošnega blaga',type:'izdelek'},{month:APP_M,label:'Prenovljena spletna trgovina in aplikacija',type:'kanal'},
   {month:25,label:'Prehod na divizijsko vodenje (Avto, Lesno-gradbena, Metal)',type:'ekipa'},
   ...newReps.map(r=>({month:r.startM,label:`Nov terenski svetovalec (${r.branza}, ${REGIONS.find(x=>x[0]===r.region)[1]})`,type:'ekipa',rep:r.id})),
   ...departures.map(([r])=>({month:r.vacantFrom,label:`Odhod svetovalca (${r.branza}, ${REGIONS.find(x=>x[0]===r.region)[1]}) — teritorij nezaseden ${r.vacantTo-r.vacantFrom} mes.`,type:'ekipa',rep:r.id}))]};
 S.cust=id=>customers[id];S.prod=id=>products[id];S.rep=id=>id===255||id==null?null:reps[id];S.branch=id=>id===255||id==null?null:branches[id];S.regionName=id=>(REGIONS.find(r=>r[0]===id)||[])[1]||id;S.catName=i=>cats[i].name;
 // dimenzije za agregacijo
 const custIdx={branza:new Uint8Array(nCu),size:new Uint8Array(nCu),region:new Uint8Array(nCu)};customers.forEach(c=>{custIdx.branza[c.id]=BRANZE.indexOf(c.branza);custIdx.size[c.id]=c.si;custIdx.region[c.id]=REGIONS.findIndex(r=>r[0]===c.region)});
 const DIM={day:i=>L.day[i],month:i=>L.month[i],year:i=>MONTHS[L.month[i]].y,quarter:i=>MONTHS[L.month[i]].y*10+Math.floor(MONTHS[L.month[i]].m/3)+1,mon:i=>MONTHS[L.month[i]].m,weekday:i=>dowOfDay[L.day[i]],cat:i=>L.cat[i],sub:i=>L.sub[i],prod:i=>L.prod[i],cust:i=>L.cust[i],rep:i=>L.rep[i],branch:i=>L.branch[i],chan:i=>L.chan[i],promo:i=>L.promo[i],
  branza:i=>custIdx.branza[L.cust[i]],size:i=>custIdx.size[L.cust[i]],region:i=>custIdx.region[L.cust[i]],division:i=>{const r=reps[L.rep[i]];return r?r.division:'Nedodeljeno'}};
 const LBL={day:v=>DAYS[v],month:v=>MONTHS[v].label,year:v=>v,quarter:v=>Math.floor(v/10)+' Q'+v%10,mon:v=>MON[v],weekday:v=>WD[v],cat:v=>cats[v].name,sub:v=>subs[v].name,prod:v=>products[v].name,cust:v=>customers[v].name,rep:v=>v===255?'Nedodeljeno / brez svetovalca':reps[v].name,branch:v=>v===255?'—':branches[v].name,chan:v=>CHANNELS[v],promo:v=>v?'Akcija':'Redno',branza:v=>BRANZE[v],size:v=>SIZES[v],region:v=>REGIONS[v][1],division:v=>v};
 S.dayRange=(from,to)=>{const a=typeof from==='number'?from:dayOf(from),b=typeof to==='number'?to:dayOf(to);return[dayStart[clamp(a,0,ND)],dayStart[clamp(b+1,0,ND)]]};
 // agg({by:['month','cat'], from, to (dan ali Date), where:(i,L)=>bool, filter:{cat,chan,branch,rep,branza,size,region,cust,promo}})
 S.agg=({by=[],from=0,to=ND-1,where,filter}={})=>{const[i0,i1]=S.dayRange(from,to);const fs=[];if(filter)for(const k in filter){const v=filter[k];if(v==null||v===''||(Array.isArray(v)&&!v.length))continue;const set=new Set((Array.isArray(v)?v:[v]).map(x=>typeof x==='string'&&k!=='division'&&/^\d+$/.test(x)?+x:x));const f=DIM[k];fs.push(i=>set.has(f(i)))}
  const keyF=by.map(b=>DIM[b]);const map=new Map();
  for(let i=i0;i<i1;i++){let ok=true;for(const f of fs)if(!f(i)){ok=false;break}if(!ok||(where&&!where(i,L)))continue;
   const k=keyF.length===0?'all':keyF.length===1?keyF[0](i):keyF.map(f=>f(i)).join('|');let r=map.get(k);if(!r){r={key:k,net:0,cost:0,list:0,qty:0,lines:0,_o:new Set(),_c:new Set()};map.set(k,r)}
   r.net+=L.net[i];r.cost+=L.cost[i];r.list+=L.list[i];r.qty+=L.qty[i];r.lines++;r._o.add(L.ord[i]);r._c.add(L.cust[i])}
  const out=[];for(const r of map.values()){const keys=keyF.length<=1?[r.key]:String(r.key).split('|').map((x,j)=>by[j]==='division'?x:+x);const o={keys,label:by.map((b,j)=>LBL[b](keys[j])),net:r.net,cost:r.cost,gm:r.net-r.cost,gmPct:r.net?(r.net-r.cost)/r.net:0,list:r.list,disc:r.list-r.net,discPct:r.list?(r.list-r.net)/r.list:0,qty:r.qty,lines:r.lines,orders:r._o.size,customers:r._c.size,aov:r._o.size?r.net/r._o.size:0};by.forEach((b,j)=>o[b]=keys[j]);out.push(o)}
  return out};
 S.total=(opts={})=>S.agg({...opts,by:[]})[0]||{net:0,cost:0,gm:0,gmPct:0,list:0,disc:0,discPct:0,qty:0,lines:0,orders:0,customers:0,aov:0};
 // obdobja (indeksi dni)
 const d=x=>dayOf(x);
 S.periods={ytd:[d(new Date(2026,0,1)),ND-1],pytd:[d(new Date(2025,0,1)),d(new Date(2025,9,31))],mtd:[d(new Date(2026,9,1)),ND-1],pmtd:[d(new Date(2025,9,1)),d(new Date(2025,9,31))],l12:[d(new Date(2025,10,1)),ND-1],p12:[d(new Date(2024,10,1)),d(new Date(2025,9,31))],y2024:[d(new Date(2024,0,1)),d(new Date(2024,11,31))],y2025:[d(new Date(2025,0,1)),d(new Date(2025,11,31))],all:[0,ND-1]};
 S.planSum=(arr,idx,m0,m1)=>{let s=0;for(let m=m0;m<=m1;m++)s+=arr[idx*NM+m];return s};
 S.basket=({from=0,to=ND-1,level='sub',filter}={})=>{const[i0,i1]=S.dayRange(from,to);const K=level==='cat'?10:subs.length;const co=new Float64Array(K*K),occ=new Float64Array(K);let ord=-1,set=[];let nO=0;
  const flush=()=>{if(set.length){nO++;const u=[...new Set(set)];for(const a of u){occ[a]++;for(const b of u)if(a!==b)co[a*K+b]++}}set=[]};
  // vrstice istega naročila so lahko razpršene po dnevu (isti dan) → zberemo po naročilu
  const byO=new Map();for(let i=i0;i<i1;i++){if(filter&&filter.chan!=null&&L.chan[i]!==filter.chan)continue;if(filter&&filter.branza!=null&&custIdx.branza[L.cust[i]]!==filter.branza)continue;const o=L.ord[i];let a=byO.get(o);if(!a)byO.set(o,a=[]);a.push(level==='cat'?L.cat[i]:L.sub[i])}
  for(const a of byO.values()){set=a;flush()}return{K,co,occ,orders:nO,labels:level==='cat'?cats.map(c=>c.name):subs.map(s=>s.name)}};
 S.custSeries=(c,key='net')=>{const a=key==='gm'?cmg:key==='orders'?co:cm;return Array.from({length:NM},(_,m)=>a[c*NM+m])};
 S.custLines=c=>{const out=[];for(let i=0;i<n;i++)if(L.cust[i]===c)out.push(i);return out};
 S.line=i=>({i,day:L.day[i],date:DAYS[L.day[i]],cust:L.cust[i],prod:L.prod[i],qty:L.qty[i],net:L.net[i],cost:L.cost[i],list:L.list[i],chan:L.chan[i],rep:L.rep[i],branch:L.branch[i],order:L.ord[i],promo:!!L.promo[i]});
 const nf=new Intl.NumberFormat('sl-SI',{maximumFractionDigits:0}),nf1=new Intl.NumberFormat('sl-SI',{minimumFractionDigits:1,maximumFractionDigits:1}),nf2=new Intl.NumberFormat('sl-SI',{minimumFractionDigits:2,maximumFractionDigits:2});
 S.fmt={eur:v=>nf.format(Math.round(v))+' €',eur2:v=>nf2.format(v)+' €',eurK:v=>{const a=Math.abs(v),s=v<0?'−':'';return a>=1e6?s+nf1.format(a/1e6)+' mio €':a>=1e4?s+nf.format(a/1e3)+' tis. €':a>=1e3?s+nf1.format(a/1e3)+' tis. €':s+nf.format(a)+' €'},
  num:v=>nf.format(Math.round(v)),dec:(v,d=1)=>new Intl.NumberFormat('sl-SI',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v),pct:(v,d=1)=>new Intl.NumberFormat('sl-SI',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v*100)+' %',
  pp:(v,d=1)=>(v>0?'+':v<0?'−':'±')+new Intl.NumberFormat('sl-SI',{minimumFractionDigits:d,maximumFractionDigits:d}).format(Math.abs(v*100))+' o.t.',
  delta:(v,d=1)=>(v>0?'+':v<0?'−':'±')+new Intl.NumberFormat('sl-SI',{minimumFractionDigits:d,maximumFractionDigits:d}).format(Math.abs(v*100))+' %',
  date:x=>{const t=typeof x==='number'?DAYS[x]:x;return t?t.getDate()+'. '+(t.getMonth()+1)+'. '+t.getFullYear():'—'},month:m=>MONTHS[m].long,mon:m=>MONTHS[m].label};
 return S}
if(typeof module!=='undefined'&&module.exports)module.exports=W;else root.W=W;
// povratni gumb na kazalo (samo v brskalniku, skrit v vdelanem predogledu)
if(typeof document!=='undefined'){const add=()=>{
 // IBCS vzorci za grafe: šrafura za napoved (FC) in za odprte/planirane vrednosti — uporaba fill="url(#w-fc)"
 if(!document.getElementById('w-ibcs-defs')){const d=document.createElementNS('http://www.w3.org/2000/svg','svg');d.id='w-ibcs-defs';d.setAttribute('aria-hidden','true');d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML='<defs><pattern id="w-fc" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><rect width="2" height="5" fill="#404040"/></pattern><pattern id="w-fc-l" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><rect width="1.6" height="5" fill="#a6a6a6"/></pattern></defs>';document.body.prepend(d)}
 const emb=window.top!==window||location.hash==='#t';if(emb){document.documentElement.classList.add('embed');return}if(document.querySelector('.w-bk'))return;
 const st=document.createElement('style');st.textContent='.w-bk{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9500;font:700 12px/1 Arial,Helvetica,sans-serif;padding:9px 12px;border-radius:3px;background:#cc0000;color:#fff;text-decoration:none;box-shadow:0 2px 10px rgba(0,0,0,.25)}.w-bk:hover{background:#a30000}@media print{.w-bk{display:none}}';document.head.appendChild(st);
 const b=document.createElement('a');b.className='w-bk';b.href='index.html';b.textContent='← Vse analize';document.body.appendChild(b)};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',add):add()}
})(typeof window!=='undefined'?window:globalThis);
