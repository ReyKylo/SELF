-- SELF Career Outreach: three more relationship stages for the per-company LinkedIn board
-- (docs/design/HUNT_OUTREACH_PLAN.md §3). Additive: widens the CHECK only; existing rows keep their values.
-- 'reached_out' keeps its meaning ("messaged them") and is shown as Approached.
ALTER TABLE public.career_people DROP CONSTRAINT IF EXISTS career_people_relationship_stage_check;
ALTER TABLE public.career_people ADD CONSTRAINT career_people_relationship_stage_check
  CHECK (relationship_stage IN ('new','connect_sent','connected','reached_out','in_conversation','maintain','no_reply'));
