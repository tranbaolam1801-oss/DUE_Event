# BÁO CÁO ĐÁNH GIÁ CHẤT LƯỢNG GIAO DIỆN UI/UX (UI QUALITY REVIEW)
**Hệ thống Quản lý Quy trình Tiếp nhận, Xét duyệt và Cấp phép Tổ chức Sự kiện – MY DUE**  
**Tài liệu xuất xưởng:** `docs/ui-review.md` & Danh mục Punch List hành động

---

## I. TỔNG QUAN ĐÁNH GIÁ (EXECUTIVE SUMMARY)

- **Điểm đánh giá tổng thể**: **86 / 100 (Đạt yêu cầu kiến trúc, cần hiệu chỉnh các nhánh Gateway trên Mobile)**
- **Phạm vi kiểm toán**:
  - Đối chiếu 100% với luồng quy trình nguồn: `ToBe_Nhom3.bpmn` (5 Lanes, 33 Elements: 23 User Tasks, 10 Service Tasks, 3 End Events, 6 XOR Gateways).
  - Đối chiếu tài liệu hỗ trợ: `Nhom3.docx` (8 điểm tự động hóa, 3 đề xuất AI), `HỒ SƠ ĐẤU THẦU.docx` (phần cấp phép sự kiện, tuyệt đối không có sân bóng), `docs/ui-screen-inventory.md`, `docs/bpmn-ui-mapping.md`, `docs/figma-design-system.md`, `docs/figma-prototype-spec.md`.
  - Kiểm tra toàn bộ 74 file vector SVG (37 màn hình Desktop 1440×900 và 37 màn hình Mobile 390×844) trong thư mục `figma/DUE_ToBe_Figma_ThietKe_UI/` cùng các file tổng quan `XEM_NHANH_DESKTOP.png` và `XEM_NHANH_MOBILE.png`.
- **Đánh giá ranh giới kỹ thuật (Technical Boundaries)**:
  - **100% UI-ONLY COMPLIANT**: Không phát hiện bất kỳ mã Backend, REST API, GraphQL, cơ sở dữ liệu (SQL/NoSQL), Node.js server, hay server actions nào. Dữ liệu hoàn toàn là static mock-data trên SVG.
  - Bộ giao diện được xuất bản trung thực dưới dạng **Editable Vector SVG Kit** kèm hướng dẫn Figma import, không tạo file `.fig` giả mạo.

---

## II. MA TRẬN ĐỐI CHIẾU 6 XOR GATEWAYS & ĐIỀU KIỆN RẼ NHÁNH

Bảng đối chiếu kiểm toán giữa BPMN và thực tế thể hiện trên canvas thiết kế:

| Gateway ID | Tên Gateway (BPMN) | Điều kiện / Nhánh rẽ trong BPMN | Màn hình liên quan | Tình trạng Desktop (1440×900) | Tình trạng Mobile (390×844) | Đánh giá kiểm toán |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`GKhoa`** | Đánh giá cấp Khoa | 1. Duyệt (`SignKhoa`)<br>2. Sửa (`FixKhoa`)<br>3. Từ chối (`RejectKhoa` - End) | Screen 09 (`09_Tham_dinh_ho_so_cap_khoa`) | Đầy đủ 3 nút:<br>- Từ chối (đỏ)<br>- Yêu cầu sửa (cam)<br>- Duyệt hồ sơ (xanh) | **THIẾU NÚT**: Chỉ có 2 nút:<br>- Yêu cầu sửa<br>- Phê duyệt.<br>**Mất nút Từ chối!** | **CRITICAL (Mobile)**: Người dùng mobile không thể kích hoạt nhánh `RejectKhoa`. |
| **`GDoan`** | Đánh giá Đoàn trường | 1. Duyệt (`ApproveDoan`)<br>2. Sửa (`FixDoan`)<br>3. Từ chối (`RejectDoan` - End) | Screen 14 (`14_Tham_dinh_ho_so_tai_Doan_truong`) | Đầy đủ 3 nút:<br>- Từ chối (đỏ)<br>- Yêu cầu sửa (cam)<br>- Phê duyệt (xanh) | **THIẾU NÚT**: Chỉ có 2 nút:<br>- Yêu cầu sửa<br>- Phê duyệt.<br>**Mất nút Từ chối!** | **CRITICAL (Mobile)**: Người dùng mobile không thể kích hoạt nhánh `RejectDoan`. |
| **`GFacility`** | Đánh giá khả năng đáp ứng CSVC | 1. Có (`ApproveFacility`)<br>2. Chưa (`AdjustFacility`) | Screen 20 (`20_Xac_minh_va_quyet_dinh_CSVC`) | **THU HẸP NHÁNH**: Chỉ có 1 nút bấm chung duy nhất: **"Xác nhận đã xem"** (`#075F9F`). | **THU HẸP NHÁNH**: Chỉ có 1 nút bấm duy nhất: **"Lưu / Tiếp tục"** (`#0D914B`). | **CRITICAL**: Không có 2 nút rẽ nhánh rõ ràng ("Xác nhận đáp ứng" vs "Báo trùng lịch / Chưa đáp ứng"). |
| **`GReport`** | Báo cáo cần AI hỗ trợ? | 1. Có (`AIReport`)<br>2. Không (`MergeReport`) | Screen 25 (`25_Kiem_tra_tinh_trang_hoan_tra`) | Chỉ có 1 nút: **"Xác nhận hoàn tất"** (`#075F9F`). | Chỉ có 1 nút: **"Xác nhận / Tiếp tục"** (`#0D914B`). | **MAJOR**: Màn hình 25 là bước của CSVC; nhánh rẽ AI hay tự viết báo cáo thuộc về BCH ở Screen 26/27. Cần thể hiện rõ tuỳ chọn tại bước BCH. |
| **`GPay`** | Kiểm tra chứng từ | 1. Đủ (`SubmitApproval`)<br>2. Thiếu (`FixPay`) | Screen 30 (`30_Kiem_tra_chung_tu_thanh_toan`) | Chỉ có 1 nút: **"Hoàn tất kiểm tra"** (`#075F9F`). | Chỉ có 1 nút: **"Xác nhận / Tiếp tục"** (`#0D914B`). | **CRITICAL**: Mất action "Yêu cầu bổ sung chứng từ" (`FixPay`) trên canvas của KHTC. |
| **`GApproval`** | Duyệt thanh toán | 1. Có (`PerformPay`)<br>2. Không (`RefusePay` - End) | Screen 33 (`33_Phe_duyet_thanh_toan`) | Có 3 nút:<br>- Từ chối (đỏ)<br>- **Yêu cầu sửa (cam - PHANTOM)**<br>- Phê duyệt (xanh) | **THIẾU NÚT**: Chỉ có 2 nút:<br>- Yêu cầu sửa (cam)<br>- Phê duyệt (xanh).<br>**Mất nút Từ chối!** | **MAJOR / CRITICAL**: Desktop xuất hiện nút "Yêu cầu sửa" không có trong BPMN; Mobile mất nút "Từ chối". |

---

## III. BÁO CÁO PHÁT HIỆN CHI TIẾT THEO MỨC ĐỘ NGHIÊM TRỌNG (DETAILED FINDINGS)

### 1. MỨC ĐỘ NGHIÊM TRỌNG CAO (CRITICAL / BLOCKER)

#### [CRIT-01] Thiếu hoàn toàn nút "Từ chối" (`RejectKhoa`) trên Mobile Screen 09
- **Mã màn hình**: Screen 09 – `Mobile_SVG/09_Tham_dinh_ho_so_cap_khoa.svg`
- **Thành phần BPMN**: Gateway `GKhoa` và End Event `RejectKhoa`.
- **Hiện trạng**: File SVG mobile chỉ render 2 nút:
  - `<rect fill="#FE751E"/>` -> `<text>Yêu cầu sửa</text>`
  - `<rect fill="#0E9045"/>` -> `<text>Phê duyệt</text>`
  Nút màu đỏ "Từ chối" (`#D32F2F`) hoàn toàn vắng mặt.
- **Tác động**: Không thể kích hoạt luồng kết thúc quy trình do Khoa từ chối trên thiết bị di động.
- **Khắc phục**: Thêm nút thứ ba màu đỏ "Từ chối" (hoặc xếp cụm 3 nút: 1 nút Primary xanh, 2 nút Secondary cam/đỏ) đảm bảo đủ 3 nhánh của `GKhoa`.

#### [CRIT-02] Thiếu hoàn toàn nút "Từ chối" (`RejectDoan`) trên Mobile Screen 14
- **Mã màn hình**: Screen 14 – `Mobile_SVG/14_Tham_dinh_ho_so_tai_Doan_truong.svg`
- **Thành phần BPMN**: Gateway `GDoan` và End Event `RejectDoan`.
- **Hiện trạng**: Tương tự Screen 09, canvas mobile chỉ có 2 nút: "Yêu cầu sửa" (cam) và "Phê duyệt" (xanh). Nút "Từ chối" màu đỏ bị loại bỏ do thiếu không gian dọc.
- **Tác động**: Đứt gãy luồng kết thúc hồ sơ cấp Đoàn trường trên Mobile.
- **Khắc phục**: Bổ sung action button "Từ chối hồ sơ" vào vùng Sticky Footer của màn hình 14.

#### [CRIT-03] Thu hẹp nhánh quyết định CSVC thành nút đơn trên Screen 20
- **Mã màn hình**: Screen 20 – `Desktop_SVG/20_Xac_minh_va_quyet_dinh_CSVC.svg` & `Mobile_SVG/20_Xac_minh_va_quyet_dinh_CSVC.svg`
- **Thành phần BPMN**: Gateway `GFacility` (rẽ nhánh sang `ApproveFacility` nếu Có, hoặc sang `AdjustFacility` nếu Chưa).
- **Hiện trạng**: Cả Desktop và Mobile chỉ có đúng 1 nút bấm chung: Desktop ghi "Xác nhận đã xem", Mobile ghi "Lưu / Tiếp tục". Không có cơ chế UI nào để chuyên viên CSVC chọn "Báo trùng lịch / Yêu cầu đổi phòng" hoặc "Chấp thuận bố trí".
- **Tác động**: Màn hình biến một User Decision Task thành một màn hình xem thông tin thụ động (Read-only view).
- **Khắc phục**: Thiết kế 2 nút hành động rõ ràng:
  1. Primary (`#0D914B`): "Xác nhận bố trí CSVC" -> điều hướng đến Screen 22 (`ApproveFacility`).
  2. Secondary (`#F36B21`): "Báo trùng lịch / Đổi phòng" -> kích hoạt modal lý do và điều hướng đến Screen 21 (`AdjustFacility`).

#### [CRIT-04] Mất nhánh "Thiếu chứng từ" (`FixPay`) trên canvas Screen 30
- **Mã màn hình**: Screen 30 – `Desktop_SVG/30_Kiem_tra_chung_tu_thanh_toan.svg` & `Mobile_SVG/30_Kiem_tra_chung_tu_thanh_toan.svg`
- **Thành phần BPMN**: Gateway `GPay` (Đủ -> `SubmitApproval`, Thiếu -> `FixPay`).
- **Hiện trạng**: Desktop chỉ có nút "Hoàn tất kiểm tra", Mobile chỉ có nút "Xác nhận / Tiếp tục".
- **Tác động**: Chuyên viên KHTC không có nút bấm để trả hồ sơ yêu cầu BCH bổ sung hoá đơn/chứng từ hợp lệ.
- **Khắc phục**: Bổ sung nút màu cam "Yêu cầu bổ sung chứng từ" bên cạnh nút xanh "Hồ sơ hợp lệ (Trình duyệt)".

#### [CRIT-05] Mất nhánh "Từ chối thanh toán" (`RefusePay`) trên Mobile Screen 33
- **Mã màn hình**: Screen 33 – `Mobile_SVG/33_Phe_duyet_thanh_toan.svg`
- **Thành phần BPMN**: Gateway `GApproval` -> nhánh "Không" dẫn đến `RefusePay` (Screen 34).
- **Hiện trạng**: Mobile Screen 33 chỉ hiển thị "Yêu cầu sửa" và "Phê duyệt". Nút "Từ chối chi trả" không xuất hiện.
- **Tác động**: Không thể điều hướng đến Screen 34 trên giao diện di động.
- **Khắc phục**: Đồng bộ cụm nút quyết định chi trả: "Từ chối" (đỏ) và "Phê duyệt chi trả" (xanh).

---

### 2. MỨC ĐỘ TRUNG BÌNH (MAJOR)

#### [MAJ-01] Xuất hiện hành động không hỗ trợ (Phantom Action) trên Desktop Screen 33
- **Mã màn hình**: Screen 33 – `Desktop_SVG/33_Phe_duyet_thanh_toan.svg`
- **Thành phần BPMN**: Gateway `GApproval` (Chỉ có 2 nhánh: "Có" -> `PerformPay` và "Không" -> `RefusePay`).
- **Hiện trạng**: Desktop Screen 33 hiển thị 3 nút: "Không duyệt" (đỏ), **"Yêu cầu sửa" (cam)**, và "Phê duyệt" (xanh).
- **Tác động**: Trong quy trình BPMN chuẩn, tại bước phê duyệt thanh toán cuối cùng không có luồng quay lại sửa (`FixPay` chỉ diễn ra ở bước Kiểm tra chứng từ `CheckPay` tại Gateway `GPay`). Nút "Yêu cầu sửa" ở đây là một hành động ảo không có Sequence Flow đích trong BPMN.
- **Khắc phục**: Loại bỏ nút "Yêu cầu sửa" trên Screen 33 Desktop, chỉ giữ 2 lựa chọn nhị phân: "Phê duyệt chi trả" và "Không phê duyệt / Từ chối".

#### [MAJ-02] Biến Service Task thành màn hình nhập liệu thủ công dư thừa (Screens 07, 12, 28)
- **Mã màn hình**:
  - Screen 07: `SubmitKhoa` (Gửi hồ sơ cho BCN Khoa)
  - Screen 12: `ForwardDoan` (Chuyển hồ sơ đến Đoàn trường)
  - Screen 28: `AutoReport` (Gửi báo cáo đến Đoàn trường)
- **Bản chất BPMN**: Đây là các `serviceTask` – tác vụ hệ thống tự động chuyển trạng thái và gửi thông báo trong nền sau khi User Task trước đó hoàn tất (`BCHConfirm`, `SignKhoa`, `ReviewReport`).
- **Hiện trạng thiết kế**: Cả 3 màn hình này đều được vẽ thành các màn hình độc lập với form chi tiết và nút bấm thủ công ("Xác nhận gửi hồ sơ"), gây cảm giác người dùng phải thực hiện 2 lần thao tác lặp lại (ví dụ: vừa kiểm chứng ở màn hình 06, bấm tiếp màn hình 07 chỉ để gửi).
- **Khắc phục**:
  - Trong tài liệu bàn giao Figma, định rõ: Màn hình 07, 12, 28 là **Màn hình trạng thái xác nhận chuyển tự động (Success/Status Screen)** hoặc Modal thông báo tự đóng sau 2 giây, không phải form thao tác riêng biệt.

#### [MAJ-03] Mâu thuẫn trạng thái và CTA màu xanh sai lệch trên Screen 34 ("Thông báo không thanh toán")
- **Mã màn hình**: Screen 34 – `Mobile_SVG/34_Thong_bao_khong_thanh_toan.svg`
- **Hiện trạng kiểm tra**:
  - Tiêu đề màn hình: "Thông báo không thanh toán" (Hồ sơ bị từ chối chi trả, tiến trình kết thúc tại End Event).
  - Trường trạng thái trên card: Hiển thị `<text>Chờ xác nhận</text>` (sai lệch ngữ cảnh).
  - Nút bấm hành động: `<rect fill="#0D914B"/>` kèm chữ **"Xác nhận / Tiếp tục"** màu xanh lá tích cực.
  - Nội dung: Hoàn toàn không có trường hiển thị "Lý do không thanh toán" hay ý kiến của cấp phê duyệt.
- **Khắc phục**:
  - Đổi trạng thái sang badge đỏ/xám: "Không phê duyệt thanh toán".
  - Thêm hộp văn bản: "Lý do từ chối: Chứng từ không đủ điều kiện quyết toán theo quy định tài chính".
  - Đổi nút bấm thành nút trung tính: "Quay về trang chủ" hoặc "Đóng hồ sơ" (`#728398` hoặc viền outline).

#### [MAJ-04] Gán sai thẩm quyền quản trị tại Screen 33 ("Phê duyệt thanh toán")
- **Mã màn hình**: Screen 33 – `Desktop_SVG/33_Phe_duyet_thanh_toan.svg`
- **Hiện trạng**: Màn hình gán vai trò hiện tại là "Phòng Kế hoạch Tài chính".
- **Đối chiếu thực tế**: Phòng KHTC chỉ có chức năng thẩm tra, lập phiếu trình thanh toán (`SubmitApproval` - Screen 32). Thẩm quyền "Phê duyệt thanh toán" (`ApprovePayment` - Screen 33) thuộc về **Chủ tài khoản (Ban Giám hiệu)** theo quy chế chi tiêu nội bộ của trường đại học.
- **Khắc phục**: Cập nhật nhãn vai trò tại header và sidebar của Screen 33 thành: "Ban Giám hiệu / Chủ tài khoản (Mô phỏng)" để phân định rõ với vai trò thẩm định của chuyên viên KHTC.

---

### 3. MỨC ĐỘ THẤP & HOÀN THIỆN THẨM MỸ (MINOR & POLISH)

#### [MIN-01] Vùng chạm (Touch Target) trên Mobile < 44px
- **Mã màn hình**: Toàn bộ các màn hình Mobile (ví dụ: Screen 09, 20, 30, 34).
- **Hiện trạng**: Chiều cao các nút CTA chính trên mobile được vẽ với `height="39"` đến `height="41"`.
- **Tiêu chuẩn**: Apple Human Interface Guidelines và WCAG 2.1 Target Size khuyến nghị tối thiểu **44×44px** (hoặc 48×48px theo Material Design) để tránh chạm nhầm.
- **Khắc phục**: Điều chỉnh toàn bộ rect nút mobile lên `height="44"` hoặc `height="48"`, căn lại baseline text `y`.

#### [MIN-02] Tỉ lệ tương phản màu (Contrast Ratio) của chữ phụ trên badge
- **Vị trí**: Badge trạng thái và breadcrumb sử dụng chữ `#728398` trên nền `#EAF4FB` hoặc `#F3F6F9`.
- **Đo lường**: Độ tương phản xấp xỉ **3.2:1**, không đạt ngưỡng WCAG 2.1 AA cho văn bản nhỏ (<18pt yêu cầu tối thiểu **4.5:1**).
- **Khắc phục**: Đổi màu chữ phụ trên badge sang `#516377` hoặc `#18334F` để đạt tỉ lệ tương phản > 5.1:1.

#### [MIN-03] Không nhất quán mã màu thương hiệu DUE giữa các tài liệu
- **Hiện trạng**:
  - Trong `AGENTS.md`: Xanh DUE `#075F9F`, Xanh lá `#0E9045`, Cam `#FE751E`.
  - Trong SVG thực tế và `DESIGN_TOKENS.json`: Xanh lá dùng `#0D914B`, Cam dùng `#F36B21`.
- **Đánh giá**: Tuy cùng thuộc nhóm sắc thái nhận diện DUE, sự sai lệch mã Hex giữa tài liệu đặc tả và file thiết kế gây khó khăn khi lập Style Dictionary.
- **Khắc phục**: Đồng bộ một bộ token duy nhất: `color-primary: #075F9F`, `color-success: #0D914B`, `color-accent: #FE751E` (hoặc `#F36B21`).

#### [MIN-04] Widget "Luồng xử lý" ở cột phải bị copy-paste tĩnh ở các bước cuối
- **Mã màn hình**: Screen 34, 35, 36 (Desktop).
- **Hiện trạng**: Tại Screen 36 ("Xác nhận và lưu trữ hồ sơ" - bước kết thúc quy trình), widget cột phải vẫn hiển thị:
  - Step 1: "Hồ sơ đã tiếp nhận" (tick xanh)
  - Step 2: "Đang xử lý tại đơn vị" (icon hồ sơ)
  - Step 3: "Chờ bước tiếp theo" (icon hồ sơ).
- **Tác động**: Gây hiểu nhầm là quy trình chưa kết thúc, vẫn còn bước chờ.
- **Khắc phục**: Ở Screen 36, đổi Step 3 thành "Đã hoàn tất & Lưu trữ" với biểu tượng tick xanh hoàn thành.

#### [MIN-05] Văn bản boilerplate mô phỏng lặp lại đơn điệu
- **Hiện trạng**: Dòng chữ `"Thông tin lấy từ bộ dữ liệu mẫu để duyệt giao diện"` và `"Dữ liệu minh họa • Vai trò và trạng thái chỉ được mô phỏng"` lặp lại ở hầu hết 37 màn hình.
- **Khắc phục**: Khi tinh chỉnh trong Figma, thay bằng nội dung mô phỏng sát thực tế sự kiện (ví dụ: tên diễn giả, địa điểm phòng A.101, chi tiết danh mục âm thanh, ánh sáng).

---

## IV. BẢNG DANH MỤC PUNCH LIST HÀNH ĐỘNG (CONCISE PUNCH LIST)

| STT | Mã màn hình | Tên màn hình | Mức độ | Vấn đề phát hiện | Giải pháp khắc phục cụ thể |
| :---: | :---: | :--- | :---: | :--- | :--- |
| **01** | `SCR-09-M` | Thẩm định cấp Khoa (Mobile) | **CRITICAL** | Thiếu nút "Từ chối" (`RejectKhoa`) | Bổ sung nút đỏ "Từ chối hồ sơ" (h: 44px) cạnh nút Sửa và Duyệt. |
| **02** | `SCR-14-M` | Thẩm định Đoàn trường (Mobile) | **CRITICAL** | Thiếu nút "Từ chối" (`RejectDoan`) | Bổ sung nút đỏ "Từ chối hồ sơ" (h: 44px) vào khu vực action footer. |
| **03** | `SCR-20-D/M` | Xác minh & quyết định CSVC | **CRITICAL** | Thu hẹp thành 1 nút chung, mất rẽ nhánh `GFacility` | Tách thành 2 nút: "Xác nhận bố trí" (xanh) và "Báo trùng lịch" (cam). |
| **04** | `SCR-30-D/M` | Kiểm tra chứng từ thanh toán | **CRITICAL** | Mất nhánh "Thiếu chứng từ" (`FixPay`) | Thêm nút "Yêu cầu bổ sung chứng từ" (cam) bên cạnh nút "Hồ sơ hợp lệ". |
| **05** | `SCR-33-M` | Phê duyệt thanh toán (Mobile) | **CRITICAL** | Thiếu nút "Từ chối thanh toán" (`RefusePay`) | Bổ sung nút đỏ "Không duyệt thanh toán" điều hướng đến Screen 34. |
| **06** | `SCR-33-D` | Phê duyệt thanh toán (Desktop) | **MAJOR** | Có nút ảo "Yêu cầu sửa" không có trong BPMN | Xóa nút màu cam "Yêu cầu sửa", chỉ giữ 2 nhánh nhị phân (Duyệt / Không duyệt). |
| **07** | `SCR-34-M` | Thông báo không thanh toán | **MAJOR** | Trạng thái ghi "Chờ xác nhận", nút màu xanh "Tiếp tục" | Đổi badge sang "Từ chối thanh toán", thêm lý do từ chối, đổi nút sang "Về trang chủ". |
| **08** | `SCR-07/12/28` | Các tác vụ Service Task | **MAJOR** | Thiết kế như User Form thủ công lặp lại | Chuyển thành trạng thái thông báo tự động (Auto-transition modal/receipt). |
| **09** | `SCR-33-D/M` | Phê duyệt thanh toán | **MAJOR** | Gán vai trò KHTC thay vì Ban Giám hiệu | Sửa nhãn vai trò tại Header/Sidebar thành "Ban Giám hiệu / Chủ tài khoản". |
| **10** | `SCR-ALL-M` | Toàn bộ 37 màn hình Mobile | **MINOR** | Chiều cao nút CTA 39px-41px (< 44px HIG) | Nâng chiều cao toàn bộ các nút bấm chính lên 44px. |
| **11** | `SCR-ALL` | Hệ thống Badge | **MINOR** | Màu chữ `#728398` trên `#EAF4FB` tương phản ~3.2:1 | Chỉnh màu chữ lên `#516377` để đạt chuẩn WCAG AA (> 4.5:1). |
| **12** | `SCR-36-D` | Xác nhận và lưu trữ hồ sơ | **MINOR** | Luồng xử lý cột phải vẫn để "Chờ bước tiếp theo" | Đổi trạng thái bước cuối thành "Hoàn tất & Lưu trữ thành công" (tick xanh). |

---

## V. ĐÁNH GIÁ CHẤT LƯỢNG KỸ THUẬT & RESPONSIVE

1. **Khổ màn hình Desktop (1440×900)**:
   - Tỉ lệ phân chia 2 cột rất khoa học: Sidebar cố định 246px, Topbar 76px, Body chính 1194px chứa Main Form Card (726px) và Activity Rail (372px).
   - Khoảng đệm (padding) 24px/32px tuân thủ chặt chẽ lưới 8px.
   - Không xuất hiện hiện tượng tràn ngang (overflow-x) ở độ phân giải 1440px tiêu chuẩn.

2. **Khổ màn hình Mobile (390×844 - iPhone 12/13/14 Standard)**:
   - Header thu gọn thành Status bar (44px) + URL Bar + Brand strip (73px) + Hamburger menu.
   - Cơ chế chuyển đổi từ bảng 2 cột sang thẻ khối xếp chồng (Stacked Cards) mượt mà, dễ đọc.
   - Khắc phục điểm yếu: Mở rộng vùng chạm nút bấm (tối thiểu 44px) và bố trí lại cụm nút hành động đa nhánh (tối đa 3 nút theo dạng cột dọc).

3. **Tính trung thực về định dạng bàn giao (Transparency)**:
   - Bộ sản phẩm đáp ứng chính xác cam kết: Cung cấp đầy đủ 74 file vector SVG gốc sẵn sàng kéo-thả vào Figma Design, không ngụy tạo file `.fig` giả.
   - File hướng dẫn `Huong_dan.md` và mã token `DESIGN_TOKENS.json` hỗ trợ tối đa việc tái lập Design System trong Figma.

---

### VI. KẾT LUẬN & KIẾN NGHỊ CHO BƯỚC TIẾP THEO
Hệ thống UI MY DUE đã đạt được khối lượng công việc rất lớn và độ bao phủ BPMN ấn tượng (37/37 màn hình chức năng, bao phủ đầy đủ 5 phòng ban/đơn vị). Để hoàn thiện ở mức hoàn hảo trước khi demo hoặc nghiệm thu, khuyến nghị đội ngũ thiết kế thực hiện ngay 5 mục **CRITICAL** trong Punch List (đặc biệt là bổ sung nút "Từ chối" trên Mobile Screens 09, 14, 33 và tách nút rẽ nhánh trên Screens 20, 30).
