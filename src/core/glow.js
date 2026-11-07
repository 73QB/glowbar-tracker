/**
 * M06 — Động cơ tính thông số ánh sáng Dynamic Glow & Milestone
 * Phục vụ: F02, OUT02, AC06, D03, R101, R103
 */

import { clampAndRound, DEFAULT_THEME_COLOR } from './models.js';

/**
 * Xác định mốc đột biến ánh sáng (Milestone Tier) từ phần trăm tiến độ
 * @param {number} percent
 * @returns {0 | 25 | 50 | 75 | 100}
 */
export function resolveMilestoneTier(percent) {
  const p = clampAndRound(percent, 0, 100);
  if (p >= 100) return 100;
  if (p >= 75) return 75;
  if (p >= 50) return 50;
  if (p >= 25) return 25;
  return 0;
}

/**
 * Tính toán thông số hiệu ứng phát sáng động (Dynamic Glow) và biến CSS (F02, OUT02, AC06)
 * Đảm bảo blurPx, spreadPx và opacity tăng đơn điệu theo phần trăm hoàn thành.
 * @param {number} percent
 * @param {string} themeColor
 * @returns {{
 *   percent: number,
 *   blurPx: number,
 *   spreadPx: number,
 *   opacity: number,
 *   milestoneTier: 0|25|50|75|100,
 *   cssVars: Record<string, string>
 * }}
 */
export function computeGlowStyle(percent, themeColor = DEFAULT_THEME_COLOR) {
  const validPercent = clampAndRound(percent, 0, 100);
  const ratio = validPercent / 100;
  const milestoneTier = resolveMilestoneTier(validPercent);

  // Hệ số thưởng thêm độ rực sáng tại các cột mốc quan trọng (25%, 50%, 75%, 100%)
  const milestoneBoost = milestoneTier === 100
    ? 8
    : milestoneTier === 75
      ? 4
      : milestoneTier === 50
        ? 2
        : milestoneTier === 25
          ? 1
          : 0;

  // Khi 0%: không phát sáng (0px); khi > 0%: tăng tuyến tính + thưởng mốc
  const blurPx = validPercent === 0
    ? 0
    : Math.round((6 + ratio * 22 + milestoneBoost) * 10) / 10;

  const spreadPx = validPercent === 0
    ? 0
    : Math.round((1 + ratio * 7 + milestoneBoost * 0.4) * 10) / 10;

  const opacity = validPercent === 0
    ? 0.15
    : Math.round(Math.min(1, 0.28 + ratio * 0.62 + (milestoneTier === 100 ? 0.1 : 0)) * 100) / 100;

  const color = typeof themeColor === 'string' && themeColor.trim()
    ? themeColor.trim()
    : DEFAULT_THEME_COLOR;

  return {
    percent: validPercent,
    blurPx,
    spreadPx,
    opacity,
    milestoneTier,
    cssVars: {
      '--bar-percent': `${validPercent}%`,
      '--glow-blur': `${blurPx}px`,
      '--glow-spread': `${spreadPx}px`,
      '--glow-opacity': `${opacity}`,
      '--milestone-tier': `${milestoneTier}`,
      '--theme-color': color
    }
  };
}

