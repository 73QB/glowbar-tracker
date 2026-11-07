<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN A · KHUNG CỐ ĐỊNH — Dùng chung cho MỌI dự án. KHÔNG CHỈNH SỬA ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

# 📜 Rules.md — Hiến pháp vận hành AI (Luật chơi & Kỷ luật thép)

## A1. Thẻ định danh

| Thuộc tính | Giá trị |
|---|---|
| **Vị trí** | `.agent/rules/Rules.md` |
| **Vai trò** | Văn bản có hiệu lực cao nhất giữa các file. Định nghĩa bản đồ hệ thống, thứ bậc ưu tiên, quyền đọc/ghi và kỷ luật hành xử của AI. **Căn cứ số 2** khi nghiệm thu (Lớp 2). |
| **Ai được sửa** | Chỉ người dùng. AI chỉ được *đề xuất* thêm luật ở bước `03_verify_check.md`. |
| **AI đọc khi nào** | Đầu mỗi phiên (bước 01) và trước khi xuất bất kỳ dòng code nào (bước 02). |
| **AI ghi khi nào** | Không bao giờ ghi trực tiếp. |

---

## A2. Bản đồ hệ thống (System Map)

```text
PROJECT_ROOT/
├── .agent/                     ── KHÔNG GIAN VẬN HÀNH AI ──
│   ├── rules/Rules.md          [LUẬT]      Hiến pháp: AI phải tuân thủ ở mọi bước
│   ├── learnings/ai_learning.md[BỘ NHỚ]    Ảnh chụp trạng thái dự án + mốc khôi phục phiên bản
│   ├── skills/*.md             [KỸ NĂNG]   Skill viết sẵn của người dùng — chỉ đọc & áp dụng
│   └── workflows/
│       ├── Plan.md             [TIẾN ĐỘ]   Checklist task + ghi chú nghiệm thu
│       ├── 01_context_plan.md  [BƯỚC 1]    Nạp ngữ cảnh → đề xuất phương án
│       ├── 02_code_explain.md  [BƯỚC 2]    Viết code → giải thích
│       └── 03_verify_check.md  [BƯỚC 3]    Kiểm chứng 3 lớp → bàn giao ký ức
├── docs/                       ── BẢN VẼ TĨNH ──
│   ├── Spec.md                 [MỤC TIÊU]  Làm cái gì? (Căn cứ số 1)
│   └── Archi.md                [KIẾN TRÚC] Làm bằng gì? Đặt ở đâu?
├── src/                        [MÃ NGUỒN]  Vùng an toàn, chỉ chứa code đã duyệt
└── tests/                      [THỰC NGHIỆM] Căn cứ cuối cùng (Lớp 3)
```

### Vòng đời một Task

```text
 ┌──────────────────────────────────────────────────────────────────────┐
 │  01_context_plan ──(người dùng duyệt)──► 02_code_explain              │
 │        ▲                                        │                     │
 │        │                                        ▼                     │
 │  Task kế tiếp ◄──(PASS: cập nhật Plan.md    03_verify_check           │
 │                   + ai_learning.md)             │                     │
 │                                       (FAIL) ───┴──► skills/debug.md  │
 │                                                      → quay lại 02    │
 └──────────────────────────────────────────────────────────────────────┘
```

---

## A3. Thứ bậc ưu tiên khi các nguồn mâu thuẫn

| Bậc | Nguồn | Ghi chú |
|---|---|---|
| 1 | Lệnh trực tiếp của người dùng trong phiên | Nếu lệnh trái với file bên dưới → AI phải **nêu rõ mâu thuẫn** trước khi làm theo. |
| 2 | `.agent/rules/Rules.md` | Kỷ luật hành xử. |
| 3 | `docs/Spec.md` | Mục tiêu & phạm vi. |
| 4 | `docs/Archi.md` | Công nghệ & cấu trúc. |
| 5 | `.agent/workflows/Plan.md` | Thứ tự & trạng thái công việc. |
| 6 | `.agent/learnings/ai_learning.md` | Trạng thái thực tế & lưu ý kỹ thuật của dự án. |
| 7 | `.agent/skills/*.md` | Skill viết sẵn, dùng khi cần kỹ năng chuyên biệt. |

> **Giao thức xung đột:** Khi phát hiện hai nguồn mâu thuẫn, AI **DỪNG LẠI**, trích dẫn hai vị trí xung đột (file + mã ID) và hỏi người dùng. Không tự chọn.

---

## A4. Ma trận quyền đọc / ghi

| File / Thư mục | AI đọc | AI ghi trực tiếp | Cách AI tác động |
|---|---|---|---|
| `docs/Spec.md`, `docs/Archi.md` | ✅ | ❌ | Đề xuất thay đổi trong báo cáo bước 03 |
| `.agent/rules/Rules.md` | ✅ | ❌ | Đề xuất luật mới trong báo cáo bước 03 |
| `.agent/workflows/Plan.md` | ✅ | ⚠️ Chỉ khi được cho phép | Xuất khối cập nhật ở bước 03 |
| `.agent/learnings/ai_learning.md` | ✅ | ⚠️ Chỉ khi được cho phép | Xuất khối cập nhật trạng thái + mốc `V..` ở bước 03 |
| `.agent/workflows/0x_*.md`, `skills/*.md` | ✅ | ❌ | Chỉ đọc & áp dụng. Không bao giờ ghi/bổ sung vào skill |
| `src/` | ✅ (chỉ file liên quan) | ❌ | Xuất code kèm chỉ dẫn vị trí ghép |
| `tests/` | ✅ | ⚠️ Chỉ khi được cho phép | Xuất kịch bản test ở bước 03 |

---

## A5. Hệ thống mã định danh (ID) dùng chung

Mọi file tham chiếu chéo nhau **bằng mã ID**, không mô tả chung chung.

| Tiền tố | Ý nghĩa | Định nghĩa tại |
|---|---|---|
| `F01` | Tính năng (Feature) | `Spec.md` |
| `IN01` / `OUT01` | Đầu vào / Đầu ra | `Spec.md` |
| `C01` | Ràng buộc (Constraint) | `Spec.md` |
| `E01` | Trường hợp biên (Edge case) | `Spec.md` |
| `X01` | Ngoài phạm vi (Out of scope) | `Spec.md` |
| `AC01` | Tiêu chí nghiệm thu (Acceptance) | `Spec.md` |
| `M01` | Module / file mã nguồn | `Archi.md` |
| `D01` | Quyết định kỹ thuật (Decision) | `Archi.md` |
| `R01`–`R99` | Luật cố định (Phần A) | `Rules.md` |
| `R101`+ | Luật riêng của dự án (Phần B) | `Rules.md` |
| `T1.1` | Task (Giai đoạn.Số thứ tự) | `Plan.md` |
| `L01` | Lưu ý quan trọng / bẫy kỹ thuật | `ai_learning.md` |
| `V0.1` | Mốc phiên bản / điểm khôi phục | `ai_learning.md` |

---

## A6. Luật cố định (áp dụng cho mọi dự án)

**Phạm vi & Thứ tự**
- **R01 — Một phiên, một task:** Chỉ làm task `[ ]` đầu tiên trong `Plan.md` (hoặc task người dùng chỉ định). Không gộp task.
- **R02 — Duyệt trước, code sau:** Không viết code thực thi khi phương án ở bước 01 chưa được người dùng chấp thuận.
- **R03 — Không vượt phạm vi:** Không thêm tính năng, hàm phụ, thư viện, file nằm ngoài phương án đã duyệt hoặc thuộc danh sách `X..` trong `Spec.md`.

**Bảo vệ mã nguồn**
- **R04 — Không ghi đè `src/`:** Chỉ xuất code kèm chỉ dẫn vị trí ghép. Người dùng là người đưa code vào `src/`.
- **R05 — Thay đổi tối thiểu:** Chỉ xuất phần code mới/sửa. Không in lại toàn bộ file cũ, không tự ý refactor code không liên quan.
- **R06 — Tôn trọng code đã nghiệm thu:** Không thay đổi hành vi của phần việc đã `[x]` trong `Plan.md` trừ khi người dùng yêu cầu.

**Minh bạch & Học tập**
- **R07 — Bắt buộc giải thích:** Mọi khối code phải kèm giải thích luồng logic và lý do chọn giải pháp.
- **R08 — Không bịa thông tin:** Nếu Phần B của bất kỳ file nào còn trống/placeholder hoặc thiếu dữ liệu cần thiết → hỏi người dùng, không tự giả định.
- **R09 — Trích dẫn nguồn:** Khi ra quyết định, nêu căn cứ bằng mã ID (VD: *"theo `C02` và `R103`"*).

**Kiểm chứng & Bàn giao**
- **R10 — Không tự tuyên bố PASS:** Một task chỉ hoàn thành khi người dùng xác nhận kết quả chạy thực tế tại `tests/`.
- **R11 — Bàn giao ký ức:** Khi task PASS, bắt buộc xuất khối cập nhật `Plan.md` và `ai_learning.md` (trạng thái mới + mốc phiên bản `V..`) theo mẫu trong `03_verify_check.md`.
- **R12 — Tự rà soát trước khi giao:** Trước khi gửi câu trả lời có code, tự đối chiếu với `Rules.md` (Phần A + B). Nếu vi phạm → sửa trước khi gửi.

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║                         HẾT PHẦN A                               ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

---

<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ PHẦN B · NỘI DUNG DỰ ÁN — Người dùng tự viết cho từng dự án       ║
     ║ Đánh số luật từ R101 trở đi. Xóa các dòng [placeholder] khi điền. ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

## B1. Quy ước đặt tên & Phong cách code

- **R101 — Quy ước đặt tên:** Biến và hàm dùng `camelCase`; hằng số cấu hình dùng `UPPER_SNAKE_CASE`; tên class CSS dùng `kebab-case` theo chuẩn BEM rút gọn (VD: `.master-bar`, `.master-bar--milestone-100`, `.sub-bar__action-btn`).

## B2. Giới hạn hành vi riêng của dự án

- **R102 — Tính bất biến (Immutability) trong `src/core/`:** Mọi hàm trong `src/core/` không được làm biến đổi (mutate) trực tiếp object đầu vào mà phải trả về object bản sao mới đã cập nhật, kèm cập nhật mốc thời gian `updatedAt`.
- **R103 — Bảo toàn dữ liệu số học:** Mọi phép tính phần trăm hiển thị làm tròn đến `1` chữ số thập phân (`Math.round(val * 10) / 10`) và luôn được kẹp trong khoảng `[0, 100]`; tuyệt đối không để lọt giá trị `NaN`, `Infinity` hoặc số âm ra giao diện.

## B3. Những điều cấm kỵ (Anti-patterns)

- **R104 — Chống XSS khi render DOM:** Khi render tên dự án hoặc tên đầu việc do người dùng nhập, bắt buộc dùng `textContent` hoặc hàm escape HTML trước khi đưa vào giao diện; cấm nối chuỗi trực tiếp vào `innerHTML` mà chưa khử độc.
