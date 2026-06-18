export type TipoUsuario = 'cliente' | 'admin';
export type StatusAgendamento = 'pendente' | 'confirmado' | 'cancelado' | 'concluido';

export interface Usuario {
  id: string;
  auth_id?: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo_usuario: TipoUsuario;
  foto_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Barbeiro {
  id: string;
  nome: string;
  especialidade?: string;
  foto_url?: string;
  bio?: string;
  ativo: boolean;
  created_at: string;
  duracao_min: number;
  // campo legacy usado pela UI em algumas partes
  duracao_minutos?: number;
  avaliacao_media?: number;
  total_avaliacoes?: number;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracao_minutos: number;
  tipo: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Agendamento {
  id: string;
  id_usuario: string;
  id_barbeiro: string;
  data_hora: string;
  status: StatusAgendamento;
  observacao?: string;
  preco_total?: number;
  created_at: string;
  updated_at: string;
  usuario?: Usuario;
  barbeiro?: Barbeiro;
  servicos?: Servico[];
}

export interface ServicoAgendamento {
  id_servico: string;
  id_agendamento: string;
}

export interface BarbeiroIndisponibilidade {
  id: string;
  id_barbeiro: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  motivo?: string;
  created_at: string;
}

export interface Avaliacao {
  id: string;
  id_agendamento: string;
  id_usuario: string;
  nota: number;
  comentario?: string;
  created_at: string;
  usuario?: Usuario;
  agendamento?: Agendamento;
}

export interface Notificacao {
  id: string;
  id_usuario: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export interface Promocao {
  id: string;
  titulo: string;
  descricao?: string;
  desconto_percentual?: number;
  data_inicio: string;
  data_fim: string;
  ativa: boolean;
  imagem_url?: string;
  created_at: string;
}

export interface Galeria {
  id: string;
  id_barbeiro?: string;
  descricao?: string;
  imagem_url: string;
  created_at: string;
  barbeiro?: Barbeiro;
}

export interface Favorito {
  id: string;
  id_usuario: string;
  id_barbeiro?: string;
  id_servico?: string;
  barbeiro?: Barbeiro;
  servico?: Servico;
}

export interface ListaEspera {
  id: string;
  id_usuario: string;
  id_barbeiro: string;
  id_servico: string;
  data_desejada: string;
  created_at: string;
  notificado: boolean;
  usuario?: Usuario;
  barbeiro?: Barbeiro;
  servico?: Servico;
}

export interface Mensagem {
  id: string;
  id_usuario: string;
  conteudo: string;
  de_admin: boolean;
  created_at: string;
  usuario?: Usuario;
}

// Scheduling flow state
export interface AgendamentoStep {
  barbeiro?: Barbeiro;
  servicos: Servico[];
  data?: string;
  hora?: string;
  observacao?: string;
}
