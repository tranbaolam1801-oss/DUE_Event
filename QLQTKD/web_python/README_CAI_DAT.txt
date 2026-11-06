BỘ AGENTS MY DUE CHO GOOGLE ANTIGRAVITY
====================================

CÀI TRÊN WINDOWS
1. Mở thư mục dự án MY DUE hiện tại trong File Explorer/Antigravity.
2. Giải nén ZIP. Sao chép thư mục .agents và file AGENTS.md vào GỐC workspace dự án (cùng cấp với các tài liệu ToBe_Nhom3.bpmn, Nhom3.docx). Nếu đã có .agents, MERGE thay vì xóa.
3. Giữ tài liệu gốc bên trong workspace. Không copy các file có dữ liệu nhạy cảm vào thư mục khác.
4. Mở Antigravity, dùng Customizations (Agent panel) để xem agents/skills hoặc trong Antigravity CLI gõ /agents. Có thể cần mở phiên chat/workspace mới để cập nhật danh sách.
5. Hỏi: "Hãy liệt kê agent và skills của workspace này." Kiểm tra 4 agent và skill due-ui-only.

CẤU TRÚC
.agents/agents/bpmn-ui-analyst.md
.agents/agents/figma-ui-designer.md
.agents/agents/frontend-ui-builder.md
.agents/agents/ui-reviewer.md
.agents/skills/due-ui-only/SKILL.md
AGENTS.md

PROMPT BẮT ĐẦU (CHỈ FIGMA):
Hãy dùng bpmn-ui-analyst để đọc TOÀN BỘ ToBe_Nhom3.bpmn, Nhom3.docx và phần tổ chức sự kiện trong HỒ SƠ ĐẤU THẦU.docx. Lập bảng đối chiếu BPMN và màn hình. Sau đó dùng figma-ui-designer dựng thiết kế Desktop và Mobile Web theo bộ màu/logo DUE, cuối cùng dùng ui-reviewer kiểm tra. Chỉ giao diện Figma/Editable SVG; không tạo React, API, backend hay database. Nếu không thể tạo file .fig native, nói rõ và giao SVG có layer chỉnh sửa được.

PROMPT NẾU MUỐN FRONTEND DEMO:
Chỉ khi tôi yêu cầu: dùng frontend-ui-builder tạo prototype frontend chạy local theo mẫu đã duyệt với React + TypeScript, dữ liệu giả lập, không server/API/database. Có route và form tương tác, không gửi email/thanh toán thật.

GHI CHÚ
- File custom agent không tự động tạo file Figma native. Cần tool Figma có quyền ghi để làm điều đó, hoặc dùng SVG nhập vào Figma.
- Antigravity được phép thực thi lệnh theo cài đặt và quyền của bạn: trước khi chấp thuận lệnh/cài công cụ của bên thứ ba, hãy đọc nội dung.
- Tham khảo Google docs: https://antigravity.google/docs/subagents và https://antigravity.google/docs/skills
