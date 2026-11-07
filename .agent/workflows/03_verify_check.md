<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN A · KHUNG CỐ ĐỊNH — Dùng chung cho MỌI dự án. KHÔNG CHỈNH SỬA ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

# ▶️ WORKFLOW 03 — Kiểm chứng 3 lớp & Bàn giao ký ức

> **Cách dùng (cho người dùng):** Sau khi đã ghép code vào `src/`, gửi: *"Thực hiện theo `.agent/workflows/03_verify_check.md`"* kèm kết quả biên dịch/chạy thử (nếu đã chạy).

## A1. Thẻ định danh

| Thuộc tính | Giá trị |
|---|---|
| **Vị trí** | `.agent/workflows/03_verify_check.md` — **Bước 3/3** của vòng đời task |
| **Đầu vào** | Code từ bước 02 + kết quả chạy thực tế của người dùng + `Spec.md` + `Rules.md` + `Archi.md` |
| **Đầu ra** | Bảng đánh giá 3 lớp → (FAIL) kịch bản test / bản sửa · (PASS) khối cập nhật `Plan.md` + `ai_learning.md` |
| **Bước kế tiếp** | FAIL → `skills/debug.md` rồi quay lại `02` · PASS → `01` cho task kế tiếp |

## A2. Vai trò của AI ở bước này

Bạn là **kiểm định viên độc lập**: soi lỗi chính code mình vừa viết, không bênh vực. Không tự tuyên bố PASS khi chưa có kết quả chạy thực tế (`R10`).

## A3. Kiểm chứng 3 lớp

| Lớp | Căn cứ | Câu hỏi kiểm tra |
|---|---|---|
| **1 · Mục tiêu** | `docs/Spec.md` | Đáp ứng đủ `F..` của task? Đúng `OUT..`? Xử lý mọi `E..`? Không chạm `X..`? |
| **2 · Kỷ luật & Kiến trúc** | `Rules.md` + `Archi.md` | Có vi phạm `R..` nào? Đúng module `M..`, chữ ký hàm, thư viện? |
| **3 · Thực thi** | `tests/` + kết quả chạy | Test chứng minh được `AC..` và `E..`? Kết quả thực tế khớp kỳ vọng? |

## A4. Định dạng câu trả lời bắt buộc

### Luôn xuất trước: Bảng đánh giá
| Lớp | Kết quả | Bằng chứng / Ghi chú |
|---|---|---|
| 1 · Mục tiêu | ✅ PASS / ❌ FAIL / ⏳ Chờ test | trích `F/E/AC..` |
| 2 · Kỷ luật & Kiến trúc | ✅ / ❌ | trích `R/M..` |
| 3 · Thực thi | ✅ / ❌ / ⏳ | trích kết quả chạy |

---

### Trường hợp A — Chưa có kết quả chạy (⏳)
- Cung cấp kịch bản test cho `tests/`: mỗi test case ghi rõ **mã `AC..`/`E..` mà nó chứng minh**, dữ liệu vào, kết quả kỳ vọng, cách chạy.
- Yêu cầu người dùng chạy và gửi lại kết quả.

### Trường hợp B — Có lớp FAIL (❌)
- Áp dụng quy trình trong `.agent/skills/debug.md`: khoanh vùng → nguyên nhân gốc → bản sửa tối thiểu (`R05`).
- Sau khi sửa, lặp lại bước 03.

### Trường hợp C — Bị chặn
- Nêu lý do (thiếu thông tin, mâu thuẫn tài liệu, phụ thuộc task khác…).
- Đề xuất đánh dấu `[!]` trong `Plan.md` kèm điều kiện mở khóa.

---

### Trường hợp D — Cả 3 lớp PASS & người dùng xác nhận → Thủ tục bàn giao (`R11`)

Xuất **đủ các khối dưới đây** (hoặc ghi trực tiếp vào file nếu được cho phép):

**Khối 1 — Cập nhật `.agent/workflows/Plan.md`**
```markdown
- [x] **T<..> — <Tên task>**
  - *Phục vụ:* F..   ·   *File tác động:* `src/...` (M..)
  - *Ghi chú nghiệm thu:* <đã làm gì> · <test chứng minh: AC../E..> · <đầu ra/biến để task sau dùng>
```

**Khối 2 — Cập nhật bộ nhớ dự án `.agent/learnings/ai_learning.md`** *(bắt buộc — theo quy tắc mục A3 của file đó)*
```markdown
[B1 · Ghi đè] Phiên bản: V.. · Task vừa xong: T.. · Task kế tiếp: T.. · Build/Test: ...
[B2 · Ghi đè nếu thay đổi] Kiến thức kỹ thuật cốt lõi: <cấu hình/thông số/công thức mới>
[B3 · Ghi đè dòng liên quan] | <Module/Hàm> | <Chức năng> | `src/...` | ✅ | <ghi chú> |
[B4 · Thêm nếu có] L<số> — <lưu ý/bẫy quan trọng vừa phát hiện + mệnh lệnh LUÔN/KHÔNG BAO GIỜ>
[B5 · Thêm mốc mới]
### V<major>.<minor> — <Tên mốc> · <YYYY-MM-DD> · (sau task T..)
- **Đạt được:** ...
- **File thay đổi:** ...
- **Trạng thái thành phần:** ...
- **Kết quả kiểm thử:** ...
- **Điểm khôi phục:** <git commit/tag | thư mục sao lưu>
```

**Khối 3 — Đề xuất cập nhật tài liệu gốc** *(bỏ qua nếu không cần)*
- `Spec.md`: <bổ sung `E..`/`AC..` phát hiện thêm>
- `Archi.md`: <quyết định `D..` mới / module `M..` mới>
- `Rules.md`: <luật `R1xx` mới nếu một lưu ý `L..` cần trở thành bắt buộc>

**Kết thúc bằng:** *"Task T.. đã hoàn tất. Task kế tiếp là T.. — gọi `01_context_plan.md` để bắt đầu."*

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║                         HẾT PHẦN A                               ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

---

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN B · CHỈ DẪN BỔ SUNG CHO DỰ ÁN — Người dùng tự viết (tùy chọn) ║
     ║ VD: công cụ đo kiểm, ngưỡng sai số chấp nhận, lệnh chạy test...   ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

- [placeholder]
