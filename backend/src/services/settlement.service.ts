import prisma from '../config/database';
import { assertAttachmentObjectExists } from './storage.service';
import { EventStatus } from '../types';

type SettlementItemInput = {
  id?: string;
  itemName: string;
  category?: string | null;
  budgetedAmount: number;
  actualAmount: number;
  notes?: string | null;
};

function validateItems(items: SettlementItemInput[]) {
  if (!Array.isArray(items)) throw new Error('Danh sách khoản chi không hợp lệ');
  for (const item of items) {
    if (!item.itemName?.trim()) throw new Error('Tên khoản chi không được để trống');
    if (!Number.isFinite(item.budgetedAmount) || item.budgetedAmount < 0 ||
      !Number.isFinite(item.actualAmount) || item.actualAmount < 0) {
      throw new Error('Số tiền khoản chi phải là số hợp lệ và không âm');
    }
  }
}

function parseSettlementDate(value?: string | null) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Ngày quyết toán không hợp lệ');
  return date;
}

export function assertSettlementReadyForApproval(settlement: {
  settlementDate: Date | null;
  items: Array<{ itemName: string; budgetedAmount: number; actualAmount: number }>;
  documents: Array<{ isVerified: boolean }>;
}) {
  if (!settlement.settlementDate) throw new Error('Cần nhập ngày quyết toán trước khi KHTC phê duyệt');
  if (!settlement.items.length) throw new Error('Cần ít nhất một khoản mục chi');
  if (settlement.items.some((item) => !item.itemName.trim() || item.budgetedAmount < 0 || item.actualAmount < 0)) {
    throw new Error('Thông tin khoản chi chưa hợp lệ');
  }
  const budgetedTotal = settlement.items.reduce((total, item) => total + item.budgetedAmount, 0);
  const actualTotal = settlement.items.reduce((total, item) => total + item.actualAmount, 0);
  if (actualTotal > budgetedTotal) {
    throw new Error('Tổng thực chi vượt dự toán; cần điều chỉnh và được phê duyệt dự toán trước khi quyết toán');
  }
  if (!settlement.documents.length) throw new Error('Cần đính kèm ít nhất một chứng từ tài chính');
  if (settlement.documents.some((document) => !document.isVerified)) {
    throw new Error('KHTC cần xác nhận hợp lệ tất cả chứng từ trước khi hoàn tất quyết toán');
  }
}

export function assertSettlementReadyForSubmission(settlement: {
  settlementDate: Date | null;
  items: Array<{ itemName: string }>;
  documents?: Array<{ fileName?: string | null; filePath?: string | null; documentType?: string | null }>;
}) {
  if (!settlement.settlementDate) throw new Error('Cần nhập ngày quyết toán trước khi nộp');
  if (!settlement.items.length || settlement.items.some((item) => !item.itemName.trim())) {
    throw new Error('Cần nhập ít nhất một khoản chi hợp lệ');
  }
}

export function canUploadSettlementDocuments(settlementStatus: string, eventStatus: string): boolean {
  return ['DRAFT', 'REVISION_REQUESTED', 'REJECTED'].includes(settlementStatus) ||
    (settlementStatus === 'SUBMITTED' && eventStatus === EventStatus.FINANCE_REVIEW);
}

export async function assertSettlementDocumentFilesExist(settlement: {
  documents: Array<{ fileName?: string | null; filePath?: string | null; documentType?: string | null }>;
}) {
  if (!settlement.documents.length) {
    throw new Error('Chưa có chứng từ tài chính được lưu. Tệp trong mục “Hồ sơ đính kèm” không thay thế chứng từ tại “Quyết toán → Chứng từ và hóa đơn”.');
  }
  for (const document of settlement.documents) {
    if (!document.filePath || !document.fileName || !document.documentType) {
      throw new Error('Chứng từ tài chính chưa có tệp lưu bền vững. Hãy tải lại chứng từ trong mục “Quyết toán → Chứng từ và hóa đơn”.');
    }
    await assertAttachmentObjectExists(document.filePath);
  }
}

export async function createSettlement(data: {
  eventId: string;
  items?: SettlementItemInput[];
  totalActual?: number;
  settlementDate?: string | null;
  notes?: string | null;
}, userId: string) {
  const items = data.items || [];
  validateItems(items);
  if (data.totalActual !== undefined && (!Number.isFinite(data.totalActual) || data.totalActual < 0)) {
    throw new Error('Tổng kinh phí thực tế phải là số hợp lệ và không âm');
  }
  if (data.totalActual !== undefined && Math.abs(data.totalActual - items.reduce((sum, item) => sum + item.actualAmount, 0)) >= 0.01) {
    throw new Error('Tổng kinh phí thực tế phải bằng tổng các khoản chi chi tiết');
  }
  const existing = await prisma.settlement.findFirst({ where: { eventId: data.eventId } });
  if (existing) {
    throw new Error('Hồ sơ quyết toán cho sự kiện này đã được tạo');
  }

  const totalBudgeted = items.reduce((s, i) => s + i.budgetedAmount, 0);
  const totalActual = items.reduce((s, i) => s + i.actualAmount, 0);
  const difference = totalActual - totalBudgeted;

  return prisma.settlement.create({
    data: {
      eventId: data.eventId,
      totalBudgeted,
      totalActual,
      difference,
      status: 'DRAFT',
      submittedById: userId,
      settlementDate: parseSettlementDate(data.settlementDate),
      notes: data.notes,
      items: {
        create: items.map((item) => ({
          itemName: item.itemName.trim(),
          category: item.category,
          budgetedAmount: item.budgetedAmount,
          actualAmount: item.actualAmount,
          difference: item.actualAmount - item.budgetedAmount,
          notes: item.notes,
        })),
      },
    },
    include: { items: true, documents: true },
  });
}

export async function updateSettlement(id: string, data: {
  items?: SettlementItemInput[];
  totalActual?: number;
  settlementDate?: string | null;
  notes?: string | null;
}) {
  const settlement = await prisma.settlement.findUnique({ where: { id }, include: { items: true } });
  if (!settlement) throw new Error('Không tìm thấy bản ghi quyết toán');
  if (data.totalActual !== undefined && (!Number.isFinite(data.totalActual) || data.totalActual < 0)) {
    throw new Error('Tổng kinh phí thực tế phải là số hợp lệ và không âm');
  }
  if (!['DRAFT', 'REVISION_REQUESTED', 'REJECTED'].includes(settlement.status)) {
    throw new Error('Chỉ có thể chỉnh sửa hồ sơ quyết toán ở trạng thái Bản nháp, Yêu cầu chỉnh sửa hoặc Bị từ chối');
  }
  if (data.items) {
    validateItems(data.items);
    if (data.totalActual !== undefined &&
      Math.abs(data.totalActual - data.items.reduce((sum, item) => sum + item.actualAmount, 0)) >= 0.01) {
      throw new Error('Tổng kinh phí thực tế phải bằng tổng các khoản chi chi tiết');
    }
    const suppliedIds = new Set(data.items.flatMap((item) => item.id ? [item.id] : []));
    if (settlement.items.some((item) => !suppliedIds.has(item.id))) {
      throw new Error('Không thể bỏ hoặc xóa khoản chi đã lưu');
    }
    if (data.items.some((item) => item.id && !settlement.items.some((existing) => existing.id === item.id))) {
      throw new Error('Khoản chi không thuộc hồ sơ quyết toán này');
    }
  }
  const actualFromItems = (data.items || settlement.items).reduce((sum, item) => sum + item.actualAmount, 0);
  if (data.totalActual !== undefined && Math.abs(data.totalActual - actualFromItems) >= 0.01) {
    throw new Error('Tổng kinh phí thực tế phải bằng tổng các khoản chi chi tiết');
  }

  return prisma.$transaction(async (tx) => {
    if (data.items) {
      for (const item of data.items) {
        const values = {
          itemName: item.itemName.trim(),
          category: item.category,
          budgetedAmount: item.budgetedAmount,
          actualAmount: item.actualAmount,
          difference: item.actualAmount - item.budgetedAmount,
          notes: item.notes,
        };
        if (item.id) {
          await tx.settlementItem.update({ where: { id: item.id }, data: values });
        } else {
          await tx.settlementItem.create({ data: { settlementId: id, ...values } });
        }
      }

      const totalBudgeted = data.items.reduce((s, i) => s + i.budgetedAmount, 0);
      const totalActual = data.items.reduce((s, i) => s + i.actualAmount, 0);
      const difference = totalActual - totalBudgeted;

      return tx.settlement.update({
        where: { id },
        data: {
          totalBudgeted,
          totalActual,
          difference,
          settlementDate: parseSettlementDate(data.settlementDate),
          notes: data.notes,
        },
        include: { items: true, documents: true },
      });
    }

    return tx.settlement.update({
      where: { id },
      data: {
        totalActual: actualFromItems,
        difference: actualFromItems - settlement.totalBudgeted,
        settlementDate: parseSettlementDate(data.settlementDate),
        notes: data.notes,
      },
      include: { items: true, documents: true },
    });
  });
}

export async function submitSettlement(id: string, userId: string, userRole: string) {
  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: { items: true, documents: true, event: true },
  });
  if (!settlement) throw new Error('Không tìm thấy quyết toán');
  if (userRole === 'BTC' && settlement.event.createdById !== userId) {
    throw new Error('Ban Tổ chức chỉ được nộp chứng từ cho hồ sơ do mình phụ trách');
  }
  if (!['BTC', 'ADMIN'].includes(userRole)) {
    throw new Error('Không có quyền nộp chứng từ tài chính');
  }
  if (![EventStatus.FINANCE_DOCUMENTS_PENDING, EventStatus.FINANCE_REVISION_REQUESTED, EventStatus.PAYMENT_REJECTED].includes(settlement.event.status as EventStatus)) {
    throw new Error('Hồ sơ chưa ở bước nộp hoặc nộp lại chứng từ tài chính');
  }
  if (!['DRAFT', 'REVISION_REQUESTED', 'REJECTED'].includes(settlement.status)) {
    throw new Error('Hồ sơ quyết toán đã được nộp hoặc không còn ở trạng thái chỉnh sửa');
  }
  assertSettlementReadyForSubmission(settlement);

  return prisma.$transaction(async (tx) => {
    const changed = await tx.event.updateMany({
      where: {
        id: settlement.eventId,
        status: settlement.event.status,
        currentVersion: settlement.event.currentVersion,
      },
      data: {
        status: 'FINANCE_REVIEW',
        settlementStatus: 'SUBMITTED',
        currentVersion: { increment: 1 },
      },
    });
    if (!changed.count) throw new Error('Hồ sơ đã thay đổi trên máy khác. Hãy tải lại trước khi nộp.');

    const updated = await tx.settlement.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedById: userId,
      },
    });

    await tx.workflowHistory.create({
      data: {
        eventId: settlement.eventId,
        fromStatus: settlement.event.status,
        toStatus: 'FINANCE_REVIEW',
        action: 'SUBMIT_DOCUMENTS',
        actorId: userId,
        actorRole: userRole,
        comments: settlement.documents.length
          ? 'Nộp quyết toán tài chính'
          : 'Nộp quyết toán — Chưa đính kèm chứng từ; cần bổ sung trước khi KHTC phê duyệt',
      },
    });

    return updated;
  });
}

export async function reviewSettlement(id: string, decision: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED', notes: string, userId: string) {
  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: { event: true, items: true, documents: true },
  });
  if (!settlement) throw new Error('Không tìm thấy quyết toán');
  if (settlement.event.status !== 'FINANCE_REVIEW') {
    throw new Error('Hồ sơ chưa ở bước KHTC kiểm tra quyết toán');
  }
  if (decision === 'APPROVED' && !['SUBMITTED', 'DRAFT'].includes(settlement.status)) {
    throw new Error('Hồ sơ quyết toán chưa được nộp cho KHTC');
  }
  if (decision === 'APPROVED') {
    assertSettlementReadyForApproval(settlement);
    await assertSettlementDocumentFilesExist(settlement);
  }

  const newStatus = decision === 'APPROVED' ? 'APPROVED' : decision === 'REVISION_REQUESTED' ? 'REVISION_REQUESTED' : 'REJECTED';
  const newEventStatus = decision === 'APPROVED' ? 'FINANCE_APPROVAL_PENDING' : decision === 'REVISION_REQUESTED' ? 'FINANCE_REVISION_REQUESTED' : 'PAYMENT_REJECTED';

  return prisma.$transaction(async (tx) => {
    const updated = await tx.settlement.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedById: userId,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
    });

    const changed = await tx.event.updateMany({
      where: { id: settlement.eventId, status: settlement.event.status, currentVersion: settlement.event.currentVersion },
      data: {
        status: newEventStatus,
        settlementStatus: newStatus,
        currentVersion: { increment: 1 },
      },
    });
    if (!changed.count) throw new Error('Hồ sơ đã thay đổi trên máy khác. Hãy tải lại.');

    await tx.workflowHistory.create({
      data: {
        eventId: settlement.eventId,
        fromStatus: settlement.event.status,
        toStatus: newEventStatus,
        action: `FINANCE_${decision}`,
        actorId: userId,
        actorRole: 'KHTC',
        comments: notes,
      },
    });

    return updated;
  });
}

export async function addFinancialDocument(settlementId: string, data: {
  documentType: string;
  documentNumber?: string;
  amount?: number;
  description?: string;
  fileName?: string;
  filePath?: string;
}) {
  return prisma.financialDocument.create({
    data: {
      settlementId,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      amount: data.amount,
      description: data.description,
      fileName: data.fileName,
      filePath: data.filePath,
      isVerified: false,
    },
  });
}

export async function uploadFinancialDocument(settlementId: string, data: {
  id?: string;
  uploaderId: string;
  documentType: string;
  documentNumber?: string;
  amount?: number;
  description?: string;
  fileName: string;
  filePath: string;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const document = await tx.financialDocument.create({
        data: {
          id: data.id,
          settlementId,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          amount: data.amount,
          description: data.description,
          fileName: data.fileName,
          filePath: data.filePath,
          isVerified: false,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: data.uploaderId,
          action: 'UPLOAD_FINANCIAL_DOCUMENT',
          entityType: 'FinancialDocument',
          entityId: document.id,
          newValue: JSON.stringify({ settlementId, fileName: data.fileName }),
        },
      });
      return document;
    });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code !== 'P2002' || !data.id) throw error;

    const existing = await prisma.financialDocument.findUnique({ where: { id: data.id } });
    if (existing?.settlementId === settlementId && existing.filePath === data.filePath) return existing;
    throw new Error('Mã yêu cầu tải chứng từ đã được sử dụng cho nội dung khác.');
  }
}

export async function verifyFinancialDocument(documentId: string, isVerified: boolean) {
  return prisma.financialDocument.update({
    where: { id: documentId },
    data: {
      isVerified,
      verifiedAt: isVerified ? new Date() : null,
    },
  });
}
