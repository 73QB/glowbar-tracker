/**
 * M09 — Điều phối DOM, sự kiện Accordion, Timer UI, Modal Level Up & Đồng bộ đám mây
 * Phục vụ: F01–F12, AC01–AC09, R101, R104
 */

import { createProject, createSubTask } from '../core/models.js';
import {
  calculateMasterProgress,
  applyQuickAction,
  applyTimerMinutes,
  levelUpProject
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
  createDefaultSeedState
} from '../services/sync.js';

let appState = loadLocalState();
let cloudController = {
  pushState: async () => false,
  disconnect: () => {}
};
let timerTickInterval = null;

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
 * Cập nhật 4 thẻ thống kê tổng quan KPI trên đầu trang
 * @param {Object} state
 */
function renderKpiSummary(state) {
  const projects = Array.isArray(state.projects) ? state.projects : [];
  let sumPercent = 0;
  let completedSub = 0;
  let totalSub = 0;
  let totalSpentMinutes = 0;

  for (const proj of projects) {
    const calc = calculateMasterProgress(proj);
    sumPercent += calc.percent;
    completedSub += calc.completedSubTasks;
    totalSub += calc.totalSubTasks;
    totalSpentMinutes += calc.spentMinutes;
  }

  const avgPercent = projects.length > 0
    ? Math.round((sumPercent / projects.length) * 10) / 10
    : 0;
  const totalHours = Math.round((totalSpentMinutes / 60) * 10) / 10;

  const elProjects = document.getElementById('kpiTotalProjects');
  const elAvg = document.getElementById('kpiAvgProgress');
  const elSub = document.getElementById('kpiCompletedSubTasks');
  const elHours = document.getElementById('kpiTotalHours');

  if (elProjects) elProjects.textContent = `${projects.length}`;
  if (elAvg) elAvg.textContent = `${avgPercent.toFixed(1)}%`;
  if (elSub) elSub.textContent = `${completedSub} / ${totalSub}`;
  if (elHours) elHours.textContent = `${totalHours.toFixed(1)}h`;
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

  for (const proj of state.projects || []) {
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
 * Render toàn bộ danh sách Master-bar và Sub-bar (F01, F02, F03, F05, F06, F07, F10)
 * @param {Object} state
 */
export function renderDashboard(state = appState) {
  renderKpiSummary(state);
  renderTimerSubTaskOptions(state);

  const container = document.getElementById('projectsContainer');
  if (!container) return;

  const projects = Array.isArray(state.projects) ? state.projects : [];
  if (projects.length === 0) {
    container.innerHTML = `
      <div class="kpi-card" style="text-align:center; padding:32px;">
        <p style="color:var(--text-secondary); margin-bottom:12px;">Chưa có thanh dự án nào. Hãy khởi tạo thanh năng lượng đầu tiên của bạn!</p>
      </div>
    `;
    return;
  }

  const activeTimerSubId = state.activeTimer?.subTaskId || null;

  container.innerHTML = projects
    .map((proj) => {
      const calc = calculateMasterProgress(proj);
      // Đảm bảo màu thanh bar luôn tương phản cao với nền thẻ (đặc biệt khi mở rộng nền Lime #b9ff66)
      const effectiveColor = (!proj.themeColor || proj.themeColor.toLowerCase() === '#b9ff66')
        ? (proj.mode === 'time_pool' ? '#7c3aed' : '#2563eb')
        : proj.themeColor;
      const glow = computeGlowStyle(calc.percent, effectiveColor);
      const isExpanded = state.expandedProjectId === proj.id;

      const cssVarInline = Object.entries(glow.cssVars)
        .map(([k, v]) => `${k}:${escapeHtml(v)}`)
        .join(';');

      const modeBadge = proj.mode === 'time_pool'
        ? `<span class="badge badge--mode-pool">⏳ Quỹ thời gian (${escapeHtml(proj.targetHours)}h)</span>`
        : `<span class="badge badge--mode-fixed">⚖️ Lộ trình cố định</span>`;

      const spentHours = Math.round((calc.spentMinutes / 60) * 10) / 10;
      const targetHours = Math.round((calc.targetMinutes / 60) * 10) / 10;

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
        .map((sub) => {
          const isDone = Number(sub.progressPercent) >= 100;
          const isTimerActive = activeTimerSubId === sub.id;
          return `
            <div class="sub-bar ${isDone ? 'sub-bar--done' : ''} ${isTimerActive ? 'sub-bar--active-timer' : ''}" data-subtask-id="${escapeHtml(sub.id)}">
              <div class="sub-bar__header">
                <div class="sub-bar__title-wrap">
                  <span class="sub-bar__title">${escapeHtml(sub.title)}</span>
                  <span class="sub-bar__meta-tag">Trọng số: ×${escapeHtml(sub.weight)}</span>
                  <span class="sub-bar__meta-tag">${escapeHtml(sub.spentMinutes)}/${escapeHtml(sub.estimatedMinutes)} phút</span>
                </div>
                <span class="sub-bar__percent">${escapeHtml(sub.progressPercent.toFixed(1))}%</span>
              </div>

              <div class="sub-bar__track">
                <div class="sub-bar__fill" style="width: ${escapeHtml(sub.progressPercent)}%"></div>
              </div>

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
          class="master-card ${isExpanded ? 'master-card--expanded' : ''} master-card--milestone-${glow.milestoneTier}"
          style="${cssVarInline}"
          data-project-card="${escapeHtml(proj.id)}"
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
                  <h3 class="master-bar__title">${escapeHtml(proj.title)}</h3>
                </div>
                <div class="master-bar__badges">
                  ${modeBadge}
                  <span class="badge badge--level">Lv.${escapeHtml(proj.level)}</span>
                  <span class="badge badge--milestone">Mốc sáng: ${glow.milestoneTier}%</span>
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

          ${levelUpBannerHtml}

          <div class="accordion-drawer">
            <div class="accordion-drawer__inner">
              <div class="subbars-container">
                ${subBarsHtml || '<p style="color:var(--text-muted); font-size:0.84rem;">Chưa có đầu việc nhỏ nào. Hãy thêm đầu việc bên dưới.</p>'}

                <form class="add-subtask-form" data-form="add-subtask" data-project-id="${escapeHtml(proj.id)}">
                  <input type="text" name="subTitle" class="form-input" placeholder="Thêm đầu việc nhỏ mới (Sub-bar)..." required />
                  <input type="number" name="subWeight" class="form-input" min="0.5" max="100" step="0.5" value="1" title="Trọng số (Weight)" placeholder="Trọng số" />
                  <input type="number" name="subEstimated" class="form-input" min="5" max="2000" step="5" value="60" title="Số phút dự kiến" placeholder="Phút dự kiến" />
                  <button type="submit" class="btn btn--primary">+ Thêm Việc</button>
                </form>

                <div class="master-card-footer">
                  <button type="button" class="btn btn--danger-ghost" data-action="delete-project" data-project-id="${escapeHtml(proj.id)}">
                    🗑 Xóa Dự Án Này
                  </button>
                </div>
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
 * Hoàn thành phiên Focus Timer và tự động cộng phút vào thanh Sub-bar & Master-bar (F09, AC04)
 * @param {number} [overrideMinutes]
 */
function completeActiveTimerSession(overrideMinutes) {
  const timer = appState.activeTimer;
  const selectEl = document.getElementById('timerSubTaskSelect');
  const customInput = document.getElementById('timerCustomMinutes');

  let targetProjectId = timer?.projectId;
  let targetSubTaskId = timer?.subTaskId;
  let minutesToCredit = Number(overrideMinutes ?? timer?.durationMinutes ?? customInput?.value ?? 25);

  if ((!targetProjectId || !targetSubTaskId) && selectEl?.value) {
    const [pId, sId] = selectEl.value.split('::');
    targetProjectId = pId;
    targetSubTaskId = sId;
  }

  if (!targetProjectId || !targetSubTaskId) {
    showToast('⚠ Vui lòng chọn một đầu việc (Sub-bar) trước!');
    return;
  }

  const nextProjects = appState.projects.map((proj) => {
    if (proj.id !== targetProjectId) return proj;
    return applyTimerMinutes(proj, targetSubTaskId, minutesToCredit);
  });

  commitState({
    ...appState,
    expandedProjectId: targetProjectId,
    activeTimer: null,
    projects: nextProjects
  });

  showToast(`⚡ Đã cộng +${minutesToCredit} phút tập trung! Thanh năng lượng vừa nhích lên và sáng thêm.`, { showUndo: true });
}

/**
 * Gắn toàn bộ sự kiện tương tác trên giao diện
 */
function bindEvents() {
  const projectsContainer = document.getElementById('projectsContainer');

  // Nút Hoàn tác trên thanh Top-bar
  document.getElementById('btnUndoAction')?.addEventListener('click', () => {
    undoLastAction();
  });

  // Phím tắt toàn cục Ctrl + Z / Cmd + Z để Hoàn tác nhanh
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag !== 'input' && activeTag !== 'textarea') {
        e.preventDefault();
        undoLastAction();
      }
    }
  });

  // Ủy quyền sự kiện (Event Delegation) trên danh sách dự án
  projectsContainer?.addEventListener('click', (e) => {
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
      const nextProjects = appState.projects.map((p) =>
        p.id === projectId ? applyQuickAction(p, subId, delta) : p
      );
      commitState({ ...appState, projects: nextProjects });
      const signText = delta > 0 ? `+${delta}%` : `${delta}%`;
      showToast(`✨ Đã cập nhật ${signText} tiến độ!`, { showUndo: true });
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

  // Hỗ trợ nhấn phím Enter / Space trên thanh Master-bar cho Accessibility
  projectsContainer?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const bar = e.target.closest('[data-action="toggle-accordion"]');
      if (bar) {
        e.preventDefault();
        toggleAccordion(bar.dataset.projectId);
      }
    }
  });

  // Thêm đầu việc nhỏ mới (Sub-bar) trong Accordion
  projectsContainer?.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-form="add-subtask"]');
    if (!form) return;
    e.preventDefault();

    const projectId = form.dataset.projectId;
    const formData = new FormData(form);
    const title = String(formData.get('subTitle') || '').trim();
    const weight = Number(formData.get('subWeight')) || 1;
    const estimatedMinutes = Number(formData.get('subEstimated')) || 60;

    if (!title) return;

    const newSub = createSubTask({
      title,
      weight,
      estimatedMinutes,
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
    form.reset();
    showToast(`➕ Đã thêm đầu việc "${newSub.title}"`);
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
      commitState({ ...appState, activeTimer: timerState });
      showToast(`▶ Bắt đầu phiên tập trung ${durationMinutes} phút!`);
    } else if (current.status === 'running') {
      const paused = pauseTimer(current, Date.now());
      commitState({ ...appState, activeTimer: paused });
      showToast('⏸ Đã tạm dừng đồng hồ tập trung.');
    } else {
      const resumed = resumeTimer(current, Date.now());
      commitState({ ...appState, activeTimer: resumed });
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
    commitState({ ...appState, activeTimer: null });
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

  // Khôi phục dữ liệu mẫu
  document.getElementById('btnResetDemoData')?.addEventListener('click', () => {
    const seed = createDefaultSeedState();
    commitState(seed);
    document.getElementById('modalCloudSync')?.close?.();
    showToast('↺ Đã khôi phục dữ liệu mẫu ban đầu.');
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
  renderDashboard(appState);
  bindEvents();
  connectCloudIfConfigured();

  if (timerTickInterval) clearInterval(timerTickInterval);
  timerTickInterval = setInterval(() => {
    if (appState.activeTimer && appState.activeTimer.status === 'running') {
      renderTimerDisplay();
    }
  }, 1000);

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('[PWA] Không thể đăng ký Service Worker:', err);
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}

