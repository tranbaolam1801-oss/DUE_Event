from functools import wraps
from flask import abort, flash, redirect, url_for, request
from flask_login import current_user

def role_required(*role_codes):
    """Decorator yêu cầu người dùng phải có ít nhất một trong các vai trò chỉ định"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for('auth.login', next=request.url))
            if not current_user.has_role(*role_codes):
                flash('Bạn không có quyền truy cập vào phân hệ này.', 'danger')
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def permission_required(permission_code):
    """Decorator kiểm tra quyền cụ thể theo bảng Permissions trong SQL Server"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for('auth.login', next=request.url))
            if not current_user.has_permission(permission_code):
                flash(f'Tài khoản của bạn thiếu quyền: {permission_code}', 'danger')
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator
