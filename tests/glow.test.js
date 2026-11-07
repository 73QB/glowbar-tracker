/**
 * Kiểm thử M06 (`src/core/glow.js`)
 * Chứng minh: AC06, F02, OUT02
 */

import { describe, it, assert } from './test-harness.js';
import { computeGlowStyle } from '../src/core/glow.js';

describe('M06 · glow.js — Động cơ ánh sáng Dynamic Glow & Milestone', () => {
  it('[AC06, F02] Trả về đúng cấp độ Milestone (0, 25, 50, 75, 100) và tăng đơn điệu độ sáng', () => {
    const g0 = computeGlowStyle(0, '#00f0ff');
    const g25 = computeGlowStyle(25, '#00f0ff');
    const g50 = computeGlowStyle(50, '#00f0ff');
    const g75 = computeGlowStyle(75, '#00f0ff');
    const g100 = computeGlowStyle(100, '#00f0ff');

    assert.equal(g0.milestoneTier, 0);
    assert.equal(g25.milestoneTier, 25);
    assert.equal(g50.milestoneTier, 50);
    assert.equal(g75.milestoneTier, 75);
    assert.equal(g100.milestoneTier, 100);

    assert.ok(g0.blurPx < g25.blurPx && g25.blurPx < g50.blurPx && g50.blurPx < g75.blurPx && g75.blurPx < g100.blurPx, 'blurPx phải tăng đơn điệu theo phần trăm');
    assert.ok(g0.opacity < g50.opacity && g50.opacity < g100.opacity, 'opacity phải tăng đơn điệu');
    assert.equal(g100.cssVars['--bar-percent'], '100%');
  });
});

