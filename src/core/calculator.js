/**
 * M05 — Lõi tính toán 2 chế độ (Fixed & Time Pool), Quick Actions & Level Up
 * Phục vụ: F05, F06, F07, F09, F10, C02, E01–E05, AC01–AC03, AC05, R102, R103
 */

import { clampAndRound, createProject, createSubTask, MIN_TARGET_HOURS } from './models.js';

/**
 * Tính toán tiến độ tổng của Master-bar theo chế độ hiện tại (F05, F06, F07, E01, E02, E04)
 * @param {Object} project
 * @returns {{ percent: number, spentMinutes: number, targetMinutes: number, isLevelUpReady: boolean, completedSubTasks: number, totalSubTasks: number }}
 */
export function calculateMasterProgress(project) {
  if (!project || typeof project !== 'object') {
    return {
      percent: 0,
      spentMinutes: 0,
      targetMinutes: 0,
      isLevelUpReady: false,
      completedSubTasks: 0,
      totalSubTasks: 0
    };
  }

  const subTasks = Array.isArray(project.subTasks) ? project.subTasks : [];
  const totalSubTasks = subTasks.length;
  const completedSubTasks = subTasks.filter((st) => Number(st.progressPercent) >= 100).length;

  const totalSpentMinutes = subTasks.reduce((sum, st) => {
    const spent = Number(st?.spentMinutes);
    return sum + (Number.isFinite(spent) && spent > 0 ? spent : 0);
  }, 0);
  const roundedSpentMinutes = Math.round(totalSpentMinutes * 10) / 10;

  if (project.mode === 'time_pool') {
    const rawTargetHours = Number(project.targetHours);
    const validTargetHours = Number.isFinite(rawTargetHours) && rawTargetHours > 0
      ? rawTargetHours
      : MIN_TARGET_HOURS;
    const targetMinutes = Math.round(validTargetHours * 60 * 10) / 10;

    const rawPercent = targetMinutes > 0 ? (roundedSpentMinutes / targetMinutes) * 100 : 0;
    const percent = clampAndRound(rawPercent, 0, 100);

    // E04 / OUT03: Đạt 100% quỹ thời gian (cho phép Level Up bất cứ khi nào đạt mốc 100% hoặc vượt giờ)
    const isLevelUpReady = percent >= 100;

    return {
      percent,
      spentMinutes: roundedSpentMinutes,
      targetMinutes,
      isLevelUpReady,
      completedSubTasks,
      totalSubTasks
    };
  }

  // Chế độ mặc định: 'fixed' (Lộ trình cố định theo trọng số - F05, E01)
  if (totalSubTasks === 0) {
    return {
      percent: 0,
      spentMinutes: roundedSpentMinutes,
      targetMinutes: 0,
      isLevelUpReady: false,
      completedSubTasks: 0,
      totalSubTasks: 0
    };
  }

  let weightedSum = 0;
  let totalWeight = 0;
  let totalEstimatedMinutes = 0;

  for (const st of subTasks) {
    const weight = Number(st?.weight);
    const validWeight = Number.isFinite(weight) && weight > 0 ? weight : 0;
    const progress = clampAndRound(st?.progressPercent ?? 0, 0, 100);
    const estimated = Number(st?.estimatedMinutes);

    weightedSum += validWeight * progress;
    totalWeight += validWeight;
    if (Number.isFinite(estimated) && estimated > 0) {
      totalEstimatedMinutes += estimated;
    }
  }

  // E01: Tổng trọng số <= 0 trả về 0% tránh chia cho 0
  const percent = totalWeight > 0
    ? clampAndRound(weightedSum / totalWeight, 0, 100)
    : 0;

  return {
    percent,
    spentMinutes: roundedSpentMinutes,
    targetMinutes: Math.round(totalEstimatedMinutes * 10) / 10,
    isLevelUpReady: false,
    completedSubTasks,
    totalSubTasks
  };
}

/**
 * Áp dụng nút bấm cộng/trừ nhanh (+10%, +25%, 100%, -10%) lên một Sub-bar (F10, E03, D02, R102)
 * Hỗ trợ cả delta âm để hoàn lại hoặc giảm tiến độ khi người dùng lỡ bấm nhầm.
 * @param {Object} project
 * @param {string} subTaskId
 * @param {number} deltaPercent - Phần trăm thay đổi (VD: +10, +25, +100, -10)
 * @returns {Object} Bản sao Project mới đã cập nhật
 */
export function applyQuickAction(project, subTaskId, deltaPercent) {
  const delta = Number(deltaPercent);
  if (!project || !Array.isArray(project.subTasks) || !Number.isFinite(delta) || delta === 0) {
    return createProject(project);
  }

  const nextSubTasks = project.subTasks.map((st) => {
    if (st.id !== subTaskId) {
      return createSubTask(st);
    }

    const oldPercent = clampAndRound(st.progressPercent, 0, 100);
    const newPercent = clampAndRound(oldPercent + delta, 0, 100);
    // Tính phần trăm thực sự thay đổi (dương khi tăng, âm khi giảm)
    const actualDeltaPercent = newPercent - oldPercent;

    const estimated = Number.isFinite(Number(st.estimatedMinutes)) && Number(st.estimatedMinutes) > 0
      ? Number(st.estimatedMinutes)
      : 60;

    // D02: Quy đổi phần trăm thực thay đổi sang số phút tương ứng
    const deltaMinutes = (actualDeltaPercent / 100) * estimated;
    const newSpentMinutes = Math.max(0, Math.round((Number(st.spentMinutes || 0) + deltaMinutes) * 10) / 10);

    return createSubTask({
      ...st,
      progressPercent: newPercent,
      spentMinutes: newSpentMinutes
    });
  });

  return createProject({
    ...project,
    subTasks: nextSubTasks,
    updatedAt: Date.now()
  });
}

/**
 * Cộng số phút từ Focus Timer vào một Sub-bar và tự động tăng tiến độ (F08, F09, R102)
 * @param {Object} project
 * @param {string} subTaskId
 * @param {number} addedMinutes
 * @returns {Object} Bản sao Project mới đã cập nhật
 */
export function applyTimerMinutes(project, subTaskId, addedMinutes) {
  const minutes = Number(addedMinutes);
  if (!project || !Array.isArray(project.subTasks) || !Number.isFinite(minutes) || minutes <= 0) {
    return createProject(project);
  }

  const nextSubTasks = project.subTasks.map((st) => {
    if (st.id !== subTaskId) {
      return createSubTask(st);
    }

    const estimated = Number.isFinite(Number(st.estimatedMinutes)) && Number(st.estimatedMinutes) > 0
      ? Number(st.estimatedMinutes)
      : 60;

    const newSpentMinutes = Math.round((Number(st.spentMinutes || 0) + minutes) * 10) / 10;
    const deltaPercentFromTimer = (minutes / estimated) * 100;
    const newPercent = clampAndRound(Number(st.progressPercent || 0) + deltaPercentFromTimer, 0, 100);

    return createSubTask({
      ...st,
      spentMinutes: newSpentMinutes,
      progressPercent: newPercent
    });
  });

  return createProject({
    ...project,
    subTasks: nextSubTasks,
    updatedAt: Date.now()
  });
}

/**
 * Nâng cấp mục tiêu dự án (Level Up) khi chạm mốc 100% quỹ thời gian (F07, E04, E05, R102)
 * @param {Object} project
 * @param {{ action: 'add_hours' | 'switch_fixed', extraHours?: number }} options
 * @returns {Object} Bản sao Project mới sau khi Level Up
 */
export function levelUpProject(project, options = {}) {
  if (!project || typeof project !== 'object') {
    return createProject({});
  }

  const action = options.action || 'add_hours';
  const currentLevel = Number.isInteger(project.level) && project.level >= 1 ? project.level : 1;

  if (action === 'switch_fixed') {
    // E05: Chuyển sang chế độ cố định, giữ nguyên progressPercent của từng Sub-bar
    return createProject({
      ...project,
      mode: 'fixed',
      level: currentLevel + 1,
      updatedAt: Date.now()
    });
  }

  // Mặc định: 'add_hours' - Mở rộng thêm quỹ thời gian mục tiêu
  const rawExtra = Number(options.extraHours);
  const extraHours = Number.isFinite(rawExtra) && rawExtra > 0 ? rawExtra : 5;
  const currentTarget = Number.isFinite(Number(project.targetHours)) && Number(project.targetHours) > 0
    ? Number(project.targetHours)
    : MIN_TARGET_HOURS;

  return createProject({
    ...project,
    mode: 'time_pool',
    targetHours: Math.round((currentTarget + extraHours) * 10) / 10,
    level: currentLevel + 1,
    updatedAt: Date.now()
  });
}

