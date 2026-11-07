/**
 * Kiểm thử M05 (`src/core/calculator.js`)
 * Chứng minh: AC01, AC02, AC03, AC05, C02, E01–E05, R102, R103
 */

import { describe, it, assert } from './test-harness.js';
import { createProject } from '../src/core/models.js';
import {
  calculateMasterProgress,
  applyQuickAction,
  applyTimerMinutes,
  levelUpProject
} from '../src/core/calculator.js';

describe('M05 · calculator.js — Lõi tính toán 2 chế độ & Level Up', () => {
  it('[AC01, F05, E01] Tính chính xác trung bình trọng số ở chế độ Fixed & xử lý dự án rỗng', () => {
    const emptyProj = createProject({ title: 'Rỗng', mode: 'fixed', subTasks: [] });
    assert.equal(calculateMasterProgress(emptyProj).percent, 0);

    const fixedProj = createProject({
      title: 'Dự án Fixed',
      mode: 'fixed',
      subTasks: [
        { id: 'a', title: 'Việc A', weight: 1, progressPercent: 50 },
        { id: 'b', title: 'Việc B', weight: 3, progressPercent: 100 }
      ]
    });
    const res = calculateMasterProgress(fixedProj);
    assert.equal(res.percent, 87.5, '(1*50 + 3*100)/4 phải bằng 87.5%');
  });

  it('[AC02, F06, C02] Chế độ Quỹ thời gian (Time Pool) không bị tụt % khi thêm việc mới', () => {
    const poolProj = createProject({
      title: 'Dự án Time Pool 10h',
      mode: 'time_pool',
      targetHours: 10, // 600 phút
      subTasks: [
        { id: 's1', title: 'Việc 1', spentMinutes: 150, progressPercent: 100 }
      ]
    });
    const beforeAdd = calculateMasterProgress(poolProj);
    assert.equal(beforeAdd.percent, 25, '150 / 600 phút = 25.0%');

    // Thêm Việc 2 và Việc 3 mới phát sinh (0 phút)
    const afterAddProj = createProject({
      ...poolProj,
      subTasks: [
        ...poolProj.subTasks,
        { id: 's2', title: 'Việc mới phát sinh 2', spentMinutes: 0, progressPercent: 0 },
        { id: 's3', title: 'Việc mới phát sinh 3', spentMinutes: 0, progressPercent: 0 }
      ]
    });
    const afterAdd = calculateMasterProgress(afterAddProj);
    assert.equal(afterAdd.percent, 25, 'C02: Thêm việc mới không làm tụt 25.0% đã tích lũy');
  });

  it('[AC03, F07, E04, E05] Kích hoạt Level Up khi đạt 100% quỹ giờ và nâng cấp mục tiêu / đổi chế độ', () => {
    const poolAt100 = createProject({
      title: 'Dự án Chạm Đỉnh',
      mode: 'time_pool',
      targetHours: 10, // 600 phút
      level: 1,
      subTasks: [
        { id: 's1', title: 'Việc 1', weight: 1, spentMinutes: 450, progressPercent: 100 },
        { id: 's2', title: 'Việc C còn dở', weight: 1, spentMinutes: 150, progressPercent: 40 }
      ]
    });

    const check = calculateMasterProgress(poolAt100);
    assert.equal(check.percent, 100);
    assert.equal(check.isLevelUpReady, true, 'Phải bật cờ isLevelUpReady khi đạt 100% mà còn việc < 100%');

    // Cách 1: Cộng thêm +5h (targetHours = 15h = 900 phút, level = 2)
    const leveledAddHours = levelUpProject(poolAt100, { action: 'add_hours', extraHours: 5 });
    assert.equal(leveledAddHours.level, 2);
    assert.equal(leveledAddHours.targetHours, 15);
    const recalcPool = calculateMasterProgress(leveledAddHours);
    assert.equal(recalcPool.percent, 66.7, '600 / 900 phút = 66.7%');
    assert.equal(recalcPool.isLevelUpReady, false);

    // Cách 2 (E05): Chuyển sang chế độ cố định (switch_fixed)
    const leveledFixed = levelUpProject(poolAt100, { action: 'switch_fixed' });
    assert.equal(leveledFixed.mode, 'fixed');
    assert.equal(calculateMasterProgress(leveledFixed).percent, 70, '(100 + 40)/2 = 70%');
  });

  it('[AC05, F10, E03, R102] Nút cộng nhanh (+10%, +25%, 100%) kẹp trần ở 100% và đảm bảo tính bất biến', () => {
    const orig = createProject({
      title: 'Test Quick Action',
      mode: 'time_pool',
      targetHours: 2,
      subTasks: [
        { id: 'sub1', title: 'Việc 1', estimatedMinutes: 100, progressPercent: 85, spentMinutes: 85 }
      ]
    });

    const updated = applyQuickAction(orig, 'sub1', 25);
    assert.equal(orig.subTasks[0].progressPercent, 85, 'R102: Không làm biến đổi object gốc');
    assert.equal(updated.subTasks[0].progressPercent, 100, 'E03: Kẹp trần ở 100%');
    assert.equal(updated.subTasks[0].spentMinutes, 100, 'E03: Chỉ cộng đúng 15 phút còn thiếu, không cộng dư 25 phút');

    const afterTimer = applyTimerMinutes(orig, 'sub1', 10);
    assert.equal(afterTimer.subTasks[0].spentMinutes, 95);
    assert.equal(afterTimer.subTasks[0].progressPercent, 95);

    // Hoàn tác / Giảm tiến độ (delta âm) khi lỡ bấm nhầm
    const rollbacked = applyQuickAction(updated, 'sub1', -15);
    assert.equal(rollbacked.subTasks[0].progressPercent, 85, 'Giảm đúng 15% khi lỡ bấm nhầm');
    assert.equal(rollbacked.subTasks[0].spentMinutes, 85, 'Quy đổi giảm đúng 15 phút');
  });
});

