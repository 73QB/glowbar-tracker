/**
 * Universal Test Harness (Tương thích cả Trình duyệt ES Modules & Node.js)
 * Giúp chạy kiểm thử tự động Lớp 3 cho toàn bộ các AC01–AC09 và E01–E07.
 */

const suites = [];
let currentSuite = null;

export function describe(suiteName, fn) {
  const suite = { name: suiteName, tests: [] };
  suites.push(suite);
  const prevSuite = currentSuite;
  currentSuite = suite;
  fn();
  currentSuite = prevSuite;
}

export function it(testName, fn) {
  if (!currentSuite) {
    describe('Default Suite', () => {});
    currentSuite = suites[suites.length - 1];
  }
  currentSuite.tests.push({ name: testName, fn });
}

export const assert = {
  equal(actual, expected, msg = '') {
    if (actual !== expected) {
      throw new Error(`${msg ? msg + ' — ' : ''}Kỳ vọng: ${JSON.stringify(expected)}, Thực tế: ${JSON.stringify(actual)}`);
    }
  },
  ok(value, msg = '') {
    if (!value) {
      throw new Error(`${msg || 'Giá trị không thỏa mãn điều kiện truthy'} (Thực tế: ${JSON.stringify(value)})`);
    }
  },
  deepEqual(actual, expected, msg = '') {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
      throw new Error(`${msg ? msg + ' — ' : ''}Kỳ vọng: ${b}, Thực tế: ${a}`);
    }
  }
};

export async function runAllSuites() {
  const report = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  for (const suite of suites) {
    for (const testCase of suite.tests) {
      report.total += 1;
      try {
        await testCase.fn();
        report.passed += 1;
        report.details.push({
          suite: suite.name,
          name: testCase.name,
          status: 'PASS'
        });
      } catch (err) {
        report.failed += 1;
        report.details.push({
          suite: suite.name,
          name: testCase.name,
          status: 'FAIL',
          error: err?.message || String(err)
        });
      }
    }
  }

  return report;
}

