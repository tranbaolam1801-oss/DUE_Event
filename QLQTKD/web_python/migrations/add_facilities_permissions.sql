-- =========================================================================================
-- MIGRATION: BỔ SUNG PERMISSIONS CHO PHÂN HỆ CƠ SỞ VẬT CHẤT (MY DUE - SQL SERVER)
-- =========================================================================================

-- 1. Bổ sung các Permission mới vào bảng dbo.Permissions (nếu chưa tồn tại)
IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Code = 'facilities.view')
    INSERT INTO dbo.Permissions (Code, Description) VALUES ('facilities.view', N'Xem thông tin cơ sở vật chất');

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Code = 'facilities.schedule.view')
    INSERT INTO dbo.Permissions (Code, Description) VALUES ('facilities.schedule.view', N'Xem lịch sử dụng giảng đường và hội trường');

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Code = 'facilities.assign')
    INSERT INTO dbo.Permissions (Code, Description) VALUES ('facilities.assign', N'Bố trí giảng đường, hội trường và thiết bị');

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Code = 'facilities.approve')
    INSERT INTO dbo.Permissions (Code, Description) VALUES ('facilities.approve', N'Phê duyệt cấp cơ sở vật chất');

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Code = 'facilities.handover')
    INSERT INTO dbo.Permissions (Code, Description) VALUES ('facilities.handover', N'Lập biên bản bàn giao CSVC trước sự kiện');

IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE Code = 'facilities.manage')
    INSERT INTO dbo.Permissions (Code, Description) VALUES ('facilities.manage', N'Quản trị danh mục phòng và thiết bị CSVC');

-- 2. Gán quyền cho vai trò BCH Liên Chi Đoàn (RoleId = 1)
-- BCH chỉ được: facilities.request, facilities.view, facilities.schedule.view (KHÔNG có facilities.assign)
DECLARE @RoleBCH INT = (SELECT RoleId FROM dbo.Roles WHERE Code = 'BCH_LIEN_CHI_DOAN');

IF @RoleBCH IS NOT NULL
BEGIN
    INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
    SELECT @RoleBCH, PermissionId FROM dbo.Permissions 
    WHERE Code IN ('facilities.view', 'facilities.schedule.view')
      AND PermissionId NOT IN (SELECT PermissionId FROM dbo.RolePermissions WHERE RoleId = @RoleBCH);
END

-- 3. Gán quyền cho vai trò Phòng Cơ sở vật chất (RoleId = 4)
-- CSVC được: facilities.view, facilities.schedule.view, facilities.assign, facilities.approve, facilities.handover, facilities.manage
DECLARE @RoleCSVC INT = (SELECT RoleId FROM dbo.Roles WHERE Code = 'PHONG_CSVC');

IF @RoleCSVC IS NOT NULL
BEGIN
    INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
    SELECT @RoleCSVC, PermissionId FROM dbo.Permissions 
    WHERE Code IN ('facilities.view', 'facilities.schedule.view', 'facilities.assign', 'facilities.approve', 'facilities.handover', 'facilities.manage')
      AND PermissionId NOT IN (SELECT PermissionId FROM dbo.RolePermissions WHERE RoleId = @RoleCSVC);
END

-- 4. Gán quyền cho vai trò Quản trị hệ thống (RoleId = 7)
DECLARE @RoleAdmin INT = (SELECT RoleId FROM dbo.Roles WHERE Code = 'SYSTEM_ADMIN');

IF @RoleAdmin IS NOT NULL
BEGIN
    INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
    SELECT @RoleAdmin, PermissionId FROM dbo.Permissions 
    WHERE Code IN ('facilities.view', 'facilities.schedule.view', 'facilities.assign', 'facilities.approve', 'facilities.handover', 'facilities.manage')
      AND PermissionId NOT IN (SELECT PermissionId FROM dbo.RolePermissions WHERE RoleId = @RoleAdmin);
END
