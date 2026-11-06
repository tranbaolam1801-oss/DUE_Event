import pyodbc
from contextlib import contextmanager
from app.config import Config

def get_db_connection():
    """Tạo kết nối tới Microsoft SQL Server theo cấu hình .env"""
    conn_str = Config.get_pyodbc_connection_string()
    conn = pyodbc.connect(conn_str, autocommit=False)
    return conn

@contextmanager
def get_db_cursor(commit=False):
    """Context manager hỗ trợ cursor và quản lý transaction tự động an toàn"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        if commit:
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def execute_query(sql, params=None, fetchone=False, as_dict=True):
    """Thực thi câu truy vấn SELECT và trả về kết quả dạng dict hoặc tuple"""
    with get_db_cursor(commit=False) as cursor:
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        
        if not cursor.description:
            return None
        
        columns = [column[0] for column in cursor.description]
        
        if fetchone:
            row = cursor.fetchone()
            if not row:
                return None
            return dict(zip(columns, row)) if as_dict else row
        else:
            rows = cursor.fetchall()
            if as_dict:
                return [dict(zip(columns, r)) for r in rows]
            return rows

def execute_non_query(sql, params=None):
    """Thực thi câu lệnh INSERT, UPDATE, DELETE có transaction commit"""
    with get_db_cursor(commit=True) as cursor:
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        return cursor.rowcount

def test_connection():
    """Kiểm tra kết nối tới cơ sở dữ liệu MY_DUE_QLSK"""
    try:
        with get_db_cursor(commit=False) as cursor:
            cursor.execute("SELECT @@SERVERNAME, DB_NAME(), COUNT(*) FROM sys.tables WHERE schema_id=SCHEMA_ID('dbo')")
            row = cursor.fetchone()
            return {
                "success": True,
                "server": row[0],
                "database": row[1],
                "table_count": row[2]
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
