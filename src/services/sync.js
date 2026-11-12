/**
 * M08 — Lưu trữ Offline-first (localStorage) & Đồng bộ thời gian thực Firestore
 * Phục vụ: F11, IN04, OUT04, C01, C05, E07, AC08, D04, R102
 */

import { createProject, formatDateKey, generateId } from '../core/models.js';

export const STORAGE_KEY = 'glowbar_tracker_state_v1';
export const CLOUD_CONFIG_KEY = 'glowbar_cloud_config_v1';
export const SEED_PROJECT_IDS = ['proj_seed_fixed', 'proj_seed_pool'];

/**
 * Tạo dữ liệu mẫu mặc định khi người dùng mở ứng dụng lần đầu
 * Gồm 1 dự án chế độ Lộ trình cố định (Fixed) và 1 dự án chế độ Quỹ thời gian (Time Pool)
 * Dùng mốc updatedAt nền (1000) để không bao giờ ghi đè lên dữ liệu thật từ đám mây khi thiết bị mới kết nối.
 * @returns {Object} AppState
 */
export function createDefaultSeedState() {
  const now = Date.now();
  const seedTimestamp = 1000;
  const todayKey = formatDateKey(now);
  const yesterdayKey = formatDateKey(now - 86400000);
  const twoDaysAgoKey = formatDateKey(now - 2 * 86400000);

  return {
    version: 1,
    updatedAt: seedTimestamp,
    theme: 'positivus',
    filterView: 'active',
    expandedProjectId: 'proj_seed_fixed',
    activeTimer: null,
    deletedProjectIds: [],
    activityLog: {
      [twoDaysAgoKey]: { count: 2, minutes: 45 },
      [yesterdayKey]: { count: 3, minutes: 60 },
      [todayKey]: { count: 2, minutes: 50 }
    },
    timerLogs: [
      {
        id: 'tlog_seed_1',
        projectId: 'proj_seed_fixed',
        projectTitle: 'Ra mắt Ứng dụng GlowBar PWA',
        subTaskId: 'sub_seed_2',
        subTaskTitle: 'Lập trình Lõi tính toán Fixed & Time Pool Mode',
        minutes: 25,
        completedAt: now - 3600000
      },
      {
        id: 'tlog_seed_2',
        projectId: 'proj_seed_pool',
        projectTitle: 'Luyện tập Thuật toán & Cấu trúc dữ liệu (Quỹ 10h)',
        subTaskId: 'sub_seed_5',
        subTaskTitle: 'Chuyên đề Đồ thị (BFS / DFS / Dijkstra)',
        minutes: 25,
        completedAt: now - 7200000
      }
    ],
    projects: [
      createProject({
        id: 'proj_seed_fixed',
        title: 'Ra mắt Ứng dụng GlowBar PWA',
        mode: 'fixed',
        targetHours: 12,
        level: 1,
        themeColor: '#2563eb',
        pinned: true,
        archived: false,
        createdAt: now - 3 * 86400000,
        updatedAt: seedTimestamp,
        lastProgressAt: now,
        progressHistory: [
          { date: yesterdayKey, deltaMinutes: 60, deltaPercent: 25 },
          { date: todayKey, deltaMinutes: 45, deltaPercent: 20 }
        ],
        subTasks: [
          {
            id: 'sub_seed_1',
            title: 'Thiết kế giao diện Dark Glow & Hiệu ứng Milestone',
            weight: 2,
            estimatedMinutes: 90,
            progressPercent: 100,
            spentMinutes: 90,
            note: 'Chuẩn Positivus Neo-Brutalist kết hợp chế độ OLED Dark ban đêm'
          },
          {
            id: 'sub_seed_2',
            title: 'Lập trình Lõi tính toán Fixed & Time Pool Mode',
            weight: 3,
            estimatedMinutes: 120,
            progressPercent: 60,
            spentMinutes: 72,
            note: 'Tài liệu công thức: https://developer.mozilla.org/'
          },
          {
            id: 'sub_seed_3',
            title: 'Kết nối Đồng bộ Đám mây Firebase Firestore & PWA',
            weight: 1,
            estimatedMinutes: 60,
            progressPercent: 25,
            spentMinutes: 15,
            note: ''
          }
        ]
      }),
      createProject({
        id: 'proj_seed_pool',
        title: 'Luyện tập Thuật toán & Cấu trúc dữ liệu (Quỹ 10h)',
        mode: 'time_pool',
        targetHours: 10,
        level: 1,
        themeColor: '#7c3aed',
        pinned: false,
        archived: false,
        createdAt: now - 4 * 86400000,
        updatedAt: seedTimestamp,
        lastProgressAt: now,
        progressHistory: [
          { date: twoDaysAgoKey, deltaMinutes: 90, deltaPercent: 15 },
          { date: yesterdayKey, deltaMinutes: 120, deltaPercent: 20 },
          { date: todayKey, deltaMinutes: 120, deltaPercent: 20 }
        ],
        subTasks: [
          {
            id: 'sub_seed_4',
            title: 'Chuyên đề Quy hoạch động (Dynamic Programming)',
            weight: 1,
            estimatedMinutes: 180,
            progressPercent: 100,
            spentMinutes: 180,
            note: 'Hoàn thành 15 bài DP cơ bản & nâng cao trên LeetCode'
          },
          {
            id: 'sub_seed_5',
            title: 'Chuyên đề Đồ thị (BFS / DFS / Dijkstra)',
            weight: 1,
            estimatedMinutes: 180,
            progressPercent: 50,
            spentMinutes: 90,
            note: 'Luyện tập tại https://leetcode.com/tag/graph/'
          },
          {
            id: 'sub_seed_6',
            title: 'Giải 5 đề thi thử phỏng vấn (Mock Contest)',
            weight: 1,
            estimatedMinutes: 240,
            progressPercent: 25,
            spentMinutes: 60,
            note: ''
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

  const theme = rawState.theme === 'oled_dark' ? 'oled_dark' : 'positivus';
  const filterView = ['active', 'pinned', 'archived'].includes(rawState.filterView)
    ? rawState.filterView
    : 'active';

  const rawActivity = rawState.activityLog && typeof rawState.activityLog === 'object'
    ? rawState.activityLog
    : {};
  const activityLog = {};
  for (const [k, v] of Object.entries(rawActivity)) {
    if (typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && v && typeof v === 'object') {
      activityLog[k] = {
        count: Math.max(0, Number(v.count) || 0),
        minutes: Math.max(0, Math.round((Number(v.minutes) || 0) * 10) / 10)
      };
    }
  }

  const timerLogs = Array.isArray(rawState.timerLogs)
    ? rawState.timerLogs
        .filter((item) => item && typeof item === 'object')
        .slice(0, 150)
        .map((item) => ({
          id: typeof item.id === 'string' && item.id ? item.id : generateId('tlog'),
          projectId: String(item.projectId || ''),
          projectTitle: String(item.projectTitle || 'Dự án'),
          subTaskId: String(item.subTaskId || ''),
          subTaskTitle: String(item.subTaskTitle || 'Công việc'),
          minutes: Math.max(1, Math.round((Number(item.minutes) || 25) * 10) / 10),
          completedAt: Number.isFinite(Number(item.completedAt)) ? Number(item.completedAt) : Date.now()
        }))
    : [];

  const deletedProjectIds = Array.isArray(rawState.deletedProjectIds)
    ? Array.from(
        new Set(rawState.deletedProjectIds.filter((id) => typeof id === 'string' && id.trim()))
      ).slice(-200)
    : [];

  return {
    version: 1,
    updatedAt: Number.isFinite(Number(rawState.updatedAt)) ? Number(rawState.updatedAt) : Date.now(),
    theme,
    filterView,
    expandedProjectId: typeof rawState.expandedProjectId === 'string' ? rawState.expandedProjectId : null,
    activeTimer: rawState.activeTimer && typeof rawState.activeTimer === 'object'
      ? { ...rawState.activeTimer }
      : null,
    deletedProjectIds,
    activityLog,
    timerLogs,
    projects: rawState.projects.map((p) => createProject(p))
  };
}

/**
 * Ghi nhận hoạt động mới vào activityLog (phục vụ Streak & Heatmap)
 * @param {Object} activityLog
 * @param {number} [addedMinutes]
 * @param {number} [nowMs]
 * @returns {Object} Bản sao activityLog mới
 */
export function recordDailyActivity(activityLog = {}, addedMinutes = 5, nowMs = Date.now()) {
  const dateKey = formatDateKey(nowMs);
  const current = activityLog?.[dateKey] || { count: 0, minutes: 0 };
  const safeMins = Math.max(0, Math.round((Number(addedMinutes) || 0) * 10) / 10);
  return {
    ...(activityLog || {}),
    [dateKey]: {
      count: (Number(current.count) || 0) + 1,
      minutes: Math.round(((Number(current.minutes) || 0) + safeMins) * 10) / 10
    }
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
 * Hợp nhất dữ liệu giữa máy cục bộ và đám mây Firestore theo nguyên tắc Union + Last-Write-Wins (E07, AC08)
 * - Hợp nhất (Union) toàn bộ dự án từ cả 2 thiết bị để không bao giờ mất dự án mới tạo khi 1 máy đang tắt.
 * - Tôn trọng danh sách `deletedProjectIds` (Tombstones) để dự án đã xóa không bị hồi sinh.
 * - Với các dự án cùng ID ở cả 2 bên, giữ phiên bản có `project.updatedAt` mới hơn.
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

  const isRemoteNewerGlobal = remoteNorm.updatedAt >= localNorm.updatedAt;
  const seedIdSet = new Set(SEED_PROJECT_IDS);

  // Hợp nhất danh sách ID dự án đã bị xóa (Tombstones) từ cả 2 phía
  const deletedSet = new Set([
    ...(localNorm.deletedProjectIds || []),
    ...(remoteNorm.deletedProjectIds || [])
  ]);

  // Nếu một thiết bị đã xóa dự án mẫu (seed) và đã có dự án riêng hoặc trạng thái mới hơn, đánh dấu xóa dự án mẫu đó
  const localIds = new Set(localNorm.projects.map((p) => p.id));
  const remoteIds = new Set(remoteNorm.projects.map((p) => p.id));
  const localHasCustom = localNorm.projects.some((p) => !seedIdSet.has(p.id));
  const remoteHasCustom = remoteNorm.projects.some((p) => !seedIdSet.has(p.id));

  for (const seedId of seedIdSet) {
    const deletedOnLocal = !localIds.has(seedId) && (localHasCustom || Number(localNorm.updatedAt) > 1000);
    const deletedOnRemote = !remoteIds.has(seedId) && (remoteHasCustom || Number(remoteNorm.updatedAt) > 1000);
    if (deletedOnLocal || deletedOnRemote) {
      deletedSet.add(seedId);
    }
  }

  const primaryList = isRemoteNewerGlobal ? remoteNorm.projects : localNorm.projects;
  const secondaryList = isRemoteNewerGlobal ? localNorm.projects : remoteNorm.projects;
  const secondaryMap = new Map(secondaryList.map((p) => [p.id, p]));
  const seenIds = new Set();
  const mergedProjects = [];

  // 1. Duyệt danh sách chính trước (giữ thứ tự ưu tiên trên thiết bị vừa thao tác gần nhất)
  for (const proj of primaryList) {
    if (!proj || !proj.id || deletedSet.has(proj.id) || seenIds.has(proj.id)) continue;
    seenIds.add(proj.id);
    const other = secondaryMap.get(proj.id);
    if (!other) {
      mergedProjects.push(createProject(proj));
    } else {
      mergedProjects.push(
        Number(other.updatedAt) > Number(proj.updatedAt)
          ? createProject(other)
          : createProject(proj)
      );
    }
  }

  // 2. Hợp nhất (Union) các dự án chỉ có ở danh sách phụ (VD: dự án mới thêm trên PC khi điện thoại đang tắt)
  for (const proj of secondaryList) {
    if (!proj || !proj.id || deletedSet.has(proj.id) || seenIds.has(proj.id)) continue;
    seenIds.add(proj.id);
    mergedProjects.push(createProject(proj));
  }

  // Hợp nhất activityLog (lấy max count & minutes của từng ngày để không mất chuỗi giữ lửa)
  const mergedActivityLog = { ...(localNorm.activityLog || {}) };
  for (const [dateKey, entry] of Object.entries(remoteNorm.activityLog || {})) {
    const localEntry = mergedActivityLog[dateKey];
    if (!localEntry) {
      mergedActivityLog[dateKey] = { ...entry };
    } else {
      mergedActivityLog[dateKey] = {
        count: Math.max(Number(localEntry.count) || 0, Number(entry.count) || 0),
        minutes: Math.max(Number(localEntry.minutes) || 0, Number(entry.minutes) || 0)
      };
    }
  }

  // Hợp nhất timerLogs theo id, sắp xếp mới nhất lên đầu
  const logMap = new Map();
  for (const item of [...(localNorm.timerLogs || []), ...(remoteNorm.timerLogs || [])]) {
    if (item && item.id) {
      logMap.set(item.id, item);
    }
  }
  const mergedTimerLogs = Array.from(logMap.values())
    .sort((a, b) => Number(b.completedAt) - Number(a.completedAt))
    .slice(0, 150);

  return {
    version: 1,
    updatedAt: Math.max(localNorm.updatedAt, remoteNorm.updatedAt),
    theme: localNorm.theme || remoteNorm.theme || 'positivus',
    filterView: localNorm.filterView || 'active',
    expandedProjectId: localNorm.expandedProjectId ?? remoteNorm.expandedProjectId,
    activeTimer: isRemoteNewerGlobal
      ? (remoteNorm.activeTimer ?? localNorm.activeTimer)
      : localNorm.activeTimer,
    deletedProjectIds: Array.from(deletedSet).slice(-200),
    activityLog: mergedActivityLog,
    timerLogs: mergedTimerLogs,
    projects: mergedProjects
  };
}

/**
 * Kiểm tra xem bản hợp nhất `mergedState` có chứa thay đổi mới từ máy cục bộ mà trên đám mây `remoteState` chưa có hay không.
 * Dùng để quyết định có cần đẩy ngược bản hợp nhất lên Firestore hay không (tránh vòng lặp vô hạn).
 * @param {Object} remoteState
 * @param {Object} mergedState
 * @returns {boolean}
 */
export function hasUnpushedLocalChanges(remoteState, mergedState) {
  if (!remoteState || !Array.isArray(remoteState.projects)) return true;
  const remoteNorm = normalizeAppState(remoteState);
  const mergedNorm = normalizeAppState(mergedState);

  if (mergedNorm.projects.length !== remoteNorm.projects.length) {
    return true;
  }

  const remoteMap = new Map(remoteNorm.projects.map((p) => [p.id, p]));
  for (const proj of mergedNorm.projects) {
    const rProj = remoteMap.get(proj.id);
    if (!rProj) return true;
    if (Number(proj.updatedAt) > Number(rProj.updatedAt)) return true;
  }

  const remoteDeletedSet = new Set(remoteNorm.deletedProjectIds || []);
  for (const delId of mergedNorm.deletedProjectIds || []) {
    if (!remoteDeletedSet.has(delId)) return true;
  }

  return false;
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
 * Tuân thủ nguyên tắc Pull-Before-Push: luôn kéo dữ liệu từ đám mây về hợp nhất trước khi đẩy lên.
 * @param {Object} firebaseConfig - { apiKey, projectId, appId, ... }
 * @param {string} syncKey - Mã phòng đồng bộ cá nhân
 * @param {(remoteState: Object, meta?: { source: string }) => void} onRemoteUpdate - Callback khi có dữ liệu mới từ đám mây
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
      pullNow: async () => null,
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
    let lastPushedWriteId = null;

    async function pullNow() {
      if (isDisposed) return null;
      try {
        let snapshot = null;
        if (typeof firestoreModule.getDocFromServer === 'function') {
          try {
            snapshot = await firestoreModule.getDocFromServer(docRef);
          } catch {
            snapshot = await firestoreModule.getDoc(docRef);
          }
        } else {
          snapshot = await firestoreModule.getDoc(docRef);
        }

        if (isDisposed) return null;
        onStatusChange?.({
          state: 'connected',
          message: `Đã đồng bộ đám mây (${cleanKey})`
        });

        if (snapshot && snapshot.exists()) {
          const data = snapshot.data();
          if (data) {
            const normalizedRemote = normalizeAppState(data);
            onRemoteUpdate?.(normalizedRemote, { source: 'pull' });
            return normalizedRemote;
          }
        }
        return null;
      } catch (err) {
        if (!isDisposed) {
          onStatusChange?.({
            state: 'error',
            message: `Lỗi tải dữ liệu đám mây: ${err?.message || 'Kiểm tra kết nối mạng'}`
          });
        }
        return undefined;
      }
    }

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
          if (!data) return;
          // Chỉ bỏ qua nếu đây đúng là tiếng vọng (echo) từ lần ghi vừa rồi của chính thiết bị này
          if (data.lastWriteId && data.lastWriteId === lastPushedWriteId) {
            return;
          }
          onRemoteUpdate?.(normalizeAppState(data), { source: 'snapshot' });
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
      pullNow,
      async pushState(state) {
        if (isDisposed) return false;
        try {
          const payload = normalizeAppState(state);
          const writeId = generateId('sync');
          lastPushedWriteId = writeId;
          await firestoreModule.setDoc(
            docRef,
            JSON.parse(JSON.stringify({ ...payload, lastWriteId: writeId }))
          );
          onStatusChange?.({
            state: 'connected',
            message: `Đã đồng bộ đám mây (${cleanKey})`
          });
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
      pullNow: async () => null,
      disconnect: () => {}
    };
  }
}

