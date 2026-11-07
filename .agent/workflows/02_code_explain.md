<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN A · KHUNG CỐ ĐỊNH — Dùng chung cho MỌI dự án. KHÔNG CHỈNH SỬA ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

# ▶️ WORKFLOW 02 — Viết code & Giảng giải

> **Cách dùng (cho người dùng):** Sau khi đã duyệt phương án ở bước 01, gửi: *"Thực hiện theo `.agent/workflows/02_code_explain.md`"* — hoặc copy toàn bộ file này dán vào khung chat.

## A1. Thẻ định danh

| Thuộc tính | Giá trị |
|---|---|
| **Vị trí** | `.agent/workflows/02_code_explain.md` — **Bước 2/3** của vòng đời task |
| **Điều kiện vào** | Phương án ở bước 01 đã được người dùng duyệt (`R02`). Nếu chưa → quay lại bước 01. |
| **Đầu vào** | Phương án đã duyệt + `Archi.md` + `Rules.md` + `ai_learning.md` + file đích trong `src/` |
| **Đầu ra** | Khối code + chỉ dẫn vị trí ghép + giải thích chuyên sâu |
| **Bước kế tiếp** | Người dùng ghép code → `03_verify_check.md` |

## A2. Vai trò của AI ở bước này

Bạn là **lập trình viên kiêm người hướng dẫn**: viết đúng phần được giao và giảng giải để người dùng hiểu bản chất, tự tay đưa vào `src/`.

## A3. Cổng kiểm tra trước khi xuất code (Pre-flight)

| Đối chiếu với | Câu hỏi bắt buộc tự trả lời |
|---|---|
| Phương án bước 01 | Code có đúng và **chỉ đúng** những gì đã duyệt? (`R03`) |
| `docs/Archi.md` | Đúng module `M..`, chữ ký hàm, kiểu dữ liệu, thư viện được phép? |
| `.agent/rules/Rules.md` | Tuân thủ `R04–R07` và mọi luật `R1xx` của dự án? |
| `.agent/learnings/ai_learning.md` | Đã né mọi bẫy `L..` liên quan? |
| `docs/Spec.md` | Đã rào chắn mọi `E..` liên quan? Không chạm vào `X..`? |
| File đích trong `src/` | Ghép vào có khớp tên biến, phạm vi, phần code `[x]` sẵn có? (`R06`) |

Nếu bất kỳ câu trả lời nào là **"không"** → sửa trước khi xuất, hoặc báo người dùng lý do.

## A4. Định dạng câu trả lời bắt buộc

### Phần 1 — Code thực thi
- **Vị trí ghép:** *"Chèn vào hàm `X` trong `src/Y`, ngay sau dòng/khối …"*
- Khối code sạch, chỉ phần mới/sửa (`R05`), comment ngắn ở dòng quan trọng.

### Phần 2 — Giải thích chuyên sâu (`R07`)
- **Luồng chạy từng bước:** dữ liệu đi qua đoạn code từ đầu đến cuối như thế nào.
- **Giải mã câu lệnh cốt lõi:** tại sao dùng công thức / lệnh / cấu hình này; đổi tham số thì điều gì xảy ra.
- **Cơ chế an toàn:** đã xử lý `E..` và né `L..` nào, bằng cách nào.

### Phần 3 — Bảng tự rà soát
| Căn cứ | Kết quả |
|---|---|
| Phạm vi (`R03`) | ✅ / ⚠️ + ghi chú |
| Kiến trúc (`Archi.md`) | ✅ / ⚠️ + ghi chú |
| Luật dự án (`R1xx`) | ✅ / ⚠️ + ghi chú |

### Phần 4 — Bước tiếp theo
- Nhắc người dùng ghép code vào `src/`, biên dịch/chạy thử, rồi gọi `03_verify_check.md`.

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║                         HẾT PHẦN A                               ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

---

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN B · CHỈ DẪN BỔ SUNG CHO DỰ ÁN — Người dùng tự viết (tùy chọn) ║
     ║ Ghi yêu cầu riêng cho bước 02 của dự án này. Để trống nếu không cần.║
     ╚══════════════════════════════════════════════════════════════════╝ -->

- [placeholder]
