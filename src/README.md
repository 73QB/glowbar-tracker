<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN A · KHUNG CỐ ĐỊNH — Dùng chung cho MỌI dự án. KHÔNG CHỈNH SỬA ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

# 📦 src/ — Vùng an toàn chứa mã nguồn chính thức

## A1. Thẻ định danh

| Thuộc tính | Giá trị |
|---|---|
| **Vị trí** | `src/` |
| **Vai trò** | Chứa mã nguồn chính thức của dự án. Chỉ chứa code **người dùng đã đọc hiểu, kiểm duyệt và tự tay ghép vào**. |
| **Ai được sửa** | Chỉ người dùng (`R04`). AI xuất code kèm chỉ dẫn vị trí ghép. |
| **Cấu trúc chuẩn** | Khai báo tại `docs/Archi.md` (module `M..`). |

## A2. Liên kết với các file khác

| File | Quan hệ với `src/` |
|---|---|
| `docs/Archi.md` | Quy định file/module nào được tồn tại ở đây và giao diện của chúng. |
| `.agent/workflows/Plan.md` | Ghi chú nghiệm thu `[x]` mô tả trạng thái hiện tại của từng phần trong `src/`. |
| `02_code_explain.md` | Sinh code dành cho `src/`, kèm chỉ dẫn vị trí ghép. |
| `tests/` | Kiểm chứng code trong `src/` trước khi task được đánh `[x]`. |

## A3. Quy tắc dành cho AI

1. Chỉ đọc file liên quan tới task hiện tại — không quét toàn bộ nếu không cần.
2. Không tạo file mới ngoài sơ đồ `M..` trong `Archi.md`.
3. Không thay đổi hành vi của phần code đã `[x]` (`R06`).

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║                         HẾT PHẦN A                               ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

---

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN B · NỘI DUNG DỰ ÁN — Người dùng tự viết                      ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

## B1. Cách build / chạy chương trình

- [placeholder]

## B2. Ghi chú riêng

- [placeholder]
