
DROP FUNCTION IF EXISTS public.list_public_profiles();
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- user_roles
DROP POLICY IF EXISTS "Gestores manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gestores read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gestores insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gestores update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gestores delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "No self role modification" ON public.user_roles;

CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Gestores read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'::public.app_role));

CREATE POLICY "Gestores insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'gestor'::public.app_role));

CREATE POLICY "Gestores update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'::public.app_role));

CREATE POLICY "Gestores delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'::public.app_role));

-- Restrictive: never allow writing a row that targets your own user_id
CREATE POLICY "No self role write"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() <> user_id);

CREATE POLICY "No self role update"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (auth.uid() <> user_id)
  WITH CHECK (auth.uid() <> user_id);

CREATE POLICY "No self role delete"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (auth.uid() <> user_id);

-- profiles: defense-in-depth restrictive policy
DROP POLICY IF EXISTS "Profiles strict access" ON public.profiles;
CREATE POLICY "Profiles strict access"
  ON public.profiles
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'gestor'::public.app_role))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'gestor'::public.app_role));
