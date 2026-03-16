
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.activity_logs
  WHERE created_at < NOW() - INTERVAL '60 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_activity_logs_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM public.activity_logs WHERE created_at < NOW() - INTERVAL '60 days') > 0 THEN
    DELETE FROM public.activity_logs
    WHERE created_at < NOW() - INTERVAL '60 days';
  END IF;
  RETURN NEW;
END;
$function$;
