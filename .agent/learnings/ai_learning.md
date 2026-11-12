<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN A · KHUNG CỐ ĐỊNH — Dùng chung cho MỌI dự án. KHÔNG CHỈNH SỬA ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

# 🧠 ai_learning.md — Bộ nhớ dự án (Project Memory & Snapshot)

## A1. Thẻ định danh

| Thuộc tính | Giá trị |
|---|---|
| **Vị trí** | `.agent/learnings/ai_learning.md` |
| **Vai trò** | **Ảnh chụp toàn cảnh dự án tại thời điểm hiện tại.** Lưu những gì quan trọng nhất: kiến thức kỹ thuật cốt lõi, các thành phần đã đạt được, lưu ý quan trọng và lịch sử các mốc phiên bản. |
| **Mục đích** | AI chỉ cần đọc file này là: **(1)** hiểu dự án đang ở trạng thái nào → **(2)** tiếp tục bước tiếp theo mà không cần đọc lại lịch sử chat → **(3)** khôi phục lại được một phiên bản trước đó khi cần. |
| **Thứ bậc ưu tiên** | Bậc 6 |
| **Ai được sửa** | Người dùng. AI chỉ ghi khi được cho phép, hoặc xuất khối cập nhật ở bước 03. |
| **Mức độ thay đổi** | Cao — cập nhật sau mỗi task PASS. |

## A2. Liên kết với các file khác

| File | Quan hệ với `ai_learning.md` |
|---|---|
| `docs/Spec.md`, `docs/Archi.md` | Đó là **bản thiết kế** (dự định làm gì, bằng gì). File này là **thực trạng** (đã làm được gì, đang chạy thế nào). |
| `.agent/workflows/Plan.md` | Plan là **lộ trình & checklist** (làm gì, theo thứ tự nào). File này là **trạng thái kỹ thuật** sau khi làm. Plan trỏ tới; file này giải thích chi tiết. |
| `01_context_plan.md` | Đọc file này để nắm ngay trạng thái hiện tại trước khi chọn task. |
| `02_code_explain.md` | Code mới phải khớp với các thành phần, cấu hình, lưu ý `L..` ghi ở đây. |
| `03_verify_check.md` | Khi task PASS → sinh khối cập nhật cho file này + tạo mốc phiên bản `V..` mới. |
| `src/`, `tests/` | Mỗi mốc `V..` mô tả trạng thái của `src/` và `tests/` tại thời điểm đó. |

## A3. Quy tắc dành cho AI khi dùng file này

**Khi đọc (đầu phiên)**
1. Đọc mục B1 trước để biết phiên bản hiện tại, task vừa xong và task kế tiếp.
2. Coi mỗi lưu ý `L..` là **cảnh báo bắt buộc**, không phải tham khảo.
3. Nếu thông tin ở đây mâu thuẫn với code thực tế trong `src/` → báo cho người dùng, không tự đoán bên nào đúng.

**Khi cập nhật (bước 03, sau khi task PASS)**
1. Mục **B1, B2, B3** — *ghi đè* để luôn phản ánh **trạng thái mới nhất**.
2. Mục **B4** — chỉ *thêm* lưu ý mới. Lưu ý cũ không còn đúng → ghi *"(Hết hiệu lực từ V..)"*, không xóa.
3. Mục **B5** — chỉ *thêm* mốc mới ở cuối, không bao giờ sửa/xóa mốc cũ.
4. Chỉ ghi thông tin **về dự án này**. Không ghi kỹ năng/quy trình chung chung (đó là việc của `skills/`).
5. Không chép nguyên văn code dài — chỉ ghi đủ để nhận diện và khôi phục (tên hàm, chữ ký, cấu hình, mã commit/bản sao lưu).

**Khi người dùng yêu cầu khôi phục về phiên bản `V..`**
1. Tra mốc `V..` trong mục B5 → đọc *Điểm khôi phục* và *Trạng thái thành phần*.
2. Liệt kê cho người dùng: file nào cần đưa về, cách đưa về (lệnh git / thư mục sao lưu), task nào trong `Plan.md` cần chuyển lại `[ ]`.
3. Chờ người dùng xác nhận trước khi hướng dẫn thực hiện. Sau khi khôi phục, cập nhật lại B1–B3 theo mốc đó.

## A4. Khuôn mẫu một mốc phiên bản

```markdown
### V<major>.<minor> — <Tên mốc> · <YYYY-MM-DD> · (sau task T..)
- **Đạt được:** <chức năng/thành phần mới hoạt động ở mốc này>
- **File thay đổi:** `src/...`, `tests/...`
- **Trạng thái thành phần:** <hàm/module chính và chữ ký hiện tại>
- **Kết quả kiểm thử:** <test đã PASS — AC../E..>
- **Điểm khôi phục:** <git commit/tag | thư mục sao lưu | cách tái tạo>
```

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║                         HẾT PHẦN A                               ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

---

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN B · NỘI DUNG DỰ ÁN — Cập nhật dần sau mỗi task PASS          ║
     ║ (AI soạn ở bước 03, người dùng duyệt). Xóa [placeholder] khi điền.║
     ╚══════════════════════════════════════════════════════════════════╝ -->

## B1. Trạng thái hiện tại (Snapshot)

| Mục | Giá trị |
|---|---|
| **Phiên bản hiện tại** | `V2.3` (Rà soát toàn dự án: sửa 6 lỗi Focus Timer/đồng bộ + chuông & thông báo hết phiên, đếm ngược trên tiêu đề tab) |
| **Task vừa hoàn thành** | `T8.1 — Rà soát & gia cố Focus Timer, đồng bộ đa thiết bị; thêm báo hiệu hết phiên` |
| **Task kế tiếp** | Hệ thống đang vận hành hoàn thiện ở trạng thái tốt nhất |
| **Tình trạng build / test** | ✅ **17/17 Test Cases PASS** (V8 Chromium Headless) + smoke test `index.html` 0 lỗi JS |
| **Triển khai trực tuyến** | GitHub Pages: `https://73qb.github.io/glowbar-tracker/` · Firestore Cloud Sync: `Spark Plan` active |
| **Cập nhật lần cuối** | `2026-11-12` |

## B2. Kiến thức kỹ thuật cốt lõi đang áp dụng

> Cấu hình, thông số, công thức, thuật toán, đặc thù phần cứng/thư viện mà code hiện tại phụ thuộc vào.

- **Kiến trúc Pure Core (`D01`):** Toàn bộ các module trong `src/core/` (`models.js`, `calculator.js`, `glow.js`, `timer.js`) là hàm thuần khiết bất biến (`R102`), kiểm thử tự động qua `tests/runner.html` và `tests/run-all.js`.
- **Công thức 2 chế độ tính toán (`F05`, `F06`, `D02`):**
  - *Fixed Mode:* Trung bình có trọng số $\frac{\sum w_i \cdot p_i}{\sum w_i}$, tự động trả về `0%` khi danh sách rỗng hoặc tổng trọng số $\le 0$ (`E01`).
  - *Time Pool Mode:* Tính theo $\min(100, \frac{\sum t_{\text{spent}}}{T_{\text{target}} \times 60} \times 100)$, đảm bảo thêm việc mới không làm tụt phần trăm (`C02`). Khi bấm nút cộng nhanh (`+10%`, `+25%`, `100%`) hoặc trừ (`-10%`), chỉ quy đổi phần trăm thực thay đổi (`actualDeltaPercent`) sang số phút để không cộng/trừ dư (`E03`).
- **Dynamic Glow CSS Variables (`D03`, `F02`):** `computeGlowStyle` sinh các biến `--bar-percent`, `--glow-blur`, `--glow-spread`, `--glow-opacity`, `--milestone-tier` (`0`, `25`, `50`, `75`, `100`) gắn trực tiếp lên `.master-card`.
- **Chống trôi giờ Focus Timer (`C03`, `E06`):** `timer.js` tính thời gian còn lại bằng `endTimeMs - nowMs` và lưu `remainingMsWhenPaused` khi tạm dừng.
- **Dự báo Ngày Đích (ETA) 7 ngày (`forecastProjectCompletion`):** Lấy tổng phút tích lũy (hoặc tổng % tăng thêm) trong 7 ngày gần nhất chia cho số ngày chạy để ra tốc độ trung bình/ngày, từ đó tính số ngày còn lại đến 100%. Khi dự án ở 0% hoặc bị trừ lùi tiến độ, tốc độ được trừ khử chính xác để không sinh ngày ảo.
- **Cảnh báo Đóng Băng $\ge 3$ ngày (`checkProjectFrozen`):** Tự động phát hiện các dự án chưa đạt 100% và không có tiến độ mới (`lastProgressAt`) từ 3 ngày trở lên để gắn nhãn nhắc nhở viền nguội.
- **Chuỗi Giữ Lửa (Streak) & Heatmap 28 ngày (`calculateStreakAndHeatmap`):** Theo dõi `activityLog` theo từng ngày (`YYYY-MM-DD`), tính chuỗi liên tiếp lùi từ hôm nay/hôm qua và vẽ lưới 28 ô mật độ năng lượng.
- **Hệ Thống Hoàn Tác Đa Tầng (Undo Stack):** Ngăn xếp lưu ảnh chụp trạng thái (`MAX_UNDO_DEPTH = 30`), hỗ trợ phím tắt `Ctrl + Z`, nút Undo Top-bar và nút Hoàn tác ngay trên Toast.
- **Đồng Bộ Đa Thiết Bị Pull-Before-Push & Union Merge (`M08`):** Luôn kéo dữ liệu đám mây về trước khi cho phép đẩy lên, hợp nhất danh sách dự án cả 2 máy (Union) và dùng mảng `deletedProjectIds` (Tombstones) để xóa dứt điểm dự án trên mọi thiết bị.

## B3. Thành phần đã hoàn thành

| Module / Hàm | Chức năng | File | Trạng thái | Ghi chú |
|---|---|---|---|---|
| `M01` (`index.html`) | Giao diện Neo-Brutalist Positivus & OLED Dark, 3 Dialog Modals, Bộ lọc 3 tab, Heatmap | `index.html` | ✅ | Hỗ trợ Desktop 2 cột & Mobile 1 cột |
| `M02` (`manifest.json`, `sw.js`) | Đóng gói PWA, Offline Cache `v5` (Network-First) | `manifest.json`, `sw.js` | ✅ | Chuẩn `standalone`, không chặn luồng Firestore |
| `M03` (`main.css`) | Dark Glow UI, Accordion, OLED Dark Theme, Animation Milestone | `src/styles/main.css` | ✅ | Hiệu ứng `energyPulse` ở mốc 75% & 100% |
| `M04` (`models.js`) | `createProject`, `createSubTask`, `validateProject`, `formatDateKey` | `src/core/models.js` | ✅ | Đạt 3/3 test (`IN01`, `IN02`, `E01`, `E02`) |
| `M05` (`calculator.js`) | Tính toán Fixed & Time Pool, Nút cộng/trừ nhanh, Level Up, Sửa tại chỗ, Kéo thả, Ghim, Lưu trữ, Nhân bản, Cảnh báo đóng băng $\ge 3$ ngày, Dự báo ETA, Streak & Heatmap | `src/core/calculator.js` | ✅ | Đạt 6/6 test (`AC01`–`AC03`, `AC05`, tính bất biến `R102`) |
| `M06` (`glow.js`) | `computeGlowStyle`, `resolveMilestoneTier` | `src/core/glow.js` | ✅ | Đạt 1/1 test (`AC06`) |
| `M07` (`timer.js`) | `createTimerState`, `getTimerSnapshot`, `pauseTimer`, `resumeTimer` | `src/core/timer.js` | ✅ | Đạt 1/1 test (`AC04`, `E06`) |
| `M08` (`sync.js`) | `saveLocalState`, `loadLocalState`, `mergeRemoteState` (Union + Tombstones), `initCloudSync`, `pullNow` | `src/services/sync.js` | ✅ | Đạt 3/3 test (`AC08`, `C05`, `E07`, Union merge) |
| `M09` (`app.js`) | Điều phối DOM, Sự kiện Accordion, Toast đơn không cộng dồn, Undo `Ctrl + Z`, XSS Sanitizer | `src/ui/app.js` | ✅ | Đạt test chống XSS (`R104`, `AC07`) |

## B4. Lưu ý quan trọng & Bẫy đã gặp (L..)

- **L01 — Môi trường chạy ES Modules:** Dùng `tests/test-harness.js` kết hợp `tests/runner.html` và `tests/run-all.js` để bộ kiểm thử chạy được trên cả trình duyệt thực tế (Chromium V8) lẫn Node.js (`node --test` / `node tests/run-all.js`) mà không phụ thuộc thư viện ngoài.
- **L02 — Quyền truy cập ổ đĩa ảo Google Drive (`G:\My Drive`) trong Sandbox:** Khi chạy server cục bộ `python -m http.server` trên thư mục Google Drive của Windows, cần chạy bên ngoài AppContainer sandbox để socket loopback và quyền đọc file hoạt động trơn tru.
- **L03 — Nguyên tắc Pull-Before-Push & Union Merge khi đồng bộ nhiều thiết bị (`sync.js`):** Khi một thiết bị (như điện thoại) mở web muộn hơn sau khi máy tính đã thêm dự án, tuyệt đối không gọi `pushState(appState)` trước khi kéo dữ liệu từ Firestore (`pullNow()`), đồng thời `mergeRemoteState` phải hợp nhất (Union) danh sách `projects` từ cả hai phía kèm `deletedProjectIds` (Tombstones) và dùng `lastWriteId` thay vì so sánh đồng hồ hệ thống giữa các máy.
- **L04 — Bẫy Focus Timer khi có Undo & nhiều thiết bị:** (1) Ảnh chụp Undo có thể chứa phiên timer đã hết giờ → khi khôi phục phải bỏ `activeTimer` đó, nếu không đồng hồ tự hoàn tất và cộng phút lần nữa. (2) `activeTimer = null` là dữ liệu hợp lệ khi merge — không dùng `??` để rơi về timer cục bộ. (3) Mã nhật ký phiên phải cố định theo phiên (`tlog_<startedAtMs>_<subTaskId>`) để 2 máy cùng hoàn tất không cộng đôi. (4) Nút "Hoàn tất" giữa chừng chỉ cộng số phút thực tế đã trôi qua.
- **L05 — Không render lại khi dữ liệu đám mây không đổi:** `onRemoteUpdate` so sánh `computeStateSignature` trước/sau merge; chỉ render & hiện toast khi có thay đổi thật, tránh xóa chữ người dùng đang gõ dở trong form sửa tại chỗ.

## B5. Lịch sử phiên bản & Mốc khôi phục (V..)

- **V0.0 — Khởi tạo Bản vẽ Hệ thống · `2026-11-07`**
  - **Đạt được:** Điền hoàn chỉnh Phần B cho `docs/Spec.md`, `docs/Archi.md`, `.agent/rules/Rules.md`, `.agent/workflows/Plan.md`.

### V1.0 — Hoàn thiện Toàn bộ Hệ thống GlowBar Tracker PWA · `2026-11-07` · (sau task T1.1 → T5.1)
- **Đạt được:** Hoàn thành 100% các tính năng `F01`–`F12`: Hệ thống thanh năng lượng phân cấp Master-bar & Sub-bar, hiệu ứng Dynamic Glow & Milestone (`25/50/75/100%`), Accordion mượt mà, 2 chế độ tính toán (`fixed` & `time_pool`), nâng cấp mục tiêu `Level Up`, bộ đếm `Focus Timer` chống trôi giờ, đồng bộ đám mây thời gian thực `Firebase Firestore` + `LocalStorage` và đóng gói `PWA`.
- **File thay đổi:** `index.html`, `manifest.json`, `sw.js`, `package.json`, `src/styles/main.css`, `src/core/models.js`, `src/core/calculator.js`, `src/core/glow.js`, `src/core/timer.js`, `src/services/sync.js`, `src/ui/app.js`, `tests/*.test.js`, `tests/runner.html`.
- **Trạng thái thành phần:** Tất cả các module `M01`–`M09` hoạt động đồng bộ, tuân thủ tuyệt đối `R101`–`R104`.
- **Kết quả kiểm thử:** **12/12 PASS** (`AC01`–`AC09`, `E01`–`E07`, `R102`–`R104`).
- **Điểm khôi phục:** Thư mục gốc `g:\My Drive\Bar_Project` phiên bản `1.0.0`.

### V2.0 — Tái Thiết Kế Positivus Neo-Brutalist & Hệ Thống Hoàn Tác · `2026-11-07`
- **Đạt được:** Giao diện Positivus Agency Style (Lime `#b9ff66`, Slate `#191a23`, hard shadows `0px 5px 0px #191a23`), tự động tương phản màu thanh năng lượng (`#7c3aed` / `#2563eb`), hệ thống hoàn tác đa tầng `Ctrl + Z`, nút Undo trên Top-bar, nút Undo trên Toast và nút `-10%` cho từng đầu việc. Triển khai thành công lên GitHub Pages và kết nối Firestore đám mây.
- **File thay đổi:** `index.html`, `src/styles/main.css`, `src/ui/app.js`, `src/core/calculator.js`.

### V2.1 — Bộ Công Cụ Quản Lý Nâng Cao, Động Lực Thị Giác & Phân Tích Tiến Độ · `2026-11-08`
- **Đạt được:** Sửa tại chỗ (Inline Edit) qua double click; kéo thả HTML5 `⠿` và nút `↑`/`↓`; đính kèm ghi chú nhanh và nhận diện link; ghim tối đa 3 dự án trọng tâm; ngăn lưu trữ Archive; nhân bản mẫu dự án; chuyển đổi giao diện đêm OLED Dark; chuỗi giữ lửa Streak & lưới 28 ô Heatmap; cảnh báo đóng băng ($\ge 3$ ngày); dự báo ngày hoàn thành (ETA); nhật ký phiên Focus Timer; nhập file JSON 2 chiều.
- **File thay đổi:** `src/core/models.js`, `src/core/calculator.js`, `src/services/sync.js`, `src/ui/app.js`, `src/styles/main.css`, `index.html`, `sw.js`, `tests/calculator.test.js`.
- **Kết quả kiểm thử:** **14/14 PASS** trên V8 Chromium Headless.
- **Điểm khôi phục:** Commit Git `008cb5e` trên nhánh `main`.

### V2.2 — Khắc Phục Đồng Bộ Đa Thiết Bị (Pull-Before-Push & Union Merge) & Tối Ưu UX · `2026-11-12`
- **Đạt được:** Cố định vị trí nút `+10%` bằng cách đưa `-10%` ra sau nút Hoàn thành; loại bỏ cộng dồn popup Toast (chỉ hiển thị duy nhất thông báo mới nhất); sửa lỗi mất đồng bộ khi mở web trên điện thoại muộn hơn máy tính bằng cơ chế Pull-Before-Push (`pullNow()` dùng `getDocFromServer`), hợp nhất Union danh sách `projects` kèm `deletedProjectIds`, tự động đồng bộ lại khi mở lại tab (`visibilitychange` / `online`), và nâng cấp `sw.js` lên `v5` (Network-First + không can thiệp kết nối ngoại vi Firestore).
- **File thay đổi:** `src/services/sync.js`, `src/ui/app.js`, `index.html`, `sw.js`, `tests/sync.test.js`.
- **Kết quả kiểm thử:** **15/15 PASS** trên V8 Chromium Headless.
- **Điểm khôi phục:** Commit Git `dd4c8f4` (+ `f552f4b` tinh chỉnh ETA) trên nhánh `main`.

### V2.3 — Rà Soát Toàn Dự Án: Gia Cố Focus Timer & Đồng Bộ, Báo Hiệu Hết Phiên · `2026-11-12` · (sau task T8.1)
- **Sửa lỗi:** (1) Nút "Hoàn tất & Nhích Bar" giữa chừng cộng nguyên 25 phút → nay chỉ cộng số phút thực tế. (2) Undo sau khi hết phiên làm đồng hồ tự hoàn tất & cộng phút lần 2. (3) Phiên đã kết thúc trên máy A bị hồi sinh trên máy B khi merge. (4) Hai máy cùng hoàn tất 1 phiên bị cộng đôi nhật ký. (5) Đầu việc bị xóa khi đang bấm giờ vẫn ghi nhận phút ảo. (6) Mỗi lần mở lại tab đều render lại + hiện toast đồng bộ dù không có gì đổi (có thể xóa chữ đang gõ); nhận diện echo Firestore chỉ nhớ 1 mã ghi.
- **Tính năng mới:** Chuông 3 tiếng (Web Audio) + rung + thông báo hệ thống khi hết phiên; đồng hồ đếm ngược trên tiêu đề tab (`⏱ 12:34 · GlowBar`); nút "🔄 Đồng bộ ngay" luôn có phản hồi (đã khớp / mất mạng / đã đẩy lên).
- **File thay đổi:** `src/ui/app.js`, `src/services/sync.js`, `sw.js` (`v6`), `tests/sync.test.js`.
- **Kết quả kiểm thử:** **17/17 PASS** + smoke test `index.html` (2 thẻ render, 0 lỗi JS).
