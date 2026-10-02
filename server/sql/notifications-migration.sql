ALTER TABLE public.tokens
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS tokens_expo_push_token_unique
  ON public.tokens(expo_push_token) WHERE expo_push_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id             SERIAL PRIMARY KEY,
  token_id       INTEGER NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  mensagem       TEXT NOT NULL CHECK (char_length(btrim(mensagem)) BETWEEN 1 AND 500),
  data_criacao   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_entrega   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS notificacoes_pendentes_idx
  ON public.notificacoes(token_id, data_entrega, id);

CREATE TABLE IF NOT EXISTS public.app_bloqueios (
  id             SERIAL PRIMARY KEY,
  token_id       INTEGER NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  package_name   VARCHAR(255) NOT NULL,
  app_nome       VARCHAR(255) NOT NULL,
  iniciado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bloqueado_ate  TIMESTAMPTZ NOT NULL,
  UNIQUE(token_id, package_name)
);

CREATE INDEX IF NOT EXISTS app_bloqueios_ativos_idx
  ON public.app_bloqueios(token_id, bloqueado_ate);