/**
 * Kiểm thử M07 (`src/core/timer.js`)
 * Chứng minh: AC04, C03, E06, R102
 */

import { describe, it, assert } from './test-harness.js';
import {
  createTimerState,
  getTimerSnapshot,
  pauseTimer,
  resumeTimer
} from '../src/core/timer.js';

describe('M07 · timer.js — Bộ đếm Focus Timer chống trôi giờ', () => {
  it('[AC04, C03, E06] Tính đúng thời gian còn lại bằng Timestamp và hỗ trợ Pause / Resume chuẩn xác', () => {
    const t0 = 1_700_000_000_000;
    const state = createTimerState({
      projectId: 'p1',
      subTaskId: 's1',
      durationMinutes: 25,
      nowMs: t0
    });

    // Giả lập trôi qua 10 phút (600,000 ms) khi tab bị ẩn
    const snap10m = getTimerSnapshot(state, t0 + 10 * 60 * 1000);
    assert.equal(snap10m.remainingSeconds, 15 * 60);
    assert.equal(snap10m.elapsedMinutes, 10);
    assert.equal(snap10m.isCompleted, false);
    assert.equal(snap10m.formattedTime, '15:00');

    // Tạm dừng ở phút thứ 10, nghỉ 30 phút ngoài đời thực, sau đó Resume
    const paused = pauseTimer(state, t0 + 10 * 60 * 1000);
    assert.equal(paused.status, 'paused');

    const resumed = resumeTimer(paused, t0 + 40 * 60 * 1000);
    const snapAfterResume = getTimerSnapshot(resumed, t0 + 40 * 60 * 1000);
    assert.equal(snapAfterResume.remainingSeconds, 15 * 60, 'Thời gian còn lại phải giữ nguyên 15 phút sau khi Resume');

    // Giả lập chạy hết 15 phút còn lại
    const snapDone = getTimerSnapshot(resumed, t0 + 55 * 60 * 1000);
    assert.equal(snapDone.isCompleted, true);
    assert.equal(snapDone.elapsedMinutes, 25);
    assert.equal(snapDone.formattedTime, '00:00');
  });
});

