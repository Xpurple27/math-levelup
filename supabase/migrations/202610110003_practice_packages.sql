BEGIN;

CREATE TABLE IF NOT EXISTS public.practice_packages(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.exam_sections(id),
  subtopic_id uuid NOT NULL REFERENCES public.subtopics(id),
  code text UNIQUE NOT NULL CHECK(code ~ '^[A-Z0-9][A-Z0-9-]{0,79}$'),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  access text NOT NULL DEFAULT 'FREE' CHECK(access IN ('FREE','PREMIUM')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  estimated_minutes integer NOT NULL DEFAULT 15 CHECK(estimated_minutes > 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.practice_package_questions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_package_id uuid NOT NULL REFERENCES public.practice_packages(id) ON DELETE CASCADE,
  question_version_id uuid NOT NULL REFERENCES public.question_versions(id),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(practice_package_id, question_version_id),
  UNIQUE(practice_package_id, sort_order)
);

CREATE INDEX IF NOT EXISTS practice_packages_catalog_idx
  ON public.practice_packages(section_id, subtopic_id, status, sort_order);
CREATE INDEX IF NOT EXISTS practice_package_questions_order_idx
  ON public.practice_package_questions(practice_package_id, sort_order);

ALTER TABLE public.practice_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_package_questions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.practice_packages FROM anon, authenticated;
REVOKE ALL ON public.practice_package_questions FROM anon, authenticated;

-- First real package: curated from the five PK Persamaan Linear questions already produced.
INSERT INTO public.practice_packages(section_id, subtopic_id, code, slug, title, description, access, status, estimated_minutes, sort_order, published_at)
SELECT
  s.id,
  st.id,
  'PK-LIN-P01',
  'pk-persamaan-linear-paket-01',
  'Persamaan Linear · Paket 01',
  'Latihan konsep persamaan linear dari fondasi hingga penerapan.',
  'FREE',
  'PUBLISHED',
  12,
  10,
  now()
FROM public.exam_sections s
JOIN public.exams e ON e.id=s.exam_id
CROSS JOIN public.subtopics st
WHERE e.code='SNBT' AND s.code='PK' AND st.code='EQ'
ON CONFLICT(code) DO NOTHING;

INSERT INTO public.practice_package_questions(practice_package_id, question_version_id, sort_order)
SELECT p.id, v.id, x.sort_order
FROM public.practice_packages p
JOIN (VALUES
  ('PK-LIN-001',10),
  ('PK-LIN-002',20),
  ('PK-LIN-003',30),
  ('PK-LIN-004',40),
  ('PK-LIN-005',50)
) AS x(question_code,sort_order) ON true
JOIN public.questions q ON q.code=x.question_code
JOIN public.question_versions v ON v.id=q.current_version_id AND v.status='PUBLISHED'
WHERE p.code='PK-LIN-P01'
ON CONFLICT(practice_package_id, question_version_id) DO NOTHING;

COMMIT;
