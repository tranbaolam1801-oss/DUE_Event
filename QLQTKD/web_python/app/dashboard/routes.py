from flask import Blueprint, redirect, url_for
from flask_login import login_required, current_user

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
@dashboard_bp.route('/dashboard')
@login_required
def index():
    """
    Điều hướng trực tiếp tới trang nghiệp vụ mở đầu theo từng vai trò (Role-Smart Landing):
    - BCH Liên Chi Đoàn -> Hồ sơ sự kiện của tôi ('events.index')
    - Ban Chủ nhiệm Khoa -> Hồ sơ chờ xét duyệt ('approvals.faculty_list')
    - Đoàn Trường -> Hồ sơ chờ phê duyệt cấp trường ('approvals.union_list')
    - Phòng Cơ sở vật chất -> Yêu cầu CSVC cần xử lý ('facilities.index')
    - Phòng Kế hoạch Tài chính -> Hồ sơ thanh toán chờ kiểm tra ('payments.index')
    - Quản trị viên -> Quản lý tài khoản và phân quyền ('admin.users')
    """
    return redirect(url_for(current_user.get_landing_endpoint()))
