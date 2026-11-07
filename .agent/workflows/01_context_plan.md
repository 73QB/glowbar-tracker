<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN A · KHUNG CỐ ĐỊNH — Dùng chung cho MỌI dự án. KHÔNG CHỈNH SỬA ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

# ▶️ WORKFLOW 01 — Nạp ngữ cảnh & Đề xuất phương án

> **Cách dùng (cho người dùng):** Đầu mỗi phiên chat mới, gửi cho AI: *"Thực hiện theo `.agent/workflows/01_context_plan.md`"* — hoặc copy toàn bộ file này dán vào khung chat (kèm nội dung các file trong mục A3 nếu AI không đọc được file).

## A1. Thẻ định danh

| Thuộc tính | Giá trị |
|---|---|
| **Vị trí** | `.agent/workflows/01_context_plan.md` — **Bước 1/3** của vòng đời task |
| **Đầu vào** | Toàn bộ `docs/`, `Rules.md`, `ai_learning.md`, `Plan.md`, file liên quan trong `src/` |
| **Đầu ra** | Báo cáo 4 phần + phương án kỹ thuật chờ duyệt |
| **Bước kế tiếp** | `02_code_explain.md` (chỉ khi người dùng duyệt) |

## A2. Vai trò của AI ở bước này

Bạn là **kiến trúc sư**: đọc hiểu toàn cảnh, xác định đúng một task, đề xuất cách làm.

> ⛔ **TUYỆT ĐỐI CHƯA VIẾT CODE THỰC THI** (`R02`). Chỉ được dùng mã giả ngắn để minh họa thuật toán.

## A3. Trình tự đọc file bắt buộc (Phễu: tổng quan → chi tiết)

| # | File | Mục đích đọc |
|---|---|---|
| 1 | `.agent/rules/Rules.md` | Nạp bản đồ hệ thống, thứ bậc ưu tiên, quyền ghi và luật `R..` |
| 2 | `docs/Spec.md` | Nắm `F / IN / OUT / C / E / X / AC` |
| 3 | `docs/Archi.md` | Nắm công nghệ, module `M..`, giao diện hàm, quyết định `D..` |
| 4 | `.agent/learnings/ai_learning.md` | Nắm trạng thái hiện tại (phiên bản, thành phần đã có, kiến thức kỹ thuật cốt lõi) và các lưu ý `L..` |
| 5 | `.agent/workflows/Plan.md` | Đọc ghi chú nghiệm thu của các `[x]`; dừng tại `[ ]`/`[~]` đầu tiên |
| 6 | `src/` (chỉ file của task) | Nắm trạng thái code thực tế tại vị trí sẽ tác động |
| 7 | `.agent/skills/*.md` | Chỉ đọc nếu task cần kỹ năng chuyên biệt |

**Kiểm tra sẵn sàng:** Nếu mục Phần B của Spec/Archi/Plan liên quan tới task còn `[placeholder]` → dừng lại và hỏi người dùng (`R08`).

## A4. Định dạng câu trả lời bắt buộc

### Phần 1 — Trạng thái dự án
- Tóm tắt 2–3 dòng những gì đã `[x]` trong `Plan.md`.
- Liệt kê các `R.. / C.. / L..` ảnh hưởng **trực tiếp** tới task sắp làm.

### Phần 2 — Task mục tiêu
- Mã & tên task (`T..`), `F..` mà nó phục vụ.
- File / module (`M..`) và hàm / khu vực cụ thể sẽ tác động.

### Phần 3 — Phương án kỹ thuật
- **Luồng xử lý:** các bước logic (ngôn ngữ tự nhiên hoặc mã giả ngắn).
- **Giao diện:** tên hàm, tham số, kiểu dữ liệu — khớp `Archi.md`.
- **Rào chắn:** cách xử lý từng `E..` liên quan.
- **Cách kiểm chứng dự kiến:** test nào sẽ chứng minh `AC..`.

### Phần 4 — Câu hỏi & Chờ duyệt
- Các điểm chưa rõ hoặc mâu thuẫn giữa các file (nếu có).
- Kết thúc bằng: *"Bạn duyệt phương án này hay cần điều chỉnh trước khi chuyển sang `02_code_explain.md`?"*

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║                         HẾT PHẦN A                               ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

---

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN B · CHỈ DẪN BỔ SUNG CHO DỰ ÁN — Người dùng tự viết (tùy chọn) ║
     ║ Ghi yêu cầu riêng cho bước 01 của dự án này. Để trống nếu không cần.║
     ╚══════════════════════════════════════════════════════════════════╝ -->

- [placeholder]
