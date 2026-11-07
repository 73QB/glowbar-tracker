<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN A · KHUNG CỐ ĐỊNH — Dùng chung cho MỌI dự án. KHÔNG CHỈNH SỬA ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

# 🏗️ Archi.md — Kiến trúc hệ thống (Làm bằng gì? Đặt ở đâu?)

## A1. Thẻ định danh

| Thuộc tính | Giá trị |
|---|---|
| **Vị trí** | `docs/Archi.md` — Bản vẽ tĩnh |
| **Vai trò** | Quy định công nghệ, thư viện được phép/bị cấm, cấu trúc `src/` & `tests/`, sơ đồ luồng dữ liệu/phần cứng và giao diện giữa các module. Giúp code mới **khớp** với hệ thống tổng thể. |
| **Thứ bậc ưu tiên** | Bậc 4 (sau `Spec.md`) |
| **Ai được sửa** | Chỉ người dùng. AI chỉ *đề xuất* sửa ở bước 03. |
| **Mức độ thay đổi** | Thấp — đổi khi có quyết định kỹ thuật mới (ghi thành `D..`). |

## A2. Liên kết với các file khác

| File | Quan hệ với `Archi.md` |
|---|---|
| `docs/Spec.md` | Archi phục vụ Spec. Mọi lựa chọn kỹ thuật phải thỏa mãn `C..` của Spec. |
| `.agent/rules/Rules.md` | Quy ước đặt tên `R1xx` áp dụng cho các tên module/hàm khai báo ở đây. |
| `.agent/workflows/Plan.md` | Trường *File tác động* của mỗi task phải là module `M..` đã khai báo ở đây. |
| `.agent/workflows/02_code_explain.md` | Dùng đúng tên module, giao diện hàm, kiểu dữ liệu, thư viện quy định ở đây. |
| `.agent/workflows/03_verify_check.md` | Lớp 2: kiểm tra code có lệch kiến trúc không. |
| `src/`, `tests/` | Cấu trúc thực tế phải khớp sơ đồ thư mục ở Phần B. |

## A3. Quy tắc dành cho AI khi dùng file này

1. Chỉ dùng thư viện trong danh sách *được phép*. Cần thư viện mới → đề xuất, không tự thêm.
2. Không tạo file/module mới chưa có trong sơ đồ `M..`. Cần thêm → đề xuất cập nhật Archi trước.
3. Giữ đúng chữ ký hàm (tên, tham số, kiểu trả về) đã khai báo ở giao diện module.
4. Khi task làm thay đổi kiến trúc → ghi đề xuất `D..` mới trong báo cáo bước 03.

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║                         HẾT PHẦN A                               ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

---

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN B · NỘI DUNG DỰ ÁN — Người dùng tự viết cho từng dự án       ║
     ║ Giữ nguyên tiền tố ID (M, D). Xóa các dòng [placeholder] khi điền.║
     ╚══════════════════════════════════════════════════════════════════╝ -->

## B1. Công nghệ & Môi trường

- **Ngôn ngữ / Phiên bản:** JavaScript ES2022+ (Vanilla ES Modules), HTML5 ngữ nghĩa, CSS3 (Custom Properties, Flexbox/Grid, Keyframe Animations).
- **Trình biên dịch / IDE / Runtime:** Chạy trực tiếp trên trình duyệt hiện đại; môi trường kiểm thử tự động bằng **Node.js built-in test runner** (`node --test`).
- **Thư viện ĐƯỢC PHÉP:**
  - Firebase Modular JS SDK v10+ (`firebase-app`, `firebase-firestore` nạp qua CDN chính thức của Google `gstatic.com`).
  - Google Fonts (`Inter`, `Orbitron` hoặc `JetBrains Mono` cho số liệu phần trăm/đồng hồ).
- **Thư viện / Hàm BỊ CẤM:**
  - Các framework/thư viện UI nặng không cần thiết (jQuery, Bootstrap, Moment.js).
  - Hàm `eval()`, `innerHTML` trực tiếp với chuỗi nhập từ người dùng chưa qua khử độc (XSS sanitization).

## B2. Cấu trúc thư mục & Module

```text
PROJECT_ROOT/
├── index.html                   # M01 — Khung giao diện chính, nạp PWA manifest & module
├── manifest.json                # M02 — Cấu hình đóng gói ứng dụng PWA
├── sw.js                        # M02 — Service Worker hỗ trợ chạy độc lập & cache
├── src/
│   ├── styles/
│   │   └── main.css             # M03 — Hệ thống giao diện Dark Theme, Dynamic Glow, Accordion & Responsive
│   ├── core/
│   │   ├── models.js            # M04 — Khởi tạo & chuẩn hóa cấu trúc dữ liệu Project / SubTask
│   │   ├── calculator.js        # M05 — Lõi tính toán 2 chế độ (Fixed & Time Pool), Quick Actions & Level Up
│   │   ├── glow.js              # M06 — Động cơ tính thông số ánh sáng Dynamic Glow & Milestone
│   │   └── timer.js             # M07 — Bộ đếm Focus Timer dựa trên Timestamp chống trôi giờ
│   ├── services/
│   │   └── sync.js              # M08 — Lưu trữ Offline-first (localStorage) & Đồng bộ thời gian thực Firestore
│   └── ui/
│       └── app.js               # M09 — Điều phối DOM, sự kiện Accordion, Timer UI, Modal Level Up
└── tests/
    ├── models.test.js           # Kiểm thử M04
    ├── calculator.test.js       # Kiểm thử M05 (AC01, AC02, AC03, AC05)
    ├── glow.test.js             # Kiểm thử M06 (AC06)
    ├── timer.test.js            # Kiểm thử M07 (AC04, E06)
    └── sync.test.js             # Kiểm thử M08 (AC08, E07)
```

## B3. Giao diện module (Interfaces)

- **M01 (`index.html`) & M02 (`manifest.json`, `sw.js`):** Khung ứng dụng web & PWA.
- **M03 (`src/styles/main.css`):** Hệ thống biến CSS (`--bar-percent`, `--glow-blur`, `--glow-spread`, `--glow-opacity`, `--theme-color`) và bố cục Responsive.
- **M04 (`src/core/models.js`):**
  - `createProject({ id, title, mode, targetHours, level, themeColor, subTasks, createdAt, updatedAt }) -> Project`
  - `createSubTask({ id, title, weight, estimatedMinutes, progressPercent, spentMinutes }) -> SubTask`
  - `validateProject(project) -> { valid: boolean, errors: string[] }`
- **M05 (`src/core/calculator.js`):**
  - `calculateMasterProgress(project) -> { percent: number, spentMinutes: number, targetMinutes: number, isLevelUpReady: boolean }`
  - `applyQuickAction(project, subTaskId, deltaPercent) -> Project`
  - `applyTimerMinutes(project, subTaskId, addedMinutes) -> Project`
  - `levelUpProject(project, { action: 'add_hours' | 'switch_fixed', extraHours?: number }) -> Project`
- **M06 (`src/core/glow.js`):**
  - `computeGlowStyle(percent, themeColor) -> { blurPx: number, spreadPx: number, opacity: number, milestoneTier: 0|25|50|75|100, cssVars: Record<string, string> }`
- **M07 (`src/core/timer.js`):**
  - `createTimerState({ projectId, subTaskId, durationMinutes, nowMs }) -> TimerState`
  - `getTimerSnapshot(timerState, nowMs) -> { remainingSeconds: number, elapsedMinutes: number, isCompleted: boolean, progressRatio: number }`
  - `pauseTimer(timerState, nowMs) -> TimerState`
  - `resumeTimer(timerState, nowMs) -> TimerState`
- **M08 (`src/services/sync.js`):**
  - `saveLocalState(state, storage?) -> void`
  - `loadLocalState(storage?) -> AppState`
  - `mergeRemoteState(localState, remoteState) -> AppState`
  - `initCloudSync(firebaseConfig, syncKey, onRemoteUpdate) -> { pushState: (state) => Promise<void>, disconnect: () => void }`
- **M09 (`src/ui/app.js`):**
  - `initApp() -> void`
  - `renderDashboard(state) -> void`
  - `toggleAccordion(projectId) -> void`

## B4. Sơ đồ luồng dữ liệu / Kết nối phần cứng

```text
[Tương tác Người dùng: Quick Action (+10%, +25%, 100%) / Focus Timer (M07) / Level Up]
        │
        ▼
[Lõi Tính Toán M04 + M05 (calculator.js)] ──► Tính % Sub-bar, % Master-bar & cờ isLevelUpReady
        │
        ├──► [Động cơ Ánh sáng M06 (glow.js)] ──► Sinh biến CSS (--bar-percent, --glow-*) ──► [DOM Render M09]
        │
        └──► [Dịch vụ Đồng bộ M08 (sync.js)] ──► Ghi LocalStorage ◄──► Đồng bộ 2 chiều Firebase Firestore
```

## B5. Quyết định kỹ thuật (Decisions)

- **D01 — Tách biệt Pure Core (`src/core/*`) khỏi DOM và Firebase:** Toàn bộ công thức tính `%`, xử lý Focus Timer và tính độ sáng Glow đều là hàm thuần khiết (Pure Functions) không phụ thuộc `window` hay `document`, giúp kiểm thử tự động 100% bằng `node --test`.
- **D02 — Quy đổi tương đương giữa `%` và Thời gian trong chế độ `time_pool`:** Mỗi Sub-bar có `estimatedMinutes` (mặc định `60` phút nếu người dùng không nhập). Khi bấm nút cộng nhanh `+10%`, `+25%`, `100%`, hệ thống cộng số phút tương ứng với phần trăm thực tăng thêm (`actualDeltaPercent / 100 * estimatedMinutes`) vào `spentMinutes` để cả thanh Sub-bar và quỹ giờ Master-bar cùng nhích lên nhất quán.
- **D03 — Kiến trúc CSS Custom Properties cho Dynamic Glow:** Thay vì tính toán lại toàn bộ stylesheet, JS chỉ gắn các biến `--bar-percent`, `--glow-blur`, `--glow-opacity`, `--theme-color` lên phần tử `.master-bar`, để GPU render hiệu ứng phát sáng mượt mà.
- **D04 — Đồng bộ đám mây không cần đăng nhập phức tạp:** Sử dụng `syncKey` (mã định danh không gian làm việc cá nhân do người dùng tự đặt) kết hợp Firebase Firestore document theo đường dẫn `workspaces/{syncKey}` để đồng bộ tức thì giữa máy tính và điện thoại.
