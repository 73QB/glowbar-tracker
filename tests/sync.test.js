/**
 * Kiểm thử M08 (`src/services/sync.js`)
 * Chứng minh: AC08, C05, E07
 */

import { describe, it, assert } from './test-harness.js';
import {
  saveLocalState,
  loadLocalState,
  mergeRemoteState
} from '../src/services/sync.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  };
}

describe('M08 · sync.js — Lưu trữ Offline-first & Hợp nhất dữ liệu đám mây', () => {
  it('[AC08, C05] Lưu và đọc dữ liệu chuẩn xác từ bộ nhớ cục bộ (Offline-first)', () => {
    const mem = createMemoryStorage();
    const initial = loadLocalState(mem);
    assert.ok(initial.projects.length >= 2, 'Tự động khởi tạo dữ liệu mẫu khi bộ nhớ trống');

    initial.projects[0].title = 'Dự án Đã Cập Nhật Offline';
    saveLocalState(initial, mem);

    const reloaded = loadLocalState(mem);
    assert.equal(reloaded.projects[0].title, 'Dự án Đã Cập Nhật Offline');
  });

  it('[AC08, E07] Hợp nhất xung đột giữa Local và Remote theo mốc thời gian updatedAt mới nhất', () => {
    const localState = {
      updatedAt: 1000,
      projects: [
        { id: 'p1', title: 'Bản cũ trên máy', mode: 'fixed', updatedAt: 1000, subTasks: [] },
        { id: 'p2', title: 'Bản mới hơn trên máy', mode: 'fixed', updatedAt: 5000, subTasks: [] }
      ]
    };

    const remoteState = {
      updatedAt: 3000,
      projects: [
        { id: 'p1', title: 'Bản mới từ Điện thoại', mode: 'fixed', updatedAt: 3000, subTasks: [] },
        { id: 'p2', title: 'Bản cũ trên Đám mây', mode: 'fixed', updatedAt: 2000, subTasks: [] }
      ]
    };

    const merged = mergeRemoteState(localState, remoteState);
    const p1 = merged.projects.find((p) => p.id === 'p1');
    const p2 = merged.projects.find((p) => p.id === 'p2');

    assert.equal(p1.title, 'Bản mới từ Điện thoại', 'p1 phải lấy bản mới hơn từ Remote (3000 > 1000)');
    assert.equal(p2.title, 'Bản mới hơn trên máy', 'p2 phải giữ bản mới hơn từ Local (5000 > 2000)');
  });

  it('[AC08, E07] Hợp nhất Union: Không làm mất dự án mới thêm trên PC khi Điện thoại mở web muộn hơn, đồng thời tôn trọng deletedProjectIds', () => {
    // Điện thoại mở muộn hơn nhưng danh sách cục bộ chỉ có p1 và p2 (p2 đã bị xóa trên PC)
    const phoneLocalState = {
      updatedAt: 9000,
      deletedProjectIds: [],
      projects: [
        { id: 'p1', title: 'Dự án Chung', mode: 'fixed', updatedAt: 2000, subTasks: [] },
        { id: 'p2', title: 'Dự án Đã Xóa Trên PC', mode: 'fixed', updatedAt: 2000, subTasks: [] }
      ]
    };

    // Đám mây (do PC đẩy lên lúc điện thoại tắt) có thêm dự án p3 mới và đã đánh dấu xóa p2
    const cloudRemoteState = {
      updatedAt: 6000,
      deletedProjectIds: ['p2'],
      projects: [
        { id: 'p1', title: 'Dự án Chung', mode: 'fixed', updatedAt: 2000, subTasks: [] },
        { id: 'p3', title: 'Khóa Luận Tốt Nghiệp (Tạo trên PC)', mode: 'time_pool', updatedAt: 6000, subTasks: [] }
      ]
    };

    const merged = mergeRemoteState(phoneLocalState, cloudRemoteState);
    const ids = merged.projects.map((p) => p.id);

    assert.ok(ids.includes('p1'), 'Giữ nguyên dự án chung p1');
    assert.ok(ids.includes('p3'), 'Bắt buộc giữ được dự án mới p3 tạo trên PC dù Điện thoại mở muộn hơn');
    assert.ok(!ids.includes('p2'), 'Loại bỏ dự án p2 đã nằm trong deletedProjectIds');
  });

  it('[E06, E07] Phiên Focus Timer đã kết thúc trên thiết bị A không bị "hồi sinh" khi hợp nhất với thiết bị B', () => {
    const runningTimer = { projectId: 'p1', subTaskId: 's1', startedAtMs: 1000, endTimeMs: 2000, status: 'running' };
    const phoneLocal = {
      updatedAt: 5000,
      activeTimer: runningTimer,
      projects: [{ id: 'p1', title: 'A', mode: 'fixed', updatedAt: 5000, subTasks: [] }]
    };
    // PC đã hoàn tất phiên (activeTimer = null) và đẩy lên sau
    const pcRemote = {
      updatedAt: 8000,
      activeTimer: null,
      projects: [{ id: 'p1', title: 'A', mode: 'fixed', updatedAt: 8000, subTasks: [] }]
    };

    const merged = mergeRemoteState(phoneLocal, pcRemote);
    assert.equal(merged.activeTimer, null, 'Timer phải được xóa theo thiết bị cập nhật gần nhất');
  });

  it('[E07] Nhật ký phiên trùng mã (2 thiết bị cùng hoàn tất 1 phiên) chỉ được tính một lần', () => {
    const log = { id: 'tlog_1000_s1', projectId: 'p1', subTaskId: 's1', minutes: 25, completedAt: 3000 };
    const a = { updatedAt: 3000, timerLogs: [log], projects: [] };
    const b = { updatedAt: 3001, timerLogs: [{ ...log, completedAt: 3001 }], projects: [] };
    const merged = mergeRemoteState(a, b);
    assert.equal(merged.timerLogs.length, 1, 'Không được cộng đôi phiên tập trung');
  });
});

