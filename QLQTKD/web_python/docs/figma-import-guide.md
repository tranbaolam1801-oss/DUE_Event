# HƯỚNG DẪN NHẬP VÀ CẤU TRÚC FILE TRONG FIGMA DESIGN (FIGMA IMPORT & STRUCTURE GUIDE)

> **Dự án**: Cổng thông tin Quản lý Quy trình Xét duyệt và Tổ chức Sự kiện MY DUE  
> **Căn cứ nghiệp vụ**: `ToBe_Nhom3.bpmn`, `Nhom3.docx`, `docs/figma-design-system.md`, `docs/figma-prototype-spec.md`  
> **Bộ tài sản bàn giao**: 74 file vector SVG chuẩn chỉnh 100% (37 Desktop 1440×900 px & 37 Mobile Web 390×844 px)  
> **Cam kết kỹ thuật**: Bàn giao Vector SVG tách lớp nguyên bản – KHÔNG gian lận đổi đuôi file, bảo đảm 100% khả năng biên tập trong Figma.

---

## 1. TÍNH TRUNG THỰC VỀ ĐỊNH DẠNG VÀ CAM KẾT KỸ THUẬT (FORMAT TRANSPARENCY)

> [!IMPORTANT]
> **Tuyên bố về định dạng file Figma**:  
> Định dạng tệp nhị phân `.fig` là định dạng độc quyền được mã hóa nhị phân nội bộ (proprietary binary schema) của Figma Inc. Hiện tại trên toàn thế giới, **không có bất kỳ công cụ hoặc thư viện nguồn mở của bên thứ ba nào có thể biên dịch tạo mới một file `.fig` hợp lệ ngoại tuyến** mà không thông qua Figma Desktop Application hoặc Figma Enterprise REST API có chứng thực khóa cá nhân (Personal Access Token).  
> Bất kỳ hành vi đổi phần mở rộng tệp `.svg` hay `.zip` thành `.fig` đều dẫn đến lỗi hỏng file không thể mở được (*"Corrupted file error"*).

### Giải pháp chuẩn mực công nghiệp của MY DUE:
Thay vì tạo file nhị phân giả mạo, dự án MY DUE bàn giao **toàn bộ 74 màn hình dưới dạng Vector SVG chuẩn mực W3C**:
- **Bảo toàn 100% vector fidelity**: Không vỡ nét, không phụ thuộc độ phân giải màn hình.
- **Tách lớp phân cấp tường minh**: Phân định rõ ràng từng thẻ `<g id="...">` cho Header, Sidebar, Timeline, Card, Table, Form Inputs, Action Buttons.
- **Văn bản biên tập được (Editable Text)**: Mọi tiêu đề, nhãn trường, nội dung quy trình đều sử dụng thẻ `<text>` chuẩn với phông `Inter`, cho phép nhấp đúp để sửa chữ trực tiếp trong Figma.
- **Mã màu chuẩn nhận diện DUE**: Tích hợp mã màu HEX/RGB chính thức: Xanh dương `#075F9F`, Xanh lá `#0D914B`, Cam `#FE751E` / `#F36B21`, Trắng `#FFFFFF`, Nền `#F6F8FB`.

---

## 2. KIẾN TRÚC PHÂN CHIA TRANG TRONG FIGMA (FIGMA PAGES ARCHITECTURE)

Để dự án được tổ chức khoa học theo chuẩn **Design Ops** chuyên nghiệp của các tổ chức giáo dục lớn, file Figma tổng thể của MY DUE cần được cấu trúc thành **8 Pages** riêng biệt:

```
📁 MY DUE - EVENT MANAGEMENT SYSTEM (Figma File)
│
├── 📄 00 🎨 Design System & Foundations
├── 📄 01 🏛️ 01_BCH_LienChiDoan (20 screens)
├── 📄 02 🎓 02_BCN_Khoa (4 screens)
├── 📄 03 🚩 03_Doan_Truong (3 screens)
├── 📄 04 🏢 04_Phong_CSVC (5 screens)
├── 📄 05 💰 05_Phong_KHTC (5 screens)
├── 📄 06 📱 06_Mobile_Web (37 screens 390x844)
└── 📄 07 ⚡ 07_Prototypes_States (Modals & Gateways)
```

### Chi tiết nội dung từng Trang (Page):

#### Trang `00 🎨 Design System & Foundations`
- Chứa các Frame quy chuẩn nền tảng:
  - Bảng màu Color Styles (Primary Blue, Secondary Green, Accent Orange, Danger Red, Neutrals).
  - Thang Typography Text Styles (Display, H1, H2, H3, Body 1, Body 2, Caption, Tiny).
  - Thư viện Master Components: Header (5 variants theo vai trò), Sidebar (5 variants), Buttons, Input Fields, DatePicker, FileUpload, Status Badges, Process Timeline, Shared Calendar, AI Suggestion Card.

#### Trang `01 🏛️ 01_BCH_LienChiDoan` (20 Màn hình Desktop 1440×900)
Chứa toàn bộ các màn hình do Ban Chấp hành Liên Chi Đoàn thực hiện:
- `00_dashboard_bch` (Tổng quan quy trình & Chỉ số hoạt động)
- `01_event_list` (Danh sách hồ sơ sự kiện tập trung)
- `02_event_timeline` (Chi tiết hồ sơ và tiến độ 7 chặng)
- `03_create_plan` (Lập kế hoạch và hồ sơ tổ chức)
- `04_budget_plan` (Lập dự trù kinh phí chi tiết)
- `05_ai_review` (Rà soát hồ sơ bằng AI Copilot)
- `06_bch_confirm` (Kiểm chứng và hoàn thiện hồ sơ)
- `07_submit_khoa` (Nộp hồ sơ điện tử cho BCN Khoa)
- `10_fix_khoa` (Chỉnh sửa theo góp ý của Khoa)
- `15_fix_doan` (Chỉnh sửa theo góp ý của Đoàn trường)
- `17_facility_form` (Tạo đơn mượn địa điểm & thiết bị CSVC)
- `21_adjust_facility` (Điều chỉnh hội trường hoặc khung giờ mới)
- `23_prepare_event` (Checklist triển khai và tổ chức sự kiện thực tế)
- `24_return_facility` (Phiếu đề nghị hoàn trả và nghiệm thu CSVC)
- `26_ai_report` (AI tự động tạo bản nháp báo cáo tổng kết)
- `27_review_report` (Kiểm tra và xác nhận báo cáo tổng kết)
- `28_auto_report` (Gửi báo cáo tổng kết đến Đoàn trường)
- `29_pay_package` (Lập và rà soát chứng từ, hóa đơn VAT thanh toán)
- `31_fix_pay` (Bổ sung chứng từ hóa đơn theo yêu cầu KHTC)
- `36_close_event` (Xác nhận và lưu trữ trọn bộ hồ sơ vòng đời)

#### Trang `02 🎓 02_BCN_Khoa` (4 Màn hình Desktop 1440×900)
Chứa các màn hình xét duyệt của Ban Chủ nhiệm Khoa:
- `08_inbox_khoa` (Hòm thư hồ sơ chờ thẩm định cấp khoa)
- `09_review_khoa` (Thẩm định hồ sơ: Duyệt / Sửa / Từ chối - Cổng `GKhoa`)
- `11_sign_khoa` (Khoa ký xác nhận và đóng dấu số điện tử)
- `12_forward_doan` (Chuyển hồ sơ tự động sang Đoàn trường)

#### Trang `03 🚩 03_Doan_Truong` (3 Màn hình Desktop 1440×900)
Chứa các màn hình cấp phép chính thức của Đoàn Trường:
- `13_inbox_doan` (Hòm thư thẩm định kế hoạch toàn trường)
- `14_review_doan` (Thẩm định kế hoạch, an toàn sự kiện - Cổng `GDoan`)
- `16_approve_doan` (Ký duyệt và đóng dấu mộc số - Cho phép tổ chức)

#### Trang `04 🏢 04_Phong_CSVC` (5 Màn hình Desktop 1440×900)
Chứa các màn hình quản lý địa điểm và trang thiết bị:
- `18_check_schedule` (Shared Booking Calendar đối chiếu lịch thời gian thực)
- `19_ai_suggest` (AI phân tích và gợi ý bố trí hội trường/thiết bị tối ưu)
- `20_facility_user` (Xác minh và quyết định cấp phòng - Cổng `GFacility`)
- `22_approve_facility` (Phiếu xác nhận đặt phòng và phân công KTV)
- `25_verify_return` (Kiểm tra hiện trường hoàn trả tài sản - Cổng `GReport`)

#### Trang `05 💰 05_Phong_KHTC` (5 Màn hình Desktop 1440×900)
Chứa các màn hình thẩm định tài chính và giải ngân:
- `30_check_pay` (Kiểm tra tính hợp lệ chứng từ hóa đơn VAT - Cổng `GPay`)
- `32_submit_approval` (Lập tờ trình đề nghị thanh toán lên cấp thẩm quyền)
- `33_approve_payment` (Phê duyệt chi thanh toán - Cổng `GApproval`)
- `34_refuse_pay` (Thông báo không thanh toán số hóa)
- `35_perform_pay` (Lập ủy nhiệm chi thực hiện chuyển khoản giải ngân)

#### Trang `06 📱 06_Mobile_Web` (37 Màn hình 390×844)
Chứa toàn bộ 37 màn hình phiên bản Mobile Web tương ứng từ Màn hình 00 đến 36, sắp xếp thành 5 cột theo 5 vai trò.

#### Trang `07 ⚡ 07_Prototypes_States`
Chứa các Component Trạng thái đặc thù:
- Hộp thoại Modal Duyệt (`Modal_Approve`)
- Hộp thoại Modal Yêu cầu sửa đổi (`Modal_Fix`)
- Hộp thoại Modal Từ chối hồ sơ (`Modal_Reject`)
- Trạng thái Lỗi nhập liệu Form (`State_ValidationError`)
- Trạng thái Rỗng không có dữ liệu (`State_EmptyList`)
- Khung Drawer Navigation trượt của Mobile Web (`Drawer_MobileNav`)

---

## 3. QUY TRÌNH 5 BƯỚC NHẬP VÀ BIÊN TẬP SVG VÀO FIGMA

Để đưa 74 file vector vào Figma đạt chất lượng cao nhất, thực hiện tuần tự 5 bước:

### Bước 1: Khởi tạo File và Danh mục Trang
1. Mở Figma (Desktop App hoặc trình duyệt tại `figma.com`).
2. Bấm nút **+ New Design File**.
3. Đổi tên file ở thanh trên cùng thành: `MY_DUE_Event_Management_Design_System`.
4. Mở bảng điều khiển Trang (Pages Panel) ở thanh bên trái, bấm nút `+` để tạo đủ 8 trang với tên gọi đúng theo mục 2 ở trên.

### Bước 2: Kéo thả Vector SVG vào Figma
1. Mở thư mục chứa mã nguồn dự án trên máy tính:
   - Thư mục Desktop: `design/desktop/` (chứa 37 file SVG)
   - Thư mục Mobile: `design/mobile/` (chứa 37 file SVG)
2. Chọn trang `01 🏛️ 01_BCH_LienChiDoan` trên Figma.
3. Kéo thả 20 file SVG của BCH Liên Chi Đoàn trực tiếp vào vùng Canvas của trang này.
4. Lặp lại thao tác kéo thả cho các trang `02_BCN_Khoa`, `03_Doan_Truong`, `04_Phong_CSVC`, `05_Phong_KHTC`, và `06_Mobile_Web`.
5. Figma sẽ tự động phân tích và tạo thành các Frame vector giữ nguyên kích thước chuẩn `1440×900` và `390×844`.

### Bước 3: Chuẩn hóa Layer và Frame
1. Chọn từng Frame vừa nhập, kiểm tra thông số kích thước tại bảng bên phải (Design Panel):
   - Màn Desktop: Chiều rộng `W: 1440`, Chiều cao `H: 900`. Bật cờ `Clip content`.
   - Màn Mobile: Chiều rộng `W: 390`, Chiều cao `H: 844`. Bật cờ `Clip content`.
2. Kiểm tra tên Frame: Đảm bảo trùng khớp với mã màn hình (ví dụ: `00_dashboard_bch`, `09_review_khoa`, `20_facility_user`).
3. Mở cây Layer bên trái: Các nhóm đối tượng đã được đóng gói thành các nhóm layer rành mạch (`Header`, `Sidebar`, `Content`, `Actions`, `Timeline`).

### Bước 4: Chuyển đổi thành Figma Components & Variants
1. Trên trang `00 🎨 Design System & Foundations`, chọn cụm Header vừa kéo vào -> Nhấn tổ hợp phím `Ctrl + Alt + K` (Windows) hoặc `Cmd + Option + K` (Mac) để tạo thành **Master Component**.
2. Chọn Master Component -> Bấm `Add Variant` ở bảng bên phải để tạo 5 biến thể Header cho 5 vai trò.
3. Lặp lại thao tác với Sidebar, Button, Badge và Timeline.

### Bước 5: Bật Auto Layout cho các khối giao diện
1. Chọn khối Form nhập liệu hoặc hàng bảng dữ liệu -> Nhấn phím tắt `Shift + A` để bật **Auto Layout**.
2. Cấu hình thông số căn chỉnh Auto Layout theo hướng dẫn chi tiết tại mục 4 dưới đây.

---

## 4. HƯỚNG DẪN THIẾT LẬP AUTO LAYOUT CHO TỪNG LOẠI GIAO DIỆN

Auto Layout giúp giao diện MY DUE có khả năng co giãn linh hoạt và dễ dàng bảo trì thay đổi nội dung mà không bị xô lệch vị trí.

### 4.1. Header Component (Thanh tiêu đề trên)
- **Hướng Auto Layout**: `Horizontal layout` (Nằm ngang).
- **Căn lề (Alignment)**: `Align vertical center` (Căn giữa theo chiều dọc).
- **Phân bổ không gian**: `Space between` (Cụm Breadcrumb bên trái và Cụm User/Notification bên phải tự động dạt sang hai bên).
- **Kích thước Resizing**:
  - Width: `Fill container` (hoặc Fixed `1180px` trên Desktop).
  - Height: `Fixed height 64px`.
- **Khoảng đệm (Padding)**: Padding Left/Right: `24px`, Padding Top/Bottom: `0px`.
- **Đường viền**: Bottom border `1px solid #E1E8EF`.

### 4.2. Sidebar Component (Thanh thực đơn bên trái)
- **Hướng Auto Layout**: `Vertical layout` (Xếp dọc).
- **Căn lề**: `Align top left`.
- **Khoảng cách giữa các mục (Item spacing)**: `8px`.
- **Kích thước Resizing**:
  - Width: `Fixed width 260px`.
  - Height: `Fill container` (`100%`).
- **Khoảng đệm (Padding)**: Top: `16px`, Bottom: `16px`, Left: `16px`, Right: `16px`.
- **Menu Item con**:
  - Direction: `Horizontal`, Spacing: `12px`, Height: `44px`, Padding: `12px`, Border Radius: `8px`.
  - Width: `Fill container`.

### 4.3. Form nhập liệu & Form Group (Màn hình 03, 04, 10, 15, 21, 29, 31)
- **Form Group**:
  - Direction: `Vertical`, Spacing: `6px`.
  - Width: `Fill container`.
- **Nhãn (Label)**: Text 14px Medium `#18334F`.
- **Ô nhập liệu (Input Box)**:
  - Direction: `Horizontal`, Height: `40px` (Input) / `96px` (Textarea).
  - Padding Left/Right: `12px`.
  - Border Radius: `8px`, Border: `1px solid #E1E8EF`.
  - Resizing: `Fill container`.

### 4.4. DataTable Component (Bảng danh sách Màn hình 01, 08, 13, 30)
- **Container bọc ngoài**: Direction: `Vertical`, Spacing: `0px`, Border: `1px solid #E1E8EF`, Radius: `8px`.
- **Hàng tiêu đề (`TableHeader`)**:
  - Direction: `Horizontal`, Height: `44px`, Background: `#F8FAFC`, Border bottom: `1px solid #E1E8EF`.
  - Các ô cell: Text 13px SemiBold `#5E6C84`.
- **Hàng dữ liệu (`TableRow`)**:
  - Direction: `Horizontal`, Height: `52px`, Background: `#FFFFFF`, Border bottom: `1px solid #F1F5F9`.
  - Cột mã hồ sơ (`TicketID`): Width `140px Fixed`.
  - Cột tên sự kiện: Width `Fill container`.
  - Cột trạng thái (`StatusBadge`): Width `180px Fixed`.
  - Cột hành động: Width `120px Fixed`, Align Right.

### 4.5. Modal Dialog (Hộp thoại tương tác nổi)
- **Overlay Frame**: Size `1440×900`, Background `rgba(15, 23, 42, 0.45)`, Auto Layout `Center`.
- **Dialog Box**:
  - Direction: `Vertical`, Spacing: `20px`, Width: `560px Fixed`, Background: `#FFFFFF`, Radius: `12px`, Shadow: `shadow-lg`.
  - Padding: `24px` ở bốn phía.
  - Khối nút hành động đáy: Direction `Horizontal`, Align `Right`, Spacing `12px`, Width `Fill container`.

---

## 5. HƯỚNG DẪN KẾT NỐI PROTOTYPE NHANH (PROTOTYPE WIRING)

Sau khi nhập các file SVG vào đúng trang, chuyển sang chế độ **Prototype** trong Figma bằng phím tắt `Shift + E`:

1. **Thiết lập Flow Starting Point**:
   - Chọn Frame `00_dashboard_bch` trên trang `01_BCH_LienChiDoan` -> Bấm dấu `+` tại mục Flow starting point ở bảng bên phải -> Đổi tên luồng thành: `MY_DUE_Main_Approval_Flow`.
2. **Kéo dây luồng chính (Happy Path)**:
   - Từ nút `+ Tạo hồ sơ mới` trên màn 00: Kéo mũi tên xanh sang màn `03_create_plan`.
   - Từ màn 03 bấm `Tiếp tục`: Kéo sang màn `04_budget_plan`.
   - Từ màn 04 bấm `AI rà soát`: Kéo sang màn `05_ai_review`.
   - Từ màn 05 bấm `Áp dụng`: Kéo sang màn `06_bch_confirm`.
   - Từ màn 06 bấm `Nộp hồ sơ`: Kéo sang màn `07_submit_khoa`.
   - Tiếp tục kết nối tuần tự theo bảng ma trận trong `docs/figma-prototype-spec.md`.
3. **Cấu hình mở Modal Overlay**:
   - Khi nối từ nút `Yêu cầu chỉnh sửa` trên màn 09: Chọn Action là `Open overlay`, chọn Target Frame là `Modal_RequestChange`, Position = `Center`, cờ chọn: `Close when clicking outside`.
4. **Kiểm thử trải nghiệm (Prototype Presentation)**:
   - Nhấn phím tắt `Ctrl + Alt + Enter` (hoặc nút **Play** ở góc trên bên phải) để chạy thử nghiệm toàn bộ luồng duyệt từ đầu đến cuối trên trình chiếu Figma.
