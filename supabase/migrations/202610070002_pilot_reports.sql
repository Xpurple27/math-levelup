-- Apply after unique_mastery_evidence. Adds only pilot deadline and private contextual reports.
BEGIN;
CREATE OR REPLACE FUNCTION public.levelup_start_attempt(p_user_id uuid,p_kind text,p_topic text,p_snapshot jsonb) RETURNS jsonb
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE a public.levelup_attempts; now_ms bigint := floor(extract(epoch from clock_timestamp())*1000);
BEGIN
 IF p_kind='tryout' AND (p_topic IS NULL OR p_topic NOT IN ('pk-01-v1','pm-01-v1','pu-01-v1','pk-01-v2','pm-01-v2','pu-01-v2','pk-02-v1','pm-02-v1','pu-02-v1','pk-pilot-v1','pm-pilot-v1','pu-pilot-v1')) THEN RAISE EXCEPTION 'invalid package'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 SELECT * INTO a FROM public.levelup_attempts WHERE user_id=p_user_id AND kind=p_kind AND topic IS NOT DISTINCT FROM p_topic AND status='active';
 IF FOUND THEN RETURN to_jsonb(a); END IF;
 INSERT INTO public.levelup_attempts(user_id,kind,topic,started,deadline,snapshot)
 VALUES(p_user_id,p_kind,p_topic,now_ms,CASE p_kind WHEN 'diagnostic' THEN now_ms+1800000 WHEN 'tryout' THEN now_ms + CASE WHEN p_topic IN ('pk-01-v2','pm-01-v2','pu-01-v2','pk-02-v1','pm-02-v1','pu-02-v1','pk-pilot-v1','pm-pilot-v1','pu-pilot-v1') THEN 1200000 ELSE 1800000 END WHEN 'mini' THEN now_ms+600000 ELSE NULL END,p_snapshot) RETURNING * INTO a;
 RETURN to_jsonb(a);
END $$;

REVOKE ALL ON FUNCTION public.levelup_start_attempt(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.levelup_start_attempt(uuid,text,text,jsonb) TO service_role;
CREATE TABLE IF NOT EXISTS public.levelup_reports(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 attempt_id uuid NOT NULL REFERENCES public.levelup_attempts(id) ON DELETE CASCADE,
 question_id text NOT NULL, category text NOT NULL CHECK(category IN ('question','answer','explanation','technical','display','suggestion')),
 view text NOT NULL CHECK(view IN ('exam','solutions')), message text NOT NULL CHECK(length(message) BETWEEN 1 AND 1000),
 context jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,attempt_id,question_id,category,view)
);
ALTER TABLE public.levelup_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.levelup_reports FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.levelup_reports TO service_role;
CREATE OR REPLACE FUNCTION public.levelup_report_issue(p_user_id uuid,p_attempt_id uuid,p_question_id text,p_category text,p_view text,p_message text) RETURNS boolean
LANGUAGE plpgsql SET search_path='' AS $$
DECLARE a public.levelup_attempts; q jsonb;
BEGIN
 IF p_category NOT IN ('question','answer','explanation','technical','display','suggestion') OR p_view NOT IN ('exam','solutions') OR length(trim(p_message)) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'invalid report'; END IF;
 SELECT * INTO a FROM public.levelup_attempts WHERE id=p_attempt_id AND user_id=p_user_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'attempt not found'; END IF;
 SELECT item INTO q FROM jsonb_array_elements(a.snapshot) item WHERE item->>'id'=p_question_id;
 IF q IS NULL OR (p_view='solutions' AND a.status<>'completed') THEN RAISE EXCEPTION 'invalid question context'; END IF;
 INSERT INTO public.levelup_reports(user_id,attempt_id,question_id,category,view,message,context)
 VALUES(p_user_id,p_attempt_id,p_question_id,p_category,p_view,trim(p_message),jsonb_build_object('version',q->'version','topic',q->>'topic','kind',a.kind,'package',CASE WHEN a.kind='tryout' THEN a.topic ELSE NULL END,'status',a.status))
 ON CONFLICT(user_id,attempt_id,question_id,category,view) DO NOTHING;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.levelup_report_issue(uuid,uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.levelup_report_issue(uuid,uuid,text,text,text,text) TO service_role;
CREATE TABLE IF NOT EXISTS public.levelup_page_reports(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 category text NOT NULL CHECK(category IN ('question','answer','explanation','technical','display','suggestion')),
 message text NOT NULL CHECK(length(message) BETWEEN 1 AND 1000),view text NOT NULL CHECK(view IN ('dashboard','learn','progress','result','practice','tryout')),
 topic text NOT NULL DEFAULT '',attempt_id uuid REFERENCES public.levelup_attempts(id) ON DELETE CASCADE,question_id text DEFAULT NULL,context jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(user_id,category,view,topic)
);
ALTER TABLE public.levelup_page_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.levelup_page_reports FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.levelup_page_reports TO service_role;
CREATE OR REPLACE FUNCTION public.levelup_report_page(p_user_id uuid,p_category text,p_view text,p_topic text,p_message text,p_attempt_id uuid DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql SET search_path='' AS $$
DECLARE a public.levelup_attempts; c jsonb;
BEGIN
 IF p_attempt_id IS NOT NULL THEN SELECT * INTO a FROM public.levelup_attempts WHERE id=p_attempt_id AND user_id=p_user_id; IF NOT FOUND THEN RAISE EXCEPTION 'attempt not found'; END IF; END IF;
 c:=jsonb_build_object('page',p_view,'topic',nullif(p_topic,''));
 IF p_attempt_id IS NOT NULL THEN c:=c||jsonb_build_object('attempt_id',a.id,'kind',a.kind,'package',CASE WHEN a.kind='tryout' THEN a.topic ELSE NULL END,'status',a.status); END IF;
 IF p_category NOT IN ('question','answer','explanation','technical','display','suggestion') OR p_view NOT IN ('dashboard','learn','progress','result','practice','tryout') OR p_topic NOT IN ('','rasio','aljabar','statistika','persen','geometri','peluang','pola') OR length(trim(p_message)) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'invalid report'; END IF;
 INSERT INTO public.levelup_page_reports(user_id,category,view,topic,message,context,attempt_id) VALUES(p_user_id,p_category,p_view,p_topic,trim(p_message),c,p_attempt_id) ON CONFLICT(user_id,category,view,topic) DO NOTHING;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.levelup_report_page(uuid,text,text,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.levelup_report_page(uuid,text,text,text,text,uuid) TO service_role;
COMMIT;
