// 튼튼이 도우미 — Gemini 프록시 (Cloudflare Worker)
// 키는 코드에 없음: `wrangler secret put GEMINI_API_KEY` 로만 넣기.
const ORIGINS = ['https://scepter13.github.io'];
const SITE_DATA = 'https://scepter13.github.io/tuntuni-guide/data.js';
const MODEL = 'gemini-3.5-flash-lite';      // 무료 등급 모델
const MAX_Q = 500, MAX_HIST = 8, MAX_TURN = 800;
const PER_MIN = 6, PER_DAY = 80;            // IP별 (isolate 메모리 기준, 간단 제한)
const GLOBAL_PER_MIN = 12;                  // 무료 RPM 아래로
const hits = new Map(); let gmin = [];
let ctxCache = { t: 0, text: '' };

function cors(origin) {
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
           'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
}
const json = (o, s, h) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', ...h } });

function limited(ip) {
  const now = Date.now();
  gmin = gmin.filter(t => now - t < 60e3);
  if (gmin.length >= GLOBAL_PER_MIN) return true;
  const h = (hits.get(ip) || []).filter(t => now - t < 864e5);
  if (h.filter(t => now - t < 60e3).length >= PER_MIN || h.length >= PER_DAY) { hits.set(ip, h); return true; }
  h.push(now); hits.set(ip, h); gmin.push(now);
  if (hits.size > 5000) hits.clear();
  return false;
}

async function siteContext() {
  if (ctxCache.text && Date.now() - ctxCache.t < 3600e3) return ctxCache.text;
  try {
    const r = await fetch(SITE_DATA, { cf: { cacheTtl: 3600 } });
    let t = await r.text();
    t = t.replace(/https?:\/\/\S+?(?=['"])/g, '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/[ \t]+/g, ' ');
    ctxCache = { t: Date.now(), text: t.slice(0, 30000) };
  } catch (e) {}
  return ctxCache.text;
}

const SYSTEM = (ctx) => `너는 '튼튼이 도우미'야. 사용자는 '냠모'(첫 아이 출산, 2026년 12월 1일 의정부성모병원에서 제왕절개 예정, 11월 30일 입원, 태명 '튼튼이', 퇴원 후 의정부 히아신스 산후조리원)야.
규칙:
- 항상 한국어로, 따뜻하고 짧게(보통 3~6줄). 핵심은 **굵게**, 필요하면 짧은 목록.
- 먼저 아래 '사이트 정보'를 근거로 답해. 사이트에 없으면 일반적인 정보로 답하되 확실하지 않으면 병원에 확인하라고 말해. 지어내지 마.
- 의학적 질문(약, 통증, 상처, 수유, 증상 등)엔 마지막에 "※ 정확한 건 의료진에게 꼭 확인하세요" 한 줄.
- 응급 증상(출혈이 많음, 열, 숨이 참, 심한 통증, 의식 저하 등)이면 맨 앞에 "바로 간호사 호출 또는 분만실 031-820-3301로 전화하세요"라고 해.
- 전화번호는 정확히 이것만 써: 분만실 031-820-3301 (응급·산모 관련), 신생아실 031-820-3305 (아기·면회·직접수유 문의 전용, 분만실 번호 아님), 병원 대표 1661-7500, 히아신스 산후조리원 031-853-9115. 번호를 섞거나 묶어서 말하지 마.
- 이름·주민번호·연락처 같은 개인정보는 묻지 마.
- 사이트 탭: 홈(D-day·질문), 준비물, 병원생활(일정·전화·병원 안내), 회복·질문(통증 조절·회복 팁·질문 메모), 기록, 남편.
[사이트 정보]
${ctx}`;

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    if (!ORIGINS.includes(origin)) return json({ error: 'forbidden' }, 403);
    const h = cors(origin);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (req.method !== 'POST') return json({ error: 'method' }, 405, h);
    if (!env.GEMINI_API_KEY) return json({ error: 'not configured' }, 503, h);
    const ip = req.headers.get('CF-Connecting-IP') || 'x';
    if (limited(ip)) return json({ error: '질문이 많아요 (429)' }, 429, h);
    let body; try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400, h); }
    const q = String(body.q || '').trim().slice(0, MAX_Q);
    if (!q) return json({ error: 'empty' }, 400, h);
    const hist = (Array.isArray(body.history) ? body.history : []).slice(-MAX_HIST)
      .filter(m => m && (m.role === 'user' || m.role === 'model') && m.text)
      .map(m => ({ role: m.role, parts: [{ text: String(m.text).slice(0, MAX_TURN) }] }));
    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM(await siteContext()) }] },
      contents: [...hist, { role: 'user', parts: [{ text: q }] }],
      generationConfig: { maxOutputTokens: 700, temperature: 0.4 },
      // Google 검색 그라운딩은 무료 등급에서 이 모델에 제공되지 않아 끔 (README 참고)
    };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body: JSON.stringify(payload) });
    if (r.status === 429) return json({ error: '오늘 무료 사용량이 다 찼거나 잠깐 많아요 (429)' }, 429, h);
    if (!r.ok) return json({ error: 'upstream ' + r.status }, 502, h);
    const d = await r.json();
    const c = d.candidates && d.candidates[0];
    const answer = c && c.content && c.content.parts ? c.content.parts.map(p => p.text || '').join('').trim() : '';
    const sources = ((c && c.groundingMetadata && c.groundingMetadata.groundingChunks) || [])
      .filter(x => x.web).map(x => ({ title: x.web.title, uri: x.web.uri })).slice(0, 4);
    if (!answer) return json({ error: 'empty answer' }, 502, h);
    return json({ answer, sources }, 200, h);
  }
};
