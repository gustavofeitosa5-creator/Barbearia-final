import { format, formatDistanceToNow, isToday, isTomorrow, isPast, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (!isValid(date)) return dateString;
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  if (!isValid(date)) return dateString;
  return format(date, "d/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  if (!isValid(date)) return '';
  return format(date, 'HH:mm');
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  if (!isValid(date)) return '';
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

export function isDatePast(dateString: string): boolean {
  return isPast(new Date(dateString));
}

export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatPhoneMask(value: string): string {
  const digits = normalizeDigits(value).slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isPhoneValid(value: string): boolean {
  const digits = normalizeDigits(value);
  return digits.length === 10 || digits.length === 11;
}

export function formatMoneyInput(value: string, maxDigits = 5): string {
  const digits = normalizeDigits(value).slice(0, maxDigits);
  if (!digits) return '';
  const amount = parseInt(digits, 10) / 100;
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatMoneyString(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseMoneyInput(value: string): number {
  const digits = normalizeDigits(value);
  return digits ? parseInt(digits, 10) / 100 : 0;
}

export function formatPercentInput(value: string): string {
  const digits = normalizeDigits(value).slice(0, 2);
  if (!digits) return '';
  const percentage = Math.min(parseInt(digits, 10), 99);
  return `${percentage}%`;
}

export function parsePercentInput(value: string): number {
  const digits = normalizeDigits(value).slice(0, 2);
  return digits ? Math.min(parseInt(digits, 10), 99) : 0;
}

export function formatDateMask(value: string): string {
  const digits = normalizeDigits(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export function isDateMaskValid(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(`${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T00:00:00`);
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
}

export function parseDateMask(value: string): Date | null {
  if (!isDateMaskValid(value)) return null;
  const [day, month, year] = value.split('/').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateToMask(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

export function formatDateToSql(value: string): string | null {
  const date = parseDateMask(value);
  if (!date) return null;
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateOnOrAfterToday(value: string): boolean {
  const date = parseDateMask(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

export function getHorariosDisponiveis(
  data: string,
  duracaoMinutos: number,
  indisponibilidades: { id_barbeiro: string; data: string; hora_inicio: string; hora_fim: string }[] = [],
): string[] {
  const horarios: string[] = [];
  const agora = new Date();
  const [year, month, day] = data.split('-').map(Number);
  if (!year || !month || !day) return [];

  const dataSelecionada = new Date(year, month - 1, day);
  if (!isValid(dataSelecionada)) return [];

  const isSameDay = dataSelecionada.toDateString() === agora.toDateString();

  for (let hora = WORK_HOURS.inicio; hora < WORK_HOURS.fim; hora++) {
    for (let min = 0; min < 60; min += WORK_HOURS.intervalo) {
      const horarioFim = hora * 60 + min + duracaoMinutos;
      if (horarioFim > WORK_HOURS.fim * 60) break;

      const dataHora = new Date(dataSelecionada);
      dataHora.setHours(hora, min, 0, 0);

      if (isSameDay && dataHora <= agora) continue;

      const bloqueado = indisponibilidades.some(indis => {
        const [indDay, indMonth, indYear] = indis.data.split('/').map(Number);
        if (!indDay || !indMonth || !indYear) return false;

        const dataIndisponivel = new Date(indYear, indMonth - 1, indDay);
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

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    cancelado: 'Cancelado',
    concluido: 'Concluído',
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pendente: 'text-amber-400 bg-amber-400/10',
    confirmado: 'text-emerald-400 bg-emerald-400/10',
    cancelado: 'text-red-400 bg-red-400/10',
    concluido: 'text-blue-400 bg-blue-400/10',
  };
  return map[status] || 'text-gray-400 bg-gray-400/10';
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function normalizeFileName(value: string): string {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s]+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^[_\-.]+|[_\-.]+$/g, '');
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substr(2, 9);
}

export function getDayName(dateString: string): string {
  return format(new Date(dateString), 'EEEE', { locale: ptBR });
}

export function formatShortDate(dateString: string): string {
  return format(new Date(dateString), "dd/MM/yy");
}

export const WORK_HOURS = {
  inicio: 9,
  fim: 19,
  intervalo: 30,
};
