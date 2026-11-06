import type { EventStatus, UserRole } from '../types';

const editableStatuses: EventStatus[] = [
  'DRAFT',
  'FACULTY_REVISION_REQUESTED',
  'UNIVERSITY_REVISION_REQUESTED',
  'BUDGET_REVISION_REQUESTED',
  'FACILITY_CONFLICT',
  'FACILITY_REVISION_REQUESTED',
];

export function canEditEvent(
  status: EventStatus,
  ownerId: string,
  userId: string,
  role: UserRole
): boolean {
  return role === 'ADMIN' || (editableStatuses.includes(status) && ownerId === userId);
}

export function getEventResubmissionAction(status: EventStatus): {
  action: 'SUBMIT' | 'RESUBMIT' | 'ADJUST';
  target: EventStatus;
} | null {
  if (status === 'DRAFT') return { action: 'SUBMIT', target: 'FACULTY_REVIEW' };
  if (status === 'FACULTY_REVISION_REQUESTED') return { action: 'RESUBMIT', target: 'FACULTY_REVIEW' };
  if (status === 'UNIVERSITY_REVISION_REQUESTED') return { action: 'RESUBMIT', target: 'UNIVERSITY_REVIEW' };
  if (status === 'BUDGET_REVISION_REQUESTED') return { action: 'RESUBMIT', target: 'BUDGET_REVIEW' };
  if (status === 'FACILITY_CONFLICT' || status === 'FACILITY_REVISION_REQUESTED') {
    return { action: 'ADJUST', target: 'FACILITY_REVIEW' };
  }
  return null;
}

export function latestRevisionRequest<T extends { action: string; toStatus: string }>(history: T[]): T | undefined {
  return history.find((item) => item.action === 'REQUEST_REVISION');
}
