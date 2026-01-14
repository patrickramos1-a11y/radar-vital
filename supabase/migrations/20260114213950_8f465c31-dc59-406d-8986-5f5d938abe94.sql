-- Fix RLS policies to allow public access (app uses local user selection, not Supabase auth)

-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Authenticated users can read clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

CREATE POLICY "Anyone can read clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Anyone can insert clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update clients" ON clients FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete clients" ON clients FOR DELETE USING (true);

-- Fix tasks table
DROP POLICY IF EXISTS "Authenticated users can read tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON tasks;

CREATE POLICY "Anyone can read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tasks" ON tasks FOR DELETE USING (true);

-- Fix client_comments table
DROP POLICY IF EXISTS "Authenticated users can read comments" ON client_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON client_comments;
DROP POLICY IF EXISTS "Authenticated users can update comments" ON client_comments;
DROP POLICY IF EXISTS "Authenticated users can delete comments" ON client_comments;

CREATE POLICY "Anyone can read comments" ON client_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert comments" ON client_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update comments" ON client_comments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete comments" ON client_comments FOR DELETE USING (true);

-- Fix activity_logs table
DROP POLICY IF EXISTS "Authenticated users can read activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert activity_logs" ON activity_logs;

CREATE POLICY "Anyone can read activity_logs" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert activity_logs" ON activity_logs FOR INSERT WITH CHECK (true);

-- Fix demands table
DROP POLICY IF EXISTS "Authenticated users can read demands" ON demands;
DROP POLICY IF EXISTS "Authenticated users can insert demands" ON demands;
DROP POLICY IF EXISTS "Authenticated users can update demands" ON demands;
DROP POLICY IF EXISTS "Authenticated users can delete demands" ON demands;

CREATE POLICY "Anyone can read demands" ON demands FOR SELECT USING (true);
CREATE POLICY "Anyone can insert demands" ON demands FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update demands" ON demands FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete demands" ON demands FOR DELETE USING (true);

-- Fix licenses table
DROP POLICY IF EXISTS "Authenticated users can read licenses" ON licenses;
DROP POLICY IF EXISTS "Authenticated users can insert licenses" ON licenses;
DROP POLICY IF EXISTS "Authenticated users can update licenses" ON licenses;
DROP POLICY IF EXISTS "Authenticated users can delete licenses" ON licenses;

CREATE POLICY "Anyone can read licenses" ON licenses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert licenses" ON licenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update licenses" ON licenses FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete licenses" ON licenses FOR DELETE USING (true);

-- Fix processes table
DROP POLICY IF EXISTS "Authenticated users can read processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can insert processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can update processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can delete processes" ON processes;

CREATE POLICY "Anyone can read processes" ON processes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert processes" ON processes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update processes" ON processes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete processes" ON processes FOR DELETE USING (true);