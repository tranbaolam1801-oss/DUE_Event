# MY DUE – BỘ NHẬN DIỆN THƯƠNG HIỆU VÀ CẨM NANG THIẾT KẾ GIAO DIỆN (DESIGN SYSTEM & GUI RULES)

> **Căn cứ tài liệu:** Giáo trình *Chương 6. Thiết kế Giao diện Người dùng (GUI)*, Bộ nhận diện Đại học Kinh tế – Đại học Đà Nẵng (DUE), và Mẫu đăng nhập chuẩn DUE E-Study.

---

## PHẦN I: BỘ NHẬN DIỆN THƯƠNG HIỆU DUE (BRAND IDENTITY)

### 1. Bảng màu thương hiệu chính thống (Brand Palette)
Hệ thống giao diện MY DUE áp dụng chuẩn xác bộ mã màu nhận diện thương hiệu của Trường Đại học Kinh tế – Đại học Đà Nẵng:

| Vai trò màu sắc | Tên màu | Giá trị HEX | Giá trị RGB | Ứng dụng trong giao diện MY DUE |
|:---|:---|:---|:---|:---|
| **Primary Brand** | Xanh Dương DUE | `#075F9F` | `rgb(7, 95, 159)` | Sidebar chủ đạo, Thanh điều hướng, Nút hành động chính (Primary CTA), Tiêu đề quan trọng |
| **Secondary Brand** | Xanh Lá DUE | `#0E9045` | `rgb(14, 144, 69)` | Badge trạng thái "Đã duyệt" (`APPROVED`), Nút hành động Phê duyệt, Thông báo thành công |
| **Accent Brand** | Cam Điểm Nhấn | `#FE751E` | `rgb(254, 117, 30)` | Badge trạng thái "Yêu cầu chỉnh sửa", Thông báo cần chú ý, Điểm nhấn thương hiệu |
| **Neutral Dark** | Đen Chữ (Slate) | `#1E293B` | `rgb(30, 41, 59)` | Màu văn bản chính (Text), độ tương phản đạt chuẩn WCAG AAA (> 11:1) |
| **Neutral Muted** | Xám Nhạt | `#64748B` | `rgb(100, 116, 139)` | Văn bản phụ, nhãn phụ đề, biểu tượng hướng dẫn |
| **Border Gray** | Viền Phân Cách | `#E2E8F0` | `rgb(226, 232, 240)` | Đường kẻ phân tách bảng dữ liệu, đường bao các ô nhập liệu |
| **Surface White** | Trắng Thuần | `#FFFFFF` | `rgb(255, 255, 255)` | Nền thẻ (Card background), Nền bảng dữ liệu, Nền form nhập liệu |
| **App Background** | Nền Nền Tảng | `#F6F8FB` | `rgb(246, 248, 251)` | Nền toàn trang, tạo độ êm dịu cho mắt khi làm việc kéo dài |
| **Danger State** | Đỏ Cảnh Báo | `#DC2626` | `rgb(220, 38, 38)` | Badge trạng thái "Từ chối" (`REJECTED`), Nút hành động Hủy / Xóa |

### 2. Hệ thống kiểu chữ (Typography System)
- **Font Stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
  - Ưu tiên font hệ thống native của Windows/macOS/Linux nhằm tối ưu hóa 100% tốc độ tải trang, không phụ thuộc font mạng bên ngoài, hiển thị tiếng Việt dấu thanh cực kỳ sắc nét.
- **Thang kích thước chữ (Modular Type Scale):**
  - **H1 (Tiêu đề trang):** `24px` (`1.5rem`), `font-weight: 700`, `line-height: 1.2`
  - **H2 (Tiêu đề khối / Card):** `18px` (`1.125rem`), `font-weight: 600`, `line-height: 1.3`
  - **H3 (Tiêu đề phân nhóm):** `15px` (`0.9375rem`), `font-weight: 600`, `line-height: 1.4`
  - **Body text (Văn bản chuẩn):** `14px` (`0.875rem`), `font-weight: 400`, `line-height: 1.5`
  - **Caption / Meta / Badge:** `12px` (`0.75rem`), `font-weight: 500`, `line-height: 1.4`

### 3. Biểu trưng và Tài nguyên đồ họa (Official Assets)
- **Logo Banner DUE:** Được tái sử dụng trực tiếp từ tài nguyên trường (`app/static/images/due_banner_logo.png`), hiển thị sắc nét trên đầu form đăng nhập và tài liệu in ấn.
- **Logo Crest Emblem DUE:** Được đặt tại góc trên Sidebar (`app/static/images/due_logo_emblem.png`) và làm Favicon chuẩn của trình duyệt.
- **Hình ảnh Trường Đại học Kinh tế:** Sử dụng ảnh toàn cảnh khuôn viên trường (`SanTruongDUE.jpg`) tại cột trái màn hình Đăng nhập theo đúng bố cục chuẩn DUE E-Study.

---

## PHẦN II: ÁP DỤNG CÁC NGUYÊN TẮC GIÁO TRÌNH CHƯƠNG 6 (THIẾT KẾ GUI)

### 1. Sáu nguyên tắc cốt lõi về Usability (Tính khả dụng)

#### a) Ease of Use (Dễ sử dụng)
- Thao tác nhanh gọn, các nút bấm hành động đều có phản hồi trực quan (hover state, focus state, active state).
- Mẫu đơn nhập liệu có giá trị mặc định thông minh, ngày bắt đầu mặc định sau hiện tại 7 ngày theo quy chế sự kiện, tự động gợi ý cơ sở vật chất.

#### b) Ease of Learning (Dễ học)
- Màn hình thiết kế theo mô hình chuẩn đại học: Sidebar bên trái, nội dung tác vụ bên phải, thống nhất cấu trúc trên tất cả 10 phân hệ nghiệp vụ.
- Đối với người dùng mới (BCH Liên Chi Đoàn mới nhận nhiệm vụ), form tạo sự kiện có hướng dẫn từng bước và nút **"AI Gợi ý đề xuất"** giúp điền nhanh mẫu chuẩn.

#### c) Consistency (Tính nhất quán)
- **Về thuật ngữ:** Toàn bộ hệ thống sử dụng thuật ngữ tiếng Việt chính thống của Trường: *BCH Liên Chi Đoàn*, *Ban Chủ nhiệm Khoa*, *Đoàn Trường*, *Phòng Cơ sở vật chất*, *Phòng Kế hoạch - Tài chính*.
- **Về màu sắc ngữ nghĩa:** Màu xanh lá luôn luôn là "Đã duyệt/Thành công", màu cam luôn là "Chờ duyệt/Yêu cầu chỉnh sửa", màu đỏ luôn là "Từ chối", màu xanh dương là "Đã nộp/Đang xử lý".
- **Về thành phần giao diện:** Mọi bảng dữ liệu đều có header in hoa xám nhạt, hover dòng trắng ngà, badge trạng thái bo góc 4px.

#### d) Content Awareness (Nhận thức ngữ cảnh)
- Người dùng luôn biết rõ mình đang ở đâu trong hệ thống thông qua 3 yếu tố đồng thời:
  1. Mục menu tương ứng trên Sidebar được tô sáng nền màu xanh đậm `#075F9F`.
  2. Thanh Breadcrumb trên cùng hiển thị rõ đường dẫn phân cấp: `Trang chủ > Quản lý sự kiện > Chi tiết sự kiện #0001`.
  3. Tiêu đề trang (`<title>` và `<h1>`) ghi rõ tên chức năng hiện hành.

#### e) Minimize User Effort (Giảm thiểu nỗ lực người dùng)
- **Tự động tính tổng ngân sách:** Khi thêm dòng dự toán, hệ thống tự động nhân `Số lượng x Đơn giá = Thành tiền` và tính tổng ngân sách tức thời không cần bấm nút tính.
- **1-Click Quick Demo:** Trang đăng nhập cung cấp bộ nút chọn nhanh 7 tài khoản demo đặc thù cho từng vai trò, giúp kiểm thử và thao tác ngay mà không cần nhớ email mật khẩu.

#### f) Aesthetics (Tính thẩm mỹ và Cân đối thông tin)
- Tránh tuyệt đối giao diện chật chội, sử dụng khoảng trắng (White Space) 24px giữa các khối thẻ.
- Không lạm dụng hiệu ứng đổ bóng phức tạp hoặc gradient gây rối mắt; áp dụng phong cách thiết kế phẳng hiện đại (Flat / Subtle Modern).

---

### 2. Thiết kế cho hai nhóm người dùng (Usage Level)
- **Frequent Users (Người dùng thường xuyên - Chuyên viên, Lãnh đạo Khoa/Phòng):**
  - Cung cấp phím tắt hoàn chỉnh (`Tab`, `Enter`, `ESC`), bảng dữ liệu hiển thị mật độ cao, nút bấm hành động duyệt nhanh hiển thị ngay trên thanh công cụ gắn đáy.
- **Infrequent Users (Người dùng không thường xuyên - Sinh viên, Cán bộ mới):**
  - Mọi trường nhập liệu đều có nhãn hướng dẫn rõ ràng (Placeholder + Field Label), thông báo trợ giúp ngữ cảnh và hộp thoại xác nhận trước khi thực hiện các hành động quan trọng (Nộp duyệt, Xóa, Từ chối).

---

### 3. Khả năng tương tác song song (Dual-Mode: Mouse-Only & Keyboard-Only)

Giáo trình Chương 6 nhấn mạnh một giao diện đạt chuẩn phải vận hành trọn vẹn cả khi **CHỈ DÙNG CHUỘT (Mouse-Only)** hoặc **CHỈ DÙNG BÀN PHÍM (Keyboard-Only)** mà không bị phụ thuộc vào hiệu ứng di chuột (hover).

- **Chế độ Mouse-Only:**
  - Tất cả các nút bấm, ô chọn, liên kết đều có diện tích bấm tối thiểu **40px × 40px** (chuẩn cảm ứng và chống bấm trượt).
  - Không có chức năng nào bị ẩn giấu chỉ hiện khi hover chuột; tất cả tác vụ chính đều hiển thị rõ ràng trên màn hình hoặc qua menu ngữ cảnh.
- **Chế độ Keyboard-Only:**
  - Thứ tự điều hướng phím `Tab` được thiết lập tuần tự, tự nhiên từ trên xuống dưới, từ trái sang phải.
  - Vòng viền Focus (`:focus-visible`) được định dạng nổi bật với viền đôi `2px solid #075F9F` kèm viền ngoài `2px solid rgba(7, 95, 159, 0.25)`.
  - Hộp thoại Modal có tính năng **Focus Trap** (giữ phím Tab bên trong modal khi mở) và hỗ trợ phím `ESC` để đóng nhanh.
  - Phím `Enter` kích hoạt nút hành động mặc định; phím `Space` chọn checkbox/toggle.

---

### 4. Áp dụng Định luật Fitts (Fitts's Law) trong việc giảm di chuyển chuột

Định luật Fitts chỉ ra rằng thời gian người dùng di chuyển con trỏ chuột đến một mục tiêu phụ thuộc vào **khoảng cách đến mục tiêu** và **kích thước của mục tiêu**:
$$\text{MT} = a + b \log_2 \left( \frac{2D}{W} \right)$$

Hệ thống MY DUE tối ưu hóa định luật Fitts bằng các giải pháp kiến trúc giao diện sau:
1. **Thanh tác vụ gắn đáy (Sticky Action Bar):** Trên các màn hình chi tiết sự kiện và thẩm định, cụm nút hành động quan trọng nhất (*"Phê duyệt"*, *"Yêu cầu chỉnh sửa"*, *"Từ chối"*) được cố định ở thanh chân trang (bottom sticky bar). Dù trang có nội dung biểu mẫu dài, người dùng không cần phải cuộn chuột tìm nút.
2. **Kích thước nút bấm (Target Width $W$):** Các nút hành động chính có chiều cao chuẩn 40px - 44px, độ rộng đệm lót tối thiểu 16px - 24px giúp người dùng nhấp trúng mục tiêu với nỗ lực tối thiểu.
3. **Khoảng cách di chuyển ngắn (Distance $D$):** Nút gửi và các nút thao tác liên quan được đặt cạnh nhau trong cùng một nhóm tác vụ, không phân tán hai đầu màn hình.

---

### 5. Kiểm chứng Quy tắc 3 lần nhấp chuột (Three-Click Rule) & Role-Smart Direct Landing

Nhờ kiến trúc **Role-Smart Direct Landing**, hệ thống loại bỏ các bước trung gian qua "Bàn làm việc" chung. Khi đăng nhập, mỗi vai trò mở ngay màn hình làm việc nghiệp vụ của mình. Vì vậy, các tác vụ cốt lõi đều được kích hoạt trong **0 đến 2 lần nhấp chuột**:

| Vai trò nghiệp vụ | Chức năng nghiệp vụ chính | Chuỗi thao tác thực tế | Số Click từ Đăng nhập | Đánh giá |
|:---|:---|:---|:---:|:---:|
| **BCH Liên Chi Đoàn** | **Tạo mới hồ sơ sự kiện** | Đăng nhập $\rightarrow$ Vào thẳng `/events` $\rightarrow$ Click *+ Tạo hồ sơ mới* | **1 Click** | Vượt chuẩn xuất sắc |
| **BCH Liên Chi Đoàn** | **Xem & Lọc hồ sơ theo trạng thái** | Đăng nhập $\rightarrow$ Đã ở sẵn `/events` $\rightarrow$ Click Tab *Cần bổ sung* / *Đã cấp phép* | **1 Click** | Vượt chuẩn xuất sắc |
| **Ban Chủ nhiệm Khoa** | **Thẩm định hồ sơ sự kiện** | Đăng nhập $\rightarrow$ Vào thẳng `/approvals/faculty` $\rightarrow$ Click *Thẩm định ngay* | **1 Click** | Vượt chuẩn xuất sắc |
| **Đoàn Trường** | **Cấp phép sự kiện cấp Trường** | Đăng nhập $\rightarrow$ Vào thẳng `/approvals/union` $\rightarrow$ Click *Phê duyệt ngay* | **1 Click** | Vượt chuẩn xuất sắc |
| **Phòng CSVC** | **Xem yêu cầu mượn hội trường** | Đăng nhập $\rightarrow$ Vào thẳng `/facilities` (hiển thị ngay danh sách chờ) | **0 Click** | Sẵn sàng ngay lập tức |
| **Phòng CSVC** | **Kiểm tra tình trạng phòng thực tế** | Đăng nhập $\rightarrow$ Vào thẳng `/facilities` (card phòng và trạng thái CSVC) | **0 Click** | Sẵn sàng ngay lập tức |
| **Phòng KHTC** | **Thẩm định chứng từ & Ra quyết định chi** | Đăng nhập $\rightarrow$ Vào thẳng `/payments` $\rightarrow$ Click *Thẩm định chứng từ* | **1 Click** | Vượt chuẩn xuất sắc |
| **Quản trị viên** | **Quản lý người dùng & phân quyền** | Đăng nhập $\rightarrow$ Vào thẳng `/admin/users` | **0 Click** | Sẵn sàng ngay lập tức |
| **BCH Liên Chi Đoàn** | **Lập báo cáo tổng kết sau sự kiện** | Vào chi tiết sự kiện $\rightarrow$ Click *Lập báo cáo tổng kết* | **1 - 2 Click** | Đạt chuẩn xuất sắc |

---

### 6. Quy chuẩn thiết kế biểu mẫu (Form Design Rules)
- **Bố cục nhãn (Label Placement):** Mọi nhãn trường đều nằm **ngay phía trên ô nhập liệu (Top-aligned)**, giúp mắt người dùng quét biểu mẫu theo chiều dọc tự nhiên, giảm 50% thời gian xử lý so với nhãn đặt bên trái.
- **Phân nhóm thông tin logic (Logical Grouping):** Biểu mẫu tạo sự kiện được chia thành 4 thẻ rõ rệt:
  1. *Thông tin cơ bản* (Tên sự kiện, loại hình, mục tiêu).
  2. *Thời gian & Dự kiến quy mô* (Ngày tổ chức, số lượng sinh viên tham dự).
  3. *Dự toán kinh phí chi tiết* (Bảng nhập động nhiều dòng có tự động cộng tổng).
  4. *Đơn vị & Nhân sự phụ trách* (Khoa, người liên hệ, số điện thoại).
- **Thông báo lỗi tức thời:** Các trường bắt buộc có dấu sao đỏ `*`, thông báo lỗi hiển thị bằng chữ đỏ ngay bên dưới ô nhập kèm viền ô chuyển đỏ `border-color: #DC2626`.

---

### 7. Quy chuẩn trình bày dữ liệu (Data Presentation Rules)
- Bảng dữ liệu có thanh tiêu đề cố định, hỗ trợ hiển thị phân trang (`10`, `25`, `50` dòng/trang).
- Phân biệt trạng thái qua **Status Badges** chuẩn hóa:
  - `DRAFT`: Xám trung tính (`#64748B`)
  - `SUBMITTED_FACULTY`: Xanh dương (`#075F9F`)
  - `FACULTY_APPROVED` / `SUBMITTED_UNION`: Xanh da trời nhạt (`#0284C7`)
  - `FACULTY_REVISE` / `UNION_REVISE`: Cam điểm nhấn (`#FE751E`)
  - `UNION_APPROVED`: Xanh lá đậm (`#0E9045`)
  - `REJECTED`: Đỏ cảnh báo (`#DC2626`)
  - `CLOSED`: Xanh đen hoàn tất (`#334155`)

---

### 8. Thiết kế Responsive đa kích thước (Responsive Design System)
Giao diện áp dụng cơ chế CSS Grid và Flexbox thích ứng mượt mà trên 5 độ phân giải mục tiêu:
1. **Desktop lớn (1440 × 900):** Sidebar cố định 260px, nội dung trải rộng 1140px, bố cục 2 hoặc 3 cột thẻ chỉ số.
2. **Laptop tiêu chuẩn (1280 × 800):** Tối ưu hóa khoảng đệm, hiển thị đầy đủ bảng dữ liệu.
3. **Tablet (768 × 1024):** Sidebar tự động co lại thành thanh gọn, các bảng dữ liệu cho phép cuộn ngang có thanh trượt êm.
4. **Mobile (390 × 844 & 360 × 800):**
   - Sidebar ẩn hoàn toàn và chuyển thành **Menu Drawer trượt** thông qua nút Hamburger trên header.
   - Thẻ chỉ số KPI chuyển thành dạng cuộn dọc 1 cột.
   - Bảng dữ liệu hỗ trợ cuộn cảm ứng tự nhiên `overflow-x: auto`.
   - Các nút tác vụ sticky bar dàn đều 100% bề ngang để ngón tay cái dễ bấm.

---
*Tài liệu được biên soạn và chuẩn hóa theo đúng yêu cầu Giáo trình Chương 6 – Dự án MY DUE.*
