-- ============================================================
-- SCHEMA COMPLETO - BARBEARIA SUPABASE
-- ============================================================

-- ============================================================
-- ETAPA 1: REMOVER TUDO EXISTENTE
-- ============================================================

DROP FUNCTION IF EXISTS register_user(UUID, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS trigger_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS atualizar_media_avaliacao() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS uid_usuario() CASCADE;
DROP FUNCTION IF EXISTS usuario_id() CASCADE;

DROP TABLE IF EXISTS tb_mensagem CASCADE;
DROP TABLE IF EXISTS tb_lista_espera CASCADE;
DROP TABLE IF EXISTS tb_favorito CASCADE;
DROP TABLE IF EXISTS tb_galeria CASCADE;
DROP TABLE IF EXISTS tb_promocao CASCADE;
DROP TABLE IF EXISTS tb_notificacao CASCADE;
DROP TABLE IF EXISTS tb_avaliacao CASCADE;
DROP TABLE IF EXISTS tb_servico_has_tb_agendamento CASCADE;
DROP TABLE IF EXISTS tb_barbeiro_indisponibilidade CASCADE;
DROP TABLE IF EXISTS tb_agendamento CASCADE;
DROP TABLE IF EXISTS tb_servico CASCADE;
DROP TABLE IF EXISTS tb_barbeiro CASCADE;
DROP TABLE IF EXISTS tb_usuario CASCADE;

DROP TYPE IF EXISTS tipo_usuario_enum CASCADE;
DROP TYPE IF EXISTS status_agendamento_enum CASCADE;

-- ============================================================
-- ETAPA 2: EXTENSÕES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ETAPA 3: TIPOS ENUM
-- ============================================================

DO $$ BEGIN
  CREATE TYPE tipo_usuario_enum AS ENUM ('cliente', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE status_agendamento_enum AS ENUM (
    'pendente',
    'confirmado',
    'cancelado',
    'concluido'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- ETAPA 4: TABELAS ORIGINAIS
-- ============================================================

CREATE TABLE tb_usuario (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id       UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  telefone      TEXT,
  tipo_usuario  tipo_usuario_enum NOT NULL DEFAULT 'cliente',
  foto_url      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_barbeiro (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome            TEXT NOT NULL,
  especialidade   TEXT,
  foto_url        TEXT,
  bio             TEXT,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  media_avaliacao NUMERIC(3,2) DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_servico (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome         TEXT NOT NULL,
  descricao    TEXT,
  preco        NUMERIC(10,2) NOT NULL,
  duracao_min  INTEGER NOT NULL,
  ativo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_agendamento (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario   UUID NOT NULL REFERENCES tb_usuario(id) ON DELETE CASCADE,
  id_barbeiro  UUID NOT NULL REFERENCES tb_barbeiro(id) ON DELETE RESTRICT,
  data_hora    TIMESTAMPTZ NOT NULL,
  status       status_agendamento_enum NOT NULL DEFAULT 'pendente',
  observacao   TEXT,
  preco_total  NUMERIC(10,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_servico_has_tb_agendamento (
  id_servico     UUID NOT NULL REFERENCES tb_servico(id) ON DELETE RESTRICT,
  id_agendamento UUID NOT NULL REFERENCES tb_agendamento(id) ON DELETE CASCADE,
  preco_servico  NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (id_servico, id_agendamento)
);

CREATE TABLE tb_barbeiro_indisponibilidade (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_barbeiro UUID NOT NULL REFERENCES tb_barbeiro(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim    TIME NOT NULL,
  motivo      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ETAPA 5: TABELAS NOVAS
-- ============================================================

CREATE TABLE tb_avaliacao (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_agendamento UUID NOT NULL UNIQUE REFERENCES tb_agendamento(id) ON DELETE CASCADE,
  id_usuario     UUID NOT NULL REFERENCES tb_usuario(id) ON DELETE CASCADE,
  id_barbeiro    UUID NOT NULL REFERENCES tb_barbeiro(id) ON DELETE CASCADE,
  nota           INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_notificacao (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID NOT NULL REFERENCES tb_usuario(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL,
  mensagem   TEXT NOT NULL,
  lida       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_promocao (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo              TEXT NOT NULL,
  descricao           TEXT,
  desconto_percentual NUMERIC(5,2) CHECK (desconto_percentual BETWEEN 0 AND 100),
  data_inicio         DATE NOT NULL,
  data_fim            DATE NOT NULL,
  ativa               BOOLEAN NOT NULL DEFAULT TRUE,
  imagem_url          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (data_fim >= data_inicio)
);

CREATE TABLE tb_galeria (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_barbeiro UUID REFERENCES tb_barbeiro(id) ON DELETE SET NULL,
  descricao   TEXT,
  imagem_url  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_favorito (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario  UUID NOT NULL REFERENCES tb_usuario(id) ON DELETE CASCADE,
  id_barbeiro UUID REFERENCES tb_barbeiro(id) ON DELETE CASCADE,
  id_servico  UUID REFERENCES tb_servico(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (id_barbeiro IS NOT NULL AND id_servico IS NULL) OR
    (id_barbeiro IS NULL AND id_servico IS NOT NULL)
  ),
  UNIQUE (id_usuario, id_barbeiro),
  UNIQUE (id_usuario, id_servico)
);

CREATE TABLE tb_lista_espera (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario    UUID NOT NULL REFERENCES tb_usuario(id) ON DELETE CASCADE,
  id_barbeiro   UUID NOT NULL REFERENCES tb_barbeiro(id) ON DELETE CASCADE,
  id_servico    UUID NOT NULL REFERENCES tb_servico(id) ON DELETE CASCADE,
  data_desejada DATE NOT NULL,
  notificado    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tb_mensagem (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID NOT NULL REFERENCES tb_usuario(id) ON DELETE CASCADE,
  conteudo   TEXT NOT NULL,
  de_admin   BOOLEAN NOT NULL DEFAULT FALSE,
  lida       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ETAPA 6: ÍNDICES DE PERFORMANCE
-- ============================================================

CREATE INDEX idx_usuario_auth_id            ON tb_usuario(auth_id);
CREATE INDEX idx_usuario_email              ON tb_usuario(email);
CREATE INDEX idx_usuario_tipo               ON tb_usuario(tipo_usuario);

CREATE INDEX idx_agendamento_usuario        ON tb_agendamento(id_usuario);
CREATE INDEX idx_agendamento_barbeiro       ON tb_agendamento(id_barbeiro);
CREATE INDEX idx_agendamento_data_hora      ON tb_agendamento(data_hora);
CREATE INDEX idx_agendamento_status         ON tb_agendamento(status);

CREATE INDEX idx_barbeiro_ativo             ON tb_barbeiro(ativo);
CREATE INDEX idx_servico_ativo              ON tb_servico(ativo);

CREATE INDEX idx_indisponibilidade_barbeiro ON tb_barbeiro_indisponibilidade(id_barbeiro);
CREATE INDEX idx_indisponibilidade_data     ON tb_barbeiro_indisponibilidade(data);

CREATE INDEX idx_avaliacao_barbeiro         ON tb_avaliacao(id_barbeiro);
CREATE INDEX idx_avaliacao_usuario          ON tb_avaliacao(id_usuario);

CREATE INDEX idx_notificacao_usuario        ON tb_notificacao(id_usuario);
CREATE INDEX idx_notificacao_lida           ON tb_notificacao(lida);

CREATE INDEX idx_promocao_ativa             ON tb_promocao(ativa);
CREATE INDEX idx_promocao_datas             ON tb_promocao(data_inicio, data_fim);

CREATE INDEX idx_galeria_barbeiro           ON tb_galeria(id_barbeiro);
CREATE INDEX idx_favorito_usuario           ON tb_favorito(id_usuario);

CREATE INDEX idx_lista_espera_usuario       ON tb_lista_espera(id_usuario);
CREATE INDEX idx_lista_espera_barbeiro      ON tb_lista_espera(id_barbeiro);
CREATE INDEX idx_lista_espera_data          ON tb_lista_espera(data_desejada);

CREATE INDEX idx_mensagem_usuario           ON tb_mensagem(id_usuario);
CREATE INDEX idx_mensagem_created           ON tb_mensagem(created_at);

-- ============================================================
-- ETAPA 7: FUNÇÕES AUXILIARES E RPC
-- ============================================================

CREATE OR REPLACE FUNCTION uid_usuario()
RETURNS UUID
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION usuario_id()
RETURNS UUID
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM tb_usuario WHERE auth_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tb_usuario
    WHERE auth_id = auth.uid()
      AND tipo_usuario = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION atualizar_media_avaliacao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tb_barbeiro
  SET media_avaliacao = (
    SELECT COALESCE(AVG(nota), 0)
    FROM tb_avaliacao
    WHERE id_barbeiro = COALESCE(NEW.id_barbeiro, OLD.id_barbeiro)
  )
  WHERE id = COALESCE(NEW.id_barbeiro, OLD.id_barbeiro);
  RETURN NEW;
END;
$$;

-- ============================================================
-- RPC FUNCTION: register_user (SECURITY DEFINER)
-- ============================================================
-- Esta função faz bypass da RLS ao inserir novo usuário após signUp
-- porque o client não tem sessão autenticada neste ponto.

CREATE OR REPLACE FUNCTION register_user(
  p_auth_id UUID,
  p_nome TEXT,
  p_email TEXT,
  p_telefone TEXT,
  p_tipo_usuario TEXT DEFAULT 'cliente'
)
RETURNS json AS $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO tb_usuario (auth_id, nome, email, telefone, tipo_usuario, created_at, updated_at)
  VALUES (p_auth_id, p_nome, p_email, p_telefone, p_tipo_usuario::tipo_usuario_enum, NOW(), NOW())
  RETURNING id INTO v_user_id;
  
  RETURN json_build_object(
    'id', v_user_id,
    'auth_id', p_auth_id,
    'nome', p_nome,
    'email', p_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION register_user(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, anon;

-- ============================================================
-- RPC FUNCTION: create_promocao_admin (SECURITY DEFINER)
-- ============================================================
-- Esta função permite que admins criem promoções, contornando RLS

CREATE OR REPLACE FUNCTION create_promocao_admin(
  p_ativa BOOLEAN DEFAULT TRUE,
  p_data_fim DATE,
  p_data_inicio DATE,
  p_desconto_percentual NUMERIC DEFAULT NULL,
  p_descricao TEXT DEFAULT NULL,
  p_imagem_url TEXT DEFAULT NULL,
  p_titulo TEXT
)
RETURNS json AS $$
DECLARE
  v_promo_id UUID;
BEGIN
  -- Verify that caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM tb_usuario
    WHERE auth_id = auth.uid()
      AND tipo_usuario = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar promoções';
  END IF;

  INSERT INTO tb_promocao (
    titulo, descricao, desconto_percentual, data_inicio, data_fim, ativa, imagem_url,
    created_at, updated_at
  )
  VALUES (
    p_titulo, p_descricao, p_desconto_percentual, p_data_inicio, p_data_fim, p_ativa, p_imagem_url,
    NOW(), NOW()
  )
  RETURNING id INTO v_promo_id;
  
  RETURN json_build_object(
    'id', v_promo_id,
    'titulo', p_titulo,
    'descricao', p_descricao,
    'desconto_percentual', p_desconto_percentual,
    'data_inicio', p_data_inicio,
    'data_fim', p_data_fim,
    'ativa', p_ativa,
    'imagem_url', p_imagem_url,
    'created_at', NOW(),
    'updated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_promocao_admin(TEXT, TEXT, NUMERIC, DATE, DATE, BOOLEAN, TEXT) TO authenticated;

-- ============================================================
-- ETAPA 8: TRIGGERS
-- ============================================================

CREATE TRIGGER set_updated_at_usuario
  BEFORE UPDATE ON tb_usuario
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_barbeiro
  BEFORE UPDATE ON tb_barbeiro
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_servico
  BEFORE UPDATE ON tb_servico
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_agendamento
  BEFORE UPDATE ON tb_agendamento
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_promocao
  BEFORE UPDATE ON tb_promocao
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER recalcular_media_avaliacao
  AFTER INSERT OR UPDATE OR DELETE ON tb_avaliacao
  FOR EACH ROW EXECUTE FUNCTION atualizar_media_avaliacao();

-- ============================================================
-- ETAPA 9: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE tb_usuario                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_barbeiro                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_servico                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_agendamento                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_servico_has_tb_agendamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_barbeiro_indisponibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_avaliacao                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_notificacao                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_promocao                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_galeria                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_favorito                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_lista_espera               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_mensagem                   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: tb_usuario
-- ============================================================

CREATE POLICY "usuario: leitura propria ou admin"
  ON tb_usuario FOR SELECT
  USING (auth_id = auth.uid() OR is_admin());

CREATE POLICY "usuario: inserir proprio"
  ON tb_usuario FOR INSERT
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "usuario: atualizar proprio ou admin"
  ON tb_usuario FOR UPDATE
  USING (auth_id = auth.uid() OR is_admin())
  WITH CHECK (auth_id = auth.uid() OR is_admin());

CREATE POLICY "usuario: deletar apenas admin"
  ON tb_usuario FOR DELETE
  USING (is_admin());

-- ============================================================
-- POLICIES: tb_barbeiro
-- ============================================================

CREATE POLICY "barbeiro: leitura publica"
  ON tb_barbeiro FOR SELECT
  USING (TRUE);

CREATE POLICY "barbeiro: inserir apenas admin"
  ON tb_barbeiro FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "barbeiro: atualizar apenas admin"
  ON tb_barbeiro FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "barbeiro: deletar apenas admin"
  ON tb_barbeiro FOR DELETE
  USING (is_admin());

-- ============================================================
-- POLICIES: tb_servico
-- ============================================================

CREATE POLICY "servico: leitura publica"
  ON tb_servico FOR SELECT
  USING (TRUE);

CREATE POLICY "servico: inserir apenas admin"
  ON tb_servico FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "servico: atualizar apenas admin"
  ON tb_servico FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "servico: deletar apenas admin"
  ON tb_servico FOR DELETE
  USING (is_admin());

-- ============================================================
-- POLICIES: tb_agendamento
-- ============================================================

CREATE POLICY "agendamento: leitura propria ou admin"
  ON tb_agendamento FOR SELECT
  USING (
    id_usuario = usuario_id()
    OR is_admin()
  );

CREATE POLICY "agendamento: inserir proprio"
  ON tb_agendamento FOR INSERT
  WITH CHECK (
    id_usuario = usuario_id()
  );

CREATE POLICY "agendamento: atualizar proprio ou admin"
  ON tb_agendamento FOR UPDATE
  USING (
    id_usuario = usuario_id()
    OR is_admin()
  )
  WITH CHECK (
    id_usuario = usuario_id()
    OR is_admin()
  );

CREATE POLICY "agendamento: deletar apenas admin"
  ON tb_agendamento FOR DELETE
  USING (is_admin());

-- ============================================================
-- POLICIES: tb_servico_has_tb_agendamento
-- ============================================================

CREATE POLICY "sha: leitura propria ou admin"
  ON tb_servico_has_tb_agendamento FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tb_agendamento a
      WHERE a.id = id_agendamento
        AND (a.id_usuario = usuario_id() OR is_admin())
    )
  );

CREATE POLICY "sha: inserir proprio ou admin"
  ON tb_servico_has_tb_agendamento FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tb_agendamento a
      WHERE a.id = id_agendamento
        AND (a.id_usuario = usuario_id() OR is_admin())
    )
  );

CREATE POLICY "sha: deletar proprio ou admin"
  ON tb_servico_has_tb_agendamento FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tb_agendamento a
      WHERE a.id = id_agendamento
        AND (a.id_usuario = usuario_id() OR is_admin())
    )
  );

-- ============================================================
-- POLICIES: tb_barbeiro_indisponibilidade
-- ============================================================

CREATE POLICY "indisponibilidade: leitura publica"
  ON tb_barbeiro_indisponibilidade FOR SELECT
  USING (TRUE);

CREATE POLICY "indisponibilidade: inserir apenas admin"
  ON tb_barbeiro_indisponibilidade FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "indisponibilidade: atualizar apenas admin"
  ON tb_barbeiro_indisponibilidade FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "indisponibilidade: deletar apenas admin"
  ON tb_barbeiro_indisponibilidade FOR DELETE
  USING (is_admin());

-- ============================================================
-- POLICIES: tb_avaliacao
-- ============================================================

CREATE POLICY "avaliacao: leitura publica"
  ON tb_avaliacao FOR SELECT
  USING (TRUE);

CREATE POLICY "avaliacao: inserir proprio"
  ON tb_avaliacao FOR INSERT
  WITH CHECK (
    id_usuario = usuario_id()
    AND EXISTS (
      SELECT 1 FROM tb_agendamento
      WHERE id = id_agendamento
        AND status = 'concluido'
        AND data_hora < NOW()
    )
  );

CREATE POLICY "avaliacao: atualizar proprio ou admin"
  ON tb_avaliacao FOR UPDATE
  USING (
    id_usuario = usuario_id()
    OR is_admin()
  )
  WITH CHECK (
    id_usuario = usuario_id()
    OR is_admin()
  );

CREATE POLICY "avaliacao: deletar apenas admin"
  ON tb_avaliacao FOR DELETE
  USING (is_admin());

-- ============================================================
-- POLICIES: tb_notificacao
-- ============================================================

CREATE POLICY "notificacao: leitura propria ou admin"
  ON tb_notificacao FOR SELECT
  USING (
    id_usuario = usuario_id()
    OR is_admin()
  );

CREATE POLICY "notificacao: inserir proprio ou admin"
  ON tb_notificacao FOR INSERT
  WITH CHECK (
    id_usuario = usuario_id()
    OR is_admin()
  );

CREATE POLICY "notificacao: atualizar propria ou admin"
  ON tb_notificacao FOR UPDATE
  USING (
    id_usuario = usuario_id()
    OR is_admin()
  )
  WITH CHECK (
    id_usuario = usuario_id()
    OR is_admin()
  );

CREATE POLICY "notificacao: deletar apenas admin"
  ON tb_notificacao FOR DELETE
  USING (is_admin());

-- ============================================================
-- POLICIES: tb_promocao
-- ============================================================

CREATE POLICY "promocao: leitura publica"
  ON tb_promocao FOR SELECT
  USING (TRUE);

CREATE POLICY "promocao: inserir apenas admin"
  ON tb_promocao FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "promocao: atualizar apenas admin"
  ON tb_promocao FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "promocao: deletar apenas admin"
  ON tb_promocao FOR DELETE
  USING (is_admin());

-- ============================================================
-- POLICIES: tb_galeria
-- ============================================================

CREATE POLICY "galeria: leitura publica"
  ON tb_galeria FOR SELECT
  USING (TRUE);

CREATE POLICY "galeria: inserir apenas admin"
  ON tb_galeria FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "galeria: atualizar apenas admin"
  ON tb_galeria FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "galeria: deletar apenas admin"
  ON tb_galeria FOR DELETE
  USING (is_admin());

-- ============================================================
-- POLICIES: tb_favorito
-- ============================================================

CREATE POLICY "favorito: leitura propria ou admin"
  ON tb_favorito FOR SELECT
  USING (
    id_usuario = usuario_id()
    OR is_admin()
  );

CREATE POLICY "favorito: inserir proprio"
  ON tb_favorito FOR INSERT
  WITH CHECK (
    id_usuario = usuario_id()
  );

CREATE POLICY "favorito: deletar proprio ou admin"
  ON tb_favorito FOR DELETE
  USING (
    id_usuario = usuario_id()
    OR is_admin()
  );

-- ============================================================
-- POLICIES: tb_lista_espera
-- ============================================================

CREATE POLICY "lista_espera: leitura propria ou admin"
  ON tb_lista_espera FOR SELECT
  USING (
    id_usuario = usuario_id()
    OR is_admin()
  );

CREATE POLICY "lista_espera: inserir proprio"
  ON tb_lista_espera FOR INSERT
  WITH CHECK (
    id_usuario = usuario_id()
  );

CREATE POLICY "lista_espera: atualizar apenas admin"
  ON tb_lista_espera FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "lista_espera: deletar proprio ou admin"
  ON tb_lista_espera FOR DELETE
  USING (
    id_usuario = usuario_id()
    OR is_admin()
  );

-- ============================================================
-- POLICIES: tb_mensagem
-- ============================================================

CREATE POLICY "mensagem: leitura propria ou admin"
  ON tb_mensagem FOR SELECT
  USING (
    id_usuario = usuario_id()
    OR is_admin()
  );

CREATE POLICY "mensagem: inserir proprio ou admin"
  ON tb_mensagem FOR INSERT
  WITH CHECK (
    id_usuario = usuario_id()
    OR is_admin()
  );

CREATE POLICY "mensagem: atualizar apenas admin"
  ON tb_mensagem FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "mensagem: deletar apenas admin"
  ON tb_mensagem FOR DELETE
  USING (is_admin());

-- ============================================================
-- ETAPA 10: STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',    'avatars',    TRUE,  5242880,   ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('barbers',    'barbers',    TRUE,  5242880,   ARRAY['image/jpeg','image/png','image/webp']),
  ('gallery',    'gallery',    TRUE,  10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('promocoes',  'promocoes',  TRUE,  5242880,   ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
SET
  name               = EXCLUDED.name,
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- ETAPA 11: STORAGE POLICIES
-- ============================================================

-- Note: Storage policies are managed via Supabase Dashboard
-- Do not use ALTER TABLE on storage.objects as it causes permission errors

-- Storage Policies devem ser configuradas via Supabase Dashboard
-- As políticas abaixo são apenas documentação e devem ser criadas manualmente

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
