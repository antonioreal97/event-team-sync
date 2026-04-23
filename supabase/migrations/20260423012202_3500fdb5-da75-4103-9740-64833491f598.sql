-- 1. Fix handle_new_user: never trust client-provided role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, experience_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'iniciante'
  );
  -- Always default to freelancer; role elevation must go through admin-create-user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'freelancer');
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Tighten profiles SELECT policy (PII protection)
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'gestor'));

-- Public-safe view exposing only non-sensitive profile fields for team browsing
CREATE OR REPLACE VIEW public.profiles_public AS
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

-- 3. Tighten event_interests SELECT policy
DROP POLICY IF EXISTS "Interests viewable by authenticated" ON public.event_interests;

CREATE POLICY "Users view own interests or gestor views all"
  ON public.event_interests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'gestor'));

-- 4. Fix chat_messages INSERT policy (self-join tautology bug)
DROP POLICY IF EXISTS "Team members send messages" ON public.chat_messages;

CREATE POLICY "Team members send messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'gestor')
      OR EXISTS (
        SELECT 1 FROM public.team_allocations ta
        WHERE ta.event_id = chat_messages.event_id
          AND ta.user_id = auth.uid()
      )
    )
  );