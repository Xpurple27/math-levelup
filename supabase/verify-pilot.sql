-- Read-only. Run in SQL Editor AFTER all six migration files, in filename order.
-- Every row must be true. Returns only readiness booleans, no student records.
WITH tables AS (
 SELECT c.relname,c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname IN ('levelup_attempts','levelup_mastery','levelup_activities','levelup_reports','levelup_page_reports')
), functions AS (
 SELECT p.oid,p.proname,p.prosecdef,pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('levelup_start_attempt','levelup_save_attempt','levelup_finalize_attempt','levelup_report_issue','levelup_report_page')
)
SELECT 'private_tables' check_name, (SELECT count(*)=5 AND bool_and(relrowsecurity) FROM tables) passed
UNION ALL SELECT 'browser_table_access_denied', (SELECT count(*)=5 AND bool_and(NOT has_table_privilege('anon','public.'||relname,'SELECT,INSERT,UPDATE,DELETE') AND NOT has_table_privilege('authenticated','public.'||relname,'SELECT,INSERT,UPDATE,DELETE')) FROM tables)
UNION ALL SELECT 'trusted_functions', (SELECT count(*)=5 AND bool_and(NOT prosecdef AND has_function_privilege('service_role',oid,'EXECUTE') AND NOT has_function_privilege('anon',oid,'EXECUTE') AND NOT has_function_privilege('authenticated',oid,'EXECUTE')) FROM functions)
UNION ALL SELECT 'server_table_access', (SELECT count(*)=5 AND bool_and(has_table_privilege('service_role','public.'||relname,'SELECT') AND has_table_privilege('service_role','public.'||relname,'INSERT') AND has_table_privilege('service_role','public.'||relname,'UPDATE') AND has_table_privilege('service_role','public.'||relname,'DELETE')) FROM tables)
UNION ALL SELECT 'pilot_deadline_rpc', EXISTS(SELECT 1 FROM functions WHERE proname='levelup_start_attempt' AND definition LIKE '%pk-pilot-v1%' AND definition LIKE '%1200000%')
UNION ALL SELECT 'confidence_metadata_ready', NOT EXISTS(SELECT 1 FROM public.levelup_mastery WHERE NOT(data ? 'uniqueEvidence') OR jsonb_typeof(data->'uniqueEvidence') IS DISTINCT FROM 'object')
UNION ALL SELECT 'unique_count_consistent', NOT EXISTS(SELECT 1 FROM public.levelup_mastery WHERE (data->>'count')::integer IS DISTINCT FROM (SELECT count(*) FROM jsonb_object_keys(data->'uniqueEvidence')));
