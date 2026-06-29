import {
    pgTable, uuid, serial, real, integer,
    boolean, timestamp, varchar,
} from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
    id: uuid("id").primaryKey(),                       // 클라 생성 익명 UUID
    confirmedSpeed: real("confirmed_speed").notNull(), // 0~1 정규화
    calibrationMs: integer("calibration_ms"),          // 안착까지 걸린 시간
    device: varchar("device", { length: 16 }),         // 'desktop' | 'mobile'
    completed: boolean("completed").default(false),    // 3회 클리어 도달
    continued: boolean("continued"),                   // 계속(true)/오늘은 여기까지(false)
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roundEvents = pgTable("round_events", {
    id: serial("id").primaryKey(),
    sessionId: uuid("session_id")
        .notNull()
        .references(() => sessions.id),
    roundIndex: integer("round_index").notNull(),      // 1 | 2 | 3
    recoveryMs: integer("recovery_ms"),                // 등장~안정게이지 가득
    driftCount: integer("drift_count").default(0),     // 구간 이탈 횟수
});