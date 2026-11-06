import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canEditEvent, getEventResubmissionTarget } from '../src/services/eventEditPolicy';

describe('event edit authorization policy', () => {
  it('lets the owning BTC edit drafts and reviewer-returned events only', () => {
    for (const status of [
      'DRAFT',
      'FACULTY_REVISION_REQUESTED',
      'UNIVERSITY_REVISION_REQUESTED',
      'BUDGET_REVISION_REQUESTED',
      'FACILITY_CONFLICT',
      'FACILITY_REVISION_REQUESTED',
    ]) {
      assert.equal(canEditEvent(status, 'btc-1', 'btc-1', 'BTC'), true);
      assert.equal(canEditEvent(status, 'btc-2', 'btc-1', 'BTC'), false);
      assert.equal(canEditEvent(status, 'btc-1', 'reviewer-1', 'BCN_KHOA'), false);
    }
  });

  it('keeps rejected and terminal events closed to BTC while preserving the admin override capability', () => {
    for (const status of ['FACULTY_REJECTED', 'UNIVERSITY_REJECTED', 'CANCELLED', 'COMPLETED']) {
      assert.equal(canEditEvent(status, 'btc-1', 'btc-1', 'BTC'), false);
      assert.equal(canEditEvent(status, 'btc-1', 'admin-1', 'ADMIN'), true);
    }
  });

  it('returns the exact resubmission stage for every revision state', () => {
    assert.equal(getEventResubmissionTarget('FACULTY_REVISION_REQUESTED'), 'FACULTY_REVIEW');
    assert.equal(getEventResubmissionTarget('UNIVERSITY_REVISION_REQUESTED'), 'UNIVERSITY_REVIEW');
    assert.equal(getEventResubmissionTarget('BUDGET_REVISION_REQUESTED'), 'BUDGET_REVIEW');
    assert.equal(getEventResubmissionTarget('FACILITY_CONFLICT'), 'FACILITY_REVIEW');
    assert.equal(getEventResubmissionTarget('FACILITY_REVISION_REQUESTED'), 'FACILITY_REVIEW');
    assert.equal(getEventResubmissionTarget('DRAFT'), null);
  });
});
