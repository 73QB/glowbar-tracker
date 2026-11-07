<!-- ╔══════════════════════════════════════════════════════════════════╗
     ║ MASTER RULE — Tự động được Antigravity quét & nạp ở MỌI phiên    ║
     ╚══════════════════════════════════════════════════════════════════╝ -->

# 🛡️ GEMINI.md — Master Rule & Trạm Điều Phối Trung Tâm

> **Hiệu lực:** File này nằm ở thư mục gốc (`PROJECT_ROOT/GEMINI.md`), được hệ thống **tự động quét và nạp 100% (Always-on)** vào ngữ cảnh của AI ngay khi mở dự án, trước bất kỳ câu lệnh nào của người dùng.

---

## 1. Mệnh lệnh cưỡng chế đầu phiên (Mandatory Boot Sequence)


Ngay khi bắt đầu bất kỳ phiên hội thoại nào trong dự án này, AI **BẮT BUỘC** phải tuân thủ:

1. **Nạp Hiến pháp dự án:** Tuân thủ tuyệt đối toàn bộ quy tắc, bản đồ hệ thống, thứ bậc ưu tiên và quyền đọc/ghi tại `@[Rules.md](.agent/rules/Rules.md)`.
2. **Không tự ý viết code ngay:** Khi người dùng yêu cầu làm nhiệm vụ mới hoặc tiếp tục dự án, AI phải chạy quy trình Bước 1 tại `@[01_context_plan.md](.agent/workflows/01_context_plan.md)` (Đọc `docs/Spec.md` → `docs/Archi.md` → `.agent/learnings/ai_learning.md` → `.agent/workflows/Plan.md` → Đề xuất phương án và **chờ duyệt**).
3. **Tuân thủ luồng 3 bước:**
   - **Bước 1 (Lên phương án):** `.agent/workflows/01_context_plan.md`
   - **Bước 2 (Viết code & Giảng giải):** `.agent/workflows/02_code_explain.md`
   - **Bước 3 (Kiểm chứng 3 lớp & Bàn giao ký ức):** `.agent/workflows/03_verify_check.md`
4. **Chỉ đọc Skills khi cần:** Các file trong `.agent/skills/` là kỹ năng viết sẵn của người dùng — AI chỉ đọc để áp dụng, tuyệt đối không ghi đè hay nối thêm nội dung dự án vào đó. Mọi trạng thái, kiến thức kỹ thuật đạt được và mốc phiên bản (`V..`) phải cập nhật vào `.agent/learnings/ai_learning.md`.

---

## 2. Nhúng trực tiếp Hiến pháp (Auto-Include)

@[Rules.md](.agent/rules/Rules.md)
