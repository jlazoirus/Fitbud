-- ============================================================
-- Fitbud - Analitica de producto, IA y costos (REQ-27)
-- Idempotente. Ejecutar despues de coach_quota.sql.
-- No se aplica automaticamente en produccion.
-- ============================================================

-- 1. Tabla de eventos de producto (embudo, activacion, retencion, conversion)
-- Almacena eventos anonimizados: sin fotos, alergias, notas de salud ni prompts completos.
CREATE TABLE IF NOT EXISTS product_events (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id   TEXT,
  event_type   TEXT NOT NULL,
  properties   JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE product_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_events' AND policyname = 'pe_insert_own'
  ) THEN
    CREATE POLICY pe_insert_own ON product_events FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR auth.uid() = user_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_events' AND policyname = 'pe_select_own'
  ) THEN
    CREATE POLICY pe_select_own ON product_events FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS product_events_user_type_idx ON product_events (user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS product_events_type_date_idx  ON product_events (event_type, created_at DESC);

-- 2. Feature flags (versionado de prompts, flags de experimentos)
CREATE TABLE IF NOT EXISTS feature_flags (
  flag_name  TEXT PRIMARY KEY,
  enabled    BOOLEAN NOT NULL DEFAULT true,
  params     JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feature_flags' AND policyname = 'ff_all_read'
  ) THEN
    CREATE POLICY ff_all_read ON feature_flags FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feature_flags' AND policyname = 'ff_admin_write'
  ) THEN
    CREATE POLICY ff_admin_write ON feature_flags FOR ALL
      USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

INSERT INTO feature_flags (flag_name, enabled, params) VALUES
  ('prompt_version', true, '{"version": "v1"}'),
  ('analytics_enabled', true, '{}')
ON CONFLICT (flag_name) DO NOTHING;

-- 3. Extender coach_usage con columnas de trazabilidad de costos y prompts
ALTER TABLE coach_usage
  ADD COLUMN IF NOT EXISTS latency_ms       INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS prompt_version   TEXT DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS outcome          TEXT;

-- 4. Reemplazar complete_fresh_coach_part con version que registra latencia, costo y version
--    Los nuevos parametros tienen DEFAULT para mantener compatibilidad con llamadas existentes.
DROP FUNCTION IF EXISTS complete_fresh_coach_part(bigint,text,text,text,jsonb,int,int);

CREATE OR REPLACE FUNCTION complete_fresh_coach_part(
  p_usage_id       BIGINT,
  p_part_key       TEXT,
  p_context_key    TEXT,
  p_response_text  TEXT,
  p_metadata       JSONB    DEFAULT '{}'::JSONB,
  p_input_tokens   INT      DEFAULT 0,
  p_output_tokens  INT      DEFAULT 0,
  p_latency_ms     INT      DEFAULT NULL,
  p_estimated_cost NUMERIC  DEFAULT NULL,
  p_prompt_version TEXT     DEFAULT 'v1'
)
RETURNS TABLE (stored_result_id BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage      coach_usage%rowtype;
  v_result_id  BIGINT;
BEGIN
  SELECT * INTO v_usage FROM coach_usage WHERE id = p_usage_id FOR UPDATE;
  IF NOT FOUND OR v_usage.origin <> 'fresh' OR v_usage.status = 'refunded' THEN
    RAISE EXCEPTION 'fresh_usage_required';
  END IF;

  INSERT INTO coach_option_pool (
    user_id, action, context_key, content_hash, response_text, metadata,
    generated_usage_id, shown_count, first_shown_at, last_shown_at
  )
  VALUES (
    v_usage.user_id, v_usage.action, p_context_key, md5(p_response_text),
    p_response_text, COALESCE(p_metadata,'{}'::JSONB), p_usage_id, 1, now(), now()
  )
  ON CONFLICT (user_id, action, context_key, content_hash)
  DO UPDATE SET
    response_text  = excluded.response_text,
    metadata       = excluded.metadata,
    status         = 'active',
    shown_count    = coach_option_pool.shown_count + 1,
    first_shown_at = COALESCE(coach_option_pool.first_shown_at, now()),
    last_shown_at  = now(),
    updated_at     = now()
  RETURNING id INTO v_result_id;

  UPDATE coach_generation_parts
  SET status        = 'completed',
      response_text = p_response_text,
      result_id     = v_result_id,
      error_code    = NULL,
      completed_at  = now(),
      updated_at    = now()
  WHERE usage_id = p_usage_id AND part_key = p_part_key;

  UPDATE coach_usage
  SET status              = 'completed',
      result_id           = v_result_id,
      provider_calls      = provider_calls + 1,
      input_tokens        = input_tokens  + GREATEST(COALESCE(p_input_tokens,0),0),
      output_tokens       = output_tokens + GREATEST(COALESCE(p_output_tokens,0),0),
      latency_ms          = COALESCE(latency_ms, 0) + COALESCE(p_latency_ms, 0),
      estimated_cost_usd  = COALESCE(estimated_cost_usd, 0) + COALESCE(p_estimated_cost, 0),
      prompt_version      = COALESCE(p_prompt_version, 'v1'),
      metadata            = metadata || COALESCE(p_metadata, '{}'::JSONB),
      completed_at        = COALESCE(completed_at, now()),
      updated_at          = now()
  WHERE id = p_usage_id;

  INSERT INTO coach_option_impressions (
    user_id, usage_id, result_id, action, context_key, origin
  )
  VALUES (
    v_usage.user_id, p_usage_id, v_result_id, v_usage.action, p_context_key, 'fresh'
  );

  RETURN QUERY SELECT v_result_id;
END;
$$;

-- 5. Reemplazar fail_coach_generation_part con version que registra latencia
DROP FUNCTION IF EXISTS fail_coach_generation_part(bigint,text,text,boolean,int,int);

CREATE OR REPLACE FUNCTION fail_coach_generation_part(
  p_usage_id        BIGINT,
  p_part_key        TEXT,
  p_error_code      TEXT,
  p_provider_called BOOLEAN DEFAULT false,
  p_input_tokens    INT     DEFAULT 0,
  p_output_tokens   INT     DEFAULT 0,
  p_latency_ms      INT     DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed INT;
BEGIN
  UPDATE coach_generation_parts
  SET status     = 'failed',
      error_code = LEFT(COALESCE(p_error_code,'generation_failed'),120),
      updated_at = now()
  WHERE usage_id = p_usage_id AND part_key = p_part_key;

  SELECT COUNT(*)::INT INTO v_completed
  FROM coach_generation_parts
  WHERE usage_id = p_usage_id AND status = 'completed';

  IF v_completed = 0 THEN
    UPDATE coach_usage
    SET status         = 'refunded',
        error_code     = LEFT(COALESCE(p_error_code,'generation_failed'),120),
        provider_calls = provider_calls + CASE WHEN p_provider_called THEN 1 ELSE 0 END,
        input_tokens   = input_tokens   + GREATEST(COALESCE(p_input_tokens,0),0),
        output_tokens  = output_tokens  + GREATEST(COALESCE(p_output_tokens,0),0),
        latency_ms     = COALESCE(latency_ms, 0) + COALESCE(p_latency_ms, 0),
        refunded_at    = now(),
        updated_at     = now()
    WHERE id = p_usage_id AND origin = 'fresh';
    RETURN true;
  END IF;

  UPDATE coach_usage
  SET error_code     = LEFT(COALESCE(p_error_code,'partial_generation_failed'),120),
      provider_calls = provider_calls + CASE WHEN p_provider_called THEN 1 ELSE 0 END,
      input_tokens   = input_tokens   + GREATEST(COALESCE(p_input_tokens,0),0),
      output_tokens  = output_tokens  + GREATEST(COALESCE(p_output_tokens,0),0),
      latency_ms     = COALESCE(latency_ms, 0) + COALESCE(p_latency_ms, 0),
      updated_at     = now()
  WHERE id = p_usage_id;
  RETURN false;
END;
$$;

-- Revocar y regranting de las funciones actualizadas
REVOKE ALL ON FUNCTION complete_fresh_coach_part(bigint,text,text,text,jsonb,int,int,int,numeric,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION fail_coach_generation_part(bigint,text,text,boolean,int,int,int) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION complete_fresh_coach_part(bigint,text,text,text,jsonb,int,int,int,numeric,text) TO service_role;
GRANT EXECUTE ON FUNCTION fail_coach_generation_part(bigint,text,text,boolean,int,int,int) TO service_role;

-- 6. Vista de embudo de activacion (solo service_role lee; los clientes ven datos propios)
CREATE OR REPLACE VIEW v_activation_funnel AS
SELECT
  event_type,
  COUNT(DISTINCT user_id) FILTER (WHERE created_at > now() - INTERVAL '90 days') AS unique_users,
  COUNT(*)                FILTER (WHERE created_at > now() - INTERVAL '90 days') AS total_events,
  COUNT(DISTINCT user_id) FILTER (WHERE created_at > now() - INTERVAL '7 days')  AS unique_users_7d
FROM product_events
GROUP BY event_type
ORDER BY total_events DESC;

-- 7. Vista de costo IA por accion (admin)
CREATE OR REPLACE VIEW v_ai_cost_summary AS
SELECT
  action,
  COUNT(*) AS total_calls,
  SUM(CASE WHEN status = 'completed' OR status = 'reused' THEN 1 ELSE 0 END) AS successful_calls,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*),0), 1
  ) AS error_rate_pct,
  SUM(input_tokens + output_tokens) AS total_tokens,
  ROUND(SUM(COALESCE(estimated_cost_usd, 0))::NUMERIC, 4) AS total_cost_usd,
  ROUND(AVG(NULLIF(latency_ms, 0))::NUMERIC / 1000.0, 2) AS avg_latency_sec,
  COUNT(DISTINCT user_id) AS active_users,
  ROUND(
    SUM(COALESCE(estimated_cost_usd, 0))::NUMERIC / NULLIF(COUNT(DISTINCT user_id), 0), 4
  ) AS cost_per_user_usd
FROM coach_usage
WHERE quota_date >= (now() - INTERVAL '30 days')::DATE
GROUP BY action
ORDER BY COALESCE(SUM(estimated_cost_usd), 0) DESC, action;

-- Recuperacion: para rollback eliminar product_events, feature_flags, DROP las columnas nuevas
-- de coach_usage, y restaurar las funciones originales desde coach_quota.sql.
