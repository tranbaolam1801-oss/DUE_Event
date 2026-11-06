-- =============================================================================
-- EVENTFLOW — MA TRẬN PHÂN QUYỀN HỆ THỐNG (RBAC PERMISSIONS MATRIX)
-- FILE: database/rbac_permissions_matrix.sql
-- MÔ TẢ: Khởi tạo dữ liệu Vai trò, Danh mục Quyền hạn và Bảng ánh xạ quyền
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. KHỞI TẠO 6 VAI TRÒ HỆ THỐNG (ROLES)
-- -----------------------------------------------------------------------------

INSERT INTO roles (code, name, description, priority) VALUES
('ADMIN',        'Quản trị viên Hệ thống',             'Toàn quyền quản trị tài khoản, danh mục CSVC và cấu hình hệ thống', 100),
('BTC',          'Ban Tổ chức Sự kiện',               'Tạo lập hồ sơ, lập kế hoạch, dự trù kinh phí, nộp báo cáo và quyết toán', 10),
('BCN_KHOA',     'Ban Chủ nhiệm Khoa',                'Thẩm định nội dung cấp cơ sở, phê duyệt hoặc yêu cầu chỉnh sửa hồ sơ', 30),
('DOAN_TRUONG',  'Đoàn Trường Đại học Kinh tế (DUE)', 'Xét duyệt tổng thể, thẩm định điều kiện tổ chức và cấp giấy phép sự kiện', 40),
('CSVC',         'Bộ phận Cơ sở Vật chất & Thiết bị', 'Quản lý phòng/thiết bị, rà soát trùng lịch, giữ chỗ, bàn giao & nghiệm thu', 50),
('KHTC',         'Phòng Kế hoạch – Tài chính',        'Thẩm định chứng từ, kiểm tra dự toán vs thực chi và phê duyệt quyết toán', 60)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, priority = EXCLUDED.priority;

-- -----------------------------------------------------------------------------
-- 2. KHỞI TẠO DANH MỤC QUYỀN HẠN CHI TIẾT (PERMISSIONS)
-- -----------------------------------------------------------------------------

INSERT INTO permissions (code, name, module, description) VALUES
-- Module Hồ sơ Sự kiện (EVENT)
('EVENT:CREATE',             'Tạo mới hồ sơ sự kiện',                'EVENT',      'Được phép khởi tạo hồ sơ sự kiện mới'),
('EVENT:VIEW_ALL',           'Xem tất cả hồ sơ sự kiện',             'EVENT',      'Được xem hồ sơ của tất cả đơn vị trong trường'),
('EVENT:VIEW_OWN',           'Xem hồ sơ của đơn vị mình',            'EVENT',      'Chỉ xem hồ sơ do mình hoặc đơn vị mình tạo'),
('EVENT:VIEW_FACULTY',       'Xem hồ sơ thuộc Khoa quản lý',         'EVENT',      'Xem các hồ sơ sự kiện thuộc phạm vi khoa'),
('EVENT:EDIT_DRAFT',         'Chỉnh sửa hồ sơ ở trạng thái nháp',    'EVENT',      'Sửa thông tin khi hồ sơ chưa gửi hoặc cần sửa'),
('EVENT:EDIT_ANY',           'Chỉnh sửa bất kỳ hồ sơ nào',           'EVENT',      'Quyền quản trị sửa hồ sơ'),
('EVENT:SUBMIT',             'Nộp hồ sơ xét duyệt chính thức',       'EVENT',      'Gửi hồ sơ lên cấp phê duyệt'),
('EVENT:CANCEL',             'Hủy bỏ hồ sơ sự kiện',                 'EVENT',      'Hủy sự kiện trước khi tổ chức'),
('EVENT:DELETE',             'Xóa hồ sơ khỏi hệ thống',              'EVENT',      'Xóa vĩnh viễn hoặc đánh dấu xóa hồ sơ'),

-- Module Phê duyệt & Cấp phép (APPROVAL)
('APPROVAL:KHOA_REVIEW',     'Phê duyệt cấp BCN Khoa',               'APPROVAL',   'Chấp thuận, yêu cầu chỉnh sửa hoặc từ chối ở cấp Khoa'),
('APPROVAL:DOAN_REVIEW',     'Phê duyệt cấp Đoàn Trường',            'APPROVAL',   'Chấp thuận, yêu cầu chỉnh sửa hoặc từ chối ở cấp Đoàn'),
('APPROVAL:ISSUE_PERMIT',    'Cấp giấy phép tổ chức sự kiện',        'APPROVAL',   'Ban hành giấy phép chính thức sau khi đủ điều kiện'),
('APPROVAL:VIEW_AUDIT_LOG',  'Xem nhật ký và lý do phê duyệt',       'APPROVAL',   'Xem toàn bộ tiến trình và lịch sử phản hồi'),

-- Module Cơ sở vật chất & Thiết bị (FACILITY)
('FACILITY:VIEW_CALENDAR',   'Xem lịch sử dụng phòng và thiết bị',   'FACILITY',   'Truy cập lịch hội trường và kiểm tra trùng lặp'),
('FACILITY:REQUEST_BOOKING', 'Đăng ký mượn hội trường & thiết bị',   'FACILITY',   'Gửi yêu cầu giữ chỗ CSVC'),
('FACILITY:APPROVE_BOOKING', 'Phê duyệt giữ chỗ cơ sở vật chất',     'FACILITY',   'Xác nhận lịch giữ chỗ chính thức'),
('FACILITY:REJECT_BOOKING',  'Từ chối hoặc yêu cầu đổi phòng',       'FACILITY',   'Từ chối mượn CSVC hoặc đề xuất địa điểm khác'),
('FACILITY:MANAGE_LIST',     'Quản lý danh mục phòng & thiết bị',    'FACILITY',   'Thêm, sửa, đóng/mở hội trường và kiểm kê thiết bị'),

-- Module Bàn giao & Nghiệm thu (HANDOVER)
('HANDOVER:SIGN_PRE_EVENT',  'Ký biên bản bàn giao trước sự kiện',   'HANDOVER',   'Bàn giao chìa khóa, âm thanh, ánh sáng trước giờ G'),
('HANDOVER:RECEIVE_FACILITY','Ký nhận bàn giao (BTC)',               'HANDOVER',   'Xác nhận tình trạng phòng lúc tiếp nhận'),
('HANDOVER:INSPECT_RETURN',  'Nghiệm thu hoàn trả sau sự kiện',      'HANDOVER',   'Kiểm tra hiện trạng, vệ sinh và số lượng thiết bị'),
('HANDOVER:LOG_INCIDENT',    'Lập biên bản sự cố, hư hao thiết bị',  'HANDOVER',   'Ghi nhận hư hỏng, mất mát thiết bị'),

-- Module Tài chính & Quyết toán (SETTLEMENT)
('SETTLEMENT:CREATE',        'Lập bảng kê quyết toán kinh phí',      'SETTLEMENT', 'Nhập chi phí thực tế và tải lên chứng từ hóa đơn'),
('SETTLEMENT:SUBMIT',        'Nộp hồ sơ quyết toán',                 'SETTLEMENT', 'Gửi quyết toán sang Phòng Kế hoạch - Tài chính'),
('SETTLEMENT:VERIFY_DOCS',   'Kiểm tra hóa đơn VAT và chứng từ',     'SETTLEMENT', 'Thẩm tra tính hợp pháp, hợp lệ của hóa đơn tài chính'),
('SETTLEMENT:APPROVE',       'Phê duyệt thanh quyết toán',           'SETTLEMENT', 'Duyệt thanh toán hoặc từ chối chi'),
('SETTLEMENT:VIEW_ANY',      'Xem hồ sơ quyết toán của các sự kiện', 'SETTLEMENT', 'Truy cập thông tin tài chính sự kiện'),

-- Module Báo cáo tổng kết (REPORT)
('REPORT:SUBMIT',            'Nộp báo cáo tổng kết sau sự kiện',     'REPORT',     'Nhập số liệu thực tế, kết quả và bài học kinh nghiệm'),
('REPORT:APPROVE',           'Nghiệm thu báo cáo tổng kết',          'REPORT',     'Đoàn Trường xác nhận hoàn thành vòng đời sự kiện'),
('REPORT:VIEW_ANALYTICS',    'Xem báo cáo thống kê & đo lường KPI',  'REPORT',     'Xem dashboard đo lường thời gian xử lý và tỷ lệ duyệt'),

-- Module Quản trị Hệ thống (ADMIN)
('USER:MANAGE',              'Quản lý tài khoản & phân quyền',       'ADMIN',      'Thêm mới, khóa tài khoản, đổi vai trò người dùng'),
('SYSTEM:CONFIG',            'Cấu hình tham số hệ thống',            'ADMIN',      'Cấu hình thời gian giữ chỗ, hạn mức kinh phí, email')
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, module = EXCLUDED.module, description = EXCLUDED.description;

-- -----------------------------------------------------------------------------
-- 3. ÁNH XẠ MA TRẬN PHÂN QUYỀN (ROLE - PERMISSION MAPPING)
-- -----------------------------------------------------------------------------

-- Xóa dữ liệu ánh xạ cũ để cập nhật mới sạch sẽ
DELETE FROM role_permissions;

-- [VAI TRÒ 1: ADMIN] -> Có toàn bộ các quyền trong hệ thống
INSERT INTO role_permissions (role_code, permission_code)
SELECT 'ADMIN', code FROM permissions;

-- [VAI TRÒ 2: BTC - BAN TỔ CHỨC SỰ KIỆN]
INSERT INTO role_permissions (role_code, permission_code) VALUES
('BTC', 'EVENT:CREATE'),
('BTC', 'EVENT:VIEW_OWN'),
('BTC', 'EVENT:EDIT_DRAFT'),
('BTC', 'EVENT:SUBMIT'),
('BTC', 'EVENT:CANCEL'),
('BTC', 'APPROVAL:VIEW_AUDIT_LOG'),
('BTC', 'FACILITY:VIEW_CALENDAR'),
('BTC', 'FACILITY:REQUEST_BOOKING'),
('BTC', 'HANDOVER:RECEIVE_FACILITY'),
('BTC', 'SETTLEMENT:CREATE'),
('BTC', 'SETTLEMENT:SUBMIT'),
('BTC', 'REPORT:SUBMIT');

-- [VAI TRÒ 3: BCN_KHOA - BAN CHỦ NHIỆM KHOA]
INSERT INTO role_permissions (role_code, permission_code) VALUES
('BCN_KHOA', 'EVENT:VIEW_FACULTY'),
('BCN_KHOA', 'APPROVAL:KHOA_REVIEW'),
('BCN_KHOA', 'APPROVAL:VIEW_AUDIT_LOG'),
('BCN_KHOA', 'FACILITY:VIEW_CALENDAR'),
('BCN_KHOA', 'REPORT:VIEW_ANALYTICS');

-- [VAI TRÒ 4: DOAN_TRUONG - ĐOÀN TRƯỜNG ĐẠI HỌC KINH TẾ (DUE)]
INSERT INTO role_permissions (role_code, permission_code) VALUES
('DOAN_TRUONG', 'EVENT:VIEW_ALL'),
('DOAN_TRUONG', 'APPROVAL:DOAN_REVIEW'),
('DOAN_TRUONG', 'APPROVAL:ISSUE_PERMIT'),
('DOAN_TRUONG', 'APPROVAL:VIEW_AUDIT_LOG'),
('DOAN_TRUONG', 'FACILITY:VIEW_CALENDAR'),
('DOAN_TRUONG', 'REPORT:APPROVE'),
('DOAN_TRUONG', 'REPORT:VIEW_ANALYTICS');

-- [VAI TRÒ 5: CSVC - BỘ PHẬN CƠ SỞ VẬT CHẤT]
INSERT INTO role_permissions (role_code, permission_code) VALUES
('CSVC', 'EVENT:VIEW_ALL'),
('CSVC', 'APPROVAL:VIEW_AUDIT_LOG'),
('CSVC', 'FACILITY:VIEW_CALENDAR'),
('CSVC', 'FACILITY:APPROVE_BOOKING'),
('CSVC', 'FACILITY:REJECT_BOOKING'),
('CSVC', 'FACILITY:MANAGE_LIST'),
('CSVC', 'HANDOVER:SIGN_PRE_EVENT'),
('CSVC', 'HANDOVER:INSPECT_RETURN'),
('CSVC', 'HANDOVER:LOG_INCIDENT'),
('CSVC', 'REPORT:VIEW_ANALYTICS');

-- [VAI TRÒ 6: KHTC - PHÒNG KẾ HOẠCH TÀI CHÍNH]
INSERT INTO role_permissions (role_code, permission_code) VALUES
('KHTC', 'EVENT:VIEW_ALL'),
('KHTC', 'APPROVAL:VIEW_AUDIT_LOG'),
('KHTC', 'SETTLEMENT:VIEW_ANY'),
('KHTC', 'SETTLEMENT:VERIFY_DOCS'),
('KHTC', 'SETTLEMENT:APPROVE'),
('KHTC', 'REPORT:VIEW_ANALYTICS');
