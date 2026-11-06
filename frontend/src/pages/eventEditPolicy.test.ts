import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canEditEvent, getEventResubmissionAction, latestRevisionRequest } from './eventEditPolicy';

describe('event edit authorization and resubmission policy', () => {
  it('allows BTC to edit their own draft and revision requests, but not another owner’s event', () => {
    for (const status of ['DRAFT', 'FACULTY_REVISION_REQUESTED', 'UNIVERSITY_REVISION_REQUESTED', 'BUDGET_REVISION_REQUESTED'] as const) {
      assert.equal(canEditEvent(status, 'btc-1', 'btc-1', 'BTC'), true);
      assert.equal(canEditEvent(status, 'btc-2', 'btc-1', 'BTC'), false);
    }
  });

  it('keeps final, rejected, cancelled, and completed events closed to BTC but allows admin override', () => {
    for (const status of ['FACULTY_REJECTED', 'UNIVERSITY_REJECTED', 'CANCELLED', 'COMPLETED'] as const) {
      assert.equal(canEditEvent(status, 'btc-1', 'btc-1', 'BTC'), false);
      assert.equal(canEditEvent(status, 'btc-1', 'admin', 'ADMIN'), true);
    }
  });

  it('resubmits to the review level that requested changes', () => {
    assert.deepEqual(getEventResubmissionAction('FACULTY_REVISION_REQUESTED'), { action: 'RESUBMIT', target: 'FACULTY_REVIEW' });
    assert.deepEqual(getEventResubmissionAction('UNIVERSITY_REVISION_REQUESTED'), { action: 'RESUBMIT', target: 'UNIVERSITY_REVIEW' });
    assert.deepEqual(getEventResubmissionAction('BUDGET_REVISION_REQUESTED'), { action: 'RESUBMIT', target: 'BUDGET_REVIEW' });
    assert.deepEqual(getEventResubmissionAction('FACILITY_REVISION_REQUESTED'), { action: 'ADJUST', target: 'FACILITY_REVIEW' });
  });

  it('shows the latest request for revision without discarding earlier audit entries', () => {
    const history = [
      { action: 'UPDATE', toStatus: 'FACULTY_REVISION_REQUESTED' },
      { action: 'REQUEST_REVISION', toStatus: 'UNIVERSITY_REVISION_REQUESTED' },
      { action: 'APPROVE', toStatus: 'UNIVERSITY_REVIEW' },
    ];
    assert.equal(latestRevisionRequest(history), history[1]);
  });
});
