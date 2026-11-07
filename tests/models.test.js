/**
 * Kiểm thử M04 (`src/core/models.js`)
 * Chứng minh: IN01, IN02, E01, E02, R102, R103
 */

import { describe, it, assert } from './test-harness.js';
import {
  createProject,
  createSubTask,
  validateProject,
  MIN_TARGET_HOURS
} from '../src/core/models.js';

describe('M04 · models.js — Khởi tạo & Kiểm tra hợp lệ', () => {
  it('[IN01, IN02] Khởi tạo Project và SubTask với giá trị mặc định an toàn', () => {
    const sub = createSubTask({ title: '  Viết tài liệu  ' });
    assert.equal(sub.title, 'Viết tài liệu');
    assert.equal(sub.weight, 1);
    assert.equal(sub.estimatedMinutes, 60);
    assert.equal(sub.progressPercent, 0);
    assert.equal(sub.spentMinutes, 0);

    const proj = createProject({ title: 'Dự án A', subTasks: [sub] });
    assert.equal(proj.title, 'Dự án A');
    assert.equal(proj.mode, 'fixed');
    assert.equal(proj.level, 1);
    assert.equal(proj.subTasks.length, 1);
  });

  it('[E01, R103] Rào chắn trọng số <= 0 và kẹp phần trăm trong [0, 100]', () => {
    const subInvalid = createSubTask({
      title: 'Test Biên',
      weight: -5,
      progressPercent: 145.67,
      spentMinutes: -20
    });
    assert.equal(subInvalid.weight, 1, 'Weight âm phải về mặc định 1');
    assert.equal(subInvalid.progressPercent, 100, 'Phần trăm > 100 phải kẹp ở 100');
    assert.equal(subInvalid.spentMinutes, 0, 'Số phút âm phải về 0');
  });

  it('[E02] Chuẩn hóa targetHours <= 0 về MIN_TARGET_HOURS (0.5h) và validateProject bắt lỗi', () => {
    const projClamped = createProject({
      title: 'Dự án Quỹ Giờ',
      mode: 'time_pool',
      targetHours: -3
    });
    assert.equal(projClamped.targetHours, MIN_TARGET_HOURS);

    const rawBadProject = {
      title: 'Dự án lỗi',
      mode: 'time_pool',
      targetHours: 0,
      subTasks: [{ title: 'Việc 1', weight: 0, progressPercent: 120, spentMinutes: 0 }]
    };
    const check = validateProject(rawBadProject);
    assert.equal(check.valid, false);
    assert.ok(check.errors.length >= 3, 'Phải bắt đủ lỗi E02, E01 và R103');
  });
});

