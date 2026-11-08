/**
 * M04 — Khởi tạo & chuẩn hóa cấu trúc dữ liệu Project / SubTask
 * Phục vụ: F01, IN01, IN02, E01, E02, R101, R102, R103
 */

export const VALID_MODES = Object.freeze(['fixed', 'time_pool']);
export const DEFAULT_TARGET_HOURS = 10;
export const MIN_TARGET_HOURS = 0.5;
export const DEFAULT_WEIGHT = 1;
export const DEFAULT_ESTIMATED_MINUTES = 60;
export const DEFAULT_THEME_COLOR = '#2563eb';
export const MAX_PINNED_PROJECTS = 3;

/**
 * Chuyển dấu thời gian (ms) sang khóa ngày chuẩn YYYY-MM-DD theo giờ địa phương
 * @param {number} [timestampMs]
 * @returns {string}
 */
export function formatDateKey(timestampMs = Date.now()) {
  const d = new Date(Number.isFinite(Number(timestampMs)) ? Number(timestampMs) : Date.now());
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Làm tròn đến 1 chữ số thập phân và kẹp trong khoảng [min, max] (R103)
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clampAndRound(value, min = 0, max = 100) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return min;
  }
  const clamped = Math.min(max, Math.max(min, num));
  return Math.round(clamped * 10) / 10;
}

/**
 * Sinh mã định danh ngắn duy nhất
 * @param {string} prefix
 * @returns {string}
 */
export function generateId(prefix = 'id') {
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${randomPart}`;
}

/**
 * Khởi tạo một đầu việc nhỏ (Sub-bar) chuẩn hóa (IN02, E01, R102, R103)
 * @param {Object} input
 * @returns {Object} SubTask
 */
export function createSubTask(input = {}) {
  const rawTitle = typeof input.title === 'string' ? input.title.trim() : '';
  const title = rawTitle.length > 0 ? rawTitle : 'Công việc mới';

  const rawWeight = Number(input.weight);
  const weight = Number.isFinite(rawWeight) && rawWeight > 0
    ? Math.round(rawWeight * 10) / 10
    : DEFAULT_WEIGHT;

  const rawEstimated = Number(input.estimatedMinutes);
  const estimatedMinutes = Number.isFinite(rawEstimated) && rawEstimated > 0
    ? Math.round(rawEstimated * 10) / 10
    : DEFAULT_ESTIMATED_MINUTES;

  const progressPercent = clampAndRound(input.progressPercent ?? 0, 0, 100);

  const rawSpent = Number(input.spentMinutes);
  const spentMinutes = Number.isFinite(rawSpent) && rawSpent >= 0
    ? Math.round(rawSpent * 10) / 10
    : 0;

  const note = typeof input.note === 'string' ? input.note.trim() : '';

  return {
    id: typeof input.id === 'string' && input.id.trim() ? input.id.trim() : generateId('sub'),
    title,
    weight,
    estimatedMinutes,
    progressPercent,
    spentMinutes,
    note
  };
}

/**
 * Khởi tạo một dự án lớn (Master-bar) chuẩn hóa (IN01, E02, R102, R103)
 * @param {Object} input
 * @returns {Object} Project
 */
export function createProject(input = {}) {
  const now = Date.now();
  const rawTitle = typeof input.title === 'string' ? input.title.trim() : '';
  const title = rawTitle.length > 0 ? rawTitle : 'Dự án mới';

  const mode = VALID_MODES.includes(input.mode) ? input.mode : 'fixed';

  const rawTargetHours = Number(input.targetHours);
  let targetHours = DEFAULT_TARGET_HOURS;
  if (input.targetHours !== undefined && input.targetHours !== null) {
    targetHours = Number.isFinite(rawTargetHours) && rawTargetHours >= MIN_TARGET_HOURS
      ? Math.round(rawTargetHours * 10) / 10
      : MIN_TARGET_HOURS;
  }

  const rawLevel = Number(input.level);
  const level = Number.isInteger(rawLevel) && rawLevel >= 1 ? rawLevel : 1;

  const themeColor = typeof input.themeColor === 'string' && input.themeColor.trim()
    ? input.themeColor.trim()
    : DEFAULT_THEME_COLOR;

  const pinned = Boolean(input.pinned);
  const archived = Boolean(input.archived);

  const subTasks = Array.isArray(input.subTasks)
    ? input.subTasks.map((st) => createSubTask(st))
    : [];

  const createdAt = Number.isFinite(Number(input.createdAt)) ? Number(input.createdAt) : now;
  const updatedAt = Number.isFinite(Number(input.updatedAt)) ? Number(input.updatedAt) : now;
  const lastProgressAt = Number.isFinite(Number(input.lastProgressAt))
    ? Number(input.lastProgressAt)
    : updatedAt;

  const progressHistory = Array.isArray(input.progressHistory)
    ? input.progressHistory
        .filter((h) => h && typeof h.date === 'string')
        .slice(-60)
        .map((h) => ({
          date: h.date,
          deltaMinutes: Math.max(0, Math.round((Number(h.deltaMinutes) || 0) * 10) / 10),
          deltaPercent: Math.max(0, Math.round((Number(h.deltaPercent) || 0) * 10) / 10)
        }))
    : [];

  return {
    id: typeof input.id === 'string' && input.id.trim() ? input.id.trim() : generateId('proj'),
    title,
    mode,
    targetHours,
    level,
    themeColor,
    pinned,
    archived,
    subTasks,
    createdAt,
    updatedAt,
    lastProgressAt,
    progressHistory
  };
}

/**
 * Kiểm tra tính hợp lệ của đối tượng Project (E01, E02, R103)
 * @param {Object} project
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateProject(project) {
  const errors = [];

  if (!project || typeof project !== 'object') {
    return { valid: false, errors: ['Dự án không phải là một object hợp lệ.'] };
  }

  if (typeof project.title !== 'string' || project.title.trim().length === 0) {
    errors.push('Tên dự án không được để trống.');
  }

  if (!VALID_MODES.includes(project.mode)) {
    errors.push(`Chế độ tính toán "${project.mode}" không hợp lệ (chỉ chấp nhận "fixed" hoặc "time_pool").`);
  }

  if (project.mode === 'time_pool') {
    const targetHours = Number(project.targetHours);
    if (!Number.isFinite(targetHours) || targetHours <= 0) {
      errors.push('E02: Quỹ thời gian mục tiêu (targetHours) phải lớn hơn 0.');
    }
  }

  if (!Array.isArray(project.subTasks)) {
    errors.push('Danh sách công việc con (subTasks) phải là một mảng.');
  } else {
    project.subTasks.forEach((sub, idx) => {
      const weight = Number(sub?.weight);
      if (!Number.isFinite(weight) || weight <= 0) {
        errors.push(`E01: Công việc tại vị trí ${idx} có trọng số (weight) không hợp lệ (phải > 0).`);
      }
      const pct = Number(sub?.progressPercent);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        errors.push(`R103: Công việc tại vị trí ${idx} có phần trăm ngoài khoảng [0, 100].`);
      }
      const spent = Number(sub?.spentMinutes);
      if (!Number.isFinite(spent) || spent < 0) {
        errors.push(`R103: Công việc tại vị trí ${idx} có số phút đã làm (spentMinutes) âm hoặc không hợp lệ.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

