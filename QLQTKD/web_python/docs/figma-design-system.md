# HỆ THỐNG THIẾT KẾ FIGMA MY DUE (FIGMA DESIGN SYSTEM SPECIFICATION)

> **Dự án**: Cổng thông tin Quản lý Quy trình Xét duyệt và Tổ chức Sự kiện MY DUE  
> **Đơn vị chủ quản**: Trường Đại học Kinh tế – Đại học Đà Nẵng (DUE)  
> **Căn cứ nghiệp vụ**: `ToBe_Nhom3.bpmn`, `Nhom3.docx`, `HỒ SƠ ĐẤU THẦU.docx` (phần Tổ chức Sự kiện)  
> **Tài liệu đối chiếu**: `docs/ui-screen-inventory.md`, `docs/bpmn-ui-mapping.md`  
> **Quy chuẩn màn hình**: Desktop Web 1440×900 px & Mobile Web 390×844 px  
> **Nguyên tắc**: Giao diện UI/UX mô phỏng thuần túy (UI-Only Mockup) – Tuyệt đối KHÔNG Backend, API, Database.

---

## 1. HỆ THỐNG MÀU SẮC NHẬN DIỆN THƯƠNG HIỆU DUE (COLOR TOKENS)

Hệ thống màu sắc MY DUE được xây dựng trên bộ nhận diện chính thức của Trường Đại học Kinh tế – Đại học Đà Nẵng, bảo đảm tính trang nghiêm, học thuật, hiện đại và tuân thủ tuyệt đối chuẩn tiếp cận thị giác **WCAG 2.1 Level AA & AAA**.

### 1.1. Bảng màu thương hiệu cốt lõi (Core Brand Palette)

| Mã Token | Tên màu | Giá trị HEX | RGB | Tỷ lệ tương phản (trên nền trắng) | Ứng dụng nghiệp vụ chính |
|:---|:---|:---:|:---:|:---:|:---|
| `color-primary-due` | **Xanh dương DUE** | `#075F9F` | `rgb(7, 95, 159)` | **5.45:1** (Đạt AA) | Màu chủ đạo toàn hệ thống: Header, Primary Button, Active Menu, Link, Icon thương hiệu. |
| `color-primary-dark` | Xanh dương đậm | `#054472` | `rgb(5, 68, 114)` | **8.62:1** (Đạt AAA) | Trạng thái Hover của nút chính, tiêu đề khối quan trọng. |
| `color-primary-light` | Xanh dương nhạt | `#EBF4FA` | `rgb(235, 244, 250)` | - | Nền thẻ đang kích hoạt, nền badge trạng thái đang xử lý. |
| `color-secondary-due` | **Xanh lá DUE** | `#0D914B` | `rgb(13, 145, 75)` | **4.68:1** (Đạt AA) | Màu thành công & phê duyệt: Nút Duyệt, Badge Đã duyệt, Đã cấp phép, Đã giải ngân. |
| `color-secondary-dark` | Xanh lá thẫm | `#096B36` | `rgb(9, 107, 54)` | **7.12:1** (Đạt AAA) | Hover nút duyệt, dấu mộc xác nhận của Khoa và Đoàn. |
| `color-secondary-light` | Xanh lá nhạt | `#EAF8F0` | `rgb(234, 248, 240)` | - | Nền badge thành công, thông báo hoàn tất, ô slot lịch trống. |
| `color-accent-due` | **Cam DUE** | `#FE751E` / `#F36B21` | `rgb(243, 107, 33)` | **3.85:1** (Đồ họa lớn) | Màu cảnh báo & yêu cầu chỉnh sửa: Nút Yêu cầu sửa, Badge Cần chỉnh sửa, Thẻ AI gợi ý. |
| `color-accent-dark` | Cam đậm | `#C24C0A` | `rgb(194, 76, 10)` | **5.32:1** (Đạt AA) | Hover nút chỉnh sửa, chữ cảnh báo quan trọng. |
| `color-accent-light` | Cam nhạt | `#FFF4ED` | `rgb(255, 244, 237)` | - | Nền badge cảnh báo, nền khối góp ý của Khoa/Đoàn/KHTC. |

### 1.2. Màu trạng thái hệ thống (Semantic & Feedback Colors)

| Mã Token | Tên màu | Giá trị HEX | RGB | Ứng dụng trong các cổng XOR và quy trình |
|:---|:---|:---:|:---:|:---|
| `color-danger` | **Đỏ cảnh báo/Từ chối** | `#DC2626` | `rgb(220, 38, 38)` | Nhánh Từ chối tại `GKhoa`, `GDoan`, `GApproval`; Báo trùng lịch CSVC tại `GFacility`; Thiếu chứng từ tại `GPay`. |
| `color-danger-light` | Đỏ nhạt nền | `#FEF2F2` | `rgb(254, 242, 242)` | Nền thông báo từ chối, nền viền ô input bị lỗi validation. |
| `color-warning-amber` | Vàng hổ phách | `#D97706` | `rgb(217, 119, 6)` | Cảnh báo chi phí vượt dự toán, nhắc nhở hạn chót xử lý hồ sơ. |
| `color-info-cyan` | Xanh thông tin | `#0284C7` | `rgb(2, 132, 199)` | Thông báo tự động hóa (Service Task), thông tin Ticket ID. |

### 1.3. Bảng màu trung tính & Bề mặt (Neutral & Surface Colors)

| Mã Token | Tên thuộc tính | Giá trị HEX | Mô tả & Ứng dụng |
|:---|:---|:---:|:---|
| `color-canvas-bg` | **Nền ứng dụng** | `#F6F8FB` | Nền tổng thể toàn bộ trang (sạch sẽ, dịu mắt, tăng độ tương phản cho card). |
| `color-surface-card` | **Nền thẻ/Bảng biểu** | `#FFFFFF` | Trắng tinh khiết dùng cho Card, Bảng dữ liệu, Dialog modal, Popup. |
| `color-surface-subtle` | Nền phụ | `#F8FAFC` | Nền tiêu đề bảng (`th`), nền khối upload file kéo thả. |
| `color-border-default` | **Đường viền chuẩn** | `#E1E8EF` | Đường viền 1px phân tách các khối nội dung, card, ô input. |
| `color-border-focus` | Viền focus | `#075F9F` | Viền xanh khi focus vào ô nhập liệu (kèm shadow xanh nhạt). |
| `color-text-primary` | **Chữ tiêu đề & chính** | `#18334F` | Tương phản cực cao (11.2:1) trên nền trắng, đảm bảo khả năng đọc tốt nhất. |
| `color-text-secondary` | Chữ phụ & Nhãn | `#5E6C84` | Dùng cho nhãn trường nhập liệu, ngày nộp, mô tả bước quy trình. |
| `color-text-muted` | Chữ mờ / Placeholder | `#94A3B8` | Dùng cho văn bản giữ chỗ (placeholder), icon phụ trợ. |
| `color-text-on-primary` | Chữ trên nền màu | `#FFFFFF` | Dùng cho chữ trong nút bấm màu xanh, xanh lá, đỏ, cam. |

---

## 2. THANG TYPOGRAPHY CHUẨN MỰC (TYPOGRAPHY SCALE)

- **Phông chữ chủ đạo**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`.
- **Hỗ trợ tiếng Việt**: 100% bộ ký tự có dấu chuẩn Unicode tiếng Việt, không bị nhảy dòng, không lỗi glyphs.

| Cấp bậc (Hierarchy) | Cỡ chữ (Font Size) | Chiều cao dòng (Line Height) | Độ đậm (Font Weight) | Khoảng cách chữ (Letter Spacing) | Ứng dụng thực tế trên màn hình |
|:---|:---:|:---:|:---:|:---:|:---|
| **Display** | `32px` | `40px` (1.25) | Bold (700) | `-0.02em` | Màn hình khởi đầu, số liệu KPI tổng quan lớn trên Dashboard. |
| **Heading 1 (H1)** | `24px` | `32px` (1.33) | Bold (700) | `-0.01em` | Tiêu đề chính từng màn hình (VD: "Lập kế hoạch và hồ sơ tổ chức"). |
| **Heading 2 (H2)** | `20px` | `28px` (1.40) | SemiBold (600) | `-0.005em` | Tiêu đề nhóm nội dung, tiêu đề bảng dữ liệu, tiêu đề Modal lớn. |
| **Heading 3 (H3)** | `16px` | `24px` (1.50) | SemiBold (600) | `0em` | Tiêu đề thẻ Card, tên bước trong Timeline, tiêu đề Popup nhỏ. |
| **Body 1 (Regular)** | `14px` | `20px` (1.43) | Regular (400) | `0em` | Văn bản nội dung chính, dữ liệu hàng trong DataTable, văn bản mô tả. |
| **Body 1 (Medium)** | `14px` | `20px` (1.43) | Medium (500) | `0em` | Nhãn trường nhập liệu (Form Label), chữ nút bấm (Button Label). |
| **Body 2 (Small)** | `13px` | `18px` (1.38) | Regular (400) | `0em` | Ghi chú hướng dẫn nhập liệu, breadcrumbs, thông tin phụ trong bảng. |
| **Caption / Badge** | `12px` | `16px` (1.33) | SemiBold (600) | `0.01em` | Chữ trong Status Badge, số đếm thông báo đỏ, chú thích ảnh. |
| **Tiny / Helper** | `11px` | `14px` (1.27) | Regular (400) | `0.02em` | Thông báo lỗi đỏ dưới ô input, nhãn thời gian timestamp. |

---

## 3. HỆ THỐNG LƯỚI 8PX & KHÔNG GIAN BỐ CỤC (8PX GRID SYSTEM & LAYOUT)

Hệ thống thiết kế MY DUE áp dụng triệt để nguyên tắc **8px Grid** cho tất cả các chiều dài, khoảng cách padding, margin và kích thước icon.

### 3.1. Thang khoảng cách (Spacing Scale)

- `$space-1` (`4px`): Khoảng cách giữa icon và chữ nhỏ, khoảng cách viền trong badge.
- `$space-2` (`8px`): Khoảng cách cơ sở (Base Unit) giữa các nút bấm nhỏ, padding trong ô input.
- `$space-3` (`12px`): Padding dọc của ô nhập liệu và hàng trong bảng dữ liệu (`tr`).
- `$space-4` (`16px`): Padding chuẩn cho thẻ Card nhỏ, khoảng cách giữa các nhóm trường form.
- `$space-6` (`24px`): Padding chuẩn cho khối nội dung chính, padding trong Modal dialog.
- `$space-8` (`32px`): Khoảng cách giữa các phân đoạn trang lớn trên Desktop.
- `$space-10` (`40px`): Khoảng cách lề biên của Layout Desktop.
- `$space-12` (`48px`): Chiều cao nút bấm lớn hoặc chiều cao header phụ.

### 3.2. Bán kính góc bo (Border Radius Scale)

- `radius-sm` (`4px`): Dùng cho Checkbox, Tag nhỏ, Badge trạng thái.
- `radius-md` (`8px`): Dùng cho Nút bấm (Button), Ô nhập liệu (Input Field), Thẻ Card, Dropdown Menu.
- `radius-lg` (`12px`): Dùng cho Hộp thoại (Modal Dialog), Banner cảnh báo lớn.
- `radius-full` (`9999px`): Dùng cho Huy hiệu tròn (Pill Badge), Nút tròn Avatar, Chấm chỉ báo trạng thái.

### 3.3. Độ đổ bóng (Elevation & Shadow Tokens)

Hệ thống sử dụng bóng đổ tự nhiên, tinh tế, loại bỏ hoàn toàn các dải gradient sặc sỡ:
- `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (Dùng cho nút bấm, ô input lúc bình thường).
- `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)` (Thẻ Card nổi, Dropdown menu khi mở).
- `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)` (Hộp thoại xác nhận, Modal phê duyệt).
- `shadow-focus`: `0 0 0 3px rgba(7, 95, 159, 0.15)` (Vòng sáng màu xanh khi nhấn/focus vào input field).

---

## 4. QUY CHUẨN KHUNG HÌNH THIẾT KẾ (CANVAS SPECIFICATIONS)

### 4.1. Desktop Web Layout (1440 × 900 px)

- **Khung kích thước tổng thể**: Chiều rộng cố định `1440px`, Chiều cao làm việc `900px` (có cuộn dọc khi nội dung dài).
- **Thanh điều hướng bên trái (Sidebar Navigation)**:
  - Chiều rộng: `260px` cố định sát mép trái.
  - Chiều cao: `100%` (`900px`).
  - Màu nền: `#FFFFFF`, phân cách bằng đường viền phải `1px solid #E1E8EF`.
  - Thành phần: Logo DUE ở đỉnh (`height: 64px`), Danh mục thực đơn theo vai trò, Huy hiệu số đếm hồ sơ tồn đọng, Khối phiên bản hệ thống ở đáy.
- **Thanh tiêu đề trên cùng (Global Header)**:
  - Chiều cao: `64px` cố định sát mép trên, từ tọa độ `X: 260px` đến `1440px` (chiều rộng `1180px`).
  - Màu nền: `#FFFFFF`, đường viền dưới `1px solid #E1E8EF`.
  - Thành phần: Breadcrumbs điều hướng, Ô tìm kiếm Ticket ID nhanh, Chuông thông báo đỏ (Notification Bell), Thông tin người dùng (Avatar + Vai trò + Menu phân quyền).
- **Vùng không gian làm việc chính (Main Content Area)**:
  - Tọa độ: `X: 260px`, `Y: 64px`, Chiều rộng: `1180px`, Chiều cao: `836px`.
  - Padding trong: `24px` ở bốn phía (Top: 24px, Right: 32px, Bottom: 32px, Left: 32px).
  - Nền: Màu `#F6F8FB`.

### 4.2. Mobile Web Layout (390 × 844 px)

- **Khung kích thước tổng thể**: Chuẩn iPhone 14 / iPhone 15 kích thước `390 × 844 px`.
- **Thanh tiêu đề di động (Mobile App Bar / Header)**:
  - Chiều cao: `56px` cố định ở đỉnh.
  - Thành phần: Nút Hamburger Menu (bên trái), Logo DUE rút gọn / Tên phân hệ (ở giữa), Nút chuông thông báo (bên phải).
- **Thanh điều hướng đáy (Bottom Navigation Bar)**:
  - Chiều cao: `60px` cố định ở đáy màn hình.
  - Gồm 4 tab chính: Trang chủ (Dashboard), Hồ sơ của tôi, Lịch phòng & sự kiện, Tài khoản/Thông báo.
- **Vùng nội dung di động (Mobile Viewport Area)**:
  - Chiều rộng: `390px`, Padding hai bên: `16px`.
  - Toàn bộ bảng dữ liệu chuyển thành dạng Card danh sách xếp chồng dọc (Stacked Cards).
  - Nút hành động chính (Primary Actions) cố định ở đáy (Bottom Sticky Action Bar) với chiều cao `48px`, đảm bảo vùng chạm an toàn bằng ngón cái (Thumb-friendly zone).

---

## 5. THƯ VIỆN COMPONENT DÙNG CHUNG & VARIANTS (REUSABLE COMPONENTS)

Mọi thành phần trong thư viện đều được thiết kế dưới dạng Figma Master Components kèm đầy đủ biến thể (Variants) và trạng thái (Component States).

### 5.1. Global Header Component
- **Variants theo 5 vai trò**:
  1. `Role=BCH_LienChiDoan` (Hiển thị nhãn: "BCH Liên Chi Đoàn Khoa CNTT")
  2. `Role=BCN_Khoa` (Hiển thị nhãn: "Ban Chủ nhiệm Khoa CNTT")
  3. `Role=Doan_Truong` (Hiển thị nhãn: "Đoàn Thanh niên Trường ĐHKT")
  4. `Role=Phong_CSVC` (Hiển thị nhãn: "Phòng Cơ sở vật chất")
  5. `Role=Phong_KHTC` (Hiển thị nhãn: "Phòng Kế hoạch Tài chính")
- **Thành phần tương tác**:
  - `Breadcrumb` tự động đồng bộ theo màn hình.
  - `SearchInput`: Ô tìm nhanh mã Ticket ID (`HS-2026-XXXX`).
  - `NotificationIcon`: Có variant `HasUnread=True` (chấm đỏ đếm số lượng: 3).
  - `UserDropdown`: Thả xuống các quyền: Xem thông tin, Đổi vai trò mô phỏng, Đăng xuất.

### 5.2. Sidebar Navigation Component
- **Variants theo 5 vai trò (Role-based Navigation)**:
  - **BCH Liên Chi Đoàn**: Tổng quan quy trình, Danh sách hồ sơ, Tạo hồ sơ mới, Lập dự trù kinh phí, Theo dõi thẩm định, Báo cáo tổng kết, Quyết toán kinh phí.
  - **Ban Chủ nhiệm Khoa**: Bàn làm việc BCN Khoa, Hồ sơ chờ thẩm định (Badge số lượng), Lịch sử đã phê duyệt, Văn bản quy định.
  - **Đoàn Trường**: Bàn làm việc Đoàn Trường, Hồ sơ chờ cấp phép (Badge số lượng), Lịch hoạt động Đoàn - Hội toàn trường, Quản lý báo cáo tổng kết.
  - **Phòng Cơ sở vật chất**: Bàn làm việc Phòng CSVC, Yêu cầu mượn phòng & thiết bị, Lịch Booking Shared Calendar, Nghiệm thu bàn giao hoàn trả.
  - **Phòng Kế hoạch Tài chính**: Bàn làm việc Phòng KHTC, Hồ sơ thanh toán chờ duyệt, Kiểm toán chứng từ hóa đơn, Báo cáo giải ngân ngân sách.
- **Menu Item States**: `Default`, `Hover` (nền `#F1F5F9`), `Active` (nền xanh `#EBF4FA`, chữ xanh `#075F9F`, thanh chỉ báo xanh 4px ở mép trái).

### 5.3. Breadcrumbs Component
- Cấu trúc: `MY DUE` > `[Tên Phân Hệ/Giai đoạn]` > `[Tên Màn Hình / Mã Ticket ID]`
- States: Mục trước dạng link (`color: #5E6C84`, hover có gạch chân), Mục cuối cùng dạng text hiện tại (`color: #18334F`, SemiBold).

### 5.4. Button System (Hệ thống nút bấm)
Mỗi loại nút có 5 trạng thái: `Default`, `Hover`, `Pressed/Active`, `Disabled`, `Loading (kèm Spinner)`.

| Variant Name | Màu nền | Màu viền | Màu chữ | Ứng dụng nghiệp vụ tiêu biểu |
|:---|:---:|:---:|:---:|:---|
| `Button/Primary` | `#075F9F` | Không | `#FFFFFF` | Nộp hồ sơ, Tiếp tục, Áp dụng gợi ý AI, Tìm kiếm. |
| `Button/Success` | `#0D914B` | Không | `#FFFFFF` | Phê duyệt kế hoạch (`ReviewKhoa`), Ký duyệt & cấp phép (`ReviewDoan`), Xác nhận cấp phòng (`FacilityUser`), Duyệt chi (`ApprovePayment`). |
| `Button/Warning` | `#F36B21` | Không | `#FFFFFF` | Yêu cầu chỉnh sửa (`GKhoa`, `GDoan`), Yêu cầu bổ sung chứng từ (`GPay`), Đổi lịch CSVC (`GFacility`). |
| `Button/Danger` | `#DC2626` | Không | `#FFFFFF` | Từ chối hồ sơ (`RejectKhoa`, `RejectDoan`), Từ chối thanh toán (`RefusePay`), Hủy bỏ yêu cầu. |
| `Button/Secondary` | `#FFFFFF` | `#E1E8EF` | `#18334F` | Quay lại bước trước, Lưu bản nháp, Xuất file Excel/PDF. |
| `Button/Ghost` | Trong suốt | Không | `#075F9F` | Bỏ qua gợi ý AI, Xem chi tiết, Đóng nhanh. |

### 5.5. Form Inputs & Validation States
- **Single Line Input / Textarea**: Chiều cao `40px` (Input) / `96px` (Textarea). Viền `1px solid #E1E8EF`, góc bo `8px`.
- **States**:
  - `Default`: Placeholder xám nhạt `#94A3B8`.
  - `Focus`: Viền xanh `#075F9F`, bóng `shadow-focus`.
  - `Error`: Viền đỏ `#DC2626`, nhãn báo lỗi đỏ bên dưới (ví dụ: *"Vui lòng nhập tên sự kiện"* hoặc *"Ngày kết thúc phải sau ngày bắt đầu"*).
  - `Disabled`: Nền `#F1F5F9`, viền `#E2E8F0`, chữ `#94A3B8`.

### 5.6. DatePicker & TimeRange Component
- Lựa chọn ngày tổ chức dạng lịch thả xuống:
  - Hiển thị ngày bắt đầu - ngày kết thúc.
  - Cảnh báo inline nếu khoảng thời gian trùng với lịch thi cử hoặc ngày lễ chung của Trường ĐHKT.

### 5.7. FileUpload / Drag-and-Drop Area Component
- **Trạng thái Chưa có file**: Khung viền nét đứt (dashed `1.5px #CBD5E1`), nền `#F8FAFC`, icon đám mây mũi tên lên, văn bản: *"Kéo thả tài liệu kế hoạch (.docx, .pdf) hoặc bấm để chọn tệp (Tối đa 25MB)"*.
- **Trạng thái Đã tải file**: Khung viền liền nét `#E1E8EF`, nền trắng, hiển thị icon loại tệp (PDF/DOCX/Excel), Tên tệp, Kích cỡ (VD: `Ke_hoach_DUE_Hackathon.pdf - 3.4 MB`), Trạng thái tải lên `100% Hoàn tất`, Nút xóa hoặc thay thế tệp.

### 5.8. DataTable Component (Bảng quản lý sự kiện)
- **Header (`th`)**: Nền `#F8FAFC`, chữ `#5E6C84` 13px SemiBold, có icon sắp xếp mũi tên 2 chiều.
- **Hàng dữ liệu (`tr`)**: Nền trắng, viền dưới `1px solid #F1F5F9`, hover đổi màu nhẹ `#F8FAFC`.
- **Các cột chuẩn**: Mã hồ sơ (Ticket ID) > Tên sự kiện > Đơn vị tổ chức > Ngày nộp > Tiến độ hiện tại > Trạng thái > Thao tác.
- **Phân trang (Pagination)**: Nút trang trước/tiếp, số trang đang đứng `1 / 4`, chọn số dòng `10 / 25 / 50 dòng mỗi trang`.

### 5.9. Status Badge Component (Huy hiệu trạng thái hồ sơ)
Thiết kế dạng Pill Badge (bo tròn hoàn toàn), cỡ chữ `12px SemiBold`, padding `4px 10px`:

| Trạng thái hồ sơ | Màu nền | Màu chữ | Icon đại diện | Ý nghĩa trong quy trình To-Be |
|:---|:---:|:---:|:---:|:---|
| **Bản nháp** | `#F1F5F9` | `#475569` | `PenTool` | BCH đang soạn thảo thông tin ban đầu. |
| **Chờ BCN Khoa thẩm định** | `#EBF4FA` | `#075F9F` | `Clock` | Đã nộp Màn hình 07, đang ở hòm thư Khoa Màn hình 08. |
| **Khoa yêu cầu sửa đổi** | `#FFF4ED` | `#C24C0A` | `AlertCircle` | Khoa bấm nhánh Sửa tại `GKhoa`, chuyển về Màn 10. |
| **Khoa đã phê duyệt** | `#EAF8F0` | `#0D914B` | `CheckCircle` | Khoa ký số tại Màn hình 11. |
| **Chờ Đoàn trường thẩm định** | `#E0F2FE` | `#0369A1` | `Shield` | Đã chuyển liên cấp Màn hình 12, đang chờ ở Màn 13. |
| **Đoàn yêu cầu chỉnh sửa** | `#FFF4ED` | `#C24C0A` | `AlertCircle` | Đoàn bấm nhánh Sửa tại `GDoan`, chuyển về Màn 15. |
| **Đoàn trường đã cấp phép** | `#DCFCE7` | `#15803D` | `Award` | Đoàn ký duyệt đóng dấu mộc số tại Màn hình 16. |
| **Đang đối chiếu CSVC** | `#F3E8FF` | `#7E22CE` | `Layers` | Đang trong pha tự động kiểm tra lịch Màn 18, 19. |
| **CSVC trùng lịch / Chưa đáp ứng** | `#FEE2E2` | `#B91C1C` | `XCircle` | CSVC bấm nhánh Chưa tại `GFacility`, chuyển Màn 21. |
| **Đã xác nhận CSVC** | `#EAF8F0` | `#0D914B` | `Key` | CSVC cấp phiếu phòng & phân công KTV tại Màn 22. |
| **Đang diễn ra sự kiện** | `#EFF6FF` | `#1D4ED8` | `Play` | BCH đang điều hành sự kiện thực tế tại Màn 23. |
| **Chờ kiểm tra hoàn trả** | `#FEF3C7` | `#B45309` | `RotateCcw` | Đã nộp phiếu nghiệm thu hoàn trả tài sản Màn 24. |
| **Chờ KHTC duyệt thanh toán** | `#EBF4FA` | `#075F9F` | `DollarSign`| Đã nộp chứng từ Màn 29, đang chờ thẩm định Màn 30. |
| **KHTC yêu cầu bổ sung chứng từ** | `#FFF4ED` | `#C24C0A` | `FileWarning` | KHTC bấm nhánh Thiếu tại `GPay`, chuyển Màn 31. |
| **Đã giải ngân thanh toán** | `#EAF8F0` | `#0D914B` | `CheckCheck` | Lãnh đạo duyệt chi & KHTC chuyển khoản Màn 35. |
| **Không chấp thuận / Dừng** | `#FEE2E2` | `#991B1B` | `Slash` | Bị từ chối tại Khoa, Đoàn hoặc KHTC từ chối thanh toán. |
| **Đã hoàn tất & Lưu trữ** | `#F1F5F9` | `#0F172A` | `Archive` | Hoàn thành toàn diện quy trình tại Màn hình 36. |

### 5.10. Multi-step Process Timeline (Thanh tiến độ 7 chặng)
Thanh tiến trình trực quan đặt ở đầu trang Chi tiết hồ sơ (Màn hình 02):
- **7 Chặng chính**:
  1. `01 Soạn thảo hồ sơ`
  2. `02 Duyệt cấp Khoa`
  3. `03 Duyệt Đoàn trường`
  4. `04 Đăng ký CSVC`
  5. `05 Triển khai sự kiện`
  6. `06 Báo cáo tổng kết`
  7. `07 Quyết toán kinh phí`
- **Các trạng thái mốc (Node States)**:
  - `Completed`: Vòng tròn xanh lá `#0D914B` có icon dấu tích trắng, đường nối màu xanh lá.
  - `Current / In Progress`: Vòng tròn xanh dương `#075F9F` có chấm trắng phát sáng, đường nối xanh xám.
  - `Upcoming / Pending`: Vòng tròn xám `#E2E8F0` có số thứ tự màu xám, đường nối xám nhạt.
  - `Rejected / Warning`: Vòng tròn đỏ hoặc cam biểu thị điểm đang phát sinh yêu cầu sửa đổi hoặc bị từ chối.

### 5.11. Shared Booking Calendar Grid (Lưới lịch dùng chung CSVC)
- Bảng lịch tuần trực quan phân chia theo các Hội trường: Hội trường A, Hội trường H, Nhà thi đấu đa năng, Phòng họp B102, Phòng Smart Classroom C201.
- Khung giờ: Sáng (07:30 - 11:30), Chiều (13:30 - 17:30), Tối (18:00 - 21:30).
- **Trạng thái ô lịch (Time Slot Variants)**:
  - `Slot/Available` (Nền xanh nhạt `#F0FDF4`, viền `#BBF7D0`, chữ "Trống"): Cho phép bấm chọn để mượn.
  - `Slot/Booked` (Nền xanh dương `#EBF4FA`, viền `#BAE6FD`, hiển thị: *"Đoàn TN - DUE Hackathon"*).
  - `Slot/Conflict` (Nền đỏ viền kẻ sọc `#FEF2F2`, viền `#FCA5A5`, hiển thị: *"Trùng lịch Hội nghị Nghiên cứu Khoa học"*).
  - `Slot/Maintenance` (Nền xám chéo `#F1F5F9`, chữ *"Bảo trì hệ thống âm thanh"*).

### 5.12. AI Suggestion Card Component (Thẻ gợi ý AI Copilot)
- **Đặc trưng nhận diện**: Khối Card có đường viền gradient tinh tế từ Xanh dương DUE `#075F9F` sang Xanh ngọc, nền trắng `#FFFFFF` kết hợp header xanh nhạt `#F0F9FF`.
- **Thành phần**:
  - Icon: Cụm lấp lánh (Sparkle Icon) màu xanh dương.
  - Huy hiệu: Badge "Trợ lý AI Phân tích" (AI Copilot).
  - Khối nội dung gợi ý: Liệt kê các điểm cần tối ưu (ví dụ: *"Phát hiện dự trù kinh phí mục in ấn cao hơn 15% khung thông lệ"* hoặc *"Hội trường H phù hợp hơn với quy mô 350 sinh viên so với Hội trường A"*).
  - Cụm nút hành động: Nút Primary *"Áp dụng gợi ý ngay"* và Nút Ghost *"Bỏ qua gợi ý"*.

### 5.13. Modal Dialog Components (Hộp thoại tương tác nghiệp vụ)
- Cấu trúc chung: Nền phủ mờ (Backdrop overlay: `rgba(15, 23, 42, 0.45)`), Khung hộp thoại bo góc `12px`, bóng `shadow-lg`, chiều rộng chuẩn `560px` hoặc `640px`.
- **3 Dạng Modal chính**:
  1. `Modal/Approve`: Icon khiên xanh lá, Tiêu đề xác nhận phê duyệt, tóm tắt nội dung ký duyệt, Nút bấm xanh lá *"Xác nhận phê duyệt"*.
  2. `Modal/RequestChange`: Icon bút cam, Tiêu đề yêu cầu sửa đổi, Khung nhập văn bản bắt buộc: *"Nhập chi tiết các nội dung cần bổ sung, chỉnh sửa..."*, Nút bấm cam *"Gửi yêu cầu chỉnh sửa"*.
  3. `Modal/Reject`: Icon tam giác đỏ cảnh báo, Tiêu đề không phê duyệt/từ chối, Cảnh báo: *"Hành động này sẽ kết thúc xử lý hồ sơ sự kiện này"*, Khung lý do từ chối bắt buộc, Nút bấm đỏ *"Xác nhận từ chối"*.

### 5.14. Toast Notification Component
- Xuất hiện ở góc trên bên phải màn hình (`Top: 24px, Right: 24px`), tự động trượt vào và mờ dần sau 4 giây.
- 4 Variants: `Toast/Success` (xanh lá), `Toast/Warning` (cam), `Toast/Error` (đỏ), `Toast/Info` (xanh dương).
