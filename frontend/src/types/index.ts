export type UserRole = 'ADMIN' | 'BTC' | 'BCN_KHOA' | 'DOAN_TRUONG' | 'CSVC' | 'KHTC';

export const VALID_USER_ROLES: UserRole[] = ['ADMIN', 'BTC', 'BCN_KHOA', 'DOAN_TRUONG', 'CSVC', 'KHTC'];

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  avatar?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
}

export type EventStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'FACULTY_REVIEW'
  | 'FACULTY_REVISION_REQUESTED'
  | 'FACULTY_REJECTED'
  | 'FACULTY_APPROVED'
  | 'UNIVERSITY_REVIEW'
  | 'UNIVERSITY_REVISION_REQUESTED'
  | 'UNIVERSITY_REJECTED'
  | 'UNIVERSITY_APPROVED'
  | 'PERMIT_ISSUED'
  | 'BUDGET_REVIEW'
  | 'BUDGET_REVISION_REQUESTED'
  | 'BUDGET_REJECTED'
  | 'FACILITY_REVIEW'
  | 'FACILITY_CONFLICT'
  | 'FACILITY_REVISION_REQUESTED'
  | 'FACILITY_RESERVED'
  | 'READY_FOR_EVENT'
  | 'FACILITY_HANDED_OVER'
  | 'EVENT_IN_PROGRESS'
  | 'FACILITY_RETURN_PENDING'
  | 'FACILITY_INSPECTION'
  | 'FACILITY_INCIDENT'
  | 'FACILITY_ACCEPTED'
  | 'REPORT_PENDING'
  | 'FINANCE_DOCUMENTS_PENDING'
  | 'FINANCE_REVIEW'
  | 'FINANCE_REVISION_REQUESTED'
  | 'FINANCE_APPROVAL_PENDING'
  | 'PAYMENT_REJECTED'
  | 'SETTLED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface BudgetItem {
  id: string;
  category: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  actualQuantity?: number;
  actualPrice?: number;
  actualTotal?: number;
}

export interface ScheduleItem {
  id: string;
  timeSlot: string;
  activity: string;
  responsible: string;
  notes?: string;
}

export interface Facility {
  id: string;
  code: string;
  name: string;
  location?: string | null;
  capacity?: number | null;
  type: string;
  description?: string | null;
  amenities?: string[] | string;
  status?: 'AVAILABLE' | 'MAINTENANCE' | 'BUSY' | string;
  isActive?: boolean;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  type: string;
  totalQuantity: number;
  availableQuantity?: number;
  condition?: 'GOOD' | 'FAIR' | 'POOR' | 'MAINTENANCE' | string;
  description?: string | null;
  isActive?: boolean;
}

export interface ResourceBookingItem {
  equipmentId: string;
  equipmentName: string;
  quantity: number;
}

export interface ResourceBooking {
  id: string;
  facilityId: string;
  facilityName: string;
  startTime: string;
  endTime: string;
  setupTime?: string;
  teardownTime?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CONFLICT' | 'REJECTED';
  conflictDetails?: string;
  equipmentItems: ResourceBookingItem[];
}

export interface WorkflowHistoryItem {
  id: string;
  fromStatus: string;
  toStatus: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  comments?: string;
  timestamp: string;
}

export interface ApprovalDecision {
  id: string;
  stage: string;
  decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  comments?: string;
  reason?: string;
  actorName: string;
  actorRole: UserRole;
  createdAt: string;
}

export interface HandoverRecord {
  id: string;
  type: 'PRE_EVENT' | 'POST_EVENT';
  handoverByName: string;
  receivedByName: string;
  facilityCondition: string;
  equipmentNotes: string;
  confirmedAt: string;
  hasIncident?: boolean;
  incidentDetails?: string;
}

export interface FinancialDocument {
  id: string;
  documentType: 'RECEIPT' | 'INVOICE' | 'CONTRACT' | 'OTHER';
  documentNumber?: string | null;
  amount?: number | null;
  description?: string | null;
  fileName?: string | null;
  filePath?: string | null;
  isVerified: boolean;
}

export interface SettlementItem {
  id?: string;
  itemName: string;
  category?: string | null;
  budgetedAmount: number;
  actualAmount: number;
  difference?: number;
  notes?: string | null;
}

export interface Settlement {
  id: string;
  eventId: string;
  totalBudgeted: number;
  totalActual: number;
  difference: number;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'REVISION_REQUESTED' | 'APPROVED' | 'SETTLED' | 'REJECTED';
  reviewNotes?: string;
  settlementDate?: string | null;
  notes?: string | null;
  items?: SettlementItem[];
  documents: FinancialDocument[];
}

export interface EventReport {
  id: string;
  eventId: string;
  actualAttendees: number;
  summary: string;
  achievements: string;
  challenges: string;
  lessonsLearned: string;
  recommendations: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ACCEPTED';
}

export interface EventItem {
  id: string;
  eventCode: string;
  title: string;
  description: string;
  objectives: string;
  targetAudience: string;
  expectedAttendees: number;
  organizingUnit: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  startDate: string;
  endDate: string;
  setupTime?: string;
  teardownTime?: string;
  preferredVenue: string;
  status: EventStatus;
  currentVersion: number;
  deletedAt?: string | null;
  deletedById?: string | null;
  deleteReason?: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  budgetItems: BudgetItem[];
  scheduleItems: ScheduleItem[];
  booking?: ResourceBooking;
  history: WorkflowHistoryItem[];
  decisions: ApprovalDecision[];
  handover?: HandoverRecord[];
  settlement?: Settlement;
  report?: EventReport;
  attachments?: {
    id: string;
    name: string;
    size: string;
    type: string;
    category: 'TIMELINE' | 'BUDGET' | 'OTHER';
    date: string;
  }[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  targetRole?: UserRole;
  eventId?: string;
  title: string;
  content: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ACTION_REQUIRED';
  isRead: boolean;
  createdAt: string;
  linkUrl: string;
}
