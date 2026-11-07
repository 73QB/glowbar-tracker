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
| **Phiên bản hiện tại** | `V1.0` (Hoàn thiện toàn bộ dự án `T1.1` → `T5.1`) |
| **Task vừa hoàn thành** | `T5.1 — Đóng gói PWA (manifest.json, sw.js) & Kiểm thử Toàn diện` |
| **Task kế tiếp** | *(Đã hoàn thành 100% lộ trình trong Plan.md)* |
| **Tình trạng build / test** | ✅ **12/12 Test Cases PASS** (Kiểm chứng thực tế trên V8 Chromium & HTTP Server) |
| **Cập nhật lần cuối** | `2026-11-07` |

## B2. Kiến thức kỹ thuật cốt lõi đang áp dụng

> Cấu hình, thông số, công thức, thuật toán, đặc thù phần cứng/thư viện mà code hiện tại phụ thuộc vào.

- **Kiến trúc Pure Core (`D01`):** Toàn bộ các module trong `src/core/` (`models.js`, `calculator.js`, `glow.js`, `timer.js`) là hàm thuần khiết bất biến (`R102`), kiểm thử tự động qua `tests/runner.html` và `tests/run-all.js`.
- **Công thức 2 chế độ tính toán (`F05`, `F06`, `D02`):**
  - *Fixed Mode:* Trung bình có trọng số $\frac{\sum w_i \cdot p_i}{\sum w_i}$, tự động trả về `0%` khi danh sách rỗng hoặc tổng trọng số $\le 0$ (`E01`).
  - *Time Pool Mode:* Tính theo $\min(100, \frac{\sum t_{\text{spent}}}{T_{\text{target}} \times 60} \times 100)$, đảm bảo thêm việc mới không làm tụt phần trăm (`C02`). Khi bấm nút cộng nhanh (`+10%`, `+25%`, `100%`), chỉ quy đổi phần trăm thực tăng thêm (`actualDeltaPercent`) sang số phút để không cộng dư (`E03`).
- **Dynamic Glow CSS Variables (`D03`, `F02`):** `computeGlowStyle` sinh các biến `--bar-percent`, `--glow-blur`, `--glow-spread`, `--glow-opacity`, `--milestone-tier` (`0`, `25`, `50`, `75`, `100`) gắn trực tiếp lên `.master-card`.
- **Chống trôi giờ Focus Timer (`C03`, `E06`):** `timer.js` tính thời gian còn lại bằng `endTimeMs - nowMs` và lưu `remainingMsWhenPaused` khi tạm dừng.

## B3. Thành phần đã hoàn thành

| Module / Hàm | Chức năng | File | Trạng thái | Ghi chú |
|---|---|---|---|---|
| `M01` (`index.html`) | Giao diện chính & Modals | `index.html` | ✅ | Hỗ trợ Desktop 2 cột & Mobile 1 cột |
| `M02` (`manifest.json`, `sw.js`) | Đóng gói PWA & Offline Cache | `manifest.json`, `sw.js` | ✅ | Chuẩn `standalone`, cache tài nguyên tĩnh |
| `M03` (`main.css`) | Dark Glow UI, Accordion, Responsive | `src/styles/main.css` | ✅ | Hiệu ứng `energyPulse` ở mốc 75% & 100% |
| `M04` (`models.js`) | `createProject`, `createSubTask`, `validateProject` | `src/core/models.js` | ✅ | Đạt 3/3 test (`IN01`, `IN02`, `E01`, `E02`) |
| `M05` (`calculator.js`) | `calculateMasterProgress`, `applyQuickAction`, `applyTimerMinutes`, `levelUpProject` | `src/core/calculator.js` | ✅ | Đạt 4/4 test (`AC01`–`AC03`, `AC05`) |
| `M06` (`glow.js`) | `computeGlowStyle`, `resolveMilestoneTier` | `src/core/glow.js` | ✅ | Đạt 1/1 test (`AC06`) |
| `M07` (`timer.js`) | `createTimerState`, `getTimerSnapshot`, `pauseTimer`, `resumeTimer` | `src/core/timer.js` | ✅ | Đạt 1/1 test (`AC04`, `E06`) |
| `M08` (`sync.js`) | `saveLocalState`, `loadLocalState`, `mergeRemoteState`, `initCloudSync` | `src/services/sync.js` | ✅ | Đạt 2/2 test (`AC08`, `C05`, `E07`) |
| `M09` (`app.js`) | `initApp`, `renderDashboard`, `toggleAccordion`, `escapeHtml` | `src/ui/app.js` | ✅ | Đạt test chống XSS (`R104`, `AC07`) |

## B4. Lưu ý quan trọng & Bẫy đã gặp (L..)

- **L01 — Môi trường chạy ES Modules:** Dùng `tests/test-harness.js` kết hợp `tests/runner.html` và `tests/run-all.js` để bộ kiểm thử chạy được trên cả trình duyệt thực tế (Chromium V8) lẫn Node.js (`node --test` / `node tests/run-all.js`) mà không phụ thuộc thư viện ngoài.
- **L02 — Quyền truy cập ổ đĩa ảo Google Drive (`G:\My Drive`) trong Sandbox:** Khi chạy server cục bộ `python -m http.server` trên thư mục Google Drive của Windows, cần chạy bên ngoài AppContainer sandbox để socket loopback và quyền đọc file hoạt động trơn tru.

## B5. Lịch sử phiên bản & Mốc khôi phục (V..)

- **V0.0 — Khởi tạo Bản vẽ Hệ thống · `2026-11-07`**
  - **Đạt được:** Điền hoàn chỉnh Phần B cho `docs/Spec.md`, `docs/Archi.md`, `.agent/rules/Rules.md`, `.agent/workflows/Plan.md`.

### V1.0 — Hoàn thiện Toàn bộ Hệ thống GlowBar Tracker PWA · `2026-11-07` · (sau task T1.1 → T5.1)
- **Đạt được:** Hoàn thành 100% các tính năng `F01`–`F12`: Hệ thống thanh năng lượng phân cấp Master-bar & Sub-bar, hiệu ứng Dynamic Glow & Milestone (`25/50/75/100%`), Accordion mượt mà, 2 chế độ tính toán (`fixed` & `time_pool`), nâng cấp mục tiêu `Level Up`, bộ đếm `Focus Timer` chống trôi giờ, đồng bộ đám mây thời gian thực `Firebase Firestore` + `LocalStorage` và đóng gói `PWA`.
- **File thay đổi:** `index.html`, `manifest.json`, `sw.js`, `package.json`, `src/styles/main.css`, `src/core/models.js`, `src/core/calculator.js`, `src/core/glow.js`, `src/core/timer.js`, `src/services/sync.js`, `src/ui/app.js`, `tests/*.test.js`, `tests/runner.html`.
- **Trạng thái thành phần:** Tất cả các module `M01`–`M09` hoạt động đồng bộ, tuân thủ tuyệt đối `R101`–`R104`.
- **Kết quả kiểm thử:** **12/12 PASS** (`AC01`–`AC09`, `E01`–`E07`, `R102`–`R104`).
- **Điểm khôi phục:** Thư mục gốc `g:\My Drive\Bar_Project` phiên bản `1.0.0`.
