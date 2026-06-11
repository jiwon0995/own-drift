# Contributing — 나의 속도

> 이 프로젝트의 브랜치 전략과 커밋 컨벤션을 정의한다.
> 결정의 *왜* 는 `04-devlog.md` 가 받는다. 커밋은 *무엇을* 만 간결하게 기록한다.

**관련 문서:** `01-game-design-document.md` · `02-story-bible.md` · `03-screens.md` · `04-devlog.md` · `05-dev-todo.md`

---

## 브랜치 전략

```
main                  # 완성 시점에만 머지 · Vercel production
  └─ dev              # 통합 브랜치 · 작업이 모이는 곳
       └─ <type>/<요약>   # dev에서 따고 dev로 머지 · 머지 후 삭제
```

- `dev` 에서 작업 브랜치를 딴다.
- 작업이 끝나면 `dev` 로 머지하며 통합한다.
- 기능이 완성된 단위(또는 배포 시점)에 `dev` → `main` 으로 올린다.
- `main` 은 항상 "완성된 것만" 들어간 깨끗한 history 를 유지한다.

### Vercel 연동

- `main` → production
- `dev` → preview

배포 환경에서만 터지는 이슈(폰트 · 픽셀 렌더링 · CSS 변수)를 preview 에서 미리 잡는다.

### 작업 브랜치 네이밍

`<type>/<kebab-case 요약>` — 영어 소문자 + 하이픈만 사용.

| 패턴 | 예시 |
|---|---|
| `chore/...` | `chore/setup-nextjs`, `chore/vercel-deploy` |
| `feat/...` | `feat/game-loop`, `feat/calibration-gauge`, `feat/pixel-runner`, `feat/audio-unlock` |
| `fix/...` | `fix/font-fallback`, `fix/game-height-collapse` |
| `refactor/...` | `refactor/game-state-ref` |
| `docs/...` | `docs/devlog`, `docs/readme` |

규칙:

- 한 브랜치는 한 가지 일만 한다 (diff 가 한 가지 의도로 읽히게).
- 머지 후 브랜치는 삭제한다.
- 솔로 프로젝트이므로 `release` 등 추가 브랜치는 만들지 않는다.

---

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org) 기반. **subject 한 줄로 끝낸다 — body · footer 없음.**

```
<type>(<scope>): <subject>
```

### type

| type | 용도 |
|---|---|
| `feat` | 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변화 없는 구조 개선 |
| `style` | 포맷 · 세미콜론 등 동작 무관 변경 |
| `perf` | 성능 개선 |
| `test` | 테스트 |
| `docs` | 문서 |
| `chore` | 설정 · 빌드 · 의존성 |

### scope

`engine` · `loop` · `input` · `calibration` · `gauge` · `screens` · `runner` · `banner` · `background` · `audio` · `ending` · `deploy`

### 예시

```
chore(deploy): Next.js + TS + Tailwind 초기 셋업
feat(loop): rAF 게임 루프 + 관성 보간 구현
feat(calibration): 안착 게이지 충전 로직 구현
fix(banner): 외부 폰트 로드 블로킹 해결
refactor(loop): 고빈도 상태 ref로 분리
docs(devlog): Day 3 기록
```

### 원칙

- 명령형 한 줄, 50자 내외, 마침표 없음.
- 한 커밋 = 한 의도. 여러 번 만지는 작업도 의미 단위로 끊는다.
- `scope` 로 *어디를* + `subject` 로 *무엇을* 압축해, 한 줄만 봐도 변경 의도가 읽히게 한다.
- 결정의 *왜* 는 커밋이 아니라 `04-devlog.md` 에 기록한다.
