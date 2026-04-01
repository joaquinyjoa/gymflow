-- =============================================================================
-- GymFlow — Row Level Security (RLS)
-- Pegar en: Supabase → SQL Editor → New query → Run
-- =============================================================================


-- =============================================================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================================================
ALTER TABLE users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrenadores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicios                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas_ejercicios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas_clientes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas_clientes_ejercicios ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 2. FUNCIONES AUXILIARES (SECURITY DEFINER evita referencias circulares)
-- =============================================================================

-- Devuelve el rol del usuario autenticado
CREATE OR REPLACE FUNCTION get_user_rol()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT rol FROM users WHERE id = auth.uid()
$$;

-- Devuelve el ID de perfil del entrenador autenticado (entrenadores.id — bigint)
CREATE OR REPLACE FUNCTION get_entrenador_id()
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id FROM entrenadores WHERE user_id = auth.uid() LIMIT 1
$$;

-- Devuelve el ID de perfil del cliente autenticado (clientes.id — bigint)
CREATE OR REPLACE FUNCTION get_cliente_id()
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id FROM clientes WHERE user_id = auth.uid() LIMIT 1
$$;


-- =============================================================================
-- 3. TABLA: users
-- El admin gestiona usuarios; cada usuario puede leer su propia fila
-- para que el AuthContext pueda obtener su rol al iniciar sesión.
-- =============================================================================
DROP POLICY IF EXISTS "users_select_own"     ON users;
DROP POLICY IF EXISTS "users_select_admin"   ON users;
DROP POLICY IF EXISTS "users_update_admin"   ON users;

-- Cualquier usuario autenticado puede leer su propia fila (login flow)
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (id = auth.uid());

-- Admin puede leer todos los usuarios (panel de administración)
CREATE POLICY "users_select_admin" ON users
  FOR SELECT USING (get_user_rol() = 'admin');

-- Admin puede actualizar usuarios (activar/desactivar)
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE USING (get_user_rol() = 'admin');


-- =============================================================================
-- 4. TABLA: clientes
-- =============================================================================
DROP POLICY IF EXISTS "clientes_select_admin"      ON clientes;
DROP POLICY IF EXISTS "clientes_select_entrenador" ON clientes;
DROP POLICY IF EXISTS "clientes_select_own"        ON clientes;
DROP POLICY IF EXISTS "clientes_insert_admin"      ON clientes;
DROP POLICY IF EXISTS "clientes_update_admin"      ON clientes;
DROP POLICY IF EXISTS "clientes_delete_admin"      ON clientes;

-- Admin: acceso total
CREATE POLICY "clientes_select_admin" ON clientes
  FOR SELECT USING (get_user_rol() = 'admin');

CREATE POLICY "clientes_insert_admin" ON clientes
  FOR INSERT WITH CHECK (get_user_rol() = 'admin');

CREATE POLICY "clientes_update_admin" ON clientes
  FOR UPDATE USING (get_user_rol() = 'admin');

CREATE POLICY "clientes_delete_admin" ON clientes
  FOR DELETE USING (get_user_rol() = 'admin');

-- Entrenador: puede ver todos los clientes (para asignar rutinas)
CREATE POLICY "clientes_select_entrenador" ON clientes
  FOR SELECT USING (get_user_rol() = 'entrenador');

-- Cliente: solo puede ver su propio perfil
CREATE POLICY "clientes_select_own" ON clientes
  FOR SELECT USING (user_id = auth.uid());


-- =============================================================================
-- 5. TABLA: entrenadores
-- =============================================================================
DROP POLICY IF EXISTS "entrenadores_select_admin"      ON entrenadores;
DROP POLICY IF EXISTS "entrenadores_select_own"        ON entrenadores;
DROP POLICY IF EXISTS "entrenadores_insert_admin"      ON entrenadores;
DROP POLICY IF EXISTS "entrenadores_update_admin"      ON entrenadores;
DROP POLICY IF EXISTS "entrenadores_delete_admin"      ON entrenadores;

-- Admin: acceso total
CREATE POLICY "entrenadores_select_admin" ON entrenadores
  FOR SELECT USING (get_user_rol() = 'admin');

CREATE POLICY "entrenadores_insert_admin" ON entrenadores
  FOR INSERT WITH CHECK (get_user_rol() = 'admin');

CREATE POLICY "entrenadores_update_admin" ON entrenadores
  FOR UPDATE USING (get_user_rol() = 'admin');

CREATE POLICY "entrenadores_delete_admin" ON entrenadores
  FOR DELETE USING (get_user_rol() = 'admin');

-- Entrenador: puede leer su propio perfil
CREATE POLICY "entrenadores_select_own" ON entrenadores
  FOR SELECT USING (user_id = auth.uid());


-- =============================================================================
-- 6. TABLA: ejercicios
-- Cada entrenador gestiona sus propios ejercicios.
-- Todos los autenticados pueden leer (clientes ven el ejercicio de su rutina).
-- =============================================================================
DROP POLICY IF EXISTS "ejercicios_select_all"          ON ejercicios;
DROP POLICY IF EXISTS "ejercicios_insert_entrenador"   ON ejercicios;
DROP POLICY IF EXISTS "ejercicios_update_entrenador"   ON ejercicios;
DROP POLICY IF EXISTS "ejercicios_delete_entrenador"   ON ejercicios;
DROP POLICY IF EXISTS "ejercicios_delete_admin"        ON ejercicios;

-- Todos los usuarios autenticados pueden leer ejercicios
CREATE POLICY "ejercicios_select_all" ON ejercicios
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Entrenador: crea y edita solo sus propios ejercicios (created_by = su id de perfil)
CREATE POLICY "ejercicios_insert_entrenador" ON ejercicios
  FOR INSERT WITH CHECK (
    get_user_rol() = 'entrenador'
    AND created_by = get_entrenador_id()
  );

CREATE POLICY "ejercicios_update_entrenador" ON ejercicios
  FOR UPDATE USING (
    get_user_rol() = 'entrenador'
    AND created_by = get_entrenador_id()
  );

CREATE POLICY "ejercicios_delete_entrenador" ON ejercicios
  FOR DELETE USING (
    get_user_rol() = 'entrenador'
    AND created_by = get_entrenador_id()
  );

-- Admin también puede eliminar ejercicios
CREATE POLICY "ejercicios_delete_admin" ON ejercicios
  FOR DELETE USING (get_user_rol() = 'admin');


-- =============================================================================
-- 7. TABLA: rutinas
-- Cada entrenador gestiona sus propias rutinas.
-- Clientes solo pueden ver las rutinas que tienen asignadas.
-- =============================================================================
DROP POLICY IF EXISTS "rutinas_select_entrenador"  ON rutinas;
DROP POLICY IF EXISTS "rutinas_select_cliente"     ON rutinas;
DROP POLICY IF EXISTS "rutinas_select_admin"       ON rutinas;
DROP POLICY IF EXISTS "rutinas_insert_entrenador"  ON rutinas;
DROP POLICY IF EXISTS "rutinas_update_entrenador"  ON rutinas;
DROP POLICY IF EXISTS "rutinas_delete_entrenador"  ON rutinas;
DROP POLICY IF EXISTS "rutinas_delete_admin"       ON rutinas;

-- Admin: ve todas
CREATE POLICY "rutinas_select_admin" ON rutinas
  FOR SELECT USING (get_user_rol() = 'admin');

-- Entrenador: ve solo las suyas
CREATE POLICY "rutinas_select_entrenador" ON rutinas
  FOR SELECT USING (
    get_user_rol() = 'entrenador'
    AND created_by = get_entrenador_id()
  );

-- Cliente: ve las rutinas asignadas a él
CREATE POLICY "rutinas_select_cliente" ON rutinas
  FOR SELECT USING (
    get_user_rol() = 'cliente'
    AND id IN (
      SELECT rutina_id FROM rutinas_clientes
      WHERE cliente_id = get_cliente_id()
    )
  );

CREATE POLICY "rutinas_insert_entrenador" ON rutinas
  FOR INSERT WITH CHECK (
    get_user_rol() = 'entrenador'
    AND created_by = get_entrenador_id()
  );

CREATE POLICY "rutinas_update_entrenador" ON rutinas
  FOR UPDATE USING (
    get_user_rol() = 'entrenador'
    AND created_by = get_entrenador_id()
  );

CREATE POLICY "rutinas_delete_entrenador" ON rutinas
  FOR DELETE USING (
    get_user_rol() = 'entrenador'
    AND created_by = get_entrenador_id()
  );

CREATE POLICY "rutinas_delete_admin" ON rutinas
  FOR DELETE USING (get_user_rol() = 'admin');


-- =============================================================================
-- 8. TABLA: rutinas_ejercicios
-- Ejercicios dentro de una rutina (estructura base, no overrides de cliente)
-- =============================================================================
DROP POLICY IF EXISTS "rutinas_ejercicios_select_entrenador" ON rutinas_ejercicios;
DROP POLICY IF EXISTS "rutinas_ejercicios_select_cliente"    ON rutinas_ejercicios;
DROP POLICY IF EXISTS "rutinas_ejercicios_select_admin"      ON rutinas_ejercicios;
DROP POLICY IF EXISTS "rutinas_ejercicios_write_entrenador"  ON rutinas_ejercicios;
DROP POLICY IF EXISTS "rutinas_ejercicios_write_admin"       ON rutinas_ejercicios;

-- Admin: acceso total
CREATE POLICY "rutinas_ejercicios_select_admin" ON rutinas_ejercicios
  FOR SELECT USING (get_user_rol() = 'admin');

-- Entrenador: ve los ejercicios de sus rutinas
CREATE POLICY "rutinas_ejercicios_select_entrenador" ON rutinas_ejercicios
  FOR SELECT USING (
    get_user_rol() = 'entrenador'
    AND rutina_id IN (
      SELECT id FROM rutinas WHERE created_by = get_entrenador_id()
    )
  );

-- Cliente: ve los ejercicios de sus rutinas asignadas
CREATE POLICY "rutinas_ejercicios_select_cliente" ON rutinas_ejercicios
  FOR SELECT USING (
    get_user_rol() = 'cliente'
    AND rutina_id IN (
      SELECT rutina_id FROM rutinas_clientes
      WHERE cliente_id = get_cliente_id()
    )
  );

-- Entrenador: escribe en ejercicios de sus propias rutinas
CREATE POLICY "rutinas_ejercicios_write_entrenador" ON rutinas_ejercicios
  FOR ALL USING (
    get_user_rol() = 'entrenador'
    AND rutina_id IN (
      SELECT id FROM rutinas WHERE created_by = get_entrenador_id()
    )
  );

-- Admin: escribe en cualquier rutina
CREATE POLICY "rutinas_ejercicios_write_admin" ON rutinas_ejercicios
  FOR ALL USING (get_user_rol() = 'admin');


-- =============================================================================
-- 9. TABLA: rutinas_clientes
-- Asignaciones de rutina a cliente por día de la semana
-- =============================================================================
DROP POLICY IF EXISTS "rutinas_clientes_select_admin"      ON rutinas_clientes;
DROP POLICY IF EXISTS "rutinas_clientes_select_entrenador" ON rutinas_clientes;
DROP POLICY IF EXISTS "rutinas_clientes_select_cliente"    ON rutinas_clientes;
DROP POLICY IF EXISTS "rutinas_clientes_write_entrenador"  ON rutinas_clientes;
DROP POLICY IF EXISTS "rutinas_clientes_write_admin"       ON rutinas_clientes;

-- Admin: acceso total
CREATE POLICY "rutinas_clientes_select_admin" ON rutinas_clientes
  FOR SELECT USING (get_user_rol() = 'admin');

CREATE POLICY "rutinas_clientes_write_admin" ON rutinas_clientes
  FOR ALL USING (get_user_rol() = 'admin');

-- Entrenador: ve y gestiona todas las asignaciones
CREATE POLICY "rutinas_clientes_select_entrenador" ON rutinas_clientes
  FOR SELECT USING (get_user_rol() = 'entrenador');

CREATE POLICY "rutinas_clientes_write_entrenador" ON rutinas_clientes
  FOR ALL USING (get_user_rol() = 'entrenador');

-- Cliente: ve solo sus propias asignaciones
CREATE POLICY "rutinas_clientes_select_cliente" ON rutinas_clientes
  FOR SELECT USING (
    get_user_rol() = 'cliente'
    AND cliente_id = get_cliente_id()
  );


-- =============================================================================
-- 10. TABLA: rutinas_clientes_ejercicios
-- Overrides personalizados de ejercicios por cliente
-- =============================================================================
DROP POLICY IF EXISTS "rce_select_admin"      ON rutinas_clientes_ejercicios;
DROP POLICY IF EXISTS "rce_select_entrenador" ON rutinas_clientes_ejercicios;
DROP POLICY IF EXISTS "rce_select_cliente"    ON rutinas_clientes_ejercicios;
DROP POLICY IF EXISTS "rce_write_entrenador"  ON rutinas_clientes_ejercicios;
DROP POLICY IF EXISTS "rce_write_admin"       ON rutinas_clientes_ejercicios;

-- Admin: acceso total
CREATE POLICY "rce_select_admin" ON rutinas_clientes_ejercicios
  FOR SELECT USING (get_user_rol() = 'admin');

CREATE POLICY "rce_write_admin" ON rutinas_clientes_ejercicios
  FOR ALL USING (get_user_rol() = 'admin');

-- Entrenador: gestiona overrides de sus clientes
CREATE POLICY "rce_select_entrenador" ON rutinas_clientes_ejercicios
  FOR SELECT USING (get_user_rol() = 'entrenador');

CREATE POLICY "rce_write_entrenador" ON rutinas_clientes_ejercicios
  FOR ALL USING (get_user_rol() = 'entrenador');

-- Cliente: solo lee sus propios overrides
CREATE POLICY "rce_select_cliente" ON rutinas_clientes_ejercicios
  FOR SELECT USING (
    get_user_rol() = 'cliente'
    AND rutina_cliente_id IN (
      SELECT id FROM rutinas_clientes WHERE cliente_id = get_cliente_id()
    )
  );
