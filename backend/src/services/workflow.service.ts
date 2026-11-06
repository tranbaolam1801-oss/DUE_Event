import prisma from '../config/database';
import { UserRole, EventStatus, DecisionType, ApprovalStage } from '../types';
import { notifyEventStatusChange } from './notification.service';
import { assertSettlementReadyForApproval, assertSettlementReadyForSubmission } from './settlement.service';
import { EventSubmissionValidationError, validateEventSubmission } from './eventSubmissionValidation';

interface TransitionDef {
  to: EventStatus;
  roles: UserRole[];
  requireComment?: boolean;
  autoNext?: EventStatus;
}

export class WorkflowAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowAuthorizationError';
  }
}

// State machine: which transitions are valid from each status
const transitions: Record<string, Record<string, TransitionDef>> = {
  [EventStatus.DRAFT]: {
    SUBMIT: { to: EventStatus.FACULTY_REVIEW, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.FACULTY_REVIEW]: {
    APPROVE: { to: EventStatus.UNIVERSITY_REVIEW, roles: [UserRole.BCN_KHOA, UserRole.ADMIN] },
    REQUEST_REVISION: { to: EventStatus.FACULTY_REVISION_REQUESTED, roles: [UserRole.BCN_KHOA, UserRole.ADMIN], requireComment: true },
    REJECT: { to: EventStatus.FACULTY_REJECTED, roles: [UserRole.BCN_KHOA, UserRole.ADMIN], requireComment: true },
  },
  [EventStatus.FACULTY_REVISION_REQUESTED]: {
    RESUBMIT: { to: EventStatus.FACULTY_REVIEW, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.UNIVERSITY_REVIEW]: {
    APPROVE: { to: EventStatus.PERMIT_ISSUED, roles: [UserRole.DOAN_TRUONG, UserRole.ADMIN] },
    REQUEST_REVISION: { to: EventStatus.UNIVERSITY_REVISION_REQUESTED, roles: [UserRole.DOAN_TRUONG, UserRole.ADMIN], requireComment: true },
    REJECT: { to: EventStatus.UNIVERSITY_REJECTED, roles: [UserRole.DOAN_TRUONG, UserRole.ADMIN], requireComment: true },
  },
  [EventStatus.UNIVERSITY_REVISION_REQUESTED]: {
    RESUBMIT: { to: EventStatus.UNIVERSITY_REVIEW, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.PERMIT_ISSUED]: {
    PROCEED_BUDGET: { to: EventStatus.BUDGET_REVIEW, roles: [UserRole.DOAN_TRUONG, UserRole.BTC, UserRole.ADMIN] },
    CONFIRM_FACILITY: { to: EventStatus.FACILITY_REVIEW, roles: [UserRole.DOAN_TRUONG, UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.BUDGET_REVIEW]: {
    APPROVE: { to: EventStatus.FACILITY_REVIEW, roles: [UserRole.DOAN_TRUONG, UserRole.ADMIN] },
    REQUEST_REVISION: { to: EventStatus.BUDGET_REVISION_REQUESTED, roles: [UserRole.DOAN_TRUONG, UserRole.ADMIN], requireComment: true },
    REJECT: { to: EventStatus.BUDGET_REJECTED, roles: [UserRole.DOAN_TRUONG, UserRole.ADMIN], requireComment: true },
  },
  [EventStatus.BUDGET_REVISION_REQUESTED]: {
    RESUBMIT: { to: EventStatus.BUDGET_REVIEW, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.FACILITY_REVIEW]: {
    CONFIRM: { to: EventStatus.FACILITY_RESERVED, roles: [UserRole.CSVC, UserRole.ADMIN] },
    CONFLICT: { to: EventStatus.FACILITY_CONFLICT, roles: [UserRole.CSVC, UserRole.ADMIN], requireComment: true },
    REQUEST_REVISION: { to: EventStatus.FACILITY_REVISION_REQUESTED, roles: [UserRole.CSVC, UserRole.ADMIN], requireComment: true },
  },
  [EventStatus.FACILITY_CONFLICT]: {
    ADJUST: { to: EventStatus.FACILITY_REVIEW, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.FACILITY_REVISION_REQUESTED]: {
    ADJUST: { to: EventStatus.FACILITY_REVIEW, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.FACILITY_RESERVED]: {
    READY: { to: EventStatus.READY_FOR_EVENT, roles: [UserRole.CSVC, UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.READY_FOR_EVENT]: {
    HANDOVER: { to: EventStatus.FACILITY_HANDED_OVER, roles: [UserRole.CSVC, UserRole.ADMIN] },
    START_EVENT: { to: EventStatus.EVENT_IN_PROGRESS, roles: [UserRole.BTC, UserRole.ADMIN] },
    END_EVENT: { to: EventStatus.FACILITY_RETURN_PENDING, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.FACILITY_HANDED_OVER]: {
    START_EVENT: { to: EventStatus.EVENT_IN_PROGRESS, roles: [UserRole.BTC, UserRole.ADMIN] },
    END_EVENT: { to: EventStatus.FACILITY_RETURN_PENDING, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.EVENT_IN_PROGRESS]: {
    END_EVENT: { to: EventStatus.FACILITY_RETURN_PENDING, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.FACILITY_RETURN_PENDING]: {
    INSPECT: { to: EventStatus.FACILITY_INSPECTION, roles: [UserRole.CSVC, UserRole.ADMIN] },
    ACCEPT: { to: EventStatus.REPORT_PENDING, roles: [UserRole.CSVC, UserRole.ADMIN] },
  },
  [EventStatus.FACILITY_INSPECTION]: {
    ACCEPT: { to: EventStatus.REPORT_PENDING, roles: [UserRole.CSVC, UserRole.ADMIN] },
    INCIDENT: { to: EventStatus.FACILITY_INCIDENT, roles: [UserRole.CSVC, UserRole.ADMIN], requireComment: true },
  },
  [EventStatus.FACILITY_INCIDENT]: {
    RESOLVE: { to: EventStatus.REPORT_PENDING, roles: [UserRole.CSVC, UserRole.ADMIN] },
  },
  [EventStatus.REPORT_PENDING]: {
    SUBMIT_REPORT: { to: EventStatus.FINANCE_DOCUMENTS_PENDING, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.FINANCE_DOCUMENTS_PENDING]: {
    SUBMIT_DOCUMENTS: { to: EventStatus.FINANCE_REVIEW, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.FINANCE_REVIEW]: {
    APPROVE: { to: EventStatus.FINANCE_APPROVAL_PENDING, roles: [UserRole.KHTC, UserRole.ADMIN] },
    REQUEST_REVISION: { to: EventStatus.FINANCE_REVISION_REQUESTED, roles: [UserRole.KHTC, UserRole.ADMIN], requireComment: true },
  },
  [EventStatus.FINANCE_REVISION_REQUESTED]: {
    RESUBMIT: { to: EventStatus.FINANCE_REVIEW, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.FINANCE_APPROVAL_PENDING]: {
    SETTLE: { to: EventStatus.SETTLED, roles: [UserRole.KHTC, UserRole.ADMIN] },
    REJECT_PAYMENT: { to: EventStatus.PAYMENT_REJECTED, roles: [UserRole.KHTC, UserRole.ADMIN], requireComment: true },
  },
  [EventStatus.PAYMENT_REJECTED]: {
    RESUBMIT: { to: EventStatus.FINANCE_REVIEW, roles: [UserRole.BTC, UserRole.ADMIN] },
  },
  [EventStatus.SETTLED]: {
    COMPLETE: { to: EventStatus.COMPLETED, roles: [UserRole.DOAN_TRUONG, UserRole.BTC, UserRole.ADMIN] },
  },
};

// Cancel can happen from many statuses
const cancellableStatuses = [
  EventStatus.DRAFT, EventStatus.SUBMITTED, EventStatus.FACULTY_REVIEW,
  EventStatus.FACULTY_REVISION_REQUESTED, EventStatus.FACULTY_APPROVED,
  EventStatus.UNIVERSITY_REVIEW, EventStatus.UNIVERSITY_REVISION_REQUESTED,
  EventStatus.PERMIT_ISSUED, EventStatus.BUDGET_REVIEW,
  EventStatus.BUDGET_REVISION_REQUESTED, EventStatus.FACILITY_REVIEW,
  EventStatus.FACILITY_CONFLICT, EventStatus.FACILITY_REVISION_REQUESTED,
  EventStatus.FACILITY_RESERVED, EventStatus.READY_FOR_EVENT,
];

export function getAvailableActions(currentStatus: string, userRole: string, eventOwnerId?: string, userId?: string): string[] {
  if (userRole === UserRole.BTC && eventOwnerId && userId && eventOwnerId !== userId) return [];
  const statusTransitions = transitions[currentStatus];
  if (!statusTransitions) return [];

  const actions: string[] = [];
  for (const [action, def] of Object.entries(statusTransitions)) {
    if (userRole === UserRole.ADMIN || def.roles.includes(userRole as UserRole)) {
      actions.push(action);
    }
  }

  // Add cancel action
  if (
    cancellableStatuses.includes(currentStatus as EventStatus) &&
    (userRole === UserRole.ADMIN || userRole === UserRole.BTC)
  ) {
    actions.push('CANCEL');
  }

  return actions;
}

function mapActionToStage(action: string, currentStatus: string): string | null {
  if (currentStatus.startsWith('FACULTY')) return ApprovalStage.FACULTY_REVIEW;
  if (currentStatus.startsWith('UNIVERSITY') || currentStatus === EventStatus.PERMIT_ISSUED) return ApprovalStage.UNIVERSITY_REVIEW;
  if (currentStatus.startsWith('BUDGET')) return ApprovalStage.BUDGET_REVIEW;
  if (currentStatus.startsWith('FACILITY')) return ApprovalStage.FACILITY_REVIEW;
  if (currentStatus.startsWith('FINANCE') || currentStatus === EventStatus.FINANCE_APPROVAL_PENDING) return ApprovalStage.FINANCE_REVIEW;
  return null;
}

function mapActionToDecision(action: string): string | null {
  if (action === 'APPROVE' || action === 'CONFIRM' || action === 'ACCEPT' || action === 'SETTLE' || action === 'COMPLETE') {
    return DecisionType.APPROVED;
  }
  if (action === 'REJECT' || action === 'REJECT_PAYMENT') {
    return DecisionType.REJECTED;
  }
  if (action === 'REQUEST_REVISION' || action === 'CONFLICT') {
    return DecisionType.REVISION_REQUESTED;
  }
  return null;
}

export async function transitionState(
  eventId: string,
  action: string,
  userId: string,
  userRole: string,
  data?: { comments?: string; reason?: string }
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      budgetItems: true,
      scheduleItems: true,
      resourceBookings: { include: { facility: true } },
      attachments: { select: { id: true, category: true, originalName: true } },
    },
  });
  if (!event || event.deletedAt) throw new Error('Không tìm thấy hồ sơ');
  if (userRole === UserRole.BTC && event.createdById !== userId) {
    throw new WorkflowAuthorizationError('Ban Tổ chức chỉ được thao tác với hồ sơ do mình sở hữu hoặc được phân công');
  }
  // BCH can operate on workflow steps assigned to BTC

  // Handle cancel specially
  if (action === 'CANCEL') {
    if (!cancellableStatuses.includes(event.status as EventStatus)) {
      throw new Error('Không thể hủy hồ sơ ở trạng thái hiện tại');
    }
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.BTC) {
      throw new WorkflowAuthorizationError('Không có quyền hủy hồ sơ');
    }

    return executeTransition(event, EventStatus.CANCELLED, action, userId, userRole, data);
  }

  // Normal transition
  const statusTransitions = transitions[event.status];
  if (!statusTransitions || !statusTransitions[action]) {
    throw new Error(`Hành động "${action}" không hợp lệ cho trạng thái "${event.status}"`);
  }

  const transitionDef = statusTransitions[action];

  // Check role
  if (!transitionDef.roles.includes(userRole as UserRole)) {
    throw new WorkflowAuthorizationError('Không có quyền thực hiện hành động này');
  }

  // Check required comment
  if (transitionDef.requireComment && !data?.comments && !data?.reason) {
    throw new Error('Vui lòng nhập lý do');
  }

  // Self-approval check: BTC cannot approve their own events
  if (['APPROVE'].includes(action) && userRole === UserRole.BTC) {
    if (event.createdById === userId) {
      throw new Error('Không thể tự phê duyệt hồ sơ của mình');
    }
  }

  if (
    (action === 'SUBMIT_DOCUMENTS' && event.status === EventStatus.FINANCE_DOCUMENTS_PENDING) ||
    (action === 'RESUBMIT' && [EventStatus.FINANCE_REVISION_REQUESTED, EventStatus.PAYMENT_REJECTED].includes(event.status as EventStatus))
  ) {
    const settlement = await prisma.settlement.findFirst({
      where: { eventId },
      include: { items: true, documents: true },
    });
    if (!settlement) throw new Error('Cần tạo hồ sơ quyết toán trước khi nộp');
    assertSettlementReadyForSubmission(settlement);
  }
  if (
    (action === 'RESUBMIT' && [
      EventStatus.FACULTY_REVISION_REQUESTED,
      EventStatus.UNIVERSITY_REVISION_REQUESTED,
      EventStatus.BUDGET_REVISION_REQUESTED,
    ].includes(event.status as EventStatus)) ||
    (action === 'ADJUST' && [EventStatus.FACILITY_CONFLICT, EventStatus.FACILITY_REVISION_REQUESTED].includes(event.status as EventStatus))
  ) {
    const issues = validateEventSubmission(event);
    if (issues.length) throw new EventSubmissionValidationError(issues);
  }
  if (
    (action === 'APPROVE' && event.status === EventStatus.FINANCE_REVIEW) ||
    (action === 'SETTLE' && event.status === EventStatus.FINANCE_APPROVAL_PENDING)
  ) {
    const settlement = await prisma.settlement.findFirst({
      where: { eventId },
      include: { items: true, documents: true },
    });
    if (!settlement) throw new Error('Không tìm thấy hồ sơ quyết toán');
    if (action === 'APPROVE' && !['SUBMITTED', 'DRAFT'].includes(settlement.status)) {
      throw new Error('Hồ sơ quyết toán chưa được nộp cho KHTC');
    }
    if (action === 'SETTLE' && settlement.status !== 'APPROVED') {
      throw new Error('Quyết toán chưa được KHTC phê duyệt');
    }
    assertSettlementReadyForApproval(settlement);
  }

  return executeTransition(event, transitionDef.to, action, userId, userRole, data);
}

async function executeTransition(
  event: { id: string; status: string; title: string; eventCode: string; createdById: string; currentVersion: number },
  toStatus: EventStatus,
  action: string,
  userId: string,
  userRole: string,
  data?: { comments?: string; reason?: string }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const completesAfterSettlement = toStatus === EventStatus.SETTLED;
  const finalStatus = completesAfterSettlement ? EventStatus.COMPLETED : toStatus;

  const result = await prisma.$transaction(async (tx) => {
    // Update event status
    const updateData: Record<string, unknown> = { status: finalStatus, currentVersion: { increment: 1 } };

    // Update sub-statuses based on transition
    if (toStatus === EventStatus.PERMIT_ISSUED) {
      updateData.permitStatus = 'ISSUED';
    }
    if (toStatus === EventStatus.FACILITY_RESERVED) {
      updateData.facilityStatus = 'RESERVED';
    }
    if (toStatus === EventStatus.FACILITY_HANDED_OVER) {
      updateData.facilityStatus = 'HANDED_OVER';
    }
    if (toStatus === EventStatus.FACILITY_ACCEPTED || toStatus === EventStatus.REPORT_PENDING) {
      updateData.facilityStatus = 'RETURNED';
      updateData.inspectionStatus = 'PASSED';
    }
    if (toStatus === EventStatus.FACILITY_INCIDENT) {
      updateData.inspectionStatus = 'INCIDENT';
    }
    if (toStatus === EventStatus.SETTLED) {
      updateData.settlementStatus = 'SETTLED';
    }
    if (toStatus === EventStatus.FINANCE_REVIEW) {
      updateData.settlementStatus = 'SUBMITTED';
    }
    if (toStatus === EventStatus.FINANCE_APPROVAL_PENDING) {
      updateData.settlementStatus = 'APPROVED';
    }
    if (toStatus === EventStatus.FINANCE_REVISION_REQUESTED) {
      updateData.settlementStatus = 'REVISION_REQUESTED';
    }
    if (toStatus === EventStatus.PAYMENT_REJECTED) {
      updateData.settlementStatus = 'REJECTED';
    }
    if (finalStatus === EventStatus.COMPLETED) {
      updateData.reportStatus = 'ACCEPTED';
    }
    if (toStatus === EventStatus.CANCELLED) {
      updateData.facilityStatus = 'CANCELLED';
    }

    const changed = await tx.event.updateMany({ where: { id: event.id, status: event.status, currentVersion: event.currentVersion }, data: updateData as Parameters<typeof tx.event.updateMany>[0]['data'] });
    if (!changed.count) throw new Error('Hồ sơ đã thay đổi trên máy khác. Hãy tải lại.');
    if (
      action === 'SUBMIT_DOCUMENTS' ||
      (action === 'RESUBMIT' && [EventStatus.FINANCE_REVISION_REQUESTED, EventStatus.PAYMENT_REJECTED].includes(event.status as EventStatus))
    ) {
      const settlement = await tx.settlement.findFirst({
        where: { eventId: event.id },
        include: { items: true, documents: true },
      });
      if (!settlement) throw new Error('Không tìm thấy hồ sơ quyết toán');
      assertSettlementReadyForSubmission(settlement);
      await tx.settlement.update({
        where: { id: settlement.id },
        data: { status: 'SUBMITTED', submittedAt: new Date(), submittedById: userId },
      });
    }
    if (action === 'APPROVE' && event.status === EventStatus.FINANCE_REVIEW) {
      const settlement = await tx.settlement.findFirst({
        where: { eventId: event.id },
        include: { items: true, documents: true },
      });
      if (!settlement || !['SUBMITTED', 'DRAFT'].includes(settlement.status)) throw new Error('Hồ sơ quyết toán chưa được nộp cho KHTC');
      assertSettlementReadyForApproval(settlement);
      await tx.settlement.update({
        where: { id: settlement.id },
        data: {
          status: 'APPROVED',
          reviewedById: userId,
          reviewedAt: new Date(),
          reviewNotes: data?.comments || null,
        },
      });
    }
    if (action === 'REQUEST_REVISION' && event.status === EventStatus.FINANCE_REVIEW) {
      await tx.settlement.updateMany({
        where: { eventId: event.id },
        data: { status: 'REVISION_REQUESTED', reviewNotes: data?.comments || data?.reason },
      });
    }
    if (action === 'REJECT_PAYMENT' && event.status === EventStatus.FINANCE_APPROVAL_PENDING) {
      await tx.settlement.updateMany({
        where: { eventId: event.id },
        data: { status: 'REJECTED', reviewNotes: data?.comments || data?.reason },
      });
    }
    if (action === 'SETTLE' && event.status === EventStatus.FINANCE_APPROVAL_PENDING) {
      const settlement = await tx.settlement.findFirst({
        where: { eventId: event.id },
        include: { items: true, documents: true },
      });
      if (!settlement || settlement.status !== 'APPROVED') throw new Error('Quyết toán chưa được KHTC phê duyệt');
      assertSettlementReadyForApproval(settlement);
      await tx.settlement.update({
        where: { id: settlement.id },
        data: { status: 'SETTLED', reviewedById: userId, reviewedAt: new Date() },
      });
    }
    if (toStatus === EventStatus.FACILITY_RESERVED) await tx.resourceBooking.updateMany({ where: { eventId: event.id }, data: { status: 'CONFIRMED' } });
    if (['CANCELLED', 'FACULTY_REJECTED', 'UNIVERSITY_REJECTED', 'BUDGET_REJECTED'].includes(toStatus)) await tx.resourceBooking.updateMany({ where: { eventId: event.id }, data: { status: 'REJECTED' } });
    const updated = await tx.event.findUniqueOrThrow({ where: { id: event.id } });

    if (action === 'RESUBMIT' || action === 'ADJUST') {
      await tx.eventVersion.updateMany({ where: { eventId: event.id, isActive: true }, data: { isActive: false } });
      const snapshot = await tx.event.findUniqueOrThrow({
        where: { id: event.id },
        include: {
          budgetItems: true,
          scheduleItems: true,
          resourceBookings: { include: { bookingItems: true } },
          attachments: { select: { id: true, originalName: true, category: true, filePath: true } },
        },
      });
      await tx.eventVersion.create({
        data: {
          eventId: event.id,
          version: snapshot.currentVersion,
          title: snapshot.title,
          description: snapshot.description,
          objectives: snapshot.objectives,
          planContent: snapshot.planContent,
          budgetData: JSON.stringify(snapshot),
          changeNote: data?.comments || `Gửi lại hồ sơ sau yêu cầu chỉnh sửa (${action})`,
          changedBy: userId,
          isActive: true,
        },
      });
    }

    // Create workflow history
    await tx.workflowHistory.create({
      data: {
        eventId: event.id,
        fromStatus: event.status,
        toStatus,
        action,
        actorId: userId,
        actorName: user?.fullName,
        actorRole: userRole,
        comments: data?.comments || data?.reason,
      },
    });
    if (completesAfterSettlement) {
      await tx.workflowHistory.create({
        data: {
          eventId: event.id,
          fromStatus: EventStatus.SETTLED,
          toStatus: EventStatus.COMPLETED,
          action: 'AUTO_COMPLETE_AFTER_SETTLEMENT',
          actorId: userId,
          actorName: user?.fullName,
          actorRole: userRole,
          comments: data?.comments || 'Hồ sơ tự động hoàn tất sau khi KHTC xác nhận quyết toán hợp lệ',
        },
      });
    }

    // Create approval decision if applicable
    const decision = mapActionToDecision(action);
    const stage = mapActionToStage(action, event.status);
    if (decision && stage) {
      await tx.approvalDecision.create({
        data: {
          eventId: event.id,
          stage,
          decision,
          comments: data?.comments,
          reason: data?.reason,
          version: event.currentVersion,
          decidedById: userId,
        },
      });
    }

    // Release bookings if cancelled or rejected
    if (
      toStatus === EventStatus.CANCELLED ||
      toStatus === EventStatus.FACULTY_REJECTED ||
      toStatus === EventStatus.UNIVERSITY_REJECTED ||
      toStatus === EventStatus.BUDGET_REJECTED
    ) {
      await tx.resourceBooking.updateMany({
        where: { eventId: event.id, status: { in: ['PENDING', 'TENTATIVE', 'CONFIRMED'] } },
        data: { status: 'RELEASED' },
      });
    }

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: `WORKFLOW_${action}`,
        entityType: 'Event',
        entityId: event.id,
        oldValue: JSON.stringify({ status: event.status }),
        newValue: JSON.stringify({ status: finalStatus }),
      },
    });

    return updated;
  });

  // Send notifications (outside transaction for performance)
  await notifyEventStatusChange(event, event.status, finalStatus, user?.fullName || 'Hệ thống', data?.comments);

  return result;
}
