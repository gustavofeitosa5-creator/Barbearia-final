import type { Barbeiro, Servico, Agendamento, Avaliacao, Promocao, Galeria, Notificacao, BarbeiroIndisponibilidade, Mensagem } from '../types/database.types';
import { generateId } from './utils';

const STORAGE_KEYS = {
  barbeiros: 'barberpro_barbeiros',
  servicos: 'barberpro_servicos',
  promocoes: 'barberpro_promocoes',
  agendamentos: 'barberpro_agendamentos',
  notificacoes: 'barberpro_notificacoes',
  indisponibilidades: 'barberpro_indisponibilidades',
  galeria: 'barberpro_galeria',
  mensagens: (userId: string) => `barberpro_mensagens_${userId}`,
};

const initialBarbeiros: Barbeiro[] = [];

const initialServicos: Servico[] = [];

const initialPromocoes: Promocao[] = [];

const initialAgendamentos: Agendamento[] = [];

const initialNotificacoes: Notificacao[] = [];

const initialIndisponibilidades: BarbeiroIndisponibilidade[] = [];

const initialAvaliacoes: Avaliacao[] = [];

const initialGaleria: Galeria[] = [];

export const DATA_UPDATE_EVENT = 'barberpro-data-updated';

function dispatchDataUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DATA_UPDATE_EVENT));
  }
}

function loadStored<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as T;
    } catch {
      localStorage.removeItem(key);
    }
  }
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

export function getBarbeiros(): Barbeiro[] {
  return loadStored(STORAGE_KEYS.barbeiros, initialBarbeiros);
}

export function saveBarbeiros(barbeiros: Barbeiro[]) {
  localStorage.setItem(STORAGE_KEYS.barbeiros, JSON.stringify(barbeiros));
  mockBarbeiros = barbeiros;
  dispatchDataUpdate();
}

export function getServicos(): Servico[] {
  return loadStored(STORAGE_KEYS.servicos, initialServicos);
}

export function saveServicos(servicos: Servico[]) {
  localStorage.setItem(STORAGE_KEYS.servicos, JSON.stringify(servicos));
  mockServicos = servicos;
  dispatchDataUpdate();
}

export function getPromocoes(): Promocao[] {
  return loadStored(STORAGE_KEYS.promocoes, initialPromocoes);
}

export function savePromocoes(promocoes: Promocao[]) {
  localStorage.setItem(STORAGE_KEYS.promocoes, JSON.stringify(promocoes));
  mockPromoçoes = promocoes;
  dispatchDataUpdate();
}

export function getGaleria(): Galeria[] {
  return loadStored(STORAGE_KEYS.galeria, initialGaleria);
}

export function saveGaleria(galeria: Galeria[]) {
  localStorage.setItem(STORAGE_KEYS.galeria, JSON.stringify(galeria));
  mockGaleria = galeria;
  dispatchDataUpdate();
}

export function getAgendamentos(): Agendamento[] {
  return loadStored(STORAGE_KEYS.agendamentos, initialAgendamentos);
}

export function saveAgendamentos(agendamentos: Agendamento[]) {
  localStorage.setItem(STORAGE_KEYS.agendamentos, JSON.stringify(agendamentos));
  mockAgendamentos = agendamentos;
  dispatchDataUpdate();
}

export function getNotifications(): Notificacao[] {
  return loadStored(STORAGE_KEYS.notificacoes, initialNotificacoes);
}

export function saveNotifications(notificacoes: Notificacao[]) {
  localStorage.setItem(STORAGE_KEYS.notificacoes, JSON.stringify(notificacoes));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('barberpro-notifications-updated'));
  }
}

export function addNotification(notification: Omit<Notificacao, 'id' | 'created_at'>) {
  const list = getNotifications();
  const next = [
    {
      id: generateId(),
      created_at: new Date().toISOString(),
      ...notification,
    },
    ...list,
  ];
  saveNotifications(next);
  return next;
}

export function getIndisponibilidades(): BarbeiroIndisponibilidade[] {
  return loadStored(STORAGE_KEYS.indisponibilidades, initialIndisponibilidades);
}

export function saveIndisponibilidades(indisponibilidades: BarbeiroIndisponibilidade[]) {
  localStorage.setItem(STORAGE_KEYS.indisponibilidades, JSON.stringify(indisponibilidades));
}

export function getMessages(userId: string): Mensagem[] {
  return loadStored(STORAGE_KEYS.mensagens(userId), [] as Mensagem[]);
}

export function saveMessages(userId: string, messages: Mensagem[]) {
  localStorage.setItem(STORAGE_KEYS.mensagens(userId), JSON.stringify(messages));
}

export const HORARIOS_TRABALHO = {
  inicio: 9,
  fim: 19,
  intervalo: 30, // minutes
};

export function getHorariosDisponiveis(
  data: string,
  duracaoMinutos: number,
  indisponibilidades: BarbeiroIndisponibilidade[] = [],
): string[] {
  const horarios: string[] = [];
  const agora = new Date();
  const dataSelecionada = new Date(data + 'T00:00:00');

  for (let hora = HORARIOS_TRABALHO.inicio; hora < HORARIOS_TRABALHO.fim; hora++) {
    for (let min = 0; min < 60; min += HORARIOS_TRABALHO.intervalo) {
      const horarioFim = hora * 60 + min + duracaoMinutos;
      if (horarioFim > HORARIOS_TRABALHO.fim * 60) break;

      const dataHora = new Date(dataSelecionada);
      dataHora.setHours(hora, min, 0, 0);

      if (dataHora <= agora) continue;

      const bloqueado = indisponibilidades.some(indis => {
        const dataIndisponivel = new Date(indis.data + 'T00:00:00');
        if (dataIndisponivel.toDateString() !== dataSelecionada.toDateString()) return false;
        const [startHour, startMin] = indis.hora_inicio.split(':').map(Number);
        const [endHour, endMin] = indis.hora_fim.split(':').map(Number);
        const inicio = new Date(dataSelecionada);
        inicio.setHours(startHour, startMin, 0, 0);
        const fim = new Date(dataSelecionada);
        fim.setHours(endHour, endMin, 0, 0);
        return dataHora >= inicio && dataHora < fim;
      });

      if (!bloqueado) {
        horarios.push(`${String(hora).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
      }
    }
  }
  return horarios;
}

export let mockBarbeiros: Barbeiro[] = getBarbeiros();
export let mockServicos: Servico[] = getServicos();
export let mockPromoçoes: Promocao[] = getPromocoes();
export let mockAgendamentos: Agendamento[] = getAgendamentos();
export let mockNotificacoes: Notificacao[] = getNotifications();
export const mockAvaliacoes: Avaliacao[] = [
  ...initialAvaliacoes,
];

export let mockGaleria: Galeria[] = getGaleria();

// When other tabs/windows change localStorage, forward those updates via our custom event
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    try {
      const interestingKeys = new Set(Object.values(STORAGE_KEYS).filter(k => typeof k === 'string') as string[]);
      if (!e.key) return;
      if (interestingKeys.has(e.key)) {
        // Update exported in-memory copies
        mockBarbeiros = getBarbeiros();
        mockServicos = getServicos();
        mockPromoçoes = getPromocoes();
        mockAgendamentos = getAgendamentos();
        mockNotificacoes = getNotifications();
        mockGaleria = getGaleria();
        // Dispatch a DOM event so app components can react
        dispatchDataUpdate();
      }
    } catch (err) {
      // ignore
    }
  });
}
