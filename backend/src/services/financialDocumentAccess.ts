import { UserRole } from '../types';

export function canViewFinancialDocuments(role: string, userId: string, eventOwnerId: string): boolean {
  return role === UserRole.ADMIN || role === UserRole.KHTC ||
    (role === UserRole.BTC && userId === eventOwnerId);
}

export function canUploadFinancialDocuments(role: string, userId: string, eventOwnerId: string): boolean {
  return role === UserRole.ADMIN || (role === UserRole.BTC && userId === eventOwnerId);
}
