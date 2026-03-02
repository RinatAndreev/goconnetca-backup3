/*
  # Add Messages and Projects Tables

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `from_user_id` (uuid, foreign key to auth.users)
      - `to_user_id` (uuid, foreign key to auth.users)
      - `listing_id` (uuid, foreign key to listings, nullable)
      - `project_id` (uuid, foreign key to projects, nullable)
      - `content` (text)
      - `is_read` (boolean, default false)
      - `created_at` (timestamptz)
    
    - `projects`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, foreign key to listings)
      - `brand_user_id` (uuid, foreign key to auth.users)
      - `influencer_user_id` (uuid, foreign key to auth.users)
      - `selected_offers` (jsonb) - array of selected offer objects
      - `description` (text)
      - `offered_amount` (decimal)
      - `status` (text) - 'pending', 'accepted', 'ongoing', 'completed', 'canceled'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can read messages where they are sender or receiver
    - Users can send messages to any authenticated user
    - Brands can create project requests
    - Users can view projects they are involved in
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  listing_id uuid,
  project_id uuid,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  brand_user_id uuid NOT NULL,
  influencer_user_id uuid NOT NULL,
  selected_offers jsonb NOT NULL DEFAULT '[]',
  description text NOT NULL,
  offered_amount decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE messages 
  ADD CONSTRAINT messages_listing_fkey 
  FOREIGN KEY (listing_id) 
  REFERENCES listings(id) 
  ON DELETE SET NULL;

ALTER TABLE messages 
  ADD CONSTRAINT messages_project_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE SET NULL;

ALTER TABLE projects 
  ADD CONSTRAINT projects_listing_fkey 
  FOREIGN KEY (listing_id) 
  REFERENCES listings(id) 
  ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Messages Policies
CREATE POLICY "Users can view their own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their received messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- Projects Policies
CREATE POLICY "Users can view their own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = brand_user_id OR auth.uid() = influencer_user_id);

CREATE POLICY "Brands can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = brand_user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.account_type = 'brand'
    )
  );

CREATE POLICY "Project participants can update"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = brand_user_id OR auth.uid() = influencer_user_id)
  WITH CHECK (auth.uid() = brand_user_id OR auth.uid() = influencer_user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS messages_from_user_idx ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS messages_to_user_idx ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS projects_brand_user_idx ON projects(brand_user_id);
CREATE INDEX IF NOT EXISTS projects_influencer_user_idx ON projects(influencer_user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
