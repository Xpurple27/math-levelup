-- Controlled pre-launch reset. Auth identities/sessions and non-obsolete snapshots survive.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE obsolete_content_owners ON COMMIT DROP AS
 SELECT DISTINCT user_id FROM public.levelup_attempts a WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(a.snapshot) q WHERE q->>'id' ~ '^(rasio|aljabar|statistika)-[0-9]+$|^(persen|geometri|peluang|pola)-f[0-9]+-v[0-9]+$');
DELETE FROM public.levelup_attempts a WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(a.snapshot) q WHERE q->>'id' ~ '^(rasio|aljabar|statistika)-[0-9]+$|^(persen|geometri|peluang|pola)-f[0-9]+-v[0-9]+$');
DELETE FROM public.levelup_mastery WHERE user_id IN(SELECT user_id FROM obsolete_content_owners) AND topic IN ('rasio','aljabar','statistika','persen','geometri','peluang','pola');
DELETE FROM public.levelup_activities WHERE user_id IN(SELECT user_id FROM obsolete_content_owners) AND NOT EXISTS(SELECT 1 FROM public.levelup_attempts WHERE user_id=levelup_activities.user_id);
-- No active packages until a separately authorized assessment builder phase.
-- Keep trusted timer/transaction/resume engine; old snapshots outside this reset keep their deadline.
CREATE OR REPLACE FUNCTION public.levelup_start_attempt(p_user_id uuid,p_kind text,p_topic text,p_snapshot jsonb) RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $$
DECLARE a public.levelup_attempts; now_ms bigint:=floor(extract(epoch FROM clock_timestamp())*1000);
BEGIN
 IF p_kind='tryout' AND p_topic IS NULL THEN RAISE EXCEPTION 'invalid package';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 SELECT * INTO a FROM public.levelup_attempts WHERE user_id=p_user_id AND kind=p_kind AND topic IS NOT DISTINCT FROM p_topic AND status='active';IF FOUND THEN RETURN to_jsonb(a);END IF;
 INSERT INTO public.levelup_attempts(user_id,kind,topic,started,deadline,snapshot) VALUES(p_user_id,p_kind,p_topic,now_ms,CASE p_kind WHEN 'diagnostic' THEN now_ms+1800000 WHEN 'mini' THEN now_ms+600000 WHEN 'tryout' THEN now_ms+1200000 ELSE NULL END,p_snapshot) RETURNING * INTO a;RETURN to_jsonb(a);
END $$;
REVOKE ALL ON FUNCTION public.levelup_start_attempt(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.levelup_start_attempt(uuid,text,text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.levelup_report_page(p_user_id uuid,p_category text,p_view text,p_topic text,p_message text,p_attempt_id uuid DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql SET search_path='' AS $$
DECLARE a public.levelup_attempts; c jsonb;
BEGIN
 IF p_attempt_id IS NOT NULL THEN SELECT * INTO a FROM public.levelup_attempts WHERE id=p_attempt_id AND user_id=p_user_id; IF NOT FOUND THEN RAISE EXCEPTION 'attempt not found'; END IF; END IF;
 c:=jsonb_build_object('page',p_view,'topic',nullif(p_topic,''));
 IF p_attempt_id IS NOT NULL THEN c:=c||jsonb_build_object('attempt_id',a.id,'kind',a.kind,'package',CASE WHEN a.kind='tryout' THEN a.topic ELSE NULL END,'status',a.status); END IF;
 IF p_category NOT IN ('question','answer','explanation','technical','display','suggestion') OR p_view NOT IN ('dashboard','learn','progress','result','practice','tryout') OR (p_topic NOT IN ('','rasio','aljabar','statistika','persen','geometri','peluang','pola') AND NOT EXISTS(SELECT 1 FROM public.subtopics WHERE id::text=p_topic AND status='ACTIVE')) OR length(trim(p_message)) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'invalid report'; END IF;
 INSERT INTO public.levelup_page_reports(user_id,category,view,topic,message,context,attempt_id) VALUES(p_user_id,p_category,p_view,p_topic,trim(p_message),c,p_attempt_id) ON CONFLICT(user_id,category,view,topic) DO NOTHING;
 RETURN true;
END $$;

COMMIT;
