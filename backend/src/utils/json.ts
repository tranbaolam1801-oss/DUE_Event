/** Preserve bigint identifiers exactly; Date and Decimal use their own JSON methods. */
export function databaseJsonReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}
