/**
 * Kiểm thử M09 (`src/ui/app.js` — escapeHtml & DOM Integration)
 * Chứng minh: AC07, R104 (Chống XSS)
 */

import { describe, it, assert } from './test-harness.js';
import { escapeHtml } from '../src/ui/app.js';

describe('M09 · app.js — Bảo mật chống XSS & Chuẩn hóa hiển thị', () => {
  it('[R104, AC07] Hàm escapeHtml khử độc hoàn toàn các ký tự tấn công XSS (<script>, onerror, nháy kép)', () => {
    const malicious = '<img src=x onerror="alert(1)"><script>evil()</script>';
    const safe = escapeHtml(malicious);
    assert.ok(!safe.includes('<script>'), 'Không được chứa thẻ <script> thô');
    assert.ok(!safe.includes('<img'), 'Không được chứa thẻ <img> thô');
    assert.equal(
      safe,
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&lt;script&gt;evil()&lt;/script&gt;'
    );
  });
});

