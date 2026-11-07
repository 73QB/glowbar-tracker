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
});

