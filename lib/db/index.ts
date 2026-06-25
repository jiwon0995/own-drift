import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
}

/**
 * Neon HTTP 단발성 쿼리 클라이언트(원시 SQL 태그).
 * db.query/ORM 대신 직접 SQL을 실행할 때 사용한다.
 */
export const sql = neon(connectionString);

/**
 * Neon HTTP 드라이버 기반 Drizzle 클라이언트 — 서버 전용(클라이언트 컴포넌트 import 금지).
 * HTTP(fetch) 단발성 쿼리라 커넥션 풀이 없어 모듈 싱글턴으로 충분하다.
 * 스키마가 생기면 drizzle({ client: sql, schema })로 확장한다.
 */
export const db = drizzle({ client: sql });
