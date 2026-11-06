import os
import sys
from app import create_app
from app.database import test_connection

# Reconfigure stdout to UTF-8 on Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print("=" * 60)
    print("HỆ THỐNG TIẾP NHẬN, XÉT DUYỆT VÀ CẤP PHÉP TỔ CHỨC SỰ KIỆN")
    print("Trường Đại học Kinh tế – Đại học Đà Nẵng")
    print("=" * 60)
    
    # Kiểm tra kết nối SQL Server
    db_status = test_connection()
    if db_status['success']:
        print(f"[OK] Đã kết nối thành công tới Database: {db_status['database']} trên Server: {db_status['server']}")
        print(f"[OK] Số lượng bảng CSDL phát hiện: {db_status['table_count']}")
    else:
        print(f"[CẢNH BÁO] Không thể kết nối SQL Server: {db_status.get('error')}")
        print("Vui lòng kiểm tra lại cấu hình .env (DB_SERVER, DB_NAME, DB_DRIVER).")
        
    print(f"[*] Website đang chạy tại: http://127.0.0.1:{port}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=True)
