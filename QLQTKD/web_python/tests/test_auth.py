import pytest
from app import create_app
from app.config import Config

@pytest.fixture
def app():
    app = create_app(Config)
    app.config.update({
        "TESTING": True,
        "WTF_CSRF_ENABLED": False,  # Cho phép test POST mà không cần token
    })
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

def test_login_page_renders(client):
    """Kiểm tra trang đăng nhập tải thành công với bố cục 2 cột và nhận diện DUE"""
    response = client.get('/login')
    assert response.status_code == 200
    html = response.data.decode('utf-8')
    assert "MY DUE" in html
    assert "Trường Đại học Kinh tế" in html
    assert "Hệ thống quản lý quy trình tổ chức sự kiện" in html
    assert 'id="username"' in html
    assert 'id="password"' in html
    assert 'id="togglePassword"' in html

def test_login_failure_wrong_password(client):
    """Kiểm tra đăng nhập sai mật khẩu báo lỗi rõ ràng"""
    response = client.post('/login', data={
        'username': 'btc1@eventflow.vn',
        'password': 'wrongpassword123'
    }, follow_redirects=True)
    html = response.data.decode('utf-8')
    assert "Mật khẩu không chính xác" in html or "Tài khoản không tồn tại" in html

def test_login_success(client):
    """Kiểm tra đăng nhập thành công: BCH Liên Chi Đoàn mở thẳng trang Hồ sơ sự kiện"""
    response = client.post('/login', data={
        'username': 'btc1@eventflow.vn',
        'password': '123456'
    }, follow_redirects=True)
    assert response.status_code == 200
    html = response.data.decode('utf-8')
    assert "Hồ sơ sự kiện" in html
    assert "BCH Liên Chi Đoàn" in html

def test_logout(client):
    """Kiểm tra đăng xuất"""
    # Đăng nhập trước
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    # Đăng xuất
    response = client.get('/logout', follow_redirects=True)
    assert response.status_code == 200
    html = response.data.decode('utf-8')
    assert "đăng xuất khỏi hệ thống" in html or "MY DUE" in html


def test_role_smart_direct_landing_routes(client):
    """
    Kiểm tra điều hướng trực tiếp theo vai trò (Role-Smart Landing) không qua Bàn làm việc chung:
    1. BCN Khoa -> /approvals/faculty
    2. Đoàn Trường -> /approvals/union
    3. CSVC -> /facilities
    4. KHTC -> /payments
    5. Admin -> /admin/users
    """
    roles_test = [
        ('bcnkhoa@eventflow.vn', '/approvals/faculty', 'Hồ sơ chờ xét duyệt'),
        ('doantruong@eventflow.vn', '/approvals/union', 'Hồ sơ chờ phê duyệt'),
        ('csvc@eventflow.vn', '/facilities', 'Cơ sở vật chất'),
        ('khtc@eventflow.vn', '/payments', 'Hồ sơ thanh toán chờ kiểm tra'),
        ('admin@eventflow.vn', '/admin/users', 'Quản lý tài khoản'),
    ]
    for email, target_path, expected_text in roles_test:
        client.get('/logout')
        res = client.post('/login', data={'username': email, 'password': '123456'}, follow_redirects=True)
        assert res.status_code == 200
        html = res.data.decode('utf-8')
        assert expected_text in html, f"Tài khoản {email} không hiển thị '{expected_text}' tại {target_path}"
