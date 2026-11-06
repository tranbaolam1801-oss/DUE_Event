import pytest
from app import create_app
from app.config import Config

@pytest.fixture
def app():
    app = create_app(Config)
    app.config.update({
        "TESTING": True,
        "WTF_CSRF_ENABLED": False,
    })
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

def test_faculty_inbox_access_denied_for_btc(client):
    """BCH Liên Chi Đoàn không có quyền truy cập hòm thư thẩm định Khoa (403 Forbidden)"""
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    response = client.get('/approvals/faculty')
    assert response.status_code == 403

def test_faculty_inbox_access_allowed_for_bcn(client):
    """Ban Chủ nhiệm Khoa truy cập thành công hòm thư Khoa (200 OK)"""
    client.post('/login', data={'username': 'bcnkhoa@eventflow.vn', 'password': '123456'})
    response = client.get('/approvals/faculty')
    assert response.status_code == 200
    html = response.data.decode('utf-8')
    assert "Hồ sơ chờ xét duyệt" in html

def test_union_inbox_access_denied_for_faculty(client):
    """Khoa không có quyền truy cập hòm thư Đoàn Trường (403 Forbidden)"""
    client.post('/login', data={'username': 'bcnkhoa@eventflow.vn', 'password': '123456'})
    response = client.get('/approvals/union')
    assert response.status_code == 403

def test_union_inbox_access_allowed_for_doan(client):
    """Đoàn Trường truy cập thành công hòm thư Đoàn Trường (200 OK)"""
    client.post('/login', data={'username': 'doantruong@eventflow.vn', 'password': '123456'})
    response = client.get('/approvals/union')
    assert response.status_code == 200
    html = response.data.decode('utf-8')
    assert "Hồ sơ chờ phê duyệt cấp trường" in html
