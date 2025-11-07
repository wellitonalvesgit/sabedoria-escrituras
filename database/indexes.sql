-- ✅ OTIMIZAÇÃO FASE 2: Índices do banco de dados
-- Execute este SQL no Supabase SQL Editor para melhorar a performance das queries

-- ==================================================
-- ÍNDICES PARA A TABELA courses
-- ==================================================

-- Índice para buscar cursos por status (usado em quase todas as queries)
CREATE INDEX IF NOT EXISTS idx_courses_status
ON courses(status);

-- Índice para buscar cursos por slug (usado ao acessar curso individual)
CREATE INDEX IF NOT EXISTS idx_courses_slug
ON courses(slug);

-- Índice composto para ordenação por data de criação + filtro de status
CREATE INDEX IF NOT EXISTS idx_courses_status_created
ON courses(status, created_at DESC);

-- ==================================================
-- ÍNDICES PARA A TABELA course_pdfs
-- ==================================================

-- Índice para buscar PDFs de um curso (foreign key)
CREATE INDEX IF NOT EXISTS idx_course_pdfs_course_id
ON course_pdfs(course_id);

-- Índice para buscar subvolumes (volumes com parent_volume_id)
CREATE INDEX IF NOT EXISTS idx_course_pdfs_parent_volume
ON course_pdfs(parent_volume_id)
WHERE parent_volume_id IS NOT NULL;

-- Índice composto para ordenação por display_order dentro de um curso
CREATE INDEX IF NOT EXISTS idx_course_pdfs_course_order
ON course_pdfs(course_id, display_order);

-- ==================================================
-- ÍNDICES PARA A TABELA course_categories
-- ==================================================

-- Índice para buscar categorias de um curso (foreign key)
CREATE INDEX IF NOT EXISTS idx_course_categories_course_id
ON course_categories(course_id);

-- Índice para buscar cursos de uma categoria (foreign key reverso)
CREATE INDEX IF NOT EXISTS idx_course_categories_category_id
ON course_categories(category_id);

-- ==================================================
-- ÍNDICES PARA A TABELA categories
-- ==================================================

-- Índice para buscar categoria por slug
CREATE INDEX IF NOT EXISTS idx_categories_slug
ON categories(slug);

-- Índice para ordenação por display_order
CREATE INDEX IF NOT EXISTS idx_categories_display_order
ON categories(display_order);

-- ==================================================
-- ÍNDICES PARA A TABELA course_purchases
-- ==================================================

-- Índice para buscar compras de um usuário
CREATE INDEX IF NOT EXISTS idx_course_purchases_user_id
ON course_purchases(user_id);

-- Índice para buscar compras de um curso
CREATE INDEX IF NOT EXISTS idx_course_purchases_course_id
ON course_purchases(course_id);

-- Índice composto para verificar se usuário comprou um curso específico
CREATE INDEX IF NOT EXISTS idx_course_purchases_user_course
ON course_purchases(user_id, course_id);

-- ==================================================
-- ÍNDICES PARA A TABELA users
-- ==================================================

-- Índice para buscar usuário por email
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- Índice para buscar usuário por role (admin/student)
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

-- ==================================================
-- ANÁLISE E ESTATÍSTICAS
-- ==================================================

-- Após criar os índices, execute ANALYZE para atualizar as estatísticas:
ANALYZE courses;
ANALYZE course_pdfs;
ANALYZE course_categories;
ANALYZE categories;
ANALYZE course_purchases;
ANALYZE users;

-- ==================================================
-- VERIFICAR ÍNDICES CRIADOS
-- ==================================================

-- Execute esta query para verificar todos os índices:
/*
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('courses', 'course_pdfs', 'course_categories', 'categories', 'course_purchases', 'users')
ORDER BY tablename, indexname;
*/

-- ==================================================
-- IMPACTO ESPERADO
-- ==================================================

/*
Com estes índices, esperamos:

1. Queries de listagem de cursos: -50-70% de tempo
2. Queries de PDFs de um curso: -40-60% de tempo
3. Queries de categorias: -30-50% de tempo
4. Verificação de compras: -60-80% de tempo

Performance total esperada: +30-40% na velocidade das APIs
*/
