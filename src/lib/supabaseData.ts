import supabase, { PROFILE_BUCKET, normalizeStoragePath } from './supabase';

const BARBEIRO_TABLE = 'tb_barbeiro';
const SERVICO_TABLE = 'tb_servico';
const GALERIA_TABLE = 'tb_galeria';
const PROMOCAO_TABLE = 'tb_promocao';
const AGENDAMENTO_TABLE = 'tb_agendamento';
const AGENDAMENTO_SERVICO_TABLE = 'tb_servico_has_tb_agendamento';
const INDISPONIBILIDADE_TABLE = 'tb_barbeiro_indisponibilidade';
const NOTIFICACAO_TABLE = 'tb_notificacao';
const MENSAGEM_TABLE = 'tb_mensagem';
const AVALIACAO_TABLE = 'tb_avaliacao';

function normalizeBarbeiro(row: any) {
  return {
    ...row,
    id: row.id,
    nome: row.nome,
    especialidade: row.especialidade ?? '',
    foto_url: row.foto_url ?? '',
    bio: row.bio ?? '',
    ativo: row.ativo ?? true,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
    avaliacao_media: Number(row.media_avaliacao ?? row.avaliacao_media ?? 0),
    total_avaliacoes: Number(row.total_avaliacoes ?? 0),
  };
}

function normalizeServico(row: any) {
  return {
    ...row,
    id: row.id,
    nome: row.nome,
    descricao: row.descricao ?? '',
    preco: Number(row.preco ?? 0),
    // suporta ambos os nomes de coluna: `duracao_min` (db) e `duracao_minutos` (legacy na UI)
    duracao_min: Number(row.duracao_min ?? row.duracao_minutos ?? 0),
    duracao_minutos: Number(row.duracao_min ?? row.duracao_minutos ?? 0),
    tipo: row.tipo ?? 'Corte',
    ativo: row.ativo ?? true,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

function normalizeGaleria(row: any) {
  return {
    ...row,
    id: row.id,
    id_barbeiro: row.id_barbeiro ?? undefined,
    descricao: row.descricao ?? '',
    imagem_url: row.imagem_url ?? '',
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

function normalizePromocao(row: any) {
  return {
    ...row,
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao ?? '',
    desconto_percentual: Number(row.desconto_percentual ?? 0),
    data_inicio: row.data_inicio,
    data_fim: row.data_fim,
    ativa: row.ativa ?? true,
    imagem_url: row.imagem_url ?? '',
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

function normalizeIndisponibilidade(row: any) {
  return {
    id: row.id,
    id_barbeiro: row.id_barbeiro,
    data: row.data,
    hora_inicio: row.hora_inicio,
    hora_fim: row.hora_fim,
    motivo: row.motivo ?? undefined,
    created_at: row.created_at,
  };
}

function normalizeNotificacao(row: any) {
  return {
    id: row.id,
    id_usuario: row.id_usuario,
    tipo: row.tipo,
    mensagem: row.mensagem,
    lida: !!row.lida,
    created_at: row.created_at,
  };
}

function normalizeMensagem(row: any) {
  return {
    id: row.id,
    id_usuario: row.id_usuario,
    conteudo: row.conteudo,
    de_admin: !!row.de_admin,
    created_at: row.created_at,
  };
}

function normalizeAvaliacao(row: any) {
  return {
    id: row.id,
    id_agendamento: row.id_agendamento,
    id_usuario: row.id_usuario,
    nota: Number(row.nota ?? 0),
    comentario: row.comentario ?? undefined,
    created_at: row.created_at,
    usuario: row.usuario ? {
      id: row.usuario.id,
      nome: row.usuario.nome,
      email: row.usuario.email,
      telefone: row.usuario.telefone ?? undefined,
    } : undefined,
  };
}


function normalizeAgendamento(row: any) {
  const services = Array.isArray(row.servicos)
    ? row.servicos.map((item: any) => normalizeServico(item.servico || item))
    : [];

  return {
    ...row,
    id: row.id,
    id_usuario: row.id_usuario,
    id_barbeiro: row.id_barbeiro,
    data_hora: row.data_hora,
    status: row.status,
    observacao: row.observacao ?? undefined,
    preco_total: Number(row.preco_total ?? 0),
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    barbeiro: row.barbeiro ? normalizeBarbeiro(row.barbeiro) : undefined,
    servicos: services,
  };
}

export async function fetchBarbeiros() {
  const { data, error } = await supabase.from(BARBEIRO_TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeBarbeiro);
}

export async function createBarbeiro(payload: any) {
  const rpcPayload: any = {
    p_nome: payload.nome,
    p_especialidade: payload.especialidade ?? null,
    p_foto_url: payload.foto_url ?? null,
    p_bio: payload.bio ?? null,
    p_ativo: payload.ativo ?? true,
    p_media_avaliacao: Number(payload.media_avaliacao ?? payload.avaliacao_media ?? 0),
  };

  const { data, error } = await supabase.rpc('create_barbeiro_admin', rpcPayload);
  if (error) {
    console.error('createBarbeiro RPC error:', { error, payload: rpcPayload });
    throw error;
  }
  return normalizeBarbeiro(data as any);
}

export async function updateBarbeiro(id: string, updates: any) {
  const rpcPayload: any = {
    p_id: id,
    p_nome: updates.nome,
    p_especialidade: updates.especialidade ?? null,
    p_foto_url: updates.foto_url ?? null,
    p_bio: updates.bio ?? null,
    p_ativo: updates.ativo ?? null,
    p_media_avaliacao: updates.media_avaliacao ?? updates.avaliacao_media ?? null,
  };

  const { data, error } = await supabase.rpc('update_barbeiro_admin', rpcPayload);
  if (error) {
    console.error('updateBarbeiro RPC error:', { error, payload: rpcPayload });
    throw error;
  }
  return normalizeBarbeiro(data as any);
}

export async function deleteBarbeiro(id: string) {
  const { error } = await supabase.from(BARBEIRO_TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function fetchServicos() {
  const { data, error } = await supabase.from(SERVICO_TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeServico);
}

export async function createServico(payload: any) {
  const { tipo, ...dbPayload } = payload;
  const insertPayload: any = { ...dbPayload };
  // remove propriedade antiga que não existe no schema
  if ('duracao_minutos' in insertPayload) delete insertPayload.duracao_minutos;
  insertPayload.duracao_min = Number(dbPayload.duracao_min ?? dbPayload.duracao_minutos ?? 0);
  insertPayload.preco = Number(dbPayload.preco ?? 0);

  const { data, error } = await supabase
    .from(SERVICO_TABLE)
    .insert([insertPayload])
    .select()
    .single();
  if (error) throw error;
  return normalizeServico(data);
}

export async function updateServico(id: string, updates: any) {
  const { tipo, ...dbUpdates } = updates;
  const updatePayload: any = { ...dbUpdates };
  if ('duracao_minutos' in updatePayload) delete updatePayload.duracao_minutos;
  updatePayload.duracao_min = dbUpdates.duracao_min ?? dbUpdates.duracao_minutos;
  updatePayload.preco = Number(dbUpdates.preco ?? 0);

  const { data, error } = await supabase
    .from(SERVICO_TABLE)
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return normalizeServico(data);
}

export async function deleteServico(id: string) {
  const { error } = await supabase.from(SERVICO_TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function fetchPromocoes() {
  const { data, error } = await supabase.from(PROMOCAO_TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizePromocao);
}

export async function fetchGaleria() {
  const { data, error } = await supabase.from(GALERIA_TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeGaleria);
}

export async function createGaleria(payload: any) {
  const { data, error } = await supabase
    .from(GALERIA_TABLE)
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return normalizeGaleria(data);
}

export async function deleteGaleria(id: string) {
  const { error } = await supabase.from(GALERIA_TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function fetchAgendamentos(userId?: string, isAdmin?: boolean) {
  let query = supabase
    .from(AGENDAMENTO_TABLE)
    .select(
      `*, tb_barbeiro(*), servicos:tb_servico_has_tb_agendamento(preco_servico, servico:tb_servico(*))`
    )
    .order('created_at', { ascending: false });

  if (userId && !isAdmin) {
    query = query.eq('id_usuario', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(normalizeAgendamento);
}

export async function createAgendamento(payload: any) {
  const dbPayload: any = {
    id_usuario: payload.id_usuario,
    id_barbeiro: payload.id_barbeiro,
    data_hora: payload.data_hora,
    status: payload.status ?? 'pendente',
    observacao: payload.observacao ?? null,
    preco_total: Number(payload.preco_total ?? 0),
  };

  if (!dbPayload.id_usuario || !dbPayload.id_barbeiro || !dbPayload.data_hora) {
    throw new Error('Payload de agendamento incompleto. Verifique barbeiro, data e horário.');
  }

  // Validar conflito de horário
  const dataHoraAgendamento = new Date(dbPayload.data_hora);
  const duracaoMinutos = payload.servicos?.reduce((acc: number, s: any) => acc + (s.duracao_minutos ?? 30), 0) ?? 30;
  const dataHoraFim = new Date(dataHoraAgendamento.getTime() + duracaoMinutos * 60000);

  const { data: agendamentosExistentes, error: errorCheck } = await supabase
    .from(AGENDAMENTO_TABLE)
    .select('id, data_hora')
    .eq('id_barbeiro', dbPayload.id_barbeiro)
    .in('status', ['confirmado', 'pendente']);

  if (errorCheck) throw errorCheck;

  // Buscar todas as linhas de serviços para os agendamentos existentes de uma só vez
  const agIds = (agendamentosExistentes || []).map((a: any) => a.id);
  let duracoesPorAg: Record<string, number> = {};

  if (agIds.length > 0) {
    const { data: linhasServ, error: linhasErr } = await supabase
      .from(AGENDAMENTO_SERVICO_TABLE)
      .select('id_agendamento, servico:tb_servico(duracao_min)')
      .in('id_agendamento', agIds);

    if (linhasErr) {
      // se erro, não bloquear para não quebrar fluxo; logar e prosseguir com duracao padrao
      console.error('Erro ao buscar servicos de agendamentos:', linhasErr);
    } else {
      console.log('Linhas de servicos retornadas para agendamentos existentes:', linhasServ);
      // agrupar durações por agendamento
      for (const row of (linhasServ || [])) {
        const aid = row.id_agendamento;
        const d = Number((row as any)?.servico?.duracao_min ?? 30) || 30;
        duracoesPorAg[aid] = (duracoesPorAg[aid] || 0) + d;
      }
      console.log('Duracoes por agendamento calculadas:', duracoesPorAg);
    }
  }

  const temConflito = (agendamentosExistentes || []).some((ag: any) => {
    const dataHoraExistente = new Date(ag.data_hora);
    const duracaoExistente = duracoesPorAg[ag.id] ?? 30;
    const dataHoraFimExistente = new Date(dataHoraExistente.getTime() + duracaoExistente * 60000);
    return dataHoraAgendamento.getTime() < dataHoraFimExistente.getTime() && dataHoraFim.getTime() > dataHoraExistente.getTime();
  });

  if (temConflito) {
    throw new Error('Este horário não está disponível. Outro agendamento conflita com o seu horário selecionado.');
  }

  if (payload.created_at) {
    dbPayload.created_at = payload.created_at;
  }
  if (payload.updated_at) {
    dbPayload.updated_at = payload.updated_at;
  }

  const { data, error } = await supabase
    .from(AGENDAMENTO_TABLE)
    .insert([dbPayload])
    .select()
    .single();

  if (error) throw error;

  const agendamento = normalizeAgendamento({ ...data, servicos: [] });

  if (Array.isArray(payload.servicos) && payload.servicos.length > 0) {
    const joinRows = payload.servicos.map((servico: any) => ({
      id_agendamento: agendamento.id,
      id_servico: servico.id,
      preco_servico: Number(servico.preco ?? servico.preco_total ?? 0),
    }));

    const { error: joinError } = await supabase
      .from(AGENDAMENTO_SERVICO_TABLE)
      .insert(joinRows);

    if (joinError) throw joinError;
    agendamento.servicos = payload.servicos;
  }

  if (payload.barbeiro) {
    agendamento.barbeiro = payload.barbeiro;
  }

  return agendamento;
}

export async function updateAgendamento(id: string, updates: any) {
  const dbUpdates = {
    id_barbeiro: updates.id_barbeiro,
    data_hora: updates.data_hora,
    status: updates.status,
    observacao: updates.observacao ?? null,
    preco_total: updates.preco_total,
    updated_at: updates.updated_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(AGENDAMENTO_TABLE)
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return normalizeAgendamento({ ...data, servicos: updates.servicos ?? [] });
}

export async function fetchIndisponibilidades(barbeiroId?: string) {
  let query = supabase.from(INDISPONIBILIDADE_TABLE).select('*').order('data', { ascending: true });
  if (barbeiroId) {
    query = query.eq('id_barbeiro', barbeiroId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(normalizeIndisponibilidade);
}

export async function createIndisponibilidade(payload: any) {
  const dbPayload = {
    id: payload.id,
    id_barbeiro: payload.id_barbeiro,
    data: payload.data,
    hora_inicio: payload.hora_inicio,
    hora_fim: payload.hora_fim,
    motivo: payload.motivo ?? null,
    created_at: payload.created_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(INDISPONIBILIDADE_TABLE)
    .insert([dbPayload])
    .select()
    .single();
  if (error) throw error;
  return normalizeIndisponibilidade(data);
}

export async function deleteIndisponibilidade(id: string) {
  const { error } = await supabase.from(INDISPONIBILIDADE_TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from(NOTIFICACAO_TABLE)
    .select('*')
    .eq('id_usuario', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeNotificacao);
}

export async function createNotification(payload: any) {
  const dbPayload = {
    id: payload.id,
    id_usuario: payload.id_usuario,
    tipo: payload.tipo,
    mensagem: payload.mensagem,
    lida: payload.lida ?? false,
    created_at: payload.created_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(NOTIFICACAO_TABLE)
    .insert([dbPayload])
    .select()
    .single();
  if (error) throw error;
  return normalizeNotificacao(data);
}

export async function markNotificationRead(id: string) {
  const { data, error } = await supabase
    .from(NOTIFICACAO_TABLE)
    .update({ lida: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return normalizeNotificacao(data);
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from(NOTIFICACAO_TABLE)
    .update({ lida: true })
    .eq('id_usuario', userId);
  if (error) throw error;
  return true;
}

export async function fetchMessages(userId: string) {
  const { data, error } = await supabase
    .from(MENSAGEM_TABLE)
    .select('*')
    .eq('id_usuario', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizeMensagem);
}

export async function createMessage(payload: any) {
  const dbPayload = {
    id: payload.id,
    id_usuario: payload.id_usuario,
    conteudo: payload.conteudo,
    de_admin: payload.de_admin ?? false,
    created_at: payload.created_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(MENSAGEM_TABLE)
    .insert([dbPayload])
    .select()
    .single();
  if (error) throw error;
  return normalizeMensagem(data);
}

export async function createPromocao(payload: any) {
  const params = {
    p_ativa: payload.ativa ?? true,
    p_data_fim: payload.data_fim,
    p_data_inicio: payload.data_inicio,
    p_desconto_percentual: payload.desconto_percentual ?? null,
    p_descricao: payload.descricao ?? null,
    p_imagem_url: payload.imagem_url ?? null,
    p_titulo: payload.titulo,
  };

  const { data, error } = await supabase.rpc('create_promocao_admin', params);
  if (!error) {
    return normalizePromocao(data);
  }

  console.error('createPromocao RPC error', error);

  const notFoundFunction =
    typeof error.message === 'string' &&
    error.message.toLowerCase().includes('function create_promocao_admin');
  const schemaCacheMissing = error.code === 'PGRST102' || error.code === 'PGRST202';
  if (notFoundFunction || schemaCacheMissing) {
    const dbPayload = {
      titulo: payload.titulo,
      descricao: payload.descricao ?? null,
      desconto_percentual: payload.desconto_percentual ?? null,
      data_inicio: payload.data_inicio,
      data_fim: payload.data_fim,
      ativa: payload.ativa ?? true,
      imagem_url: payload.imagem_url ?? null,
      created_at: payload.created_at ?? new Date().toISOString(),
      updated_at: payload.updated_at ?? payload.created_at ?? new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase
      .from(PROMOCAO_TABLE)
      .insert([dbPayload])
      .select()
      .single();

    if (insertError) {
      console.error('createPromocao direct insert error', insertError);
      throw insertError;
    }

    return normalizePromocao(inserted);
  }

  throw error;
}

export async function updatePromocao(id: string, updates: any) {
  const dbUpdates = {
    titulo: updates.titulo,
    descricao: updates.descricao ?? null,
    desconto_percentual: updates.desconto_percentual ?? null,
    data_inicio: updates.data_inicio,
    data_fim: updates.data_fim,
    ativa: updates.ativa,
    imagem_url: updates.imagem_url ?? null,
    updated_at: updates.updated_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(PROMOCAO_TABLE)
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return normalizePromocao(data);
}

export async function deletePromocao(id: string) {
  const { error } = await supabase.from(PROMOCAO_TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function fetchAvaliacoes(limit = 6) {
  const { data, error } = await supabase
    .from(AVALIACAO_TABLE)
    .select('*, tb_usuario(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(normalizeAvaliacao);
}

export async function uploadToBucket(bucket: string, path: string, file: File) {
  const normalizedPath = normalizeStoragePath(path);

  try {
    console.log('uploadToBucket:', { bucket, originalPath: path, normalizedPath });
    
    const { error } = await supabase.storage.from(bucket).upload(normalizedPath, file, { 
      cacheControl: '3600', 
      upsert: true, 
      contentType: file.type || 'application/octet-stream' 
    });
    
    if (error) {
      console.error('uploadToBucket storage error:', error);
      throw error;
    }
    
    const url = await getPublicUrl(bucket, normalizedPath);
    if (!url) throw new Error('Não foi possível obter URL pública do upload.');
    
    console.log('uploadToBucket success:', url);
    return url;
  } catch (err: any) {
    console.error('uploadToBucket error', { bucket, path: normalizedPath, error: err });
    throw err;
  }
}

export async function getPublicUrl(bucket: string, path: string) {
  const normalizedPath = normalizeStoragePath(path);
  const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedPath);
  return data?.publicUrl ?? null;
}

export { PROFILE_BUCKET };