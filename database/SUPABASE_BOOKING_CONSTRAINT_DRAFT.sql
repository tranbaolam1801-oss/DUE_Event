-- DRAFT: apply only after compatibility schema approval, backup and overlap audit.
-- Extension installation and constraint creation require separate approval.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE my_due."ResourceBooking"
  ADD CONSTRAINT "ResourceBooking_valid_interval" CHECK ("startTime" < "endTime");
-- Protect every write path, including workflow bulk confirmation.
ALTER TABLE my_due."ResourceBooking"
  ADD CONSTRAINT "ResourceBooking_no_overlap"
  EXCLUDE USING gist (
    "facilityId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  ) WHERE ("status" IN ('PENDING', 'TENTATIVE', 'CONFIRMED'));
COMMIT;
-- If existing overlaps exist, this fails; never delete bookings to force it through.
