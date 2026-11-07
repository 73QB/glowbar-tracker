<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN A · KHUNG CỐ ĐỊNH — Dùng chung cho MỌI dự án. KHÔNG CHỈNH SỬA ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

# 🧪 tests/ — Môi trường kiểm thử & xác thực

## A1. Thẻ định danh

| Thuộc tính | Giá trị |
|---|---|
| **Vị trí** | `tests/` |
| **Vai trò** | Chứa kịch bản kiểm thử, dữ liệu mẫu, file mô phỏng. Kết quả chạy thực tế tại đây là **căn cứ cuối cùng** (Lớp 3) để một task được đánh `[x]`. |
| **Ai được sửa** | Người dùng. AI ghi khi được cho phép, hoặc xuất kịch bản ở bước 03. |
| **Cấu trúc chuẩn** | Khai báo tại `docs/Archi.md`. |

## A2. Liên kết với các file khác

| File | Quan hệ với `tests/` |
|---|---|
| `docs/Spec.md` | Mỗi test chứng minh một `AC..` hoặc `E..` cụ thể. |
| `src/` | Đối tượng được kiểm thử. |
| `03_verify_check.md` | Sinh kịch bản test (Trường hợp A) và đọc kết quả chạy (Lớp 3). |
| `skills/debug.md` | Mỗi lỗi đã sửa nên có một test chống tái phát tại đây. |
| `.agent/workflows/Plan.md` | Ghi chú nghiệm thu trích tên test đã PASS. |

## A3. Quy tắc dành cho AI

1. Mỗi test case phải ghi rõ: **mã ID chứng minh** (`AC..`/`E..`), dữ liệu vào, kết quả kỳ vọng.
2. Chỉ người dùng chạy và xác nhận kết quả. AI không tự tuyên bố PASS (`R10`).
3. Không xóa test cũ đã PASS — chúng là lưới an toàn chống hồi quy cho các task `[x]`.

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║                         HẾT PHẦN A                               ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

---

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN B · NỘI DUNG DỰ ÁN — Người dùng tự viết                      ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

## B1. Cách chạy test

- [placeholder]

## B2. Quy ước đặt tên file test

- [placeholder]
