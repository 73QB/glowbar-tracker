/**
 * M09 — Điều phối DOM, sự kiện Accordion, Sửa tại chỗ, Kéo thả, Ghim/Lưu trữ,
 * Nhân bản mẫu, Ghi chú nhanh, OLED Dark Mode, Chuỗi giữ lửa Heatmap,
 * Cảnh báo đóng băng, Dự báo đích, Nhật ký giờ & Đồng bộ đám mây.
 * Phục vụ: F01–F12, AC01–AC09, R101, R104
 */

import {
  createProject,
  createSubTask,
  formatDateKey,
  generateId
} from '../core/models.js';
import {
  calculateMasterProgress,
  applyQuickAction,
  applyTimerMinutes,
  levelUpProject,
  updateProjectDetails,
  updateSubTaskDetails,
  cloneProjectTemplate,
  reorderArray,
  reorderSubTasks,
  togglePinProject,
  toggleArchiveProject,
  checkProjectFrozen,
  forecastProjectCompletion,
  calculateStreakAndHeatmap
} from '../core/calculator.js';
import { computeGlowStyle } from '../core/glow.js';
import {
  createTimerState,
  getTimerSnapshot,
  pauseTimer,
  resumeTimer
} from '../core/timer.js';
import {
  loadLocalState,
  saveLocalState,
  mergeRemoteState,
  initCloudSync,
  loadCloudConfig,
  saveCloudConfig,
  createDefaultSeedState,
  normalizeAppState,
  recordDailyActivity
} from '../services/sync.js';

let appState = loadLocalState();
let cloudController = {
  pushState: async () => false,
  disconnect: () => {}
};
let timerTickInterval = null;

// Trạng thái đang sửa tại chỗ (Inline Edit): { type: 'project'|'subtask', projectId, subId? }
let editingTarget = null;

// Trạng thái đang kéo thả (Drag & Drop)
let dragContext = null;

// Ngăn xếp lưu ảnh chụp trạng thái để hỗ trợ Hoàn Tác (Undo History Stack)
const undoStack = [];
const MAX_UNDO_DEPTH = 30;

/**
 * Lưu ảnh chụp trạng thái hiện tại vào ngăn xếp hoàn tác trước khi thay đổi dữ liệu
 * @param {Object} state
 */
function pushUndoSnapshot(state) {
  try {
    undoStack.push(JSON.parse(JSON.stringify(state)));
    if (undoStack.length > MAX_UNDO_DEPTH) {
      undoStack.shift();
    }
    updateUndoButtonUI();
  } catch (err) {
    console.warn('[Undo] Không thể lưu snapshot:', err);
  }
}

/**
 * Cập nhật giao diện nút Hoàn tác trên thanh điều khiển chính
 */
function updateUndoButtonUI() {
  const btn = document.getElementById('btnUndoAction');
  if (!btn) return;
  if (undoStack.length > 0) {
    btn.removeAttribute('disabled');
    btn.title = `Hoàn tác thao tác vừa rồi (Ctrl + Z) — Còn ${undoStack.length} bước có thể hoàn lại`;
  } else {
    btn.setAttribute('disabled', 'true');
    btn.title = 'Chưa có thao tác nào để hoàn tác (Ctrl + Z)';
  }
}

/**
 * Hoàn tác thao tác thay đổi dữ liệu gần nhất (Undo Last Action)
 */
export function undoLastAction() {
  if (undoStack.length === 0) {
    showToast('ℹ Chưa có thao tác nào trước đó để hoàn tác.');
    return;
  }
  const prevState = undoStack.pop();
  editingTarget = null;
  updateUndoButtonUI();
  commitState(prevState, { pushCloud: true, recordHistory: false });
  showToast('↩ Đã hoàn tác thao tác vừa rồi thành công!');
}

/**
 * Khử độc chuỗi HTML chống XSS tuyệt đối trước khi đưa vào thuộc tính / template (R104)
 * @param {string} raw
 * @returns {string}
 */
export function escapeHtml(raw) {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Định dạng dòng ghi chú nhanh: khử độc XSS trước, sau đó chuyển các URL http/https thành thẻ link an toàn (R104)
 * @param {string} rawNote
 * @returns {string}
 */
export function formatSafeNoteHtml(rawNote) {
  const escaped = escapeHtml(rawNote);
  return escaped.replace(
    /(https?:\/\/[^\s<>"']+)/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="sub-bar__note-link">$1 ↗</a>'
  );
}

/**
 * Hiển thị thông báo ngắn (Toast), có thể kèm nút Hoàn tác (Undo) trực tiếp
 * @param {string} message
 * @param {{ showUndo?: boolean, onAction?: () => void, label?: string }} [actionOptions]
 */
function showToast(message, actionOptions = null) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';

  const msgSpan = document.createElement('span');
  msgSpan.className = 'toast__message';
  msgSpan.textContent = message;
  toast.appendChild(msgSpan);

  if (actionOptions?.showUndo || actionOptions?.onAction) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'toast__action-btn';
    actionBtn.textContent = actionOptions.label || '↩ Hoàn tác';
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toast.remove();
      if (typeof actionOptions.onAction === 'function') {
        actionOptions.onAction();
      } else {
        undoLastAction();
      }
    });
    toast.appendChild(actionBtn);
  }

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, actionOptions?.showUndo ? 5500 : 3200);
}

/**
 * Áp dụng chế độ giao diện Sáng (Positivus) hoặc Tối thuần (OLED Dark) lên thẻ <html>
 * @param {string} theme
 */
function applyThemeUI(theme) {
  const cleanTheme = theme === 'oled_dark' ? 'oled_dark' : 'positivus';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', cleanTheme);
    const btnTheme = document.getElementById('btnToggleTheme');
    if (btnTheme) {
      btnTheme.textContent = cleanTheme === 'oled_dark' ? '☀️ Positivus' : '🌙 OLED Dark';
      btnTheme.title = cleanTheme === 'oled_dark'
        ? 'Chuyển về giao diện sáng Positivus'
        : 'Chuyển sang giao diện đêm OLED Dark tôn hiệu ứng phát sáng Neon';
    }
  }
}

/**
 * Lưu trạng thái mới vào LocalStorage, đồng bộ lên Firestore và cập nhật giao diện
 * @param {Object} nextState
 * @param {{ pushCloud?: boolean, recordHistory?: boolean }} [options]
 */
function commitState(nextState, { pushCloud = true, recordHistory = true } = {}) {
  if (recordHistory && appState) {
    pushUndoSnapshot(appState);
  }
  appState = saveLocalState({
    ...nextState,
    updatedAt: Date.now()
  });
  applyThemeUI(appState.theme);
  renderDashboard(appState);
  if (pushCloud) {
    cloudController.pushState(appState);
  }
}

/**
 * Đóng / mở Accordion của một thanh dự án Master-bar (F03, M09)
 * @param {string} projectId
 */
export function toggleAccordion(projectId) {
  const nextExpanded = appState.expandedProjectId === projectId ? null : projectId;
  commitState(
    {
      ...appState,
      expandedProjectId: nextExpanded
    },
    { pushCloud: false, recordHistory: false }
  );
}

/**
 * Cập nhật 4 thẻ thống kê tổng quan KPI trên đầu trang (chỉ tính các dự án chưa lưu trữ hoặc toàn bộ)
 * @param {Object} state
 */
function renderKpiSummary(state) {
  const allProjects = Array.isArray(state.projects) ? state.projects : [];
  const activeProjects = allProjects.filter((p) => !p.archived);
  const targetList = activeProjects.length > 0 ? activeProjects : allProjects;

  let sumPercent = 0;
  let completedSub = 0;
  let totalSub = 0;
  let totalSpentMinutes = 0;

  for (const proj of allProjects) {
    const calc = calculateMasterProgress(proj);
    completedSub += calc.completedSubTasks;
    totalSub += calc.totalSubTasks;
    totalSpentMinutes += calc.spentMinutes;
  }

  for (const proj of targetList) {
    const calc = calculateMasterProgress(proj);
    sumPercent += calc.percent;
  }

  const avgPercent = targetList.length > 0
    ? Math.round((sumPercent / targetList.length) * 10) / 10
    : 0;
  const totalHours = Math.round((totalSpentMinutes / 60) * 10) / 10;

  const elProjects = document.getElementById('kpiTotalProjects');
  const elAvg = document.getElementById('kpiAvgProgress');
  const elSub = document.getElementById('kpiCompletedSubTasks');
  const elHours = document.getElementById('kpiTotalHours');

  if (elProjects) elProjects.textContent = `${activeProjects.length}`;
  if (elAvg) elAvg.textContent = `${avgPercent.toFixed(1)}%`;
  if (elSub) elSub.textContent = `${completedSub} / ${totalSub}`;
  if (elHours) elHours.textContent = `${totalHours.toFixed(1)}h`;
}

/**
 * Render thanh lọc Ghim & Lưu trữ (Filter Tabs)
 * @param {Object} state
 */
function renderFilterTabs(state) {
  const projects = Array.isArray(state.projects) ? state.projects : [];
  const activeCount = projects.filter((p) => !p.archived).length;
  const pinnedCount = projects.filter((p) => p.pinned && !p.archived).length;
  const archivedCount = projects.filter((p) => p.archived).length;

  const elActive = document.getElementById('countActiveProjects');
  const elPinned = document.getElementById('countPinnedProjects');
  const elArchived = document.getElementById('countArchivedProjects');

  if (elActive) elActive.textContent = `${activeCount}`;
  if (elPinned) elPinned.textContent = `${pinnedCount}`;
  if (elArchived) elArchived.textContent = `${archivedCount}`;

  const currentFilter = state.filterView || 'active';
  document.querySelectorAll('#projectFilterBar .filter-tab').forEach((btn) => {
    btn.classList.toggle('filter-tab--active', btn.dataset.filter === currentFilter);
  });
}

/**
 * Render Thẻ Chuỗi Giữ Lửa (Streak) & Biểu Đồ Nhiệt (Heatmap 28 ngày)
 * @param {Object} state
 */
function renderStreakAndHeatmap(state) {
  const streakData = calculateStreakAndHeatmap(state.activityLog || {}, Date.now(), 28);

  const badgeEl = document.getElementById('streakCurrentBadge');
  const bestEl = document.getElementById('streakBestValue');
  const activeDaysEl = document.getElementById('streakActiveDaysValue');
  const gridEl = document.getElementById('heatmapGrid');

  if (badgeEl) badgeEl.textContent = `🔥 ${streakData.currentStreak} ngày`;
  if (bestEl) bestEl.textContent = `${streakData.bestStreak} ngày`;
  if (activeDaysEl) activeDaysEl.textContent = `${streakData.totalActiveDays} ngày`;

  if (gridEl) {
    gridEl.innerHTML = streakData.cells
      .map(
        (cell) => `
        <div
          class="heatmap-cell heatmap-cell--lv-${cell.level} ${cell.isToday ? 'heatmap-cell--today' : ''}"
          title="Ngày ${escapeHtml(cell.label)} (${escapeHtml(cell.dateKey)}): ${cell.minutes} phút · ${cell.count} lần cập nhật"
        >
          <span class="heatmap-cell__day">${escapeHtml(cell.label.slice(0, 2))}</span>
        </div>
      `
      )
      .join('');
  }
}

/**
 * Render Thẻ Nhật Ký Phiên Tập Trung (Focus Timer Logs hôm nay & 7 ngày qua)
 * @param {Object} state
 */
function renderTimerLogsSection(state) {
  const logs = Array.isArray(state.timerLogs) ? state.timerLogs : [];
  const now = Date.now();
  const todayKey = formatDateKey(now);

  let todayMins = 0;
  let weekMins = 0;
  const projectMinutesMap = new Map();

  for (const item of logs) {
    const mins = Number(item.minutes) || 0;
    const itemDateKey = formatDateKey(item.completedAt);
    if (itemDateKey === todayKey) {
      todayMins += mins;
    }
    if (now - Number(item.completedAt) <= 7 * 86400000) {
      weekMins += mins;
      const pTitle = item.projectTitle || 'Dự án';
      projectMinutesMap.set(pTitle, (projectMinutesMap.get(pTitle) || 0) + mins);
    }
  }

  let topProjectTitle = 'Chưa có phiên nào';
  let topProjectMins = 0;
  for (const [title, totalM] of projectMinutesMap.entries()) {
    if (totalM > topProjectMins) {
      topProjectMins = totalM;
      topProjectTitle = title;
    }
  }

  const elToday = document.getElementById('timerLogTodayMins');
  const elWeek = document.getElementById('timerLogWeekHours');
  const elTop = document.getElementById('timerLogTopProject');
  const elList = document.getElementById('timerLogsList');

  if (elToday) elToday.textContent = `${Math.round(todayMins)} phút`;
  if (elWeek) elWeek.textContent = `${(Math.round((weekMins / 60) * 10) / 10).toFixed(1)}h (${Math.round(weekMins)}p)`;
  if (elTop) {
    elTop.innerHTML = topProjectMins > 0
      ? `🏆 Đầu tư nhiều nhất tuần: <strong>${escapeHtml(topProjectTitle)}</strong> (${Math.round(topProjectMins)}p)`
      : `🏆 Đầu tư nhiều nhất tuần: <strong>Chưa có dữ liệu</strong>`;
  }

  if (elList) {
    if (logs.length === 0) {
      elList.innerHTML = `<p class="timer-logs-empty">Chưa có phiên Focus Timer nào được ghi nhận.</p>`;
      return;
    }
    elList.innerHTML = logs
      .slice(0, 6)
      .map((item) => {
        const d = new Date(Number(item.completedAt) || now);
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        return `
          <div class="timer-log-item">
            <div class="timer-log-item__info">
              <strong class="timer-log-item__title">${escapeHtml(item.subTaskTitle)}</strong>
              <span class="timer-log-item__sub">${escapeHtml(item.projectTitle)} · ${escapeHtml(timeStr)}</span>
            </div>
            <span class="timer-log-item__badge">+${escapeHtml(item.minutes)}p</span>
          </div>
        `;
      })
      .join('');
  }
}

/**
 * Cập nhật danh sách chọn Sub-bar trong bộ đếm Focus Timer
 * @param {Object} state
 */
function renderTimerSubTaskOptions(state) {
  const selectEl = document.getElementById('timerSubTaskSelect');
  if (!selectEl) return;

  const previousVal = selectEl.value;
  const activeKey = state.activeTimer
    ? `${state.activeTimer.projectId}::${state.activeTimer.subTaskId}`
    : '';

  selectEl.innerHTML = '<option value="">-- Chọn công việc cần bấm giờ --</option>';

  for (const proj of (state.projects || []).filter((p) => !p.archived)) {
    const optGroup = document.createElement('optgroup');
    optGroup.label = `⚡ ${proj.title}`;

    for (const sub of proj.subTasks || []) {
      const option = document.createElement('option');
      option.value = `${proj.id}::${sub.id}`;
      option.textContent = `${sub.title} (${sub.progressPercent}% · ${sub.spentMinutes}p)`;
      optGroup.appendChild(option);
    }

    selectEl.appendChild(optGroup);
  }

  if (activeKey) {
    selectEl.value = activeKey;
  } else if (previousVal && Array.from(selectEl.options).some((o) => o.value === previousVal)) {
    selectEl.value = previousVal;
  }
}

/**
 * Render toàn bộ danh sách Master-bar và Sub-bar (F01–F10 + 11 tính năng mở rộng)
 * @param {Object} state
 */
export function renderDashboard(state = appState) {
  renderKpiSummary(state);
  renderFilterTabs(state);
  renderStreakAndHeatmap(state);
  renderTimerLogsSection(state);
  renderTimerSubTaskOptions(state);

  const container = document.getElementById('projectsContainer');
  if (!container) return;

  const allProjects = Array.isArray(state.projects) ? state.projects : [];
  const currentFilter = state.filterView || 'active';

  let filteredProjects = [];
  if (currentFilter === 'pinned') {
    filteredProjects = allProjects.filter((p) => p.pinned && !p.archived);
  } else if (currentFilter === 'archived') {
    filteredProjects = allProjects.filter((p) => p.archived);
  } else {
    // Chế độ 'active': Đưa các dự án đã Ghim (pinned) lên đầu trang, giữ nguyên thứ tự tương đối
    const pinnedList = allProjects.filter((p) => !p.archived && p.pinned);
    const unpinnedList = allProjects.filter((p) => !p.archived && !p.pinned);
    filteredProjects = [...pinnedList, ...unpinnedList];
  }

  if (filteredProjects.length === 0) {
    const emptyMsg = currentFilter === 'archived'
      ? 'Ngăn Lưu trữ (Archive) đang trống. Bạn có thể cất các dự án đã đạt 100% vào đây để gọn không gian!'
      : currentFilter === 'pinned'
        ? 'Chưa có dự án nào được ghim. Hãy bấm nút 📌 Ghim trên thẻ dự án (tối đa 3 dự án trọng tâm).'
        : 'Chưa có thanh dự án nào đang chạy. Hãy bấm "+ Tạo Dự Án Mới" để bắt đầu!';
    container.innerHTML = `
      <div class="kpi-card" style="text-align:center; padding:32px;">
        <p style="color:var(--text-secondary); margin-bottom:8px;">${escapeHtml(emptyMsg)}</p>
      </div>
    `;
    renderTimerDisplay();
    return;
  }

  const activeTimerSubId = state.activeTimer?.subTaskId || null;
  const nowMs = Date.now();

  container.innerHTML = filteredProjects
    .map((proj) => {
      const calc = calculateMasterProgress(proj);
      const effectiveColor = (!proj.themeColor || proj.themeColor.toLowerCase() === '#b9ff66')
        ? (proj.mode === 'time_pool' ? '#7c3aed' : '#2563eb')
        : proj.themeColor;
      const glow = computeGlowStyle(calc.percent, effectiveColor);
      const isExpanded = state.expandedProjectId === proj.id;
      const isEditingProj = editingTarget?.type === 'project' && editingTarget?.projectId === proj.id;

      // Cảnh báo đóng băng (> 7 ngày không có tiến độ) & Dự báo đích (ETA)
      const frozenInfo = checkProjectFrozen(proj, nowMs, 7);
      const forecast = forecastProjectCompletion(proj, nowMs);

      const cssVarInline = Object.entries(glow.cssVars)
        .map(([k, v]) => `${k}:${escapeHtml(v)}`)
        .join(';');

      const modeBadge = proj.mode === 'time_pool'
        ? `<span class="badge badge--mode-pool" data-action="start-edit-project" data-project-id="${escapeHtml(proj.id)}" title="Nhấp để sửa nhanh quỹ giờ mục tiêu">⏳ Quỹ thời gian (${escapeHtml(proj.targetHours)}h)</span>`
        : `<span class="badge badge--mode-fixed">⚖️ Lộ trình cố định</span>`;

      const pinnedBadge = proj.pinned
        ? `<span class="badge badge--pinned" title="Dự án trọng tâm đang được ghim lên đầu">📌 Đang ghim</span>`
        : '';

      const frozenBadge = frozenInfo.isFrozen
        ? `<span class="badge badge--frozen" title="Dự án đã bị bỏ quên ${frozenInfo.idleDays} ngày chưa có thêm tiến độ!">❄️ Đóng băng (${frozenInfo.idleDays} ngày)</span>`
        : '';

      const forecastBadge = `<span class="badge badge--forecast badge--forecast-${forecast.status}">${escapeHtml(forecast.label)}</span>`;

      const spentHours = Math.round((calc.spentMinutes / 60) * 10) / 10;

      const levelUpBtnBadge = proj.mode === 'time_pool'
        ? `
          <button
            type="button"
            class="badge badge--levelup-btn ${calc.isLevelUpReady ? 'badge--levelup-btn--ready' : ''}"
            data-action="open-levelup"
            data-project-id="${escapeHtml(proj.id)}"
            title="Nâng cấp mục tiêu / Mở rộng thêm quỹ thời gian cho dự án"
          >
            🚀 Level Up ${calc.isLevelUpReady ? 'Ngay!' : ''}
          </button>
        `
        : '';

      const metaLeft = proj.mode === 'time_pool'
        ? `Tích lũy: <strong>${spentHours}h / ${proj.targetHours}h</strong> (${calc.spentMinutes} / ${calc.targetMinutes} phút) · Không tụt % khi thêm việc mới`
        : `Hoàn tất: <strong>${calc.completedSubTasks}/${calc.totalSubTasks} đầu việc</strong> · Đã đầu tư ${calc.spentMinutes} phút`;

      const inlineEditProjectHtml = isEditingProj
        ? `
          <form class="inline-edit-box" data-form="inline-edit-project" data-project-id="${escapeHtml(proj.id)}">
            <div class="inline-edit-box__row">
              <div class="inline-edit-box__field inline-edit-box__field--grow">
                <label>Tên dự án</label>
                <input type="text" name="editProjTitle" class="form-input" value="${escapeHtml(proj.title)}" required />
              </div>
              <div class="inline-edit-box__field">
                <label>Chế độ</label>
                <select name="editProjMode" class="form-select">
                  <option value="fixed" ${proj.mode === 'fixed' ? 'selected' : ''}>⚖️ Cố định (Trọng số)</option>
                  <option value="time_pool" ${proj.mode === 'time_pool' ? 'selected' : ''}>⏳ Quỹ thời gian (Giờ)</option>
                </select>
              </div>
              <div class="inline-edit-box__field">
                <label>Quỹ giờ (h)</label>
                <input type="number" name="editProjHours" class="form-input" min="0.5" max="10000" step="0.5" value="${escapeHtml(proj.targetHours)}" />
              </div>
            </div>
            <div class="inline-edit-box__actions">
              <button type="submit" class="sub-bar__action-btn sub-bar__action-btn--done">✓ Lưu thay đổi</button>
              <button type="button" class="sub-bar__action-btn" data-action="cancel-inline-edit">✕ Hủy</button>
            </div>
          </form>
        `
        : '';

      const levelUpBannerHtml = (proj.mode === 'time_pool' && calc.isLevelUpReady)
        ? `
          <div class="levelup-banner" data-levelup-banner="${escapeHtml(proj.id)}">
            <span class="levelup-banner__text">
              ⚡ <strong>Đã chạm 100% Quỹ thời gian (${spentHours}h / ${proj.targetHours}h)!</strong> Bạn có muốn nâng cấp mục tiêu (tăng thêm số giờ hoặc chuyển sang chốt cố định)?
            </span>
            <button type="button" class="btn btn--primary" data-action="open-levelup" data-project-id="${escapeHtml(proj.id)}">
              🚀 Level Up Ngay
            </button>
          </div>
        `
        : '';

      const subBarsHtml = (proj.subTasks || [])
        .map((sub, subIdx) => {
          const isDone = Number(sub.progressPercent) >= 100;
          const isTimerActive = activeTimerSubId === sub.id;
          const isEditingSub =
            editingTarget?.type === 'subtask' &&
            editingTarget?.projectId === proj.id &&
            editingTarget?.subId === sub.id;

          if (isEditingSub) {
            return `
              <form class="sub-bar sub-bar--editing" data-form="inline-edit-subtask" data-project-id="${escapeHtml(proj.id)}" data-sub-id="${escapeHtml(sub.id)}">
                <div class="inline-edit-box__row">
                  <div class="inline-edit-box__field inline-edit-box__field--grow">
                    <label>Tên đầu việc (Sub-bar)</label>
                    <input type="text" name="editSubTitle" class="form-input" value="${escapeHtml(sub.title)}" required />
                  </div>
                  <div class="inline-edit-box__field">
                    <label>Trọng số (×)</label>
                    <input type="number" name="editSubWeight" class="form-input" min="0.5" max="100" step="0.5" value="${escapeHtml(sub.weight)}" required />
                  </div>
                  <div class="inline-edit-box__field">
                    <label>Dự kiến (phút)</label>
                    <input type="number" name="editSubEstimated" class="form-input" min="5" max="5000" step="5" value="${escapeHtml(sub.estimatedMinutes)}" required />
                  </div>
                </div>
                <div class="inline-edit-box__row">
                  <div class="inline-edit-box__field inline-edit-box__field--grow">
                    <label>📝 Ghi chú nhanh / Đường dẫn tài liệu</label>
                    <input type="text" name="editSubNote" class="form-input" value="${escapeHtml(sub.note || '')}" placeholder="VD: Đọc chương 3 hoặc dán link https://..." />
                  </div>
                </div>
                <div class="inline-edit-box__actions">
                  <button type="submit" class="sub-bar__action-btn sub-bar__action-btn--done">✓ Lưu đầu việc</button>
                  <button type="button" class="sub-bar__action-btn" data-action="cancel-inline-edit">✕ Hủy</button>
                </div>
              </form>
            `;
          }

          const noteBlockHtml = sub.note
            ? `<div class="sub-bar__note">📝 ${formatSafeNoteHtml(sub.note)}</div>`
            : '';

          return `
            <div
              class="sub-bar ${isDone ? 'sub-bar--done' : ''} ${isTimerActive ? 'sub-bar--active-timer' : ''}"
              data-subtask-id="${escapeHtml(sub.id)}"
              data-project-id="${escapeHtml(proj.id)}"
              data-sub-index="${subIdx}"
              draggable="true"
            >
              <div class="sub-bar__header">
                <div class="sub-bar__title-wrap">
                  <span class="drag-handle" title="Giữ và kéo để đổi thứ tự đầu việc">⠿</span>
                  <span
                    class="sub-bar__title"
                    data-dblclick-edit="subtask"
                    data-project-id="${escapeHtml(proj.id)}"
                    data-sub-id="${escapeHtml(sub.id)}"
                    title="Nhấp đúp để sửa nhanh tên, trọng số, ghi chú"
                  >${escapeHtml(sub.title)}</span>
                  <span
                    class="sub-bar__meta-tag"
                    data-dblclick-edit="subtask"
                    data-project-id="${escapeHtml(proj.id)}"
                    data-sub-id="${escapeHtml(sub.id)}"
                  >Trọng số: ×${escapeHtml(sub.weight)}</span>
                  <span
                    class="sub-bar__meta-tag"
                    data-dblclick-edit="subtask"
                    data-project-id="${escapeHtml(proj.id)}"
                    data-sub-id="${escapeHtml(sub.id)}"
                  >${escapeHtml(sub.spentMinutes)}/${escapeHtml(sub.estimatedMinutes)} phút</span>
                </div>
                <span class="sub-bar__percent">${escapeHtml(sub.progressPercent.toFixed(1))}%</span>
              </div>

              <div class="sub-bar__track">
                <div class="sub-bar__fill" style="width: ${escapeHtml(sub.progressPercent)}%"></div>
              </div>

              ${noteBlockHtml}

              <div class="sub-bar__actions">
                <div class="sub-bar__quick-btns">
                  ${sub.progressPercent > 0 ? `
                    <button type="button" class="sub-bar__action-btn sub-bar__action-btn--minus" data-action="quick-add" data-project-id="${escapeHtml(proj.id)}" data-sub-id="${escapeHtml(sub.id)}" data-delta="-10" title="Giảm -10% nếu lỡ bấm nhầm">
                      -10%
                    </button>
                  ` : ''}
                  <button type="button" class="sub-bar__action-btn" data-action="quick-add" data-project-id="${escapeHtml(proj.id)}" data-sub-id="${escapeHtml(sub.id)}" data-delta="10">
                    +10%
                  </button>
                  <button type="button" class="sub-bar__action-btn" data-action="quick-add" data-project-id="${escapeHtml(proj.id)}" data-sub-id="${escapeHtml(sub.id)}" data-delta="25">
                    +25%
                  </button>
                  <button type="button" class="sub-bar__action-btn sub-bar__action-btn--done" data-action="quick-add" data-project-id="${escapeHtml(proj.id)}" data-sub-id="${escapeHtml(sub.id)}" data-delta="100">
                    ✓ Hoàn thành
                  </button>
                </div>

                <div class="sub-bar__quick-btns">
                  <button type="button" class="sub-bar__action-btn" data-action="move-subtask" data-project-id="${escapeHtml(proj.id)}" data-sub-index="${subIdx}" data-dir="-1" title="Đưa lên trên">↑</button>
                  <button type="button" class="sub-bar__action-btn" data-action="move-subtask" data-project-id="${escapeHtml(proj.id)}" data-sub-index="${subIdx}" data-dir="1" title="Đưa xuống dưới">↓</button>
                  <button type="button" class="sub-bar__action-btn" data-action="start-edit-subtask" data-project-id="${escapeHtml(proj.id)}" data-sub-id="${escapeHtml(sub.id)}" title="Sửa tên, trọng số, phút &amp; ghi chú">
                    ✏️ Sửa
                  </button>
                  <button type="button" class="sub-bar__action-btn sub-bar__action-btn--timer" data-action="focus-subtask" data-project-id="${escapeHtml(proj.id)}" data-sub-id="${escapeHtml(sub.id)}">
                    ⏱ Hẹn giờ
                  </button>
                  <button type="button" class="sub-bar__action-btn" data-action="delete-subtask" data-project-id="${escapeHtml(proj.id)}" data-sub-id="${escapeHtml(sub.id)}" title="Xóa việc nhỏ">
                    🗑
                  </button>
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      return `
        <article
          class="master-card ${isExpanded ? 'master-card--expanded' : ''} ${frozenInfo.isFrozen ? 'master-card--frozen' : ''} ${proj.pinned ? 'master-card--pinned' : ''} master-card--milestone-${glow.milestoneTier}"
          style="${cssVarInline}"
          data-project-card="${escapeHtml(proj.id)}"
          draggable="true"
        >
          <div
            class="master-bar"
            role="button"
            tabindex="0"
            aria-expanded="${isExpanded ? 'true' : 'false'}"
            data-action="toggle-accordion"
            data-project-id="${escapeHtml(proj.id)}"
          >
            <div class="master-bar__top">
              <div class="master-bar__title-group">
                <div class="master-bar__title-row">
                  <span class="drag-handle drag-handle--master" title="Giữ và kéo để sắp xếp thứ tự ưu tiên dự án">⠿</span>
                  <h3
                    class="master-bar__title"
                    data-dblclick-edit="project"
                    data-project-id="${escapeHtml(proj.id)}"
                    title="Nhấp đúp để đổi tên dự án hoặc chỉnh quỹ giờ"
                  >${escapeHtml(proj.title)}</h3>
                  <button
                    type="button"
                    class="btn-icon-inline"
                    data-action="start-edit-project"
                    data-project-id="${escapeHtml(proj.id)}"
                    title="Sửa nhanh tên dự án &amp; quỹ giờ"
                  >✏️</button>
                </div>
                <div class="master-bar__badges">
                  ${pinnedBadge}
                  ${frozenBadge}
                  ${modeBadge}
                  <span class="badge badge--level">Lv.${escapeHtml(proj.level)}</span>
                  <span class="badge badge--milestone">Mốc sáng: ${glow.milestoneTier}%</span>
                  ${forecastBadge}
                  ${levelUpBtnBadge}
                </div>
              </div>

              <div class="master-bar__stats">
                <span class="master-bar__percent">${calc.percent.toFixed(1)}%</span>
                <span class="master-bar__chevron" aria-hidden="true">${isExpanded ? '−' : '+'}</span>
              </div>
            </div>

            <div class="energy-track" role="progressbar" aria-valuenow="${calc.percent}" aria-valuemin="0" aria-valuemax="100">
              <div class="energy-track__markers" aria-hidden="true">
                <span class="energy-track__marker" style="left: 25%"></span>
                <span class="energy-track__marker" style="left: 50%"></span>
                <span class="energy-track__marker" style="left: 75%"></span>
              </div>
              <div class="energy-track__fill"></div>
            </div>

            <div class="master-bar__meta">
              <span>${metaLeft}</span>
              <span>Độ sáng Glow: <code>${glow.blurPx}px</code> · Opacity: <code>${glow.opacity}</code></span>
            </div>
          </div>

          ${inlineEditProjectHtml}
          ${levelUpBannerHtml}

          <div class="accordion-drawer">
            <div class="accordion-drawer__inner">
              <div class="subbars-container">
                <!-- Thanh công cụ quản lý nhanh dự án (Ghim, Nhân bản, Sắp xếp, Lưu trữ, Xóa) -->
                <div class="project-quick-toolbar">
                  <div class="project-quick-toolbar__left">
                    <button type="button" class="sub-bar__action-btn" data-action="toggle-pin" data-project-id="${escapeHtml(proj.id)}">
                      ${proj.pinned ? '📌 Bỏ ghim' : '📌 Ghim đầu trang'}
                    </button>
                    <button type="button" class="sub-bar__action-btn" data-action="clone-project" data-project-id="${escapeHtml(proj.id)}" title="Sao chép cấu trúc đầu việc và trọng số sang dự án mới">
                      📋 Nhân bản mẫu
                    </button>
                    <button type="button" class="sub-bar__action-btn" data-action="toggle-archive" data-project-id="${escapeHtml(proj.id)}">
                      ${proj.archived ? '📤 Khôi phục' : '📦 Lưu trữ (Archive)'}
                    </button>
                  </div>
                  <div class="project-quick-toolbar__right">
                    <button type="button" class="sub-bar__action-btn" data-action="move-project" data-project-id="${escapeHtml(proj.id)}" data-dir="-1" title="Đưa dự án lên trên">↑ Lên</button>
                    <button type="button" class="sub-bar__action-btn" data-action="move-project" data-project-id="${escapeHtml(proj.id)}" data-dir="1" title="Đưa dự án xuống dưới">↓ Xuống</button>
                    <button type="button" class="btn btn--danger-ghost" data-action="delete-project" data-project-id="${escapeHtml(proj.id)}">
                      🗑 Xóa Dự Án
                    </button>
                  </div>
                </div>

                ${subBarsHtml || '<p style="color:var(--text-muted); font-size:0.84rem;">Chưa có đầu việc nhỏ nào. Hãy thêm đầu việc bên dưới.</p>'}

                <form class="add-subtask-form" data-form="add-subtask" data-project-id="${escapeHtml(proj.id)}">
                  <input type="text" name="subTitle" class="form-input" placeholder="Thêm đầu việc nhỏ mới (Sub-bar)..." required />
                  <input type="number" name="subWeight" class="form-input" min="0.5" max="100" step="0.5" value="1" title="Trọng số (Weight)" placeholder="Trọng số" />
                  <input type="number" name="subEstimated" class="form-input" min="5" max="2000" step="5" value="60" title="Số phút dự kiến" placeholder="Phút dự kiến" />
                  <button type="submit" class="btn btn--primary">+ Thêm Việc</button>
                  <input type="text" name="subNote" class="form-input add-subtask-form__note" placeholder="📝 Ghi chú nhanh hoặc dán link tài liệu (tùy chọn)..." />
                </form>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  renderTimerDisplay();
}

/**
 * Cập nhật đồng hồ đếm ngược Focus Timer mỗi giây dựa trên Timestamp (C03, F08, F09)
 */
function renderTimerDisplay() {
  const clockEl = document.getElementById('timerClockText');
  const labelEl = document.getElementById('timerTargetLabel');
  const barEl = document.getElementById('timerProgressBar');
  const badgeEl = document.getElementById('timerStateBadge');
  const btnStartPause = document.getElementById('btnTimerStartPause');
  const ringEl = document.getElementById('timerDisplayRing');
  const customInput = document.getElementById('timerCustomMinutes');

  const timer = appState.activeTimer;
  if (!timer) {
    const mins = Number(customInput?.value) || 25;
    if (clockEl) clockEl.textContent = `${String(mins).padStart(2, '0')}:00`;
    if (labelEl) labelEl.textContent = 'Chọn một đầu việc bên dưới để bắt đầu';
    if (barEl) barEl.style.width = '0%';
    if (badgeEl) badgeEl.textContent = 'Sẵn sàng';
    if (btnStartPause) btnStartPause.textContent = '▶ Bắt Đầu Tập Trung';
    ringEl?.classList.remove('timer-display--running');
    return;
  }

  const snapshot = getTimerSnapshot(timer, Date.now());
  const proj = appState.projects.find((p) => p.id === timer.projectId);
  const sub = proj?.subTasks.find((s) => s.id === timer.subTaskId);

  if (clockEl) clockEl.textContent = snapshot.formattedTime;
  if (labelEl) {
    labelEl.textContent = sub
      ? `${proj.title} › ${sub.title}`
      : 'Đang chạy phiên tập trung';
  }
  if (barEl) barEl.style.width = `${Math.round(snapshot.progressRatio * 100)}%`;

  if (snapshot.isCompleted) {
    completeActiveTimerSession(timer.durationMinutes);
    return;
  }

  if (timer.status === 'running') {
    if (badgeEl) badgeEl.textContent = 'Đang tập trung...';
    if (btnStartPause) btnStartPause.textContent = '⏸ Tạm Dừng';
    ringEl?.classList.add('timer-display--running');
  } else {
    if (badgeEl) badgeEl.textContent = 'Đang tạm dừng';
    if (btnStartPause) btnStartPause.textContent = '▶ Tiếp Tục';
    ringEl?.classList.remove('timer-display--running');
  }
}

/**
 * Hoàn thành phiên Focus Timer, ghi vào Nhật ký giờ, cập nhật Chuỗi giữ lửa & nhích thanh bar (F09, AC04)
 * @param {number} [overrideMinutes]
 */
function completeActiveTimerSession(overrideMinutes) {
  const timer = appState.activeTimer;
  const selectEl = document.getElementById('timerSubTaskSelect');
  const customInput = document.getElementById('timerCustomMinutes');

  let targetProjectId = timer?.projectId;
  let targetSubTaskId = timer?.subTaskId;
  const minutesToCredit = Math.max(1, Number(overrideMinutes ?? timer?.durationMinutes ?? customInput?.value ?? 25));

  if ((!targetProjectId || !targetSubTaskId) && selectEl?.value) {
    const [pId, sId] = selectEl.value.split('::');
    targetProjectId = pId;
    targetSubTaskId = sId;
  }

  if (!targetProjectId || !targetSubTaskId) {
    showToast('⚠ Vui lòng chọn một đầu việc (Sub-bar) trước!');
    return;
  }

  const nowMs = Date.now();
  const targetProj = appState.projects.find((p) => p.id === targetProjectId);
  const targetSub = targetProj?.subTasks.find((s) => s.id === targetSubTaskId);

  const nextProjects = appState.projects.map((proj) => {
    if (proj.id !== targetProjectId) return proj;
    return applyTimerMinutes(proj, targetSubTaskId, minutesToCredit, nowMs);
  });

  const newLogEntry = {
    id: generateId('tlog'),
    projectId: targetProjectId,
    projectTitle: targetProj?.title || 'Dự án',
    subTaskId: targetSubTaskId,
    subTaskTitle: targetSub?.title || 'Công việc',
    minutes: minutesToCredit,
    completedAt: nowMs
  };

  const nextActivityLog = recordDailyActivity(appState.activityLog, minutesToCredit, nowMs);
  const nextTimerLogs = [newLogEntry, ...(appState.timerLogs || [])].slice(0, 150);

  commitState({
    ...appState,
    expandedProjectId: targetProjectId,
    activeTimer: null,
    activityLog: nextActivityLog,
    timerLogs: nextTimerLogs,
    projects: nextProjects
  });

  showToast(`⚡ Đã cộng +${minutesToCredit} phút vào Nhật ký giờ & Chuỗi giữ lửa!`, { showUndo: true });
}

/**
 * Gắn toàn bộ sự kiện tương tác trên giao diện
 */
function bindEvents() {
  const projectsContainer = document.getElementById('projectsContainer');

  // Nút chuyển đổi giao diện Sáng Positivus / Đêm OLED Dark
  document.getElementById('btnToggleTheme')?.addEventListener('click', () => {
    const nextTheme = appState.theme === 'oled_dark' ? 'positivus' : 'oled_dark';
    commitState({ ...appState, theme: nextTheme }, { pushCloud: true, recordHistory: false });
    showToast(
      nextTheme === 'oled_dark'
        ? '🌙 Đã bật chế độ OLED Dark — Tôn tối đa hiệu ứng phát sáng Neon!'
        : '☀️ Đã chuyển về chế độ sáng Positivus.'
    );
  });

  // Thanh lọc dự án (Đang chạy / Đã ghim / Lưu trữ)
  document.getElementById('projectFilterBar')?.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-filter]');
    if (!tabBtn) return;
    const filterView = tabBtn.dataset.filter;
    editingTarget = null;
    commitState({ ...appState, filterView }, { pushCloud: false, recordHistory: false });
  });

  // Nút xóa lịch sử Nhật ký giờ
  document.getElementById('btnClearTimerLogs')?.addEventListener('click', () => {
    if (!appState.timerLogs || appState.timerLogs.length === 0) return;
    commitState({ ...appState, timerLogs: [] });
    showToast('🗑 Đã xóa danh sách Nhật ký phiên tập trung.', { showUndo: true });
  });

  // Nút Hoàn tác trên thanh Top-bar
  document.getElementById('btnUndoAction')?.addEventListener('click', () => {
    undoLastAction();
  });

  // Phím tắt toàn cục Ctrl + Z / Cmd + Z để Hoàn tác nhanh
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select') {
        e.preventDefault();
        undoLastAction();
      }
    }
  });

  // Sự kiện nhấp đúp (Double Click) để Sửa tại chỗ (Inline Edit)
  projectsContainer?.addEventListener('dblclick', (e) => {
    const editTrigger = e.target.closest('[data-dblclick-edit]');
    if (!editTrigger) return;
    e.stopPropagation();

    const editType = editTrigger.dataset.dblclickEdit;
    const projectId = editTrigger.dataset.projectId;
    const subId = editTrigger.dataset.subId;

    if (editType === 'project') {
      editingTarget = { type: 'project', projectId };
      renderDashboard(appState);
    } else if (editType === 'subtask') {
      editingTarget = { type: 'subtask', projectId, subId };
      renderDashboard(appState);
    }
  });

  // Ủy quyền sự kiện Click trên danh sách dự án
  projectsContainer?.addEventListener('click', (e) => {
    // Nếu bấm vào link tài liệu trong ghi chú nhanh thì mở link bình thường, không đóng mở accordion
    if (e.target.closest('.sub-bar__note-link')) {
      e.stopPropagation();
      return;
    }

    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;
    const projectId = actionBtn.dataset.projectId;
    const subId = actionBtn.dataset.subId;

    if (action === 'toggle-accordion') {
      toggleAccordion(projectId);
      return;
    }

    // Ngăn sự kiện nổi bọt lên thanh Master-bar khi bấm nút bên trong
    e.stopPropagation();

    if (action === 'quick-add') {
      const delta = Number(actionBtn.dataset.delta);
      const nowMs = Date.now();
      const targetProj = appState.projects.find((p) => p.id === projectId);
      const targetSub = targetProj?.subTasks.find((s) => s.id === subId);
      const oldPct = targetSub?.progressPercent || 0;

      const nextProjects = appState.projects.map((p) =>
        p.id === projectId ? applyQuickAction(p, subId, delta, nowMs) : p
      );

      // Nếu là thao tác tăng tiến độ thực sự -> ghi nhận vào Chuỗi giữ lửa & Heatmap
      let nextActivityLog = appState.activityLog;
      if (delta > 0 && oldPct < 100) {
        const est = Number(targetSub?.estimatedMinutes) || 60;
        const actualDelta = Math.min(100, oldPct + delta) - oldPct;
        const eqMinutes = Math.max(2, Math.round((actualDelta / 100) * est));
        nextActivityLog = recordDailyActivity(appState.activityLog, eqMinutes, nowMs);
      }

      commitState({
        ...appState,
        activityLog: nextActivityLog,
        projects: nextProjects
      });
      const signText = delta > 0 ? `+${delta}%` : `${delta}%`;
      showToast(`✨ Đã cập nhật ${signText} tiến độ!`, { showUndo: true });
    } else if (action === 'start-edit-project') {
      editingTarget = { type: 'project', projectId };
      renderDashboard(appState);
    } else if (action === 'start-edit-subtask') {
      editingTarget = { type: 'subtask', projectId, subId };
      renderDashboard(appState);
    } else if (action === 'cancel-inline-edit') {
      editingTarget = null;
      renderDashboard(appState);
    } else if (action === 'toggle-pin') {
      const res = togglePinProject(appState.projects, projectId, 3);
      if (!res.success && res.reason === 'MAX_PINNED_REACHED') {
        showToast('⚠ Chỉ được ghim tối đa 3 dự án trọng tâm lên đầu trang!');
        return;
      }
      commitState({ ...appState, projects: res.projects });
      showToast(
        res.pinnedState
          ? '📌 Đã ghim dự án lên đầu trang!'
          : '📌 Đã bỏ ghim dự án.',
        { showUndo: true }
      );
    } else if (action === 'toggle-archive') {
      const target = appState.projects.find((p) => p.id === projectId);
      if (!target) return;
      const nextProjects = appState.projects.map((p) =>
        p.id === projectId ? toggleArchiveProject(p) : p
      );
      commitState({ ...appState, projects: nextProjects });
      showToast(
        !target.archived
          ? '📦 Đã cất dự án vào ngăn Lưu trữ (Archive)!'
          : '📤 Đã khôi phục dự án về danh sách Đang chạy!',
        { showUndo: true }
      );
    } else if (action === 'clone-project') {
      const target = appState.projects.find((p) => p.id === projectId);
      if (!target) return;
      const cloned = cloneProjectTemplate(target, Date.now());
      const idx = appState.projects.findIndex((p) => p.id === projectId);
      const nextProjects = [...appState.projects];
      nextProjects.splice(idx + 1, 0, cloned);
      commitState({
        ...appState,
        expandedProjectId: cloned.id,
        projects: nextProjects
      });
      showToast(`📋 Đã nhân bản mẫu "${cloned.title}"!`, { showUndo: true });
    } else if (action === 'move-project') {
      const dir = Number(actionBtn.dataset.dir) || 0;
      const idx = appState.projects.findIndex((p) => p.id === projectId);
      const targetIdx = idx + dir;
      if (idx < 0 || targetIdx < 0 || targetIdx >= appState.projects.length) return;
      const nextProjects = reorderArray(appState.projects, idx, targetIdx);
      commitState({ ...appState, projects: nextProjects });
      showToast('↕ Đã cập nhật thứ tự ưu tiên dự án.', { showUndo: true });
    } else if (action === 'move-subtask') {
      const subIdx = Number(actionBtn.dataset.subIndex);
      const dir = Number(actionBtn.dataset.dir) || 0;
      const targetIdx = subIdx + dir;
      const nextProjects = appState.projects.map((p) =>
        p.id === projectId ? reorderSubTasks(p, subIdx, targetIdx) : p
      );
      commitState({ ...appState, projects: nextProjects });
    } else if (action === 'focus-subtask') {
      const selectEl = document.getElementById('timerSubTaskSelect');
      if (selectEl) {
        selectEl.value = `${projectId}::${subId}`;
        selectEl.focus();
      }
      showToast('⏱ Đã nạp đầu việc vào trạm Focus Timer!');
    } else if (action === 'delete-subtask') {
      const nextProjects = appState.projects.map((p) => {
        if (p.id !== projectId) return p;
        return createProject({
          ...p,
          subTasks: p.subTasks.filter((s) => s.id !== subId),
          updatedAt: Date.now()
        });
      });
      commitState({ ...appState, projects: nextProjects });
      showToast('🗑 Đã xóa đầu việc nhỏ.', { showUndo: true });
    } else if (action === 'delete-project') {
      const nextProjects = appState.projects.filter((p) => p.id !== projectId);
      commitState({
        ...appState,
        expandedProjectId: nextProjects[0]?.id || null,
        projects: nextProjects
      });
      showToast('🗑 Đã xóa thanh dự án.', { showUndo: true });
    } else if (action === 'open-levelup') {
      const modal = document.getElementById('modalLevelUp');
      const hiddenId = document.getElementById('levelUpProjectId');
      if (hiddenId) hiddenId.value = projectId;
      modal?.showModal?.();
    }
  });

  // Sự kiện Kéo thả (HTML5 Drag & Drop) cho Master-bar và Sub-bar
  projectsContainer?.addEventListener('dragstart', (e) => {
    const subBarEl = e.target.closest('.sub-bar[draggable="true"]');
    if (subBarEl) {
      e.stopPropagation();
      dragContext = {
        type: 'subtask',
        projectId: subBarEl.dataset.projectId,
        subIndex: Number(subBarEl.dataset.subIndex)
      };
      subBarEl.classList.add('is-dragging');
      return;
    }

    const masterCardEl = e.target.closest('.master-card[draggable="true"]');
    if (masterCardEl) {
      dragContext = {
        type: 'project',
        projectId: masterCardEl.dataset.projectCard
      };
      masterCardEl.classList.add('is-dragging');
    }
  });

  projectsContainer?.addEventListener('dragover', (e) => {
    if (!dragContext) return;
    e.preventDefault();
    if (dragContext.type === 'subtask') {
      const overSub = e.target.closest('.sub-bar[draggable="true"]');
      if (overSub && overSub.dataset.projectId === dragContext.projectId) {
        overSub.classList.add('drag-over-target');
      }
    } else if (dragContext.type === 'project') {
      const overCard = e.target.closest('.master-card[draggable="true"]');
      if (overCard && overCard.dataset.projectCard !== dragContext.projectId) {
        overCard.classList.add('drag-over-target');
      }
    }
  });

  projectsContainer?.addEventListener('dragleave', (e) => {
    const target = e.target.closest('.drag-over-target');
    target?.classList.remove('drag-over-target');
  });

  projectsContainer?.addEventListener('dragend', () => {
    dragContext = null;
    projectsContainer.querySelectorAll('.is-dragging, .drag-over-target').forEach((el) => {
      el.classList.remove('is-dragging', 'drag-over-target');
    });
  });

  projectsContainer?.addEventListener('drop', (e) => {
    if (!dragContext) return;
    e.preventDefault();

    if (dragContext.type === 'subtask') {
      const dropSub = e.target.closest('.sub-bar[draggable="true"]');
      if (dropSub && dropSub.dataset.projectId === dragContext.projectId) {
        const fromIdx = dragContext.subIndex;
        const toIdx = Number(dropSub.dataset.subIndex);
        if (fromIdx !== toIdx) {
          const nextProjects = appState.projects.map((p) =>
            p.id === dragContext.projectId ? reorderSubTasks(p, fromIdx, toIdx) : p
          );
          dragContext = null;
          commitState({ ...appState, projects: nextProjects });
          showToast('↕ Đã sắp xếp lại thứ tự đầu việc nhỏ!', { showUndo: true });
          return;
        }
      }
    } else if (dragContext.type === 'project') {
      const dropCard = e.target.closest('.master-card[draggable="true"]');
      if (dropCard && dropCard.dataset.projectCard !== dragContext.projectId) {
        const fromIdx = appState.projects.findIndex((p) => p.id === dragContext.projectId);
        const toIdx = appState.projects.findIndex((p) => p.id === dropCard.dataset.projectCard);
        if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
          const nextProjects = reorderArray(appState.projects, fromIdx, toIdx);
          dragContext = null;
          commitState({ ...appState, projects: nextProjects });
          showToast('↕ Đã sắp xếp lại thứ tự thanh dự án!', { showUndo: true });
          return;
        }
      }
    }
    dragContext = null;
  });

  // Hỗ trợ nhấn phím Enter / Space trên thanh Master-bar cho Accessibility
  projectsContainer?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'select' || activeTag === 'textarea' || activeTag === 'button') {
        return;
      }
      const bar = e.target.closest('[data-action="toggle-accordion"]');
      if (bar) {
        e.preventDefault();
        toggleAccordion(bar.dataset.projectId);
      }
    }
  });

  // Xử lý Submit các Form bên trong danh sách dự án (Thêm Sub-bar, Sửa tại chỗ Project, Sửa tại chỗ Sub-bar)
  projectsContainer?.addEventListener('submit', (e) => {
    // 1. Form Sửa tại chỗ Dự Án (Master-bar Inline Edit)
    const editProjForm = e.target.closest('[data-form="inline-edit-project"]');
    if (editProjForm) {
      e.preventDefault();
      const projectId = editProjForm.dataset.projectId;
      const fd = new FormData(editProjForm);
      const title = String(fd.get('editProjTitle') || '').trim();
      const mode = String(fd.get('editProjMode') || 'fixed');
      const targetHours = Number(fd.get('editProjHours')) || 10;

      editingTarget = null;
      const nextProjects = appState.projects.map((p) =>
        p.id === projectId ? updateProjectDetails(p, { title, mode, targetHours }) : p
      );
      commitState({ ...appState, projects: nextProjects });
      showToast('✏️ Đã cập nhật thông tin dự án!', { showUndo: true });
      return;
    }

    // 2. Form Sửa tại chỗ Đầu việc nhỏ (Sub-bar Inline Edit)
    const editSubForm = e.target.closest('[data-form="inline-edit-subtask"]');
    if (editSubForm) {
      e.preventDefault();
      const projectId = editSubForm.dataset.projectId;
      const subId = editSubForm.dataset.subId;
      const fd = new FormData(editSubForm);
      const title = String(fd.get('editSubTitle') || '').trim();
      const weight = Number(fd.get('editSubWeight')) || 1;
      const estimatedMinutes = Number(fd.get('editSubEstimated')) || 60;
      const note = String(fd.get('editSubNote') || '').trim();

      editingTarget = null;
      const nextProjects = appState.projects.map((p) =>
        p.id === projectId
          ? updateSubTaskDetails(p, subId, { title, weight, estimatedMinutes, note })
          : p
      );
      commitState({ ...appState, projects: nextProjects });
      showToast('✏️ Đã lưu thay đổi đầu việc & ghi chú!', { showUndo: true });
      return;
    }

    // 3. Form Thêm đầu việc nhỏ mới (Sub-bar)
    const addSubForm = e.target.closest('[data-form="add-subtask"]');
    if (!addSubForm) return;
    e.preventDefault();

    const projectId = addSubForm.dataset.projectId;
    const formData = new FormData(addSubForm);
    const title = String(formData.get('subTitle') || '').trim();
    const weight = Number(formData.get('subWeight')) || 1;
    const estimatedMinutes = Number(formData.get('subEstimated')) || 60;
    const note = String(formData.get('subNote') || '').trim();

    if (!title) return;

    const newSub = createSubTask({
      title,
      weight,
      estimatedMinutes,
      note,
      progressPercent: 0,
      spentMinutes: 0
    });

    const nextProjects = appState.projects.map((p) => {
      if (p.id !== projectId) return p;
      return createProject({
        ...p,
        subTasks: [...p.subTasks, newSub],
        updatedAt: Date.now()
      });
    });

    commitState({ ...appState, projects: nextProjects });
    addSubForm.reset();
    showToast(`➕ Đã thêm đầu việc "${newSub.title}"`, { showUndo: true });
  });

  // Điều khiển đóng các Modal
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById(btn.dataset.closeModal);
      modal?.close?.();
    });
  });

  // Mở Modal Tạo Dự Án Mới
  document.getElementById('btnOpenNewProjectModal')?.addEventListener('click', () => {
    document.getElementById('modalNewProject')?.showModal?.();
  });

  // Chọn nhanh màu Swatch trong Modal Tạo Dự Án
  document.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      const colorInput = document.getElementById('inputProjectColor');
      if (colorInput && swatch.dataset.color) {
        colorInput.value = swatch.dataset.color;
      }
    });
  });

  // Submit Tạo Dự Án Mới
  document.getElementById('formNewProject')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('inputProjectTitle')?.value;
    const mode = document.getElementById('inputProjectMode')?.value;
    const targetHours = Number(document.getElementById('inputProjectTargetHours')?.value) || 10;
    const themeColor = document.getElementById('inputProjectColor')?.value || '#2563eb';

    const newProj = createProject({
      title,
      mode,
      targetHours,
      themeColor,
      subTasks: []
    });

    commitState({
      ...appState,
      filterView: 'active',
      expandedProjectId: newProj.id,
      projects: [newProj, ...appState.projects]
    });

    document.getElementById('formNewProject')?.reset();
    document.getElementById('modalNewProject')?.close?.();
    showToast(`🚀 Đã tạo thanh dự án "${newProj.title}"`);
  });

  // Submit Level Up Dự Án (F07)
  document.getElementById('formLevelUp')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const projectId = document.getElementById('levelUpProjectId')?.value;
    const selectedRadio = document.querySelector('input[name="levelUpAction"]:checked');
    const action = selectedRadio ? selectedRadio.value : 'add_hours';
    const extraHours = Number(document.getElementById('inputLevelUpExtraHours')?.value) || 5;

    const nextProjects = appState.projects.map((p) =>
      p.id === projectId ? levelUpProject(p, { action, extraHours }) : p
    );

    commitState({ ...appState, projects: nextProjects });
    document.getElementById('modalLevelUp')?.close?.();
    showToast(
      action === 'switch_fixed'
        ? '⚖️ Đã chuyển dự án sang Chế độ Lộ trình cố định để chốt giai đoạn cuối!'
        : `🚀 Level Up thành công! Đã mở rộng thêm +${extraHours} giờ mục tiêu.`,
      { showUndo: true }
    );
  });

  // Các nút Preset thời lượng Focus Timer (15p / 25p / 45p / 60p)
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('preset-btn--active'));
      btn.classList.add('preset-btn--active');
      const mins = Number(btn.dataset.minutes) || 25;
      const customInput = document.getElementById('timerCustomMinutes');
      if (customInput) customInput.value = `${mins}`;
      if (!appState.activeTimer) {
        renderTimerDisplay();
      }
    });
  });

  // Nút Bắt đầu / Tạm dừng / Tiếp tục Focus Timer (F08)
  document.getElementById('btnTimerStartPause')?.addEventListener('click', () => {
    const current = appState.activeTimer;
    if (!current) {
      const selectEl = document.getElementById('timerSubTaskSelect');
      if (!selectEl?.value) {
        showToast('⚠ Hãy chọn một đầu việc (Sub-bar) trước khi bấm giờ!');
        return;
      }
      const [projectId, subTaskId] = selectEl.value.split('::');
      const durationMinutes = Number(document.getElementById('timerCustomMinutes')?.value) || 25;
      const timerState = createTimerState({
        projectId,
        subTaskId,
        durationMinutes,
        nowMs: Date.now()
      });
      commitState({ ...appState, activeTimer: timerState }, { recordHistory: false });
      showToast(`▶ Bắt đầu phiên tập trung ${durationMinutes} phút!`);
    } else if (current.status === 'running') {
      const paused = pauseTimer(current, Date.now());
      commitState({ ...appState, activeTimer: paused }, { recordHistory: false });
      showToast('⏸ Đã tạm dừng đồng hồ tập trung.');
    } else {
      const resumed = resumeTimer(current, Date.now());
      commitState({ ...appState, activeTimer: resumed }, { recordHistory: false });
      showToast('▶ Tiếp tục phiên tập trung!');
    }
  });

  // Nút Hoàn tất phiên ngay & Nhích thanh bar (F09)
  document.getElementById('btnTimerCompleteNow')?.addEventListener('click', () => {
    completeActiveTimerSession();
  });

  // Nút Tua nhanh +5 phút (Test nhanh hiệu ứng nhích thanh bar)
  document.getElementById('btnTimerFastForward')?.addEventListener('click', () => {
    completeActiveTimerSession(5);
  });

  // Nút Hủy phiên đếm giờ
  document.getElementById('btnTimerReset')?.addEventListener('click', () => {
    if (!appState.activeTimer) return;
    commitState({ ...appState, activeTimer: null }, { recordHistory: false });
    showToast('✕ Đã hủy phiên đếm giờ hiện tại.');
  });

  // Modal Đồng bộ đám mây Firebase Firestore (F11)
  document.getElementById('btnOpenCloudModal')?.addEventListener('click', () => {
    const saved = loadCloudConfig();
    if (saved) {
      const syncKeyEl = document.getElementById('inputSyncKey');
      const projIdEl = document.getElementById('inputFirebaseProjectId');
      const apiKeyEl = document.getElementById('inputFirebaseApiKey');
      const appIdEl = document.getElementById('inputFirebaseAppId');
      if (syncKeyEl) syncKeyEl.value = saved.syncKey || '';
      if (projIdEl) projIdEl.value = saved.projectId || '';
      if (apiKeyEl) apiKeyEl.value = saved.apiKey || '';
      if (appIdEl) appIdEl.value = saved.appId || '';
    }
    document.getElementById('modalCloudSync')?.showModal?.();
  });

  document.getElementById('formCloudSync')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const syncKey = document.getElementById('inputSyncKey')?.value.trim() || '';
    const projectId = document.getElementById('inputFirebaseProjectId')?.value.trim() || '';
    const apiKey = document.getElementById('inputFirebaseApiKey')?.value.trim() || '';
    const appId = document.getElementById('inputFirebaseAppId')?.value.trim() || '';

    const cfg = { syncKey, projectId, apiKey, appId };
    saveCloudConfig(cfg);
    document.getElementById('modalCloudSync')?.close?.();
    await connectCloudIfConfigured(cfg);
  });

  document.getElementById('btnDisconnectCloud')?.addEventListener('click', () => {
    cloudController.disconnect();
    saveCloudConfig(null);
    updateSyncStatusUI({ state: 'offline', message: 'Offline · LocalStorage' });
    document.getElementById('modalCloudSync')?.close?.();
    showToast('Đã chuyển sang chế độ lưu trữ cục bộ Offline.');
  });

  // Xuất file JSON sao lưu
  document.getElementById('btnExportJson')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glowbar_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('⬇ Đã xuất file JSON sao lưu!');
  });

  // Nhập file JSON (Khôi phục dữ liệu 2 chiều)
  const fileInputEl = document.getElementById('inputImportJsonFile');
  document.getElementById('btnImportJson')?.addEventListener('click', () => {
    fileInputEl?.click();
  });

  fileInputEl?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.projects)) {
        showToast('⚠ File JSON không đúng định dạng sao lưu của GlowBar!');
        fileInputEl.value = '';
        return;
      }
      const normalized = normalizeAppState(parsed);
      commitState(normalized, { pushCloud: true, recordHistory: true });
      document.getElementById('modalCloudSync')?.close?.();
      showToast(`✅ Đã nhập thành công ${normalized.projects.length} dự án từ file JSON!`, { showUndo: true });
    } catch (err) {
      console.error('[Import JSON] Lỗi đọc file:', err);
      showToast('⚠ Không thể đọc file JSON. Vui lòng kiểm tra lại file!');
    } finally {
      fileInputEl.value = '';
    }
  });

  // Khôi phục dữ liệu mẫu
  document.getElementById('btnResetDemoData')?.addEventListener('click', () => {
    const seed = createDefaultSeedState();
    commitState(seed);
    document.getElementById('modalCloudSync')?.close?.();
    showToast('↺ Đã khôi phục dữ liệu mẫu ban đầu.', { showUndo: true });
  });
}

function updateSyncStatusUI({ state, message }) {
  const dot = document.getElementById('syncStatusDot');
  const txt = document.getElementById('syncStatusText');
  if (dot) dot.dataset.state = state;
  if (txt) txt.textContent = message;
}

async function connectCloudIfConfigured(cfg = loadCloudConfig()) {
  if (!cfg || !cfg.apiKey || !cfg.projectId || !cfg.syncKey) {
    updateSyncStatusUI({ state: 'offline', message: 'Offline · LocalStorage' });
    return;
  }

  cloudController.disconnect();
  cloudController = await initCloudSync(
    {
      apiKey: cfg.apiKey,
      projectId: cfg.projectId,
      appId: cfg.appId
    },
    cfg.syncKey,
    (remoteState) => {
      const merged = mergeRemoteState(appState, remoteState);
      appState = saveLocalState(merged);
      applyThemeUI(appState.theme);
      renderDashboard(appState);
      showToast('☁️ Đã đồng bộ dữ liệu thời gian thực từ đám mây!');
    },
    (status) => updateSyncStatusUI(status)
  );

  await cloudController.pushState(appState);
}

/**
 * Khởi tạo ứng dụng và đăng ký Service Worker PWA (M09, F12)
 */
export function initApp() {
  applyThemeUI(appState.theme);
  renderDashboard(appState);
  bindEvents();
  connectCloudIfConfigured();

  if (timerTickInterval) clearInterval(timerTickInterval);
  timerTickInterval = setInterval(() => {
    if (appState.activeTimer && appState.activeTimer.status === 'running') {
      renderTimerDisplay();
    }
  }, 1000);

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
