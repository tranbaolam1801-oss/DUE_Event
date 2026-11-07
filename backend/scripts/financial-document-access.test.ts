import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canUploadFinancialDocuments, canViewFinancialDocuments } from '../src/services/financialDocumentAccess';
import { UserRole } from '../src/types';

test('financial document access follows role and event ownership', () => {
  const ownerId = 'btc-owner';
  const otherUserId = 'other-user';

  assert.equal(canUploadFinancialDocuments(UserRole.BTC, ownerId, ownerId), true);
  assert.equal(canUploadFinancialDocuments(UserRole.BTC, otherUserId, ownerId), false);
  assert.equal(canUploadFinancialDocuments(UserRole.KHTC, ownerId, ownerId), false);
  assert.equal(canUploadFinancialDocuments(UserRole.ADMIN, otherUserId, ownerId), true);

  assert.equal(canViewFinancialDocuments(UserRole.BTC, ownerId, ownerId), true);
  assert.equal(canViewFinancialDocuments(UserRole.BTC, otherUserId, ownerId), false);
  assert.equal(canViewFinancialDocuments(UserRole.KHTC, otherUserId, ownerId), true);
  assert.equal(canViewFinancialDocuments(UserRole.ADMIN, otherUserId, ownerId), true);
  assert.equal(canViewFinancialDocuments(UserRole.BCN_KHOA, otherUserId, ownerId), false);
  assert.equal(canViewFinancialDocuments(UserRole.DOAN_TRUONG, otherUserId, ownerId), false);
  assert.equal(canViewFinancialDocuments(UserRole.CSVC, otherUserId, ownerId), false);
});
