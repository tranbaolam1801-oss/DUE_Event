# EVENTFLOW — CƠ SỞ DỮ LIỆU & PHÂN QUYỀN HỆ THỐNG (DATABASE & RBAC)

Hệ thống quản lý quy trình tiếp nhận, xét duyệt và cấp phép tổ chức sự kiện tại **Trường Đại học Kinh tế – Đại học Đà Nẵng (DUE)**.

---

## 1. Cấu trúc Thư mục Database

```text
eventflow/
└── database/
    ├── MY_DUE_QLSK_PostgreSQL_ALL_IN_ONE.sql # PostgreSQL: schema, RBAC, dữ liệu, hàm và trigger
    ├── POSTGRESQL_ACCOUNT_REGISTRATION.sql  # PostgreSQL: bảng User và token khôi phục cho backend hiện tại
    ├── MIGRATE_MY_DUE_PRISMA_SCHEMA.sql     # PostgreSQL: schema ứng dụng backend Prisma hiện tại
    ├── schema.sql                   # Schema SQL Server
    ├── rbac_permissions_matrix.sql  # Danh mục 6 vai trò, 30+ quyền hạn & ma trận ánh xạ quyền
    ├── seed_data.sql                # Dữ liệu mẫu khởi tạo: 13 tài khoản DUE, 6 hội trường, 5 thiết bị
    └── README.md                    # Tài liệu đặc tả cơ sở dữ liệu và hướng dẫn vận hành
```

---

## 2. Sơ đồ Thực thể Quan hệ (ER Diagram)

```mermaid
erDiagram
    ROLES ||--o{ ROLE_PERMISSIONS : "có"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "thuộc"
    ROLES ||--o{ USERS : "gán cho"
    
    USERS ||--o{ EVENTS : "tạo (BTC)"
    USERS ||--o{ APPROVAL_DECISIONS : "phê duyệt"
    USERS ||--o{ HANDOVER_RECORDS : "bàn giao"
    USERS ||--o{ SETTLEMENTS : "lập/duyệt"
    USERS ||--o{ NOTIFICATIONS : "nhận"
    
    EVENTS ||--o{ EVENT_VERSIONS : "lưu lịch sử"
    EVENTS ||--o{ EVENT_SCHEDULE_ITEMS : "kịch bản"
    EVENTS ||--o{ BUDGET_ITEMS : "dự toán kinh phí"
    EVENTS ||--o{ APPROVAL_DECISIONS : "quyết định duyệt"
    EVENTS ||--o{ WORKFLOW_HISTORIES : "nhật ký trạng thái"
    EVENTS ||--o{ ATTACHMENTS : "hồ sơ đính kèm"
    EVENTS ||--o{ RESOURCE_BOOKINGS : "đặt chỗ CSVC"
    EVENTS ||--o{ HANDOVER_RECORDS : "bàn giao trước sự kiện"
    EVENTS ||--o{ RETURN_INSPECTIONS : "nghiệm thu hoàn trả"
    EVENTS ||--o{ INCIDENT_REPORTS : "sự cố hư hao"
    EVENTS ||--o{ SETTLEMENTS : "hồ sơ quyết toán"
    EVENTS ||--o| EVENT_REPORTS : "báo cáo tổng kết"
    
    FACILITIES ||--o{ RESOURCE_BOOKINGS : "được đặt"
    RESOURCE_BOOKINGS ||--o{ RESOURCE_BOOKING_ITEMS : "gồm"
    EQUIPMENT ||--o{ RESOURCE_BOOKING_ITEMS : "mượn"
    
    SETTLEMENTS ||--o{ SETTLEMENT_ITEMS : "chi tiết chi"
    SETTLEMENTS ||--o{ FINANCIAL_DOCUMENTS : "hóa đơn VAT"
```

---

## 3. Ma trận Phân quyền theo Vai trò (RBAC Permissions Matrix)

Hệ thống phân quyền theo mô hình **Role-Based Access Control (RBAC)** với 6 vai trò nghiệp vụ:

| Mã Quyền hạn (Permission) | Mô tả Nghiệp vụ | ADMIN | BTC | BCN Khoa | Đoàn Trường | CSVC | KHTC |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **EVENT:CREATE** | Tạo mới hồ sơ sự kiện 5 bước | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **EVENT:VIEW_OWN** | Xem hồ sơ do đơn vị mình phụ trách | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **EVENT:VIEW_FACULTY** | Xem tất cả sự kiện thuộc Khoa | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **EVENT:VIEW_ALL** | Xem toàn bộ hồ sơ trong toàn trường | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **EVENT:EDIT_DRAFT** | Chỉnh sửa hồ sơ ở trạng thái nháp/cần sửa | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **EVENT:SUBMIT** | Nộp hồ sơ xét duyệt chính thức | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **EVENT:CANCEL** | Hủy bỏ sự kiện trước giờ G | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **APPROVAL:KHOA_REVIEW** | BCN Khoa xét duyệt nội dung cấp 1 | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **APPROVAL:DOAN_REVIEW** | Đoàn Trường thẩm định điều kiện cấp 2 | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **APPROVAL:ISSUE_PERMIT**| Ban hành Giấy phép tổ chức sự kiện | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **APPROVAL:VIEW_AUDIT_LOG**| Xem tiến trình và lý do phản hồi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **FACILITY:VIEW_CALENDAR** | Xem lịch sử dụng hội trường & thiết bị | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **FACILITY:REQUEST_BOOKING**| Đăng ký giữ chỗ cơ sở vật chất | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **FACILITY:APPROVE_BOOKING**| CSVC xác nhận giữ chỗ chính thức | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **FACILITY:REJECT_BOOKING** | Từ chối hoặc yêu cầu đổi phương án | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **FACILITY:MANAGE_LIST** | Quản lý danh mục phòng & kiểm kê | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **HANDOVER:SIGN_PRE_EVENT** | Ký biên bản bàn giao CSVC trước giờ G | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **HANDOVER:RECEIVE_FACILITY**| Xác nhận tiếp nhận hiện trạng CSVC | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **HANDOVER:INSPECT_RETURN** | Nghiệm thu và kiểm tra hoàn trả CSVC | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **HANDOVER:LOG_INCIDENT** | Lập biên bản sự cố, hư hỏng thiết bị | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **SETTLEMENT:CREATE** | Lập bảng kê chi phí thực tế & chứng từ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **SETTLEMENT:SUBMIT** | Nộp hồ sơ sang Phòng KHTC | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **SETTLEMENT:VERIFY_DOCS** | Kiểm tra hóa đơn VAT và tính hợp lệ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **SETTLEMENT:APPROVE** | Phê duyệt thanh toán / Từ chối chi | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **REPORT:SUBMIT** | BTC nộp báo cáo tổng kết sau sự kiện | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **REPORT:APPROVE** | Đoàn Trường nghiệm thu báo cáo tổng kết | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **REPORT:VIEW_ANALYTICS** | Xem biểu đồ thống kê KPI & đo lường | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **USER:MANAGE** | Quản lý người dùng, đổi vai trò | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **SYSTEM:CONFIG** | Cấu hình tham số hệ thống | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Danh sách 13 Tài khoản Mẫu Đã Tạo Sẵn

> **Mật khẩu chung cho tất cả tài khoản:** `123456`

| STT | Họ tên & Chức danh | Email Trường DUE | Email Demo | Vai trò | Đơn vị trực thuộc |
|:---:|---|---|---|:---:|---|
| 1 | **Quản Trị Hệ Thống DUE** | `admin@due.edu.vn` | `admin@eventflow.vn` | `ADMIN` | Trung tâm Công nghệ Thông tin DUE |
| 2 | **Nguyễn Văn An** | `btc@due.edu.vn` | `btc1@eventflow.vn` | `BTC` | CLB Tin học DUE (IT Club) |
| 3 | **Trần Thị Bình** | - | `btc2@eventflow.vn` | `BTC` | Liên Chi đoàn Khoa QTKD |
| 4 | **PGS.TS. Lê Văn Cường** | `bcn@due.edu.vn` | `bcnkhoa@eventflow.vn` | `BCN_KHOA` | Ban Chủ nhiệm Khoa QTKD |
| 5 | **ThS. Phạm Thị Dung** | `doantruong@due.edu.vn`| `doantruong@eventflow.vn` | `DOAN_TRUONG` | Văn phòng Đoàn Thanh niên - Hội SV |
| 6 | **Nguyễn Hữu Em** | `csvc@due.edu.vn` | `csvc@eventflow.vn` | `CSVC` | Phòng Cơ sở vật chất & Thiết bị |
| 7 | **Trần Văn Phúc** | `khtc@due.edu.vn` | `khtc@eventflow.vn` | `KHTC` | Phòng Kế hoạch - Tài chính |

---

## 5. Hướng dẫn Chạy File SQL Trực tiếp

### PostgreSQL / Supabase

Kết nối tới một database PostgreSQL trống (Supabase đã tạo sẵn database), sau đó chạy **một file tổng hợp**:

```bash
psql -U postgres -d MY_DUE_QLSK -v ON_ERROR_STOP=1 -f database/MY_DUE_QLSK_PostgreSQL_ALL_IN_ONE.sql
```

File này bao gồm bảng, khóa ngoại, chỉ mục, dữ liệu danh mục, vai trò/quyền RBAC, tài khoản demo bị vô hiệu hóa, view, hàm và trigger. Chạy trên database mới; không chạy đè lên database production nếu chưa sao lưu và rà soát.

> Đây là bản PostgreSQL chuyển đổi của schema `MY_DUE_QLSK` (các bảng `public."Users"`, `public."Events"`). Backend hiện tại dùng Prisma với schema riêng; chạy file này **không tự chuyển cấu hình backend** sang PostgreSQL.

#### Bổ sung bảng tài khoản cho backend Prisma hiện tại

Nếu đang dùng backend hiện tại trên Render, luồng đăng ký cần các bảng `"my_due"."User"` và `"my_due"."PasswordResetToken"`, không phải bảng legacy `public."Users"`. Có thể chạy migration cộng thêm sau trên đúng Supabase project:

```bash
psql -U postgres -d MY_DUE_QLSK -v ON_ERROR_STOP=1 -f database/POSTGRESQL_ACCOUNT_REGISTRATION.sql
```

`POSTGRESQL_ACCOUNT_REGISTRATION.sql` là migration cũ chỉ tạo hai bảng xác thực; không chạy file này nếu đang dùng migration đầy đủ. Để hoàn thiện schema backend Prisma, dùng `database/MIGRATE_MY_DUE_PRISMA_SCHEMA.sql`: migration được sinh từ `backend/prisma/schema.postgresql.prisma`, kiểm tra cấu trúc, khóa chính và unique index của hai bảng xác thực hiện có, dừng nếu bất kỳ tên bảng cần tạo nào đã tồn tại để tránh xung đột, tạo các model còn thiếu cùng index và khóa ngoại, và không đọc/ghi các bảng legacy trong `public`.

Trước khi áp dụng migration đầy đủ trên production, hãy tạo backup Supabase và kiểm tra có thể restore; rà soát kết quả inventory bảng trong schema `my_due`; sau đó mở SQL trong Supabase SQL Editor để review trước khi chạy. Migration dùng transaction, lock/statement timeout, không có `DROP`, `TRUNCATE`, reset, nạp dữ liệu demo hay đổi RLS; nếu kiểm tra cấu trúc hiện tại không khớp, script sẽ dừng. Không deploy/cho backend ghi nghiệp vụ cho đến khi migration hoàn tất và các kiểm tra sau migration đạt yêu cầu. Vì môi trường phát triển hiện không có PostgreSQL server/client hoặc database test riêng, migration chưa được thực thi trên database test; chỉ mới được sinh từ Prisma schema và kiểm tra tĩnh.

### Backend Prisma (SQLite hiện tại)

```bash
cd backend
npx prisma db push
npx tsx prisma/seed.ts
```

Không nạp `schema.sql` (SQL Server) vào SQLite.
