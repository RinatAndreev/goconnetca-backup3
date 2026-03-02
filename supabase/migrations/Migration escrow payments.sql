-- ================================================================
-- Migration: Escrow Payment System
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. Add new columns to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_amount_cents       INTEGER,
  ADD COLUMN IF NOT EXISTS payment_status            TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  ADD COLUMN IF NOT EXISTS deliverable_url           TEXT,
  ADD COLUMN IF NOT EXISTS deliverable_note          TEXT,
  ADD COLUMN IF NOT EXISTS completed_at              TIMESTAMPTZ;

-- 2. Update status CHECK constraint to include new lifecycle statuses
--    Drop existing constraint if it exists, then add the new one
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

-- New valid statuses:
--   pending              → offer sent by brand
--   waiting_for_payment  → influencer accepted, brand must pay
--   active               → funds held (stripe paid), work in progress
--   in_review            → influencer submitted deliverable
--   completed            → brand approved, funds released
--   disputed             → either party raised a dispute
--   canceled             → canceled by either party
ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN (
    'pending',
    'waiting_for_payment',
    'active',
    'in_review',
    'completed',
    'disputed',
    'canceled'
  ));

-- 3. Index for Stripe lookups (webhook needs this)
CREATE INDEX IF NOT EXISTS projects_stripe_pi_idx
  ON public.projects(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- 4. Index for payment status filtering
CREATE INDEX IF NOT EXISTS projects_payment_status_idx
  ON public.projects(payment_status);

-- ================================================================
-- NOTE: Existing projects with status 'accepted' or 'ongoing'
-- will need to be manually migrated or will just show as-is.
-- The UI handles legacy statuses gracefully.
-- ================================================================