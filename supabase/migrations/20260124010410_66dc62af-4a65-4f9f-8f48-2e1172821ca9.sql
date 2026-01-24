-- Revert RLS policies to allow public access (app uses local user selection)

-- Drop all existing policies on clients
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;
DROP POLICY IF EXISTS "Anyone can read clients" ON clients;
DROP POLICY IF EXISTS "Anyone can insert clients" ON clients;
DROP POLICY IF EXISTS "Anyone can update clients" ON clients;
DROP POLICY IF EXISTS "Anyone can delete clients" ON clients;

-- Create permissive policies for clients
CREATE POLICY "Public read clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Public insert clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update clients" ON clients FOR UPDATE USING (true);
CREATE POLICY "Public delete clients" ON clients FOR DELETE USING (true);

-- Drop and recreate policies for activity_logs
DROP POLICY IF EXISTS "Authenticated users can view activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Anyone can read activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Anyone can insert activity_logs" ON activity_logs;

CREATE POLICY "Public read activity_logs" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Public insert activity_logs" ON activity_logs FOR INSERT WITH CHECK (true);

-- Drop and recreate policies for app_users
DROP POLICY IF EXISTS "Authenticated users can view app_users" ON app_users;
DROP POLICY IF EXISTS "Authenticated users can insert app_users" ON app_users;
DROP POLICY IF EXISTS "Anyone can read app_users" ON app_users;
DROP POLICY IF EXISTS "Anyone can insert app_users" ON app_users;

CREATE POLICY "Public read app_users" ON app_users FOR SELECT USING (true);
CREATE POLICY "Public insert app_users" ON app_users FOR INSERT WITH CHECK (true);

-- Drop and recreate policies for collaborators
DROP POLICY IF EXISTS "Authenticated users can view collaborators" ON collaborators;
DROP POLICY IF EXISTS "Authenticated users can insert collaborators" ON collaborators;
DROP POLICY IF EXISTS "Authenticated users can update collaborators" ON collaborators;
DROP POLICY IF EXISTS "Authenticated users can delete collaborators" ON collaborators;

CREATE POLICY "Public read collaborators" ON collaborators FOR SELECT USING (true);
CREATE POLICY "Public insert collaborators" ON collaborators FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update collaborators" ON collaborators FOR UPDATE USING (true);
CREATE POLICY "Public delete collaborators" ON collaborators FOR DELETE USING (true);

-- Drop and recreate policies for profiles
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON profiles FOR UPDATE USING (true);

-- Drop and recreate policies for demands
DROP POLICY IF EXISTS "Authenticated users can view demands" ON demands;
DROP POLICY IF EXISTS "Authenticated users can insert demands" ON demands;
DROP POLICY IF EXISTS "Authenticated users can update demands" ON demands;
DROP POLICY IF EXISTS "Authenticated users can delete demands" ON demands;

CREATE POLICY "Public read demands" ON demands FOR SELECT USING (true);
CREATE POLICY "Public insert demands" ON demands FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update demands" ON demands FOR UPDATE USING (true);
CREATE POLICY "Public delete demands" ON demands FOR DELETE USING (true);

-- Drop and recreate policies for licenses
DROP POLICY IF EXISTS "Authenticated users can view licenses" ON licenses;
DROP POLICY IF EXISTS "Authenticated users can insert licenses" ON licenses;
DROP POLICY IF EXISTS "Authenticated users can update licenses" ON licenses;
DROP POLICY IF EXISTS "Authenticated users can delete licenses" ON licenses;

CREATE POLICY "Public read licenses" ON licenses FOR SELECT USING (true);
CREATE POLICY "Public insert licenses" ON licenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update licenses" ON licenses FOR UPDATE USING (true);
CREATE POLICY "Public delete licenses" ON licenses FOR DELETE USING (true);

-- Drop and recreate policies for processes
DROP POLICY IF EXISTS "Authenticated users can view processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can insert processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can update processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can delete processes" ON processes;

CREATE POLICY "Public read processes" ON processes FOR SELECT USING (true);
CREATE POLICY "Public insert processes" ON processes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update processes" ON processes FOR UPDATE USING (true);
CREATE POLICY "Public delete processes" ON processes FOR DELETE USING (true);

-- Drop and recreate policies for notifications
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can update notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can delete notifications" ON notifications;

CREATE POLICY "Public read notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Public insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update notifications" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Public delete notifications" ON notifications FOR DELETE USING (true);

-- Drop and recreate policies for tasks
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON tasks;

CREATE POLICY "Public read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public insert tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Public delete tasks" ON tasks FOR DELETE USING (true);

-- Drop and recreate policies for client_comments
DROP POLICY IF EXISTS "Authenticated users can view client_comments" ON client_comments;
DROP POLICY IF EXISTS "Authenticated users can insert client_comments" ON client_comments;
DROP POLICY IF EXISTS "Authenticated users can update client_comments" ON client_comments;
DROP POLICY IF EXISTS "Authenticated users can delete client_comments" ON client_comments;

CREATE POLICY "Public read client_comments" ON client_comments FOR SELECT USING (true);
CREATE POLICY "Public insert client_comments" ON client_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update client_comments" ON client_comments FOR UPDATE USING (true);
CREATE POLICY "Public delete client_comments" ON client_comments FOR DELETE USING (true);

-- Drop and recreate policies for apt_demands
DROP POLICY IF EXISTS "Authenticated users can view apt_demands" ON apt_demands;
DROP POLICY IF EXISTS "Authenticated users can insert apt_demands" ON apt_demands;
DROP POLICY IF EXISTS "Authenticated users can update apt_demands" ON apt_demands;
DROP POLICY IF EXISTS "Authenticated users can delete apt_demands" ON apt_demands;

CREATE POLICY "Public read apt_demands" ON apt_demands FOR SELECT USING (true);
CREATE POLICY "Public insert apt_demands" ON apt_demands FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update apt_demands" ON apt_demands FOR UPDATE USING (true);
CREATE POLICY "Public delete apt_demands" ON apt_demands FOR DELETE USING (true);