from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from app.auth.decorators import role_required
from app.repositories import user_repo
from app.database import execute_query

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/users')
@login_required
@role_required('SYSTEM_ADMIN')
def users():
    """Quản lý danh sách người dùng và phân quyền (Module J)"""
    accounts = user_repo.get_all_accounts()
    return render_template('admin/users.html', accounts=accounts)

@admin_bp.route('/admin/roles')
@login_required
@role_required('SYSTEM_ADMIN')
def roles():
    """Xem cấu trúc vai trò và ma trận quyền hạn (RBAC)"""
    sql_roles = "SELECT RoleId, Code, Name FROM dbo.Roles ORDER BY RoleId"
    roles_list = execute_query(sql_roles)
    
    sql_perms = "SELECT PermissionId, Code, Description FROM dbo.Permissions ORDER BY PermissionId"
    perms_list = execute_query(sql_perms)
    
    sql_rp = """
        SELECT r.Code AS RoleCode, p.Code AS PermissionCode
        FROM dbo.RolePermissions rp
        JOIN dbo.Roles r ON r.RoleId = rp.RoleId
        JOIN dbo.Permissions p ON p.PermissionId = rp.PermissionId
    """
    matrix = execute_query(sql_rp)
    rp_set = set((m['RoleCode'], m['PermissionCode']) for m in matrix)
    
    return render_template('admin/roles.html',
                           roles=roles_list,
                           permissions=perms_list,
                           rp_set=rp_set)

@admin_bp.route('/admin/audit-logs')
@login_required
@role_required('SYSTEM_ADMIN')
def audit_logs():
    """Nhật ký kiểm toán an ninh hệ thống (dbo.AuditLogs)"""
    sql = """
        SELECT TOP (100) a.AuditId, a.EntityName, a.EntityId, a.ActionCode, a.Details, a.AtUtc,
               u.DisplayName AS ActorName, u.Username AS ActorEmail
        FROM dbo.AuditLogs a
        LEFT JOIN dbo.Users u ON u.UserId = a.ActorId
        ORDER BY a.AtUtc DESC
    """
    logs = execute_query(sql)
    return render_template('admin/audit_logs.html', logs=logs)
