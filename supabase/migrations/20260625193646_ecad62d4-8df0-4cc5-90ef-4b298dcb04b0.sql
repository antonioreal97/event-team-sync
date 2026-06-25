
-- Tighten SELECT policies
DROP POLICY IF EXISTS "Attendance viewable by authenticated" ON public.attendance_records;
CREATE POLICY "Attendance viewable by owner or gestor" ON public.attendance_records
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'gestor'::app_role)
  OR EXISTS (SELECT 1 FROM public.team_allocations ta WHERE ta.id = attendance_records.allocation_id AND ta.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Allocations viewable by authenticated" ON public.team_allocations;
CREATE POLICY "Allocations viewable by owner or roles" ON public.team_allocations
FOR SELECT TO authenticated USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'lider_freelancer'::app_role)
);

DROP POLICY IF EXISTS "Reservations viewable by authenticated" ON public.equipment_reservations;
CREATE POLICY "Reservations viewable by roles or participants" ON public.equipment_reservations
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'lider_freelancer'::app_role)
  OR EXISTS (SELECT 1 FROM public.team_allocations ta WHERE ta.event_id = equipment_reservations.event_id AND ta.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Maintenance viewable by authenticated" ON public.maintenance_orders;
CREATE POLICY "Maintenance viewable by roles" ON public.maintenance_orders
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'lider_freelancer'::app_role)
);

-- Lock down SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.list_public_profiles() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_public_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
