-- Script para limpar e reconfigurar o banco Supabase
-- Execute este script primeiro para limpar políticas problemáticas

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Gestores can view all users" ON users;
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Gestores can manage events" ON events;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can view equipments" ON equipments;
DROP POLICY IF EXISTS "Gestores can manage equipments" ON equipments;

-- Desabilitar RLS temporariamente
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

-- Agora execute o arquivo supabase-init-fixed.sql
