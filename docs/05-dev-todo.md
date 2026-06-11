# 개발 TODO — 나의 속도

> 디자인 확정(GDD · 스토리 비블 · 화면 명세 · 디자인 시스템 · 컬러 목업) 이후의 **구현 단계 작업 순서**.
> 의존성 기준 정렬. 핵심은 기존 산출물을 코드로 이식하는 것 — `design-system.html`의 토큰/컴포넌트, `game-screens.html`의 씬 빌더·러너 스프라이트 로직.
> 마감 **6/15 23:59**. 일자 매핑은 참고용.

**관련 문서:** `01-game-design-document.md` · `02-story-bible.md` · `03-screens.md` · `04-devlog.md`

---

## 일자 매핑 (참고)

| Phase | 내용 | 대략 일자 |
|---|---|---|
| 0~1 | 셋업 + 첫 배포 + 루프 코어 | Day 2~3 |
| 2~3 | 핵심 메커닉 + 화면 흐름 | Day 3~4 |
| 4~5 | 비주얼·피드백 + 오디오 | Day 4~5 |
| 6~7 | 엔딩 + 모바일·밸런싱·배포 | Day 5~6 |

---

## Phase 0 — 셋업 & 첫 배포 (walking skeleton)

> 빈 화면이라도 **먼저 배포**해서 배포 환경 전용 이슈(폰트·픽셀 렌더링·CSS 변수)를 조기에 잡는다.

- [ ] `create-next-app` 초기화 (TypeScript · App Router · Tailwind)
- [ ] GitHub **public** repo 생성 + 첫 커밋
- [ ] Vercel 연결 → **빈 페이지 첫 배포 성공 확인**
- [ ] 폴더 구조 셋업: `app/`, `components/{game,hud,screens}`, `hooks/`, `lib/game/{engine,constants,types}`
- [ ] `design-system.html`의 컬러 토큰 → `globals.css :root` 이식
- [ ] 픽셀 폰트(둥근모꼴 / Press Start 2P) **self-host** + `image-rendering:pixelated` + `font-display:swap` + 한글 폴백 스택
- [ ] 3단 셸 레이아웃(240 / 800 / 240) + 픽셀 프레임 · 스캔라인 · 비네팅 공통 컴포넌트
- [ ] tsconfig `strict` · ESLint · Prettier 확인

## Phase 1 — 게임 루프 코어 (이동 + 속도)

> 관성(손맛)이 이 게임의 알맹이. 여기서 **체감을 먼저** 잡고 넘어간다.

- [ ] `lib/game/types.ts` — 게임 상태 · 페이즈 · 스피드 타입 정의
- [ ] `lib/game/constants.ts` — 튜닝 파라미터 초기값 (GDD §11)
- [ ] `useGameLoop` — rAF 기반, **고빈도 상태는 `ref`** / UI는 **스로틀된 스냅샷**으로 분리 (리렌더 폭발 방지)
- [ ] 자동 전진 + Spacebar 홀드(가속) / 릴리스(감속) + **관성 보간**
- [ ] 입력 레이어 추상화 (keydown/keyup; 추후 터치 홀드 이식 대비)
- [ ] 현재 속도 → 배경 스크롤 속도 연동 (체감 검증용 최소 배경)

## Phase 2 — 핵심 메커닉 (캘리브레이션 → 구간 → 게이지)

> 구현의 제약: **"실패 없음"** + **"유도 아닌 확인"** 원칙.

- [ ] Find Pace: 한 속도 유지 시 차오르는 **안착 게이지** (확인 신호만, 정답 유도 연출 금지)
- [ ] 내 속도 확정 → `targetSpeed ± 허용폭(±15%)` 구간 산출
- [ ] 구간 판정기 — **히스테리시스 / 누적치**로 흔들림 방지
- [ ] 안정 게이지 — 구간 내 충전 / 이탈 시 멈춤·살짝 되돌림 (경고색·실패 연출 금지)
- [ ] 다른 존재 — 뒤에서 다가와 스침 + 끌어당김(구간 이탈 유발) + 게이지 가득 차면 소멸
- [ ] 3회 성공 카운트 → 클리어 조건 연결

## Phase 3 — 화면 흐름 / 상태 머신

- [ ] 화면 상태 머신: `Title → Tutorial → Find Pace → Main Play → Encounter ⟳ → Return 1/2/3 → Clear → Continue/End → Ending`
- [ ] `components/screens/` 각 화면 컴포넌트 + 진입/전환 조건 와이어링 (`03-screens.md` 기준)
- [ ] `SpeechBubble` 타이프라이터(한 글자씩 + 깜빡 커서) + **화면별 문구 데이터화**
- [ ] Tutorial 시퀀스(빠르게 → 느리게 → 완료), Return 1/2/3 감정 단계(혼란 → 인식 → 체화) 차등 연출

## Phase 4 — 비주얼 / 피드백

> `game-screens.html` · `design-system.html`의 씬 빌더·스프라이트 로직을 컴포넌트로 이식.

- [ ] 컴포넌트화: `PixelRunner`(4프레임 · 상태색 보간), `OtherPresence`, `StabilityGauge`, `SideBanner`, `Background`
- [ ] 배경 진행: road → city(낮→밤) → highway → dawn → space, **게이지 연동(타이머 X · 단방향)**
- [ ] 안정/불안정 피드백: 선명도 · 색온도 · 흔들림 · 배너 소란도가 *같은 리듬으로 맞물리는* '찰칵'
- [ ] 클리어 시 배너 일반광고 → **회사 배너 전환** (이스터에그)

## Phase 5 — 오디오

- [ ] **오디오 언락** — 시작 버튼(걸어보기) 인터랙션에서 (iOS 필수)
- [ ] BGM 레이어 + 속도/안정 반응(발소리 · 호흡 · 그루브 정합)
- [ ] 확인 효과음(조용·따뜻) — 승리 팡파르 · 과한 보상음 금지

## Phase 6 — 엔딩 / 캡처

- [ ] `canvas.toDataURL`로 게임 화면 캡처 → **'당신의 풍경'** 이미지
- [ ] `내 풍경 저장하기`(다운로드) / `다시 걸어보기`(Title 복귀)
- [ ] 점수 · 기록 · 순위 노출 없음 최종 확인

## Phase 7 — 모바일 / 밸런싱 / 배포

- [ ] 모바일 비파손: 좁아지면 배너 숨김, 게임만 중앙 (CSS만으로)
- [ ] (스트레치) 터치 홀드 입력 — Spacebar와 동일 패턴이라 이식 가벼움
- [ ] **튜닝 밸런싱** (GDD §11 · §14): 안착/안정 게이지 충전 속도, 관성 계수, 히스테리시스 여유, 첫 등장 n초
- [ ] **DoD 검증**: 처음 보는 사람이 설명 없이 "따라잡기가 아니라 내 속도로 돌아가기"임을 감각으로 이해하는가
- [ ] 최종 production 배포 + 크로스브라우저 점검 + 버퍼
- [ ] `04-devlog.md` 실시간 기록 / `README` 최종화

---

> **스코프 가드:** 실패·게임오버, 리더보드·순위, 소셜 공유 링크는 의도적 제외. 풍경 변형 / 배너 실시간 반응 / 모바일 풀 최적화는 스트레치 (GDD §12).
