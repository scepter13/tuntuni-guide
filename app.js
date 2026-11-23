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
/* AI 프록시 주소 (Cloudflare Worker). 비어 있으면 'AI 연결 준비 중' 상태로 사이트 안 정보만 찾아줘요. */
const AI_URL='https://tuntuni-ai.tuntuni-guide.workers.dev';

/* ---------- navigation ---------- */
function go(p){
  $$('.page').forEach(e=>e.classList.toggle('on',e.id==='p-'+p));
  $$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));
  $('#main').scrollTop=0;
  $('#main').classList.toggle('homeon',p==='home');
  if(p==='home'){renderHome();chatScroll();}
}
window.go=go;
$$('#nav button').forEach(b=>b.onclick=()=>go(b.dataset.p));

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
}

window.openPlan=function(){go('life');const d=$('#plan');d.open=true;setTimeout(()=>$('#main').scrollTo({top:d.offsetTop-10,behavior:'smooth'}),30)};

/* ---------- timeline ---------- */
function renderTimeline(){
  const t=today();
  $('#timeline').innerHTML=TIMELINE.map(s=>{
    const now=t>=s.from&&t<=s.to, past=t>s.to;
    return `<div class="tli${now?' now':''}${past?' past':''}">${now?'<span class="nowtag">지금</span>':''}<div class="when">${s.when}</div><h3>${s.title}</h3><ul>${s.li.map(x=>'<li>'+x+'</li>').join('')}</ul></div>`;
  }).join('');
  $$('#timeline .tli').forEach(el=>el.onclick=e=>{if(e.target.closest('a'))return;if(!el.classList.contains('now'))el.classList.toggle('open')});
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


/* ---------- AI chat ---------- */
const CHAT_SUG=['무통주사와 페인버스터 차이?','입원 때 뭐 챙겨?','신생아실 면회 시간?','수술 후 언제 걸어?','조리원 입실 시간?','남편은 뭘 하면 돼?'];
let CHAT=LS.get('chat',[]), busy=false;
const strip=h=>String(h).replace(/<br\s*\/?>/g,' ').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
function md(t){ // tiny safe markdown: escape first, then format
  const inl=x=>esc(x).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<i>$2</i>').replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])((?:tel:)?0\d{1,2}-\d{3,4}-\d{4})/g,(m,a,n)=>a+'<a href="tel:'+n.replace(/\D/g,'')+'">'+n+'</a>');
  const out=[];let list=null;
  String(t).replace(/\r/g,'').split('\n').forEach(l=>{
    let m;
    if((m=l.match(/^\s*[-*•]\s+(.*)/))){if(list!=='ul'){if(list)out.push('</'+list+'>');out.push('<ul>');list='ul'}out.push('<li>'+inl(m[1])+'</li>');return}
    if((m=l.match(/^\s*\d+[.)]\s+(.*)/))){if(list!=='ol'){if(list)out.push('</'+list+'>');out.push('<ol>');list='ol'}out.push('<li>'+inl(m[1])+'</li>');return}
    if(list){out.push('</'+list+'>');list=null}
    if((m=l.match(/^#{1,6}\s+(.*)/))){out.push('<h4>'+inl(m[1])+'</h4>');return}
    if(l.trim())out.push('<p>'+inl(l)+'</p>');
  });
  if(list)out.push('</'+list+'>');
  return out.join('');
}
function bubble(m){
  if(m.r==='me')return `<div class="msg me"><div class="bub">${esc(m.t)}</div></div>`;
  const src=(m.s&&m.s.length)?'<div class="srcs">🔎 출처 '+m.s.map(x=>`<a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.t||'링크')}</a>`).join('')+'</div>':'';
  return `<div class="msg bot${m.e?' err':''}"><div class="av">🍼</div><div class="bub">${md(m.t)}${src}</div></div>`;
}
function welcome(){
  return AI_URL? '안녕하세요 냠모님! 💛 입원·수술·회복·조리원까지 **궁금한 건 뭐든** 물어보세요.\n아래 질문을 눌러도 돼요.'
    : '안녕하세요 냠모님! 💛 지금은 **AI 연결 준비 중**이에요.\n그동안은 질문하면 **이 사이트 안 정보**에서 찾아서 알려드릴게요.';
}
function chatScroll(){const l=$('#chat-log');if(!l)return;requestAnimationFrame(()=>{const me=l.querySelectorAll('.msg.me'),lm=me[me.length-1];const last=CHAT[CHAT.length-1];
  if(!busy&&last&&last.r==='bot'&&lm)l.scrollTop=lm.offsetTop-8;else l.scrollTop=l.scrollHeight})}
function renderChat(){
  $('#ai-st').textContent=AI_URL?'AI':'AI 연결 준비 중';$('#ai-st').classList.toggle('ok',!!AI_URL);
  $('#chat-log').innerHTML=bubble({r:'bot',t:welcome()})+CHAT.map(bubble).join('')+(busy?'<div class="msg bot" id="typing"><div class="av">🍼</div><div class="bub"><span class="typing"><i></i><i></i><i></i></span></div></div>':'');
  const asked=new Set(CHAT.filter(m=>m.r==='me').map(m=>m.t));
  $('#chat-sug').innerHTML=CHAT_SUG.filter(s=>!asked.has(s)).map(s=>`<button type="button">${esc(s)}</button>`).join('');
  $$('#chat-sug button').forEach(b=>b.onclick=()=>ask(b.textContent));
  $('#chat-send').disabled=busy;
  chatScroll();
}
// 사이트 안 정보 검색 (AI 연결 전 대체 답변)
function siteIndex(){
  const ix=[];
  TIMELINE.forEach(x=>ix.push({tab:'life',t:'🗓️ '+x.when,b:x.title+' · '+x.li.map(strip).join(' / ')}));
  LIFE.forEach(x=>ix.push({tab:'life',t:'🏥 '+strip(x[0]),b:strip(x[1])}));
  CARE.forEach(x=>ix.push({tab:'care',t:'🩺 '+strip(x[0]),b:strip(x[1])}));
  const pain=document.querySelector('#p-care .pain .in');
  if(pain)ix.push({tab:'care',t:'💉 통증 조절 (무통주사·페인버스터·엉덩이 주사)',b:'무통주사(PCA): 정맥 또는 경막외로 진통제가 계속 + 버튼 누르면 추가, 보통 수술 후 2~3일, 온몸에 작용. 페인버스터: 수술 부위 근막 아래 관으로 국소마취제, 보통 수술 후 이틀째 제거, 수술 부위만, 선별급여(본인부담 80%), 무통주사와 함께 사용 가능. 엉덩이 주사: 추가 진통제, 간호사에게 요청. 페인버스터 사용 여부·비용은 병원에 확인.'});
  PACK.forEach(g=>ix.push({tab:'pack',t:'🎒 '+strip(g.g),b:g.items.map(i=>strip(i[1])).join(', ')}));
  DAD.forEach(p=>ix.push({tab:'dad',t:'💪 남편 · '+strip(p.t),b:p.items.map(i=>strip(i[1])).join(' / ')}));
  return ix;
}
const SYN={'챙겨':'준비물','챙길':'준비물','가져':'준비물','짐':'준비물','면회':'면회','걷':'걷기','걸어':'걷기','아기':'신생아','조리원':'조리원','남편':'남편','통증':'통증','무통':'무통주사','페인':'페인버스터','주차':'주차','밥':'식사','식사':'식사','샤워':'샤워','소변':'소변줄','입원':'입원','퇴원':'퇴원','수유':'수유'};
function localAnswer(q){
  const toks=new Set();
  q.replace(/[?!.,~]/g,' ').split(/\s+/).forEach(w=>{w=w.replace(/(은|는|이|가|을|를|에|에서|도|와|과|랑|요|은요|는요|이에요|예요|해|해요|돼|돼요|뭐|어떻게|언제|차이)$/,'');if(w.length>=2)toks.add(w);Object.keys(SYN).forEach(k=>{if(w.includes(k))toks.add(SYN[k])})});
  if(!toks.size)return null;
  const hits=siteIndex().map(x=>{const hay=x.t+' '+x.b;let sc=0;toks.forEach(k=>{if(x.t.includes(k))sc+=3;else if(hay.includes(k))sc+=1});return{...x,sc}}).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,2);
  if(!hits.length)return null;
  const TABN={life:'🏥 병원생활',care:'🩺 회복·질문',pack:'🎒 준비물',dad:'💪 남편'};
  return '사이트 안에서 찾아봤어요 👇\n'+hits.map(h=>`**${h.t}**\n${h.b.length>220?h.b.slice(0,220)+'…':h.b}\n→ ${TABN[h.tab]} 탭에서 자세히 보기`).join('\n')+'\n\n*AI가 연결되면 더 자연스럽게 답해드릴게요.*';
}
async function ask(q){
  q=String(q||'').trim().slice(0,500);if(!q||busy)return;
  CHAT.push({r:'me',t:q});busy=true;renderChat();LS.set('chat',CHAT.slice(-60));
  let ans;
  if(!AI_URL){
    await new Promise(r=>setTimeout(r,500));
    ans={r:'bot',t:localAnswer(q)||'아직 AI 연결 준비 중이라 그 질문엔 답하기 어려워요 🙏\n급한 증상(출혈이 많음, 열, 숨이 참)이면 바로 **간호사 호출** 또는 분만실 031-820-3301로 전화하세요.'};
  }else{
    try{
      const hist=CHAT.slice(0,-1).slice(-8).map(m=>({role:m.r==='me'?'user':'model',text:m.t.slice(0,800)}));
      const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),45000);
      const r=await fetch(AI_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({q,history:hist}),signal:ctl.signal});
      clearTimeout(to);
      const d=await r.json().catch(()=>({}));
      if(!r.ok||!d.answer)throw new Error(d.error||('HTTP '+r.status));
      ans={r:'bot',t:d.answer,s:(d.sources||[]).slice(0,4).map(x=>({t:x.title,u:x.uri})).filter(x=>/^https?:/.test(x.u))};
    }catch(e){
      const la=localAnswer(q);
      ans={r:'bot',e:true,t:(String(e.message).includes('429')||String(e.message).includes('많')?'질문이 잠깐 많았어요. 1분 뒤에 다시 물어봐 주세요 🙏':'AI 연결이 잠깐 안 돼요 🙏 잠시 후 다시 시도해 주세요.')+(la?'\n\n'+la:'')};
    }
  }
  busy=false;CHAT.push(ans);LS.set('chat',CHAT.slice(-60));renderChat();
}
$('#chat-form').onsubmit=e=>{e.preventDefault();const t=$('#chat-q');const v=t.value;t.value='';t.style.height='';ask(v)};
$('#chat-q').addEventListener('input',function(){this.style.height='';this.style.height=Math.min(this.scrollHeight,96)+'px'});
$('#chat-q').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#chat-form').requestSubmit()}});
$('#chat-clear').onclick=()=>{if(!CHAT.length||!confirm('대화를 모두 지울까요?'))return;CHAT=[];LS.set('chat',CHAT);renderChat()};
window.TT_ASK=ask;

/* ---------- init ---------- */
renderPack();renderDad();renderTimeline();renderLife();renderQ();renderLog();renderHome();progress();renderChat();$('#main').classList.add('homeon');
const h=location.hash.replace('#','');if(['home','pack','life','care','log','dad'].includes(h))go(h);
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
