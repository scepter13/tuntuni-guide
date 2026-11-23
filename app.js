(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const LS={get(k,d){try{const v=localStorage.getItem('tt.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
          set(k,v){try{localStorage.setItem('tt.'+k,JSON.stringify(v));return true}catch(e){toast('저장 공간이 부족해요');return false}}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),1600)}
window.toast=toast;

/* ---------- KST time ---------- */
const kst=(ms)=>new Date((ms??Date.now())+9*3600e3);           // read with getUTC*
const ymd=(d)=>d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
const today=()=>ymd(kst());
const dnum=(s)=>{const [y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d)/864e5};
const diff=(a,b)=>dnum(b)-dnum(a);                              // days from a to b
const hm=(ms)=>{const d=kst(ms);return String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0')};
const ADMIT='2026-11-30', SURG='2026-12-01';

/* ---------- navigation ---------- */
function go(p,sub){
  $$('.page').forEach(e=>e.classList.toggle('on',e.id==='p-'+p));
  $$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));
  if(p==='mom'&&sub)momSub(sub);
  $('#main').scrollTop=0;
  if(p==='home')renderHome();
}
window.go=go;
$$('#nav button').forEach(b=>b.onclick=()=>go(b.dataset.p));
function momSub(s){
  $$('#momchips .chip').forEach(c=>c.classList.toggle('on',c.dataset.s===s));
  $$('#p-mom .sub').forEach(e=>e.style.display=e.id==='s-'+s?'block':'none');
  $('#main').scrollTop=0;
}
$$('#momchips .chip').forEach(c=>c.onclick=()=>momSub(c.dataset.s));

/* ---------- source links ---------- */
function srcHtml(keys){
  return '<span class="src">'+keys.map(k=>{const s=SRC[k];if(!s)return'';return s[1]?`<a href="${s[1]}" target="_blank" rel="noopener">${esc(s[0])}</a>`:esc(s[0])}).join(' · ')+'</span>';
}

/* ---------- checklists ---------- */
let CK=LS.get('ck',{});
function ckToggle(key,el){CK[key]=!CK[key];if(!CK[key])delete CK[key];LS.set('ck',CK);el.classList.toggle('done',!!CK[key]);progress();}
window.resetCk=function(prefix){if(!confirm('체크를 모두 지울까요?'))return;Object.keys(CK).forEach(k=>{if(k.startsWith(prefix+'.'))delete CK[k]});LS.set('ck',CK);renderPack();renderDad();progress();}
function ckRow(key,html,tip,extra){
  return `<div class="ck${CK[key]?' done':''}" data-k="${key}"><div class="box"></div><div class="t">${html}${extra||''}${tip?`<span class="tip">${tip}</span>`:''}</div></div>`;
}
function bindCk(root){root.querySelectorAll('.ck').forEach(el=>el.onclick=(e)=>{if(e.target.closest('a'))return;ckToggle(el.dataset.k,el)})}
function packKeys(){return PACK.flatMap(g=>g.items.map(i=>'pk.'+i[0]))}
function dadKeys(){return DAD.flatMap(p=>p.items.map(i=>'dd.'+p.id+'.'+i[0]))}
function renderPack(){
  $('#pack-list').innerHTML=PACK.map(g=>`<div class="card"><h3>${g.g}</h3>${g.items.map(i=>ckRow('pk.'+i[0],i[1],i[2],i[3]==='rec'?' <span class="pill sky">추천</span>':'')).join('')}</div>`).join('');
  bindCk($('#pack-list'));
}
function renderDad(){
  $('#dadchips').innerHTML=DAD.map(p=>`<button class="chip" data-id="${p.id}">${p.t}</button>`).join('');
  $$('#dadchips .chip').forEach(c=>c.onclick=()=>{const el=document.getElementById('ph-'+c.dataset.id);$('#main').scrollTo({top:el.offsetTop-60,behavior:'smooth'})});
  $('#dad-list').innerHTML=DAD.map(p=>`<div class="phase" id="ph-${p.id}"><h3><span>${p.t} <span class="sm">${p.sub}</span></span><span class="cnt" data-c="${p.id}"></span></h3>
    ${p.items.map(i=>ckRow('dd.'+p.id+'.'+i[0],i[1],'','<br>'+srcHtml(i[2]))).join('')}</div>`).join('');
  bindCk($('#dad-list'));
}
function progress(){
  const pk=packKeys(),pd=pk.filter(k=>CK[k]).length;
  const dk=dadKeys(),dd=dk.filter(k=>CK[k]).length;
  $('#pk-c').textContent=`${pd} / ${pk.length}`;$('#pk-bar').style.width=(pd/pk.length*100)+'%';
  $('#h-ckc').textContent=`${pd} / ${pk.length} 챙김`;$('#h-ckbar').style.width=(pd/pk.length*100)+'%';
  $('#dd-c').textContent=`${dd} / ${dk.length}`;$('#dd-bar').style.width=(dd/dk.length*100)+'%';
  DAD.forEach(p=>{const ks=p.items.map(i=>'dd.'+p.id+'.'+i[0]);const n=ks.filter(k=>CK[k]).length;const el=document.querySelector(`[data-c="${p.id}"]`);if(el)el.textContent=n===ks.length?'✅ 완료':`${n}/${ks.length}`;});
}

/* ---------- home ---------- */
function renderHome(){
  const t=today(), toS=diff(t,SURG), toA=diff(t,ADMIT);
  let lbl,big,sub;
  if(toA>0){lbl='튼튼이 만나기까지';big='D-'+toS;sub=`입원까지 D-${toA} · 11월 30일(월) 오후 2~4시`;}
  else if(toA===0){lbl='오늘 입원해요 🏥';big='D-1';sub='튼튼이는 내일 만나요 · 신분증 챙기기';}
  else if(toS===0){lbl='오늘 수술하는 날';big='D-DAY';sub='12월 1일(화) · 신생아실 면회 오전 11:00~11:30';}
  else{lbl='튼튼이 태어난 지';big=(1-toS)+'일째';sub='2026년 12월 1일 출생';}
  $('#h-lbl').textContent=lbl;$('#h-big').textContent=big;$('#h-sub').textContent=sub;
  let td=TODAY[t];
  if(!td) td = toA>0 ? '오늘은 <b>준비물 체크리스트</b>를 한번 훑어보기' : '수유·기저귀·진통제는 <b>기록 탭</b>에 남겨두기';
  $('#h-today').innerHTML='📌 <b>오늘 할 일</b><br>'+td;
  progress();
}

/* ---------- timeline ---------- */
function renderTimeline(){
  const t=today();
  $('#timeline').innerHTML=TIMELINE.map(s=>{
    const now=t>=s.from&&t<=s.to, past=t>s.to;
    return `<div class="tli${now?' now':''}${past?' past':''}">${now?'<span class="nowtag">지금</span>':''}<div class="when">${s.when}</div><h3>${s.title}</h3><ul>${s.li.map(x=>'<li>'+x+'</li>').join('')}</ul></div>`;
  }).join('');
}

/* ---------- life / care ---------- */
function renderLife(){
  $('#life-list').innerHTML=LIFE.map((x,i)=>`<details${i<1?' open':''}><summary>${x[0]}</summary><div class="in">${x[1]}</div></details>`).join('')
   +'<div class="note">📄 출처: 가톨릭대학교 의정부성모병원 입원 안내문·입원예약 안내문. 바뀐 내용이 있을 수 있으니 병동 안내를 우선하세요.</div>';
  $('#care-list').innerHTML=CARE.map(x=>`<div class="card"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('');
}

/* ---------- questions ---------- */
let QS=LS.get('q',[]);
function renderQ(){
  $('#q-sug').innerHTML=Q_SUGGEST.filter(s=>!QS.some(q=>q.t===s)).map(s=>`<button class="pill" style="border:0;font-size:15px;padding:7px 12px" data-s="${esc(s)}">＋ ${esc(s)}</button>`).join('');
  $$('#q-sug button').forEach(b=>b.onclick=()=>{QS.push({t:b.dataset.s,d:false});LS.set('q',QS);renderQ();toast('추가했어요')});
  $('#q-list').innerHTML=QS.length?QS.map((q,i)=>`<div class="qi"><div class="ck${q.d?' done':''}" data-i="${i}" style="border:0;padding:0;flex:1"><div class="box"></div><div class="t">${esc(q.t)}</div></div><button data-del="${i}" aria-label="삭제">✕</button></div>`).join(''):'<p class="sm">아직 메모가 없어요. 물어본 질문은 탭해서 체크!</p>';
  $$('#q-list .ck').forEach(el=>el.onclick=()=>{const q=QS[el.dataset.i];q.d=!q.d;LS.set('q',QS);renderQ()});
  $$('#q-list [data-del]').forEach(b=>b.onclick=()=>{QS.splice(+b.dataset.del,1);LS.set('q',QS);renderQ()});
}
window.addQ=function(){const v=$('#q-in').value.trim();if(!v)return;QS.push({t:v,d:false});LS.set('q',QS);$('#q-in').value='';renderQ();toast('메모했어요')};

/* ---------- baby log ---------- */
const LK={feedL:['🤱','수유 (왼쪽)'],feedR:['🤱','수유 (오른쪽)'],bottle:['🍼','분유·젖병 수유'],pump:['💧','유축'],pee:['💛','기저귀 소변'],poo:['💩','기저귀 대변'],pain:['💊','진통제']};
let LOG=LS.get('log',[]), dayOff=0;
window.logIt=function(k){LOG.push({ts:Date.now(),k});LS.set('log',LOG);dayOff=0;renderLog();toast(LK[k][1]+' · '+hm(Date.now())+' 기록!');if(navigator.vibrate)navigator.vibrate(30)};
window.logDay=function(d){dayOff=Math.min(0,dayOff+d);renderLog()};
function ago(ts){const m=Math.floor((Date.now()-ts)/6e4);if(m<1)return'방금';if(m<60)return m+'분 전';return Math.floor(m/60)+'시간 '+(m%60)+'분 전'}
function renderLog(){
  const last=ks=>{for(let i=LOG.length-1;i>=0;i--)if(ks.includes(LOG[i].k))return LOG[i];return null};
  const rows=[['🍼 마지막 수유',['feedL','feedR','bottle']],['🧷 마지막 기저귀',['pee','poo']],['💊 마지막 진통제',['pain']]];
  $('#log-since').innerHTML=rows.map(([n,ks])=>{const l=last(ks);return `<div class="ent"><span>${n}</span><b>${l?ago(l.ts)+' <span class="sm">('+hm(l.ts)+')</span>':'<span class="sm">기록 없음</span>'}</b></div>`}).join('');
  const day=ymd(kst(Date.now()+dayOff*864e5));
  const list=LOG.map((e,i)=>({...e,i})).filter(e=>ymd(kst(e.ts))===day).reverse();
  const [y,m,d]=day.split('-');
  $('#log-day').textContent=(dayOff===0?'오늘':(+m)+'월 '+(+d)+'일')+' 기록 ('+list.length+')';
  const cnt={};list.forEach(e=>cnt[e.k]=(cnt[e.k]||0)+1);
  const sum=Object.keys(cnt).length?'<p class="sm">'+Object.entries(cnt).map(([k,n])=>LK[k][0]+' '+n).join(' · ')+'</p>':'';
  $('#log-list').innerHTML=sum+(list.length?list.map(e=>`<div class="ent"><span>${LK[e.k][0]} ${LK[e.k][1]}</span><span><b>${hm(e.ts)}</b><button data-del="${e.i}" aria-label="삭제">✕</button></span></div>`).join(''):'<p class="sm">이 날은 기록이 없어요.</p>');
  $$('#log-list [data-del]').forEach(b=>b.onclick=()=>{if(!confirm('이 기록을 지울까요?'))return;LOG.splice(+b.dataset.del,1);LS.set('log',LOG);renderLog()});
}
setInterval(()=>{if($('#p-log').classList.contains('on'))renderLog()},30000);

/* ---------- init ---------- */
renderPack();renderDad();renderTimeline();renderLife();renderQ();renderLog();renderHome();
const h=location.hash.replace('#','');if(['home','mom','log','dad','pack'].includes(h))go(h);
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
