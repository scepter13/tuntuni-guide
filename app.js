(function(){
'use strict';
const $=s=>document.querySelector(s), $$=(s,r)=>[...(r||document).querySelectorAll(s)];
const LS={get(k,d){try{const v=localStorage.getItem('tt.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
          set(k,v){try{localStorage.setItem('tt.'+k,JSON.stringify(v));return true}catch(e){toast('저장 공간이 부족해요');return false}}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),1600)}

/* ---------- KST ---------- */
const kst=ms=>new Date((ms??Date.now())+9*3600e3);
const ymd=d=>d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
const today=()=>{const q=location.search.match(/[?&]d=(\d{4}-\d{2}-\d{2})/);return q?q[1]:ymd(kst())}; // ?d=2026-12-01 로 미리보기
const dnum=s=>{const [y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d)/864e5};
const diff=(a,b)=>dnum(b)-dnum(a);
const hm=ms=>{const d=kst(ms);return String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0')};
const WD=['일','월','화','수','목','금','토'];
const ADMIT='2026-11-30', SURG='2026-12-01';
const phaseIdx=t=>Math.max(0,PHASES.findIndex(p=>t>=p.from&&t<=p.to));

/* ---------- checks (keys unchanged: tt.ck) ---------- */
let CK=LS.get('ck',{});
const PK={};PACK.forEach(g=>g.items.forEach(i=>PK['pk.'+i[0]]={html:i[1],tip:i[2],rec:i[3]==='rec'}));
const SVG='<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
function srcHtml(keys){return (keys||[]).map(k=>{const s=SRC[k];if(!s)return'';return s[1]?`<a href="${s[1]}" target="_blank" rel="noopener">${esc(s[0])}</a>`:esc(s[0])}).filter(Boolean).join(' · ')}
function ckRow(key,html,tip,src){return `<div class="ck${CK[key]?' done':''}" data-k="${key}" role="checkbox" aria-checked="${!!CK[key]}" tabindex="0"><div class="box">${SVG}</div><div class="t">${html}${tip?`<span class="tp">${tip}</span>`:''}${src?`<span class="src">${src}</span>`:''}</div></div>`}
function toggle(key){
  CK[key]=!CK[key];if(!CK[key])delete CK[key];LS.set('ck',CK);
  $$(`.ck[data-k="${key}"]`).forEach(el=>{el.classList.toggle('done',!!CK[key]);el.setAttribute('aria-checked',!!CK[key])});
  if(CK[key]&&navigator.vibrate)navigator.vibrate(15);
  refresh();
}
document.addEventListener('click',e=>{const el=e.target.closest('.ck[data-k]');if(!el||e.target.closest('a'))return;toggle(el.dataset.k)});
document.addEventListener('keydown',e=>{const el=e.target.closest&&e.target.closest('.ck[data-k]');if(el&&(e.key===' '||e.key==='Enter')){e.preventDefault();toggle(el.dataset.k)}});
const packKeys=()=>Object.keys(PK);
function refresh(){
  $$('.cardx[data-cks]').forEach(c=>{const ks=c.dataset.cks.split(',');c.classList.toggle('complete',ks.every(k=>CK[k]))});
  const ks=packKeys(),n=ks.filter(k=>CK[k]).length;
  $$('[data-dyn="packn"]').forEach(e=>e.textContent=`${n} / ${ks.length}`);
  $$('[data-dyn="packbar"]').forEach(e=>e.style.width=(n/ks.length*100)+'%');
  $$('[data-dyn="packgroups"]').forEach(e=>e.innerHTML=PACK.map(g=>{const k=g.items.map(i=>'pk.'+i[0]);const c=k.filter(x=>CK[x]).length;return `<div class="sumrow"><span>${g.g}</span><b>${c===k.length?'✅':c+'/'+k.length}</b></div>`}).join(''));
}
window.resetPack=function(){if(!confirm('준비물 체크를 모두 지울까요?'))return;packKeys().forEach(k=>delete CK[k]);LS.set('ck',CK);$$('.ck[data-k^="pk."]').forEach(el=>el.classList.remove('done'));refresh()};

/* ---------- questions (tt.q) ---------- */
let QS=LS.get('q',[]);
function qHtml(){
  return `<textarea id="q-in" rows="2" placeholder="궁금한 걸 적어두세요"></textarea>
  <button class="act go" onclick="addQ()">＋ 메모 추가</button>
  <div class="qs">${Q_SUGGEST.filter(s=>!QS.some(q=>q.t===s)).slice(0,3).map(s=>`<button data-qs="${esc(s)}">＋ ${esc(s)}</button>`).join('')}</div>
  <div>${QS.length?QS.map((q,i)=>`<div class="qi"><div class="ck${q.d?' done':''}" data-qi="${i}"><div class="box">${SVG}</div><div class="t">${esc(q.t)}</div></div><button class="del" data-qdel="${i}" aria-label="삭제">✕</button></div>`).join(''):'<p class="sm" style="text-align:center">물어본 질문은 탭해서 체크!</p>'}</div>`;
}
function renderQ(){$$('[data-dyn="qmemo"]').forEach(e=>e.innerHTML=qHtml())}
window.addQ=function(){const el=$('#q-in');const v=el&&el.value.trim();if(!v)return;QS.push({t:v,d:false});LS.set('q',QS);renderQ();toast('메모했어요')};
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-qs]');if(s){QS.push({t:s.dataset.qs,d:false});LS.set('q',QS);renderQ();toast('추가했어요');return}
  const c=e.target.closest('[data-qi]');if(c){const q=QS[+c.dataset.qi];q.d=!q.d;LS.set('q',QS);renderQ();return}
  const d=e.target.closest('[data-qdel]');if(d){QS.splice(+d.dataset.qdel,1);LS.set('q',QS);renderQ()}
});

/* ---------- card renderer ---------- */
function actHtml(a){
  if(a.t==='tel')return `<a class="act" href="tel:${a.n}">📞 ${esc(a.l)}</a>`;
  if(a.t==='link')return `<a class="act" href="${a.u}" target="_blank" rel="noopener">${a.l}</a>`;
  if(a.t==='go')return `<button class="act go" data-go="${a.p}"${a.last?' data-last="1"':''}>${a.l}</button>`;
  if(a.t==='log')return `<button class="act lg" data-log="${a.k}">${a.l}</button>`;
  return '';
}
function cardHtml(c){
  let d=0;
  let body='';
  const compact=!!(c.ck||c.dck||c.type==='packsum'||c.type==='contacts'||c.type==='qmemo');
  if(compact){
    body+=`<div class="hd a" style="--d:${d++}"><div class="emo sm"><span>${c.e}</span></div><div>${c.tag?`<span class="tag">${esc(c.tag)}</span>`:''}<div class="kx left">${c.k}</div></div></div>`;
  }else{
    body+=`<div class="emo"><span>${c.e}</span></div>`;
    if(c.tag)body+=`<div class="a" style="--d:${d++};text-align:center"><span class="tag">${esc(c.tag)}</span></div>`;
    body+=`<div class="kx a" style="--d:${d++}">${c.k}</div>`;
  }
  if(c.big)body+=`<div class="bigx a" style="--d:${d++}"><div class="v">${c.big}</div>${c.bigS?`<div class="vs">${c.bigS}</div>`:''}</div>`;
  if(c.type==='packprog')body+=`<div class="bigx a" style="--d:${d++}"><div class="v" data-dyn="packn"></div><div class="vs">챙긴 준비물</div></div><div class="pbar a" style="--d:${d++}"><i data-dyn="packbar"></i></div>`;
  if(c.lines)body+=`<div class="lns">${c.lines.map(l=>`<p class="a" style="--d:${d++}">${l}</p>`).join('')}</div>`;
  if(c.ck)body+=`<div class="cks a" style="--d:${d++}">${c.ck.map(k=>{const p=PK[k];return ckRow(k,p.html+(p.rec?' <span class="pill">추천</span>':''),p.tip)}).join('')}</div>`;
  if(c.dck)body+=`<div class="cks a" style="--d:${d++}">${c.dck.map(x=>ckRow(x.key,x.html,'',srcHtml(x.src))).join('')}</div>`;
  if(c.type==='packsum')body+=`<div class="row sb a" style="--d:${d++}"><b>챙긴 준비물</b><b data-dyn="packn" style="color:var(--peach-d);font-size:20px"></b></div><div class="pbar a" style="--d:${d++}"><i data-dyn="packbar"></i></div><div class="a" style="--d:${d++}" data-dyn="packgroups"></div><button class="ghost a" style="--d:${d++}" onclick="resetPack()">체크 모두 지우기</button>`;
  const TELS={hosp:[['대표번호','16617500','1661-7500'],['산부인과 외래','0318203088','031-820-3088'],['분만실','0318203301','031-820-3301'],['신생아실','0318203305','031-820-3305']],etc:[['주차관리소','0318203296','031-820-3296'],['주차관제실(야간)','0318205256','031-820-5256'],['히아신스 산후조리원','0318539115','031-853-9115']]};
  if(c.type==='contacts')body+=`<div class="a" style="--d:${d++}">${TELS[c.list].map(x=>`<a class="tel" href="tel:${x[1]}"><span>${x[0]}</span><span>${x[2]}</span></a>`).join('')}${c.list==='etc'?`<a class="tel" href="${MAP_HOSP}" target="_blank" rel="noopener"><span>병원 지도 (네이버)</span><span>열기 ›</span></a><p class="sm" style="text-align:center;margin:8px 0 0">안내문의 '입원생활 안내문' QR코드로 더 자세히 볼 수 있어요.</p>`:''}</div>`;
  if(c.type==='qmemo')body+=`<div class="a" style="--d:${d++};display:flex;flex-direction:column;gap:8px" data-dyn="qmemo">${qHtml()}</div>`;
  if(c.ck||c.dck)body+=`<span class="alldone">✓ 다 챙겼어요</span>`;
  if(c.act)body+=`<div class="acts${c.act.length===2?" two":""} a" style="--d:${d++}">${c.act.map(actHtml).join('')}</div>`;
  if(c.src&&c.src.length)body+=`<div class="srcs">출처: ${srcHtml(c.src)}</div>`;
  const cks=(c.ck||[]).concat((c.dck||[]).map(x=>x.key));
  return `<div class="cardx${c.warn?' warn':''}${compact?' compact':''}"${cks.length?` data-cks="${cks.join(',')}"`:''}><div class="ci">${body}</div></div>`;
}

/* ---------- deck ---------- */
const POS=LS.get('deckpos',{});
const DECKS={};
function Deck(root,o){
  const n=o.cards.length;let i=Math.min(o.start??(o.remember?POS[o.id]||0:0),n-1);
  root.innerHTML=`<div class="deck">
    <div class="dk-h"><div class="dk-top"><span class="dk-title">${o.title}</span>${o.close?'<button class="dk-x" aria-label="닫기">✕ 닫기</button>':''}</div>
      <div class="dk-step"><span class="s">STEP <span class="num">1</span></span><span class="t">/ ${n}</span></div>
      <div class="dk-prog"><i></i></div>${n<=10?`<div class="dots">${o.cards.map(()=>'<i></i>').join('')}</div>`:''}</div>
    <div class="dk-vp"><div class="dk-track">${o.cards.map(c=>`<div class="slide">${cardHtml(c)}</div>`).join('')}</div></div>
    <div class="dk-f"><button class="btn prev">◀ 이전</button><button class="btn next">다음 ▶</button></div></div>`;
  const vp=root.querySelector('.dk-vp'),tr=root.querySelector('.dk-track'),slides=$$('.slide',root),dots=$$('.dots i',root);
  const num=root.querySelector('.num'),bar=root.querySelector('.dk-prog i'),prev=root.querySelector('.prev'),next=root.querySelector('.next');
  const seen=new Set();
  function go(j,anim){
    j=Math.max(0,Math.min(n-1,j));const changed=j!==i;i=j;seen.add(i);
    tr.style.transition=anim===false?'none':'';tr.style.transform=`translateX(${-i*100}%)`;
    slides.forEach((s,k)=>{if(k===i){s.classList.remove('active');void s.offsetWidth;s.classList.add('active');s.querySelector('.cardx').scrollTop=0}else s.classList.remove('active');s.setAttribute('aria-hidden',k!==i)});
    num.textContent=i+1;if(changed){num.classList.remove('tick');void num.offsetWidth;num.classList.add('tick')}
    bar.style.width=((i+1)/n*100)+'%';
    dots.forEach((d,k)=>{d.className=k===i?'on':(seen.has(k)?'seen':'')});
    prev.disabled=i===0;next.textContent=i===n-1?(o.close?'완료 ✓':'처음으로 ↺'):'다음 ▶';
    if(o.remember){POS[o.id]=i;LS.set('deckpos',POS)}
  }
  prev.onclick=()=>go(i-1);
  next.onclick=()=>{if(i<n-1)go(i+1);else if(o.close)o.close();else go(0)};
  if(o.close)root.querySelector('.dk-x').onclick=o.close;
  // swipe
  let sx=0,sy=0,lock=null,down=false,t0=0,moved=false,dx=0;
  vp.addEventListener('pointerdown',e=>{if(e.target.closest('textarea,input'))return;down=true;lock=null;sx=e.clientX;sy=e.clientY;t0=performance.now();dx=0});
  vp.addEventListener('pointermove',e=>{if(!down)return;dx=e.clientX-sx;const dy=e.clientY-sy;
    if(!lock){if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.2){lock='x';tr.style.transition='none';try{vp.setPointerCapture(e.pointerId)}catch(_){}}else if(Math.abs(dy)>10)lock='y'}
    if(lock==='x'){let off=dx;if((i===0&&dx>0)||(i===n-1&&dx<0))off*=.3;tr.style.transform=`translateX(calc(${-i*100}% + ${off}px))`;e.preventDefault()}});
  const end=()=>{if(!down)return;down=false;if(lock==='x'){moved=true;setTimeout(()=>moved=false,50);const w=vp.clientWidth,v=Math.abs(dx)/(performance.now()-t0);
    tr.style.transition='';if(dx<-w*.18||(dx<-30&&v>.5))go(i+1);else if(dx>w*.18||(dx>30&&v>.5))go(i-1);else go(i)}lock=null};
  vp.addEventListener('pointerup',end);vp.addEventListener('pointercancel',end);
  vp.addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault()}},true);
  go(i,false);
  return {go:j=>go(j),get i(){return i},root};
}
document.addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('textarea,input'))return;const d=curDeck();if(!d)return;if(e.key==='ArrowRight')d.go(d.i+1);if(e.key==='ArrowLeft')d.go(d.i-1)});
function curDeck(){const p=$('.page.on');return p&&DECKS[p.id]}

/* ---------- navigation ---------- */
let cur='home';
function show(p){
  cur=p;$$('.page').forEach(e=>e.classList.toggle('on',e.id==='p-'+p));
  $$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.p===(p==='phase'?'home':p)));
  if(p==='home')renderHome();if(p==='log')renderLog();
  const d=DECKS['p-'+p];if(d)d.go(d.i);
  if(['home','pack','life','care','log','dad'].includes(p))history.replaceState(null,'',location.pathname+location.search+(p==='home'?'':'#'+p));
}
window.show=show;
$$('#nav button').forEach(b=>b.onclick=()=>show(b.dataset.p));
document.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]');if(g){show(g.dataset.go);if(g.dataset.last){const d=DECKS['p-'+g.dataset.go];if(d)d.go(9999)}return}
  const l=e.target.closest('[data-log]');if(l){logIt(l.dataset.log)}
});
function openPhase(k,start){
  const p=PHASES[k];
  DECKS['p-phase']=Deck($('#p-phase'),{id:'ph-'+p.id,title:`${p.e} ${p.name}`,cards:p.cards,start:start||0,close:()=>show('home')});
  show('phase');
}

/* ---------- home (NOW) ---------- */
function renderHome(){
  const t=today(),pi=phaseIdx(t),P=PHASES[pi],first=P.cards[0];
  const toS=diff(t,SURG),toA=diff(t,ADMIT);
  let n,l,sub;
  if(toA>0){n='D-'+toS;l='튼튼이 만나기까지';sub=`입원 D-${toA} · 11월 30일(월) 오후 2~4시`}
  else if(toA===0){n='D-1';l='오늘 입원해요';sub='수술은 내일 12월 1일(화)'}
  else if(toS===0){n='D-DAY';l='오늘 수술하는 날';sub='12월 1일(화)'}
  else{n=(1-toS)+'일째';l='튼튼이 태어난 지';sub='2026년 12월 1일 출생'}
  const [y,m,d]=t.split('-').map(Number);const wd=WD[new Date(Date.UTC(y,m-1,d)).getUTCDay()];
  let todo=TODAY[t]||(pi>=4?'퇴원·조리원·행정 기한을 단계별로 확인하기':'단계별 카드로 하나씩 확인하기');
  const fillW=PHASES.length>1?`calc((100% - 48px) * ${pi/(PHASES.length-1)})`:'0';
  $('#home').innerHTML=`
    <div class="h-top"><span class="h-date">${m}월 ${d}일 (${wd})</span><span class="nowb"><i></i>NOW</span></div>
    <div class="stepper"><span class="fill" style="width:0"></span>${PHASES.map((p,k)=>`<button class="sp${k<pi?' past':''}${k===pi?' cur':''}" data-ph="${k}" aria-label="${p.name}"><span class="c">${k<pi?'✓':p.e}</span>${p.short}</button>`).join('')}</div>
    <div class="hero">
      <div class="dd"><span class="n">${n}</span><span class="l">${l}</span></div>
      <div class="dd-sub">${sub}</div>
      <div class="hr"></div>
      <div class="imp-l">지금 가장 중요한 것 · ${P.name}</div>
      <div class="imp"><span class="e">${first.e}</span><div><div class="k">${first.k}</div>${first.big?`<div class="b">${first.big}</div>`:''}</div></div>
      <div class="todo">📌 ${todo}</div>
      <button class="cta" id="start">▶ STEP 1부터 보기 <span style="opacity:.8;font-weight:800">(${P.cards.length}단계)</span></button>
    </div>
    <div class="calls">
      <a class="call" href="tel:0318203301"><span class="e">🏥</span>분만실</a>
      <a class="call" href="tel:0318203305"><span class="e">👶</span>신생아실</a>
      <a class="call" href="tel:0318539115"><span class="e">🏡</span>조리원</a>
    </div>
    <div class="tip-a2hs">📱 <b>홈 화면에 추가</b>하면 앱처럼 쓸 수 있어요 (아이폰: 공유 → 홈 화면에 추가). 체크·기록은 이 휴대폰에만 저장돼요.</div>`;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const f=$('#home .fill');if(f)f.style.width=fillW}));
  $('#start').onclick=()=>openPhase(pi,0);
  $$('#home .sp').forEach(b=>b.onclick=()=>openPhase(+b.dataset.ph,0));
}

/* ---------- baby log (tt.log) ---------- */
const LK={feedL:['🤱','수유 (왼쪽)'],feedR:['🤱','수유 (오른쪽)'],bottle:['🍼','분유·젖병 수유'],pump:['💧','유축'],pee:['💛','기저귀 소변'],poo:['💩','기저귀 대변'],pain:['💊','진통제']};
let LOG=LS.get('log',[]),dayOff=0;
window.logIt=function(k){LOG.push({ts:Date.now(),k});LS.set('log',LOG);dayOff=0;if(cur==='log')renderLog();toast(LK[k][1]+' · '+hm(Date.now())+' 기록!');if(navigator.vibrate)navigator.vibrate(30);
  const b=document.querySelector(`.lb[onclick="logIt('${k}')"]`);if(b){b.classList.remove('flash');void b.offsetWidth;b.classList.add('flash')}};
window.logDay=function(d){dayOff=Math.min(0,dayOff+d);renderLog()};
function ago(ts){const m=Math.floor((Date.now()-ts)/6e4);if(m<1)return'방금';if(m<60)return m+'분 전';return Math.floor(m/60)+'시간 '+(m%60)+'분 전'}
function renderLog(){
  const last=ks=>{for(let i=LOG.length-1;i>=0;i--)if(ks.includes(LOG[i].k))return LOG[i];return null};
  $('#log-since').innerHTML=[['🍼 마지막 수유',['feedL','feedR','bottle']],['🧷 마지막 기저귀',['pee','poo']],['💊 마지막 진통제',['pain']]].map(([nm,ks])=>{const l=last(ks);return `<div class="ent"><span>${nm}</span><b>${l?ago(l.ts)+' <span class="sm">('+hm(l.ts)+')</span>':'<span class="sm">기록 없음</span>'}</b></div>`}).join('');
  const day=ymd(kst(Date.now()+dayOff*864e5));
  const list=LOG.map((e,i)=>({...e,i})).filter(e=>ymd(kst(e.ts))===day).reverse();
  const [,m,d]=day.split('-');
  $('#log-day').textContent=(dayOff===0?'오늘':(+m)+'월 '+(+d)+'일')+' 기록 ('+list.length+')';
  $('#log-list').innerHTML=list.length?list.map(e=>`<div class="ent"><span>${LK[e.k][0]} ${LK[e.k][1]}</span><span><b>${hm(e.ts)}</b><button data-del="${e.i}" aria-label="삭제">✕</button></span></div>`).join(''):'<p class="sm">이 날은 기록이 없어요.</p>';
  $$('#log-list [data-del]').forEach(b=>b.onclick=()=>{if(!confirm('이 기록을 지울까요?'))return;LOG.splice(+b.dataset.del,1);LS.set('log',LOG);renderLog()});
}
setInterval(()=>{if(cur==='log')renderLog()},30000);

/* ---------- init ---------- */
DECKS['p-pack']=Deck($('#p-pack'),{id:'pack',title:'🎒 같이 챙기는 준비물 · 남편과 냠모가 함께',cards:PACK_CARDS,remember:true});
DECKS['p-life']=Deck($('#p-life'),{id:'life',title:'🏥 병원생활 · 의정부성모병원 안내문',cards:LIFE_CARDS,remember:true});
DECKS['p-care']=Deck($('#p-care'),{id:'care',title:'🩺 회복 가이드 · 질문 메모',cards:CARE_CARDS,remember:true});
DECKS['p-dad']=Deck($('#p-dad'),{id:'dad',title:'💪 남편 할 일 · 키워드만 보고 체크',cards:DAD_CARDS,remember:true});
refresh();
const h=location.hash.replace('#','');show(['pack','life','care','log','dad'].includes(h)?h:'home');
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
