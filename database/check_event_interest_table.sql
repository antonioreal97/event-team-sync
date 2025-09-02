-- Script para verificar se a tabela event_interest_confirmations existe e está funcionando

-- 1. Verificar se a tabela existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'event_interest_confirmations';

-- 2. Se a tabela existir, verificar sua estrutura
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'event_interest_confirmations'
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela
SELECT COUNT(*) as total_records FROM event_interest_confirmations;

-- 4. Verificar se as foreign keys estão funcionando
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'event_interest_confirmations';

-- 5. Verificar se os índices foram criados
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'event_interest_confirmations';

-- 6. Testar uma query simples
SELECT 
  'Teste de query' as teste,
  COUNT(*) as total
FROM event_interest_confirmations eic
LEFT JOIN events e ON eic.event_id = e.id
LEFT JOIN users u ON eic.user_id = u.id;
