/**
 * CLI Test Runner cho toàn bộ các bộ kiểm thử (Tương thích Node.js)
 */

import { runAllSuites } from './test-harness.js';
import './models.test.js';
import './calculator.test.js';
import './glow.test.js';
import './timer.test.js';
import './sync.test.js';
import './ui.test.js';

const report = await runAllSuites();

for (const item of report.details) {
  const icon = item.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${item.status}] ${item.suite} :: ${item.name}${item.error ? ' -> ' + item.error : ''}`);
}

console.log(`\n📊 Tổng kết: ${report.passed}/${report.total} PASS (${report.failed} FAIL)`);
if (typeof process !== 'undefined' && report.failed > 0) {
  process.exit(1);
}
