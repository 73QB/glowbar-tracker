/**
 * M08 — Lưu trữ Offline-first (localStorage) & Đồng bộ thời gian thực Firestore
 * Phục vụ: F11, IN04, OUT04, C01, C05, E07, AC08, D04, R102
 */

import { createProject } from '../core/models.js';

export const STORAGE_KEY = 'glowbar_tracker_state_v1';
export const CLOUD_CONFIG_KEY = 'glowbar_cloud_config_v1';

/**
 * Tạo dữ liệu mẫu mặc định khi người dùng mở ứng dụng lần đầu
 * Gồm 1 dự án chế độ Lộ trình cố định (Fixed) và 1 dự án chế độ Quỹ thời gian (Time Pool)
 * @returns {Object} AppState
 */
export function createDefaultSeedState() {
  const now = Date.now();
  return {
    version: 1,
    updatedAt: now,
    expandedProjectId: 'proj_seed_fixed',
    activeTimer: null,
    projects: [
      createProject({
        id: 'proj_seed_fixed',
        title: 'Ra mắt Ứng dụng GlowBar PWA',
        mode: 'fixed',
        targetHours: 12,
        level: 1,
        themeColor: '#00f0ff',
        createdAt: now - 86400000,
        updatedAt: now,
        subTasks: [
          {
            id: 'sub_seed_1',
            title: 'Thiết kế giao diện Dark Glow & Hiệu ứng Milestone',
            weight: 2,
            estimatedMinutes: 90,
            progressPercent: 100,
            spentMinutes: 90
          },
          {
            id: 'sub_seed_2',
            title: 'Lập trình Lõi tính toán Fixed & Time Pool Mode',
            weight: 3,
            estimatedMinutes: 120,
            progressPercent: 60,
            spentMinutes: 72
          },
          {
            id: 'sub_seed_3',
            title: 'Kết nối Đồng bộ Đám mây Firebase Firestore & PWA',
            weight: 1,
            estimatedMinutes: 60,
            progressPercent: 25,
            spentMinutes: 15
          }
        ]
      }),
      createProject({
        id: 'proj_seed_pool',
        title: 'Luyện tập Thuật toán & Cấu trúc dữ liệu (Quỹ 10h)',
        mode: 'time_pool',
        targetHours: 10,
        level: 1,
        themeColor: '#a855f7',
        createdAt: now - 43200000,
        updatedAt: now,
        subTasks: [
          {
            id: 'sub_seed_4',
            title: 'Chuyên đề Quy hoạch động (Dynamic Programming)',
            weight: 1,
            estimatedMinutes: 180,
            progressPercent: 100,
            spentMinutes: 180
          },
          {
            id: 'sub_seed_5',
            title: 'Chuyên đề Đồ thị (BFS / DFS / Dijkstra)',
            weight: 1,
            estimatedMinutes: 180,
            progressPercent: 50,
            spentMinutes: 90
          },
          {
            id: 'sub_seed_6',
            title: 'Giải 5 đề thi thử phỏng vấn (Mock Contest)',
            weight: 1,
            estimatedMinutes: 240,
            progressPercent: 25,
            spentMinutes: 60
          }
        ]
      })
    ]
  };
}

/**
 * Chuẩn hóa đối tượng trạng thái toàn cục AppState (R102)
 * @param {Object} rawState
 * @returns {Object} AppState
 */
export function normalizeAppState(rawState) {
  if (!rawState || typeof rawState !== 'object' || !Array.isArray(rawState.projects)) {
    return createDefaultSeedState();
  }

  return {
    version: 1,
    updatedAt: Number.isFinite(Number(rawState.updatedAt)) ? Number(rawState.updatedAt) : Date.now(),
    expandedProjectId: typeof rawState.expandedProjectId === 'string' ? rawState.expandedProjectId : null,
    activeTimer: rawState.activeTimer && typeof rawState.activeTimer === 'object'
      ? { ...rawState.activeTimer }
      : null,
    projects: rawState.projects.map((p) => createProject(p))
  };
}

/**
 * Lưu trạng thái vào bộ nhớ cục bộ (localStorage hoặc bộ nhớ giả lập khi test) (C05)
 * @param {Object} state
 * @param {Storage} [storage]
 * @returns {Object} Chuỗi trạng thái đã chuẩn hóa
 */
export function saveLocalState(state, storage = globalThis.localStorage) {
  const normalized = {
    ...normalizeAppState(state),
    updatedAt: Number.isFinite(Number(state?.updatedAt)) ? Number(state.updatedAt) : Date.now()
  };

  if (storage && typeof storage.setItem === 'function') {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (err) {
      console.warn('[Sync] Không thể ghi vào localStorage:', err);
    }
  }
  return normalized;
}

/**
 * Đọc trạng thái từ bộ nhớ cục bộ; nếu chưa có hoặc lỗi JSON sẽ trả về dữ liệu mẫu (C05)
 * @param {Storage} [storage]
 * @returns {Object} AppState
 */
export function loadLocalState(storage = globalThis.localStorage) {
  if (!storage || typeof storage.getItem !== 'function') {
    return createDefaultSeedState();
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createDefaultSeedState();
      saveLocalState(seed, storage);
      return seed;
    }
    const parsed = JSON.parse(raw);
    return normalizeAppState(parsed);
  } catch (err) {
    console.warn('[Sync] Dữ liệu localStorage lỗi, khôi phục mặc định:', err);
    return createDefaultSeedState();
  }
}

/**
 * Hợp nhất dữ liệu giữa máy cục bộ và đám mây Firestore theo nguyên tắc Last-Write-Wins (E07, AC08)
 * So sánh cả cấp độ từng Project theo `updatedAt` để tránh mất mát khi cập nhật song song.
 * @param {Object} localState
 * @param {Object} remoteState
 * @returns {Object} AppState đã hợp nhất
 */
export function mergeRemoteState(localState, remoteState) {
  if (!remoteState || typeof remoteState !== 'object' || !Array.isArray(remoteState.projects)) {
    return normalizeAppState(localState);
  }
  if (!localState || typeof localState !== 'object' || !Array.isArray(localState.projects)) {
    return normalizeAppState(remoteState);
  }

  const localNorm = normalizeAppState(localState);
  const remoteNorm = normalizeAppState(remoteState);

  // Nếu remoteState mới hơn hoàn toàn ở cấp độ toàn cục (VD: xóa dự án hoặc đồng bộ toàn phần)
  const isRemoteNewerGlobal = remoteNorm.updatedAt >= localNorm.updatedAt;
  const primaryList = isRemoteNewerGlobal ? remoteNorm.projects : localNorm.projects;
  const secondaryMap = new Map(
    (isRemoteNewerGlobal ? localNorm.projects : remoteNorm.projects).map((p) => [p.id, p])
  );

  // Với các dự án cùng tồn tại ở cả 2 bên, giữ phiên bản có project.updatedAt mới hơn
  const mergedProjects = primaryList.map((proj) => {
    const other = secondaryMap.get(proj.id);
    if (!other) return createProject(proj);
    return Number(other.updatedAt) > Number(proj.updatedAt)
      ? createProject(other)
      : createProject(proj);
  });

  return {
    version: 1,
    updatedAt: Math.max(localNorm.updatedAt, remoteNorm.updatedAt),
    expandedProjectId: localNorm.expandedProjectId ?? remoteNorm.expandedProjectId,
    activeTimer: isRemoteNewerGlobal
      ? (remoteNorm.activeTimer ?? localNorm.activeTimer)
      : localNorm.activeTimer,
    projects: mergedProjects
  };
}

/**
 * Đọc / ghi cấu hình kết nối đám mây Firebase của người dùng
 * @param {Storage} [storage]
 */
export function loadCloudConfig(storage = globalThis.localStorage) {
  if (!storage || typeof storage.getItem !== 'function') return null;
  try {
    const raw = storage.getItem(CLOUD_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCloudConfig(config, storage = globalThis.localStorage) {
  if (!storage || typeof storage.setItem !== 'function') return;
  try {
    if (!config) {
      storage.removeItem(CLOUD_CONFIG_KEY);
    } else {
      storage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
    }
  } catch (err) {
    console.warn('[Sync] Không thể lưu cấu hình đám mây:', err);
  }
}

/**
 * Khởi tạo kết nối đồng bộ thời gian thực với Firebase Firestore (F11, D04, AC08)
 * Nạp động Firebase Modular SDK v10.12.2 từ CDN Google gstatic khi người dùng bật Cloud Sync.
 * @param {Object} firebaseConfig - { apiKey, projectId, appId, ... }
 * @param {string} syncKey - Mã phòng đồng bộ cá nhân
 * @param {(remoteState: Object) => void} onRemoteUpdate - Callback khi có dữ liệu mới từ đám mây
 * @param {(status: { state: 'connecting'|'connected'|'offline'|'error', message: string }) => void} [onStatusChange]
 */
export async function initCloudSync(firebaseConfig, syncKey, onRemoteUpdate, onStatusChange) {
  const cleanKey = typeof syncKey === 'string' ? syncKey.trim() : '';
  if (!firebaseConfig?.apiKey || !firebaseConfig?.projectId || !cleanKey) {
    onStatusChange?.({
      state: 'offline',
      message: 'Đang chạy chế độ Offline (LocalStorage).'
    });
    return {
      pushState: async () => false,
      disconnect: () => {}
    };
  }

  onStatusChange?.({
    state: 'connecting',
    message: `Đang kết nối Firestore (Kênh: ${cleanKey})...`
  });

  try {
    const [appModule, firestoreModule] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
    ]);

    const appName = `glowbar_${cleanKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const existingApps = appModule.getApps();
    const app = existingApps.find((a) => a.name === appName)
      || appModule.initializeApp(firebaseConfig, appName);

    const db = firestoreModule.getFirestore(app);
    const docRef = firestoreModule.doc(db, 'glowbar_workspaces', cleanKey);

    let isDisposed = false;
    let lastPushedTimestamp = 0;

    const unsubscribe = firestoreModule.onSnapshot(
      docRef,
      (snapshot) => {
        if (isDisposed) return;
        onStatusChange?.({
          state: 'connected',
          message: `Đã đồng bộ đám mây (${cleanKey})`
        });

        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Number(data.updatedAt) > lastPushedTimestamp) {
            onRemoteUpdate?.(normalizeAppState(data));
          }
        }
      },
      (err) => {
        if (isDisposed) return;
        onStatusChange?.({
          state: 'error',
          message: `Lỗi đồng bộ: ${err?.message || 'Không thể kết nối Firestore'}`
        });
      }
    );

    return {
      async pushState(state) {
        if (isDisposed) return false;
        try {
          const payload = normalizeAppState(state);
          lastPushedTimestamp = payload.updatedAt;
          await firestoreModule.setDoc(docRef, JSON.parse(JSON.stringify(payload)), { merge: true });
          return true;
        } catch (err) {
          onStatusChange?.({
            state: 'error',
            message: `Tạm lưu Offline (Chờ mạng): ${err?.message || ''}`
          });
          return false;
        }
      },
      disconnect() {
        isDisposed = true;
        unsubscribe?.();
        onStatusChange?.({
          state: 'offline',
          message: 'Đã ngắt kết nối đám mây.'
        });
      }
    };
  } catch (err) {
    onStatusChange?.({
      state: 'error',
      message: `Không nạp được SDK Firebase (Kiểm tra mạng): ${err?.message || ''}`
    });
    return {
      pushState: async () => false,
      disconnect: () => {}
    };
  }
}

