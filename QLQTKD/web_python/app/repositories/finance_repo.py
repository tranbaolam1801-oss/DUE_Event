from app.database import execute_query, execute_non_query, get_db_cursor

def get_payment_request_by_event(event_id):
    """Lấy yêu cầu thanh toán gắn với sự kiện"""
    sql = """
        SELECT pr.PaymentRequestId, pr.EventId, pr.Amount, pr.Status, pr.SubmittedBy,
               pr.ApprovedBy, pr.ApprovedAt, pr.PaidAt,
               u.DisplayName AS SubmittedByName,
               appr.DisplayName AS ApprovedByName,
               e.Title AS EventTitle, e.TicketCode
        FROM dbo.PaymentRequests pr
        JOIN dbo.Events e ON e.EventId = pr.EventId
        JOIN dbo.Users u ON u.UserId = pr.SubmittedBy
        LEFT JOIN dbo.Users appr ON appr.UserId = pr.ApprovedBy
        WHERE pr.EventId = ?
    """
    return execute_query(sql, (event_id,), fetchone=True)

def get_all_payment_requests():
    """Lấy danh sách toàn bộ hồ sơ thanh quyết toán cho KHTC và Cấp thẩm quyền duyệt"""
    sql = """
        SELECT pr.PaymentRequestId, pr.EventId, pr.Amount, pr.Status,
               e.TicketCode, e.Title AS EventTitle, d.Name AS DepartmentName,
               u.DisplayName AS SubmittedByName, pr.ApprovedAt, pr.PaidAt
        FROM dbo.PaymentRequests pr
        JOIN dbo.Events e ON e.EventId = pr.EventId
        JOIN dbo.Departments d ON d.DepartmentId = e.OrganizerDepartmentId
        JOIN dbo.Users u ON u.UserId = pr.SubmittedBy
        ORDER BY pr.PaymentRequestId DESC
    """
    return execute_query(sql)

def create_or_update_payment_request(event_id, amount, submitted_by):
    """Lập hoặc cập nhật tờ trình quyết toán kinh phí"""
    with get_db_cursor(commit=True) as cur:
        cur.execute("SELECT PaymentRequestId FROM dbo.PaymentRequests WHERE EventId = ?", (event_id,))
        row = cur.fetchone()
        if row:
            pr_id = row[0]
            cur.execute("""
                UPDATE dbo.PaymentRequests
                SET Amount = ?, Status = 'SUBMITTED', SubmittedBy = ?
                WHERE PaymentRequestId = ?
            """, (amount, submitted_by, pr_id))
            return pr_id
        else:
            cur.execute("""
                INSERT INTO dbo.PaymentRequests(EventId, Amount, Status, SubmittedBy)
                VALUES(?, ?, 'SUBMITTED', ?);
                SELECT SCOPE_IDENTITY();
            """, (event_id, amount, submitted_by))
            return cur.fetchone()[0]

def get_payment_decisions(payment_request_id):
    """Lấy lịch sử các quyết định phê duyệt / từ chối chi thanh toán"""
    sql = """
        SELECT pd.DecisionId, pd.PaymentRequestId, pd.DecisionBy, pd.DecisionCode, pd.Reason, pd.DecidedAt,
               u.DisplayName AS DecidedByName
        FROM dbo.PaymentDecisions pd
        JOIN dbo.Users u ON u.UserId = pd.DecisionBy
        WHERE pd.PaymentRequestId = ?
        ORDER BY pd.DecidedAt DESC
    """
    return execute_query(sql, (payment_request_id,))

def record_payment_decision(payment_request_id, decision_by, decision_code, reason=None):
    """Ghi nhận quyết định phê duyệt (APPROVED) hoặc không chấp thuận (REJECTED)"""
    with get_db_cursor(commit=True) as cur:
        cur.execute("""
            INSERT INTO dbo.PaymentDecisions(PaymentRequestId, DecisionBy, DecisionCode, Reason)
            VALUES(?, ?, ?, ?)
        """, (payment_request_id, decision_by, decision_code, reason))
        
        new_status = 'APPROVED' if decision_code == 'APPROVED' else 'REJECTED'
        cur.execute("""
            UPDATE dbo.PaymentRequests
            SET Status = ?, ApprovedBy = ?, ApprovedAt = SYSUTCDATETIME()
            WHERE PaymentRequestId = ?
        """, (new_status, decision_by, payment_request_id))

def record_paid(payment_request_id):
    """KHTC ghi nhận đã thực hiện giải ngân thanh toán xong"""
    sql = """
        UPDATE dbo.PaymentRequests 
        SET Status = 'RECORDED_PAID', PaidAt = SYSUTCDATETIME() 
        WHERE PaymentRequestId = ?
    """
    return execute_non_query(sql, (payment_request_id,))
