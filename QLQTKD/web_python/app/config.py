import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'my-due-qlsk-default-secure-key-2026')
    
    # SQL Server Settings
    DB_SERVER = os.getenv('DB_SERVER', '.')
    DB_NAME = os.getenv('DB_NAME', 'MY_DUE_QLSK')
    DB_DRIVER = os.getenv('DB_DRIVER', 'ODBC Driver 18 for SQL Server')
    DB_TRUSTED_CONNECTION = os.getenv('DB_TRUSTED_CONNECTION', 'yes')
    DB_TRUST_SERVER_CERTIFICATE = os.getenv('DB_TRUST_SERVER_CERTIFICATE', 'yes')
    DB_USER = os.getenv('DB_USER', '')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    
    # SQLAlchemy & Session
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 86400  # 1 day

    @classmethod
    def get_pyodbc_connection_string(cls):
        extra = ';TrustServerCertificate=yes' if '18' in cls.DB_DRIVER or cls.DB_TRUST_SERVER_CERTIFICATE == 'yes' else ''
        if cls.DB_TRUSTED_CONNECTION.lower() in ('yes', 'true', '1'):
            return f"DRIVER={{{cls.DB_DRIVER}}};SERVER={cls.DB_SERVER};DATABASE={cls.DB_NAME};Trusted_Connection=yes{extra}"
        else:
            return f"DRIVER={{{cls.DB_DRIVER}}};SERVER={cls.DB_SERVER};DATABASE={cls.DB_NAME};UID={cls.DB_USER};PWD={cls.DB_PASSWORD}{extra}"

    @classmethod
    def get_sqlalchemy_uri(cls):
        conn_str = cls.get_pyodbc_connection_string()
        from urllib.parse import quote_plus
        params = quote_plus(conn_str)
        return f"mssql+pyodbc:///?odbc_connect={params}"
