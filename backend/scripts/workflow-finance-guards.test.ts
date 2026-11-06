import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertSettlementReadyForApproval } from '../src/services/settlement.service';
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
});
