from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from app.auth.decorators import role_required, permission_required
from app.repositories import event_repo

approvals_bp = Blueprint('approvals', __name__)

@approvals_bp.route('/approvals/faculty')
@login_required
@role_required('BAN_CHU_NHIEM_KHOA', 'SYSTEM_ADMIN')
def faculty_list():
    """Hòm thư chờ thẩm định cấp Khoa (BPMN: ReviewKhoa)"""
    all_events = event_repo.list_events_for_user(current_user, state_filter='PENDING_FACULTY')
    return render_template('approvals/faculty_list.html', events=all_events)

@approvals_bp.route('/approvals/faculty/<int:event_id>')
@login_required
@role_required('BAN_CHU_NHIEM_KHOA', 'SYSTEM_ADMIN')
def faculty_review(event_id):
    """Màn hình thẩm định hồ sơ của Ban Chủ nhiệm Khoa (BPMN: ReviewKhoa -> GKhoa)"""
    event = event_repo.get_event_detail(event_id)
    if not event:
        flash('Hồ sơ không tồn tại.', 'danger')
        return redirect(url_for('approvals.faculty_list'))
        
    budget_items = event_repo.get_budget_items(event_id)
    total_budget = sum(float(b.get('EstimatedAmount', 0)) for b in budget_items)
    history = event_repo.get_workflow_history(event_id)
    
    return render_template('approvals/faculty_review.html',
                           event=event,
                           budget_items=budget_items,
                           total_budget=total_budget,
                           history=history)

@approvals_bp.route('/approvals/union')
@login_required
@role_required('DOAN_TRUONG', 'SYSTEM_ADMIN')
def union_list():
    """Hòm thư chờ thẩm định Đoàn Trường (BPMN: ReviewDoan)"""
    all_events = event_repo.list_events_for_user(current_user, state_filter='PENDING_UNION')
    return render_template('approvals/union_list.html', events=all_events)

@approvals_bp.route('/approvals/union/<int:event_id>')
@login_required
@role_required('DOAN_TRUONG', 'SYSTEM_ADMIN')
def union_review(event_id):
    """Màn hình thẩm định hồ sơ của Đoàn Trường (BPMN: ReviewDoan -> GDoan)"""
    event = event_repo.get_event_detail(event_id)
    if not event:
        flash('Hồ sơ không tồn tại.', 'danger')
        return redirect(url_for('approvals.union_list'))
        
    budget_items = event_repo.get_budget_items(event_id)
    total_budget = sum(float(b.get('EstimatedAmount', 0)) for b in budget_items)
    history = event_repo.get_workflow_history(event_id)
    
    return render_template('approvals/union_review.html',
                           event=event,
                           budget_items=budget_items,
                           total_budget=total_budget,
                           history=history)
