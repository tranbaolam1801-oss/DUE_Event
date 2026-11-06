from app.database import execute_query, execute_non_query, get_db_cursor

def list_events_for_user(user, search_query=None, state_filter=None, dept_filter=None):
    """
    Lấy danh sách sự kiện phù hợp với quyền hạn của vai trò người dùng (BPMN / RBAC)
    - BCH: xem hồ sơ của khoa mình hoặc do mình tạo
    - Khoa: xem hồ sơ thuộc khoa mình quản lý
    - Đoàn Trường: xem toàn bộ hồ sơ đang ở cấp đoàn hoặc toàn trường
    - CSVC / KHTC / Admin: xem toàn bộ hồ sơ sự kiện
    """
    params = []
    where_clauses = ["1=1"]
    
    if search_query:
        where_clauses.append("(o.Title LIKE ? OR o.TicketCode LIKE ? OR o.DepartmentName LIKE ? OR o.CreatedByName LIKE ?)")
        search_param = f"%{search_query.strip()}%"
        params.extend([search_param, search_param, search_param, search_param])
        
    if state_filter and state_filter != 'ALL':
        if isinstance(state_filter, (list, tuple, set)):
            placeholders = ','.join(['?'] * len(state_filter))
            where_clauses.append(f"o.StateCode IN ({placeholders})")
            params.extend(list(state_filter))
        else:
            where_clauses.append("o.StateCode = ?")
            params.append(state_filter)

    if dept_filter and dept_filter != 'ALL':
        where_clauses.append("e.OrganizerDepartmentId = ?")
        params.append(int(dept_filter))
        
    # Phân quyền dữ liệu theo vai trò
    if user.has_role('BCH_LIEN_CHI_DOAN'):
        where_clauses.append("(e.CreatedBy = ? OR e.OrganizerDepartmentId = ?)")
        params.extend([user.id, user.department_id or 1])
    elif user.has_role('BAN_CHU_NHIEM_KHOA'):
        where_clauses.append("e.OrganizerDepartmentId = ?")
        params.append(user.department_id or 2)
        
    sql = f"""
        SELECT o.EventId, o.TicketCode, o.Title, o.StateCode, o.StateName, 
               o.DepartmentName, e.OrganizerDepartmentId, o.StartsAt, o.EndsAt, o.CreatedAt, o.CreatedByName, 
               e.CreatedBy, o.EstimatedBudget, e.ExpectedAttendees
        FROM dbo.v_EventOverview o
        JOIN dbo.Events e ON e.EventId = o.EventId
        WHERE {' AND '.join(where_clauses)}
        ORDER BY o.CreatedAt DESC
    """
    return execute_query(sql, tuple(params))

def get_event_detail(event_id):
    """Lấy thông tin chi tiết một sự kiện bao gồm kế hoạch và người phụ trách"""
    sql = """
        SELECT e.EventId, e.TicketCode, e.Title, e.Description, e.OrganizerDepartmentId,
               d.Name AS DepartmentName, e.CreatedBy, u.DisplayName AS CreatedByName, u.Username AS CreatedByEmail,
               e.StartsAt, e.EndsAt, e.ExpectedAttendees, e.StateCode, s.StateName, s.IsTerminal,
               e.CreatedAt, e.UpdatedAt,
               p.Objectives, p.ProgramContent, p.Timeline, p.Staffing, p.RiskPlan
        FROM dbo.Events e
        JOIN dbo.WorkflowStates s ON s.StateCode = e.StateCode
        JOIN dbo.Departments d ON d.DepartmentId = e.OrganizerDepartmentId
        JOIN dbo.Users u ON u.UserId = e.CreatedBy
        LEFT JOIN dbo.EventPlans p ON p.EventId = e.EventId
        WHERE e.EventId = ?
    """
    return execute_query(sql, (event_id,), fetchone=True)

def get_budget_items(event_id):
    """Lấy danh sách các khoản dự trù kinh phí của sự kiện"""
    sql = """
        SELECT BudgetItemId, ItemName, Quantity, UnitPrice, EstimatedAmount
        FROM dbo.BudgetItems
        WHERE EventId = ?
        ORDER BY BudgetItemId ASC
    """
    return execute_query(sql, (event_id,))

def get_workflow_history(event_id):
    """Lấy toàn bộ dòng thời gian xử lý và lịch sử luân chuyển hồ sơ theo BPMN"""
    sql = """
        SELECT h.HistoryId, h.FromState, sf.StateName AS FromStateName,
               h.ToState, st.StateName AS ToStateName,
               h.ActionCode, h.ActorId, u.DisplayName AS ActorName,
               h.Comment, h.PerformedAt
        FROM dbo.WorkflowHistory h
        JOIN dbo.WorkflowStates st ON st.StateCode = h.ToState
        LEFT JOIN dbo.WorkflowStates sf ON sf.StateCode = h.FromState
        JOIN dbo.Users u ON u.UserId = h.ActorId
        WHERE h.EventId = ?
        ORDER BY h.PerformedAt ASC
    """
    return execute_query(sql, (event_id,))

def get_available_transitions(event_id, user):
    """
    Xác định các nút hành động (Gateways / Transitions) mà người dùng hiện tại
    được phép thực hiện đối với hồ sơ này dựa trên WorkflowTransitions trong CSDL
    """
    sql = """
        SELECT t.ActionCode, t.ToState, st.StateName AS ToStateName, t.RequiredPermission
        FROM dbo.Events e
        JOIN dbo.WorkflowTransitions t ON t.FromState = e.StateCode
        JOIN dbo.WorkflowStates st ON st.StateCode = t.ToState
        WHERE e.EventId = ?
    """
    transitions = execute_query(sql, (event_id,))
    
    # Lọc theo quyền thực tế của User
    available = []
    for t in transitions:
        if user.has_permission(t['RequiredPermission']):
            available.append(t)
    return available

def create_event_draft_sp(actor_id, dept_id, title, starts_at=None, ends_at=None, objectives=None, description=None, attendees=None):
    """Gọi Stored Procedure usp_CreateEventDraft trong CSDL để tạo hồ sơ bản nháp"""
    with get_db_cursor(commit=True) as cur:
        # Gọi usp_CreateEventDraft
        sql = """
            DECLARE @NewId BIGINT;
            EXEC dbo.usp_CreateEventDraft 
                @ActorId = ?, 
                @DepartmentId = ?, 
                @Title = ?, 
                @StartsAt = ?, 
                @EndsAt = ?, 
                @Objectives = ?, 
                @NewEventId = @NewId OUTPUT;
            SELECT @NewId AS NewEventId;
        """
        cur.execute(sql, (actor_id, dept_id, title, starts_at, ends_at, objectives))
        row = cur.fetchone()
        new_event_id = row[0] if row else None
        
        # Cập nhật thêm mô tả và số lượng người nếu có
        if new_event_id:
            cur.execute("""
                UPDATE dbo.Events 
                SET Description = ?, ExpectedAttendees = ? 
                WHERE EventId = ?
            """, (description, attendees, new_event_id))
            
        return new_event_id

def update_event_plan(event_id, title, description, starts_at, ends_at, attendees, objectives, content, timeline, staffing, risk_plan):
    """Cập nhật thông tin chi tiết hồ sơ sự kiện và kế hoạch thực hiện"""
    with get_db_cursor(commit=True) as cur:
        cur.execute("""
            UPDATE dbo.Events
            SET Title = ?, Description = ?, StartsAt = ?, EndsAt = ?, ExpectedAttendees = ?, UpdatedAt = SYSUTCDATETIME()
            WHERE EventId = ?
        """, (title, description, starts_at, ends_at, attendees, event_id))
        
        # Upsert kế hoạch
        cur.execute("""
            IF EXISTS (SELECT 1 FROM dbo.EventPlans WHERE EventId = ?)
                UPDATE dbo.EventPlans 
                SET Objectives = ?, ProgramContent = ?, Timeline = ?, Staffing = ?, RiskPlan = ?, UpdatedAt = SYSUTCDATETIME()
                WHERE EventId = ?
            ELSE
                INSERT INTO dbo.EventPlans(EventId, Objectives, ProgramContent, Timeline, Staffing, RiskPlan)
                VALUES(?, ?, ?, ?, ?, ?)
        """, (event_id, objectives, content, timeline, staffing, risk_plan, event_id, event_id, objectives, content, timeline, staffing, risk_plan))

def save_budget_items(event_id, items):
    """Lưu danh sách dự trù kinh phí sự kiện (xóa cũ thêm mới trong cùng transaction)"""
    with get_db_cursor(commit=True) as cur:
        cur.execute("DELETE FROM dbo.BudgetItems WHERE EventId = ?", (event_id,))
        for item in items:
            name = item.get('name', '').strip()
            qty = float(item.get('qty', 1))
            price = float(item.get('price', 0))
            if name and qty > 0 and price >= 0:
                cur.execute("""
                    INSERT INTO dbo.BudgetItems(EventId, ItemName, Quantity, UnitPrice)
                    VALUES(?, ?, ?, ?)
                """, (event_id, name, qty, price))

def transition_event_sp(event_id, actor_id, action_code, comment=None):
    """
    Gọi Stored Procedure usp_TransitionEvent để chuyển trạng thái hồ sơ theo BPMN
    Bảo đảm quy tắc nghiệp vụ chặt chẽ, ghi nhận lịch sử và audit log tự động.
    """
    with get_db_cursor(commit=True) as cur:
        sql = "EXEC dbo.usp_TransitionEvent @EventId = ?, @ActorId = ?, @ActionCode = ?, @Comment = ?"
        cur.execute(sql, (event_id, actor_id, action_code, comment))
        row = cur.fetchone()
        if row:
            return {
                "event_id": row[0],
                "previous_state": row[1],
                "current_state": row[2]
            }
        return None

def get_event_status_counts():
    """Lấy số lượng sự kiện theo từng trạng thái quy trình từ View v_EventStatusCount"""
    sql = "SELECT StateCode, StateName, TotalEvents FROM dbo.v_EventStatusCount ORDER BY StateCode"
    return execute_query(sql)

def get_departments():
    """Lấy danh mục đơn vị / khoa"""
    sql = "SELECT DepartmentId, Code, Name FROM dbo.Departments WHERE IsActive = 1 ORDER BY DepartmentId"
    return execute_query(sql)

def get_event_documents(event_id):
    """Lấy danh sách tệp đính kèm của hồ sơ sự kiện từ bảng EventDocuments"""
    sql = """
        SELECT d.DocumentId, d.EventId, d.DocumentType, d.OriginalFileName, 
               d.StorageKey, d.MimeType, d.FileSizeBytes, d.UploadedBy, d.UploadedAt,
               u.DisplayName AS UploadedByName
        FROM dbo.EventDocuments d
        LEFT JOIN dbo.Users u ON u.UserId = d.UploadedBy
        WHERE d.EventId = ?
        ORDER BY d.UploadedAt DESC
    """
    return execute_query(sql, (event_id,))

def add_event_document(event_id, doc_type, original_name, storage_key, mime_type, file_size, uploaded_by):
    """Thêm mới tệp đính kèm vào hồ sơ sự kiện trong CSDL"""
    with get_db_cursor(commit=True) as cur:
        cur.execute("""
            INSERT INTO dbo.EventDocuments(EventId, DocumentType, OriginalFileName, StorageKey, MimeType, FileSizeBytes, UploadedBy, UploadedAt)
            VALUES(?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME());
            SELECT SCOPE_IDENTITY();
        """, (event_id, doc_type, original_name, storage_key, mime_type, file_size, uploaded_by))
        row = cur.fetchone()
        return row[0] if row else None

def delete_event_document(doc_id, event_id):
    """Xóa tệp đính kèm của hồ sơ sự kiện theo DocumentId và EventId"""
    return execute_non_query("DELETE FROM dbo.EventDocuments WHERE DocumentId = ? AND EventId = ?", (doc_id, event_id))

