-- Script para desabilitar completamente o RLS e permitir acesso total
-- Execute este script no SQL Editor do Supabase

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Gestores can view all users" ON users;
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Gestores can manage events" ON events;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can view equipments" ON equipments;
DROP POLICY IF EXISTS "Gestores can manage equipments" ON equipments;
DROP POLICY IF EXISTS "Enable all access for service role" ON users;
DROP POLICY IF EXISTS "Enable all access for service role" ON freelancer_profiles;
DROP POLICY IF EXISTS "Enable all access for service role" ON events;
DROP POLICY IF EXISTS "Enable all access for service role" ON team_allocations;
DROP POLICY IF EXISTS "Enable all access for service role" ON attendance_records;
DROP POLICY IF EXISTS "Enable all access for service role" ON equipments;
DROP POLICY IF EXISTS "Enable all access for service role" ON equipment_allocations;
DROP POLICY IF EXISTS "Enable all access for service role" ON notifications;
DROP POLICY IF EXISTS "Enable all access for service role" ON freelancer_invites;
DROP POLICY IF EXISTS "Enable all access for service role" ON payment_records;
DROP POLICY IF EXISTS "Enable all access for service role" ON event_interests;

-- Desabilitar RLS em TODAS as tabelas
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_interests DISABLE ROW LEVEL SECURITY;

-- Verificar se as tabelas existem e criar se necessário
SELECT 'RLS desabilitado com sucesso!' as status;


