CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'cancelled', 'expired');

CREATE TABLE public.freelancer_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  team_type public.team_type NOT NULL DEFAULT 'iniciante',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.invite_status NOT NULL DEFAULT 'pending',
  invite_url TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.freelancer_invites ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_freelancer_invites_pending_email
  ON public.freelancer_invites (lower(email))
  WHERE status = 'pending';

CREATE INDEX idx_freelancer_invites_status_created
  ON public.freelancer_invites (status, created_at DESC);

CREATE INDEX idx_freelancer_invites_invited_user
  ON public.freelancer_invites (invited_user_id)
  WHERE invited_user_id IS NOT NULL;

CREATE TRIGGER trg_freelancer_invites_updated_at
  BEFORE UPDATE ON public.freelancer_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Gestores manage freelancer invites"
  ON public.freelancer_invites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Invited users view own invites"
  ON public.freelancer_invites FOR SELECT TO authenticated
  USING (invited_user_id = auth.uid() OR lower(email) = lower((auth.jwt() ->> 'email')));

CREATE POLICY "Invited users accept own invites"
  ON public.freelancer_invites FOR UPDATE TO authenticated
  USING (
    status = 'pending'
    AND (invited_user_id = auth.uid() OR lower(email) = lower((auth.jwt() ->> 'email')))
  )
  WITH CHECK (
    invited_user_id = auth.uid()
    OR lower(email) = lower((auth.jwt() ->> 'email'))
  );

CREATE POLICY "Event members notify event owners"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    type = 'allocation'
    AND related_event_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = related_event_id
        AND e.created_by = notifications.user_id
    )
  );
