import prisma from '../config/database';
import { UserRole } from '../types';

export async function getWorkflowBottlenecks() {
  const groups = await prisma.event.groupBy({
    by: ['status'],
    where: { deletedAt: null },
    _count: { _all: true },
    _min: { updatedAt: true },
  });
  return groups
    .map((group) => ({
      status: group.status,
      count: group._count._all,
      oldestUpdateAt: group._min.updatedAt,
    }))
    .sort((a, b) => (a.oldestUpdateAt?.getTime() ?? 0) - (b.oldestUpdateAt?.getTime() ?? 0));
}

export async function getDashboardStats(role: string, userId: string) {
  const baseWhere: Record<string, unknown> = { deletedAt: null };
  if (role === UserRole.BTC) baseWhere.createdById = userId;

  const [
    totalEvents,
    draftEvents,
    pendingApproval,
    approvedEvents,
    completedEvents,
    cancelledEvents,
    recentHistory,
    eventsByStatus,
  ] = await Promise.all([
    prisma.event.count({ where: baseWhere }),
    prisma.event.count({ where: { ...baseWhere, status: 'DRAFT' } }),
    prisma.event.count({
      where: {
        ...baseWhere,
        status: {
          in: role === UserRole.BCN_KHOA ? ['FACULTY_REVIEW'] :
              role === UserRole.DOAN_TRUONG ? ['UNIVERSITY_REVIEW', 'BUDGET_REVIEW', 'PERMIT_ISSUED'] :
              role === UserRole.CSVC ? ['FACILITY_REVIEW', 'FACILITY_RETURN_PENDING'] :
              role === UserRole.KHTC ? ['FINANCE_REVIEW', 'FINANCE_APPROVAL_PENDING'] :
              ['FACULTY_REVIEW', 'UNIVERSITY_REVIEW', 'BUDGET_REVIEW', 'FACILITY_REVIEW', 'FINANCE_REVIEW'],
        },
      },
    }),
    prisma.event.count({ where: { ...baseWhere, status: { in: ['UNIVERSITY_APPROVED', 'PERMIT_ISSUED', 'FACILITY_RESERVED', 'READY_FOR_EVENT'] } } }),
    prisma.event.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
    prisma.event.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
    prisma.workflowHistory.findMany({
      where: role === UserRole.BTC ? { event: { createdById: userId } } : {},
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        event: { select: { id: true, eventCode: true, title: true } },
      },
    }),
    prisma.event.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: { status: true },
    }),
  ]);

  const needsRevision = await prisma.event.count({
    where: {
      ...baseWhere,
      status: { in: ['FACULTY_REVISION_REQUESTED', 'UNIVERSITY_REVISION_REQUESTED', 'BUDGET_REVISION_REQUESTED', 'FACILITY_REVISION_REQUESTED', 'FINANCE_REVISION_REQUESTED'] },
    },
  });

  const upcomingEvents = await prisma.event.count({
    where: {
      ...baseWhere,
      startDate: { gte: new Date() },
      status: { in: ['READY_FOR_EVENT', 'FACILITY_HANDED_OVER', 'FACILITY_RESERVED'] },
    },
  });

  return {
    totalEvents,
    draftEvents,
    pendingApproval,
    approvedEvents,
    completedEvents,
    cancelledEvents,
    needsRevision,
    upcomingEvents,
    recentActivity: recentHistory,
    eventsByStatus: eventsByStatus.map((e) => ({ status: e.status, count: e._count.status })),
  };
}

export async function getApprovalRates() {
  const totalDecisions = await prisma.approvalDecision.count();
  const approved = await prisma.approvalDecision.count({ where: { decision: 'APPROVED' } });
  const rejected = await prisma.approvalDecision.count({ where: { decision: 'REJECTED' } });
  const revision = await prisma.approvalDecision.count({ where: { decision: 'REVISION_REQUESTED' } });

  return {
    total: totalDecisions,
    approved,
    rejected,
    revision,
    approvalRate: totalDecisions > 0 ? Math.round((approved / totalDecisions) * 100) : 0,
    rejectionRate: totalDecisions > 0 ? Math.round((rejected / totalDecisions) * 100) : 0,
    revisionRate: totalDecisions > 0 ? Math.round((revision / totalDecisions) * 100) : 0,
  };
}

export async function getProcessingTimes() {
  const events = await prisma.event.findMany({
    where: { status: 'COMPLETED', deletedAt: null },
    include: { workflowHistory: { orderBy: { createdAt: 'asc' } } },
  });

  if (events.length === 0) {
    return { averageDays: 0, events: [] };
  }

  const times = events.map((e) => {
    const firstSubmit = e.workflowHistory.find((h) => h.action === 'SUBMIT');
    const completion = e.workflowHistory.find((h) => h.toStatus === 'COMPLETED');
    if (firstSubmit && completion) {
      const days = (completion.createdAt.getTime() - firstSubmit.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return { eventCode: e.eventCode, title: e.title, days: Math.round(days * 10) / 10 };
    }
    return null;
  }).filter(Boolean);

  const avgDays = times.length > 0
    ? Math.round((times.reduce((sum, t) => sum + (t?.days || 0), 0) / times.length) * 10) / 10
    : 0;

  return { averageDays: avgDays, events: times };
}

export async function getBudgetAnalysis() {
  const settlements = await prisma.settlement.findMany({
    where: { status: 'SETTLED' },
    include: { event: { select: { eventCode: true, title: true } } },
  });

  return settlements.map((s) => ({
    eventCode: s.event.eventCode,
    title: s.event.title,
    budgeted: s.totalBudgeted,
    actual: s.totalActual,
    difference: s.difference,
  }));
}

export async function getResourceUtilization() {
  const facilities = await prisma.facility.findMany({ where: { isActive: true } });
  const bookings = await prisma.resourceBooking.findMany({
    where: { status: 'CONFIRMED' },
    include: { facility: true },
  });

  const utilization = facilities.map((f) => {
    const facilityBookings = bookings.filter((b) => b.facilityId === f.id);
    return {
      facilityCode: f.code,
      facilityName: f.name,
      totalBookings: facilityBookings.length,
      capacity: f.capacity,
    };
  });

  return utilization;
}
