# 튼튼이 만나러 가는 길 🍼

입원·제왕절개·조리원 정보를 한곳에 모은 안내 사이트 (정적 웹사이트, GitHub Pages).
사이트: https://scepter13.github.io/tuntuni-guide/

## 하단 탭
- 🏠 홈: D-day + 💬 튼튼이 도우미(AI 질문 채팅, 대화는 이 휴대폰에만 저장)
- 🎒 준비물: 남편·아내가 같이 보는 준비물 체크리스트 + 조리원 가방
- 🏥 병원생활: 입원~조리원 일정(타임라인), 바로 전화, 의정부성모병원 안내문 정보
- 🩺 회복·질문: 회복 가이드, 회진 질문 메모, 환자안전 안내
- 🍼 기록: 수유·기저귀·진통제 기록
- 💪 남편: 단계별 할 일 체크리스트

## 내용 고치기
- 준비물·일정·남편 할 일·병원 정보: `data.js`
- 화면: `index.html` / 동작: `app.js`
- 내용을 바꾸면 `sw.js`의 캐시 이름(`tuntuni-vN`) 숫자를 올려 주세요.

체크·기록·메모는 각 휴대폰의 브라우저(localStorage)에만 저장됩니다.

## AI 채팅 (worker/)
- 사이트는 `app.js` 맨 위 `AI_URL`로 질문을 보냅니다. 비어 있으면 'AI 연결 준비 중' 상태로 사이트 안 정보만 찾아 보여줘요.
- `worker/worker.js` = Cloudflare Worker 프록시 (Gemini `gemini-3.5-flash-lite`, 무료 등급). 사이트 주소에서 온 요청만 허용, IP별 분당 6회·하루 80회, 전체 분당 12회, 질문 500자 제한. `data.js`를 읽어 답변 근거로 씀.
- 배포: `cd worker && npx wrangler login && npx wrangler secret put GEMINI_API_KEY && npx wrangler deploy` → 나온 주소를 `AI_URL`에 넣고 `sw.js` 캐시 숫자 올리기.
- **API 키는 절대 이 저장소에 넣지 마세요** (Worker secret으로만).
- Google 검색 그라운딩: 무료 등급에서 Gemini 3 이상 모델은 제공 안 됨(유료 전용) → 꺼 둠.
