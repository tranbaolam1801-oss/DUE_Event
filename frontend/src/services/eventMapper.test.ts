import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapEvent } from './eventMapper';

describe('event history mapping', () => {
  it('uses approval decisions when workflow history is empty', () => {
    const mapped = mapEvent({
      id: 'event-1',
      workflowHistory: [],
      approvalDecisions: [{
        id: 'decision-1',
        stage: 'FACULTY_REVIEW',
        decision: 'APPROVED',
        decidedById: 'user-1',
        decidedBy: { fullName: 'Nguyễn Văn A', role: 'BCN_KHOA' },
        createdAt: '2026-11-06T08:00:00.000Z',
      }],
    });

    assert.equal(mapped.history.length, 1);
    assert.equal(mapped.history[0].action, 'APPROVED');
    assert.equal(mapped.history[0].actorName, 'Nguyễn Văn A');
    assert.equal(mapped.history[0].timestamp, '2026-11-06T08:00:00.000Z');
  });

  it('prefers workflow history to avoid duplicating recorded decisions', () => {
    const mapped = mapEvent({
      id: 'event-1',
      workflowHistory: [{
        id: 'history-1',
        action: 'APPROVE',
        createdAt: '2026-11-06T08:00:00.000Z',
      }],
      approvalDecisions: [{ id: 'decision-1', decision: 'APPROVED' }],
    });

    assert.deepEqual(mapped.history.map((item) => item.id), ['history-1']);
  });
});
