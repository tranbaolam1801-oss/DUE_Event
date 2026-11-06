import { EventStatus, UserRole } from '../types';

const editableStatuses = new Set<EventStatus>([
  EventStatus.DRAFT,
  EventStatus.FACULTY_REVISION_REQUESTED,
  EventStatus.UNIVERSITY_REVISION_REQUESTED,
  EventStatus.BUDGET_REVISION_REQUESTED,
  EventStatus.FACILITY_CONFLICT,
  EventStatus.FACILITY_REVISION_REQUESTED,
]);

export function canEditEvent(
  status: string,
  ownerId: string,
  userId: string,
  role: string
): boolean {
  return role === UserRole.ADMIN ||
    (role === UserRole.BTC && isEditableEventStatus(status) && ownerId === userId);
}

export function isEditableEventStatus(status: string): boolean {
  return editableStatuses.has(status as EventStatus);
}

export function getEventResubmissionTarget(status: string): EventStatus | null {
  switch (status) {
    case EventStatus.FACULTY_REVISION_REQUESTED:
      return EventStatus.FACULTY_REVIEW;
    case EventStatus.UNIVERSITY_REVISION_REQUESTED:
      return EventStatus.UNIVERSITY_REVIEW;
    case EventStatus.BUDGET_REVISION_REQUESTED:
      return EventStatus.BUDGET_REVIEW;
    case EventStatus.FACILITY_CONFLICT:
    case EventStatus.FACILITY_REVISION_REQUESTED:
      return EventStatus.FACILITY_REVIEW;
    default:
      return null;
  }
}
