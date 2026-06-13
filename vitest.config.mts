import { defineConfig } from 'vitest/config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

// 순수 로직(lib/game) 단위 테스트용 최소 설정.
// React 컴포넌트 테스트가 필요해지면 next 가이드(node_modules/next/dist/docs/.../testing/vitest.md)대로
// @vitejs/plugin-react + jsdom + @testing-library/* 를 추가한다. 현재 대상은 DOM 비의존 순수 함수.
export default defineConfig({
  resolve: {
    // 프로젝트 `@/*` alias(@/lib/...)를 테스트에서도 그대로 쓰기 위함. `@/` 시작만 치환.
    alias: [{ find: /^@\//, replacement: `${root}/` }],
  },
  test: {
    environment: 'node',
  },
});
