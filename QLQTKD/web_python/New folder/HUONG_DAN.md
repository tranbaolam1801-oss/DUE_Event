# MY DUE – Cơ sở dữ liệu SQL Server (tham khảo bài QTCSDL)

## Chạy trong SSMS
1. Mở `01_CAI_DAT_DAY_DU.sql`, bấm F5 (tự tạo database nếu chưa tồn tại).
2. Nếu thành công mới chạy `02_NANG_CAO_QTCSDL.sql` để bổ sung SQL role, tài khoản chưa kích hoạt, view, trigger, procedure.
3. Chạy các câu SELECT ở cuối file 02 để xem kết quả.

`00_TAO_DATABASE.sql` là file tùy chọn để kiểm tra riêng lệnh tạo database; không cần chạy nếu đã chạy file 01.

## Phân quyền giống báo cáo QTCSDL
- **RBAC website:** Users/Roles/Permissions/UserRoles/RolePermissions để Flask quyết định menu và chặn API.
- **Database Roles:** due_app_execute (được EXECUTE trên procedure được phép), due_auditor_read (SELECT view), không dùng admin SQL cho Flask.
- 7 tài khoản `@eventflow.vn` được tạo **chưa kích hoạt**, không có mật khẩu. Backend Flask phải hash password (Werkzeug/Argon2/bcrypt tùy lựa chọn) rồi kích hoạt qua quy trình seed bảo mật.
- Chưa tạo 7 SQL Server login. Những tài khoản này là người dùng WEB, không nên kết nối trực tiếp DB.

## Giới hạn & kiểm tra
- SQL scripts được rà soát tĩnh; **chưa được chạy trên SQL Server thật trong môi trường này**.
- Không chạy trên database production khi chưa sao lưu và kiểm thử.
- Bản cài đặt nền của phiên trước có workflow một chiều đơn giản hóa. Cần điều chỉnh quy tắc nhánh BPMN trước khi dùng nghiệp vụ thật: quyết định yêu cầu báo cáo, phạm vi phê duyệt thanh toán, kiểm kê thiết bị và phân quyền Khoa.
- `due_app_execute` không có quyền SELECT/INSERT toàn bộ bảng: cần viết thêm SP cho các nghiệp vụ API còn lại.
- Không sử dụng file `.sql` để cài đặt người dùng website kèm mật khẩu plaintext.
