/**
 * M07 — Bộ đếm Focus Timer dựa trên Timestamp chống trôi giờ
 * Phục vụ: F08, F09, C03, E06, AC04, R102, R103
 */

import { clampAndRound } from './models.js';

export const DEFAULT_TIMER_MINUTES = 25;

/**
 * Khởi tạo trạng thái phiên đếm ngược dựa trên mốc thời gian thực (C03, E06)
 * @param {{ projectId: string, subTaskId: string, durationMinutes?: number, nowMs?: number }} params
 * @returns {Object} TimerState
 */
export function createTimerState({
  projectId,
  subTaskId,
  durationMinutes = DEFAULT_TIMER_MINUTES,
  nowMs = Date.now()
} = {}) {
  const rawMinutes = Number(durationMinutes);
  const validMinutes = Number.isFinite(rawMinutes) && rawMinutes > 0
    ? Math.round(rawMinutes * 10) / 10
    : DEFAULT_TIMER_MINUTES;

  const startMs = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  const totalDurationMs = Math.round(validMinutes * 60 * 1000);

  return {
    projectId: String(projectId || ''),
    subTaskId: String(subTaskId || ''),
    durationMinutes: validMinutes,
    totalDurationMs,
    startedAtMs: startMs,
    endTimeMs: startMs + totalDurationMs,
    remainingMsWhenPaused: null,
    status: 'running' // 'running' | 'paused' | 'completed'
  };
}

/**
 * Lấy ảnh chụp trạng thái đồng hồ tại thời điểm nowMs bất kỳ (C03, AC04)
 * Không bị sai lệch khi trình duyệt ẩn tab hoặc khóa màn hình điện thoại.
 * @param {Object} timerState
 * @param {number} nowMs
 * @returns {{
 *   remainingMs: number,
 *   remainingSeconds: number,
 *   elapsedMinutes: number,
 *   isCompleted: boolean,
 *   progressRatio: number,
 *   formattedTime: string
 * }}
 */
export function getTimerSnapshot(timerState, nowMs = Date.now()) {
  if (!timerState || typeof timerState !== 'object') {
    return {
      remainingMs: 0,
      remainingSeconds: 0,
      elapsedMinutes: 0,
      isCompleted: true,
      progressRatio: 1,
      formattedTime: '00:00'
    };
  }

  const totalMs = Number(timerState.totalDurationMs) > 0 ? Number(timerState.totalDurationMs) : 0;
  let remainingMs = 0;

  if (timerState.status === 'paused' && Number.isFinite(timerState.remainingMsWhenPaused)) {
    remainingMs = Math.max(0, Number(timerState.remainingMsWhenPaused));
  } else if (timerState.status === 'completed') {
    remainingMs = 0;
  } else {
    const currentMs = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
    remainingMs = Math.max(0, Number(timerState.endTimeMs) - currentMs);
  }

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const elapsedMs = Math.max(0, totalMs - remainingMs);
  const elapsedMinutes = clampAndRound(elapsedMs / 60000, 0, totalMs / 60000);
  const isCompleted = remainingMs <= 0 || timerState.status === 'completed';
  const progressRatio = totalMs > 0
    ? Math.min(1, Math.max(0, elapsedMs / totalMs))
    : 1;

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return {
    remainingMs,
    remainingSeconds,
    elapsedMinutes,
    isCompleted,
    progressRatio: Math.round(progressRatio * 1000) / 1000,
    formattedTime
  };
}

/**
 * Tạm dừng bộ đếm giờ (R102)
 * @param {Object} timerState
 * @param {number} nowMs
 * @returns {Object} Bản sao TimerState mới ở trạng thái 'paused'
 */
export function pauseTimer(timerState, nowMs = Date.now()) {
  if (!timerState || timerState.status !== 'running') {
    return { ...timerState };
  }
  const snapshot = getTimerSnapshot(timerState, nowMs);
  if (snapshot.isCompleted) {
    return {
      ...timerState,
      remainingMsWhenPaused: 0,
      status: 'completed'
    };
  }
  return {
    ...timerState,
    remainingMsWhenPaused: snapshot.remainingMs,
    status: 'paused'
  };
}

/**
 * Tiếp tục bộ đếm giờ từ trạng thái tạm dừng (R102)
 * @param {Object} timerState
 * @param {number} nowMs
 * @returns {Object} Bản sao TimerState mới ở trạng thái 'running'
 */
export function resumeTimer(timerState, nowMs = Date.now()) {
  if (!timerState || timerState.status !== 'paused') {
    return { ...timerState };
  }
  const currentMs = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  const remainingMs = Math.max(0, Number(timerState.remainingMsWhenPaused ?? timerState.totalDurationMs));

  return {
    ...timerState,
    endTimeMs: currentMs + remainingMs,
    remainingMsWhenPaused: null,
    status: remainingMs > 0 ? 'running' : 'completed'
  };
}

