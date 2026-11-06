import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filterApprovalQueueEvents } from './approvalQueueFilter';
import {
  buildEventBookingPayload,
  validateDraftBasics,
  validateEventBasics,
  validateResources,
  validateScheduleItems,
  validateScheduleStep,
  validateBudgetSubmission,
} from './eventCreateValidation';

describe('event creation validation', () => {
  const now = new Date('2030-01-01T00:00:00.000Z');
  const validForm = {
    title: 'Hội thảo DUE',
    objectives: 'Tổ chức hội thảo chuyên môn',
    organizingUnit: 'Khoa Quản trị',
    targetAudience: 'Sinh viên Khoa Quản trị',
    expectedAttendees: 50,
    contactEmail: 'contact@example.edu.vn',
    contactPhone: '0901234567',
    startDate: '2030-01-02T08:00',
    endDate: '2030-01-02T11:00',
  };

  it('reports exact fields missing, including whitespace-only values', () => {
    const errors = validateEventBasics({
      ...validForm,
      title: '   ',
      organizingUnit: '\t ',
    }, now);
    assert.deepEqual(Object.keys(errors).sort(), ['organizingUnit', 'title']);
    assert.equal(errors.title, 'Vui lòng nhập tên sự kiện');
  });

  it('accepts a valid submission form and rejects malformed contact email', () => {
    assert.deepEqual(validateEventBasics(validForm, now), {});
    assert.ok(validateEventBasics({ ...validForm, contactEmail: 'sinh vien@example.edu.vn' }, now).contactEmail);
  });

  it('rejects event times in the past using the backend submission rule', () => {
    const errors = validateEventBasics({
      ...validForm,
      startDate: '2029-12-31T23:59',
      endDate: '2030-01-02T11:00',
    }, now);
    assert.equal(errors.startDate, 'Thời gian bắt đầu không được ở trong quá khứ');
  });

  it('allows incomplete fields on a draft but still requires database identity fields', () => {
    assert.deepEqual(validateDraftBasics({ title: 'Bản nháp', organizingUnit: 'CLB' }), {});
    assert.ok(validateDraftBasics({ title: '', organizingUnit: '' }).title);
  });

  it('requires a real venue for submission and accepts no optional equipment selections', () => {
    assert.equal(validateResources('', [], 20, [], [], true).facility, 'Vui lòng chọn địa điểm tổ chức');
    assert.deepEqual(validateResources('', [], 20, [], [], false), {});
  });

  it('builds booking payloads only from selected valid facility and equipment IDs using event times', () => {
    const booking = buildEventBookingPayload(
      'hall-1',
      [{ id: 'hall-1', name: 'Hội trường' }],
      '2030-01-02T08:00:00.000Z',
      '2030-01-02T11:00:00.000Z',
      [{ equipmentId: '', quantity: 1 }, { equipmentId: 'projector-1', quantity: 2 }],
      [{ id: 'projector-1', name: 'Máy chiếu', availableQuantity: 3 }]
    );
    assert.deepEqual(booking, {
      facilityId: 'hall-1',
      facilityName: 'Hội trường',
      startTime: '2030-01-02T08:00:00.000Z',
      endTime: '2030-01-02T11:00:00.000Z',
      equipmentItems: [{ equipmentId: 'projector-1', equipmentName: 'Máy chiếu', quantity: 2 }],
    });
    assert.equal(buildEventBookingPayload('', [], undefined, undefined, [], []), null);
    assert.equal(buildEventBookingPayload('missing', [{ id: 'hall-1', name: 'Hội trường' }], 'start', 'end', [], []), null);
  });

  it('places submitted faculty-review events in the BCN Khoa queue only', () => {
    const events = [
      { id: 'submitted', status: 'FACULTY_REVIEW' },
      { id: 'draft', status: 'DRAFT' },
      { id: 'university', status: 'UNIVERSITY_REVIEW' },
    ];
    assert.deepEqual(filterApprovalQueueEvents(events, 'BCN_KHOA'), [events[0]]);
    assert.deepEqual(filterApprovalQueueEvents(events, 'BTC'), []);
  });

  it('does not accept an invalid selected equipment ID or an empty schedule without attachment', () => {
    assert.ok(validateResources('hall-1', [{ id: 'hall-1', name: 'Hội trường' }], 20,
      [{ equipmentId: '', quantity: 1 }], [], true).equipment);
    assert.ok(validateScheduleItems([]).schedule);
  });

  it('accepts a valid timeline attachment without manual items for both step navigation and submission', () => {
    assert.deepEqual(validateScheduleStep([], true, false), {});
    assert.deepEqual(validateScheduleStep([], true, true), {});
    assert.deepEqual(validateScheduleStep([{ timeSlot: '08:00', activity: 'Khai mạc' }], false, true), {});
    assert.ok(validateScheduleStep([{ timeSlot: '', activity: 'Khai mạc' }], true, false).schedule);
  });

  it('allows submission when valid budget attachment is uploaded without manual items', () => {
    assert.deepEqual(validateBudgetSubmission([], true), {});
    assert.deepEqual(validateBudgetSubmission([], false), {});
    assert.deepEqual(validateBudgetSubmission([{ itemName: 'Nước', quantity: 2, unitPrice: 1000 }], true), {});
    assert.ok(validateBudgetSubmission([{ itemName: '', quantity: 2, unitPrice: 1000 }], true).budget);
  });
});
