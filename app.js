const TERMS={
  atm:{title:"ATM — At the money",text:"Option dont le prix d’exercice est proche du prix actuel du future. Sa volatilité sert souvent de point central à la surface."},
  skew:{title:"Skew",text:"Différence de volatilité entre les options de baisse et de hausse. Il mesure l’asymétrie du risque perçu."},
  termStructure:{title:"Structure temporelle",text:"Comparaison de la volatilité entre les échéances courtes et longues."},
  dataQuality:{title:"Qualité des données",text:"Score résumant la fraîcheur, la liquidité et la cohérence des cotations utilisées."},
  maturity:{title:"Maturité / échéance",text:"Date à laquelle l’option expire. Plus elle est éloignée, plus le scénario futur est incertain."},
  smile:{title:"Smile de volatilité",text:"Courbe de volatilité implicite pour une même échéance, tracée selon le strike ou la moneyness."},
  svi:{title:"SVI",text:"Modèle mathématique souple utilisé pour lisser un smile de volatilité sans suivre chaque bruit de cotation."},
  zscore:{title:"Z-score",text:"Écart à la moyenne exprimé en nombre d’écarts-types. Un score élevé signale un mouvement inhabituel, pas nécessairement une erreur de prix."},
  iv:{title:"Volatilité implicite",text:"Amplitude de mouvement qui, insérée dans un modèle d’options, reproduit le prix observé sur le marché."},
  moneyness:{title:"Moneyness",text:"Position du strike par rapport au prix du future. 100 % signifie que les deux sont proches."},
  bidask:{title:"Spread bid–ask",text:"Écart entre le meilleur prix d’achat et le meilleur prix de vente. C’est un coût important de transaction."},
  vega:{title:"Vega",text:"Variation approximative du prix d’une option lorsque la volatilité implicite augmente d’un point."},
  arbitrage:{title:"Absence d’arbitrage",text:"Ensemble de règles qui empêchent une combinaison d’options de produire un gain certain sans risque ni capital."},
  relative:{title:"Relative value",text:"Comparaison de deux instruments proches pour détecter lequel semble cher ou bon marché relativement à l’autre."},
  realizedVol:{title:"Volatilité réalisée",text:"Amplitude réellement observée dans les variations de prix passées. Ici, elle est annualisée à partir de 20 jours de rendements quotidiens."},
  har:{title:"Modèle HAR",text:"Modèle de prévision qui combine la volatilité récente, mensuelle et trimestrielle. Il est simple, interprétable et adapté à la persistance de la volatilité."},
  sample:{title:"Profondeur historique",text:"Durée et nombre d’observations utilisées. Une longue période permet d’inclure plusieurs régimes de marché et plusieurs crises."},
  spot:{title:"Prix spot",text:"Prix de référence pour une livraison proche. Il ne doit pas être confondu avec le prix d’un contrat future d’une échéance précise."},
  oos:{title:"Hors échantillon",text:"Période gardée à l’écart pendant l’estimation, puis utilisée pour mesurer la performance sur des données que le modèle n’a pas vues."},
  proxy:{title:"Proxy",text:"Indicateur approchant une variable qui n’est pas directement disponible. Un proxy est utile, mais ne constitue pas une mesure exacte."}
};

let state={asset:"WTI",surfaceMode:"heat",view:"overview",axis:"moneyness",model:"SVI"};
let historicalData=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function surfaceData(asset=state.asset){
  const maturities=["1S","1M","2M","3M","6M","12M"], moneyness=[80,90,95,100,105,110,120];
  const base=asset==="WTI"?29.2:27.4;
  const values=maturities.map((_,y)=>moneyness.map((m,x)=>{
    const wing=Math.pow((m-101)/15,2)*(asset==="WTI"?3.7:3.2);
    const downside=m<100?(100-m)*.17:0;
    const term=5.2*Math.exp(-y*.58);
    return +(base+term+wing+downside+Math.sin(x*.8+y*.55)*.38).toFixed(1);
  }));
  return {maturities,moneyness,values};
}

function colorScale(v,min=26,max=43){
  const t=clamp((v-min)/(max-min),0,1); const stops=[[17,61,67],[31,132,127],[183,222,76],[240,118,94]];
  const p=t*(stops.length-1),i=Math.min(stops.length-2,Math.floor(p)),f=p-i;
  return `rgb(${stops[i].map((c,j)=>Math.round(c+(stops[i+1][j]-c)*f)).join(",")})`;
}

function setupCanvas(canvas){
  const dpr=window.devicePixelRatio||1,rect=canvas.getBoundingClientRect(); canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;
  const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);return {ctx,w:rect.width,h:rect.height};
}

function drawHeatmap(canvas,tooltip,mode="surface"){
  const {ctx,w,h}=setupCanvas(canvas); const d=surfaceData(mode==="compare"?"WTI":state.asset); const pad={l:56,r:22,t:26,b:42};
  const rows=d.maturities.length,cols=d.moneyness.length,cw=(w-pad.l-pad.r)/cols,ch=(h-pad.t-pad.b)/rows;
  ctx.clearRect(0,0,w,h);ctx.font="12px Inter";ctx.textAlign="center";ctx.textBaseline="middle";
  const cells=[];
  d.values.forEach((row,y)=>row.forEach((v,x)=>{let value=v;if(mode==="compare") value=surfaceData("Brent").values[y][x]-v; const color=mode==="compare"?(value>0?`rgba(240,118,94,${.35+Math.abs(value)/5})`:`rgba(82,185,210,${.35+Math.abs(value)/5})`):colorScale(v);
    const px=pad.l+x*cw,py=pad.t+y*ch;ctx.fillStyle=color;roundRect(ctx,px+2,py+2,cw-4,ch-4,7);ctx.fill();ctx.fillStyle=mode==="compare"?"#f4f2e9":(v>37?"#11201e":"#f4f2e9");ctx.fillText(mode==="compare"?`${value>0?"+":""}${value.toFixed(1)}`:`${v.toFixed(1)}%`,px+cw/2,py+ch/2);cells.push({x:px,y:py,w:cw,h:ch,value,m:d.moneyness[x],expiry:d.maturities[y]});
  }));
  ctx.fillStyle="#90a7a1";d.moneyness.forEach((m,x)=>ctx.fillText(`${m}%`,pad.l+x*cw+cw/2,h-17));ctx.textAlign="right";d.maturities.forEach((m,y)=>ctx.fillText(m,pad.l-12,pad.t+y*ch+ch/2));
  canvas.onmousemove=e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,c=cells.find(c=>x>=c.x&&x<c.x+c.w&&y>=c.y&&y<c.y+c.h);if(!c){tooltip.hidden=true;return}tooltip.hidden=false;tooltip.style.left=`${Math.min(w-170,x+12)}px`;tooltip.style.top=`${Math.max(4,y-64)}px`;tooltip.innerHTML=mode==="compare"?`<strong>Brent − WTI : ${c.value>0?"+":""}${c.value.toFixed(1)} pts</strong><span>${c.expiry} · moneyness ${c.m}%</span>`:`<strong>${c.value.toFixed(1)} % de volatilité</strong><span>${c.expiry} · moneyness ${c.m}%</span>`};canvas.onmouseleave=()=>tooltip.hidden=true;
}

function drawMesh(canvas,tooltip){
  const {ctx,w,h}=setupCanvas(canvas),d=surfaceData();ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(w*.48,h*.57);const sx=Math.min(47,w/15),sy=29,sz=7.2;const project=(x,y,z)=>({x:(x-y)*sx*.7,y:(x+y)*sy*.38-z*sz});
  for(let y=d.values.length-2;y>=0;y--)for(let x=0;x<d.values[0].length-1;x++){const pts=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(([ix,iy])=>project(ix-3,iy-2.5,d.values[iy][ix]-25));ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();const avg=(d.values[y][x]+d.values[y][x+1]+d.values[y+1][x]+d.values[y+1][x+1])/4;ctx.fillStyle=colorScale(avg);ctx.globalAlpha=.78;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle="rgba(244,242,233,.3)";ctx.stroke()}
  ctx.restore();ctx.fillStyle="#90a7a1";ctx.font="12px Inter";ctx.fillText("Moneyness →",w-105,h-18);ctx.fillText("Maturité →",18,h-18);
}

function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):(ctx.rect(x,y,w,h));}

function drawLineChart(svg,kind){
  const w=kind==="term"?440:620,h=250,p={l:42,r:20,t:18,b:38};let vals,labels;
  if(kind==="term"){labels=["1S","1M","2M","3M","6M","12M"];vals=state.asset==="WTI"?[38.7,31.8,30.4,29.6,28.8,28.1]:[35.8,29.6,28.9,28.3,27.9,27.5];}
  else {labels=["80%","90%","95%","100%","105%","110%","120%"];vals=surfaceData().values[1];}
  const min=Math.floor(Math.min(...vals)-2),max=Math.ceil(Math.max(...vals)+2),x=i=>p.l+i*(w-p.l-p.r)/(vals.length-1),y=v=>p.t+(max-v)*(h-p.t-p.b)/(max-min);
  const grid=[0,.25,.5,.75,1].map(t=>{const yy=p.t+t*(h-p.t-p.b),v=(max-t*(max-min)).toFixed(0);return `<line x1="${p.l}" y1="${yy}" x2="${w-p.r}" y2="${yy}" stroke="#24403d"/><text x="${p.l-8}" y="${yy+4}" text-anchor="end" fill="#8fa7a1" font-size="11">${v}%</text>`}).join("");
  const path=vals.map((v,i)=>`${i?"L":"M"}${x(i)},${y(v)}`).join(" "),area=`${path} L${x(vals.length-1)},${h-p.b} L${x(0)},${h-p.b} Z`;
  svg.innerHTML=`<defs><linearGradient id="fill-${kind}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b7e64a" stop-opacity=".24"/><stop offset="1" stop-color="#b7e64a" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#fill-${kind})"/><path d="${path}" fill="none" stroke="#b7e64a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${vals.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="#071414" stroke="#b7e64a" stroke-width="2"><title>${labels[i]} : ${v.toFixed(1)} %</title></circle><text x="${x(i)}" y="${h-14}" text-anchor="middle" fill="#8fa7a1" font-size="11">${labels[i]}</text>`).join("")}`;
}

const scannerRows=[
  ["WTI","18 déc. 2026","62,5","35,8 %","34,2 %","+1,6 pt","+2,1","Riche","rich"],
  ["WTI","18 déc. 2026","75,0","29,7 %","30,8 %","−1,1 pt","−1,8","Bon marché","cheap"],
  ["WTI","17 fév. 2027","60,0","33,1 %","32,9 %","+0,2 pt","+0,3","Proche du modèle","fair"],
  ["WTI","17 fév. 2027","80,0","31,4 %","30,5 %","+0,9 pt","+1,4","À surveiller","rich"],
  ["Brent","26 janv. 2027","65,0","30,9 %","32,0 %","−1,1 pt","−1,7","Bon marché","cheap"],
  ["Brent","26 janv. 2027","77,5","27,6 %","27,2 %","+0,4 pt","+0,6","Proche du modèle","fair"]
];
function renderScanner(filter=""){$("#scannerBody").innerHTML=scannerRows.filter(r=>r.join(" ").toLowerCase().includes(filter.toLowerCase())).map(r=>`<tr>${r.slice(0,7).map(x=>`<td>${x}</td>`).join("")}<td><span class="tag ${r[8]}">${r[7]}</span></td></tr>`).join("")}

function updateAll(){
  $("#atmKpi").textContent=state.asset==="WTI"?"31,8 %":"29,6 %";$("#skewKpi").textContent=state.asset==="WTI"?"−4,2 pts":"−3,5 pts";$("#surfaceTitle").textContent=`${state.asset} · Modèle ${state.model}`;
  drawHeatmap($("#surfaceCanvas"),$("#chartTooltip"));drawHeatmap($("#detailSurfaceCanvas"),$("#detailTooltip"));drawHeatmap($("#compareCanvas"),$("#compareTooltip"),"compare");drawLineChart($("#termChart"),"term");drawLineChart($("#smileChart"),"smile");
  if(historicalData)updateHistory();
}

function showView(view){state.view=view;$$('.view').forEach(v=>v.classList.remove('active'));$(`#${view}View`).classList.add('active');$$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===view));const titles={overview:"Vue d’ensemble",history:"Historique réel",surface:"Surface implicite",compare:"Brent vs WTI",scanner:"Scanner relative value",learn:"Comprendre"};$("#pageTitle").textContent=titles[view];setTimeout(updateAll,20)}

function frDate(value){return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${value}T00:00:00`))}
function frNumber(value,digits=1){return new Intl.NumberFormat('fr-FR',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value)}
function updateHistory(){
  const d=historicalData[state.asset];if(!d)return;
  const years=Math.round((new Date(d.end)-new Date(d.start))/(365.25*864e5));
  $("#historyCoverage").textContent=`${state.asset} · ${frDate(d.start)} → ${frDate(d.end)}`;
  $("#dateSelect option").textContent=frDate(d.end);
  $("#histYears").textContent=`${years} ans`;$("#histDates").textContent=`${frDate(d.start)} → ${frDate(d.end)}`;
  $("#histPrice").textContent=`$${frNumber(d.latestPrice,2)}`;$("#histObs").textContent=`${new Intl.NumberFormat('fr-FR').format(d.observations)} observations`;
  $("#histCurrentVol").textContent=`${frNumber(d.currentVol)} %`;$("#histForecast").textContent=`${frNumber(d.forecast5d)} %`;
  $("#histInterval").textContent=`Intervalle 80 % : ${frNumber(d.interval80[0])}–${frNumber(d.interval80[1])} %`;
  $("#historyChartTitle").textContent=`${state.asset} · ${years} ans d’historique`;
  $("#validationPeriod").textContent=`Test : ${d.validation.test} · ${new Intl.NumberFormat('fr-FR').format(d.validation.testObservations)} observations`;
  const rows=[["HAR 5/22/66 j",d.validation.har,"best"],["Repère naïf 22 j",d.validation.naive,""]];
  $("#validationBody").innerHTML=rows.map(([name,m,c])=>`<tr class="${c}"><td>${name}</td><td>${frNumber(m.mae,2)}</td><td>${frNumber(m.rmse,2)}</td><td>${frNumber(m.correlation,3)}</td></tr>`).join('');
  drawHistoryChart(d.history);
}

function drawHistoryChart(history){
  const canvas=$("#historyCanvas"),tooltip=$("#historyTooltip"),{ctx,w,h}=setupCanvas(canvas),p={l:50,r:50,t:22,b:40};
  const prices=history.map(x=>x.p),vols=history.map(x=>x.v),minP=Math.min(...prices),maxP=Math.max(...prices),maxV=Math.max(...vols)*1.05;
  const x=i=>p.l+i*(w-p.l-p.r)/(history.length-1),yp=v=>p.t+(maxP-v)*(h-p.t-p.b)/(maxP-minP),yv=v=>p.t+(maxV-v)*(h-p.t-p.b)/maxV;
  ctx.clearRect(0,0,w,h);ctx.font='11px Inter';ctx.fillStyle='#8fa7a1';ctx.strokeStyle='#24403d';ctx.lineWidth=1;
  for(let i=0;i<5;i++){const yy=p.t+i*(h-p.t-p.b)/4;ctx.beginPath();ctx.moveTo(p.l,yy);ctx.lineTo(w-p.r,yy);ctx.stroke();ctx.textAlign='right';ctx.fillText(`$${(maxP-i*(maxP-minP)/4).toFixed(0)}`,p.l-7,yy+4);ctx.textAlign='left';ctx.fillText(`${(maxV-i*maxV/4).toFixed(0)}%`,w-p.r+7,yy+4)}
  const draw=(values,y,color,width)=>{ctx.beginPath();values.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()};
  draw(prices,yp,'#94a7a1',1.4);draw(vols,yv,'#b7e64a',2);
  const tickCount=Math.min(6,history.length);ctx.textAlign='center';ctx.fillStyle='#8fa7a1';for(let i=0;i<tickCount;i++){const idx=Math.round(i*(history.length-1)/(tickCount-1));ctx.fillText(new Date(`${history[idx].d}T00:00:00`).getFullYear(),x(idx),h-14)}
  canvas.onmousemove=e=>{const r=canvas.getBoundingClientRect(),mx=e.clientX-r.left,idx=clamp(Math.round((mx-p.l)/(w-p.l-p.r)*(history.length-1)),0,history.length-1),d=history[idx];tooltip.hidden=false;tooltip.style.left=`${clamp(mx+12,4,w-190)}px`;tooltip.style.top='38px';tooltip.innerHTML=`<strong>${frDate(d.d)}</strong><span>Prix : $${frNumber(d.p,2)} · Vol. : ${frNumber(d.v)} %</span>`};canvas.onmouseleave=()=>tooltip.hidden=true;
}

async function loadHistorical(){try{const response=await fetch('historical.json');if(!response.ok)throw new Error(response.status);historicalData=await response.json();updateHistory()}catch(error){$("#historyError").hidden=false;console.error('Historique indisponible',error)}}

$$('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
$("#assetSelect").addEventListener('change',e=>{state.asset=e.target.value;updateAll()});
$$('[data-surface-mode]').forEach(b=>b.addEventListener('click',()=>{$$('[data-surface-mode]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.surfaceMode=b.dataset.surfaceMode;state.surfaceMode==='mesh'?drawMesh($("#surfaceCanvas"),$("#chartTooltip")):drawHeatmap($("#surfaceCanvas"),$("#chartTooltip"))}));
$("#modelSelect").addEventListener('change',e=>state.model=e.target.value);
$("#liquidityRange").addEventListener('input',e=>$("#liquidityValue").textContent=`${e.target.value} contrats`);
$("#recalibrate").addEventListener('click',e=>{e.target.textContent="Calibration…";e.target.disabled=true;setTimeout(()=>{e.target.textContent="Surface recalibrée ✓";$("#rmseValue").textContent=(.31+Math.random()*.18).toFixed(2).replace('.',',')+" pt";state.model=$("#modelSelect").value;updateAll();setTimeout(()=>{e.target.textContent="Recalibrer la surface";e.target.disabled=false},1200)},650)});
$("#scannerSearch").addEventListener('input',e=>renderScanner(e.target.value));
$("#exportCsv").addEventListener('click',()=>{const csv=["Contrat,Echeance,Strike,IV marche,IV modele,Ecart,Z-score,Lecture",...scannerRows.map(r=>r.slice(0,8).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='crudevol-scanner-demo.csv';a.click();URL.revokeObjectURL(a.href)});

const pop=$("#termPopover");$$('.term').forEach(b=>{const show=()=>{const t=TERMS[b.dataset.term];if(!t)return;const r=b.getBoundingClientRect();pop.innerHTML=`<strong>${t.title}</strong>${t.text}`;pop.hidden=false;pop.style.left=`${clamp(r.left,10,window.innerWidth-290)}px`;pop.style.top=`${r.bottom+7}px`};b.addEventListener('mouseenter',show);b.addEventListener('focus',show);b.addEventListener('mouseleave',()=>pop.hidden=true);b.addEventListener('blur',()=>pop.hidden=true);b.addEventListener('click',show)});

const glossary=$("#glossaryDialog");function renderGlossary(q=""){$("#glossaryList").innerHTML=Object.values(TERMS).filter(t=>(t.title+t.text).toLowerCase().includes(q.toLowerCase())).map(t=>`<article class="glossary-entry"><strong>${t.title}</strong><p>${t.text}</p></article>`).join('')}
$$('.open-glossary').forEach(button=>button.addEventListener('click',()=>{renderGlossary();glossary.showModal()}));$("#closeGlossary").addEventListener('click',()=>glossary.close());$("#glossarySearch").addEventListener('input',e=>renderGlossary(e.target.value));
const drawer=$("#helpDrawer"),backdrop=$("#drawerBackdrop");function closeHelp(){drawer.classList.remove('open');backdrop.classList.remove('open');drawer.setAttribute('aria-hidden','true')}$("#toggleHelp").addEventListener('click',()=>{drawer.classList.add('open');backdrop.classList.add('open');drawer.setAttribute('aria-hidden','false')});$("#closeHelp").addEventListener('click',closeHelp);backdrop.addEventListener('click',closeHelp);
window.addEventListener('resize',()=>requestAnimationFrame(updateAll));
renderScanner();updateAll();loadHistorical();
