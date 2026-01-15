-- Add old_value and new_value columns to activity_logs for tracking changes
ALTER TABLE public.activity_logs 
ADD COLUMN IF NOT EXISTS old_value text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS new_value text DEFAULT NULL;

-- Add client_name column for easier querying/display
ALTER TABLE public.activity_logs 
ADD COLUMN IF NOT EXISTS client_name text DEFAULT NULL;

-- Create index for faster queries by entity_type and action_type
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_name ON public.activity_logs(user_name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);