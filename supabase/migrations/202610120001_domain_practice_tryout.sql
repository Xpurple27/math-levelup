BEGIN;

-- Practice packages are domain-first in V1. Legacy packages may keep a subtopic reference.
ALTER TABLE public.practice_packages
  ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.domains(id);

UPDATE public.practice_packages p
SET domain_id = t.domain_id
FROM public.subtopics st
JOIN public.topics t ON t.id = st.topic_id
WHERE p.domain_id IS NULL AND p.subtopic_id = st.id;

ALTER TABLE public.practice_packages ALTER COLUMN subtopic_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS practice_packages_domain_catalog_idx
  ON public.practice_packages(section_id, domain_id, status, sort_order);

-- Metadata keeps PM process/context and production taxonomy tags without leaking into student answers.
ALTER TABLE public.question_versions
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.tryout_packages(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.exam_sections(id),
  code text UNIQUE NOT NULL CHECK(code ~ '^[A-Z0-9][A-Z0-9-]{0,79}$'),
  slug text UNIQUE NOT NULL,
  suite_code text NOT NULL,
  suite_title text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  access text NOT NULL DEFAULT 'FREE' CHECK(access IN ('FREE','PREMIUM')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  question_count integer NOT NULL CHECK(question_count > 0),
  duration_seconds integer NOT NULL CHECK(duration_seconds > 0),
  section_order integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.tryout_package_questions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tryout_package_id uuid NOT NULL REFERENCES public.tryout_packages(id) ON DELETE CASCADE,
  question_version_id uuid NOT NULL REFERENCES public.question_versions(id),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tryout_package_id, question_version_id),
  UNIQUE(tryout_package_id, sort_order)
);

CREATE INDEX IF NOT EXISTS tryout_packages_catalog_idx
  ON public.tryout_packages(status, sort_order, suite_code, section_order);
CREATE INDEX IF NOT EXISTS tryout_package_questions_order_idx
  ON public.tryout_package_questions(tryout_package_id, sort_order);

ALTER TABLE public.tryout_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryout_package_questions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tryout_packages FROM anon, authenticated;
REVOKE ALL ON public.tryout_package_questions FROM anon, authenticated;

-- Tryout duration is now data-driven instead of hardcoded by slug.
CREATE OR REPLACE FUNCTION public.levelup_start_attempt(
  p_user_id uuid,
  p_kind text,
  p_topic text,
  p_snapshot jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = '' AS $$
DECLARE
  a public.levelup_attempts;
  now_ms bigint := floor(extract(epoch from clock_timestamp())*1000);
  tryout_seconds integer;
  deadline_ms bigint;
BEGIN
  IF p_kind='tryout' THEN
    IF p_topic IS NULL THEN RAISE EXCEPTION 'invalid package'; END IF;
    SELECT duration_seconds INTO tryout_seconds
    FROM public.tryout_packages
    WHERE slug=p_topic AND status='PUBLISHED' AND access='FREE';
    IF tryout_seconds IS NULL THEN RAISE EXCEPTION 'invalid package'; END IF;
  END IF;

  deadline_ms := CASE
    WHEN p_kind='diagnostic' THEN now_ms + 1800000
    WHEN p_kind='tryout' THEN now_ms + (tryout_seconds::bigint * 1000)
    WHEN p_kind='mini' THEN now_ms + 600000
    ELSE NULL
  END;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  SELECT * INTO a
  FROM public.levelup_attempts
  WHERE user_id=p_user_id AND kind=p_kind AND topic IS NOT DISTINCT FROM p_topic AND status='active';
  IF FOUND THEN RETURN to_jsonb(a); END IF;

  INSERT INTO public.levelup_attempts(user_id,kind,topic,started,deadline,snapshot)
  VALUES(p_user_id,p_kind,p_topic,now_ms,deadline_ms,p_snapshot)
  RETURNING * INTO a;
  RETURN to_jsonb(a);
END $$;

REVOKE ALL ON FUNCTION public.levelup_start_attempt(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.levelup_start_attempt(uuid,text,text,jsonb) TO service_role;

COMMIT;
