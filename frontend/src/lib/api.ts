import axios from 'axios';

// Resolve a baseURL de forma segura para evitar chamadas acidentais ao frontend (porta 3000)
function resolveBaseURL(): string {
  const envBase = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  let url = envBase || 'http://localhost:3001';
  // Em ambiente de browser, se NEXT_PUBLIC_API_URL apontar para 3000, corrija para 3001
  if (globalThis.window !== undefined) {
    try {
      const u = new URL(url);
      const isLocalhost = globalThis.window.location.hostname === 'localhost' || globalThis.window.location.hostname === '127.0.0.1';
      if (isLocalhost && u.hostname === 'localhost' && u.port === '3000') {
        u.port = '3001';
        url = u.toString();
        // Aviso no console para facilitar diagnóstico de configuração incorreta
        // eslint-disable-next-line no-console
        console.warn('[api] NEXT_PUBLIC_API_URL aponta para porta 3000; ajustando automaticamente para 3001. Defina corretamente em .env.local');
      }
    } catch {
      // Se a URL do env for inválida, usa fallback padrão
      url = 'http://localhost:3001';
    }
  }
  return url;
}

const baseURL = resolveBaseURL();

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Anexa automaticamente o token JWT como Bearer nas requisições do browser
function getCookie(name: string): string | null {
  if (globalThis.document === undefined) return null;
  const cookie = document.cookie || '';
  const found = cookie
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(name + '='));
  return found ? decodeURIComponent(found.split('=')[1]) : null;
}

api.interceptors.request.use((config) => {
  // Em SSR, não há document; no cliente, lê o cookie a cada request
  const token = getCookie('token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export type Fee = {
  id: number;
  membro_id: number;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  data_pagamento?: string | null;
  observacao?: string | null;
  usuario_id?: number | null;
  usuario_nome?: string | null;
  nome?: string | null;
};

export type Member = {
  id: number;
  nome: string;
  email: string;
  empresa?: string;
};

export type User = {
  id: number;
  email: string;
  role: 'admin' | 'membro';
  nome?: string;
  empresa?: string;
  telefone?: string;
  cargo?: string;
  bio_area_atuacao?: string;
  ativo?: boolean;
};

export type Plan = {
  id: number;
  nome: string;
  valor: number;
  dia_vencimento_padrao?: number;
  ativo?: boolean;
};

export async function listFees(params: { status?: string; month?: number; year?: number; membro_id?: number; usuario_id?: number }) {
  const res = await api.get<Fee[]>('/financeiro/mensalidades', { params });
  return res.data;
}

export async function generateFees(month: number, year: number, usuario_id?: number) {
  const payload: any = { month, year };
  if (typeof usuario_id === 'number') payload.usuario_id = usuario_id;
  const res = await api.post('/financeiro/mensalidades/gerar', payload);
  return res.data as { created: number };
}

export async function markPaid(id: number, data_pagamento?: string) {
  const res = await api.post(`/financeiro/mensalidades/${id}/pagar`, { data_pagamento });
  return res.data as Fee;
}

export async function updateStatus(id: number, status: Fee['status'], observacao?: string) {
  const res = await api.patch(`/financeiro/mensalidades/${id}/status`, { status, observacao });
  return res.data as Fee;
}

export async function cancelFee(id: number, observacao?: string) {
  const res = await api.post(`/financeiro/mensalidades/${id}/cancelar`, { observacao });
  return res.data as Fee;
}

export async function totals(month: number, year: number) {
  const res = await api.get('/financeiro/mensalidades/totais', { params: { month, year } });
  return res.data as { totalRecebido: number; totalPendente: number };
}

export async function notifyLate(id: number) {
  const res = await api.post(`/financeiro/mensalidades/${id}/notificar-atraso`);
  return res.data as Fee;
}

export async function sendReminder(id: number) {
  const res = await api.post(`/financeiro/mensalidades/${id}/enviar-lembrete`);
  return res.data as Fee;
}

export async function listPlans() {
  const res = await api.get<Plan[]>('/financeiro/planos');
  return res.data;
}

export async function assignPlan(usuario_id: number, plano_id: number, data_inicio?: string) {
  const payload: any = { usuario_id, plano_id };
  if (data_inicio) payload.data_inicio = data_inicio;
  const res = await api.post('/financeiro/associacoes', payload);
  return res.data as { id: number };
}

export async function updatePlanActive(id: number, ativo: boolean) {
  const res = await api.patch<Plan>(`/financeiro/planos/${id}/ativo`, { ativo });
  return res.data;
}

export async function createPlan(nome: string, valor: number, dia_vencimento_padrao?: number) {
  const payload: any = { nome, valor };
  if (typeof dia_vencimento_padrao === 'number') payload.dia_vencimento_padrao = dia_vencimento_padrao;
  const res = await api.post<Plan>('/financeiro/planos', payload);
  return res.data;
}

export async function listMembers() {
  const res = await api.get<Member[]>("/membros");
  return res.data;
}

export async function listUsers() {
  const res = await api.get<User[]>("/usuarios");
  return res.data;
}

export async function updateUser(
  id: number,
  data: {
    nome?: string;
    empresa?: string;
    telefone?: string;
    cargo?: string;
    bio_area_atuacao?: string;
    role?: 'admin' | 'membro';
  }
) {
  const res = await api.patch<User>(`/usuarios/${id}`, data);
  return res.data;
}

export async function setUserActive(id: number, ativo: boolean) {
  const res = await api.patch<User>(`/usuarios/${id}/ativo`, { ativo });
  return res.data;
}

export default api;