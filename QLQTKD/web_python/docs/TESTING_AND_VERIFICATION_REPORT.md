# BÁO CÁO KIỂM THỬ VÀ ĐÁNH GIÁ CHẤT LƯỢNG HỆ THỐNG MY DUE (TESTING & VERIFICATION REPORT)

> **Hệ thống:** MY DUE – Quản lý Tiếp nhận, Xét duyệt và Cấp phép Tổ chức Sự kiện  
> **Cơ sở dữ liệu:** Microsoft SQL Server (`MY_DUE_QLSK`) trên Windows  
> **Nền tảng:** Python 3.12 / Flask / Jinja2 / HTML5 / CSS3 / ES6 JS  
> **Tiêu chuẩn đối soát:** Giáo trình Chương 6 (Thiết kế GUI) & Chương 7 (Kiến trúc Phần mềm).

---

## 1. BẢNG KIỂM THỬ TOÀN DIỆN MOUSE-ONLY VS. KEYBOARD-ONLY (12 KỊCH BẢN)

Để đáp ứng yêu cầu khắt khe của Giáo trình Chương 6 về tính khả dụng và khả năng truy cập (Accessibility), toàn bộ 12 kịch bản nghiệp vụ cốt lõi đã được kiểm thử nghiêm ngặt ở cả hai chế độ: **Chỉ dùng Chuột (Mouse-Only)** và **Chỉ dùng Bàn phím (Keyboard-Only)** mà không bị phụ thuộc vào hover hay các cử chỉ thiết bị độc quyền.

| STT | Tên kịch bản kiểm thử | Thao tác bằng Chuột (Mouse-Only) | Thao tác bằng Bàn phím (Keyboard-Only) | Số Click | Kết quả | Đánh giá di chuyển chuột (Định luật Fitts) |
|:---:|:---|:---|:---|:---:|:---:|:---|
| **01** | **Đăng nhập hệ thống** | Nhấp ô Email $\rightarrow$ Nhấp ô Mật khẩu $\rightarrow$ Nhấp nút Hiện mật khẩu $\rightarrow$ Nhấp nút "Đăng nhập" | `Tab` đến Email $\rightarrow$ Nhập text $\rightarrow$ `Tab` đến Password $\rightarrow$ Nhập $\rightarrow$ `Tab` đến icon hiện mật khẩu $\rightarrow$ `Space` $\rightarrow$ `Enter` | 2 - 3 | **ĐẠT (PASS)** | *Khoảng cách ngắn:* Ô nhập và nút bấm xếp dọc sát nhau, nút Đăng nhập to rõ (H=44px) giảm thời gian nhấp. |
| **02** | **Sử dụng Quick Demo Login** | Nhấp vào nút "Ban Chủ nhiệm Khoa" trong danh sách tài khoản mẫu | `Tab` qua danh sách nút demo $\rightarrow$ Nhấn `Enter` để chọn $\rightarrow$ `Tab` đến Đăng nhập $\rightarrow$ `Enter` | 2 | **ĐẠT (PASS)** | *Khoảng cách tối thiểu:* Nhóm nút demo nằm ngay cạnh form, chỉ cần 1 click là điền sẵn form. |
| **03** | **Điều hướng từ Dashboard sang Tạo sự kiện** | Nhấp menu "Quản lý sự kiện" $\rightarrow$ Nhấp nút "+ Tạo sự kiện mới" | `Tab` đến menu "Quản lý sự kiện" $\rightarrow$ `Enter` $\rightarrow$ `Tab` đến nút tạo mới $\rightarrow$ `Enter` | 2 | **ĐẠT (PASS)** | *Chuẩn Three-Click:* Đạt trong 2 click; nút tạo mới nổi bật ở góc phải trên. |
| **04** | **Thêm dòng ngân sách động trong Form** | Nhấp nút "+ Thêm mục chi" $\rightarrow$ Nhấp vào các ô Tên, Số lượng, Đơn giá | `Tab` đến nút "+ Thêm mục chi" $\rightarrow$ `Enter` $\rightarrow$ `Tab` liên tục nhập dữ liệu cho các ô mới | 1 | **ĐẠT (PASS)** | *Tự động focus:* Hàng mới tự động bắt focus, người dùng không phải di chuyển chuột xa. |
| **05** | **Xem chi tiết hồ sơ sự kiện** | Nhấp chuột vào hàng sự kiện hoặc nút "Xem" trong bảng dữ liệu | `Tab` đến hàng/liên kết sự kiện trong bảng $\rightarrow$ Nhấn `Enter` | 1 | **ĐẠT (PASS)** | *Vùng bấm rộng:* Toàn bộ ô "Xem" và tên sự kiện đều có padding 10px, dễ nhấp trúng. |
| **06** | **Nộp hồ sơ sự kiện lên Khoa** | Cuộn đến thanh Sticky Action Bar $\rightarrow$ Nhấp nút "Nộp duyệt lên Khoa" | `Tab` đến nút "Nộp duyệt lên Khoa" $\rightarrow$ Nhấn `Enter` | 1 | **ĐẠT (PASS)** | *Tối ưu Fitts vượt trội:* Thanh tác vụ cố định đáy (Sticky Bar) giúp nút luôn ở vị trí thuận tiện. |
| **07** | **Mở Modal Phê duyệt cấp Khoa** | Nhấp nút "Phê duyệt" tại thanh tác vụ | `Tab` đến nút "Phê duyệt" $\rightarrow$ Nhấn `Enter` | 1 | **ĐẠT (PASS)** | *Khoảng cách ngắn:* Nút có màu xanh lá `#0E9045` kích thước lớn, dễ nhận diện. |
| **08** | **Thao tác trong Hộp thoại Phê duyệt (Focus Trap)** | Nhấp ô Ghi chú $\rightarrow$ Nhập ý kiến $\rightarrow$ Nhấp nút "Xác nhận duyệt" | Modal tự động khóa focus vào ô Ghi chú $\rightarrow$ Nhập ý kiến $\rightarrow$ `Tab` đến "Xác nhận duyệt" $\rightarrow$ `Enter` | 2 | **ĐẠT (PASS)** | *Hạn chế lệch chuột:* Nút xác nhận nằm ngay dưới ô ghi chú, không cần rê chuột ra biên. |
| **09** | **Đóng Modal bằng phím ESC** | Nhấp vào nút "Đóng" (x) ở góc trên modal hoặc nhấp ra nền mờ | Nhấn phím `ESC` tại bất kỳ đâu trong khi Modal đang mở | 1 (hoặc 0) | **ĐẠT (PASS)** | *Không cần chuột:* Phím ESC lập tức đóng modal và trả focus về lại nút vừa kích hoạt. |
| **10** | **Đăng ký mượn phòng & Thiết bị** | Nhấp menu "Cơ sở vật chất" $\rightarrow$ Nhấp "Đăng ký phòng" $\rightarrow$ Chọn phòng $\rightarrow$ Nhấp Lưu | `Tab` điều hướng menu CSVC $\rightarrow$ `Enter` $\rightarrow$ `Tab` chọn phòng trong dropdown $\rightarrow$ `Enter` | 3 | **ĐẠT (PASS)** | *Dropdown native:* Dễ dàng chọn bằng phím mũi tên `Up`/`Down` hoặc nhấp chuột trực tiếp. |
| **11** | **Báo cáo tổng kết có AI Draft** | Nhấp nút "Tạo mẫu báo cáo với AI" $\rightarrow$ Nhấp "Lưu báo cáo" | `Tab` đến nút AI Draft $\rightarrow$ `Enter` $\rightarrow$ Nội dung tự điền $\rightarrow$ `Tab` đến Lưu $\rightarrow$ `Enter` | 2 | **ĐẠT (PASS)** | *Giảm nỗ lực:* AI điền sẵn nội dung, người dùng chỉ cần nhấp nút lưu mà không phải gõ nhiều. |
| **12** | **Đăng xuất an toàn khỏi hệ thống** | Nhấp vào nút "Đăng xuất" trên thanh Header | `Tab` đến nút Đăng xuất trên Header $\rightarrow$ Nhấn `Enter` (form POST bảo vệ CSRF) | 1 | **ĐẠT (PASS)** | *Góc trên bên phải:* Vị trí góc màn hình theo Fitts's Law có diện tích vô hạn (mép màn hình), cực dễ nhấp. |

---

## 2. BẢNG KIỂM CHỨNG QUY TẮC 3 LẦN NHẤP CHUỘT (THREE-CLICK RULE AUDIT)

Quy tắc Three-Click yêu cầu người dùng tiếp cận được dữ liệu hoặc chức năng mong muốn trong vòng không quá 3 lần bấm chuột từ Trang chủ Dashboard.

| Tác vụ cần thực hiện | Đường dẫn thao tác thực tế | Số lần nhấp | Đánh giá chuẩn Chương 6 |
|:---|:---|:---:|:---:|
| **Tạo hồ sơ sự kiện mới** | Dashboard $\rightarrow$ Nút *Tạo sự kiện mới* | **1 Click** | Vượt chuẩn (1 < 3) |
| **Xem danh sách sự kiện** | Dashboard $\rightarrow$ Menu *Hồ sơ sự kiện* | **1 Click** | Vượt chuẩn (1 < 3) |
| **Xem chi tiết 1 sự kiện cụ thể** | Dashboard $\rightarrow$ Menu *Sự kiện* $\rightarrow$ Nút *Xem* | **2 Click** | Đạt chuẩn xuất sắc (2 < 3) |
| **Chỉnh sửa hồ sơ sự kiện** | Dashboard $\rightarrow$ Xem sự kiện $\rightarrow$ Nút *Chỉnh sửa* | **2 Click** | Đạt chuẩn xuất sắc (2 < 3) |
| **Xét duyệt hồ sơ cấp Khoa** | Dashboard $\rightarrow$ Menu *Duyệt cấp Khoa* $\rightarrow$ Nút *Xem & Duyệt* | **2 Click** | Đạt chuẩn xuất sắc (2 < 3) |
| **Cấp phép cấp Đoàn Trường** | Dashboard $\rightarrow$ Menu *Duyệt Đoàn Trường* $\rightarrow$ Nút *Phê duyệt* | **2 Click** | Đạt chuẩn xuất sắc (2 < 3) |
| **Kiểm tra lịch phòng CSVC** | Dashboard $\rightarrow$ Menu *Cơ sở vật chất* | **1 Click** | Vượt chuẩn (1 < 3) |
| **Đăng ký mượn phòng hội trường** | Dashboard $\rightarrow$ Menu *CSVC* $\rightarrow$ Nút *Đăng ký mượn* | **2 Click** | Đạt chuẩn xuất sắc (2 < 3) |
| **Lập báo cáo tổng kết** | Dashboard $\rightarrow$ Xem sự kiện $\rightarrow$ Nút *Lập báo cáo* | **2 Click** | Đạt chuẩn xuất sắc (2 < 3) |
| **Thẩm định tài chính quyết toán** | Dashboard $\rightarrow$ Menu *Tài chính & Quyết toán* $\rightarrow$ Nút *Thẩm định* | **2 Click** | Đạt chuẩn xuất sắc (2 < 3) |
| **Kiểm tra nhật ký Audit hệ thống** | Dashboard $\rightarrow$ Menu *Quản trị* $\rightarrow$ Menu *Nhật ký Audit* | **2 Click** | Đạt chuẩn xuất sắc (2 < 3) |

**Kết luận:** **100% chức năng chính** đều được truy cập trong từ **1 đến 2 lần nhấp chuột**, hoàn toàn tuân thủ và vượt chỉ tiêu Quy tắc 3-Click của Giáo trình Chương 6.

---

## 3. BÁO CÁO KIỂM THỬ GIAO DIỆN ĐA KÍCH THƯỚC (RESPONSIVE VERIFICATION)

Hệ thống được kiểm thử tự động bằng **Playwright Chromium** trên các độ phân giải tiêu chuẩn (Desktop 1440x900 và Mobile 390x844), trực tiếp xác minh giao diện Role-Smart Direct Landing của từng phân hệ:

```
docs/screenshots/
├── 01_login_desktop.png            [1440x900 - Màn hình đăng nhập 2 cột benchmark DUE E-Study]
├── 02_events_bch_desktop.png       [1440x900 - Landing BCH: Bảng hồ sơ sự kiện, tabs phân loại, search]
├── 02b_events_create_desktop.png   [1440x900 - Tạo hồ sơ: Bố cục 2 cột, Live Preview, BPMN Roadmap, Mẫu nhanh]
├── 03_event_detail_desktop.png     [1440x900 - Chi tiết hồ sơ sự kiện, BPMN Stepper, Sticky Action Bar]
├── 04_approvals_faculty_desktop.png[1440x900 - Landing Ban Chủ nhiệm Khoa: Hồ sơ chờ xét duyệt]
├── 05_approvals_union_desktop.png  [1440x900 - Landing Đoàn Trường: Hồ sơ chờ phê duyệt cấp trường]
├── 06_facilities_requests_desktop.png [1440x900 - CSVC: Yêu cầu đăng ký, toolbar gọn, bộ đếm chuẩn SQL Server]
├── 06b_facilities_schedule_desktop.png [1440x900 - CSVC: Lịch sử dụng dạng FullCalendar Google/Outlook style]
├── 06c_facilities_catalog_desktop.png  [1440x900 - CSVC: Phòng & Thiết bị, tra cứu giảng đường & kho]
├── 06d_facilities_assign_desktop.png   [1440x900 - CSVC: Nghiệp vụ Bố trí phòng & Thiết bị dành riêng CSVC]
├── 07_finance_khtc_desktop.png     [1440x900 - Landing Phòng KHTC: Hồ sơ thanh toán chờ kiểm tra]
├── 08_admin_users_desktop.png      [1440x900 - Landing Quản trị viên: Quản lý người dùng & phân quyền]
├── 09_login_mobile.png             [390x844  - Đăng nhập trên điện thoại iPhone/Android]
├── 10_events_bch_mobile.png        [390x844  - Danh sách hồ sơ sự kiện trên mobile co giãn linh hoạt]
├── 10b_events_create_mobile.png    [390x844  - Tạo hồ sơ trên mobile: Xếp 1 cột tối ưu cuộn vuốt]
├── 11_event_detail_mobile.png      [390x844  - Chi tiết hồ sơ co giãn 1 cột trên mobile]
└── 12_facilities_calendar_mobile.png [390x844  - Lịch sử dụng CSVC Calendar co giãn tối ưu trên mobile]
```

### Chi tiết đánh giá theo từng kích thước:
1. **Desktop lớn (1440 × 900):**
   - Đạt chuẩn hiển thị tối ưu; bố cục 2 cột ở trang Login hiển thị ảnh `SanTruongDUE.jpg` sắc nét bên trái, form đăng nhập cân đối bên phải.
   - Bảng dữ liệu hiện đại hiển thị đầy đủ thông tin, khoảng cách lề và padding hợp lý, không có banner chào mừng choán chỗ.
   - Các nút thao tác nghiệp vụ ("Thẩm định ngay", "Phê duyệt ngay") nổi bật trực tiếp tại từng dòng hồ sơ.
2. **Laptop tiêu chuẩn (1280 × 800):**
   - Nội dung co giãn theo tỷ lệ linh hoạt; khoảng cách lề tự co về 16px, không xuất hiện thanh cuộn ngang ngoài ý muốn.
3. **Tablet (768 × 1024):**
   - Bảng dữ liệu hỗ trợ cuộn ngang êm ái với `overflow-x: auto`; các khối dữ liệu chuyển sang lưới 2 cột.
4. **Mobile tiêu chuẩn (390 × 844 & 360 × 800):**
   - Sidebar được chuyển đổi 100% sang menu trượt (Slide Drawer) kích hoạt bằng nút Hamburger.
   - Bảng dữ liệu hỗ trợ chuyển đổi linh hoạt sang danh sách thẻ hoặc cuộn ngang cảm ứng tự nhiên.
   - Các nút bấm hành động chuyển sang độ rộng 100% full-width, tối ưu vị trí chạm của ngón tay cái.

---

## 4. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (UNIT & INTEGRATION TESTS)

Bộ kiểm thử tự động sử dụng **pytest** đã thực thi hoàn chỉnh **30 test cases** bao phủ toàn bộ các tầng: Xác thực, Phân quyền RBAC, Role-Smart Direct Landing, Quản lý hồ sơ sự kiện, Module Cơ sở vật chất 3 subtabs (Yêu cầu đăng ký, FullCalendar Lịch sử dụng, Phòng & thiết bị, Chống trùng lịch live AJAX, Không BuildError), Luồng lưu trữ SQL Server, Lọc & Phân trang, và Toàn vẹn dữ liệu:

```
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.2.0, pluggy-1.7.0
rootdir: C:\Users\tranb\OneDrive - The Danang University of Economics\Năm 3\Kỳ 1\Quản lý quy trình kinh doanh\NHÓM\web_python
collected 30 items

tests/test_approvals.py::test_faculty_inbox_access_denied_for_btc PASSED [  3%]
tests/test_approvals.py::test_faculty_inbox_access_allowed_for_bcn PASSED [  6%]
tests/test_approvals.py::test_union_inbox_access_denied_for_faculty PASSED [ 10%]
tests/test_approvals.py::test_union_inbox_access_allowed_for_doan PASSED [ 13%]
tests/test_auth.py::test_login_page_renders PASSED                       [ 16%]
tests/test_auth.py::test_login_failure_wrong_password PASSED             [ 20%]
tests/test_auth.py::test_login_success PASSED                            [ 23%]
tests/test_auth.py::test_logout PASSED                                   [ 26%]
tests/test_auth.py::test_role_smart_direct_landing_routes PASSED         [ 30%]
tests/test_events.py::test_events_list_authenticated PASSED              [ 33%]
tests/test_events.py::test_sidebar_no_separate_create_event_menu PASSED  [ 36%]
tests/test_events.py::test_create_button_visibility_by_permission PASSED [ 40%]
tests/test_events.py::test_create_event_permission_denied_for_unauthorized_role PASSED [ 43%]
tests/test_events.py::test_create_event_flow_and_persistence PASSED      [ 46%]
tests/test_events.py::test_events_filtering_and_search PASSED            [ 50%]
tests/test_events.py::test_event_detail PASSED                           [ 53%]
tests/test_events.py::test_ai_review_endpoint PASSED                     [ 56%]
tests/test_facilities.py::test_csvc_three_subtabs_no_numbering PASSED    [ 60%]
tests/test_facilities.py::test_compact_header_no_bpmn_noise PASSED       [ 63%]
tests/test_facilities.py::test_bch_cannot_see_assign_room_button PASSED  [ 66%]
tests/test_facilities.py::test_csvc_can_see_assign_or_review_button PASSED [ 70%]
tests/test_facilities.py::test_strict_rbac_route_protection_assign_facility PASSED [ 73%]
tests/test_facilities.py::test_calendar_interactive_features PASSED      [ 76%]
tests/test_facilities.py::test_counts_accuracy_matches_sql_data PASSED   [ 80%]
tests/test_facilities.py::test_ai_suggest_endpoint_resolves_without_build_error PASSED [ 83%]
tests/test_facilities.py::test_check_collision_ajax_endpoint PASSED      [ 86%]
tests/test_ui_rules.py::test_three_click_rule_from_dashboard PASSED      [ 90%]
tests/test_ui_rules.py::test_content_awareness_presence PASSED           [ 93%]
tests/test_ui_rules.py::test_keyboard_accessibility_markup PASSED        [ 96%]
tests/test_workflow_integration.py::test_full_workflow_end_to_end PASSED [100%]

============================= 30 passed in 12.82s =============================
```

- **Tỷ lệ vượt qua:** **30 / 30 (100% PASS)**.
- **Thời gian thực thi:** 12.82 giây.

---

## 5. BÁO CÁO BẢO MẬT VÀ TOÀN VẸN CƠ SỞ DỮ LIỆU SQL SERVER

### 1. Phòng chống SQL Injection
- 100% các truy vấn trong tầng Repository và Model đều sử dụng cú pháp tham số hóa (Parameterized queries) thông qua thư viện `pyodbc` và `SQLAlchemy`:
  ```python
  # Cú pháp chuẩn tuyệt đối an toàn
  cursor.execute("SELECT * FROM dbo.Events WHERE EventId = ?", (event_id,))
  ```
- Tuyệt đối không dùng kỹ thuật cộng chuỗi `f"SELECT ... WHERE id = '{event_id}'"`.

### 2. Bảo vệ tấn công giả mạo yêu cầu (CSRF Protection)
- Toàn bộ các thao tác thay đổi trạng thái hệ thống (`POST`, `PUT`, `DELETE`) đều được kích hoạt `CSRFProtect` của `Flask-WTF`.
- Mọi form HTML và hộp thoại Modal đều có thẻ `{{ form.csrf_token }}` hoặc `<input type="hidden" name="csrf_token" value="{{ csrf_token() }}"/>`.
- Thao tác Đăng xuất (Logout) được chuyển thành phương thức `POST` có CSRF token, triệt tiêu hoàn toàn lỗ hổng CSRF Logout thông thường.

### 3. Cơ chế mã hóa mật khẩu (Password Hashing)
- Toàn bộ mật khẩu người dùng trong bảng `dbo.Users` được mã hóa một chiều bằng giải thuật băm **bcrypt** với salt tự sinh, tương thích chuẩn mật khẩu hiện đại.

### 4. Kiểm soát phân quyền dựa trên vai trò (RBAC) & Ngăn chặn leo thang đặc quyền
- Hệ thống thực thi phân quyền 2 lớp (Two-Layer Authorization):
  - **Lớp Ứng dụng (Flask):** Kiểm tra qua `@login_required` và phương thức `current_user.has_permission(...)`.
  - **Lớp CSDL (SQL Server Stored Procedure):** Stored Procedure `dbo.usp_TransitionEvent` kiểm tra trực tiếp quyền hạn trong bảng `UserPermissions` và bắt buộc người duyệt cấp Khoa phải thuộc cùng đơn vị quản lý:
    ```sql
    IF @perm='approvals.department.decide' AND NOT EXISTS(
        SELECT 1 FROM dbo.Users u WHERE u.UserId=@ActorId AND u.DepartmentId=@dept
    )
    THROW 51006, N'Không thuộc đơn vị quản lý hồ sơ.', 1;
    ```
  - Đảm bảo nếu kẻ tấn công giả mạo request từ giao diện thì tầng Database vẫn chặn đứng với mã lỗi `51006`.

### 5. Toàn vẹn giao dịch (Database Transaction Integrity)
- Mọi thao tác ghi dữ liệu nhiều bước (như tạo sự kiện kèm các mục kinh phí dự toán) đều được bọc trong ngữ cảnh `with get_db_cursor(commit=True) as cursor:`. Nếu có bất kỳ ngoại lệ nào xảy ra, lệnh `ROLLBACK` được kích hoạt tự động, bảo toàn 100% dữ liệu gốc trong CSDL `MY_DUE_QLSK`.

---
*Báo cáo được hoàn thiện và xác nhận đạt 100% tiêu chuẩn chất lượng hệ thống MY DUE.*
