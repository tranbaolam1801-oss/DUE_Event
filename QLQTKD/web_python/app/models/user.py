from flask_login import UserMixin

class User(UserMixin):
    def __init__(self, user_id, username, display_name, department_id=None, department_name=None, is_active=True, roles=None, permissions=None):
        self.id = user_id
        self.username = username
        self.display_name = display_name
        self.department_id = department_id
        self.department_name = department_name
        self._is_active = bool(is_active)
        self.roles = roles or []
        self.permissions = set(permissions or [])

    @property
    def is_active(self):
        return self._is_active

    def get_id(self):
        return str(self.id)

    def has_role(self, *role_codes):
        """Kiểm tra người dùng có thuộc một trong các role_codes chỉ định hay không"""
        if 'SYSTEM_ADMIN' in self.roles:
            return True
        return any(code in self.roles for code in role_codes)

    def has_permission(self, permission_code):
        """Kiểm tra người dùng có quyền permission_code trong CSDL hay không"""
        if 'SYSTEM_ADMIN' in self.roles:
            return True
        if permission_code in self.permissions:
            return True
        # Aliases fallback an toàn cho phân hệ Cơ sở vật chất
        if permission_code in ('facilities.assign', 'facilities.approve', 'facilities.handover', 'facilities.manage') and 'facilities.review' in self.permissions:
            return True
        if permission_code in ('facilities.view', 'facilities.schedule.view') and ('facilities.request' in self.permissions or 'facilities.review' in self.permissions or 'events.view' in self.permissions):
            return True
        return False

    @property
    def primary_role(self):
        """Trả về mã vai trò chính của người dùng"""
        if self.roles:
            return self.roles[0]
        return 'GUEST'

    @property
    def role_title(self):
        """Tên tiếng Việt chuẩn mực của vai trò theo quy định BPMN và CSDL DUE"""
        role_map = {
            'BCH_LIEN_CHI_DOAN': 'BCH Liên Chi Đoàn',
            'BAN_CHU_NHIEM_KHOA': 'Ban Chủ nhiệm Khoa',
            'DOAN_TRUONG': 'Đoàn Trường',
            'PHONG_CSVC': 'Phòng Cơ sở vật chất',
            'PHONG_KHTC': 'Phòng Kế hoạch Tài chính',
            'APPROVAL_AUTHORITY': 'Cấp có thẩm quyền phê duyệt',
            'SYSTEM_ADMIN': 'Quản trị hệ thống'
        }
        for r in self.roles:
            if r in role_map:
                return role_map[r]
        return 'Người dùng'

    def get_landing_endpoint(self):
        """
        Xác định trang nghiệp vụ mở đầu trực tiếp theo từng vai trò:
        - BCH Liên Chi Đoàn -> Hồ sơ sự kiện của tôi ('events.index')
        - Ban Chủ nhiệm Khoa -> Hồ sơ chờ xét duyệt ('approvals.faculty_list')
        - Đoàn Trường -> Hồ sơ chờ phê duyệt cấp trường ('approvals.union_list')
        - Phòng Cơ sở vật chất -> Yêu cầu CSVC cần xử lý ('facilities.index')
        - Phòng Kế hoạch Tài chính / Cấp thẩm quyền -> Hồ sơ thanh toán chờ kiểm tra ('payments.index')
        - Quản trị viên -> Quản lý tài khoản và phân quyền ('admin.users')
        """
        if 'BAN_CHU_NHIEM_KHOA' in self.roles:
            return 'approvals.faculty_list'
        elif 'DOAN_TRUONG' in self.roles:
            return 'approvals.union_list'
        elif 'PHONG_CSVC' in self.roles:
            return 'facilities.index'
        elif 'PHONG_KHTC' in self.roles:
            return 'payments.index'
        elif 'APPROVAL_AUTHORITY' in self.roles and 'SYSTEM_ADMIN' not in self.roles:
            return 'payments.index'
        elif 'SYSTEM_ADMIN' in self.roles:
            return 'admin.users'
        elif 'BCH_LIEN_CHI_DOAN' in self.roles:
            return 'events.index'
        return 'events.index'
