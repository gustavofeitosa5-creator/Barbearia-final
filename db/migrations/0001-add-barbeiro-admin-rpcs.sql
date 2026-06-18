-- Migration: Add admin RPCs for barber create/update
-- Apply this migration in Supabase to enable admin-safe barber insert/update

DROP FUNCTION IF EXISTS create_barbeiro_admin(TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC) CASCADE;
CREATE OR REPLACE FUNCTION create_barbeiro_admin(
  p_nome TEXT,
  p_especialidade TEXT DEFAULT NULL,
  p_foto_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_ativo BOOLEAN DEFAULT TRUE,
  p_media_avaliacao NUMERIC DEFAULT 0
)
RETURNS json AS $$
DECLARE
  v_barbeiro_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tb_usuario
    WHERE auth_id = auth.uid()
      AND tipo_usuario = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar barbeiros';
  END IF;

  INSERT INTO tb_barbeiro (
    nome, especialidade, foto_url, bio, ativo, media_avaliacao, created_at, updated_at
  )
  VALUES (
    p_nome, p_especialidade, p_foto_url, p_bio, p_ativo, p_media_avaliacao, NOW(), NOW()
  )
  RETURNING id INTO v_barbeiro_id;

  RETURN json_build_object(
    'id', v_barbeiro_id,
    'nome', p_nome,
    'especialidade', p_especialidade,
    'foto_url', p_foto_url,
    'bio', p_bio,
    'ativo', p_ativo,
    'media_avaliacao', p_media_avaliacao,
    'total_avaliacoes', 0,
    'created_at', NOW(),
    'updated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION create_barbeiro_admin(TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC) TO authenticated;

DROP FUNCTION IF EXISTS update_barbeiro_admin(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC) CASCADE;
CREATE OR REPLACE FUNCTION update_barbeiro_admin(
  p_id UUID,
  p_nome TEXT,
  p_especialidade TEXT DEFAULT NULL,
  p_foto_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_ativo BOOLEAN DEFAULT NULL,
  p_media_avaliacao NUMERIC DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_barbeiro tb_barbeiro%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tb_usuario
    WHERE auth_id = auth.uid()
      AND tipo_usuario = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem atualizar barbeiros';
  END IF;

  UPDATE tb_barbeiro
  SET
    nome = p_nome,
    especialidade = p_especialidade,
    foto_url = p_foto_url,
    bio = p_bio,
    ativo = COALESCE(p_ativo, ativo),
    media_avaliacao = COALESCE(p_media_avaliacao, media_avaliacao),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_barbeiro;

  RETURN row_to_json(v_barbeiro);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION update_barbeiro_admin(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC) TO authenticated;
