import type { EventItem } from '../types';

// Translate relational API records into the view model used by existing pages.
export function mapEvent(data: any): EventItem {
  const booking = data.resourceBookings?.[0];
  const workflowHistory = data.workflowHistory || [];
  const history = workflowHistory.length
    ? workflowHistory
    : (data.approvalDecisions || []).map((decision: any) => ({
        id: decision.id,
        fromStatus: '',
        toStatus: decision.stage,
        action: decision.decision,
        actorId: decision.decidedById,
        actorName: decision.decidedBy?.fullName || '',
        actorRole: decision.decidedBy?.role || '',
        comments: decision.comments || decision.reason,
        createdAt: decision.createdAt,
      }));
  return {
    ...data,
    description: data.description || '', objectives: data.objectives || '',
    targetAudience: data.targetAudience || '', contactPerson: data.contactPerson || '',
    contactEmail: data.contactEmail || '', contactPhone: data.contactPhone || '',
    preferredVenue: data.preferredVenue || '', expectedAttendees: data.expectedAttendees || 0,
    startDate: data.startDate || '', endDate: data.endDate || '',
    createdByName: data.createdBy?.fullName || '',
    budgetItems: data.budgetItems || [], scheduleItems: data.scheduleItems || [],
    history: history.map((h: any) => ({ ...h, timestamp: h.createdAt })),
    decisions: (data.approvalDecisions || []).map((d: any) => ({ ...d, actorName: d.decidedBy?.fullName || '', actorRole: d.decidedBy?.role })),
    booking: booking ? { ...booking, facilityName: booking.facility?.name || '', equipmentItems: (booking.bookingItems || []).map((i: any) => ({ ...i, equipmentName: i.equipment?.name || '' })) } : undefined,
    handover: (data.handoverRecords || []).map((h: any) => ({ ...h, handoverByName: h.handoverBy?.fullName || '', receivedByName: h.receivedBy?.fullName || data.contactPerson || '', equipmentNotes: h.equipmentList || '', confirmedAt: h.confirmedAt || h.createdAt })),
    settlement: data.settlements?.[0], report: data.eventReport || undefined,
    attachments: (data.attachments || []).map((a: any) => {
      let sizeStr = `${a.fileSize || 0} B`;
      if (a.fileSize >= 1024 * 1024) {
        sizeStr = `${(a.fileSize / (1024 * 1024)).toFixed(1)} MB`;
      } else if (a.fileSize >= 1024) {
        sizeStr = `${Math.round(a.fileSize / 1024)} KB`;
      }
      return {
        id: a.id,
        name: a.originalName || a.fileName,
        size: sizeStr,
        type: a.fileType || 'Tài liệu',
        category: ['TIMELINE', 'BUDGET'].includes(a.category) ? a.category : 'OTHER',
        date: a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : '',
      };
    }),
  };
}

export function workflowAction(status: string, target: string): string {
  if (target === 'CANCELLED') return 'CANCEL';
  if (target.includes('REVISION_REQUESTED')) return 'REQUEST_REVISION';
  if (target === 'PAYMENT_REJECTED') return 'REJECT_PAYMENT';
  if (target.includes('REJECTED')) return 'REJECT';
  if (target === 'FACULTY_REVIEW') return status === 'DRAFT' ? 'SUBMIT' : 'RESUBMIT';
  if (target === 'FACULTY_APPROVED' || target === 'UNIVERSITY_REVIEW' || target === 'PERMIT_ISSUED') return 'APPROVE';
  if (target === 'BUDGET_REVIEW') return status === 'PERMIT_ISSUED' ? 'PROCEED_BUDGET' : 'RESUBMIT';
  if (target === 'FACILITY_REVIEW') return status === 'BUDGET_REVIEW' ? 'APPROVE' : 'ADJUST';
  const actions: Record<string, string> = { FACILITY_RESERVED: 'CONFIRM', READY_FOR_EVENT: 'READY', FACILITY_HANDED_OVER: 'HANDOVER', EVENT_IN_PROGRESS: 'START_EVENT', FACILITY_RETURN_PENDING: 'END_EVENT', FACILITY_INSPECTION: 'INSPECT', FACILITY_INCIDENT: 'INCIDENT', FACILITY_ACCEPTED: 'ACCEPT', REPORT_PENDING: 'SUBMIT_REPORT', FINANCE_DOCUMENTS_PENDING: 'SUBMIT_REPORT', FINANCE_REVIEW: 'SUBMIT_DOCUMENTS', FINANCE_APPROVAL_PENDING: 'APPROVE', SETTLED: 'SETTLE', COMPLETED: 'COMPLETE' };
  if (!actions[target]) throw new Error('Chưa có thao tác API tương ứng với trạng thái này');
  return actions[target];
}
