-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('gestor', 'freelancer', 'lider_freelancer');
CREATE TYPE public.team_type AS ENUM ('iniciante', 'intermediario', 'avancado', 'sem_equipe');
CREATE TYPE public.experience_level AS ENUM ('iniciante', 'intermediario', 'avancado', 'expert');
CREATE TYPE public.event_status AS ENUM ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.event_type AS ENUM ('normal', 'especial');
CREATE TYPE public.team_priority AS ENUM ('iniciante', 'intermediario', 'avancado', 'ambas');
CREATE TYPE public.allocation_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'pending');
CREATE TYPE public.equipment_condition AS ENUM ('excellent', 'good', 'fair', 'poor', 'damaged');
CREATE TYPE public.equipment_item_status AS ENUM ('in_service', 'maintenance', 'retired', 'lost');
CREATE TYPE public.reservation_status AS ENUM ('reserved', 'checked_out', 'returned', 'cancelled');
CREATE TYPE public.maintenance_status AS ENUM ('open', 'in_progress', 'completed', 'discarded');
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');
CREATE TYPE public.notification_type AS ENUM ('allocation', 'update', 'reminder', 'checkin', 'payment', 'schedule_conflict');
CREATE TYPE public.notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.interest_status AS ENUM ('interested', 'not_interested', 'cancelled');

-- =========================================
-- UPDATED_AT TRIGGER
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================
-- USER ROLES (separate table, security pattern)
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Gestores manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT,
  team_type public.team_type DEFAULT 'sem_equipe',
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  cpf TEXT,
  hourly_rate NUMERIC,
  daily_rate NUMERIC,
  experience_level public.experience_level NOT NULL DEFAULT 'iniciante',
  audio_visual_roles TEXT[] DEFAULT '{}',
  bio TEXT,
  portfolio TEXT,
  linkedin TEXT,
  instagram TEXT,
  website TEXT,
  previous_experience TEXT,
  certifications TEXT[] DEFAULT '{}',
  equipment TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  total_events_attended INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  average_rating NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Gestores manage all profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, experience_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'iniciante'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'freelancer'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- EVENTS
-- =========================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status public.event_status NOT NULL DEFAULT 'planning',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type public.event_type NOT NULL DEFAULT 'normal',
  estimated_duration NUMERIC,
  budget NUMERIC,
  requirements TEXT[] DEFAULT '{}',
  notes TEXT,
  team_priority public.team_priority NOT NULL DEFAULT 'ambas',
  allow_backup_levels BOOLEAN NOT NULL DEFAULT true,
  daily_rate_iniciante NUMERIC NOT NULL DEFAULT 0,
  daily_rate_intermediario NUMERIC NOT NULL DEFAULT 0,
  daily_rate_avancado NUMERIC NOT NULL DEFAULT 0,
  is_multi_day BOOLEAN NOT NULL DEFAULT false,
  total_days INTEGER NOT NULL DEFAULT 1,
  working_days TEXT[] DEFAULT '{}',
  daily_schedule JSONB,
  event_agenda TEXT,
  special_instructions TEXT,
  setup_requirements TEXT,
  technical_specifications TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by authenticated"
  ON public.events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestores manage events"
  ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- EQUIPMENT CATEGORIES
-- =========================================
CREATE TABLE public.equipment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories viewable by authenticated"
  ON public.equipment_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestores manage categories"
  ON public.equipment_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE TRIGGER trg_eqcat_updated_at
  BEFORE UPDATE ON public.equipment_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- EQUIPMENT
-- =========================================
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  total_quantity INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  category_id UUID REFERENCES public.equipment_categories(id) ON DELETE SET NULL,
  hourly_rate NUMERIC,
  daily_rate NUMERIC,
  condition public.equipment_condition NOT NULL DEFAULT 'good',
  location TEXT,
  last_maintenance TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipment viewable by authenticated"
  ON public.equipment FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestores manage equipment"
  ON public.equipment FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE TRIGGER trg_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- EQUIPMENT ITEMS
-- =========================================
CREATE TABLE public.equipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  asset_tag TEXT NOT NULL UNIQUE,
  serial_number TEXT,
  condition public.equipment_condition NOT NULL DEFAULT 'good',
  status public.equipment_item_status NOT NULL DEFAULT 'in_service',
  location TEXT,
  notes TEXT,
  last_maintenance TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items viewable by authenticated"
  ON public.equipment_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestores manage items"
  ON public.equipment_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Lider freelancer updates items"
  ON public.equipment_items FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'lider_freelancer'));

CREATE TRIGGER trg_eqitem_updated_at
  BEFORE UPDATE ON public.equipment_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- EQUIPMENT RESERVATIONS
-- =========================================
CREATE TABLE public.equipment_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  equipment_item_id UUID NOT NULL REFERENCES public.equipment_items(id) ON DELETE CASCADE,
  status public.reservation_status NOT NULL DEFAULT 'reserved',
  reserved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reserved_at TIMESTAMPTZ,
  checked_out_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_out_at TIMESTAMPTZ,
  condition_out public.equipment_condition,
  checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_in_at TIMESTAMPTZ,
  condition_in public.equipment_condition,
  post_event_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reservations viewable by authenticated"
  ON public.equipment_reservations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestores manage reservations"
  ON public.equipment_reservations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Lider updates reservations"
  ON public.equipment_reservations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'lider_freelancer'));

CREATE TRIGGER trg_eqres_updated_at
  BEFORE UPDATE ON public.equipment_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- TEAM ALLOCATIONS
-- =========================================
CREATE TABLE public.team_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_role TEXT NOT NULL,
  status public.allocation_status NOT NULL DEFAULT 'pending',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  daily_rate NUMERIC NOT NULL DEFAULT 0,
  total_days INTEGER NOT NULL DEFAULT 1,
  total_payment NUMERIC NOT NULL DEFAULT 0,
  total_hours NUMERIC NOT NULL DEFAULT 0,
  attended BOOLEAN NOT NULL DEFAULT false,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  cancellation_deadline TIMESTAMPTZ,
  confirmation_deadline TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.team_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allocations viewable by authenticated"
  ON public.team_allocations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestores manage allocations"
  ON public.team_allocations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Users update own allocation"
  ON public.team_allocations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_alloc_updated_at
  BEFORE UPDATE ON public.team_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- ATTENDANCE RECORDS
-- =========================================
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id UUID NOT NULL REFERENCES public.team_allocations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'pending',
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  daily_payment NUMERIC NOT NULL DEFAULT 0,
  payment_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(allocation_id, date)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendance viewable by authenticated"
  ON public.attendance_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestores manage attendance"
  ON public.attendance_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Users update own attendance"
  ON public.attendance_records FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.team_allocations ta WHERE ta.id = allocation_id AND ta.user_id = auth.uid()));

CREATE TRIGGER trg_att_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- EVENT INTERESTS
-- =========================================
CREATE TABLE public.event_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.interest_status NOT NULL DEFAULT 'interested',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interests viewable by authenticated"
  ON public.event_interests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own interest"
  ON public.event_interests FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gestores manage all interests"
  ON public.event_interests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE TRIGGER trg_interest_updated_at
  BEFORE UPDATE ON public.event_interests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- PAYMENT RECORDS
-- =========================================
CREATE TABLE public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  allocation_id UUID NOT NULL REFERENCES public.team_allocations(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  receipt_file TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON public.payment_records FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Gestores manage payments"
  ON public.payment_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE TRIGGER trg_pay_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- MAINTENANCE ORDERS
-- =========================================
CREATE TABLE public.maintenance_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_item_id UUID NOT NULL REFERENCES public.equipment_items(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  opened_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.maintenance_status NOT NULL DEFAULT 'open',
  requested_action TEXT NOT NULL DEFAULT 'maintenance',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Maintenance viewable by authenticated"
  ON public.maintenance_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestores manage maintenance"
  ON public.maintenance_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Lider opens maintenance"
  ON public.maintenance_orders FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'lider_freelancer') AND opened_by = auth.uid());

CREATE TRIGGER trg_maint_updated_at
  BEFORE UPDATE ON public.maintenance_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- NOTIFICATIONS
-- =========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  type public.notification_type NOT NULL DEFAULT 'update',
  related_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  priority public.notification_priority NOT NULL DEFAULT 'medium',
  action_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Gestores create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'gestor') OR public.has_role(auth.uid(), 'lider_freelancer'));

CREATE POLICY "Gestores delete notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'gestor'));

-- =========================================
-- CHAT MESSAGES
-- =========================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat visible to event team"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'gestor')
    OR EXISTS (
      SELECT 1 FROM public.team_allocations ta
      WHERE ta.event_id = chat_messages.event_id AND ta.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members send messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND (
      public.has_role(auth.uid(), 'gestor')
      OR EXISTS (
        SELECT 1 FROM public.team_allocations ta
        WHERE ta.event_id = event_id AND ta.user_id = auth.uid()
      )
    )
  );

-- =========================================
-- INDEXES
-- =========================================
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_allocations_event ON public.team_allocations(event_id);
CREATE INDEX idx_allocations_user ON public.team_allocations(user_id);
CREATE INDEX idx_attendance_alloc ON public.attendance_records(allocation_id);
CREATE INDEX idx_interests_event ON public.event_interests(event_id);
CREATE INDEX idx_interests_user ON public.event_interests(user_id);
CREATE INDEX idx_payments_user ON public.payment_records(user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX idx_chat_event ON public.chat_messages(event_id, created_at);