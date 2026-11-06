/**
 * EventFlow — Role-Based Access Control (RBAC) System
 * Defines fine-grained permissions and maps them to User Roles.
 */

import { UserRole } from '../types';

export enum Permission {
  // Event Management
  EVENT_CREATE = 'EVENT:CREATE',
  EVENT_VIEW_ALL = 'EVENT:VIEW_ALL',
  EVENT_VIEW_OWN = 'EVENT:VIEW_OWN',
  EVENT_VIEW_FACULTY = 'EVENT:VIEW_FACULTY',
  EVENT_EDIT_DRAFT = 'EVENT:EDIT_DRAFT',
  EVENT_EDIT_ANY = 'EVENT:EDIT_ANY',
  EVENT_SUBMIT = 'EVENT:SUBMIT',
  EVENT_CANCEL = 'EVENT:CANCEL',
  EVENT_DELETE = 'EVENT:DELETE',

  // Approvals & Permits
  APPROVAL_KHOA_REVIEW = 'APPROVAL:KHOA_REVIEW',
  APPROVAL_DOAN_REVIEW = 'APPROVAL:DOAN_REVIEW',
  APPROVAL_ISSUE_PERMIT = 'APPROVAL:ISSUE_PERMIT',
  APPROVAL_VIEW_AUDIT_LOG = 'APPROVAL:VIEW_AUDIT_LOG',

  // Facilities & Equipment
  FACILITY_VIEW_CALENDAR = 'FACILITY:VIEW_CALENDAR',
  FACILITY_REQUEST_BOOKING = 'FACILITY:REQUEST_BOOKING',
  FACILITY_APPROVE_BOOKING = 'FACILITY:APPROVE_BOOKING',
  FACILITY_REJECT_BOOKING = 'FACILITY:REJECT_BOOKING',
  FACILITY_MANAGE_LIST = 'FACILITY:MANAGE_LIST',

  // Handover & Inspection
  HANDOVER_SIGN_PRE_EVENT = 'HANDOVER:SIGN_PRE_EVENT',
  HANDOVER_RECEIVE_FACILITY = 'HANDOVER:RECEIVE_FACILITY',
  HANDOVER_INSPECT_RETURN = 'HANDOVER:INSPECT_RETURN',
  HANDOVER_LOG_INCIDENT = 'HANDOVER:LOG_INCIDENT',

  // Settlement & Finance
  SETTLEMENT_CREATE = 'SETTLEMENT:CREATE',
  SETTLEMENT_SUBMIT = 'SETTLEMENT:SUBMIT',
  SETTLEMENT_VERIFY_DOCS = 'SETTLEMENT:VERIFY_DOCS',
  SETTLEMENT_APPROVE = 'SETTLEMENT:APPROVE',
  SETTLEMENT_VIEW_ANY = 'SETTLEMENT:VIEW_ANY',

  // Reports & Analytics
  REPORT_SUBMIT = 'REPORT:SUBMIT',
  REPORT_APPROVE = 'REPORT:APPROVE',
  REPORT_VIEW_ANALYTICS = 'REPORT:VIEW_ANALYTICS',

  // Administration
  USER_MANAGE = 'USER:MANAGE',
  SYSTEM_CONFIG = 'SYSTEM:CONFIG',
}

/**
 * Static Role-to-Permissions Matrix
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),

  [UserRole.BTC]: [
    Permission.EVENT_CREATE,
    Permission.EVENT_VIEW_OWN,
    Permission.EVENT_EDIT_DRAFT,
    Permission.EVENT_SUBMIT,
    Permission.EVENT_CANCEL,
    Permission.APPROVAL_VIEW_AUDIT_LOG,
    Permission.FACILITY_VIEW_CALENDAR,
    Permission.FACILITY_REQUEST_BOOKING,
    Permission.HANDOVER_RECEIVE_FACILITY,
    Permission.SETTLEMENT_CREATE,
    Permission.SETTLEMENT_SUBMIT,
    Permission.REPORT_SUBMIT,
  ],

  [UserRole.BCN_KHOA]: [
    Permission.EVENT_VIEW_FACULTY,
    Permission.APPROVAL_KHOA_REVIEW,
    Permission.APPROVAL_VIEW_AUDIT_LOG,
    Permission.FACILITY_VIEW_CALENDAR,
    Permission.REPORT_VIEW_ANALYTICS,
  ],

  [UserRole.DOAN_TRUONG]: [
    Permission.EVENT_VIEW_ALL,
    Permission.APPROVAL_DOAN_REVIEW,
    Permission.APPROVAL_ISSUE_PERMIT,
    Permission.APPROVAL_VIEW_AUDIT_LOG,
    Permission.FACILITY_VIEW_CALENDAR,
    Permission.REPORT_APPROVE,
    Permission.REPORT_VIEW_ANALYTICS,
  ],

  [UserRole.CSVC]: [
    Permission.EVENT_VIEW_ALL,
    Permission.APPROVAL_VIEW_AUDIT_LOG,
    Permission.FACILITY_VIEW_CALENDAR,
    Permission.FACILITY_APPROVE_BOOKING,
    Permission.FACILITY_REJECT_BOOKING,
    Permission.FACILITY_MANAGE_LIST,
    Permission.HANDOVER_SIGN_PRE_EVENT,
    Permission.HANDOVER_INSPECT_RETURN,
    Permission.HANDOVER_LOG_INCIDENT,
    Permission.REPORT_VIEW_ANALYTICS,
  ],

  [UserRole.KHTC]: [
    Permission.EVENT_VIEW_ALL,
    Permission.APPROVAL_VIEW_AUDIT_LOG,
    Permission.SETTLEMENT_VIEW_ANY,
    Permission.SETTLEMENT_VERIFY_DOCS,
    Permission.SETTLEMENT_APPROVE,
    Permission.REPORT_VIEW_ANALYTICS,
  ],
};

/**
 * Checks if a given role has a specific permission
 */
export function hasPermission(role: UserRole | string, permission: Permission): boolean {
  const roleEnum = role as UserRole;
  const permissions = ROLE_PERMISSIONS[roleEnum];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Checks if a given role has at least one of the specified permissions
 */
export function hasAnyPermission(role: UserRole | string, permissions: Permission[]): boolean {
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Checks if a given role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole | string, permissions: Permission[]): boolean {
  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Returns all permissions granted to a role
 */
export function getPermissionsForRole(role: UserRole | string): Permission[] {
  return ROLE_PERMISSIONS[role as UserRole] || [];
}
