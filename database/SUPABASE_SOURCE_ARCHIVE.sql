-- Pending approval. Preserve original rows, including Username and unmapped fields.
BEGIN;
CREATE TABLE my_due."LegacySourceArchive" (
  "entity" text NOT NULL,
  "legacyId" bigint NOT NULL,
  "source" jsonb NOT NULL,
  "importedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("entity", "legacyId"),
  FOREIGN KEY ("entity", "legacyId") REFERENCES my_due."LegacyIdentityMap" ("entity", "legacyId")
);
ALTER TABLE my_due."LegacySourceArchive" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON my_due."LegacySourceArchive" FROM PUBLIC;
COMMIT;
