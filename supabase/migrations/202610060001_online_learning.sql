-- Additive, namespaced LevelUP tables; existing Supabase Auth users are preserved.
BEGIN;
CREATE TABLE IF NOT EXISTS public.levelup_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('diagnostic','guided','mini','practice')), topic text,
 started bigint NOT NULL, deadline bigint, snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='array'),
 answers jsonb NOT NULL DEFAULT '{}', feedback jsonb NOT NULL DEFAULT '{}', credits jsonb NOT NULL DEFAULT '{}',
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed')), result jsonb, revision integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS levelup_attempt_history ON public.levelup_attempts(user_id,started DESC);
CREATE UNIQUE INDEX IF NOT EXISTS levelup_one_active ON public.levelup_attempts(user_id,kind,coalesce(topic,'')) WHERE status='active';
CREATE TABLE IF NOT EXISTS public.levelup_mastery(user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,topic text NOT NULL,data jsonb NOT NULL,PRIMARY KEY(user_id,topic));
CREATE TABLE IF NOT EXISTS public.levelup_activities(user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,day date NOT NULL,kind text NOT NULL,PRIMARY KEY(user_id,day,kind));
ALTER TABLE public.levelup_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levelup_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levelup_activities ENABLE ROW LEVEL SECURITY;
-- No browser grants or policies: snapshots include keys and must remain server-only.
REVOKE ALL ON public.levelup_attempts,public.levelup_mastery,public.levelup_activities FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.levelup_attempts,public.levelup_mastery,public.levelup_activities TO service_role;

CREATE OR REPLACE FUNCTION public.levelup_start_attempt(p_user_id uuid,p_kind text,p_topic text,p_snapshot jsonb) RETURNS jsonb
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE a public.levelup_attempts; now_ms bigint := floor(extract(epoch from clock_timestamp())*1000);
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 SELECT * INTO a FROM public.levelup_attempts WHERE user_id=p_user_id AND kind=p_kind AND topic IS NOT DISTINCT FROM p_topic AND status='active';
 IF FOUND THEN RETURN to_jsonb(a); END IF;
 INSERT INTO public.levelup_attempts(user_id,kind,topic,started,deadline,snapshot)
 VALUES(p_user_id,p_kind,p_topic,now_ms,CASE p_kind WHEN 'diagnostic' THEN now_ms+1800000 WHEN 'mini' THEN now_ms+600000 ELSE NULL END,p_snapshot) RETURNING * INTO a;
 RETURN to_jsonb(a);
END $$;

CREATE OR REPLACE FUNCTION public.levelup_save_attempt(p_id uuid,p_user_id uuid,p_version integer,p_answers jsonb,p_feedback jsonb,p_credits jsonb) RETURNS boolean
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
 UPDATE public.levelup_attempts SET answers=p_answers,feedback=p_feedback,credits=p_credits,revision=revision+1
 WHERE id=p_id AND user_id=p_user_id AND status='active' AND revision=p_version AND (deadline IS NULL OR deadline>floor(extract(epoch from clock_timestamp())*1000));
 RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.levelup_finalize_attempt(p_id uuid,p_user_id uuid,p_version integer,p_result jsonb,p_masteries jsonb,p_old jsonb) RETURNS boolean
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE a public.levelup_attempts; previous jsonb; m jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 SELECT * INTO a FROM public.levelup_attempts WHERE id=p_id AND user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'attempt not found'; END IF;
 IF a.status='completed' THEN RETURN false; END IF;
 SELECT coalesce(jsonb_object_agg(topic,data),'{}'::jsonb) INTO previous FROM public.levelup_mastery WHERE user_id=p_user_id;
 IF a.revision<>p_version OR previous<>p_old THEN RAISE EXCEPTION 'concurrent update' USING ERRCODE='40001'; END IF;
 UPDATE public.levelup_attempts SET status='completed',result=p_result,revision=revision+1 WHERE id=a.id;
 FOR m IN SELECT value FROM jsonb_array_elements(p_masteries) LOOP
  INSERT INTO public.levelup_mastery(user_id,topic,data) VALUES(p_user_id,m->>'topic',m)
  ON CONFLICT(user_id,topic) DO UPDATE SET data=excluded.data;
 END LOOP;
 IF a.kind<>'practice' OR (SELECT count(*) FROM jsonb_object_keys(a.answers))>=5 THEN
  INSERT INTO public.levelup_activities(user_id,day,kind) VALUES(p_user_id,(clock_timestamp() AT TIME ZONE 'Asia/Jakarta')::date,a.kind) ON CONFLICT DO NOTHING;
 END IF;
 RETURN true;
END $$;
-- Functions are invoker-rights and callable ONLY by the trusted server key.
REVOKE ALL ON FUNCTION public.levelup_start_attempt(uuid,text,text,jsonb),public.levelup_save_attempt(uuid,uuid,integer,jsonb,jsonb,jsonb),public.levelup_finalize_attempt(uuid,uuid,integer,jsonb,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.levelup_start_attempt(uuid,text,text,jsonb),public.levelup_save_attempt(uuid,uuid,integer,jsonb,jsonb,jsonb),public.levelup_finalize_attempt(uuid,uuid,integer,jsonb,jsonb,jsonb) TO service_role;
COMMIT;
