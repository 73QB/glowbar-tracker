<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN A · KHUNG CỐ ĐỊNH — Dùng chung cho MỌI dự án. KHÔNG CHỈNH SỬA ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

# 🎯 Spec.md — Đặc tả yêu cầu (Làm cái gì?)

## A1. Thẻ định danh

| Thuộc tính | Giá trị |
|---|---|
| **Vị trí** | `docs/Spec.md` — Bản vẽ tĩnh |
| **Vai trò** | Định nghĩa mục tiêu, tính năng, đầu vào/ra, ràng buộc, phạm vi và tiêu chí nghiệm thu. **Căn cứ số 1** để phán quyết PASS/FAIL về mặt tính năng (Lớp 1). |
| **Thứ bậc ưu tiên** | Bậc 3 (sau lệnh người dùng và `Rules.md`) |
| **Ai được sửa** | Chỉ người dùng. AI chỉ *đề xuất* sửa ở bước 03. |
| **Mức độ thay đổi** | Thấp — chỉ đổi khi yêu cầu nghiệp vụ thay đổi. |

## A2. Liên kết với các file khác

| File | Quan hệ với `Spec.md` |
|---|---|
| `docs/Archi.md` | Hiện thực hóa `F..` bằng công nghệ và module `M..`. Không được mâu thuẫn với `C..`. |
| `.agent/workflows/Plan.md` | Mỗi task `T..` phải trỏ về ít nhất một `F..` mà nó phục vụ. |
| `.agent/workflows/01_context_plan.md` | Dùng `IN/OUT/E..` để thiết kế phương án. |
| `.agent/workflows/03_verify_check.md` | Lớp 1: đối chiếu kết quả với `F/OUT/E/AC..`. |
| `tests/` | Mỗi test case phải gắn mã `AC..` hoặc `E..` mà nó chứng minh. |

## A3. Quy tắc dành cho AI khi dùng file này

1. Mọi đoạn code phải phục vụ ít nhất một `F..`. Code không truy được về `F..` nào = vượt phạm vi (vi phạm `R03`).
2. Mục `X..` là danh sách cấm tuyệt đối — không làm dù thấy "hữu ích".
3. Mỗi `E..` phải được xử lý trong code **và** có test tương ứng trong `tests/`.
4. Nếu Phần B còn placeholder ở mục liên quan đến task hiện tại → hỏi người dùng (`R08`).

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║                         HẾT PHẦN A                               ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

---

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN B · NỘI DUNG DỰ ÁN — Người dùng tự viết cho từng dự án       ║
     ║ Giữ nguyên tiền tố ID (F, IN, OUT, C, E, X, AC) để các file khác  ║
     ║ tham chiếu được. Xóa các dòng [placeholder] khi điền.             ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

## B1. Tổng quan

- **Tên dự án:** GlowBar Tracker — Hệ thống theo dõi tiến độ dự án cá nhân bằng thanh năng lượng phát sáng.
- **Bài toán:** Giúp người dùng quản lý tiến độ dự án cá nhân trực quan, tạo động lực thị giác qua hiệu ứng phát sáng động (Dynamic Glow), hỗ trợ cả dự án đã rõ lộ trình (Fixed Roadmap) lẫn dự án mở tính theo quỹ giờ (Time Pool), tích hợp Focus Timer và đồng bộ thời gian thực miễn phí giữa máy tính và điện thoại.
- **Môi trường chạy:** Trình duyệt Web đa nền tảng (Desktop & Mobile) và ứng dụng độc lập PWA (Progressive Web App) lưu trữ trên GitHub Pages / Firebase Hosting.

## B2. Tính năng (Features)

- **F01 — Hệ thống thanh tiến độ phân cấp (Master-bar & Sub-bar):** Quản lý nhiều dự án lớn (Master-bar), mỗi dự án chứa danh sách các đầu việc nhỏ (Sub-bar) với thao tác CRUD đầy đủ.
- **F02 — Hiệu ứng phát sáng động (Dynamic Glow):** Thanh tiến độ trên nền tối tương phản cao, tự động tăng bán kính và độ rực sáng theo `%` hoàn thành, kích hoạt hiệu ứng đột biến ánh sáng tại các mốc quan trọng (`25%`, `50%`, `75%`, `100%`).
- **F03 — Thu gọn thông minh (Accordion):** Danh sách Sub-bar mặc định ẩn gọn, chỉ xổ xuống/thu lên mượt mà khi bấm vào Master-bar.
- **F04 — Giao diện thích ứng đa thiết bị (Responsive UI):** Bố cục bảng điều khiển rộng trên Desktop và cột dọc thao tác một chạm tối ưu cảm ứng trên Mobile.
- **F05 — Tính toán Chế độ Lộ trình cố định (Fixed Mode):** Gắn trọng số ($w_i > 0$) cho từng Sub-bar; phần trăm Master-bar tự động tính theo trung bình có trọng số của các Sub-bar.
- **F06 — Tính toán Chế độ Quỹ thời gian (Time Pool Mode):** Đặt tổng số giờ mục tiêu ($T_{\text{target}}$); tiến độ Master-bar tính bằng tổng thời gian đã đầu tư chia cho $T_{\text{target}}$, cho phép thêm Sub-bar mới mà không làm tụt `%` tích lũy.
- **F07 — Nâng cấp mục tiêu (Level Up):** Khi chạm `100%` quỹ thời gian nhưng vẫn còn Sub-bar chưa xong, cho phép người dùng cộng thêm giờ mục tiêu (tăng Level dự án) hoặc chuyển sang Chế độ Lộ trình cố định để chốt giai đoạn cuối.
- **F08 — Bộ đếm giờ tập trung (Focus Timer):** Chọn một Sub-bar, đặt thời lượng đếm ngược (Preset 15p/25p/45p/60p hoặc tùy chỉnh), hỗ trợ Bắt đầu / Tạm dừng / Hoàn thành sớm.
- **F09 — Tự động quy đổi & nhích thanh tiến độ:** Ngay khi hoàn thành phiên Focus Timer hoặc đánh dấu xong việc, tự động quy đổi thời gian/điểm vào Sub-bar và Master-bar kèm hiệu ứng nhích thanh và bùng sáng tức thì.
- **F10 — Cập nhật nhanh một chạm (Quick Actions):** Hỗ trợ các nút `+10%`, `+25%`, `Hoàn thành (100%)` trên từng Sub-bar để cập nhật nhanh trên màn hình cảm ứng mà không cần chạy Timer.
- **F11 — Đồng bộ đám mây thời gian thực (Firebase Firestore Sync):** Lưu trữ và đồng bộ tức thì giữa PC và điện thoại qua Firestore `onSnapshot` (kèm bộ đệm `localStorage` khi ngoại tuyến) mà không cần tải lại trang.
- **F12 — Đóng gói PWA (Progressive Web App):** Cung cấp `manifest.json`, Service Worker cache tài nguyên tĩnh và biểu tượng ứng dụng để ghim ra màn hình chính điện thoại chạy độc lập.

## B3. Đầu vào & Đầu ra

- **IN01 — Thông tin Dự án (Master-bar):** Tên dự án, chế độ tính (`fixed` | `time_pool`), tổng số giờ mục tiêu `targetHours` (nếu `time_pool`), cấp độ hiện tại `level` (mặc định `1`), màu chủ đạo `themeColor`.
- **IN02 — Thông tin Đầu việc (Sub-bar):** Tên việc, trọng số `weight` (mặc định `1`), thời lượng dự kiến `estimatedMinutes` (mặc định `60`), tiến độ `progressPercent` (`0..100`), thời gian đã tích lũy `spentMinutes`.
- **IN03 — Tương tác Tiến độ & Timer:** Lệnh bấm nút nhanh (`+10%`, `+25%`, `100%`), cấu hình phiên đếm ngược (`durationMinutes`) và sự kiện kết thúc phiên làm việc.
- **IN04 — Cấu hình Đám mây:** Thông số kết nối Firebase (`apiKey`, `projectId`, `appId`) và mã phòng đồng bộ cá nhân (`syncKey`).
- **OUT01 — Chỉ số Tiến độ:** Phần trăm hoàn thành chính xác (`0.0%` – `100.0%`) của từng Sub-bar và Master-bar, số giờ đã tích lũy / mục tiêu.
- **OUT02 — Tín hiệu Thị giác (Glow Parameters):** Giá trị CSS động (`--bar-percent`, `--glow-blur`, `--glow-spread`, `--glow-opacity`, `--milestone-tier`) phản ánh đúng tiến độ.
- **OUT03 — Trạng thái Level Up:** Cờ kích hoạt `isLevelUpReady = true` khi dự án ở chế độ `time_pool` đạt `100%` nhưng còn ít nhất 1 Sub-bar có `progressPercent < 100`.
- **OUT04 — Trạng thái Đồng bộ:** Dữ liệu JSON chuẩn hóa đồng bộ tức thì giữa `localStorage` và Firestore collection.

## B4. Ràng buộc (Constraints)

- **C01 — Chi phí 0 đồng (100% Free Tier):** Chỉ sử dụng công nghệ miễn phí trọn đời (Firebase Spark Plan, GitHub Pages/Firebase Hosting, không dùng API trả phí).
- **C02 — Không tụt tiến độ ở chế độ Quỹ thời gian:** Khi thêm mới một Sub-bar trong chế độ `time_pool`, phần trăm hiện tại của Master-bar tuyệt đối không được giảm.
- **C03 — Độ chính xác của Timer nền:** Bộ đếm giờ phải dựa trên mốc thời gian thực (`Date.now()` / `endTime`), không phụ thuộc hoàn toàn vào việc cộng dồn `setInterval` để tránh trôi giờ khi trình duyệt điện thoại ẩn tab hoặc khóa màn hình.
- **C04 — Tương phản thị giác & Mượt mà:** Nền tối sâu (`#07090E` – `#0F141C`), hiệu ứng chuyển động đạt 60fps bằng CSS transition, vùng chạm nút trên điện thoại tối thiểu `44x44px`.
- **C05 — Hoạt động Offline-first:** Ứng dụng phải dùng được bình thường với `localStorage` ngay cả khi người dùng chưa nhập cấu hình Firebase hoặc mất kết nối Internet.

## B5. Trường hợp biên (Edge cases)

- **E01 — Dự án chưa có Sub-bar hoặc tổng trọng số bằng 0:** Nếu danh sách Sub-bar rỗng hoặc tổng trọng số $\le 0$, phần trăm Master-bar trả về `0%` (tránh lỗi chia cho `0` ra `NaN`/`Infinity`).
- **E02 — Quỹ thời gian mục tiêu không hợp lệ:** Nếu người dùng nhập `targetHours <= 0` ở chế độ `time_pool`, hệ thống tự động chuẩn hóa về giá trị tối thiểu hợp lệ (`0.5` giờ) hoặc báo lỗi khi kiểm tra.
- **E03 — Cộng nhanh vượt ngưỡng 100%:** Khi Sub-bar đang ở `85%` và bấm `+25%`, tiến độ Sub-bar phải được kẹp trần (clamp) ở đúng `100%`. Trong chế độ `time_pool`, nút cộng nhanh chỉ cộng phần thời gian tương ứng với phần trăm thực tăng thêm (`15%` còn lại), không cộng dư.
- **E04 — Đạt 100% Quỹ thời gian nhưng vẫn còn việc dở dang:** Kích hoạt trạng thái `OUT03` (Level Up), giữ thanh Master-bar ở mốc sáng cực đại `100%` kèm huy hiệu thông báo mở rộng giờ hoặc chuyển sang `fixed`, không cho phép vượt quá `100%` gây vỡ khung giao diện.
- **E05 — Chuyển đổi qua lại giữa 2 chế độ (`time_pool` ↔ `fixed`):** Khi chuyển từ `time_pool` sang `fixed` ở giai đoạn Level Up, giữ nguyên `progressPercent` của từng Sub-bar hiện có và tính lại Master-bar theo trọng số.
- **E06 — Tab trình duyệt bị ẩn / Tải lại trang khi Timer đang chạy:** Lưu trạng thái Timer (`activeSubBarId`, `endTime`, `remainingMs`) để khi mở lại tab vẫn tính đúng thời gian còn lại.
- **E07 — Mất kết nối mạng hoặc xung đột đồng bộ Firestore:** Dữ liệu ghi cục bộ trước, tự động đẩy lên đám mây khi có mạng lại; ưu tiên bản ghi có `updatedAt` mới nhất.

## B6. Ngoài phạm vi (Out of scope)

- **X01 —** Hệ thống phân quyền nhiều người dùng phức tạp (RBAC, bình luận nhóm, giao việc cho người khác).
- **X02 —** Biểu đồ Gantt, bảng Kanban đa cột hoặc xuất báo cáo PDF/Excel phức tạp.
- **X03 —** Backend server riêng (Node.js/Python server tự thuê VPS) có phát sinh chi phí duy trì.

## B7. Tiêu chí nghiệm thu (Acceptance criteria)

- **AC01 (F05, E01, E03):** Với dự án `fixed` gồm 2 việc: Việc A (trọng số `1`, tiến độ `50%`), Việc B (trọng số `3`, tiến độ `100%`) → Master-bar tính đúng `(1*50 + 3*100)/4 = 87.5%`. Khi dự án rỗng → `0%`.
- **AC02 (F06, C02, E02):** Với dự án `time_pool` có `targetHours = 10h` (`600` phút), đã làm `150` phút (`25%`). Khi thêm mới Việc C chưa làm phút nào → Master-bar vẫn giữ nguyên `25.0%`.
- **AC03 (F07, E04, E05):** Khi dự án `time_pool` đạt `600/600` phút (`100%`) nhưng Việc C mới đạt `40%`, cờ `isLevelUpReady` bật `true`. Nếu nâng cấp thêm `+5h` (`targetHours = 15h`, `level = 2`), tiến độ Master-bar cập nhật thành `600/900 = 66.7%`.
- **AC04 (F08, F09, C03, E06):** Chạy Focus Timer `25` phút cho một Sub-bar; giả lập trôi qua `25` phút bằng timestamp → Sub-bar tự động cộng thêm `25` phút, tăng `%` tương ứng và Master-bar cập nhật tức thì.
- **AC05 (F10, E03):** Bấm `+10%`, `+25%`, `100%` trên Sub-bar cập nhật đúng tiến độ, không bao giờ vượt quá `100%`.
- **AC06 (F02):** Hàm tính hiệu ứng phát sáng trả về đúng cấp độ milestone (`0`, `25`, `50`, `75`, `100`) và các thông số `blur`/`opacity` tăng đơn điệu theo phần trăm.
- **AC07 (F01, F03, F04):** Giao diện hiển thị đúng danh sách Master-bar, bấm vào Master-bar đóng/mở Accordion mượt mà, hiển thị chuẩn trên cả khung nhìn Desktop (`1280px`) và Mobile (`375px`).
- **AC08 (F11, C05, E07):** Khi thay đổi tiến độ trên thiết bị A, thiết bị B cùng `syncKey` cập nhật thanh bar trong vòng `< 2` giây không cần F5; khi tắt mạng vẫn lưu được vào `localStorage`.
- **AC09 (F12):** Có đầy đủ `manifest.json` và Service Worker hợp lệ, vượt qua kiểm tra cài đặt PWA trên trình duyệt.
