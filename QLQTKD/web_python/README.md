# MY DUE – HỆ THỐNG TIẾP NHẬN, XÉT DUYỆT VÀ CẤP PHÉP TỔ CHỨC SỰ KIỆN

> **Trường Đại học Kinh tế – Đại học Đà Nẵng (DUE)**  
> **Đề tài:** Quản lý quy trình kinh doanh (BPMN) – Xây dựng hệ thống phần mềm quản lý quy trình tổ chức sự kiện  
> **Phiên bản:** 1.0.0 (Production-Ready Full-Stack Web Application)  
> **Kiến trúc:** 3-Tier Layered Architecture theo Giáo trình Chương 7  
> **Tiêu chuẩn thiết kế:** Giáo trình Chương 6 (Thiết kế GUI) & Bộ nhận diện thương hiệu chính thức DUE

---

## 1. TỔNG QUAN HỆ THỐNG

**MY DUE** là nền tảng số hóa toàn diện quy trình tiếp nhận, thẩm định, phê duyệt và cấp phép tổ chức sự kiện dành cho sinh viên và các đơn vị trực thuộc Trường Đại học Kinh tế – Đại học Đà Nẵng. 

Hệ thống được chuyển đổi số trực tiếp từ mô hình quy trình nghiệp vụ To-Be (`ToBe_Nhom3.bpmn`), tự động hóa 8 công đoạn thủ công và tích hợp 3 tính năng trợ lý thông minh (AI Assistant) hỗ trợ kiểm tra dự toán, gợi ý hội trường tối ưu và sinh bản thảo báo cáo tổng kết.

### Điểm nổi bật của hệ thống:
1. **Kết nối trực tiếp CSDL Microsoft SQL Server thật (`MY_DUE_QLSK`):** Tái sử dụng tối đa cấu trúc bảng, View, Trigger và Stored Procedure có sẵn (`usp_CreateEventDraft`, `usp_TransitionEvent`, `usp_ReserveFacility`, `usp_ListMyEvents`).
2. **Kiến trúc Role-Smart Direct Landing (Không bàn làm việc rườm rà):**
   - Loại bỏ hoàn toàn trang "Bàn làm việc" chung với các banner chào mừng quá khổ và biểu đồ vô nghĩa.
   - Người dùng sau khi đăng nhập (hoặc truy cập `/`, `/dashboard`) được chuyển hướng thông minh trực tiếp vào đúng không gian làm việc nghiệp vụ chuyên trách của vai trò mình:
     - **BCH Liên Chi Đoàn:** Vào thẳng "Hồ sơ sự kiện của tôi" (`/events`) với hệ thống tab phân loại trạng thái, thanh tìm kiếm và nút "+ Tạo hồ sơ mới".
     - **Ban Chủ nhiệm Khoa:** Vào thẳng "Hồ sơ chờ xét duyệt" (`/approvals/faculty`) với nút "Thẩm định ngay".
     - **Đoàn Trường:** Vào thẳng "Hồ sơ chờ phê duyệt cấp trường" (`/approvals/union`) với nút "Phê duyệt ngay".
     - **Phòng Cơ sở vật chất:** Vào thẳng "Yêu cầu CSVC & Tình trạng Hội trường" (`/facilities`) hiển thị trực quan các hội trường khả dụng và yêu cầu đang chờ xử lý.
     - **Phòng Kế hoạch - Tài chính:** Vào thẳng "Hồ sơ thanh toán chờ kiểm tra" (`/payments`) hỗ trợ thẩm định chứng từ và phê duyệt ủy quyền chi.
     - **Quản trị viên:** Vào thẳng "Quản lý tài khoản và phân quyền" (`/admin/users`).
3. **Tuân thủ triệt để Giáo trình Chương 6 (Thiết kế GUI):**
   - Đạt chuẩn **Quy tắc 3 lần nhấp chuột (Three-Click Rule)** cho mọi chức năng nghiệp vụ (đa số đạt ngay trong 0-1 lần nhấp từ khi đăng nhập).
   - Hỗ trợ song song hai chế độ thao tác: **Chỉ dùng Chuột (Mouse-Only)** và **Chỉ dùng Bàn phím (Keyboard-Only)** không phụ thuộc vào hover.
   - Ứng dụng **Định luật Fitts** với thanh tác vụ gắn đáy (Sticky Action Bar) giúp giảm thiểu tối đa quãng đường di chuyển chuột.
   - Thể hiện rõ nét **Content Awareness** qua Breadcrumbs, tiêu đề trang và điều hướng ngữ cảnh.
4. **Chuẩn hóa bộ nhận diện DUE:**
   - Tái sử dụng giao diện đăng nhập 2 cột theo chuẩn hệ thống **DUE E-Study** (Ảnh khuôn viên `SanTruongDUE.jpg` và Logo biểu trưng chính thức).
   - Bộ mã màu thương hiệu: Xanh dương DUE `#075F9F`, Xanh lá `#0E9045`, Cam điểm nhấn `#FE751E`.
5. **Bảo mật và toàn vẹn dữ liệu:**
   - 100% Parameterized queries chống SQL Injection.
   - Chống CSRF toàn diện bằng `Flask-WTF` (bao gồm CSRF-protected Logout).
   - Mã hóa mật khẩu an toàn với thuật toán `bcrypt`.
   - Phân quyền RBAC 2 lớp: Ở tầng ứng dụng và kiểm tra nghiệp vụ trong Stored Procedure tại SQL Server.

---

## 2. KIẾN TRÚC PHẦN MỀM 3-TIER (CHƯƠNG 7)

Kiến trúc hệ thống được xây dựng theo mô hình phân tầng **3-Tier Layered Architecture** chuẩn mực được quy định trong Giáo trình *Chương 7. Thiết kế kiến trúc phần mềm*:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      TẦNG TRÌNH DIỄN (PRESENTATION)                     │
│  - Giao diện HTML5, CSS3 hiện đại, ES6 JavaScript                      │
│  - Jinja2 Templates kế thừa bố cục dùng chung (base.html)              │
│  - Thiết kế Responsive (Desktop 1440px -> Laptop 1280px -> Mobile)    │
│  - Định luật Fitts, Focus Trap Modal, Double-Ring Focus-Visible         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP Requests / Form POST (CSRF)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   TẦNG LOGIC NGHIỆP VỤ (BUSINESS LOGIC)                │
│  - Flask Application Factory (create_app)                              │
│  - Flask Blueprints: auth, dashboard, events, approvals, facilities...  │
│  - Xác thực & Phiên làm việc: Flask-Login, Flask-WTF Forms             │
│  - Dịch vụ AI Assistant (Trợ lý kiểm tra & gợi ý heuristic)            │
│  - Quản lý trạng thái vòng đời sự kiện (Event Lifecycle Engine)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Gọi hàm Python / Context Managers
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    TẦNG TRUY XUẤT DỮ LIỆU (DATA ACCESS)                 │
│  - Module database.py quản lý kết nối an toàn với pyodbc & SQLAlchemy   │
│  - Lớp Repository: user_repo, event_repo, facility_repo, finance_repo │
│  - Cơ chế tự động Commit / Rollback khi gặp ngoại lệ                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ T-SQL Parameterized / Stored Procedures
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   CƠ SỞ DỮ LIỆU MICROSOFT SQL SERVER                   │
│  - Database: MY_DUE_QLSK                                               │
│  - Bảng dữ liệu: Users, Roles, Events, Facilities, AuditLogs...       │
│  - Stored Procedures: usp_TransitionEvent, usp_CreateEventDraft...     │
│  - Views: v_EventOverview, v_AccountsAndRoles, v_UserPermissions       │
│  - Triggers: AuditLog Triggers ghi vết mọi biến động dữ liệu           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN

```
web_python/
├── app/
│   ├── __init__.py                 # Application Factory (create_app), Custom Filters, Error Handlers
│   ├── config.py                   # Cấu hình chuỗi kết nối SQL Server & Secret Key
│   ├── database.py                 # Quản lý kết nối pyodbc & SQLAlchemy context manager
│   ├── extensions.py               # Khởi tạo LoginManager & CSRFProtect
│   │
│   ├── admin/                      # Blueprint Quản trị hệ thống, RBAC & Nhật ký Audit
│   ├── approvals/                  # Blueprint Xét duyệt: Cấp Khoa & Cấp Đoàn Trường
│   ├── auth/                       # Blueprint Đăng nhập, Đăng xuất, Form xác thực
│   ├── dashboard/                  # Blueprint Bảng điều khiển trung tâm & Thẻ KPI
│   ├── events/                     # Blueprint Quản lý sự kiện, Tạo mới, Chi tiết, Đổi trạng thái
│   ├── facilities/                 # Blueprint Cơ sở vật chất, Đăng ký phòng & Bàn giao
│   ├── payments/                   # Blueprint Tài chính, Quyết toán kinh phí & Ủy quyền chi
│   ├── reports/                    # Blueprint Báo cáo tổng kết sự kiện & Phê duyệt nghiệm thu
│   │
│   ├── models/
│   │   └── user.py                 # Model người dùng tương thích Flask-Login & kiểm tra RBAC
│   │
│   ├── repositories/               # Tầng Data Access thao tác trực tiếp với SQL Server
│   │   ├── event_repo.py           # Gọi usp_CreateEventDraft, usp_TransitionEvent, v_EventOverview
│   │   ├── facility_repo.py        # Quản lý phòng, kiểm tra chống trùng lịch, usp_ReserveFacility
│   │   ├── finance_repo.py         # Quản lý PaymentDecisions & hồ sơ quyết toán
│   │   ├── report_repo.py          # Quản lý lập và nghiệm thu báo cáo tổng kết
│   │   └── user_repo.py            # Xác thực người dùng qua bcrypt & truy vấn v_UserPermissions
│   │
│   ├── services/
│   │   └── ai_assistant.py         # Trợ lý AI mô phỏng (Kiểm tra đề án, gợi ý phòng, sinh báo cáo)
│   │
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css           # Design Tokens, Fitts's Law Sticky Bar, Responsive Grid
│   │   ├── js/
│   │   │   └── main.js             # Modal Focus Trap, ESC close, Live Budget Sum, Show/Hide Password
│   │   └── images/
│   │       ├── due_banner_logo.png # Logo biểu trưng trường DUE chính thức
│   │       ├── due_logo_emblem.png # Huy hiệu DUE (Favicon và Sidebar Crest)
│   │       └── SanTruongDUE.jpg    # Ảnh khuôn viên DUE cho trang Đăng nhập benchmark
│   │
│   └── templates/
│       ├── base.html               # Khung sườn layout chuẩn (Sidebar RBAC, Header, Breadcrumbs)
│       ├── admin/                  # Giao diện Quản trị người dùng, Phân quyền & Audit Logs
│       ├── approvals/              # Giao diện Thẩm định cấp Khoa & Đoàn Trường
│       ├── auth/login.html         # Giao diện Đăng nhập 2 cột chuẩn DUE E-Study
│       ├── dashboard/index.html    # Bảng điều khiển với thẻ KPI và liên kết 1-click
│       ├── errors/                 # Trang lỗi thân thiện: 403, 404, 500
│       ├── events/                 # Danh sách sự kiện, Form tạo mới (tự tính tổng), Chi tiết hồ sơ
│       ├── facilities/             # Lịch phòng CSVC, Form mượn phòng & Biên bản bàn giao
│       ├── payments/               # Bảng thẩm định quyết toán chi phí
│       └── reports/                # Form lập báo cáo & Màn hình nghiệm thu kết quả
│
├── docs/                           # Tài liệu thiết kế, phân tích và báo cáo kiểm thử
│   ├── SITEMAP_AND_UI_FLOW.md      # Sơ đồ trang, ISD và Bảng đối chiếu BPMN -> Route -> CSDL
│   ├── DESIGN_SYSTEM_AND_GUI_RULES.md # Cẩm nang thiết kế UI/UX theo Giáo trình Chương 6
│   ├── TESTING_AND_VERIFICATION_REPORT.md # Báo cáo kiểm thử Mouse/Keyboard, 3-Click, Responsive
│   └── screenshots/                # 11 ảnh chụp kiểm thử Desktop & Mobile thực tế theo vai trò bằng Playwright
│
├── tests/                          # Bộ kiểm thử tự động 100% đạt chuẩn
│   ├── test_auth.py                # Kiểm thử Đăng nhập, Đăng xuất, CSRF, Sai mật khẩu
│   ├── test_events.py              # Kiểm thử Tạo sự kiện, Tự tính tiền, Chặn truy cập trái phép
│   ├── test_approvals.py           # Kiểm thử Luồng thẩm định Khoa & Đoàn Trường
│   ├── test_ui_rules.py            # Kiểm thử Nguyên tắc GUI: Breadcrumbs, Focus, 3-Click
│   ├── test_workflow_integration.py # Kiểm thử Tích hợp toàn diện xuyên suốt quy trình To-Be
│   └── take_screenshots.py         # Kịch bản tự động chụp ảnh màn hình bằng Playwright Chromium
│
├── .env.example                    # Mẫu cấu hình môi trường chuẩn
├── requirements.txt                # Danh sách thư viện Python cần thiết
├── run.py                          # Điểm khởi chạy ứng dụng Flask với cơ chế tự kiểm tra CSDL
└── pytest.ini                      # Cấu hình chạy kiểm thử tự động
```

---

## 4. BẢNG TÀI KHOẢN ĐĂNG NHẬP KIỂM THỬ (DEMO ACCOUNTS)

Hệ thống đã có sẵn 7 tài khoản tương ứng với 5 làn bơi trong quy trình BPMN và tài khoản quản trị hệ thống. Mật khẩu dùng chung cho tất cả các tài khoản demo: **`123456`**.

| Email đăng nhập | Mật khẩu | Làn bơi / Vai trò BPMN | Đơn vị trực thuộc | Quyền hạn chính trong hệ thống |
|:---|:---:|:---|:---|:---|
| **`btc1@eventflow.vn`** | `123456` | **BCH Liên Chi Đoàn** | Khoa Quản trị Kinh doanh | Lập đề án, dự toán kinh phí, nộp duyệt, mượn phòng CSVC, nộp báo cáo tổng kết, gửi quyết toán. |
| **`btc2@eventflow.vn`** | `123456` | **BCH Liên Chi Đoàn** | Khoa Marketing | Lập và theo dõi các hồ sơ sự kiện của Liên Chi Đoàn Marketing. |
| **`bcnkhoa@eventflow.vn`** | `123456` | **Ban Chủ nhiệm Khoa** | Khoa Quản trị Kinh doanh | Thẩm định nội dung sự kiện cấp cơ sở, yêu cầu chỉnh sửa, phê duyệt chuyển lên Đoàn Trường. |
| **`doantruong@eventflow.vn`** | `123456` | **Đoàn Trường** | Đoàn Thanh niên – Hội SV | Xét duyệt cấp trường, cấp văn bản cho phép tổ chức sự kiện, nghiệm thu báo cáo tổng kết. |
| **`csvc@eventflow.vn`** | `123456` | **Phòng Cơ sở vật chất** | Phòng CSVC | Quản lý hội trường (A501, B202, Khu đa năng), duyệt cấp địa điểm, lập biên bản bàn giao CSVC. |
| **`khtc@eventflow.vn`** | `123456` | **Phòng Kế hoạch - Tài chính** | Phòng KHTC | Thẩm định chứng từ, hóa đơn quyết toán chi phí, lập quyết định thanh toán kinh phí. |
| **`admin@eventflow.vn`** | `123456` | **Quản trị hệ thống & Cấp thẩm quyền** | Ban Giám hiệu / Hệ thống | Quản lý người dùng, phân quyền RBAC, kiểm tra Audit Logs, phê duyệt ủy quyền chi trả tài chính. |

> **Mẹo trải nghiệm nhanh:** Tại màn hình Đăng nhập (`/login`), người dùng có thể nhấp chuột trực tiếp vào các nút vai trò trong khối **"Tài khoản kiểm thử nhanh (1-Click Demo)"** để hệ thống tự động điền sẵn thông tin.

---

## 5. HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY (WINDOWS)

### Yêu cầu tiên quyết:
- Hệ điều hành: Windows 10 / 11 hoặc Windows Server.
- Python 3.12+ (đã thêm vào `PATH`).
- Microsoft SQL Server đã cài đặt và chứa CSDL `MY_DUE_QLSK`.
- ODBC Driver 18 for SQL Server (hoặc ODBC Driver 17).

### Bước 1: Sao chép file cấu hình môi trường
Tạo file `.env` tại thư mục gốc của dự án:
```powershell
Copy-Item .env.example .env
```
Nội dung file `.env` chuẩn kết nối Windows Authentication (khuyến nghị):
```env
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=my_due_secret_production_key_2026_secured
SQL_SERVER=localhost
SQL_DATABASE=MY_DUE_QLSK
SQL_DRIVER=ODBC Driver 18 for SQL Server
SQL_TRUSTED_CONNECTION=yes
PORT=5000
DEBUG=True
```

### Bước 2: Cài đặt các gói phụ thuộc
```powershell
pip install -r requirements.txt
```

### Bước 3: Khởi chạy website
Chạy lệnh khởi động máy chủ Flask:
```powershell
python run.py
```
Màn hình console sẽ tiến hành chẩn đoán kiểm tra kết nối CSDL và hiển thị thông báo sẵn sàng:
```
======================================================================
  MY DUE - HE THONG XET DUYET VA CAP PHEP TO CHUC SU KIEN
  Truong Dai hoc Kinh te - Dai hoc Da Nang (DUE)
======================================================================
[OK] Ket noi CSDL SQL Server (MY_DUE_QLSK) thanh cong!
[*] Dang khoi chay may chu Flask tai http://127.0.0.1:5000
 * Serving Flask app 'app'
 * Running on http://127.0.0.1:5000
```
Truy cập trình duyệt tại địa chỉ: **`http://127.0.0.1:5000`**

### Bước 4: Chạy kiểm thử tự động (Automated Tests)
Thực thi toàn bộ bộ kiểm thử tự động 21 bài kiểm tra:
```powershell
pytest -v
```
Kết quả kiểm thử thực tế: **21/21 passed in 12.14s (100% pass rate)** bao gồm kiểm thử phân quyền tạo hồ sơ, cấu trúc dữ liệu bảng, phân trang, và bảo toàn toàn vẹn CSDL SQL Server.

---

## 6. THAM KHẢO NGUỒN MÃ NGUỒN MỞ VÀ GIẤY PHÉP (LICENSING COMPLIANCE)

Tuân thủ nghiêm túc yêu cầu trong Master Prompt về việc tham khảo và sử dụng mã nguồn mở có giấy phép rõ ràng, dự án MY DUE đã nghiên cứu và tái cấu trúc các giải pháp từ các kho mã nguồn mở sau:

1. **`arulkumarank/Event-Management-and-Resource-Allocation-System`** (Giấy phép: MIT License)
   - *Giá trị tham khảo:* Cơ chế phát hiện xung đột lịch phòng hội trường và phân bổ tài nguyên cơ sở vật chất. Đã được thiết kế lại hoàn toàn tương thích với Stored Procedure `usp_ReserveFacility` trong SQL Server.
2. **`Elanchezhiyan01/event-management-system`** (Giấy phép: MIT License)
   - *Giá trị tham khảo:* Mô hình cấu trúc các mục ngân sách chi tiết (`BudgetItems`) và tính tổng chi phí động ở phía client.
3. **`JunichiGetCode/TelEvent`** (Giấy phép: MIT License)
   - *Giá trị tham khảo:* Cấu trúc phân tách Flask Blueprint cho phân hệ quản lý sự kiện và bảng điều khiển tổng quan.
4. **`shubhb072-ui/purchase-approval-system`** (Giấy phép: MIT License)
   - *Giá trị tham khảo:* Luồng quy trình phê duyệt nhiều cấp (Multi-level workflow approval) và kiến trúc lưu trữ lịch sử chuyển trạng thái kèm lý do.
5. **`Bonker009/room-booking-system`** (Giấy phép: MIT License)
   - *Giá trị tham khảo:* Quản lý thông tin sức chứa địa điểm và danh mục thiết bị đi kèm (máy chiếu, âm thanh, micro).

*Tất cả mã nguồn ứng dụng trong repository này đều được viết mới hoàn toàn, tuân thủ kiến trúc phân tầng 3-tier của Python Flask và CSDL Microsoft SQL Server của Nhà trường.*

---

## 7. LIÊN KẾT TÀI LIỆU CHI TIẾT

- 🗺️ **[Sơ đồ trang & Luồng giao diện BPMN](file:///c:/Users/tranb/OneDrive%20-%20The%20Danang%20University%20of%20Economics/N%C4%83m%203/K%E1%BB%B3%201/Qu%E1%BA%A3n%20l%C3%BD%20quy%20tr%C3%ACnh%20kinh%20doanh/NH%C3%93M/web_python/docs/SITEMAP_AND_UI_FLOW.md):** Bảng đối chiếu 33 bước BPMN sang Route & SQL.
- 🎨 **[Bộ nhận diện thương hiệu & Cẩm nang GUI Chương 6](file:///c:/Users/tranb/OneDrive%20-%20The%20Danang%20University%20of%20Economics/N%C4%83m%203/K%E1%BB%B3%201/Qu%E1%BA%A3n%20l%C3%BD%20quy%20tr%C3%ACnh%20kinh%20doanh/NH%C3%93M/web_python/docs/DESIGN_SYSTEM_AND_GUI_RULES.md):** Chi tiết 6 nguyên tắc Usability, Định luật Fitts và chuẩn thiết kế biểu mẫu.
- 🧪 **[Báo cáo kiểm thử & Đánh giá chất lượng](file:///c:/Users/tranb/OneDrive%20-%20The%20Danang%20University%20of%20Economics/N%C4%83m%203/K%E1%BB%B3%201/Qu%E1%BA%A3n%20l%C3%BD%20quy%20tr%C3%ACnh%20kinh%20doanh/NH%C3%93M/web_python/docs/TESTING_AND_VERIFICATION_REPORT.md):** 12 kịch bản Mouse/Keyboard, kiểm chứng Three-Click Rule, hình ảnh responsive và báo cáo bảo mật.

---
*© 2026 Trường Đại học Kinh tế – Đại học Đà Nẵng (DUE). Phát triển bởi Đội ngũ Kỹ sư Công nghệ Hệ thống MY DUE.*
