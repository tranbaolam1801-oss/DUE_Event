from app.database import execute_query, execute_non_query, get_db_cursor

def get_report_by_event(event_id):
    """Lấy báo cáo tổng kết sự kiện"""
    sql = """
        SELECT r.ReportId, r.EventId, r.Content, r.IsRequired, r.IsConfirmed,
               r.SubmittedAt, r.ConfirmedBy,
               e.Title AS EventTitle, e.TicketCode,
               u.DisplayName AS ConfirmedByName
        FROM dbo.EventReports r
        JOIN dbo.Events e ON e.EventId = r.EventId
        LEFT JOIN dbo.Users u ON u.UserId = r.ConfirmedBy
        WHERE r.EventId = ?
    """
    return execute_query(sql, (event_id,), fetchone=True)

def save_report(event_id, content, is_required=True):
    """Lưu hoặc cập nhật báo cáo tổng kết sự kiện"""
    with get_db_cursor(commit=True) as cur:
        cur.execute("SELECT ReportId FROM dbo.EventReports WHERE EventId = ?", (event_id,))
        row = cur.fetchone()
        if row:
            cur.execute("""
                UPDATE dbo.EventReports
                SET Content = ?, IsRequired = ?, SubmittedAt = SYSUTCDATETIME()
                WHERE EventId = ?
            """, (content, is_required, event_id))
            return row[0]
        else:
            cur.execute("""
                INSERT INTO dbo.EventReports(EventId, Content, IsRequired, SubmittedAt)
                VALUES(?, ?, ?, SYSUTCDATETIME());
                SELECT SCOPE_IDENTITY();
            """, (event_id, content, is_required))
            return cur.fetchone()[0]

def confirm_report(event_id, confirmed_by):
    """Đoàn Trường xác nhận và lưu trữ báo cáo tổng kết"""
    sql = """
        UPDATE dbo.EventReports
        SET IsConfirmed = 1, ConfirmedBy = ?
        WHERE EventId = ?
    """
    return execute_non_query(sql, (confirmed_by, event_id))

def get_all_reports():
    """Lấy danh sách tất cả báo cáo tổng kết đã nộp cho Đoàn Trường rà soát"""
    sql = """
        SELECT r.ReportId, r.EventId, r.IsRequired, r.IsConfirmed, r.SubmittedAt,
               e.TicketCode, e.Title AS EventTitle, d.Name AS DepartmentName,
               u.DisplayName AS ConfirmedByName
        FROM dbo.EventReports r
        JOIN dbo.Events e ON e.EventId = r.EventId
        JOIN dbo.Departments d ON d.DepartmentId = e.OrganizerDepartmentId
        LEFT JOIN dbo.Users u ON u.UserId = r.ConfirmedBy
        ORDER BY r.SubmittedAt DESC
    """
    return execute_query(sql)
