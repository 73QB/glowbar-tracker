<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN A · KHUNG CỐ ĐỊNH — Dùng chung cho MỌI dự án. KHÔNG CHỈNH SỬA ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

# 🗺️ Plan.md — Lộ trình & Nhật ký tiến độ động (Làm theo thứ tự nào?)

## A1. Thẻ định danh

| Thuộc tính | Giá trị |
|---|---|
| **Vị trí** | `.agent/workflows/Plan.md` |
| **Vai trò** | Danh sách task theo thứ tự + ghi chú nghiệm thu của từng task đã xong. Là **"điểm lưu game"** giúp AI phiên sau biết chính xác đã làm đến đâu mà không cần đọc lại lịch sử chat. |
| **Thứ bậc ưu tiên** | Bậc 5 |
| **Ai được sửa** | Người dùng. AI chỉ ghi khi được cho phép, theo khối mẫu ở bước 03. |
| **Mức độ thay đổi** | Cao — cập nhật sau mỗi task. |

## A2. Liên kết với các file khác

| File | Quan hệ với `Plan.md` |
|---|---|
| `docs/Spec.md` | Mỗi task trỏ về `F..` mà nó phục vụ (trường *Phục vụ*). |
| `docs/Archi.md` | *File tác động* phải là module `M..` đã khai báo. |
| `01_context_plan.md` | Đọc Plan để chọn task `[ ]` đầu tiên và hiểu trạng thái `src/` qua ghi chú nghiệm thu. |
| `03_verify_check.md` | Sinh ra khối cập nhật `[x]` + ghi chú nghiệm thu cho task vừa PASS. |
| `ai_learning.md` | Plan là **lộ trình & checklist**; ai_learning là **ảnh chụp trạng thái kỹ thuật** + mốc khôi phục `V..`. Không chép trùng. |

## A3. Quy ước trạng thái

| Ký hiệu | Ý nghĩa |
|---|---|
| `[ ]` | Chưa làm |
| `[~]` | Đang làm trong phiên hiện tại |
| `[x]` | Đã PASS 3 lớp & người dùng xác nhận (`R10`) |
| `[!]` | Bị chặn — ghi rõ lý do và điều kiện mở khóa |

## A4. Quy tắc dành cho AI khi dùng file này

1. Task cần làm = mục `[ ]` (hoặc `[~]`) **đầu tiên** từ trên xuống, trừ khi người dùng chỉ định khác (`R01`).
2. Đọc *Ghi chú nghiệm thu* của các mục `[x]` để biết hàm/biến/trạng thái đã có — không viết lại.
3. Không tự sắp xếp lại thứ tự, không tự thêm/xóa task. Thấy cần tách/gộp task → đề xuất.
4. Mỗi task phải đủ nhỏ để hoàn thành trọn vòng 01 → 02 → 03 trong một phiên.

## A5. Khuôn mẫu task

```markdown
- [ ] **T<giai đoạn>.<số> — <Tên task>**
  - *Phục vụ:* F..
  - *File tác động:* `src/...` (M..)
  - *Mục tiêu:* <hàm/chức năng cần hoàn thành>

- [x] **T<giai đoạn>.<số> — <Tên task>**
  - *Phục vụ:* F..   ·   *File tác động:* `src/...` (M..)
  - *Ghi chú nghiệm thu:* <đã làm gì> · <test chứng minh: AC../E..> · <đầu ra/biến để task sau dùng>
```

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║                         HẾT PHẦN A                               ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

---

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN B · NỘI DUNG DỰ ÁN — Người dùng tự viết cho từng dự án       ║
     ║ Dùng khuôn mẫu ở mục A5. Xóa các dòng [placeholder] khi điền.     ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

## Giai đoạn 1: Lõi Dữ liệu & Động cơ Tính toán Tiến độ (Core Engine)

- [x] **T1.1 — Khởi tạo Mô hình Dữ liệu & Hàm Kiểm tra Hợp lệ (`models.js`)**
  - *Phục vụ:* F01, IN01, IN02, E01, E02   ·   *File tác động:* `src/core/models.js` (M04), `tests/models.test.js`
  - *Ghi chú nghiệm thu:* Đã hoàn thiện `clampAndRound`, `createSubTask`, `createProject`, `validateProject` · Test chứng minh: `IN01`, `IN02`, `E01`, `E02`, `R103` (3/3 PASS) · Đầu ra: Các hằng số mặc định và hàm khởi tạo bất biến cho M05–M09.

- [x] **T1.2 — Động cơ Tính toán 2 Chế độ (Fixed & Time Pool) và Nâng cấp Mục tiêu (`calculator.js`)**
  - *Phục vụ:* F05, F06, F07, F09, F10, C02, E01–E05, AC01–AC03, AC05   ·   *File tác động:* `src/core/calculator.js` (M05), `tests/calculator.test.js`
  - *Ghi chú nghiệm thu:* Đã hoàn thiện `calculateMasterProgress`, `applyQuickAction`, `applyTimerMinutes`, `levelUpProject` · Test chứng minh: `AC01`, `AC02`, `AC03`, `AC05`, `C02`, `E01`–`E05`, `R102` (4/4 PASS) · Đầu ra: Bộ hàm tính toán tiến độ kép và Level Up.

- [x] **T1.3 — Động cơ Ánh sáng Động & Cấp độ Milestone (`glow.js`)**
  - *Phục vụ:* F02, OUT02, AC06   ·   *File tác động:* `src/core/glow.js` (M06), `tests/glow.test.js`
  - *Ghi chú nghiệm thu:* Đã hoàn thiện `resolveMilestoneTier` và `computeGlowStyle` sinh biến CSS động `--bar-percent`, `--glow-blur`, `--glow-spread`, `--glow-opacity` · Test chứng minh: `AC06`, `F02` (1/1 PASS).

## Giai đoạn 2: Bộ đếm Focus Timer Chống Trôi Giờ

- [x] **T2.1 — Bộ đếm Focus Timer dựa trên Timestamp (`timer.js`)**
  - *Phục vụ:* F08, F09, C03, E06, AC04   ·   *File tác động:* `src/core/timer.js` (M07), `tests/timer.test.js`
  - *Ghi chú nghiệm thu:* Đã hoàn thiện `createTimerState`, `getTimerSnapshot`, `pauseTimer`, `resumeTimer` dựa trên `endTimeMs` chống trôi giờ khi ẩn tab · Test chứng minh: `AC04`, `C03`, `E06` (1/1 PASS).

## Giai đoạn 3: Lưu trữ Offline-first & Đồng bộ Đám mây Firebase

- [x] **T3.1 — Dịch vụ Lưu trữ Cục bộ & Đồng bộ Thời gian thực Firestore (`sync.js`)**
  - *Phục vụ:* F11, IN04, OUT04, C01, C05, E07, AC08   ·   *File tác động:* `src/services/sync.js` (M08), `tests/sync.test.js`
  - *Ghi chú nghiệm thu:* Đã hoàn thiện `saveLocalState`, `loadLocalState`, `mergeRemoteState` (Last-Write-Wins theo `updatedAt`) và `initCloudSync` (Firestore `onSnapshot`) · Test chứng minh: `AC08`, `C05`, `E07` (2/2 PASS).

## Giai đoạn 4: Giao diện Thanh Năng Lượng Phát Sáng & Điều phối Tương tác

- [x] **T4.1 — Khung HTML5 & Hệ thống Giao diện Dark Glow, Accordion, Responsive (`index.html`, `main.css`)**
  - *Phục vụ:* F01, F02, F03, F04, C04, AC07   ·   *File tác động:* `index.html` (M01), `src/styles/main.css` (M03)
  - *Ghi chú nghiệm thu:* Đã xây dựng giao diện nền tối tương phản cao (`#06080f`), hiệu ứng phát sáng động theo biến CSS, hiệu ứng nhịp thở ánh sáng ở mốc `75%`/`100%`, Accordion trượt mượt bằng CSS Grid `0fr -> 1fr` và bố cục thích ứng Desktop 2 cột / Mobile 1 cột (`>= 44px` touch target).

- [x] **T4.2 — Điều phối Giao diện: Quản lý Dự án, Accordion, Nút Cộng Nhanh & Level Up (`app.js` - Phần 1)**
  - *Phục vụ:* F01, F03, F05, F06, F07, F10, AC01–AC03, AC05, AC07   ·   *File tác động:* `src/ui/app.js` (M09), `tests/ui.test.js`
  - *Ghi chú nghiệm thu:* Đã hoàn thiện `renderDashboard`, `toggleAccordion`, `escapeHtml` (chống XSS `R104`), thao tác CRUD dự án/việc nhỏ, nút cộng nhanh `+10%`, `+25%`, `Hoàn thành` và hộp thoại Level Up · Test chứng minh: `AC07`, `R104` (1/1 PASS).

- [x] **T4.3 — Điều phối Giao diện: Focus Timer Trực tiếp & Cài đặt Đồng bộ Đám mây (`app.js` - Phần 2)**
  - *Phục vụ:* F08, F09, F11, AC04, AC08   ·   *File tác động:* `src/ui/app.js` (M09)
  - *Ghi chú nghiệm thu:* Đã tích hợp trạm Focus Timer (15p/25p/45p/60p, Tạm dừng/Tiếp tục, Hoàn tất & Nhích Bar, Tua nhanh +5p để test) và Modal cấu hình Firebase Firestore + Xuất JSON sao lưu.

## Giai đoạn 5: Đóng gói Ứng dụng Độc lập (PWA) & Sẵn sàng Triển khai

- [x] **T5.1 — Đóng gói PWA (`manifest.json`, `sw.js`) & Kiểm thử Toàn diện**
  - *Phục vụ:* F12, C01, C05, AC09   ·   *File tác động:* `manifest.json` (M02), `sw.js` (M02), `index.html` (M01)
  - *Ghi chú nghiệm thu:* Đã hoàn thiện `manifest.json` (`display: standalone`, biểu tượng vector `192x192` & `512x512`) và Service Worker `sw.js` cache toàn bộ tài nguyên tĩnh · Kiểm thử toàn diện 12/12 test cases đạt PASS trên V8 Chromium.

## Giai đoạn 6: Tái thiết Kế Giao diện Positivus & Hệ thống Hoàn tác Đa tầng

- [x] **T6.1 — Phong cách Neo-Brutalist Positivus & Tương phản Thanh Năng Lượng**
  - *Phục vụ:* F01–F04, AC07   ·   *File tác động:* `src/styles/main.css` (M03), `src/ui/app.js` (M09)
  - *Ghi chú nghiệm thu:* Màu Lime `#B9FF66`, Dark Slate `#191A23`, viền đen dày, hard shadow `0px 5px 0px #191A23`, phông Space Grotesk. Tự động chuyển màu thanh năng lượng sang Tím `#7C3AED` và Lam `#2563EB` tránh trùng màu nền thẻ khi mở rộng.

- [x] **T6.2 — Hệ thống Hoàn tác Đa tầng (Undo / Rollback Engine)**
  - *Phục vụ:* F10, R102   ·   *File tác động:* `src/ui/app.js` (M09), `src/core/calculator.js` (M05)
  - *Ghi chú nghiệm thu:* Phím tắt `Ctrl + Z`, nút hoàn tác trên Top-bar, nút Undo trên Toast và nút `-10%` trên từng đầu việc nhỏ.

- [x] **T6.3 — Triển khai GitHub Pages & Đồng bộ Đám mây Firebase Trực tiếp**
  - *Phục vụ:* F11, F12   ·   *File tác động:* Kho GitHub `https://github.com/73QB/glowbar-tracker.git`
  - *Ghi chú nghiệm thu:* Website trực tuyến qua GitHub Pages (`https://73qb.github.io/glowbar-tracker/`), kết nối cơ sở dữ liệu Firebase Firestore thời gian thực hai chiều giữa Máy tính và Điện thoại.

## Giai đoạn 7: Bộ Công cụ Quản lý Nâng cao, Thị giác Động lực & Phân tích Dữ liệu

- [x] **T7.1 — Sửa tại chỗ (Inline Edit), Kéo thả Sắp xếp & Ghi chú Nhanh**
  - *Phục vụ:* Quản lý linh hoạt   ·   *File tác động:* `src/core/calculator.js`, `src/ui/app.js`, `src/styles/main.css`
  - *Ghi chú nghiệm thu:* Double-click sửa tên dự án, quỹ giờ, tên việc, trọng số, số phút tại chỗ; kéo thả HTML5 `⠿` và nút `↑`/`↓`; đính kèm ghi chú nhanh và tự nhận diện link an toàn.

- [x] **T7.2 — Ghim Trọng tâm, Ngăn Lưu trữ & Nhân bản Mẫu Dự án**
  - *Phục vụ:* Tối ưu không gian   ·   *File tác động:* `src/core/calculator.js`, `src/ui/app.js`, `src/styles/main.css`
  - *Ghi chú nghiệm thu:* Thanh lọc 3 tab (`Đang chạy`, `Đã ghim (tối đa 3)`, `Lưu trữ`); nhân bản cấu trúc dự án mẫu với tiến độ reset về 0%.

- [x] **T7.3 — Chế độ Đêm OLED Dark, Chuỗi Giữ Lửa Heatmap & Cảnh báo Đóng băng $\ge$ 3 Ngày**
  - *Phục vụ:* Thị giác & Động lực   ·   *File tác động:* `src/core/calculator.js`, `src/ui/app.js`, `src/styles/main.css`
  - *Ghi chú nghiệm thu:* Toggle nút OLED Dark; tính chuỗi Streak và vẽ lưới 28 ô Heatmap 5 cấp độ; tự động gắn nhãn và viền băng giá khi dự án bị bỏ quên $\ge 3$ ngày.

- [x] **T7.4 — Dự báo Ngày Đích (ETA), Nhật ký Giờ Focus Timer & Nhập File JSON 2 Chiều**
  - *Phục vụ:* Phân tích & Dữ liệu   ·   *File tác động:* `src/core/calculator.js`, `src/ui/app.js`, `index.html`
  - *Ghi chú nghiệm thu:* Tự động tính ngày hoàn thành dựa trên tiến độ 7 ngày; thống kê phút hôm nay, tuần và top dự án; nhập file JSON khôi phục dữ liệu trực tiếp. Bộ test tự động đạt 14/14 PASS.

## Giai đoạn 8: Bảo trì, Gia cố Đồng bộ & Focus Timer

- [x] **T8.1 — Rà soát toàn dự án: gia cố Focus Timer, đồng bộ đa thiết bị & báo hiệu hết phiên**
  - *Phục vụ:* F08, F09, F11, E06, E07, AC04, AC08   ·   *File tác động:* `src/ui/app.js` (M09), `src/services/sync.js` (M08), `sw.js` (M02), `tests/sync.test.js`
  - *Ghi chú nghiệm thu:* Sửa 6 lỗi (cộng phút sai khi Hoàn tất giữa chừng, Undo cộng đôi, timer hồi sinh khi merge, cộng đôi nhật ký đa thiết bị, ghi phút cho việc đã xóa, render/toast thừa khi đồng bộ) · Thêm chuông + rung + thông báo hết phiên, đếm ngược trên tiêu đề tab · Test: 17/17 PASS (thêm 2 test E06/E07).
