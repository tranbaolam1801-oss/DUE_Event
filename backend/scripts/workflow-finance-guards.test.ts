import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertSettlementReadyForApproval,
  assertSettlementReadyForSubmission,
  canUploadSettlementDocuments,
} from '../src/services/settlement.service';
import { getAvailableActions } from '../src/services/workflow.service';
import { EventStatus, UserRole } from '../src/types';

describe('workflow and settlement guards', () => {
  it('does not allow completion before finance review and settlement', () => {
    assert.equal(getAvailableActions(EventStatus.REPORT_PENDING, UserRole.ADMIN).includes('COMPLETE'), false);
    assert.equal(getAvailableActions(EventStatus.FINANCE_DOCUMENTS_PENDING, UserRole.ADMIN).includes('COMPLETE'), false);
    assert.equal(getAvailableActions(EventStatus.SETTLED, UserRole.ADMIN).includes('COMPLETE'), true);
  });

  it('rejects spending above the budget during settlement approval', () => {
    assert.throws(() => assertSettlementReadyForApproval({
      settlementDate: new Date('2030-01-01T00:00:00Z'),
      items: [{ itemName: 'Chi phí sự kiện', budgetedAmount: 0, actualAmount: 29800000 }],
      documents: [{ isVerified: true }],
    }), /vượt dự toán/);
  });

  it('requires all attached documents to be verified before approval', () => {
    assert.throws(() => assertSettlementReadyForApproval({
      settlementDate: new Date('2030-01-01T00:00:00Z'),
      items: [{ itemName: 'Chi phí sự kiện', budgetedAmount: 100, actualAmount: 80 }],
      documents: [{ isVerified: false }],
    }), /xác nhận hợp lệ/);
  });

  it('allows financial submission with no documents while retaining non-document requirements', () => {
    assert.doesNotThrow(() => assertSettlementReadyForSubmission({
      settlementDate: new Date('2030-01-01T00:00:00Z'),
      items: [{ itemName: 'Chi phí sự kiện' }],
      documents: [],
    }));
    assert.throws(() => assertSettlementReadyForSubmission({
      settlementDate: null,
      items: [{ itemName: 'Chi phí sự kiện' }],
      documents: [],
    }), /ngày quyết toán/);
    assert.throws(() => assertSettlementReadyForSubmission({
      settlementDate: new Date('2030-01-01T00:00:00Z'),
      items: [],
      documents: [],
    }), /ít nhất một khoản chi/);
  });

  it('preserves one or multiple saved documents without making them required for submission', () => {
    for (const documents of [
      [{ documentType: 'INVOICE', fileName: 'one.pdf', filePath: 'supabase://private/one.pdf' }],
      [
        { documentType: 'INVOICE', fileName: 'one.pdf', filePath: 'supabase://private/one.pdf' },
        { documentType: 'RECEIPT', fileName: 'two.pdf', filePath: 'supabase://private/two.pdf' },
      ],
    ]) {
      const savedDocuments = documents.map((document) => ({ ...document }));
      assert.doesNotThrow(() => assertSettlementReadyForSubmission({
        settlementDate: new Date('2030-01-01T00:00:00Z'),
        items: [{ itemName: 'Chi phí sự kiện' }],
        documents,
      }));
      assert.deepEqual(documents, savedDocuments);
    }
  });

  it('does not allow KHTC approval until at least one document is attached and verified', () => {
    assert.throws(() => assertSettlementReadyForApproval({
      settlementDate: new Date('2030-01-01T00:00:00Z'),
      items: [{ itemName: 'Chi phí sự kiện', budgetedAmount: 100, actualAmount: 80 }],
      documents: [],
    }), /Cần đính kèm ít nhất một chứng từ tài chính/);
  });

  it('allows BTC to supplement documents while submitted to KHTC, but not after review moves on', () => {
    assert.equal(canUploadSettlementDocuments('SUBMITTED', EventStatus.FINANCE_REVIEW), true);
    assert.equal(canUploadSettlementDocuments('APPROVED', EventStatus.FINANCE_APPROVAL_PENDING), false);
  });
});
