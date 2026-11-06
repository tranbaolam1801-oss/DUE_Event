import prisma from '../config/database';

export async function createHandoverRecord(data: {
  eventId: string;
  type: 'PRE_EVENT' | 'POST_EVENT';
  handoverById: string;
  receivedById?: string;
  facilityCondition?: string;
  equipmentList?: string;
  notes?: string;
}) {
  return prisma.handoverRecord.create({
    data: {
      eventId: data.eventId,
      type: data.type,
      handoverById: data.handoverById,
      receivedById: data.receivedById,
      facilityCondition: data.facilityCondition,
      equipmentList: data.equipmentList,
      notes: data.notes,
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
    include: {
      handoverBy: { select: { id: true, fullName: true, role: true } },
      receivedBy: { select: { id: true, fullName: true, role: true } },
    },
  });
}

export async function createReturnInspection(data: {
  eventId: string;
  inspectedById: string;
  facilityCondition?: string;
  equipmentCondition?: string;
  overallResult: 'PASSED' | 'FAILED' | 'INCIDENT';
  notes?: string;
}) {
  return prisma.returnInspection.create({
    data: {
      eventId: data.eventId,
      inspectedById: data.inspectedById,
      facilityCondition: data.facilityCondition,
      equipmentCondition: data.equipmentCondition,
      overallResult: data.overallResult,
      notes: data.notes,
    },
    include: {
      inspectedBy: { select: { id: true, fullName: true, role: true } },
    },
  });
}

export async function createIncidentReport(data: {
  eventId: string;
  reportedById: string;
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolution?: string;
}) {
  return prisma.incidentReport.create({
    data: {
      eventId: data.eventId,
      reportedById: data.reportedById,
      type: data.type,
      description: data.description,
      severity: data.severity,
      resolution: data.resolution,
      status: 'OPEN',
    },
    include: {
      reportedBy: { select: { id: true, fullName: true, role: true } },
    },
  });
}
