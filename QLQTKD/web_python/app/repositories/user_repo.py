import bcrypt
from app.database import execute_query, execute_non_query
from app.models.user import User

def verify_password(stored_hash, password):
    """Kiểm tra mật khẩu khớp với chuỗi bcrypt hash trong SQL Server"""
    if not stored_hash or not password:
        return False
    try:
        if stored_hash.startswith("$2"):
            return bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        elif stored_hash == password:
            return True
        return False
    except Exception:
        return False

def hash_password(password):
    """Băm mật khẩu sử dụng bcrypt chuẩn 10 vòng lặp"""
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def get_user_by_id(user_id):
    """Tải thông tin User, phòng ban, danh sách vai trò và danh sách quyền từ SQL Server"""
    sql_user = """
        SELECT u.UserId, u.Username, u.DisplayName, u.DepartmentId, d.Name AS DepartmentName, u.IsActive
        FROM dbo.Users u
        LEFT JOIN dbo.Departments d ON d.DepartmentId = u.DepartmentId
        WHERE u.UserId = ?
    """
    row = execute_query(sql_user, (user_id,), fetchone=True)
    if not row:
        return None

    # Lấy roles
    sql_roles = """
        SELECT r.Code
        FROM dbo.UserRoles ur
        JOIN dbo.Roles r ON r.RoleId = ur.RoleId
        WHERE ur.UserId = ?
    """
    roles_rows = execute_query(sql_roles, (user_id,))
    roles = [r['Code'] for r in roles_rows]

    # Lấy permissions từ View v_UserPermissions
    sql_perms = """
        SELECT PermissionCode
        FROM dbo.v_UserPermissions
        WHERE UserId = ?
    """
    perms_rows = execute_query(sql_perms, (user_id,))
    permissions = [p['PermissionCode'] for p in perms_rows]

    return User(
        user_id=row['UserId'],
        username=row['Username'],
        display_name=row['DisplayName'],
        department_id=row['DepartmentId'],
        department_name=row['DepartmentName'],
        is_active=row['IsActive'],
        roles=roles,
        permissions=permissions
    )

def get_user_by_username(username):
    """Tìm thông tin tài khoản người dùng theo email/username cùng mật khẩu để xác thực"""
    sql = """
        SELECT u.UserId, u.Username, u.PasswordHash, u.DisplayName, u.DepartmentId, d.Name AS DepartmentName, u.IsActive
        FROM dbo.Users u
        LEFT JOIN dbo.Departments d ON d.DepartmentId = u.DepartmentId
        WHERE u.Username = ?
    """
    return execute_query(sql, (username.strip(),), fetchone=True)

def get_all_accounts():
    """Lấy danh sách tất cả tài khoản trong hệ thống phục vụ Admin & phân quyền"""
    sql = """
        SELECT u.UserId, u.Username, u.DisplayName, u.IsActive, 
               STRING_AGG(r.Code, ', ') AS RoleCodes,
               STRING_AGG(r.Name, ', ') AS RoleNames,
               d.Name AS DepartmentName
        FROM dbo.Users u
        LEFT JOIN dbo.UserRoles ur ON u.UserId = ur.UserId
        LEFT JOIN dbo.Roles r ON r.RoleId = ur.RoleId
        LEFT JOIN dbo.Departments d ON d.DepartmentId = u.DepartmentId
        GROUP BY u.UserId, u.Username, u.DisplayName, u.IsActive, d.Name
        ORDER BY u.UserId ASC
    """
    return execute_query(sql)

def update_user_password(user_id, plain_password):
    """Cập nhật mật khẩu băm mới cho tài khoản"""
    new_hash = hash_password(plain_password)
    sql = "UPDATE dbo.Users SET PasswordHash = ?, UpdatedAt = SYSUTCDATETIME() WHERE UserId = ?"
    return execute_non_query(sql, (new_hash, user_id))

def get_recent_notifications(user_id, limit=5):
    """Lấy danh sách thông báo mới nhất của người dùng"""
    sql = """
        SELECT TOP (?) NotificationId, Title, Body, IsRead, CreatedAt, EventId
        FROM dbo.Notifications
        WHERE RecipientUserId = ?
        ORDER BY CreatedAt DESC
    """
    return execute_query(sql, (limit, user_id))
