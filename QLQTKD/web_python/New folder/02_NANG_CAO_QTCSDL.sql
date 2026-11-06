USE [MY_DUE_QLSK];
GO
/* MY DUE - PHAN NANG CAO THEO BAI QTCSDL
   Chay SAU 01_CAI_DAT_DAY_DU.sql. Khong DROP du lieu.
   RBAC ung dung (Users/Roles/Permissions) KHAC database roles.
*/
-- 1. BO SUNG BANG LICH SU CHUNG TU VA QUYET DINH THANH TOAN
IF OBJECT_ID(N'dbo.PaymentDecisions',N'U') IS NULL
BEGIN
 CREATE TABLE dbo.PaymentDecisions(
  DecisionId BIGINT IDENTITY(1,1) PRIMARY KEY,
  PaymentRequestId BIGINT NOT NULL REFERENCES dbo.PaymentRequests(PaymentRequestId),
  DecisionBy BIGINT NOT NULL REFERENCES dbo.Users(UserId),
  DecisionCode VARCHAR(20) NOT NULL,
  Reason NVARCHAR(1500) NULL,
  DecidedAt DATETIME2(0) NOT NULL CONSTRAINT DF_PaymentDecisions_At DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_PaymentDecisions_Code CHECK(DecisionCode IN ('APPROVED','REJECTED'))
 );
END;
GO
-- 2. USER DEMO: KHONG TAO MAT KHAU YEU; PasswordHash la placeholder cam dang nhap
-- Neu email da co, script giu nguyen du lieu va mat khau hien tai.
DECLARE @U TABLE(Email NVARCHAR(80), FullName NVARCHAR(160), RoleCode VARCHAR(60));
INSERT @U VALUES
(N'btc1@eventflow.vn',N'Nguyễn Văn An – CLB Tin học DUE','BCH_LIEN_CHI_DOAN'),
(N'btc2@eventflow.vn',N'Trần Thị Bình – LCĐ Khoa Quản trị Kinh doanh','BCH_LIEN_CHI_DOAN'),
(N'bcnkhoa@eventflow.vn',N'PGS.TS. Lê Văn Cường – Ban Chủ nhiệm Khoa QTKD','BAN_CHU_NHIEM_KHOA'),
(N'doantruong@eventflow.vn',N'ThS. Phạm Thị Dung – Đoàn Trường DUE','DOAN_TRUONG'),
(N'csvc@eventflow.vn',N'Nguyễn Hữu Em – Phòng Cơ sở vật chất','PHONG_CSVC'),
(N'khtc@eventflow.vn',N'Trần Văn Phúc – Phòng Kế hoạch - Tài chính','PHONG_KHTC'),
(N'admin@eventflow.vn',N'Lê Hoàng Admin – Quản trị viên','SYSTEM_ADMIN');
IF EXISTS(SELECT 1 FROM @U x WHERE NOT EXISTS(SELECT 1 FROM dbo.Roles r WHERE r.Code=x.RoleCode))
 THROW 52001,N'Thiếu mã Role; hãy chạy file cài đặt chính trước.',1;
INSERT dbo.Users(Username,PasswordHash,DisplayName,IsActive)
SELECT x.Email,N'!PASSWORD_NOT_SET!',x.FullName,0
FROM @U x WHERE NOT EXISTS(SELECT 1 FROM dbo.Users u WHERE u.Username=x.Email);
INSERT dbo.UserRoles(UserId,RoleId)
SELECT u.UserId,r.RoleId FROM @U x JOIN dbo.Users u ON u.Username=x.Email
JOIN dbo.Roles r ON r.Code=x.RoleCode
WHERE NOT EXISTS (SELECT 1 FROM dbo.UserRoles ur WHERE ur.UserId=u.UserId AND ur.RoleId=r.RoleId);
GO
-- 3. VIEW TRA CUU TAI KHOAN VA QUYEN (khong de lo PasswordHash)
CREATE OR ALTER VIEW dbo.v_AccountsAndRoles AS
SELECT u.UserId,u.Username,u.DisplayName,u.IsActive,r.Code AS RoleCode,r.Name AS RoleName
FROM dbo.Users u JOIN dbo.UserRoles ur ON u.UserId=ur.UserId
JOIN dbo.Roles r ON r.RoleId=ur.RoleId;
GO
-- 4. TRIGGER TU CHOI XOA HO SO DA CO LICH SU (bao ve minh chung nghiep vu)
CREATE OR ALTER TRIGGER dbo.trg_Events_BlockDeleteWithHistory
ON dbo.Events INSTEAD OF DELETE
AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM deleted d WHERE EXISTS(SELECT 1 FROM dbo.WorkflowHistory h WHERE h.EventId=d.EventId))
  THROW 52002,N'Không được xóa hồ sơ đã có lịch sử xử lý.',1;
 -- Voi ho so nhap, chi cho xoa neu KHONG co bat ky phu thuoc nao
 IF EXISTS(SELECT 1 FROM deleted d WHERE
   EXISTS(SELECT 1 FROM dbo.EventPlans x WHERE x.EventId=d.EventId) OR
   EXISTS(SELECT 1 FROM dbo.BudgetItems x WHERE x.EventId=d.EventId) OR
   EXISTS(SELECT 1 FROM dbo.EventDocuments x WHERE x.EventId=d.EventId) OR
   EXISTS(SELECT 1 FROM dbo.FacilityRequests x WHERE x.EventId=d.EventId) OR
   EXISTS(SELECT 1 FROM dbo.EventReports x WHERE x.EventId=d.EventId) OR
   EXISTS(SELECT 1 FROM dbo.PaymentRequests x WHERE x.EventId=d.EventId))
  THROW 52003,N'Không được xóa hồ sơ có dữ liệu liên quan.',1;
 DELETE e FROM dbo.Events e JOIN deleted d ON d.EventId=e.EventId;
END;
GO
-- 5. TRIGGER CHAN LICH DAT THIET BI AM (neu bảng không có dạng SL tồn kho, xem ràng buộc CHECK ở schema)
-- 6. GIAO TAC: tao ho so moi va ke hoach dong bo
CREATE OR ALTER PROCEDURE dbo.usp_CreateEventDraft
 @ActorId BIGINT,@DepartmentId INT,@Title NVARCHAR(240),
 @StartsAt DATETIME2(0)=NULL,@EndsAt DATETIME2(0)=NULL,
 @Objectives NVARCHAR(MAX)=NULL,@NewEventId BIGINT OUTPUT
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF NULLIF(LTRIM(RTRIM(@Title)),N'') IS NULL THROW 52010,N'Chưa nhập tên sự kiện.',1;
 IF @StartsAt IS NOT NULL AND @EndsAt IS NOT NULL AND @StartsAt>=@EndsAt THROW 52011,N'Thời gian không hợp lệ.',1;
 BEGIN TRY
  BEGIN TRAN;
  IF NOT EXISTS(SELECT 1 FROM dbo.Users u WHERE u.UserId=@ActorId AND u.IsActive=1)
    THROW 52012,N'Tài khoản không hoạt động.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.UserRoles ur JOIN dbo.RolePermissions rp ON ur.RoleId=rp.RoleId
   JOIN dbo.Permissions p ON rp.PermissionId=p.PermissionId
   WHERE ur.UserId=@ActorId AND p.Code='events.create')
    THROW 52013,N'Tài khoản không có quyền tạo hồ sơ.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.Departments WHERE DepartmentId=@DepartmentId AND IsActive=1)
    THROW 52014,N'Đơn vị không tồn tại.',1;
  INSERT dbo.Events(Title,OrganizerDepartmentId,CreatedBy,StartsAt,EndsAt,StateCode)
   VALUES(@Title,@DepartmentId,@ActorId,@StartsAt,@EndsAt,'DRAFT');
  SET @NewEventId=CONVERT(BIGINT,SCOPE_IDENTITY());
  INSERT dbo.EventPlans(EventId,Objectives) VALUES(@NewEventId,@Objectives);
  INSERT dbo.AuditLogs(ActorId,EntityName,EntityId,ActionCode,Details)
    VALUES(@ActorId,'Events',CONVERT(NVARCHAR(80),@NewEventId),'CREATE_DRAFT',@Title);
  COMMIT;
 END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH
END;
GO
-- 7. STORED PROCEDURE: DANH SACH SU KIEN THEO NGUOI DUNG
CREATE OR ALTER PROCEDURE dbo.usp_ListMyEvents @ActorId BIGINT
AS
BEGIN
 SET NOCOUNT ON;
 IF NOT EXISTS(SELECT 1 FROM dbo.Users WHERE UserId=@ActorId AND IsActive=1)
 THROW 52020,N'Người dùng không hợp lệ.',1;
 SELECT e.EventId,e.TicketCode,e.Title,e.StateCode,e.StartsAt,e.EndsAt,e.CreatedAt
 FROM dbo.Events e WHERE e.CreatedBy=@ActorId ORDER BY e.CreatedAt DESC;
END;
GO
-- 8. BAO CAO THONG KE (VIEW)
CREATE OR ALTER VIEW dbo.v_EventStatusCount AS
SELECT s.StateCode,s.StateName,COUNT_BIG(e.EventId) AS TotalEvents
FROM dbo.WorkflowStates s LEFT JOIN dbo.Events e ON s.StateCode=e.StateCode
GROUP BY s.StateCode,s.StateName;
GO
-- 9. ROLE SQL SERVER: minh hoa phan quyen CSDL giong bai QTCSDL
-- Phan quyen SQL SERVER khong thay the phan quyen 7 tai khoan dang nhap WEB.
IF NOT EXISTS(SELECT 1 FROM sys.database_principals WHERE name=N'due_app_execute' AND type='R')
 CREATE ROLE due_app_execute;
IF NOT EXISTS(SELECT 1 FROM sys.database_principals WHERE name=N'due_auditor_read' AND type='R')
 CREATE ROLE due_auditor_read;
GO
-- Grant hẹp: chỉ các stored procedure cần thiết, không cấp ghi trực tiếp bảng Users/Events.
GRANT EXECUTE ON OBJECT::dbo.usp_CreateEventDraft TO due_app_execute;
GRANT EXECUTE ON OBJECT::dbo.usp_ListMyEvents TO due_app_execute;
GRANT EXECUTE ON OBJECT::dbo.usp_TransitionEvent TO due_app_execute;
GRANT EXECUTE ON OBJECT::dbo.usp_ReserveFacility TO due_app_execute;
GRANT SELECT ON OBJECT::dbo.v_UserPermissions TO due_app_execute;
GRANT SELECT ON OBJECT::dbo.v_EventOverview TO due_app_execute;
GRANT SELECT ON OBJECT::dbo.v_AccountsAndRoles TO due_auditor_read;
GRANT SELECT ON OBJECT::dbo.v_EventStatusCount TO due_auditor_read;
GO
-- KHONG tao SQL Server Login voi password mau. Sau khi tao Login ung dung, DBA gan vao due_app_execute:
-- CREATE USER [due_web_user] FOR LOGIN [due_web_login];
-- ALTER ROLE due_app_execute ADD MEMBER [due_web_user];
-- Các API còn lại cần các stored procedure tương ứng trước khi cấp quyền.
-- 10. KIEM THU DOC: KHONG PHAT SINH THEM HO SO
SELECT 'Database' AS KiemTra, DB_NAME() AS KetQua;
SELECT 'SoBang' AS KiemTra,CONVERT(NVARCHAR(30),COUNT(*)) AS KetQua FROM sys.tables;
SELECT 'SoTrigger' AS KiemTra,CONVERT(NVARCHAR(30),COUNT(*)) AS KetQua FROM sys.triggers WHERE parent_class=1;
SELECT 'SoProcedure' AS KiemTra,CONVERT(NVARCHAR(30),COUNT(*)) AS KetQua FROM sys.procedures;
SELECT Username,DisplayName,IsActive,RoleCode FROM dbo.v_AccountsAndRoles WHERE Username LIKE N'%@eventflow.vn';
SELECT * FROM dbo.v_EventStatusCount ORDER BY StateCode;
GO
