DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  id,
  user_id,
  name,
  avatar,
  bio,
  experience_level,
  audio_visual_roles,
  team_type,
  languages,
  is_active,
  total_events_attended,
  average_rating,
  created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;

-- Allow authenticated users to read non-sensitive profile fields via the view's underlying SELECT
-- The view uses security_invoker, so it requires SELECT on profiles. Add a permissive policy
-- but only effective when accessed through the view (we can't restrict per-column in RLS,
-- so app code must read from profiles_public for non-self profiles).
CREATE POLICY "Authenticated browse limited via view"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Wait — that re-opens PII. Drop it and use a different approach: keep RLS strict and
-- expose the view via a SECURITY DEFINER function instead.
DROP POLICY IF EXISTS "Authenticated browse limited via view" ON public.profiles;

DROP VIEW IF EXISTS public.profiles_public;

CREATE OR REPLACE FUNCTION public.list_public_profiles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  avatar text,
  bio text,
  experience_level experience_level,
  audio_visual_roles text[],
  team_type team_type,
  languages text[],
  is_active boolean,
  total_events_attended integer,
  average_rating numeric,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.user_id, p.name, p.avatar, p.bio, p.experience_level,
    p.audio_visual_roles, p.team_type, p.languages, p.is_active,
    p.total_events_attended, p.average_rating, p.created_at
  FROM public.profiles p
  WHERE p.is_active = true;
$$;

REVOKE ALL ON FUNCTION public.list_public_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_profiles() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  avatar text,
  bio text,
  experience_level experience_level,
  audio_visual_roles text[],
  team_type team_type,
  languages text[],
  is_active boolean,
  total_events_attended integer,
  average_rating numeric,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.user_id, p.name, p.avatar, p.bio, p.experience_level,
    p.audio_visual_roles, p.team_type, p.languages, p.is_active,
    p.total_events_attended, p.average_rating, p.created_at
  FROM public.profiles p
  WHERE p.user_id = _user_id;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;