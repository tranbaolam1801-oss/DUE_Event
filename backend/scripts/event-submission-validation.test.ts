import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createEventSchema } from '../src/schemas/event.schema';
import { validateEventSubmission } from '../src/services/eventSubmissionValidation';

describe('event draft and submission validation', () => {
  const validEvent = {
    title: 'Hội thảo DUE',
    organizingUnit: 'Khoa Quản trị',
    objectives: 'Tổ chức hội thảo chuyên môn',
    targetAudience: 'Sinh viên Khoa Quản trị',
    contactEmail: 'contact@example.edu.vn',
    contactPhone: '0901234567',
    expectedAttendees: 50,
    startDate: new Date('2030-01-02T08:00:00Z'),
    endDate: new Date('2030-01-02T11:00:00Z'),
    scheduleItems: [{ timeSlot: '08:00', activity: 'Khai mạc' }],
    budgetItems: [],
    resourceBookings: [{ facilityId: 'hall-1', facility: { isActive: true } }],
  };

  it('accepts a minimal draft without submission-only fields', () => {
    assert.equal(createEventSchema.safeParse({ title: 'Bản nháp', organizingUnit: 'CLB' }).success, true);
  });

  it('rejects whitespace-only required draft fields with Vietnamese field messages', () => {
    const result = createEventSchema.safeParse({ title: '   ', organizingUnit: '\t ' });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.deepEqual(result.error.issues.map((issue) => issue.message), [
        'Vui lòng nhập tên sự kiện',
        'Vui lòng nhập đơn vị tổ chức',
      ]);
    }
  });

  it('names the exact empty venue and equipment IDs rejected by the old API', () => {
    const result = createEventSchema.safeParse({
      title: 'Hội thảo DUE',
      organizingUnit: 'Khoa Quản trị',
      booking: {
        facilityId: '',
        startTime: '2030-01-02T08:00:00.000Z',
        endTime: '2030-01-02T11:00:00.000Z',
        equipmentItems: [{ equipmentId: '', quantity: 1 }],
      },
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.deepEqual(result.error.issues.map((issue) => issue.message), [
        'Vui lòng chọn địa điểm tổ chức',
        'Vui lòng chọn thiết bị hợp lệ',
      ]);
    }
  });

  it('accepts complete submissions and reports only the missing fields', () => {
    assert.deepEqual(validateEventSubmission(validEvent, new Date('2030-01-01T00:00:00Z')), []);
    const issues = validateEventSubmission({
      ...validEvent,
      objectives: '   ',
      resourceBookings: [],
    }, new Date('2030-01-01T00:00:00Z'));
    assert.deepEqual(issues.map((issue) => issue.field), ['objectives', 'booking.facilityId']);
  });

  it('accepts submission with empty scheduleItems if timeline attachment is present', () => {
    const issues = validateEventSubmission({
      ...validEvent,
      scheduleItems: [],
      attachments: [{ category: 'TIMELINE' }],
    }, new Date('2030-01-01T00:00:00Z'));
    assert.deepEqual(issues, []);
  });

  it('requires participant audience and valid contact details before submission', () => {
    const issues = validateEventSubmission({
      ...validEvent,
      targetAudience: ' ',
      contactEmail: 'not-an-email',
      contactPhone: '',
    }, new Date('2030-01-01T00:00:00Z'));
    assert.deepEqual(issues.map((issue) => issue.field), ['targetAudience', 'contactEmail', 'contactPhone']);
  });
});
