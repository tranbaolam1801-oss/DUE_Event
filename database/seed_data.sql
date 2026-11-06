USE [MY_DUE_QLSK];
GO
-- SQL Server 2017+; các bảng được tạo nếu chưa tồn tại. Không xóa dữ liệu cũ.
IF OBJECT_ID('dbo.Departments','U') IS NULL CREATE TABLE dbo.Departments(
 DepartmentId INT IDENTITY PRIMARY KEY, Code VARCHAR(40) NOT NULL UNIQUE, Name NVARCHAR(160) NOT NULL, IsActive BIT NOT NULL DEFAULT 1);
IF OBJECT_ID('dbo.Roles','U') IS NULL CREATE TABLE dbo.Roles(
 RoleId INT IDENTITY PRIMARY KEY, Code VARCHAR(60) NOT NULL UNIQUE, Name NVARCHAR(150) NOT NULL);
IF OBJECT_ID('dbo.Permissions','U') IS NULL CREATE TABLE dbo.Permissions(
 PermissionId INT IDENTITY PRIMARY KEY, Code VARCHAR(100) NOT NULL UNIQUE, Description NVARCHAR(240) NULL);
IF OBJECT_ID('dbo.RolePermissions','U') IS NULL CREATE TABLE dbo.RolePermissions(
 RoleId INT NOT NULL REFERENCES dbo.Roles(RoleId), PermissionId INT NOT NULL REFERENCES dbo.Permissions(PermissionId), CONSTRAINT PK_RolePermissions PRIMARY KEY(RoleId,PermissionId));
IF OBJECT_ID('dbo.Users','U') IS NULL CREATE TABLE dbo.Users(
 UserId BIGINT IDENTITY PRIMARY KEY, Username NVARCHAR(80) NOT NULL UNIQUE, PasswordHash NVARCHAR(255) NOT NULL,
 DisplayName NVARCHAR(160) NOT NULL, DepartmentId INT NULL REFERENCES dbo.Departments(DepartmentId),
 IsActive BIT NOT NULL DEFAULT 1, CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('dbo.UserRoles','U') IS NULL CREATE TABLE dbo.UserRoles(
 UserId BIGINT NOT NULL REFERENCES dbo.Users(UserId), RoleId INT NOT NULL REFERENCES dbo.Roles(RoleId), CONSTRAINT PK_UserRoles PRIMARY KEY(UserId,RoleId));
IF OBJECT_ID('dbo.WorkflowStates','U') IS NULL CREATE TABLE dbo.WorkflowStates(
 StateCode VARCHAR(50) NOT NULL PRIMARY KEY, StateName NVARCHAR(140) NOT NULL, IsTerminal BIT NOT NULL DEFAULT 0);
IF OBJECT_ID('dbo.WorkflowTransitions','U') IS NULL CREATE TABLE dbo.WorkflowTransitions(
 TransitionId INT IDENTITY PRIMARY KEY, FromState VARCHAR(50) NOT NULL REFERENCES dbo.WorkflowStates(StateCode),
 ActionCode VARCHAR(60) NOT NULL, ToState VARCHAR(50) NOT NULL REFERENCES dbo.WorkflowStates(StateCode),
 RequiredPermission VARCHAR(100) NOT NULL REFERENCES dbo.Permissions(Code),
 CONSTRAINT UQ_WorkflowTransition UNIQUE(FromState,ActionCode));
IF OBJECT_ID('dbo.Events','U') IS NULL CREATE TABLE dbo.Events(
 EventId BIGINT IDENTITY PRIMARY KEY, TicketCode AS ('EVT-'+RIGHT('00000000'+CONVERT(VARCHAR(8),EventId),8)) PERSISTED,
 Title NVARCHAR(240) NOT NULL, Description NVARCHAR(MAX) NULL, OrganizerDepartmentId INT NOT NULL REFERENCES dbo.Departments(DepartmentId),
 CreatedBy BIGINT NOT NULL REFERENCES dbo.Users(UserId), StartsAt DATETIME2(0) NULL, EndsAt DATETIME2(0) NULL,
 ExpectedAttendees INT NULL, StateCode VARCHAR(50) NOT NULL DEFAULT 'DRAFT' REFERENCES dbo.WorkflowStates(StateCode),
 RowVer ROWVERSION, CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT CK_EventDates CHECK(StartsAt IS NULL OR EndsAt IS NULL OR StartsAt < EndsAt),
 CONSTRAINT CK_EventAttendance CHECK(ExpectedAttendees IS NULL OR ExpectedAttendees >= 0));
IF OBJECT_ID('dbo.EventPlans','U') IS NULL CREATE TABLE dbo.EventPlans(
 EventId BIGINT NOT NULL PRIMARY KEY REFERENCES dbo.Events(EventId), Objectives NVARCHAR(MAX) NULL, ProgramContent NVARCHAR(MAX) NULL,
 Timeline NVARCHAR(MAX) NULL, Staffing NVARCHAR(MAX) NULL, RiskPlan NVARCHAR(MAX) NULL, UpdatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('dbo.BudgetItems','U') IS NULL CREATE TABLE dbo.BudgetItems(
 BudgetItemId BIGINT IDENTITY PRIMARY KEY, EventId BIGINT NOT NULL REFERENCES dbo.Events(EventId),
 ItemName NVARCHAR(200) NOT NULL, Quantity DECIMAL(12,2) NOT NULL, UnitPrice DECIMAL(19,2) NOT NULL,
 EstimatedAmount AS (Quantity*UnitPrice) PERSISTED, CONSTRAINT CK_BudgetPositive CHECK(Quantity>0 AND UnitPrice>=0));
IF OBJECT_ID('dbo.EventDocuments','U') IS NULL CREATE TABLE dbo.EventDocuments(
 DocumentId BIGINT IDENTITY PRIMARY KEY, EventId BIGINT NOT NULL REFERENCES dbo.Events(EventId), DocumentType VARCHAR(50) NOT NULL,
 OriginalFileName NVARCHAR(255) NOT NULL, StorageKey NVARCHAR(500) NOT NULL, MimeType VARCHAR(120) NOT NULL,
 FileSizeBytes BIGINT NOT NULL, UploadedBy BIGINT NOT NULL REFERENCES dbo.Users(UserId), UploadedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT CK_FileSize CHECK(FileSizeBytes > 0 AND FileSizeBytes <= 20971520));
IF OBJECT_ID('dbo.WorkflowHistory','U') IS NULL CREATE TABLE dbo.WorkflowHistory(
 HistoryId BIGINT IDENTITY PRIMARY KEY, EventId BIGINT NOT NULL REFERENCES dbo.Events(EventId),
 FromState VARCHAR(50) NULL REFERENCES dbo.WorkflowStates(StateCode), ToState VARCHAR(50) NOT NULL REFERENCES dbo.WorkflowStates(StateCode),
 ActionCode VARCHAR(60) NOT NULL, ActorId BIGINT NOT NULL REFERENCES dbo.Users(UserId),
 Comment NVARCHAR(2000) NULL, PerformedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('dbo.Facilities','U') IS NULL CREATE TABLE dbo.Facilities(
 FacilityId INT IDENTITY PRIMARY KEY, Code VARCHAR(40) NOT NULL UNIQUE, Name NVARCHAR(160) NOT NULL, Capacity INT NULL,
 IsActive BIT NOT NULL DEFAULT 1, CONSTRAINT CK_FacilityCapacity CHECK(Capacity IS NULL OR Capacity>0));
IF OBJECT_ID('dbo.Equipment','U') IS NULL CREATE TABLE dbo.Equipment(
 EquipmentId INT IDENTITY PRIMARY KEY, Code VARCHAR(40) NOT NULL UNIQUE, Name NVARCHAR(160) NOT NULL,
 TotalQuantity INT NOT NULL DEFAULT 0, IsActive BIT NOT NULL DEFAULT 1, CONSTRAINT CK_EquipmentQuantity CHECK(TotalQuantity>=0));
IF OBJECT_ID('dbo.FacilityRequests','U') IS NULL CREATE TABLE dbo.FacilityRequests(
 RequestId BIGINT IDENTITY PRIMARY KEY, EventId BIGINT NOT NULL REFERENCES dbo.Events(EventId),
 RequestedBy BIGINT NOT NULL REFERENCES dbo.Users(UserId), RequestedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 Status VARCHAR(25) NOT NULL DEFAULT 'PENDING', Note NVARCHAR(1000) NULL,
 CONSTRAINT CK_FacilityReqStatus CHECK(Status IN('PENDING','REVISION','APPROVED','REJECTED','CLOSED')));
IF OBJECT_ID('dbo.FacilityReservations','U') IS NULL CREATE TABLE dbo.FacilityReservations(
 ReservationId BIGINT IDENTITY PRIMARY KEY, RequestId BIGINT NOT NULL REFERENCES dbo.FacilityRequests(RequestId),
 FacilityId INT NOT NULL REFERENCES dbo.Facilities(FacilityId), StartsAt DATETIME2(0) NOT NULL, EndsAt DATETIME2(0) NOT NULL,
 Status VARCHAR(20) NOT NULL DEFAULT 'HELD', CONSTRAINT CK_ReservationDates CHECK(StartsAt<EndsAt),
 CONSTRAINT CK_ReservationStatus CHECK(Status IN('HELD','CONFIRMED','CANCELLED','COMPLETED')));
IF OBJECT_ID('dbo.EquipmentRequests','U') IS NULL CREATE TABLE dbo.EquipmentRequests(
 RequestId BIGINT NOT NULL REFERENCES dbo.FacilityRequests(RequestId), EquipmentId INT NOT NULL REFERENCES dbo.Equipment(EquipmentId),
 Quantity INT NOT NULL, CONSTRAINT PK_EquipmentRequests PRIMARY KEY(RequestId,EquipmentId), CONSTRAINT CK_EquipmentReqQuantity CHECK(Quantity>0));
IF OBJECT_ID('dbo.EquipmentHandovers','U') IS NULL CREATE TABLE dbo.EquipmentHandovers(
 HandoverId BIGINT IDENTITY PRIMARY KEY, RequestId BIGINT NOT NULL REFERENCES dbo.FacilityRequests(RequestId),
 HandoverType VARCHAR(12) NOT NULL, ConditionNote NVARCHAR(1000) NULL, EvidenceDocumentId BIGINT NULL REFERENCES dbo.EventDocuments(DocumentId),
 RecordedBy BIGINT NOT NULL REFERENCES dbo.Users(UserId), RecordedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT CK_HandoverType CHECK(HandoverType IN('ISSUE','RETURN')));
IF OBJECT_ID('dbo.EventReports','U') IS NULL CREATE TABLE dbo.EventReports(
 ReportId BIGINT IDENTITY PRIMARY KEY, EventId BIGINT NOT NULL UNIQUE REFERENCES dbo.Events(EventId),
 Content NVARCHAR(MAX) NULL, IsRequired BIT NOT NULL DEFAULT 0, IsConfirmed BIT NOT NULL DEFAULT 0,
 SubmittedAt DATETIME2(0) NULL, ConfirmedBy BIGINT NULL REFERENCES dbo.Users(UserId));
IF OBJECT_ID('dbo.PaymentRequests','U') IS NULL CREATE TABLE dbo.PaymentRequests(
 PaymentRequestId BIGINT IDENTITY PRIMARY KEY, EventId BIGINT NOT NULL UNIQUE REFERENCES dbo.Events(EventId),
 Amount DECIMAL(19,2) NOT NULL, Status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
 SubmittedBy BIGINT NOT NULL REFERENCES dbo.Users(UserId), ApprovedBy BIGINT NULL REFERENCES dbo.Users(UserId),
 ApprovedAt DATETIME2(0) NULL, PaidAt DATETIME2(0) NULL,
 CONSTRAINT CK_PaymentAmount CHECK(Amount>=0),
 CONSTRAINT CK_PaymentStatus CHECK(Status IN('DRAFT','SUBMITTED','NEEDS_DOCUMENTS','UNDER_REVIEW','AWAITING_AUTHORITY','APPROVED','REJECTED','RECORDED_PAID')));
IF OBJECT_ID('dbo.FinancialDocuments','U') IS NULL CREATE TABLE dbo.FinancialDocuments(
 FinancialDocumentId BIGINT IDENTITY PRIMARY KEY, PaymentRequestId BIGINT NOT NULL REFERENCES dbo.PaymentRequests(PaymentRequestId),
 DocumentId BIGINT NOT NULL REFERENCES dbo.EventDocuments(DocumentId), CONSTRAINT UQ_FinanceDoc UNIQUE(PaymentRequestId,DocumentId));
IF OBJECT_ID('dbo.Notifications','U') IS NULL CREATE TABLE dbo.Notifications(
 NotificationId BIGINT IDENTITY PRIMARY KEY, RecipientUserId BIGINT NOT NULL REFERENCES dbo.Users(UserId),
 EventId BIGINT NULL REFERENCES dbo.Events(EventId), Title NVARCHAR(200) NOT NULL, Body NVARCHAR(1000) NULL,
 IsRead BIT NOT NULL DEFAULT 0, CreatedAt DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('dbo.AuditLogs','U') IS NULL CREATE TABLE dbo.AuditLogs(
 AuditId BIGINT IDENTITY PRIMARY KEY, ActorId BIGINT NULL REFERENCES dbo.Users(UserId), EntityName VARCHAR(80) NOT NULL,
 EntityId NVARCHAR(80) NOT NULL, ActionCode VARCHAR(80) NOT NULL, Details NVARCHAR(MAX) NULL,
 AtUtc DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME());
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.Events') AND name='IX_Events_State_Dept')
 CREATE INDEX IX_Events_State_Dept ON dbo.Events(StateCode,OrganizerDepartmentId,CreatedAt DESC);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.WorkflowHistory') AND name='IX_History_Event_Date')
 CREATE INDEX IX_History_Event_Date ON dbo.WorkflowHistory(EventId,PerformedAt DESC);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.FacilityReservations') AND name='IX_Reservation_Facility_Time')
 CREATE INDEX IX_Reservation_Facility_Time ON dbo.FacilityReservations(FacilityId,StartsAt,EndsAt) INCLUDE(Status);
GO
USE [MY_DUE_QLSK];
GO
-- Nghiệp vụ chỉ được thay đổi trạng thái bằng stored procedure với transaction.
CREATE OR ALTER PROCEDURE dbo.usp_TransitionEvent
 @EventId BIGINT, @ActorId BIGINT, @ActionCode VARCHAR(60), @Comment NVARCHAR(2000)=NULL
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 BEGIN TRY
  BEGIN TRAN;
  DECLARE @old VARCHAR(50),@next VARCHAR(50),@perm VARCHAR(100),@dept INT,@owner BIGINT;
  SELECT @old=StateCode,@dept=OrganizerDepartmentId,@owner=CreatedBy FROM dbo.Events WITH(UPDLOCK,HOLDLOCK) WHERE EventId=@EventId;
  IF @old IS NULL THROW 51001,N'Hồ sơ không tồn tại.',1;
  SELECT @next=ToState,@perm=RequiredPermission FROM dbo.WorkflowTransitions WHERE FromState=@old AND ActionCode=@ActionCode;
  IF @next IS NULL THROW 51002,N'Thao tác không hợp lệ ở trạng thái hiện tại.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.Users WHERE UserId=@ActorId AND IsActive=1) THROW 51003,N'Tài khoản không hoạt động.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.UserRoles ur JOIN dbo.RolePermissions rp ON rp.RoleId=ur.RoleId
    JOIN dbo.Permissions p ON p.PermissionId=rp.PermissionId WHERE ur.UserId=@ActorId AND p.Code=@perm)
    THROW 51004,N'Không có quyền thực hiện.',1;
  IF @perm IN('events.edit','events.submit','facilities.request','reports.create','payments.submit') AND @owner<>@ActorId
     THROW 51005,N'Chỉ người tạo hồ sơ được gửi hoặc sửa ở mẫu này.',1;
  IF @perm='approvals.department.decide' AND NOT EXISTS(SELECT 1 FROM dbo.Users u WHERE u.UserId=@ActorId AND u.DepartmentId=@dept)
     THROW 51006,N'Không thuộc đơn vị quản lý hồ sơ.',1;
  IF @ActionCode IN('REJECT','REQUEST_REVISION','REQUEST_DOCUMENTS') AND NULLIF(LTRIM(RTRIM(@Comment)),N'') IS NULL
     THROW 51007,N'Cần ghi lý do hoặc góp ý.',1;
  UPDATE dbo.Events SET StateCode=@next,UpdatedAt=SYSUTCDATETIME() WHERE EventId=@EventId;
  INSERT dbo.WorkflowHistory(EventId,FromState,ToState,ActionCode,ActorId,Comment)
   VALUES(@EventId,@old,@next,@ActionCode,@ActorId,@Comment);
  INSERT dbo.AuditLogs(ActorId,EntityName,EntityId,ActionCode,Details)
   VALUES(@ActorId,'Events',CONVERT(NVARCHAR(80),@EventId),@ActionCode,CONCAT(@old,' -> ',@next));
  COMMIT;
  SELECT @EventId AS EventId,@old AS PreviousState,@next AS CurrentState;
 END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH
END;
GO
-- Giữ chỗ phòng: SERIALIZABLE + khóa trên Facilities để tránh trùng lịch khi hai người đặt đồng thời.
CREATE OR ALTER PROCEDURE dbo.usp_ReserveFacility
 @RequestId BIGINT,@FacilityId INT,@StartsAt DATETIME2(0),@EndsAt DATETIME2(0)
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @StartsAt>=@EndsAt THROW 51101,N'Khoảng thời gian không hợp lệ.',1;
 BEGIN TRY
 BEGIN TRAN;
 IF NOT EXISTS(SELECT 1 FROM dbo.FacilityRequests WHERE RequestId=@RequestId) THROW 51102,N'Yêu cầu không tồn tại.',1;
 IF NOT EXISTS(SELECT 1 FROM dbo.Facilities WITH(UPDLOCK,HOLDLOCK) WHERE FacilityId=@FacilityId AND IsActive=1)
  THROW 51103,N'Địa điểm không tồn tại hoặc không hoạt động.',1;
 IF EXISTS(SELECT 1 FROM dbo.FacilityReservations WITH(UPDLOCK,HOLDLOCK)
  WHERE FacilityId=@FacilityId AND Status IN('HELD','CONFIRMED') AND StartsAt<@EndsAt AND EndsAt>@StartsAt)
  THROW 51104,N'Địa điểm đã được giữ hoặc đặt trong thời gian này.',1;
 INSERT dbo.FacilityReservations(RequestId,FacilityId,StartsAt,EndsAt,Status)
 VALUES(@RequestId,@FacilityId,@StartsAt,@EndsAt,'HELD');
 DECLARE @id BIGINT=SCOPE_IDENTITY();
 COMMIT; SELECT @id AS ReservationId;
 END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK; THROW; END CATCH
END;
GO
-- Trigger dự phòng bảo vệ ghi trực tiếp lên reservation (ứng dụng vẫn phải dùng procedure).
CREATE OR ALTER TRIGGER dbo.trg_FacilityReservation_Overlap ON dbo.FacilityReservations AFTER INSERT,UPDATE AS
BEGIN
 SET NOCOUNT ON;
 IF EXISTS(SELECT 1 FROM inserted i JOIN dbo.FacilityReservations r
   ON r.FacilityId=i.FacilityId AND r.ReservationId<>i.ReservationId
   AND r.Status IN('HELD','CONFIRMED') AND i.Status IN('HELD','CONFIRMED')
   AND r.StartsAt<i.EndsAt AND r.EndsAt>i.StartsAt)
  THROW 51105,N'Lịch địa điểm bị trùng.',1;
END;
GO
-- Trigger bổ sung dấu vết khi trạng thái thay đổi, không thay thế phân quyền trong procedure.
-- SQL login ứng dụng nên chỉ có EXECUTE trên stored procedures nghiệp vụ, KHÔNG có UPDATE trực tiếp Events.
CREATE OR ALTER TRIGGER dbo.trg_Events_StateAudit ON dbo.Events AFTER UPDATE AS
BEGIN
 SET NOCOUNT ON;
 INSERT dbo.AuditLogs(ActorId,EntityName,EntityId,ActionCode,Details)
 SELECT NULL,'Events',CONVERT(NVARCHAR(80),i.EventId),'STATE_CHANGE',CONCAT(d.StateCode,' -> ',i.StateCode)
 FROM inserted i JOIN deleted d ON d.EventId=i.EventId WHERE i.StateCode<>d.StateCode;
END;
GO
CREATE OR ALTER VIEW dbo.v_UserPermissions AS
 SELECT DISTINCT u.UserId,u.Username,r.Code AS RoleCode,p.Code AS PermissionCode
 FROM dbo.Users u JOIN dbo.UserRoles ur ON ur.UserId=u.UserId
 JOIN dbo.Roles r ON r.RoleId=ur.RoleId JOIN dbo.RolePermissions rp ON rp.RoleId=r.RoleId
 JOIN dbo.Permissions p ON p.PermissionId=rp.PermissionId WHERE u.IsActive=1;
GO
CREATE OR ALTER VIEW dbo.v_EventOverview AS
 SELECT e.EventId,e.TicketCode,e.Title,e.StateCode,s.StateName,d.Name AS DepartmentName,
 e.StartsAt,e.EndsAt,e.CreatedAt,u.DisplayName AS CreatedByName,
 COALESCE((SELECT SUM(b.EstimatedAmount) FROM dbo.BudgetItems b WHERE b.EventId=e.EventId),0) AS EstimatedBudget
 FROM dbo.Events e JOIN dbo.WorkflowStates s ON s.StateCode=e.StateCode
 JOIN dbo.Departments d ON d.DepartmentId=e.OrganizerDepartmentId JOIN dbo.Users u ON u.UserId=e.CreatedBy;
GO
CREATE OR ALTER VIEW dbo.v_RoleMenuPermissions AS
 SELECT DISTINCT r.Code AS RoleCode,p.Code AS PermissionCode FROM dbo.Roles r
 JOIN dbo.RolePermissions rp ON rp.RoleId=r.RoleId JOIN dbo.Permissions p ON p.PermissionId=rp.PermissionId;
GO