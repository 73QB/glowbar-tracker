/**
 * M05 — Lõi tính toán 2 chế độ (Fixed & Time Pool), Quick Actions & Level Up
 * Phục vụ: F05, F06, F07, F09, F10, C02, E01–E05, AC01–AC03, AC05, R102, R103
 */

import {
  clampAndRound,
  createProject,
  createSubTask,
  formatDateKey,
  generateId,
  MAX_PINNED_PROJECTS,
  MIN_TARGET_HOURS
} from './models.js';

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
 * Ghi nhận lịch sử tăng tiến độ theo ngày vào mảng progressHistory của dự án
 * @param {Array} history
 * @param {string} dateKey
 * @param {number} addMinutes
 * @param {number} addPercent
 * @returns {Array}
 */
function appendProgressHistory(history = [], dateKey, addMinutes, addPercent) {
  const safeList = Array.isArray(history) ? history.map((h) => ({ ...h })) : [];
  const mins = Math.max(0, Math.round((Number(addMinutes) || 0) * 10) / 10);
  const pct = Math.max(0, Math.round((Number(addPercent) || 0) * 10) / 10);
  if (mins <= 0 && pct <= 0) return safeList;

  const idx = safeList.findIndex((item) => item.date === dateKey);
  if (idx >= 0) {
    safeList[idx] = {
      date: dateKey,
      deltaMinutes: Math.round(((Number(safeList[idx].deltaMinutes) || 0) + mins) * 10) / 10,
      deltaPercent: Math.round(((Number(safeList[idx].deltaPercent) || 0) + pct) * 10) / 10
    };
  } else {
    safeList.push({ date: dateKey, deltaMinutes: mins, deltaPercent: pct });
  }
  return safeList.slice(-60);
}

/**
 * Áp dụng nút bấm cộng/trừ nhanh (+10%, +25%, 100%, -10%) lên một Sub-bar (F10, E03, D02, R102)
 * Hỗ trợ cả delta âm để hoàn lại hoặc giảm tiến độ khi người dùng lỡ bấm nhầm.
 * @param {Object} project
 * @param {string} subTaskId
 * @param {number} deltaPercent - Phần trăm thay đổi (VD: +10, +25, +100, -10)
 * @param {number} [nowMs]
 * @returns {Object} Bản sao Project mới đã cập nhật
 */
export function applyQuickAction(project, subTaskId, deltaPercent, nowMs = Date.now()) {
  const delta = Number(deltaPercent);
  if (!project || !Array.isArray(project.subTasks) || !Number.isFinite(delta) || delta === 0) {
    return createProject(project);
  }

  const prevMaster = calculateMasterProgress(project);
  let totalAddedMinutes = 0;

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
    if (deltaMinutes > 0) {
      totalAddedMinutes += deltaMinutes;
    }
    const newSpentMinutes = Math.max(0, Math.round((Number(st.spentMinutes || 0) + deltaMinutes) * 10) / 10);

    return createSubTask({
      ...st,
      progressPercent: newPercent,
      spentMinutes: newSpentMinutes
    });
  });

  const tempProj = createProject({
    ...project,
    subTasks: nextSubTasks,
    updatedAt: nowMs
  });
  const nextMaster = calculateMasterProgress(tempProj);
  const masterDeltaPct = Math.max(0, nextMaster.percent - prevMaster.percent);

  const isPositiveProgress = delta > 0 && (totalAddedMinutes > 0 || masterDeltaPct > 0);
  const nextHistory = isPositiveProgress
    ? appendProgressHistory(project.progressHistory, formatDateKey(nowMs), totalAddedMinutes, masterDeltaPct)
    : (project.progressHistory || []);

  return createProject({
    ...project,
    subTasks: nextSubTasks,
    updatedAt: nowMs,
    lastProgressAt: isPositiveProgress ? nowMs : (project.lastProgressAt ?? project.updatedAt ?? nowMs),
    progressHistory: nextHistory
  });
}

/**
 * Cộng số phút từ Focus Timer vào một Sub-bar và tự động tăng tiến độ (F08, F09, R102)
 * @param {Object} project
 * @param {string} subTaskId
 * @param {number} addedMinutes
 * @param {number} [nowMs]
 * @returns {Object} Bản sao Project mới đã cập nhật
 */
export function applyTimerMinutes(project, subTaskId, addedMinutes, nowMs = Date.now()) {
  const minutes = Number(addedMinutes);
  if (!project || !Array.isArray(project.subTasks) || !Number.isFinite(minutes) || minutes <= 0) {
    return createProject(project);
  }

  const prevMaster = calculateMasterProgress(project);

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

  const tempProj = createProject({
    ...project,
    subTasks: nextSubTasks,
    updatedAt: nowMs
  });
  const nextMaster = calculateMasterProgress(tempProj);
  const masterDeltaPct = Math.max(0, nextMaster.percent - prevMaster.percent);

  return createProject({
    ...project,
    subTasks: nextSubTasks,
    updatedAt: nowMs,
    lastProgressAt: nowMs,
    progressHistory: appendProgressHistory(project.progressHistory, formatDateKey(nowMs), minutes, masterDeltaPct)
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

/**
 * Sửa thông tin dự án tại chỗ (Inline Edit: tên dự án, quỹ giờ, chế độ) (R102, R103)
 * @param {Object} project
 * @param {Object} updates - { title?, targetHours?, mode?, themeColor? }
 * @returns {Object} Bản sao Project mới
 */
export function updateProjectDetails(project, updates = {}) {
  if (!project || typeof project !== 'object') {
    return createProject({});
  }
  const nextTitle = typeof updates.title === 'string' && updates.title.trim().length > 0
    ? updates.title.trim()
    : project.title;

  const nextTargetHours = updates.targetHours !== undefined
    ? Math.max(MIN_TARGET_HOURS, Math.round((Number(updates.targetHours) || MIN_TARGET_HOURS) * 10) / 10)
    : project.targetHours;

  return createProject({
    ...project,
    ...updates,
    title: nextTitle,
    targetHours: nextTargetHours,
    updatedAt: Date.now()
  });
}

/**
 * Sửa thông tin một Sub-bar tại chỗ (Inline Edit: tên việc, trọng số, số phút, ghi chú) (R102, R103)
 * @param {Object} project
 * @param {string} subTaskId
 * @param {Object} updates - { title?, weight?, estimatedMinutes?, note? }
 * @returns {Object} Bản sao Project mới
 */
export function updateSubTaskDetails(project, subTaskId, updates = {}) {
  if (!project || !Array.isArray(project.subTasks)) {
    return createProject(project);
  }

  const nextSubTasks = project.subTasks.map((st) => {
    if (st.id !== subTaskId) {
      return createSubTask(st);
    }
    const nextTitle = typeof updates.title === 'string' && updates.title.trim().length > 0
      ? updates.title.trim()
      : st.title;
    const nextWeight = updates.weight !== undefined && Number(updates.weight) > 0
      ? Math.round(Number(updates.weight) * 10) / 10
      : st.weight;
    const nextEstimated = updates.estimatedMinutes !== undefined && Number(updates.estimatedMinutes) > 0
      ? Math.round(Number(updates.estimatedMinutes) * 10) / 10
      : st.estimatedMinutes;
    const nextNote = updates.note !== undefined
      ? String(updates.note ?? '').trim()
      : st.note;

    return createSubTask({
      ...st,
      title: nextTitle,
      weight: nextWeight,
      estimatedMinutes: nextEstimated,
      note: nextNote
    });
  });

  return createProject({
    ...project,
    subTasks: nextSubTasks,
    updatedAt: Date.now()
  });
}

/**
 * Nhân bản mẫu dự án (Clone Template): giữ nguyên cấu trúc đầu việc, trọng số, thời lượng nhưng reset tiến độ về 0% (R102)
 * @param {Object} project
 * @param {number} [nowMs]
 * @returns {Object} Dự án mới đã sao chép cấu trúc
 */
export function cloneProjectTemplate(project, nowMs = Date.now()) {
  if (!project || typeof project !== 'object') {
    return createProject({});
  }

  const clonedSubTasks = (project.subTasks || []).map((st, idx) =>
    createSubTask({
      id: `${generateId('sub')}_${idx}`,
      title: st.title,
      weight: st.weight,
      estimatedMinutes: st.estimatedMinutes,
      note: st.note || '',
      progressPercent: 0,
      spentMinutes: 0
    })
  );

  return createProject({
    id: generateId('proj'),
    title: `${project.title} (Bản sao)`,
    mode: project.mode,
    targetHours: project.targetHours,
    level: 1,
    themeColor: project.themeColor,
    pinned: false,
    archived: false,
    subTasks: clonedSubTasks,
    createdAt: nowMs,
    updatedAt: nowMs,
    lastProgressAt: nowMs,
    progressHistory: []
  });
}

/**
 * Hoán đổi vị trí phần tử trong mảng bất biến (phục vụ Kéo thả / Sắp xếp) (R102)
 * @param {Array} list
 * @param {number} fromIndex
 * @param {number} toIndex
 * @returns {Array}
 */
export function reorderArray(list, fromIndex, toIndex) {
  if (!Array.isArray(list)) return [];
  const arr = [...list];
  if (
    fromIndex < 0 ||
    fromIndex >= arr.length ||
    toIndex < 0 ||
    toIndex >= arr.length ||
    fromIndex === toIndex
  ) {
    return arr;
  }
  const [moved] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, moved);
  return arr;
}

/**
 * Sắp xếp lại thứ tự các đầu việc nhỏ (Sub-bars) trong một dự án (R102)
 * @param {Object} project
 * @param {number} fromIndex
 * @param {number} toIndex
 * @returns {Object} Bản sao Project mới
 */
export function reorderSubTasks(project, fromIndex, toIndex) {
  if (!project || !Array.isArray(project.subTasks)) {
    return createProject(project);
  }
  const reordered = reorderArray(project.subTasks, fromIndex, toIndex).map((st) => createSubTask(st));
  return createProject({
    ...project,
    subTasks: reordered,
    updatedAt: Date.now()
  });
}

/**
 * Ghim hoặc bỏ ghim dự án (Giới hạn tối đa 3 dự án ghim cùng lúc) (R102)
 * @param {Array} projects
 * @param {string} projectId
 * @param {number} [maxPinned]
 * @returns {{ projects: Array, success: boolean, pinnedState: boolean, reason?: string }}
 */
export function togglePinProject(projects, projectId, maxPinned = MAX_PINNED_PROJECTS) {
  if (!Array.isArray(projects)) {
    return { projects: [], success: false, pinnedState: false };
  }
  const target = projects.find((p) => p.id === projectId);
  if (!target) {
    return { projects: [...projects], success: false, pinnedState: false };
  }

  const nextPinnedState = !target.pinned;
  if (nextPinnedState) {
    const currentPinnedCount = projects.filter((p) => p.pinned && !p.archived && p.id !== projectId).length;
    if (currentPinnedCount >= maxPinned) {
      return {
        projects: projects.map((p) => createProject(p)),
        success: false,
        pinnedState: false,
        reason: 'MAX_PINNED_REACHED'
      };
    }
  }

  const nextProjects = projects.map((p) =>
    p.id === projectId
      ? createProject({ ...p, pinned: nextPinnedState, updatedAt: Date.now() })
      : createProject(p)
  );

  return {
    projects: nextProjects,
    success: true,
    pinnedState: nextPinnedState
  };
}

/**
 * Chuyển dự án vào ngăn Lưu trữ (Archive) hoặc khôi phục lại (R102)
 * @param {Object} project
 * @returns {Object} Bản sao Project mới
 */
export function toggleArchiveProject(project) {
  if (!project || typeof project !== 'object') {
    return createProject({});
  }
  const nextArchived = !project.archived;
  return createProject({
    ...project,
    archived: nextArchived,
    pinned: nextArchived ? false : project.pinned,
    updatedAt: Date.now()
  });
}

/**
 * Kiểm tra trạng thái "Đóng băng" (Frozen Warning) nếu dự án bị bỏ quên từ 3 ngày trở lên (>= 3 ngày) không có tiến độ mới
 * @param {Object} project
 * @param {number} [nowMs]
 * @param {number} [freezeDaysThreshold]
 * @returns {{ isFrozen: boolean, idleDays: number }}
 */
export function checkProjectFrozen(project, nowMs = Date.now(), freezeDaysThreshold = 3) {
  if (!project || typeof project !== 'object' || project.archived) {
    return { isFrozen: false, idleDays: 0 };
  }
  const calc = calculateMasterProgress(project);
  if (calc.percent >= 100) {
    return { isFrozen: false, idleDays: 0 };
  }

  const lastActive = Number(project.lastProgressAt || project.updatedAt || project.createdAt || nowMs);
  const diffMs = Math.max(0, nowMs - lastActive);
  const idleDays = Math.floor(diffMs / 86400000);

  return {
    isFrozen: idleDays >= freezeDaysThreshold,
    idleDays
  };
}

/**
 * Dự báo ngày hoàn thành 100% dự án (Completion Forecast / ETA) dựa trên tốc độ 7 ngày qua
 * @param {Object} project
 * @param {number} [nowMs]
 * @returns {{ status: 'completed' | 'active' | 'stalled', daysRemaining: number | null, targetDateStr: string | null, label: string }}
 */
export function forecastProjectCompletion(project, nowMs = Date.now()) {
  if (!project || typeof project !== 'object') {
    return { status: 'stalled', daysRemaining: null, targetDateStr: null, label: '⏳ Chưa đủ dữ liệu dự báo' };
  }

  const calc = calculateMasterProgress(project);
  if (calc.percent >= 100) {
    return {
      status: 'completed',
      daysRemaining: 0,
      targetDateStr: null,
      label: '🎉 Đã về đích 100%'
    };
  }

  // Lấy các khóa ngày của 7 ngày gần nhất
  const recentKeys = new Set();
  for (let i = 0; i < 7; i++) {
    recentKeys.add(formatDateKey(nowMs - i * 86400000));
  }

  const history = Array.isArray(project.progressHistory) ? project.progressHistory : [];
  const recentEntries = history.filter((h) => h && recentKeys.has(h.date));

  const sum7DayMinutes = recentEntries.reduce((acc, h) => acc + (Number(h.deltaMinutes) || 0), 0);
  const sum7DayPercent = recentEntries.reduce((acc, h) => acc + (Number(h.deltaPercent) || 0), 0);

  const createdAt = Number(project.createdAt) || nowMs;
  const activeSpanDays = Math.max(1, Math.min(7, Math.ceil(Math.max(1, nowMs - createdAt) / 86400000)));
  const totalSpanDays = Math.max(1, Math.ceil(Math.max(1, nowMs - createdAt) / 86400000));

  let daysRemaining = null;

  if (project.mode === 'time_pool') {
    const remainingMinutes = Math.max(0, calc.targetMinutes - calc.spentMinutes);
    const avgDailyMinutes = sum7DayMinutes > 0
      ? sum7DayMinutes / activeSpanDays
      : (calc.spentMinutes > 0 ? calc.spentMinutes / Math.min(7, totalSpanDays) : 0);

    if (avgDailyMinutes > 0) {
      daysRemaining = Math.max(1, Math.min(3650, Math.ceil(remainingMinutes / avgDailyMinutes)));
    }
  } else {
    const remainingPercent = Math.max(0, 100 - calc.percent);
    const avgDailyPercent = sum7DayPercent > 0
      ? sum7DayPercent / activeSpanDays
      : (calc.percent > 0 ? calc.percent / Math.min(7, totalSpanDays) : 0);

    if (avgDailyPercent > 0) {
      daysRemaining = Math.max(1, Math.min(3650, Math.ceil(remainingPercent / avgDailyPercent)));
    }
  }

  if (!daysRemaining || !Number.isFinite(daysRemaining)) {
    return {
      status: 'stalled',
      daysRemaining: null,
      targetDateStr: null,
      label: '⏳ Cần thêm tiến độ để dự báo ngày đích'
    };
  }

  const targetDate = new Date(nowMs + daysRemaining * 86400000);
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const yyyy = targetDate.getFullYear();
  const targetDateStr = `${dd}/${mm}/${yyyy}`;

  return {
    status: 'active',
    daysRemaining,
    targetDateStr,
    label: `🎯 Dự kiến đích: ${targetDateStr} (~${daysRemaining} ngày)`
  };
}

/**
 * Tính toán Chuỗi ngày giữ lửa (Streak) & dữ liệu biểu đồ Heatmap 28 ngày gần nhất
 * @param {Object} activityLog - Map { 'YYYY-MM-DD': { count: number, minutes: number } }
 * @param {number} [nowMs]
 * @param {number} [totalDays]
 * @returns {{ currentStreak: number, bestStreak: number, totalActiveDays: number, cells: Array }}
 */
export function calculateStreakAndHeatmap(activityLog = {}, nowMs = Date.now(), totalDays = 28) {
  const safeLog = activityLog && typeof activityLog === 'object' ? activityLog : {};

  const isDayActive = (dateKey) => {
    const entry = safeLog[dateKey];
    if (!entry) return false;
    return (Number(entry.count) || 0) > 0 || (Number(entry.minutes) || 0) > 0;
  };

  // Tính chuỗi giữ lửa hiện tại (Current Streak)
  let currentStreak = 0;
  const todayKey = formatDateKey(nowMs);
  const yesterdayKey = formatDateKey(nowMs - 86400000);

  let cursorMs = isDayActive(todayKey)
    ? nowMs
    : (isDayActive(yesterdayKey) ? nowMs - 86400000 : null);

  if (cursorMs !== null) {
    while (isDayActive(formatDateKey(cursorMs))) {
      currentStreak += 1;
      cursorMs -= 86400000;
      if (currentStreak > 3650) break;
    }
  }

  // Tạo danh sách các ô vuông Heatmap cho totalDays ngày gần nhất (từ quá khứ -> hôm nay)
  const cells = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const dayMs = nowMs - i * 86400000;
    const dateKey = formatDateKey(dayMs);
    const d = new Date(dayMs);
    const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = safeLog[dateKey] || { count: 0, minutes: 0 };
    const count = Math.max(0, Number(entry.count) || 0);
    const minutes = Math.max(0, Math.round((Number(entry.minutes) || 0) * 10) / 10);

    let level = 0;
    if (count > 0 || minutes > 0) {
      if (minutes >= 90 || count >= 6) level = 4;
      else if (minutes >= 45 || count >= 4) level = 3;
      else if (minutes >= 20 || count >= 2) level = 2;
      else level = 1;
    }

    cells.push({
      dateKey,
      label,
      count,
      minutes,
      level,
      isToday: i === 0
    });
  }

  const allActiveDates = Object.keys(safeLog).filter(isDayActive).sort();
  let bestStreak = currentStreak;
  let tempStreak = 0;
  let prevTime = null;

  for (const key of allActiveDates) {
    const [y, m, d] = key.split('-').map(Number);
    const t = new Date(y, m - 1, d).getTime();
    if (prevTime !== null && Math.round((t - prevTime) / 86400000) === 1) {
      tempStreak += 1;
    } else {
      tempStreak = 1;
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
    prevTime = t;
  }

  return {
    currentStreak,
    bestStreak,
    totalActiveDays: allActiveDates.length,
    cells
  };
}

