-- Apply after 202610060002_tryout_packages.sql. Existing deadlines and snapshots remain unchanged.
BEGIN;
CREATE OR REPLACE FUNCTION public.levelup_start_attempt(p_user_id uuid,p_kind text,p_topic text,p_snapshot jsonb) RETURNS jsonb
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE a public.levelup_attempts; now_ms bigint := floor(extract(epoch from clock_timestamp())*1000);
BEGIN
 IF p_kind='tryout' AND (p_topic IS NULL OR p_topic NOT IN ('pk-01-v1','pm-01-v1','pu-01-v1','pk-01-v2','pm-01-v2','pu-01-v2')) THEN RAISE EXCEPTION 'invalid package'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 SELECT * INTO a FROM public.levelup_attempts WHERE user_id=p_user_id AND kind=p_kind AND topic IS NOT DISTINCT FROM p_topic AND status='active';
 IF FOUND THEN RETURN to_jsonb(a); END IF;
 INSERT INTO public.levelup_attempts(user_id,kind,topic,started,deadline,snapshot)
 VALUES(p_user_id,p_kind,p_topic,now_ms,CASE p_kind WHEN 'diagnostic' THEN now_ms+1800000 WHEN 'tryout' THEN now_ms + CASE WHEN p_topic IN ('pk-01-v2','pm-01-v2','pu-01-v2') THEN 1200000 ELSE 1800000 END WHEN 'mini' THEN now_ms+600000 ELSE NULL END,p_snapshot) RETURNING * INTO a;
 RETURN to_jsonb(a);
END $$;

REVOKE ALL ON FUNCTION public.levelup_start_attempt(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.levelup_start_attempt(uuid,text,text,jsonb) TO service_role;
COMMIT;
