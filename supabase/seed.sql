-- =============================================================================
-- GymFlow — Datos de Demo
-- =============================================================================
--
-- PASO 1: Reducir la longitud mínima del PIN a 4 caracteres
--   Supabase → Authentication → Sign In / Up → Password strength → Min length: 4
--
-- PASO 2: Crear los 4 usuarios en:
--   Supabase → Authentication → Users → Add user → "Create new user"
--   Tildar "Auto Confirm User" para que no requiera verificación de email.
--
--  Email                        Contraseña
--  ──────────────────────────────────────────
--  100000@retofitness.com       1000
--  12345678@retofitness.com     1234
--  87654321@retofitness.com     5678
--  11223344@retofitness.com     4321
--
-- Login en la app (DNI + PIN):
--   Admin      → DNI: 100000    / PIN: 1000
--   Entrenador → DNI: 12345678  / PIN: 1234
--   Cliente 1  → DNI: 87654321  / PIN: 5678
--   Cliente 2  → DNI: 11223344  / PIN: 4321
--
-- PASO 3: Ejecutar este script en SQL Editor → Run
-- =============================================================================

DO $$
DECLARE
  -- Auth UIDs (uuid — vienen de auth.users)
  uid_admin        uuid;
  uid_entrenador   uuid;
  uid_cliente1     uuid;
  uid_cliente2     uuid;

  -- IDs de perfiles (bigint — serial de las tablas)
  id_entrenador    bigint;
  id_cliente1      bigint;
  id_cliente2      bigint;

  -- IDs de ejercicios (bigint)
  ej_press_banca   bigint;
  ej_sentadilla    bigint;
  ej_peso_muerto   bigint;
  ej_dominadas     bigint;
  ej_press_militar bigint;
  ej_curl_biceps   bigint;
  ej_press_frances bigint;
  ej_plancha       bigint;
  ej_burpees       bigint;
  ej_zancadas      bigint;

  -- IDs de rutinas (bigint)
  rutina_torso_id  bigint;
  rutina_full_id   bigint;

BEGIN

  -- ── Obtener UIDs de auth ────────────────────────────────────────────────
  SELECT id INTO uid_admin      FROM auth.users WHERE email = '100000@retofitness.com';
  SELECT id INTO uid_entrenador FROM auth.users WHERE email = '12345678@retofitness.com';
  SELECT id INTO uid_cliente1   FROM auth.users WHERE email = '87654321@retofitness.com';
  SELECT id INTO uid_cliente2   FROM auth.users WHERE email = '11223344@retofitness.com';

  IF uid_admin IS NULL OR uid_entrenador IS NULL OR uid_cliente1 IS NULL OR uid_cliente2 IS NULL THEN
    RAISE EXCEPTION 'Faltan usuarios en auth.users. Creá los 4 usuarios primero en Supabase → Authentication → Users.';
  END IF;


  -- ── Tabla: users ────────────────────────────────────────────────────────
  INSERT INTO users (id, rol, activo) VALUES
    (uid_admin,      'admin',      true),
    (uid_entrenador, 'entrenador', true),
    (uid_cliente1,   'cliente',    true),
    (uid_cliente2,   'cliente',    true)
  ON CONFLICT (id) DO NOTHING;


  -- ── Tabla: entrenadores ─────────────────────────────────────────────────
  INSERT INTO entrenadores (user_id, nombre, apellido, correo)
  VALUES (uid_entrenador, 'Carlos', 'Rodríguez', '12345678@retofitness.com')
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO id_entrenador FROM entrenadores WHERE user_id = uid_entrenador;


  -- ── Tabla: clientes ─────────────────────────────────────────────────────
  INSERT INTO clientes (
    user_id, nombre, apellido, correo, estado,
    edad, peso, altura, genero, nivel_actividad,
    objetivo, fecha_vencimiento
  ) VALUES
    (uid_cliente1, 'Juan',  'Pérez',    '87654321@retofitness.com', true,
     25, 75, 178, 'M', 'Medio',
     'Ganar masa muscular y mejorar fuerza', '2026-12-31'),
    (uid_cliente2, 'Maria', 'Gonzalez', '11223344@retofitness.com', true,
     28, 60, 165, 'F', 'Alto',
     'Tonificar y bajar grasa corporal', '2026-12-31')
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO id_cliente1 FROM clientes WHERE user_id = uid_cliente1;
  SELECT id INTO id_cliente2 FROM clientes WHERE user_id = uid_cliente2;


  -- ── Tabla: ejercicios ───────────────────────────────────────────────────
  INSERT INTO ejercicios (nombre, descripcion, categoria, musculo_principal, musculos_secundarios, nivel_dificultad, equipamiento, instrucciones, consejos, activo, created_by)
  VALUES ('Press de Banca', 'Ejercicio fundamental de empuje para desarrollar el pecho.', 'fuerza', 'Pecho', ARRAY['Triceps', 'Hombros'], 'intermedio', ARRAY['Barra', 'Banco plano'],
    E'1. Tumbate en el banco con los pies planos en el suelo.\n2. Agarrá la barra con las manos a una anchura mayor que los hombros.\n3. Bajá la barra de forma controlada hasta rozar el pecho.\n4. Empujá hacia arriba hasta extender los brazos completamente.',
    'Mantené los omóplatos retraídos. No rebotar la barra. Inhalá al bajar, exhalá al empujar.', true, id_entrenador)
  RETURNING id INTO ej_press_banca;

  INSERT INTO ejercicios (nombre, descripcion, categoria, musculo_principal, musculos_secundarios, nivel_dificultad, equipamiento, instrucciones, consejos, activo, created_by)
  VALUES ('Sentadilla Libre', 'El ejercicio rey para el desarrollo de piernas y glúteos.', 'fuerza', 'Piernas', ARRAY['Glúteos', 'Core', 'Espalda'], 'intermedio', ARRAY['Barra', 'Rack'],
    E'1. Posicioná la barra en la parte alta de la espalda.\n2. Separar los pies al ancho de hombros, puntas levemente hacia afuera.\n3. Bajá doblando rodillas y cadera hasta que los muslos queden paralelos al suelo.\n4. Empujá el suelo para volver a la posición inicial.',
    'Rodillas en línea con los pies. Espalda neutra en todo momento.', true, id_entrenador)
  RETURNING id INTO ej_sentadilla;

  INSERT INTO ejercicios (nombre, descripcion, categoria, musculo_principal, musculos_secundarios, nivel_dificultad, equipamiento, instrucciones, consejos, activo, created_by)
  VALUES ('Peso Muerto', 'Movimiento de tirón que trabaja la cadena posterior completa.', 'fuerza', 'Espalda', ARRAY['Piernas', 'Glúteos', 'Core'], 'avanzado', ARRAY['Barra'],
    E'1. Pará con los pies al ancho de caderas, barra sobre el empeine.\n2. Doblá cadera y rodillas para agarrar la barra.\n3. Mantené espalda recta, pecho arriba.\n4. Empujá el suelo mientras extendés caderas y rodillas simultáneamente.\n5. Bajá la barra con control.',
    'No redondees la espalda baja. La barra debe rozar las piernas en todo el recorrido.', true, id_entrenador)
  RETURNING id INTO ej_peso_muerto;

  INSERT INTO ejercicios (nombre, descripcion, categoria, musculo_principal, musculos_secundarios, nivel_dificultad, equipamiento, instrucciones, consejos, activo, created_by)
  VALUES ('Dominadas', 'Ejercicio de tirón con peso corporal para espalda y bíceps.', 'fuerza', 'Espalda', ARRAY['Biceps', 'Hombros'], 'intermedio', ARRAY['Barra de dominadas'],
    E'1. Colgáte de la barra con palmas hacia adelante, agarre mayor al ancho de hombros.\n2. Jalá el cuerpo hacia arriba llevando el pecho a la barra.\n3. Pausá arriba y bajá de forma controlada.\n4. No balanceés el cuerpo.',
    'Si no podés hacer ninguna, usá banda elástica. Concentrate en retraer los omóplatos al subir.', true, id_entrenador)
  RETURNING id INTO ej_dominadas;

  INSERT INTO ejercicios (nombre, descripcion, categoria, musculo_principal, musculos_secundarios, nivel_dificultad, equipamiento, instrucciones, consejos, activo, created_by)
  VALUES ('Press Militar', 'Empuje vertical para el desarrollo de los hombros.', 'fuerza', 'Hombros', ARRAY['Triceps', 'Core'], 'intermedio', ARRAY['Barra', 'Rack'],
    E'1. Pará con los pies al ancho de hombros, barra a la altura del pecho.\n2. Agarre ligeramente más ancho que los hombros, codos adelante.\n3. Empujá la barra verticalmente sobre la cabeza hasta extender los brazos.\n4. Bajá de forma controlada.',
    'Core activado en todo momento para proteger la espalda baja.', true, id_entrenador)
  RETURNING id INTO ej_press_militar;

  INSERT INTO ejercicios (nombre, descripcion, categoria, musculo_principal, musculos_secundarios, nivel_dificultad, equipamiento, instrucciones, consejos, activo, created_by)
  VALUES ('Curl de Bíceps con Barra', 'Ejercicio de aislamiento para el desarrollo del bíceps.', 'fuerza', 'Biceps', ARRAY['Antebrazos'], 'principiante', ARRAY['Barra EZ o recta'],
    E'1. Pará con los pies al ancho de hombros, barra agarrada con palmas hacia arriba.\n2. Codos pegados a los costados del torso.\n3. Levantá la barra contrayendo el bíceps hasta los hombros.\n4. Bajá lentamente resistiendo el peso.',
    'No balanceés el torso. Controlá la bajada — es tan importante como la subida.', true, id_entrenador)
  RETURNING id INTO ej_curl_biceps;

  INSERT INTO ejercicios (nombre, descripcion, categoria, musculo_principal, musculos_secundarios, nivel_dificultad, equipamiento, instrucciones, consejos, activo, created_by)
  VALUES ('Press Francés (Tríceps)', 'Ejercicio de aislamiento para el tríceps en posición acostada.', 'fuerza', 'Triceps', ARRAY['Hombros'], 'principiante', ARRAY['Barra EZ', 'Banco plano'],
    E'1. Tumbate en el banco con la barra extendida sobre el pecho, agarre cerrado.\n2. Bajá la barra doblando los codos hacia la frente.\n3. Los codos deben apuntar al techo y no moverse.\n4. Extendé los brazos volviendo a la posición inicial.',
    'Codos fijos — solo se doblan y extienden. Empezá con poco peso para aprender el movimiento.', true, id_entrenador)
  RETURNING id INTO ej_press_frances;

  INSERT INTO ejercicios (nombre, descripcion, categoria, musculo_principal, musculos_secundarios, nivel_dificultad, equipamiento, instrucciones, consejos, activo, created_by)
  VALUES ('Plancha Abdominal', 'Ejercicio isométrico para fortalecer el core completo.', 'resistencia', 'Core', ARRAY['Hombros', 'Glúteos'], 'principiante', ARRAY['Esterilla (opcional)'],
    E'1. Apoyate sobre los antebrazos y las puntas de los pies.\n2. Cuerpo en línea recta de cabeza a talones.\n3. Glúteos y abdomen contraídos.\n4. Mantené la posición el tiempo indicado.\n5. Respirá de forma constante.',
    'No dejés que las caderas suban ni bajen. Si te cuesta, bajá las rodillas al suelo.', true, id_entrenador)
  RETURNING id INTO ej_plancha;

  INSERT INTO ejercicios (nombre, descripcion, categoria, musculo_principal, musculos_secundarios, nivel_dificultad, equipamiento, instrucciones, consejos, activo, created_by)
  VALUES ('Burpees', 'Ejercicio funcional de cuerpo completo con alta demanda cardiovascular.', 'cardio', 'Full Body', ARRAY['Core', 'Piernas', 'Pecho'], 'intermedio', ARRAY[]::text[],
    E'1. De pie, bajá en cuclillas y apoyá las manos en el suelo.\n2. Saltá los pies hacia atrás quedando en posición de plancha.\n3. Realizá una flexión (opcional).\n4. Saltá los pies hacia las manos.\n5. Saltá hacia arriba con los brazos extendidos.',
    'Mantené un ritmo sostenible. Podés omitir la flexión si sos principiante.', true, id_entrenador)
  RETURNING id INTO ej_burpees;

  INSERT INTO ejercicios (nombre, descripcion, categoria, musculo_principal, musculos_secundarios, nivel_dificultad, equipamiento, instrucciones, consejos, activo, created_by)
  VALUES ('Zancadas', 'Ejercicio unilateral para piernas y glúteos, mejora el equilibrio.', 'fuerza', 'Piernas', ARRAY['Glúteos', 'Core'], 'principiante', ARRAY['Mancuernas (opcional)'],
    E'1. De pie, dá un paso largo hacia adelante con una pierna.\n2. Bajá la rodilla trasera hacia el suelo sin tocarlo.\n3. La rodilla delantera no debe superar la punta del pie.\n4. Empujá con el pie delantero para volver.\n5. Alternár piernas.',
    'Torso erguido en todo momento. Agregá mancuernas cuando el peso corporal sea fácil.', true, id_entrenador)
  RETURNING id INTO ej_zancadas;


  -- ── Tabla: rutinas ──────────────────────────────────────────────────────
  INSERT INTO rutinas (nombre, descripcion, objetivo, nivel_dificultad, created_by)
  VALUES ('Torso–Pierna A', 'Rutina de hipertrofia dividida en torso y pierna. Ideal para ganar masa muscular de forma equilibrada.', 'Hipertrofia', 'intermedio', id_entrenador)
  RETURNING id INTO rutina_torso_id;

  INSERT INTO rutinas (nombre, descripcion, objetivo, nivel_dificultad, created_by)
  VALUES ('Full Body Principiante', 'Rutina de cuerpo completo para personas que se inician en el entrenamiento con pesas.', 'Fuerza y acondicionamiento', 'principiante', id_entrenador)
  RETURNING id INTO rutina_full_id;


  -- ── Tabla: rutinas_ejercicios ───────────────────────────────────────────
  -- Rutina 1: Torso–Pierna A
  INSERT INTO rutinas_ejercicios (rutina_id, ejercicio_id, ejercicio_alternativo_id, orden, series, repeticiones, descanso_segundos, porcentaje_fuerza, notas) VALUES
    (rutina_torso_id, ej_press_banca,   ej_press_frances, 1, 4, '8',  90, 75, 'Agarre medio. Controlá la bajada 2 segundos.'),
    (rutina_torso_id, ej_dominadas,     ej_curl_biceps,   2, 4, '8',  90, 70, 'Si no llegás a 8, usá banda de asistencia.'),
    (rutina_torso_id, ej_press_militar, null,             3, 3, '10', 75, 65, 'Peso moderado, técnica perfecta.'),
    (rutina_torso_id, ej_curl_biceps,   null,             4, 3, '12', 60, 60, 'Supinación completa en el tope del movimiento.'),
    (rutina_torso_id, ej_press_frances, null,             5, 3, '12', 60, 60, 'Codos fijos, no los abras.');

  -- Rutina 2: Full Body Principiante
  INSERT INTO rutinas_ejercicios (rutina_id, ejercicio_id, ejercicio_alternativo_id, orden, series, repeticiones, descanso_segundos, porcentaje_fuerza, notas) VALUES
    (rutina_full_id, ej_sentadilla,    ej_zancadas, 1, 3, '10',     90, 60, 'Bajá hasta paralelo. Espalda neutra.'),
    (rutina_full_id, ej_press_banca,   null,        2, 3, '10',     75, 60, 'Peso liviano para aprender el movimiento.'),
    (rutina_full_id, ej_peso_muerto,   null,        3, 3, '8',      90, 55, 'Peso muy liviano. Prioridad: técnica.'),
    (rutina_full_id, ej_press_militar, null,        4, 3, '10',     75, 55, null),
    (rutina_full_id, ej_plancha,       null,        5, 3, '30 seg', 60, 100, 'Mantené posición 30 segundos. Descansá 60 seg.'),
    (rutina_full_id, ej_burpees,       null,        6, 3, '10',     60, 100, 'Ritmo constante, no rápido.');


  -- ── Tabla: rutinas_clientes ─────────────────────────────────────────────
  -- Juan (cliente 1) → Torso–Pierna A, Lunes y Jueves
  INSERT INTO rutinas_clientes (rutina_id, cliente_id, dia_semana) VALUES
    (rutina_torso_id, id_cliente1, 1),
    (rutina_torso_id, id_cliente1, 4);

  -- María (cliente 2) → Full Body Principiante, Lunes / Miércoles / Viernes
  INSERT INTO rutinas_clientes (rutina_id, cliente_id, dia_semana) VALUES
    (rutina_full_id, id_cliente2, 1),
    (rutina_full_id, id_cliente2, 3),
    (rutina_full_id, id_cliente2, 5);


  RAISE NOTICE '✓ Datos de demo insertados correctamente.';
  RAISE NOTICE '  Entrenador ID: %', id_entrenador;
  RAISE NOTICE '  Cliente Juan ID: %',  id_cliente1;
  RAISE NOTICE '  Cliente María ID: %', id_cliente2;
  RAISE NOTICE '  Rutina Torso ID: %',  rutina_torso_id;
  RAISE NOTICE '  Rutina Full Body ID: %', rutina_full_id;

END $$;
