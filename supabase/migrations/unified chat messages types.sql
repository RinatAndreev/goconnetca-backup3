-- ============================================================
-- Migration: Unified Chat + Offer System
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add message_type column to distinguish text vs offer cards
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text'
  CHECK (message_type IN ('text', 'offer'));

-- 2. Make content nullable (offer messages don't have text content)
ALTER TABLE public.messages
  ALTER COLUMN content DROP NOT NULL;

-- 3. Allow brands to also update messages (needed for reading offer status updates)
--    The existing UPDATE policy only allows to_user_id, which is fine for is_read.
--    Projects table already has update policy for both participants.

-- 4. Index for fast filtering conversations with offers
CREATE INDEX IF NOT EXISTS messages_message_type_idx ON public.messages(message_type);
CREATE INDEX IF NOT EXISTS messages_project_id_idx ON public.messages(project_id);

-- That's it! The messages table already has project_id and listing_id columns.
-- The projects table already has all needed columns.
-- No structural changes needed beyond these two column changes.